import { normalizeLoginRedirect } from "@/services/auth-session";

export type SupabaseEmailOtpType =
  | "invite"
  | "recovery"
  | "magiclink"
  | "signup"
  | "email_change";

type AuthCallbackRedirectInput = {
  next: string | null;
  redirectTo: string | null;
  type: string | null;
};

export function isSupabaseEmailOtpType(
  value: string | null | undefined,
): value is SupabaseEmailOtpType {
  return (
    value === "invite" ||
    value === "recovery" ||
    value === "magiclink" ||
    value === "signup" ||
    value === "email_change"
  );
}

export function buildAuthCallbackRedirectPath(
  input: AuthCallbackRedirectInput,
): string {
  const redirectTo = normalizeLoginRedirect(input.redirectTo);
  const requiresPasswordUpdate =
    input.next === "update-password" ||
    input.type === "invite" ||
    input.type === "recovery";

  if (requiresPasswordUpdate) {
    const searchParams = new URLSearchParams();
    searchParams.set("redirectTo", redirectTo);

    return `/auth/set-password?${searchParams.toString()}`;
  }

  const searchParams = new URLSearchParams();
  searchParams.set("redirectTo", redirectTo);

  return `/login?${searchParams.toString()}`;
}
