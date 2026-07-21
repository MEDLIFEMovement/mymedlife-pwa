import { createClient } from "@supabase/supabase-js";

import type { AuthSessionState } from "@/services/auth-session";
import { isUuid } from "@/services/action-start-write";
import type { DatabaseRoleKey } from "@/shared/types/persistence";

export type AdminUserCreationRole = Extract<
  DatabaseRoleKey,
  | "general_member"
  | "e_board_member"
  | "coach"
  | "admin"
  | "ds_admin"
  | "super_admin"
  | "test"
>;

export type AdminUserCreationConfig = {
  enabled: boolean;
  environment: "local" | "staging" | "production";
  reason: string;
};

export type AdminUserCreationResult =
  | {
      success: true;
      code: "user_created";
      userId: string;
      email: string;
      role: AdminUserCreationRole;
      auditLogId: string;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code:
        | "creation_disabled"
        | "missing_auth"
        | "permission_denied"
        | "validation_error"
        | "duplicate_email"
        | "server_error";
      plainEnglishMessage: string;
    };

export type AdminUserCreationClient = {
  auth: {
    admin: {
      createUser: (input: {
        email: string;
        password: string;
        email_confirm: boolean;
        user_metadata: { display_name: string };
      }) => Promise<{
        data: { user: { id: string; email?: string | null } | null };
        error: { code?: string; message?: string } | null;
      }>;
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

export function getAdminUserCreationConfig(
  env: Record<string, string | undefined> = process.env,
): AdminUserCreationConfig {
  const environment = getEnvironment(env);
  const serviceRoleConfigured = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
  const enabled = env.MYMEDLIFE_ENABLE_ADMIN_USER_CREATION === "true";

  if (!enabled) {
    return {
      enabled: false,
      environment,
      reason:
        "User creation is disabled. Enable it only after approving the server-side auth, profile, role, and audit path.",
    };
  }

  if (!serviceRoleConfigured) {
    return {
      enabled: false,
      environment,
      reason:
        "User creation is disabled because the server-only Supabase service-role key is missing.",
    };
  }

  if (environment === "local" && env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return {
      enabled: false,
      environment,
      reason:
        "Local user creation is disabled. Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true for local testing.",
    };
  }

  if (environment === "staging" && env.MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES !== "true") {
    return {
      enabled: false,
      environment,
      reason:
        "Staging user creation is disabled. Set MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES=true only after staging auth and audit review.",
    };
  }

  if (environment === "production" && env.MYMEDLIFE_ALLOW_PRODUCTION_ADMIN_USER_CREATION !== "true") {
    return {
      enabled: false,
      environment,
      reason:
        "Production user creation is disabled until the production admin-user approval flag is explicitly enabled.",
    };
  }

  return {
    enabled: true,
    environment,
    reason: `Server-side user creation is enabled for ${environment}. Every account creation records an audit log.`,
  };
}

export function createAdminUserCreationClient(
  env: Record<string, string | undefined> = process.env,
): AdminUserCreationClient | null {
  const config = getAdminUserCreationConfig(env);
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!config.enabled || !url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as unknown as AdminUserCreationClient;
}

export function parseAdminUserCreationRole(
  value: FormDataEntryValue | null,
): AdminUserCreationRole | null {
  const role = typeof value === "string" ? value.trim() : "";

  return ["general_member", "e_board_member", "coach", "admin", "ds_admin", "super_admin", "test"].includes(role)
    ? (role as AdminUserCreationRole)
    : null;
}

export function normalizeAdminUserCreationChapterId(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function requiresAdminUserCreationChapter(role: AdminUserCreationRole): boolean {
  return role === "general_member" || role === "e_board_member";
}

export function isValidAdminUserCreationChapterId(chapterId: string): boolean {
  return isUuid(chapterId);
}

export function normalizeAdminUserCreationEmail(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeAdminUserCreationDisplayName(
  value: FormDataEntryValue | null,
): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getAdminUserCreationResultText(
  result: AdminUserCreationResult,
): string {
  return result.plainEnglishMessage;
}

export function isPrivilegedAdminSession(session: AuthSessionState): boolean {
  return session.status === "signed_in" && Boolean(session.user?.id);
}

function getEnvironment(
  env: Record<string, string | undefined>,
): AdminUserCreationConfig["environment"] {
  if (env.MYMEDLIFE_AUTH_MODE === "production_supabase") return "production";
  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") return "staging";
  return "local";
}
