import { isUuid } from "@/services/action-start-write";
import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";
import type { DatabaseRoleKey } from "@/shared/types/persistence";

export type AdminAccessOperation =
  | "set_chapter_role"
  | "remove_chapter_membership"
  | "set_staff_role"
  | "remove_staff_role"
  | "set_coach_portfolio"
  | "remove_coach_portfolio"
  | "deactivate_user"
  | "reactivate_user";

export type AdminAccessWriteConfig =
  | {
      enabled: true;
      isLocalOnly: boolean;
      isHostedStaging: boolean;
      externalWritesEnabled: false;
      reason: string;
    }
  | {
      enabled: false;
      isLocalOnly: boolean;
      isHostedStaging: boolean;
      externalWritesEnabled: false;
      reason: string;
    };

export type AdminAccessResultCode =
  | "admin_access_changed"
  | "write_disabled"
  | "missing_auth"
  | "permission_denied"
  | "target_not_found"
  | "confirmation_required"
  | "audit_reason_required"
  | "invalid_operation"
  | "invalid_role"
  | "invalid_scope"
  | "self_destructive_action_blocked"
  | "super_admin_protected"
  | "server_error";

export type AdminAccessRpcRow = {
  operation: AdminAccessOperation;
  target_user_id: string;
  membership_id: string | null;
  staff_role_assignment_id: string | null;
  coach_assignment_id: string | null;
  audit_log_id: string;
  default_workspace: string;
  allowed_workspaces: string[];
};

export type AdminAccessServerResult =
  | {
      success: true;
      code: "admin_access_changed";
      operation: AdminAccessOperation;
      targetUserId: string;
      membershipId: string | null;
      staffRoleAssignmentId: string | null;
      coachAssignmentId: string | null;
      auditLogId: string;
      defaultWorkspace: string;
      allowedWorkspaces: string[];
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code: Exclude<AdminAccessResultCode, "admin_access_changed">;
      targetUserId: null;
      plainEnglishMessage: string;
    };

const adminAccessOperations = new Set<AdminAccessOperation>([
  "set_chapter_role",
  "remove_chapter_membership",
  "set_staff_role",
  "remove_staff_role",
  "set_coach_portfolio",
  "remove_coach_portfolio",
  "deactivate_user",
  "reactivate_user",
]);

const adminAccessRoleKeys = new Set<DatabaseRoleKey>([
  "general_member",
  "action_committee_member",
  "action_committee_chair",
  "e_board_member",
  "president_vp",
  "coach",
  "admin",
  "ds_admin",
  "super_admin",
]);

const adminUserManagementRoute = "/admin/users";

export function getAdminAccessWriteConfig(
  env: Record<string, string | undefined> = process.env,
): AdminAccessWriteConfig {
  const authConfig = getSupabaseAuthConfig(env);

  if (authConfig.mode === "staging_supabase") {
    if (!authConfig.enabled) {
      return disabledWriteConfig({
        isLocalOnly: false,
        isHostedStaging: true,
        reason: authConfig.reason,
      });
    }

    if (env.MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES !== "true") {
      return disabledWriteConfig({
        isLocalOnly: false,
        isHostedStaging: true,
        reason:
          "Hosted staging admin access writes are disabled. Set MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES=true only for the approved MED-509 staging rehearsal.",
      });
    }

    if (env.MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE !== "true") {
      return disabledWriteConfig({
        isLocalOnly: false,
        isHostedStaging: true,
        reason:
          "Hosted staging admin access writes remain disabled. Set MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE=true only after auth, RLS, rollback, and audit readback are approved.",
      });
    }

    return {
      enabled: true,
      isLocalOnly: false,
      isHostedStaging: true,
      externalWritesEnabled: false,
      reason:
        "Hosted staging admin access writes are enabled for staging.mymedlife.org only. External sends, production writes, uploads, and integrations remain disabled.",
    };
  }

  if (authConfig.mode === "production_supabase") {
    return disabledWriteConfig({
      isLocalOnly: false,
      isHostedStaging: false,
      reason:
        "Production admin access writes are disabled. Prove MED-509 access changes on hosted staging before any production approval.",
    });
  }

  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return disabledWriteConfig({
      isLocalOnly: true,
      reason:
        "Local Supabase writes are disabled. Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true only for local admin write testing.",
    });
  }

  if (env.MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE !== "true") {
    return disabledWriteConfig({
      isLocalOnly: true,
      reason:
        "Admin access writes remain disabled. Set MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE=true only after local auth, RLS, audit, and rollback review are approved.",
    });
  }

  return {
    enabled: true,
    isLocalOnly: true,
    isHostedStaging: false,
    externalWritesEnabled: false,
    reason:
      "Local admin access writes are enabled for localhost Supabase only. External sends, production writes, and hosted rollout remain disabled.",
  };
}

function disabledWriteConfig(input: {
  isLocalOnly: boolean;
  isHostedStaging?: boolean;
  reason: string;
}): AdminAccessWriteConfig {
  return {
    enabled: false,
    isLocalOnly: input.isLocalOnly,
    isHostedStaging: input.isHostedStaging ?? false,
    externalWritesEnabled: false,
    reason: input.reason,
  };
}

export function mapAdminAccessRpcSuccess(
  row: AdminAccessRpcRow,
): AdminAccessServerResult {
  return {
    success: true,
    code: "admin_access_changed",
    operation: row.operation,
    targetUserId: row.target_user_id,
    membershipId: row.membership_id,
    staffRoleAssignmentId: row.staff_role_assignment_id,
    coachAssignmentId: row.coach_assignment_id,
    auditLogId: row.audit_log_id,
    defaultWorkspace: row.default_workspace,
    allowedWorkspaces: row.allowed_workspaces,
    plainEnglishMessage:
      "Admin access changed through the audited Supabase RPC. The app recorded the role, chapter or portfolio change plus an audit log. No external send happened.",
  };
}

export function getAdminAccessDisabledResult(
  plainEnglishMessage: string,
): AdminAccessServerResult {
  return failureResult("write_disabled", plainEnglishMessage);
}

export function getAdminAccessConfirmationRequiredResult(
  plainEnglishMessage: string,
): AdminAccessServerResult {
  return failureResult("confirmation_required", plainEnglishMessage);
}

export function mapAdminAccessRpcError(error: {
  code?: string;
  message?: string;
}): AdminAccessServerResult {
  const message = error.message?.toLowerCase() ?? "";

  if (message.includes("authenticated user required")) {
    return failureResult(
      "missing_auth",
      "Sign in with a DS Admin or Super Admin account before changing access.",
    );
  }

  if (error.code === "P0002" || message.includes("target profile not found")) {
    return failureResult(
      "target_not_found",
      "The selected user profile was not found, so no access changed.",
    );
  }

  if (
    message.includes("reason must be at least") ||
    message.includes("audit reason")
  ) {
    return failureResult(
      "audit_reason_required",
      "Add a clearer audit reason before changing access.",
    );
  }

  if (message.includes("unsupported admin access operation")) {
    return failureResult(
      "invalid_operation",
      "Choose a supported admin access operation before saving.",
    );
  }

  if (
    message.includes("requires a chapter-scoped role") ||
    message.includes("requires a staff role")
  ) {
    return failureResult(
      "invalid_role",
      "Choose a valid role for this access change.",
    );
  }

  if (
    message.includes("chapter_uuid is required") ||
    message.includes("active coach role")
  ) {
    return failureResult(
      "invalid_scope",
      "Choose the required chapter or portfolio scope before saving.",
    );
  }

  if (message.includes("own account")) {
    return failureResult(
      "self_destructive_action_blocked",
      "Admins cannot perform destructive access changes on their own account.",
    );
  }

  if (
    error.code === "42501" ||
    message.includes("access required")
  ) {
    if (
      message.includes("only a super admin") ||
      message.includes("super_admin")
    ) {
      return failureResult(
        "super_admin_protected",
        "Only a Super Admin can change Super Admin access.",
      );
    }

    return failureResult(
      "permission_denied",
      "This signed-in role is not allowed to change user or chapter access.",
    );
  }

  if (
    message.includes("only a super admin") ||
    message.includes("super_admin")
  ) {
    return failureResult(
      "super_admin_protected",
      "Only a Super Admin can change Super Admin access.",
    );
  }

  return failureResult(
    "server_error",
    "The app could not safely change access. No external automation ran.",
  );
}

export function parseAdminAccessOperation(
  value: FormDataEntryValue | null,
): AdminAccessOperation | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim() as AdminAccessOperation;

  return adminAccessOperations.has(normalized) ? normalized : null;
}

export function parseAdminAccessRole(
  value: FormDataEntryValue | null,
): DatabaseRoleKey | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim() as DatabaseRoleKey;

  return adminAccessRoleKeys.has(normalized) ? normalized : null;
}

export function normalizeAdminAccessReturnTo(
  value: FormDataEntryValue | null,
): string {
  if (typeof value !== "string") {
    return adminUserManagementRoute;
  }

  const trimmed = value.trim();

  if (
    !trimmed.startsWith(adminUserManagementRoute) ||
    trimmed.startsWith("//") ||
    trimmed.includes("://")
  ) {
    return adminUserManagementRoute;
  }

  return trimmed;
}

export function hasAdminAccessSupabaseIds(input: {
  targetUserId: string;
  chapterId?: string | null;
}) {
  return (
    isUuid(input.targetUserId) &&
    (input.chapterId === null ||
      input.chapterId === undefined ||
      isUuid(input.chapterId))
  );
}

function failureResult(
  code: Exclude<AdminAccessResultCode, "admin_access_changed">,
  plainEnglishMessage: string,
): AdminAccessServerResult {
  return {
    success: false,
    code,
    targetUserId: null,
    plainEnglishMessage,
  };
}
