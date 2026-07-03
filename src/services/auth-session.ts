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
  isHostedStaging: boolean;
  environment: "local" | "staging" | "production";
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
    isHostedStaging: config.isHostedStaging,
    environment: config.environment,
    message: config.reason,
    user: null,
  };
}

export async function getAuthSessionState(
  authReader: AuthReader,
  config?: SupabaseAuthConfig,
): Promise<AuthSessionState> {
  const copy = getAuthSessionCopy(config);
  const result = await authReader.auth.getUser();

  if (result.error) {
    if (isMissingSessionError(result.error)) {
      return {
        status: "signed_out",
        isLocalOnly: copy.isLocalOnly,
        isHostedStaging: copy.isHostedStaging,
        environment: copy.environment,
        message: copy.signedOutMessage,
        user: null,
      };
    }

    return {
      status: "error",
      isLocalOnly: copy.isLocalOnly,
      isHostedStaging: copy.isHostedStaging,
      environment: copy.environment,
      message: `${copy.authLabel} session check failed: ${result.error.message}`,
      user: null,
    };
  }

  if (!result.data.user?.email) {
    return {
      status: "signed_out",
      isLocalOnly: copy.isLocalOnly,
      isHostedStaging: copy.isHostedStaging,
      environment: copy.environment,
      message: copy.signedOutMessage,
      user: null,
    };
  }

  return {
    status: "signed_in",
    isLocalOnly: copy.isLocalOnly,
    isHostedStaging: copy.isHostedStaging,
    environment: copy.environment,
    message: copy.signedInMessage,
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

function getAuthSessionCopy(config?: SupabaseAuthConfig) {
  if (config?.isHostedStaging) {
    return {
      authLabel: "Hosted staging Supabase Auth",
      signedOutMessage: "No hosted staging Supabase Auth session is active.",
      signedInMessage: "Hosted staging Supabase Auth session is active.",
      isLocalOnly: false,
      isHostedStaging: true,
      environment: "staging" as const,
    };
  }

  if (config?.environment === "production" && !config.isLocalOnly) {
    return {
      authLabel: "Hosted production Supabase Auth",
      signedOutMessage: "No hosted production Supabase Auth session is active.",
      signedInMessage: "Hosted production Supabase Auth session is active.",
      isLocalOnly: false,
      isHostedStaging: false,
      environment: "production" as const,
    };
  }

  return {
    authLabel: "Local Supabase Auth",
    signedOutMessage: "No local Supabase Auth session is active.",
    signedInMessage: "Local Supabase Auth session is active.",
    isLocalOnly: true,
    isHostedStaging: false,
    environment: "local" as const,
  };
}
