import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";

type EnvSource = Record<string, string | undefined>;

export type SupabaseReadConfig =
  | {
      enabled: true;
      url: string;
      key: string;
      reason: string;
    }
  | {
      enabled: false;
      reason: string;
    };

export type SupabaseSelectOptions = {
  select?: string;
  query?: Record<string, string>;
};

export type SupabaseReadonlyClient = {
  selectRows: <TRow>(
    tableName: string,
    options?: SupabaseSelectOptions,
  ) => Promise<TRow[]>;
};

export type HostedStagingSessionReadonlyResult =
  | {
      enabled: true;
      client: SupabaseReadonlyClient;
      reason: string;
    }
  | {
      enabled: false;
      reason: string;
    };

export function getSupabaseReadConfig(env: EnvSource = process.env): SupabaseReadConfig {
  if (env.MYMEDLIFE_DATA_SOURCE !== "supabase") {
    return {
      enabled: false,
      reason: "Using mock data because MYMEDLIFE_DATA_SOURCE is not set to supabase.",
    };
  }

  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS !== "true") {
    return {
      enabled: false,
      reason:
        "Using mock data because local Supabase reads were not explicitly enabled.",
    };
  }

  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_READONLY_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      enabled: false,
      reason: "Using mock data because Supabase URL or read key is missing.",
    };
  }

  if (!isLocalSupabaseUrl(url)) {
    return {
      enabled: false,
      reason:
        "Using mock data because Goal 8 only allows localhost Supabase reads.",
    };
  }

  return {
    enabled: true,
    url: stripTrailingSlash(url),
    key,
    reason: "Reading local Supabase data in read-only mode.",
  };
}

export function createSupabaseReadonlyClient(
  config: Extract<SupabaseReadConfig, { enabled: true }>,
  fetchFn: typeof fetch = fetch,
): SupabaseReadonlyClient {
  return {
    async selectRows<TRow>(
      tableName: string,
      options: SupabaseSelectOptions = {},
    ): Promise<TRow[]> {
      const url = new URL(`${config.url}/rest/v1/${tableName}`);
      url.searchParams.set("select", options.select ?? "*");

      for (const [key, value] of Object.entries(options.query ?? {})) {
        url.searchParams.set(key, value);
      }

      const response = await fetchFn(url, {
        method: "GET",
        headers: {
          apikey: config.key,
          authorization: `Bearer ${config.key}`,
          "accept-profile": "app",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          `Supabase read failed for ${tableName}: ${response.status} ${detail}`,
        );
      }

      return (await response.json()) as TRow[];
    },
  };
}

export function createSupabaseQueryReadonlyClient(
  client: NonNullable<
    Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"]
  >,
): SupabaseReadonlyClient {
  return {
    async selectRows<TRow>(
      tableName: string,
      options: SupabaseSelectOptions = {},
    ): Promise<TRow[]> {
      let query = client.schema("app").from(tableName).select(options.select ?? "*");
      const order = parseOrder(options.query?.order);

      if (order) {
        query = query.order(order.column, {
          ascending: order.ascending,
          nullsFirst: order.nullsFirst,
        });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(
          `Supabase query read failed for ${tableName}: ${error.message}`,
        );
      }

      return (data ?? []) as TRow[];
    },
  };
}

export async function getHostedStagingSessionReadonlyClient(
  env: EnvSource = process.env,
): Promise<HostedStagingSessionReadonlyResult> {
  const { client, config } = await createLocalSupabaseServerClient(env);

  if (!client || !config.isHostedStaging) {
    return {
      enabled: false,
      reason: config.reason,
    };
  }

  const session = await getAuthSessionState(client, config);

  if (session.status !== "signed_in") {
    return {
      enabled: false,
      reason: session.message,
    };
  }

  return {
    enabled: true,
    client: createSupabaseQueryReadonlyClient(client),
    reason: "Reading hosted staging Supabase data for the signed-in session.",
  };
}

function isLocalSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "::1"
    );
  } catch {
    return false;
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function parseOrder(
  value: string | undefined,
): { column: string; ascending: boolean; nullsFirst?: boolean } | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const [column, direction = "asc", nulls] = trimmed.split(".");

  if (!column) {
    return null;
  }

  return {
    column,
    ascending: direction !== "desc",
    nullsFirst:
      nulls === "nullsfirst" ? true : nulls === "nullslast" ? false : undefined,
  };
}
