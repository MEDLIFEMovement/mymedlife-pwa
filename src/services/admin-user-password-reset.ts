import { createClient } from "@supabase/supabase-js";

import type { AuthSessionState } from "@/services/auth-session";
import { getAuthRecoveryRedirectUrl } from "@/services/auth-recovery";
import { getAdminUserLifecycleConfig } from "@/services/admin-user-lifecycle";

export type AdminUserPasswordResetConfig = {
  enabled: boolean;
  environment: "local" | "staging" | "production";
  reason: string;
  redirectTo: string;
};

export type AdminUserPasswordResetResult =
  | {
      success: true;
      code: "password_reset_sent";
      userId: string;
      email: string;
      auditLogId: string;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code:
        | "reset_disabled"
        | "missing_auth"
        | "permission_denied"
        | "confirmation_required"
        | "reason_required"
        | "target_not_found"
        | "server_error";
      plainEnglishMessage: string;
    };

export type AdminUserPasswordResetClient = {
  auth: {
    admin: {
      getUserById: (userId: string) => Promise<{
        data: { user: { id: string; email?: string | null } | null };
        error: { message?: string } | null;
      }>;
    };
    resetPasswordForEmail: (
      email: string,
      options: { redirectTo: string },
    ) => Promise<{
      data: unknown;
      error: { message?: string } | null;
    }>;
  };
  schema: (schemaName: "app") => {
    from: (tableName: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => Promise<{
            data: Array<{ role_key: string }> | null;
            error: { message?: string } | null;
          }>;
        };
      };
      insert: (row: Record<string, unknown>) => {
        select: (columns: string) => {
          single: () => Promise<{
            data: { id: string } | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  };
};

export function getAdminUserPasswordResetConfig(
  env: Record<string, string | undefined> = process.env,
): AdminUserPasswordResetConfig {
  const lifecycleConfig = getAdminUserLifecycleConfig(env);
  const environment = lifecycleConfig.environment;
  const redirectTo = getPasswordResetRedirectUrl(env);
  const enabled = env.MYMEDLIFE_ENABLE_ADMIN_PASSWORD_RESET === "true";

  if (!enabled) {
    return {
      enabled: false,
      environment,
      redirectTo,
      reason: "Password reset emails are disabled by configuration.",
    };
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      enabled: false,
      environment,
      redirectTo,
      reason: "Password reset emails are disabled because the server-only Supabase service-role key is missing.",
    };
  }

  const allowFlag = getPasswordResetApprovalFlag(environment, env);
  if (allowFlag !== "true") {
    return {
      enabled: false,
      environment,
      redirectTo,
      reason: `${environment[0].toUpperCase()}${environment.slice(1)} password reset emails are disabled until the explicit password-reset approval flag is enabled.`,
    };
  }

  return {
    enabled: true,
    environment,
    redirectTo,
    reason: `Server-side password reset emails are enabled for ${environment}. The selected user receives a Supabase recovery email; admins never see or set the password.`,
  };
}

export function createAdminUserPasswordResetClient(
  env: Record<string, string | undefined> = process.env,
): AdminUserPasswordResetClient | null {
  const config = getAdminUserPasswordResetConfig(env);
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!config.enabled || !url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as unknown as AdminUserPasswordResetClient;
}

export function isAuthenticatedPasswordResetSession(
  session: AuthSessionState,
): boolean {
  return session.status === "signed_in" && Boolean(session.user?.id);
}

function getPasswordResetRedirectUrl(
  env: Record<string, string | undefined>,
) {
  const recoveryEnv = env.VERCEL_URL && !env.NEXT_PUBLIC_SITE_URL && !env.SITE_URL
    ? { ...env, SITE_URL: `https://${env.VERCEL_URL}` }
    : env;

  return getAuthRecoveryRedirectUrl("/admin/users", recoveryEnv);
}

function getPasswordResetApprovalFlag(
  environment: AdminUserPasswordResetConfig["environment"],
  env: Record<string, string | undefined>,
) {
  if (environment === "production") return env.MYMEDLIFE_ALLOW_PRODUCTION_ADMIN_PASSWORD_RESET;
  if (environment === "staging") return env.MYMEDLIFE_ALLOW_STAGING_ADMIN_PASSWORD_RESET;
  return env.MYMEDLIFE_ALLOW_LOCAL_ADMIN_PASSWORD_RESET;
}
