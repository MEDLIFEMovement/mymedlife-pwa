type EnvSource = Record<string, string | undefined>;

export type SupabaseAuthConfig =
  | {
      enabled: true;
      mode: "local_supabase";
      url: string;
      anonKey: string;
      isLocalOnly: true;
      reason: string;
    }
  | {
      enabled: false;
      mode: "disabled" | "local_supabase";
      isLocalOnly: true;
      reason: string;
    };

export function getSupabaseAuthConfig(
  env: EnvSource = process.env,
): SupabaseAuthConfig {
  const mode = env.MYMEDLIFE_AUTH_MODE;

  if (mode !== "local_supabase") {
    return {
      enabled: false,
      mode: "disabled",
      isLocalOnly: true,
      reason:
        "Supabase Auth is disabled because MYMEDLIFE_AUTH_MODE is not set to local_supabase.",
    };
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      enabled: false,
      mode,
      isLocalOnly: true,
      reason:
        "Local Supabase Auth is disabled because the local URL or anon key is missing.",
    };
  }

  if (!isLocalSupabaseUrl(url)) {
    return {
      enabled: false,
      mode,
      isLocalOnly: true,
      reason:
        "Local Supabase Auth refuses non-localhost URLs until production auth is explicitly approved.",
    };
  }

  return {
    enabled: true,
    mode,
    url: stripTrailingSlash(url),
    anonKey,
    isLocalOnly: true,
    reason: "Local Supabase Auth is enabled for localhost sign-in testing.",
  };
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

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
