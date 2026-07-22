"use server";

import { redirect } from "next/navigation";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState, type AuthSessionState } from "@/services/auth-session";
import {
  createAdminUserLifecycleClient,
  getAdminUserLifecycleConfig,
  isAdminAuthUserSuspended,
  isPrivilegedLifecycleSession,
  type AdminUserLifecycleClient,
  type AdminUserLifecycleOperation,
  type AdminUserLifecycleResult,
} from "@/services/admin-user-lifecycle";

type LifecycleActionDeps = {
  createSessionClient?: () => Promise<{
    client: AdminUserLifecycleSessionClient | null;
    config: { reason: string };
  }>;
  createServiceClient?: () => AdminUserLifecycleClient | null;
  getSessionState?: (client: AdminUserLifecycleSessionClient) => Promise<AuthSessionState>;
};

type AdminUserLifecycleRpcParams = {
  target_user_uuid: string;
  operation_input: "deactivate_user";
  chapter_uuid: null;
  role_key_input: null;
  audit_reason_input: string;
};

type AdminUserLifecycleSessionClient = Parameters<typeof getAuthSessionState>[0] & {
  schema: (schemaName: "app") => {
    rpc: (
      functionName: "admin_change_user_access",
      params: AdminUserLifecycleRpcParams,
    ) => Promise<{
      data: unknown;
      error: { code?: string; message?: string } | null;
    }>;
  };
};

type AdminUserLifecycleRpcRow = {
  audit_log_id?: string | null;
};

const confirmations: Record<AdminUserLifecycleOperation, string> = {
  deactivate_user: "DEACTIVATE USER",
  delete_user: "DELETE USER",
};

export async function submitAdminUserLifecycleAction(formData: FormData) {
  const result = await submitAdminUserLifecycleForSupabase(formData);
  const targetUserId = getString(formData.get("targetUserId"));
  redirect(`/admin/users?userId=${encodeURIComponent(targetUserId)}&adminUserLifecycleResult=${result.code}`);
}

export async function submitAdminUserLifecycleForSupabase(
  formData: FormData,
  deps: LifecycleActionDeps = {},
): Promise<AdminUserLifecycleResult> {
  const config = getAdminUserLifecycleConfig();
  if (!config.enabled) {
    return failure("lifecycle_disabled", config.reason);
  }

  const request = parseLifecycleRequest(formData);
  if (!request.success) return request.result;
  const { operation, targetUserId, auditReason } = request;

  const createSessionClient = deps.createSessionClient ?? createSessionSupabaseClient;
  const { client, config: authConfig } = await createSessionClient();
  if (!client) {
    return failure("lifecycle_disabled", authConfig.reason);
  }

  const getSessionState = deps.getSessionState ?? getAuthSessionState;
  const session = await getSessionState(client);
  const actorId = session.user?.id;
  if (!isPrivilegedLifecycleSession(session) || !actorId) return missingOrDenied(session.status);

  if (actorId === targetUserId) {
    return failure("permission_denied", "Admins cannot deactivate or delete their own account.");
  }

  const serviceClient = deps.createServiceClient?.() ?? createAdminUserLifecycleClient();
  if (!serviceClient) {
    return failure("lifecycle_disabled", "The server-only lifecycle client is not configured.");
  }

  const actorRoles = await readActiveRoles(serviceClient, actorId);
  const targetRoles = await readActiveRoles(serviceClient, targetUserId);
  const authorizationFailure = authorizeLifecycleTarget(operation, actorRoles, targetRoles);
  if (authorizationFailure) return authorizationFailure;

  if (operation === "deactivate_user") {
    const target = await serviceClient.auth.admin.getUserById(targetUserId);
    if (target.error || !target.data.user?.id) {
      return failure("target_not_found", "The selected Auth user was not found, so no lifecycle write ran.");
    }
    if (isAdminAuthUserSuspended(target.data.user)) {
      return failure(
        "target_inactive",
        "The selected account is already inactive. No additional lifecycle write ran.",
      );
    }
  }

  if (operation === "deactivate_user") {
    const ban = await serviceClient.auth.admin.updateUserById(targetUserId, {
      ban_duration: "876000h",
    });
    if (ban.error) {
      return failure("server_error", `Supabase Auth could not suspend the account: ${ban.error.message ?? "Supabase Auth rejected the change."}`);
    }

    const rpcResult = await client.schema("app").rpc("admin_change_user_access", {
      target_user_uuid: targetUserId,
      operation_input: "deactivate_user",
      chapter_uuid: null,
      role_key_input: null,
      audit_reason_input: auditReason,
    });
    const rpcRow = Array.isArray(rpcResult.data)
      ? (rpcResult.data[0] as AdminUserLifecycleRpcRow | undefined)
      : undefined;

    if (rpcResult.error || !rpcRow?.audit_log_id) {
      return rollbackAuthBanAfterRpcFailure(
        serviceClient,
        targetUserId,
        rpcResult.error?.message ?? "Supabase did not return the required audit record.",
      );
    }

    return {
      success: true,
      code: "user_deactivated",
      userId: targetUserId,
      auditLogId: rpcRow.audit_log_id,
      plainEnglishMessage: "User access was suspended in Auth, all app assignments were marked inactive, and the change was audited.",
    };
  }

  const now = new Date().toISOString();
  const auditLogId = await writeAudit(serviceClient, actorId, targetUserId, "admin_user_deleted", auditReason, now);
  if (!auditLogId) {
    return failure("server_error", "The deletion was blocked because the audit record could not be written.");
  }
  const deletion = await serviceClient.auth.admin.deleteUser(targetUserId);
  if (deletion.error) {
    return failure("server_error", `Supabase Auth could not delete the user: ${deletion.error.message ?? "unknown error"}`);
  }

  return {
    success: true,
    code: "user_deleted",
    userId: targetUserId,
    auditLogId,
    plainEnglishMessage: "User was permanently deleted from Auth and the deletion was audited.",
  };
}

function parseLifecycleRequest(formData: FormData):
  | { success: true; operation: AdminUserLifecycleOperation; targetUserId: string; auditReason: string }
  | { success: false; result: AdminUserLifecycleResult } {
  const operation = parseOperation(formData.get("operation"));
  const targetUserId = getString(formData.get("targetUserId"));
  const confirmation = getString(formData.get("confirmation"));
  const auditReason = getString(formData.get("auditReason"));
  if (!operation || !targetUserId) {
    return { success: false, result: failure("target_not_found", "Choose a real Supabase-backed user before changing lifecycle status.") };
  }
  if (confirmation !== confirmations[operation]) {
    return { success: false, result: failure("confirmation_required", `Type ${confirmations[operation]} before this action can run.`) };
  }
  if (auditReason.length < 12) {
    return { success: false, result: failure("reason_required", "Add a clear audit reason of at least 12 characters.") };
  }
  return { success: true, operation, targetUserId, auditReason };
}

function missingOrDenied(status: AuthSessionState["status"]): AdminUserLifecycleResult {
  return failure(status === "signed_in" ? "permission_denied" : "missing_auth", "Sign in with a DS Admin or Super Admin account before changing a user lifecycle state.");
}

function authorizeLifecycleTarget(
  operation: AdminUserLifecycleOperation,
  actorRoles: string[],
  targetRoles: string[],
): AdminUserLifecycleResult | null {
  const actorIsSuperAdmin = actorRoles.includes("super_admin");
  if (!actorRoles.includes("ds_admin") && !actorIsSuperAdmin) return failure("permission_denied", "Only a DS Admin or Super Admin can change user lifecycle state.");
  if (targetRoles.includes("super_admin") && !actorIsSuperAdmin) return failure("permission_denied", "Only a Super Admin can deactivate or delete a Super Admin account.");
  if (operation === "delete_user" && !actorIsSuperAdmin) return failure("permission_denied", "Only a Super Admin can permanently delete a user.");
  return null;
}

async function rollbackAuthBanAfterRpcFailure(
  client: AdminUserLifecycleClient,
  targetUserId: string,
  rpcErrorMessage: string,
): Promise<AdminUserLifecycleResult> {
  const rollback = await client.auth.admin.updateUserById(targetUserId, {
    ban_duration: "none",
  });

  if (rollback.error) {
    return failure(
      "server_error",
      `The app access transaction failed (${rpcErrorMessage}), and Auth rollback also failed: ${rollback.error.message ?? "unknown Auth rollback error"}`,
    );
  }

  return failure(
    "server_error",
    `The app access transaction failed (${rpcErrorMessage}), so the Auth suspension was rolled back and no completed deactivation was reported.`,
  );
}

async function createSessionSupabaseClient() {
  const result = await createLocalSupabaseServerClient();
  return {
    client: result.client as AdminUserLifecycleSessionClient | null,
    config: result.config,
  };
}

async function readActiveRoles(client: AdminUserLifecycleClient, userId: string) {
  const result = await client.schema("app").from("staff_role_assignments")
    .select("role_key")
    .eq("user_id", userId)
    .eq("status", "active");
  return result.error ? [] : result.data?.map((row) => row.role_key) ?? [];
}

async function writeAudit(
  client: AdminUserLifecycleClient,
  actorUserId: string,
  targetUserId: string,
  action: string,
  reason: string,
  now: string,
) {
  const result = await client.schema("app").from("audit_logs").insert({
    actor_user_id: actorUserId,
    action,
    target_table: "auth.users",
    target_id: targetUserId,
    after_value: { action },
    reason,
    created_at: now,
  }).select("id").single();
  return result.error ? null : result.data?.id ?? null;
}

function parseOperation(value: FormDataEntryValue | null): AdminUserLifecycleOperation | null {
  const operation = getString(value);
  return operation === "deactivate_user" || operation === "delete_user" ? operation : null;
}

function getString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function failure(
  code: Exclude<AdminUserLifecycleResult["code"], "user_deactivated" | "user_deleted">,
  plainEnglishMessage: string,
): AdminUserLifecycleResult {
  return { success: false, code, plainEnglishMessage };
}
