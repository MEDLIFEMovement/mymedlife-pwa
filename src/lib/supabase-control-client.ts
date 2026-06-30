import { createLocalSupabaseServerClient } from "@/lib/supabase-server";

type EnvSource = Record<string, string | undefined>;

export type SupabaseControlPersistence =
  | {
      mode: "supabase";
      status: "ready";
      requested?: true;
      availability?: "ready";
      reason: string;
    }
  | {
      mode: "memory";
      status: "fallback";
      requested?: boolean;
      availability?: "disabled" | "unavailable" | "missing_session";
      reason: string;
    };

export type SupabaseControlSelectOptions = {
  select?: string;
  query?: Record<string, string>;
  order?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
};

export type SupabaseControlClient = {
  persistence: Extract<SupabaseControlPersistence, { mode: "supabase" }>;
  selectRows: <TRow>(
    tableName: string,
    options?: SupabaseControlSelectOptions,
  ) => Promise<TRow[]>;
  rpc: <TResult>(
    functionName: string,
    payload: Record<string, unknown>,
  ) => Promise<TResult>;
};

export function isSupabaseControlLayerRequested(
  env: EnvSource = process.env,
): boolean {
  return env.MYMEDLIFE_CONTROL_LAYER_SOURCE === "supabase";
}

export async function createSupabaseControlClient(
  env: EnvSource = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<
  | {
      persistence: Extract<SupabaseControlPersistence, { mode: "memory" }>;
      client: null;
    }
  | {
      persistence: Extract<SupabaseControlPersistence, { mode: "supabase" }>;
      client: SupabaseControlClient;
    }
> {
  if (!isSupabaseControlLayerRequested(env)) {
    return memoryPersistence(
      false,
      "disabled",
      "Using in-memory admin controls because MYMEDLIFE_CONTROL_LAYER_SOURCE is not set to supabase.",
    );
  }

  const { client: authClient, config } = await createLocalSupabaseServerClient(env);

  if (!authClient || !config.enabled) {
    return memoryPersistence(true, "unavailable", config.reason);
  }

  const sessionResult = await authClient.auth.getSession();
  const accessToken = sessionResult.data.session?.access_token;

  if (sessionResult.error || !accessToken) {
    return memoryPersistence(
      true,
      "missing_session",
      "Using in-memory admin controls because no Supabase session token is active.",
    );
  }

  const persistence = {
    mode: "supabase",
    status: "ready",
    requested: true,
    availability: "ready",
    reason:
      "Reading and writing feature flags, theme snapshots, approvals, step-up sessions, and audit rows from Supabase.",
  } as const;

  const restClient: SupabaseControlClient = {
    persistence,
    async selectRows<TRow>(
      tableName: string,
      options: SupabaseControlSelectOptions = {},
    ): Promise<TRow[]> {
      const url = new URL(`${config.url}/rest/v1/${tableName}`);
      url.searchParams.set("select", options.select ?? "*");

      for (const [key, value] of Object.entries(options.query ?? {})) {
        url.searchParams.set(key, value);
      }

      if (options.order) {
        url.searchParams.set(
          "order",
          `${options.order.column}.${options.order.ascending === false ? "desc" : "asc"}`,
        );
      }

      if (typeof options.limit === "number") {
        url.searchParams.set("limit", String(options.limit));
      }

      const response = await fetchFn(url, {
        method: "GET",
        headers: controlHeaders(config.anonKey, accessToken),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await safeControlError(response, tableName));
      }

      return (await response.json()) as TRow[];
    },
    async rpc<TResult>(
      functionName: string,
      payload: Record<string, unknown>,
    ): Promise<TResult> {
      const response = await fetchFn(`${config.url}/rest/v1/rpc/${functionName}`, {
        method: "POST",
        headers: {
          ...controlHeaders(config.anonKey, accessToken),
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await safeControlError(response, functionName));
      }

      return (await response.json()) as TResult;
    },
  };

  return { persistence, client: restClient };
}

function memoryPersistence(
  requested: boolean,
  availability: "disabled" | "unavailable" | "missing_session",
  reason: string,
) {
  return {
    persistence: {
      mode: "memory",
      status: "fallback",
      requested,
      availability,
      reason,
    } as const,
    client: null,
  };
}

function controlHeaders(anonKey: string, accessToken: string): Record<string, string> {
  return {
    apikey: anonKey,
    authorization: `Bearer ${accessToken}`,
    "accept-profile": "app",
    "content-profile": "app",
  };
}

async function safeControlError(
  response: Response,
  target: string,
): Promise<string> {
  const body = await response.text();
  const redacted = body
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/eyJ[A-Za-z0-9._-]+/g, "[redacted-token]");

  return `Supabase control layer failed for ${target}: ${response.status} ${redacted}`;
}
