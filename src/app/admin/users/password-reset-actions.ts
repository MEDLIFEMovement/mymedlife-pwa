"use server";

import { redirect } from "next/navigation";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState, type AuthSessionState } from "@/services/auth-session";
import { isAdminAuthUserSuspended } from "@/services/admin-user-lifecycle";
import {
  createAdminUserPasswordResetClient,
  getAdminUserPasswordResetConfig,
  isAuthenticatedPasswordResetSession,
  type AdminUserPasswordResetClient,
  type AdminUserPasswordResetResult,
} from "@/services/admin-user-password-reset";

type PasswordResetActionDeps = {
  createSessionClient?: () => Promise<{
    client: Parameters<typeof getAuthSessionState>[0] | null;
    config: { reason: string };
  }>;
  createServiceClient?: () => AdminUserPasswordResetClient | null;
  getSessionState?: (client: Parameters<typeof getAuthSessionState>[0]) => Promise<AuthSessionState>;
};

const requiredConfirmation = "RESET PASSWORD";

export async function submitAdminUserPasswordResetAction(formData: FormData) {
  const result = await submitAdminUserPasswordResetForSupabase(formData);
  const targetUserId = getString(formData.get("targetUserId"));
  redirect(`/admin/users?userId=${encodeURIComponent(targetUserId)}&adminUserPasswordResetResult=${result.code}`);
}

export async function submitAdminUserPasswordResetForSupabase(
  formData: FormData,
  deps: PasswordResetActionDeps = {},
): Promise<AdminUserPasswordResetResult> {
  const config = getAdminUserPasswordResetConfig();
  if (!config.enabled) {
    return failure("reset_disabled", config.reason);
  }

  const targetUserId = getString(formData.get("targetUserId"));
  const confirmation = getString(formData.get("confirmation"));
  const auditReason = getString(formData.get("auditReason"));

  if (!targetUserId) {
    return failure("target_not_found", "Choose a real Supabase-backed user before sending a password reset email.");
  }
  if (confirmation !== requiredConfirmation) {
    return failure("confirmation_required", `Type ${requiredConfirmation} before sending a password reset email.`);
  }
  if (auditReason.length < 12) {
    return failure("reason_required", "Add a clear audit reason of at least 12 characters.");
  }

  const createSessionClient = deps.createSessionClient ?? createSessionSupabaseClient;
  const { client, config: authConfig } = await createSessionClient();
  if (!client) {
    return failure("reset_disabled", authConfig.reason);
  }

  const getSessionState = deps.getSessionState ?? getAuthSessionState;
  const session = await getSessionState(client);
  const actorId = session.user?.id;
  if (!isAuthenticatedPasswordResetSession(session) || !actorId) {
    return failure(
      session.status === "signed_in" ? "permission_denied" : "missing_auth",
      "Sign in with a DS Admin or Super Admin account before sending a password reset email.",
    );
  }

  const serviceClient = deps.createServiceClient
    ? deps.createServiceClient()
    : createAdminUserPasswordResetClient();
  if (!serviceClient) {
    return failure("reset_disabled", "The server-only password reset client is not configured.");
  }

  const actorRoles = await readActiveRoles(serviceClient, actorId);
  const targetRoles = await readActiveRoles(serviceClient, targetUserId);
  // Self-reset is allowed here because this sends a recovery email; admins never see or set the password.
  const authorizationFailure = authorizePasswordResetTarget(actorRoles, targetRoles);
  if (authorizationFailure) return authorizationFailure;

  const target = await serviceClient.auth.admin.getUserById(targetUserId);
  const email = target.data.user?.email?.trim().toLowerCase();
  if (target.error || !target.data.user?.id || !email) {
    return failure("target_not_found", "The selected Auth user was not found, so no password reset email was sent.");
  }
  if (isAdminAuthUserSuspended(target.data.user)) {
    return failure(
      "target_inactive",
      "The selected account is inactive. Reactivate it through an approved lifecycle workflow before sending a password reset email.",
    );
  }

  const auditLogId = await writeAudit(
    serviceClient,
    actorId,
    targetUserId,
    email,
    auditReason,
    new Date().toISOString(),
  );
  if (!auditLogId) {
    return failure("server_error", "The password reset email was blocked because the audit record could not be written.");
  }

  const reset = await serviceClient.auth.resetPasswordForEmail(email, {
    redirectTo: config.redirectTo,
  });
  if (reset.error) {
    return failure("server_error", "Supabase Auth could not send the password reset email. Check provider configuration and retry.");
  }

  return {
    success: true,
    code: "password_reset_sent",
    userId: targetUserId,
    email,
    auditLogId,
    plainEnglishMessage: "Password reset email was sent through Supabase Auth and the request was audited.",
  };
}

async function createSessionSupabaseClient() {
  const result = await createLocalSupabaseServerClient();
  return { client: result.client, config: result.config };
}

async function readActiveRoles(client: AdminUserPasswordResetClient, userId: string) {
  const result = await client.schema("app").from("staff_role_assignments")
    .select("role_key")
    .eq("user_id", userId)
    .eq("status", "active");
  return result.error ? [] : result.data?.map((row) => row.role_key) ?? [];
}

function authorizePasswordResetTarget(
  actorRoles: string[],
  targetRoles: string[],
): AdminUserPasswordResetResult | null {
  const actorIsSuperAdmin = actorRoles.includes("super_admin");
  if (!actorRoles.includes("ds_admin") && !actorIsSuperAdmin) {
    return failure("permission_denied", "Only a DS Admin or Super Admin can send password reset emails.");
  }
  if (targetRoles.includes("super_admin") && !actorIsSuperAdmin) {
    return failure("permission_denied", "Only a Super Admin can send a password reset email for a Super Admin account.");
  }
  return null;
}

async function writeAudit(
  client: AdminUserPasswordResetClient,
  actorUserId: string,
  targetUserId: string,
  email: string,
  reason: string,
  now: string,
) {
  const result = await client.schema("app").from("audit_logs").insert({
    actor_user_id: actorUserId,
    action: "admin_user_password_reset_requested",
    target_table: "auth.users",
    target_id: targetUserId,
    after_value: { action: "password_reset_email_requested", email },
    reason,
    created_at: now,
  }).select("id").single();
  return result.error ? null : result.data?.id ?? null;
}

function getString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function failure(
  code: Exclude<AdminUserPasswordResetResult["code"], "password_reset_sent">,
  plainEnglishMessage: string,
): AdminUserPasswordResetResult {
  return { success: false, code, plainEnglishMessage };
}
