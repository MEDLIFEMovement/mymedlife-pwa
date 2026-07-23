import { normalizeLoginRedirect } from "@/services/auth-session";

export type SupabaseEmailOtpType =
  | "invite"
  | "recovery"
  | "magiclink"
  | "signup"
  | "email_change";

export type AuthCallbackFailureCode =
  | "auth_unavailable"
  | "invite_invalid_or_expired"
  | "recovery_invalid_or_expired"
  | "callback_invalid_or_expired";

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

export function buildAuthCallbackFailureRedirectPath(
  input: AuthCallbackRedirectInput,
  code: AuthCallbackFailureCode,
): string {
  const redirectTo = normalizeLoginRedirect(input.redirectTo);
  const searchParams = new URLSearchParams();
  searchParams.set("redirectTo", redirectTo);

  if (code === "recovery_invalid_or_expired") {
    searchParams.set("recoveryError", code);
    return `/auth/forgot-password?${searchParams.toString()}`;
  }

  searchParams.set("authError", code);
  return `/login?${searchParams.toString()}`;
}

export function getAuthCallbackFailureCode(input: {
  type: string | null;
  next: string | null;
  authAvailable: boolean;
}): AuthCallbackFailureCode {
  if (!input.authAvailable) {
    return "auth_unavailable";
  }

  if (input.type === "recovery" || input.next === "update-password") {
    return "recovery_invalid_or_expired";
  }

  if (input.type === "invite") {
    return "invite_invalid_or_expired";
  }

  return "callback_invalid_or_expired";
}

export function getAuthCallbackFailureMessage(
  code: string | null | undefined,
): string | null {
  if (code === "auth_unavailable") {
    return "Secure account access is temporarily unavailable. Try again shortly.";
  }

  if (code === "invite_invalid_or_expired") {
    return "This invitation link is invalid or has expired. Ask your myMEDLIFE administrator for a new invitation.";
  }

  if (code === "recovery_invalid_or_expired") {
    return "This password reset link is invalid or has expired. Request a new secure link.";
  }

  if (code === "callback_invalid_or_expired") {
    return "This secure sign-in link is invalid or has expired. Start again from sign in.";
  }

  return null;
}
