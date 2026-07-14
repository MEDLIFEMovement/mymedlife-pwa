import { createClient } from "@supabase/supabase-js";

import type { AuthSessionState } from "@/services/auth-session";

export type AdminUserLifecycleOperation = "deactivate_user" | "delete_user";

export type AdminUserLifecycleConfig = {
  enabled: boolean;
  environment: "local" | "staging" | "production";
  reason: string;
};

export type AdminUserLifecycleResult =
  | {
      success: true;
      code: "user_deactivated" | "user_deleted";
      userId: string;
      auditLogId: string;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code:
        | "lifecycle_disabled"
        | "missing_auth"
        | "permission_denied"
        | "confirmation_required"
        | "reason_required"
        | "target_not_found"
        | "server_error";
      plainEnglishMessage: string;
    };

export type AdminUserLifecycleClient = {
  auth: {
    admin: {
      updateUserById: (
        userId: string,
        attributes: { ban_duration: string },
      ) => Promise<{ error: { message?: string } | null }>;
      deleteUser: (userId: string) => Promise<{
        error: { message?: string } | null;
      }>;
    };
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
      update: (row: Record<string, unknown>) => {
        eq: (column: string, value: string) => {
          select: (columns: string) => Promise<{
            data: Array<{ id: string }> | null;
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

export function getAdminUserLifecycleConfig(
  env: Record<string, string | undefined> = process.env,
): AdminUserLifecycleConfig {
  const environment = getEnvironment(env);
  const enabled = env.MYMEDLIFE_ENABLE_ADMIN_USER_LIFECYCLE === "true";

  if (!enabled) {
    return disabled(environment, "User lifecycle writes are disabled by configuration.");
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return disabled(environment, "User lifecycle writes are disabled because the server-only Supabase service-role key is missing.");
  }

  const allowFlag = getLifecycleApprovalFlag(environment, env);

  if (allowFlag !== "true") {
    return disabled(
      environment,
      `${environment[0].toUpperCase()}${environment.slice(1)} user lifecycle writes are disabled until the explicit environment approval flag is enabled.`,
    );
  }

  return {
    enabled: true,
    environment,
    reason: `Server-side user lifecycle writes are enabled for ${environment}. Deactivation is reversible; deletion is Super Admin-only and audited.`,
  };
}

function getLifecycleApprovalFlag(
  environment: AdminUserLifecycleConfig["environment"],
  env: Record<string, string | undefined>,
) {
  if (environment === "production") return env.MYMEDLIFE_ALLOW_PRODUCTION_ADMIN_USER_LIFECYCLE;
  if (environment === "staging") return env.MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES;
  return env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES;
}

export function createAdminUserLifecycleClient(
  env: Record<string, string | undefined> = process.env,
): AdminUserLifecycleClient | null {
  const config = getAdminUserLifecycleConfig(env);
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!config.enabled || !url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as unknown as AdminUserLifecycleClient;
}

export function isPrivilegedLifecycleSession(session: AuthSessionState): boolean {
  return session.status === "signed_in" && Boolean(session.user?.id);
}

function getEnvironment(
  env: Record<string, string | undefined>,
): AdminUserLifecycleConfig["environment"] {
  if (env.MYMEDLIFE_AUTH_MODE === "production_supabase") return "production";
  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") return "staging";
  return "local";
}

function disabled(
  environment: AdminUserLifecycleConfig["environment"],
  reason: string,
): AdminUserLifecycleConfig {
  return { enabled: false, environment, reason };
}
