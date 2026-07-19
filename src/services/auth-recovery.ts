import { normalizeLoginRedirect } from "@/services/auth-session";

type EnvSource = Record<string, string | undefined>;

export function getAuthRecoveryRedirectUrl(
  redirectToValue: FormDataEntryValue | string | null | undefined,
  env: EnvSource = process.env,
) {
  const redirectTo = normalizeLoginRedirect(redirectToValue ?? null);
  const continuation = encodeAuthRecoveryContinuation(redirectTo);
  const url = new URL(
    `/auth/callback/recovery/${continuation}`,
    getTrustedAuthSiteUrl(env),
  );

  return url.toString();
}

export function encodeAuthRecoveryContinuation(redirectToValue: string) {
  const redirectTo = normalizeLoginRedirect(redirectToValue);
  return Buffer.from(redirectTo, "utf8").toString("base64url");
}

export function decodeAuthRecoveryContinuation(value: string | null | undefined) {
  if (!value) return "/";

  try {
    return normalizeLoginRedirect(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return "/";
  }
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
