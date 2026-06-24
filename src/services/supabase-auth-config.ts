type EnvSource = Record<string, string | undefined>;

export type SupabaseReviewMode = "local_supabase" | "staging_supabase";

export type SupabaseAuthConfig =
  | {
      enabled: true;
      mode: SupabaseReviewMode;
      reviewEnvironment: "local" | "staging";
      url: string;
      anonKey: string;
      isLocalOnly: boolean;
      reason: string;
    }
  | {
      enabled: false;
      mode: "disabled" | SupabaseReviewMode;
      reviewEnvironment: "disabled" | "local" | "staging";
      isLocalOnly: boolean;
      reason: string;
    };

export function getSupabaseAuthConfig(
  env: EnvSource = process.env,
): SupabaseAuthConfig {
  const mode = env.MYMEDLIFE_AUTH_MODE;

  if (mode !== "local_supabase") {
    if (mode === "staging_supabase") {
      return getStagingSupabaseAuthConfig(env);
    }

    return {
      enabled: false,
      mode: "disabled",
      reviewEnvironment: "disabled",
      isLocalOnly: true,
      reason:
        "Supabase Auth is disabled because MYMEDLIFE_AUTH_MODE is not set to local_supabase or staging_supabase.",
    };
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      enabled: false,
      mode,
      reviewEnvironment: "local",
      isLocalOnly: true,
      reason:
        "Local Supabase Auth is disabled because the local URL or anon key is missing.",
    };
  }

  if (!isLocalSupabaseUrl(url)) {
    return {
      enabled: false,
      mode,
      reviewEnvironment: "local",
      isLocalOnly: true,
      reason:
        "Local Supabase Auth refuses non-localhost URLs until production auth is explicitly approved.",
    };
  }

  return {
    enabled: true,
    mode,
    reviewEnvironment: "local",
    url: stripTrailingSlash(url),
    anonKey,
    isLocalOnly: true,
    reason: "Local Supabase Auth is enabled for localhost sign-in testing.",
  };
}

export function isReviewSupabaseAuthMode(
  value: string | undefined,
): value is SupabaseReviewMode {
  return value === "local_supabase" || value === "staging_supabase";
}

export function isLocalSupabaseUrl(url: string): boolean {
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

export function isHostedSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !isLocalSupabaseUrl(url);
  } catch {
    return false;
  }
}

function getStagingSupabaseAuthConfig(
  env: EnvSource,
): SupabaseAuthConfig {
  const mode: SupabaseReviewMode = "staging_supabase";
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY;

  if (env.MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH !== "true") {
    return {
      enabled: false,
      mode,
      reviewEnvironment: "staging",
      isLocalOnly: false,
      reason:
        "Hosted staging Supabase Auth is disabled until MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH=true is set for an approved staging review.",
    };
  }

  if (!url || !anonKey) {
    return {
      enabled: false,
      mode,
      reviewEnvironment: "staging",
      isLocalOnly: false,
      reason:
        "Hosted staging Supabase Auth is disabled because the staging URL or anon key is missing.",
    };
  }

  if (isLocalSupabaseUrl(url)) {
    return {
      enabled: false,
      mode,
      reviewEnvironment: "staging",
      isLocalOnly: false,
      reason:
        "Hosted staging Supabase Auth requires a hosted Supabase URL, not localhost.",
    };
  }

  if (!isHostedSupabaseUrl(url)) {
    return {
      enabled: false,
      mode,
      reviewEnvironment: "staging",
      isLocalOnly: false,
      reason:
        "Hosted staging Supabase Auth requires an HTTPS hosted Supabase URL.",
    };
  }

  return {
    enabled: true,
    mode,
    reviewEnvironment: "staging",
    url: stripTrailingSlash(url),
    anonKey,
    isLocalOnly: false,
    reason:
      "Hosted staging Supabase Auth is enabled for approved pilot review.",
  };
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
