import type { SupabaseAuthConfig } from "@/services/supabase-auth-config";

export type AuthSessionStatus =
  | "disabled"
  | "signed_out"
  | "signed_in"
  | "error";

export type AuthenticatedUser = {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
    display_name?: string;
  };
};

export type AuthReader = {
  auth: {
    getUser: () => Promise<{
      data: { user: AuthenticatedUser | null };
      error: { message: string; name?: string } | null;
    }>;
  };
};

export type AuthSessionState = {
  status: AuthSessionStatus;
  isLocalOnly: boolean;
  message: string;
  user:
    | {
        id: string;
        email: string;
        displayName: string;
      }
    | null;
};

export function getDisabledAuthSessionState(
  config: SupabaseAuthConfig,
): AuthSessionState {
  return {
    status: "disabled",
    isLocalOnly: config.isLocalOnly,
    message: config.reason,
    user: null,
  };
}

export async function getAuthSessionState(
  authReader: AuthReader,
  options: {
    isLocalOnly?: boolean;
    sessionLabel?: string;
  } = {},
): Promise<AuthSessionState> {
  const isLocalOnly = options.isLocalOnly ?? true;
  const sessionLabel =
    options.sessionLabel ??
    (isLocalOnly ? "local Supabase Auth" : "hosted staging Supabase Auth");
  const result = await authReader.auth.getUser();

  if (result.error) {
    if (isMissingSessionError(result.error)) {
      return {
        status: "signed_out",
        isLocalOnly,
        message: `No ${sessionLabel} session is active.`,
        user: null,
      };
    }

    return {
      status: "error",
      isLocalOnly,
      message: `${sessionLabel} session check failed: ${result.error.message}`,
      user: null,
    };
  }

  if (!result.data.user?.email) {
    return {
      status: "signed_out",
      isLocalOnly,
      message: `No ${sessionLabel} session is active.`,
      user: null,
    };
  }

  return {
    status: "signed_in",
    isLocalOnly,
    message: `${sessionLabel} session is active.`,
    user: {
      id: result.data.user.id,
      email: result.data.user.email,
      displayName: getAuthDisplayName(result.data.user),
    },
  };
}

export function getAuthDisplayName(user: AuthenticatedUser): string {
  return (
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Local user"
  );
}

export function normalizeLoginRedirect(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    return "/";
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }

  if (trimmed.includes("\n") || trimmed.includes("\r")) {
    return "/";
  }

  if (trimmed === "/login") {
    return "/";
  }

  return trimmed;
}

function isMissingSessionError(error: { message: string; name?: string }): boolean {
  const message = error.message.toLowerCase();
  const name = error.name?.toLowerCase() ?? "";

  return (
    name.includes("authsessionmissing") ||
    message.includes("auth session missing") ||
    message.includes("session_not_found") ||
    message.includes("no current user")
  );
}
