import { normalizeLoginRedirect } from "@/services/auth-session";

type EnvSource = Record<string, string | undefined>;

export function getAuthRecoveryRedirectUrl(
  redirectToValue: FormDataEntryValue | string | null | undefined,
  env: EnvSource = process.env,
) {
  const redirectTo = normalizeLoginRedirect(redirectToValue ?? null);
  const url = new URL("/auth/callback", getTrustedAuthSiteUrl(env));

  url.searchParams.set("type", "recovery");
  url.searchParams.set("next", "update-password");
  url.searchParams.set("redirectTo", redirectTo);

  return url.toString();
}

function getTrustedAuthSiteUrl(env: EnvSource) {
  const configuredSiteUrl = env.NEXT_PUBLIC_SITE_URL ?? env.SITE_URL;

  if (configuredSiteUrl) {
    try {
      return new URL(configuredSiteUrl).origin;
    } catch {
      // Fall through to the environment-specific trusted default.
    }
  }

  if (env.MYMEDLIFE_AUTH_MODE === "production_supabase") {
    return "https://www.mymedlife.org";
  }

  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") {
    return "https://staging.mymedlife.org";
  }

  return "http://127.0.0.1:3000";
}
