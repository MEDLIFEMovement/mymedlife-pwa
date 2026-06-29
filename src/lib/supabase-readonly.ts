import { createLocalSupabaseServerClient } from "@/lib/supabase-server";

type EnvSource = Record<string, string | undefined>;
type CreateServerClient = typeof createLocalSupabaseServerClient;

export type SupabaseReadConfig =
  | {
      enabled: true;
      url: string;
      key: string;
      reason: string;
      accessToken?: string;
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

export type SupabaseReadonlyAccess =
  | {
      enabled: true;
      client: SupabaseReadonlyClient;
      reason: string;
      isLocalOnly: boolean;
      mode: "local_service_role" | "auth_session";
    }
  | {
      enabled: false;
      reason: string;
      isLocalOnly: boolean;
      mode: "mock_fallback";
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

export async function createSupabaseReadonlyAccess(
  env: EnvSource = process.env,
  fetchFn: typeof fetch = fetch,
  options: {
    createServerClient?: CreateServerClient;
  } = {},
): Promise<SupabaseReadonlyAccess> {
  const config = getSupabaseReadConfig(env);

  if (config.enabled) {
    return {
      enabled: true,
      client: createSupabaseReadonlyClient(config, fetchFn),
      reason: config.reason,
      isLocalOnly: true,
      mode: "local_service_role",
    };
  }

  if (env.MYMEDLIFE_DATA_SOURCE !== "supabase") {
    return {
      enabled: false,
      reason: config.reason,
      isLocalOnly: true,
      mode: "mock_fallback",
    };
  }

  const createServerClient = options.createServerClient ?? createLocalSupabaseServerClient;
  const { client: authClient, config: authConfig } = await createServerClient(env);

  if (!authClient || !authConfig.enabled) {
    return {
      enabled: false,
      reason: authConfig.reason,
      isLocalOnly: authConfig.isLocalOnly,
      mode: "mock_fallback",
    };
  }

  const sessionResult = await authClient.auth.getSession();
  const accessToken = sessionResult.data.session?.access_token;

  if (sessionResult.error || !accessToken) {
    return {
      enabled: false,
      reason: authConfig.isLocalOnly
        ? "Using mock data because no signed-in local Supabase session is active."
        : "Using mock data because no signed-in hosted staging reviewer session is active.",
      isLocalOnly: authConfig.isLocalOnly,
      mode: "mock_fallback",
    };
  }

  const reason = authConfig.isLocalOnly
    ? "Reading local Supabase data with the signed-in auth session."
    : "Reading hosted staging Supabase data with the signed-in reviewer session.";

  return {
    enabled: true,
    client: createSupabaseReadonlyClient(
      {
        enabled: true,
        url: authConfig.url,
        key: authConfig.anonKey,
        accessToken,
        reason,
      },
      fetchFn,
    ),
    reason,
    isLocalOnly: authConfig.isLocalOnly,
    mode: "auth_session",
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
          authorization: `Bearer ${config.accessToken ?? config.key}`,
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
