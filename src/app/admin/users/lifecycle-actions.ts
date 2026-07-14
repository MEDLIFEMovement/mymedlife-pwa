"use server";

import { redirect } from "next/navigation";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState, type AuthSessionState } from "@/services/auth-session";
import {
  createAdminUserLifecycleClient,
  getAdminUserLifecycleConfig,
  isPrivilegedLifecycleSession,
  type AdminUserLifecycleClient,
  type AdminUserLifecycleOperation,
  type AdminUserLifecycleResult,
} from "@/services/admin-user-lifecycle";

type LifecycleActionDeps = {
  createSessionClient?: () => Promise<{
    client: Parameters<typeof getAuthSessionState>[0] | null;
    config: { reason: string };
  }>;
  createServiceClient?: () => AdminUserLifecycleClient | null;
  getSessionState?: (client: Parameters<typeof getAuthSessionState>[0]) => Promise<AuthSessionState>;
};

const confirmations: Record<AdminUserLifecycleOperation, string> = {
  deactivate_user: "DEACTIVATE USER",
  delete_user: "DELETE USER",
};

export async function submitAdminUserLifecycleAction(formData: FormData) {
  const result = await submitAdminUserLifecycleForSupabase(formData);
  const targetUserId = String(formData.get("targetUserId") ?? "").trim();
  redirect(`/admin/users?userId=${encodeURIComponent(targetUserId)}&adminUserLifecycleResult=${result.success ? result.code : result.code}`);
}

export async function submitAdminUserLifecycleForSupabase(
  formData: FormData,
  deps: LifecycleActionDeps = {},
): Promise<AdminUserLifecycleResult> {
  const config = getAdminUserLifecycleConfig();
  if (!config.enabled) {
    return failure("lifecycle_disabled", config.reason);
  }

  const operation = parseOperation(formData.get("operation"));
  const targetUserId = getString(formData.get("targetUserId"));
  const confirmation = getString(formData.get("confirmation"));
  const auditReason = getString(formData.get("auditReason"));

  if (!operation || !targetUserId) {
    return failure("target_not_found", "Choose a real Supabase-backed user before changing lifecycle status.");
  }
  if (confirmation !== confirmations[operation]) {
    return failure("confirmation_required", `Type ${confirmations[operation]} before this action can run.`);
  }
  if (auditReason.length < 12) {
    return failure("reason_required", "Add a clear audit reason of at least 12 characters.");
  }

  const createSessionClient = deps.createSessionClient ?? createSessionSupabaseClient;
  const { client, config: authConfig } = await createSessionClient();
  if (!client) {
    return failure("lifecycle_disabled", authConfig.reason);
  }

  const getSessionState = deps.getSessionState ?? getAuthSessionState;
  const session = await getSessionState(client);
  if (!isPrivilegedLifecycleSession(session) || !session.user) {
    return failure(
      session.status === "signed_in" ? "permission_denied" : "missing_auth",
      "Sign in with a DS Admin or Super Admin account before changing a user lifecycle state.",
    );
  }

  if (session.user.id === targetUserId) {
    return failure("permission_denied", "Admins cannot deactivate or delete their own account.");
  }

  const serviceClient = deps.createServiceClient?.() ?? createAdminUserLifecycleClient();
  if (!serviceClient) {
    return failure("lifecycle_disabled", "The server-only lifecycle client is not configured.");
  }

  const actorRoles = await readActiveRoles(serviceClient, session.user.id);
  if (!actorRoles.includes("ds_admin") && !actorRoles.includes("super_admin")) {
    return failure("permission_denied", "Only a DS Admin or Super Admin can change user lifecycle state.");
  }

  const targetRoles = await readActiveRoles(serviceClient, targetUserId);
  if (targetRoles.includes("super_admin") && !actorRoles.includes("super_admin")) {
    return failure("permission_denied", "Only a Super Admin can deactivate or delete a Super Admin account.");
  }
  if (operation === "delete_user" && !actorRoles.includes("super_admin")) {
    return failure("permission_denied", "Only a Super Admin can permanently delete a user.");
  }

  const now = new Date().toISOString();
  if (operation === "deactivate_user") {
    const profile = await serviceClient.schema("app").from("profiles")
      .update({ status: "inactive", updated_at: now })
      .eq("id", targetUserId)
      .select("id");
    if (profile.error || !profile.data?.length) {
      return failure("target_not_found", "The target profile was not found, so no lifecycle change was made.");
    }

    const ban = await serviceClient.auth.admin.updateUserById(targetUserId, {
      ban_duration: "876000h",
    });
    if (ban.error) {
      return failure("server_error", `The account profile was not fully suspended: ${ban.error.message ?? "Supabase Auth rejected the change."}`);
    }

    await serviceClient.schema("app").from("memberships").update({ status: "inactive", updated_at: now }).eq("user_id", targetUserId).select("id");
    await serviceClient.schema("app").from("staff_role_assignments").update({ status: "inactive", ended_at: now, updated_at: now }).eq("user_id", targetUserId).select("id");
    await serviceClient.schema("app").from("coach_chapter_assignments").update({ status: "ended", ends_at: now.slice(0, 10), updated_at: now, handoff_reason: auditReason }).eq("coach_user_id", targetUserId).select("id");

    const auditLogId = await writeAudit(serviceClient, session.user.id, targetUserId, "admin_user_deactivated", auditReason, now);
    if (!auditLogId) {
      return failure("server_error", "The account was suspended, but the audit record could not be confirmed.");
    }
    return {
      success: true,
      code: "user_deactivated",
      userId: targetUserId,
      auditLogId,
      plainEnglishMessage: "User access was suspended in Auth, marked inactive, and audited.",
    };
  }

  const auditLogId = await writeAudit(serviceClient, session.user.id, targetUserId, "admin_user_deleted", auditReason, now);
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

async function createSessionSupabaseClient() {
  const result = await createLocalSupabaseServerClient();
  return { client: result.client, config: result.config };
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
