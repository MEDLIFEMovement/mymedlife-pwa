type EnvSource = Record<string, string | undefined>;

export type SupabaseAuthMode =
  | "disabled"
  | "local_supabase"
  | "staging_supabase";

export type SupabaseAuthEnvironment = "local" | "staging";
export type SupabaseReviewEnvironment = SupabaseAuthEnvironment | "disabled";

export type SupabaseAuthConfig =
  | {
      enabled: true;
      mode: "local_supabase" | "staging_supabase";
      environment?: SupabaseAuthEnvironment;
      reviewEnvironment?: SupabaseAuthEnvironment;
      url: string;
      anonKey: string;
      isLocalOnly: boolean;
      isHostedStaging?: boolean;
      reason: string;
    }
  | {
      enabled: false;
      mode: SupabaseAuthMode;
      environment?: SupabaseAuthEnvironment;
      reviewEnvironment?: SupabaseReviewEnvironment;
      isLocalOnly: boolean;
      isHostedStaging?: boolean;
      reason: string;
    };

const stagingSupabaseProjectRef = "rceupryepjgkdeqgxzrc";
const productionSupabaseProjectRef = "fnlhontvvprwgooevzdl";
const stagingAppHost = "staging.mymedlife.org";
const productionAppHost = "www.mymedlife.org";
const blockedHostedWriteFlags = [
  "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES",
  "MYMEDLIFE_ENABLE_ACTION_START_WRITE",
  "MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE",
  "MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE",
  "MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE",
  "MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE",
  "MYMEDLIFE_ENABLE_COACH_DECISION_WRITE",
  "MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE",
  "MYMEDLIFE_ALLOW_PROOF_UPLOADS",
] as const;

export function getSupabaseAuthConfig(
  env: EnvSource = process.env,
): SupabaseAuthConfig {
  const mode = env.MYMEDLIFE_AUTH_MODE;

  if (mode === "local_supabase") {
    return getLocalSupabaseAuthConfig(env);
  }

  if (mode === "staging_supabase") {
    return getHostedStagingSupabaseAuthConfig(env);
  }

  return disabledConfig({
    mode: "disabled",
    environment: "local",
    isLocalOnly: true,
    isHostedStaging: false,
    reason:
      "Supabase Auth is disabled because MYMEDLIFE_AUTH_MODE is not set to local_supabase or staging_supabase.",
  });
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

export function isReviewSupabaseAuthMode(
  value: string | undefined,
): value is Extract<SupabaseAuthMode, "local_supabase" | "staging_supabase"> {
  return value === "local_supabase" || value === "staging_supabase";
}

function getLocalSupabaseAuthConfig(env: EnvSource): SupabaseAuthConfig {
  const url = readSupabaseUrl(env);
  const anonKey = readSupabaseBrowserKey(env);

  if (!url || !anonKey) {
    return disabledConfig({
      mode: "local_supabase",
      environment: "local",
      isLocalOnly: true,
      isHostedStaging: false,
      reason:
        "Local Supabase Auth is disabled because the local URL or anon key is missing.",
    });
  }

  if (!isLocalSupabaseUrl(url)) {
    return disabledConfig({
      mode: "local_supabase",
      environment: "local",
      isLocalOnly: true,
      isHostedStaging: false,
      reason:
        "Local Supabase Auth refuses non-localhost URLs until production auth is explicitly approved.",
    });
  }

  return {
    enabled: true,
    mode: "local_supabase",
    environment: "local",
    reviewEnvironment: "local",
    url: stripTrailingSlash(url),
    anonKey,
    isLocalOnly: true,
    isHostedStaging: false,
    reason: "Local Supabase Auth is enabled for localhost sign-in testing.",
  };
}

function getHostedStagingSupabaseAuthConfig(env: EnvSource): SupabaseAuthConfig {
  const url = readSupabaseUrl(env);
  const anonKey = readSupabaseBrowserKey(env);
  const siteUrl = readSiteUrl(env);

  if (!url || !anonKey) {
    return disabledConfig({
      mode: "staging_supabase",
      environment: "staging",
      isLocalOnly: false,
      isHostedStaging: true,
      reason:
        "Hosted staging Supabase Auth is disabled because the staging URL or browser key is missing.",
    });
  }

  if (siteUrl && isProductionSiteUrl(siteUrl)) {
    return disabledConfig({
      mode: "staging_supabase",
      environment: "staging",
      isLocalOnly: false,
      isHostedStaging: true,
      reason:
        "Hosted staging Supabase Auth refuses the production site URL until production auth is explicitly approved.",
    });
  }

  if (!siteUrl || !isHostedStagingSiteUrl(siteUrl)) {
    return disabledConfig({
      mode: "staging_supabase",
      environment: "staging",
      isLocalOnly: false,
      isHostedStaging: true,
      reason:
        "Hosted staging Supabase Auth only runs when NEXT_PUBLIC_SITE_URL resolves to https://staging.mymedlife.org.",
    });
  }

  if (!isHostedStagingSupabaseUrl(url)) {
    const projectRef = getSupabaseProjectRef(url);

    return disabledConfig({
      mode: "staging_supabase",
      environment: "staging",
      isLocalOnly: false,
      isHostedStaging: true,
      reason:
        projectRef === productionSupabaseProjectRef
          ? "Hosted staging Supabase Auth refuses the production Supabase project until production auth is explicitly approved."
          : `Hosted staging Supabase Auth only allows the staging Supabase project ${stagingSupabaseProjectRef}.`,
    });
  }

  const enabledWriteFlags = getEnabledHostedWriteFlags(env);

  if (enabledWriteFlags.length > 0) {
    return disabledConfig({
      mode: "staging_supabase",
      environment: "staging",
      isLocalOnly: false,
      isHostedStaging: true,
      reason: `Hosted staging Supabase Auth stays disabled until write and upload flags are off. Turn off: ${enabledWriteFlags.join(", ")}.`,
    });
  }

  return {
    enabled: true,
    mode: "staging_supabase",
    environment: "staging",
    reviewEnvironment: "staging",
    url: stripTrailingSlash(url),
    anonKey,
    isLocalOnly: false,
    isHostedStaging: true,
    reason:
      "Hosted staging Supabase Auth is enabled only for staging.mymedlife.org against the approved staging Supabase project.",
  };
}

function readSupabaseUrl(env: EnvSource): string | undefined {
  return env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
}

function readSupabaseBrowserKey(env: EnvSource): string | undefined {
  return (
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    env.SUPABASE_ANON_KEY
  );
}

function readSiteUrl(env: EnvSource): string | null {
  return normalizeUrlish(
    env.NEXT_PUBLIC_SITE_URL ??
      env.SITE_URL ??
      env.NEXT_PUBLIC_VERCEL_URL ??
      env.VERCEL_URL,
  );
}

function normalizeUrlish(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  try {
    return stripTrailingSlash(new URL(withProtocol).toString());
  } catch {
    return null;
  }
}

function isHostedStagingSiteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === stagingAppHost;
  } catch {
    return false;
  }
}

function isProductionSiteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === productionAppHost;
  } catch {
    return false;
  }
}

function isHostedStagingSupabaseUrl(url: string): boolean {
  return getSupabaseProjectRef(url) === stagingSupabaseProjectRef;
}

function getSupabaseProjectRef(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (!parsed.hostname.endsWith(".supabase.co")) {
      return null;
    }

    return parsed.hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

function getEnabledHostedWriteFlags(env: EnvSource): string[] {
  return blockedHostedWriteFlags.filter((flag) => env[flag] === "true");
}

function disabledConfig(config: {
  mode: SupabaseAuthMode;
  environment: SupabaseAuthEnvironment;
  isLocalOnly: boolean;
  isHostedStaging: boolean;
  reason: string;
}): Extract<SupabaseAuthConfig, { enabled: false }> {
  return {
    enabled: false,
    mode: config.mode,
    environment: config.environment,
    reviewEnvironment:
      config.mode === "disabled" ? "disabled" : config.environment,
    isLocalOnly: config.isLocalOnly,
    isHostedStaging: config.isHostedStaging,
    reason: config.reason,
  };
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
