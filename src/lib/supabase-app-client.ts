import { createLocalSupabaseServerClient } from "@/lib/supabase-server";

type EnvSource = Record<string, string | undefined>;

export type SupabaseAppPersistence =
  | {
      mode: "supabase";
      status: "ready";
      reason: string;
      isLocalOnly: boolean;
    }
  | {
      mode: "fallback";
      status: "unavailable";
      reason: string;
      isLocalOnly: boolean;
    };

export type SupabaseAppSelectOptions = {
  select?: string;
  query?: Record<string, string>;
  order?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
};

export type SupabaseAppMutateOptions = {
  select?: string;
  query?: Record<string, string>;
  onConflict?: string;
};

export type SupabaseAppClient = {
  persistence: Extract<SupabaseAppPersistence, { mode: "supabase" }>;
  selectRows: <TRow>(
    tableName: string,
    options?: SupabaseAppSelectOptions,
  ) => Promise<TRow[]>;
  rpc: <TResult>(
    functionName: string,
    payload: Record<string, unknown>,
  ) => Promise<TResult>;
  insertRows: <TRow>(
    tableName: string,
    rows: Record<string, unknown>[],
    options?: SupabaseAppMutateOptions,
  ) => Promise<TRow[]>;
  upsertRows: <TRow>(
    tableName: string,
    rows: Record<string, unknown>[],
    options?: SupabaseAppMutateOptions,
  ) => Promise<TRow[]>;
  updateRows: <TRow>(
    tableName: string,
    values: Record<string, unknown>,
    options: SupabaseAppMutateOptions,
  ) => Promise<TRow[]>;
};

export async function createSupabaseAppClient(
  env: EnvSource = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<
  | {
      persistence: Extract<SupabaseAppPersistence, { mode: "fallback" }>;
      client: null;
    }
  | {
      persistence: Extract<SupabaseAppPersistence, { mode: "supabase" }>;
      client: SupabaseAppClient;
    }
> {
  const { client: authClient, config } = await createLocalSupabaseServerClient(env);

  if (!authClient || !config.enabled) {
    return fallbackPersistence(config.reason, config.isLocalOnly);
  }

  const sessionResult = await authClient.auth.getSession();
  const accessToken = sessionResult.data.session?.access_token;

  if (sessionResult.error || !accessToken) {
    return fallbackPersistence(
      config.isLocalOnly
        ? "No local Supabase session is active for app writes."
        : "No hosted staging reviewer session is active for app writes.",
      config.isLocalOnly,
    );
  }

  const persistence = {
    mode: "supabase",
    status: "ready",
    reason: config.isLocalOnly
      ? "Reading and writing app tables through the local Supabase auth session."
      : "Reading and writing app tables through the hosted staging reviewer session.",
    isLocalOnly: config.isLocalOnly,
  } as const;

  return {
    persistence,
    client: createRestAppClient({
      url: config.url,
      anonKey: config.anonKey,
      accessToken,
      fetchFn,
      persistence,
    }),
  };
}

function createRestAppClient(input: {
  url: string;
  anonKey: string;
  accessToken: string;
  fetchFn: typeof fetch;
  persistence: Extract<SupabaseAppPersistence, { mode: "supabase" }>;
}): SupabaseAppClient {
  const request = async <TRow>(
    method: "GET" | "POST" | "PATCH",
    tableName: string,
    options: SupabaseAppSelectOptions | SupabaseAppMutateOptions = {},
    body?: Record<string, unknown> | Record<string, unknown>[],
    prefer?: string[],
  ): Promise<TRow[]> => {
    const url = new URL(`${input.url}/rest/v1/${tableName}`);

    if ("select" in options || method === "GET") {
      url.searchParams.set("select", options.select ?? "*");
    }

    for (const [key, value] of Object.entries(options.query ?? {})) {
      url.searchParams.set(key, value);
    }

    if ("order" in options && options.order) {
      url.searchParams.set(
        "order",
        `${options.order.column}.${options.order.ascending === false ? "desc" : "asc"}`,
      );
    }

    if ("limit" in options && typeof options.limit === "number") {
      url.searchParams.set("limit", String(options.limit));
    }

    if ("onConflict" in options && options.onConflict) {
      url.searchParams.set("on_conflict", options.onConflict);
    }

    const response = await input.fetchFn(url, {
      method,
      headers: {
        ...appHeaders(input.anonKey, input.accessToken),
        ...(method !== "GET" ? { "content-type": "application/json" } : {}),
        ...(prefer && prefer.length > 0 ? { prefer: prefer.join(",") } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await safeAppError(response, tableName));
    }

    if (response.status === 204) {
      return [];
    }

    return (await response.json()) as TRow[];
  };

  return {
    persistence: input.persistence,
    selectRows<TRow>(tableName: string, options: SupabaseAppSelectOptions = {}) {
      return request<TRow>("GET", tableName, options);
    },
    async rpc<TResult>(
      functionName: string,
      payload: Record<string, unknown>,
    ): Promise<TResult> {
      const response = await input.fetchFn(`${input.url}/rest/v1/rpc/${functionName}`, {
        method: "POST",
        headers: {
          ...appHeaders(input.anonKey, input.accessToken),
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await safeAppError(response, functionName));
      }

      return (await response.json()) as TResult;
    },
    insertRows<TRow>(
      tableName: string,
      rows: Record<string, unknown>[],
      options: SupabaseAppMutateOptions = {},
    ) {
      return request<TRow>("POST", tableName, options, rows, ["return=representation"]);
    },
    upsertRows<TRow>(
      tableName: string,
      rows: Record<string, unknown>[],
      options: SupabaseAppMutateOptions = {},
    ) {
      return request<TRow>(
        "POST",
        tableName,
        options,
        rows,
        ["return=representation", "resolution=merge-duplicates"],
      );
    },
    updateRows<TRow>(
      tableName: string,
      values: Record<string, unknown>,
      options: SupabaseAppMutateOptions,
    ) {
      return request<TRow>(
        "PATCH",
        tableName,
        options,
        values,
        ["return=representation"],
      );
    },
  };
}

function fallbackPersistence(reason: string, isLocalOnly: boolean) {
  return {
    persistence: {
      mode: "fallback",
      status: "unavailable",
      reason,
      isLocalOnly,
    } as const,
    client: null,
  };
}

function appHeaders(anonKey: string, accessToken: string): Record<string, string> {
  return {
    apikey: anonKey,
    authorization: `Bearer ${accessToken}`,
    "accept-profile": "app",
    "content-profile": "app",
  };
}

async function safeAppError(response: Response, target: string): Promise<string> {
  const body = await response.text();
  const redacted = body
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/eyJ[A-Za-z0-9._-]+/g, "[redacted-token]");

  return `Supabase app write failed for ${target}: ${response.status} ${redacted}`;
}
