"use server";

import { redirect } from "next/navigation";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState, type AuthSessionState } from "@/services/auth-session";
import {
  createAdminUserCreationClient,
  getAdminUserCreationConfig,
  isPrivilegedAdminSession,
  normalizeAdminUserCreationDisplayName,
  normalizeAdminUserCreationEmail,
  parseAdminUserCreationRole,
  type AdminUserCreationClient,
  type AdminUserCreationResult,
  type AdminUserCreationRole,
} from "@/services/admin-user-creation";

type CreationActionDeps = {
  createSessionClient?: () => Promise<{
    client: {
      auth: Parameters<typeof getAuthSessionState>[0]["auth"];
    } | null;
    config: { reason: string };
  }>;
  createServiceClient?: () => AdminUserCreationClient | null;
  getSessionState?: (client: Parameters<typeof getAuthSessionState>[0]) => Promise<AuthSessionState>;
};

export async function submitAdminUserCreationAction(formData: FormData) {
  const result = await submitAdminUserCreationForSupabase(formData);
  const params = new URLSearchParams({
    adminUserCreationResult: result.success ? "user_created" : result.code,
  });

  redirect(`/admin/users?${params.toString()}`);
}

export async function submitAdminUserCreationForSupabase(
  formData: FormData,
  deps: CreationActionDeps = {},
): Promise<AdminUserCreationResult> {
  const config = getAdminUserCreationConfig();

  if (!config.enabled) {
    return failure("creation_disabled", config.reason);
  }

  const email = normalizeAdminUserCreationEmail(formData.get("email"));
  const displayName = normalizeAdminUserCreationDisplayName(formData.get("displayName"));
  const password = getString(formData.get("temporaryPassword"));
  const role = parseAdminUserCreationRole(formData.get("role"));
  const auditReason = getString(formData.get("auditReason"));

  if (!email.includes("@") || !displayName || password.length < 12 || !role) {
    return failure(
      "validation_error",
      "Enter a valid email, display name, role, and a temporary password of at least 12 characters.",
    );
  }

  if (auditReason.length < 12) {
    return failure(
      "validation_error",
      "Add a clear audit reason of at least 12 characters before creating the account.",
    );
  }

  const createSessionClient = deps.createSessionClient ?? createSessionSupabaseClient;
  const { client, config: authConfig } = await createSessionClient();

  if (!client) {
    return failure("creation_disabled", authConfig.reason);
  }

  const getSessionState = deps.getSessionState ?? getAuthSessionState;
  const session = await getSessionState(client as Parameters<typeof getAuthSessionState>[0]);

  if (!isPrivilegedAdminSession(session)) {
    return failure(
      session.status === "signed_in" ? "permission_denied" : "missing_auth",
      "Sign in with a DS Admin or Super Admin account before creating a user.",
    );
  }

  const actorUser = session.user;
  if (!actorUser) {
    return failure("missing_auth", "Sign in with a DS Admin or Super Admin account before creating a user.");
  }

  const serviceClient = deps.createServiceClient?.() ?? createAdminUserCreationClient();

  if (!serviceClient) {
    return failure("creation_disabled", "The server-only account creation client is not configured.");
  }

  const roleAllowed = await hasPrivilegedRole(serviceClient, actorUser.id);
  if (!roleAllowed) {
    return failure("permission_denied", "Only a DS Admin or Super Admin can create users.");
  }

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (createError || !created.user?.id) {
    const message = createError?.message?.toLowerCase() ?? "";
    return failure(
      message.includes("already") || message.includes("exist")
        ? "duplicate_email"
        : "server_error",
      message.includes("already") || message.includes("exist")
        ? "An account with that email already exists."
        : "Supabase could not create the auth account. No profile or role row was written.",
    );
  }

  const userId = created.user.id;
  const profile = await serviceClient.schema("app").from("profiles").insert({
    id: userId,
    email,
    display_name: displayName,
    status: "active",
  }).select("id").single();

  if (profile.error) {
    await serviceClient.auth.admin.deleteUser(userId);
    return failure("server_error", "The profile row could not be created, so the auth account was rolled back.");
  }

  if (role !== "general_member") {
    const roleInsert = await serviceClient.schema("app").from("staff_role_assignments").insert({
      user_id: userId,
      role_key: role,
      status: "active",
      assigned_by: actorUser.id,
    }).select("id").single();

    if (roleInsert.error) {
      await serviceClient.auth.admin.deleteUser(userId);
      return failure("server_error", "The role row could not be created, so the auth account was rolled back.");
    }
  }

  const audit = await serviceClient.schema("app").from("audit_logs").insert({
    actor_user_id: actorUser.id,
    action: "admin_user_created",
    target_table: "auth.users",
    target_id: userId,
    after_value: { email, display_name: displayName, role },
    reason: auditReason,
  }).select("id").single();

  if (audit.error || !audit.data?.id) {
    await serviceClient.auth.admin.deleteUser(userId);
    return failure("server_error", "The audit record could not be written, so the auth account was rolled back.");
  }

  return {
    success: true,
    code: "user_created" as const,
    userId,
    email,
    role,
    auditLogId: audit.data.id,
    plainEnglishMessage: "User created with a profile, optional staff role, and audit record. No email or external provider was called.",
  };
}

async function createSessionSupabaseClient() {
  const result = await createLocalSupabaseServerClient();
  return { client: result.client, config: result.config };
}

async function hasPrivilegedRole(client: AdminUserCreationClient, userId: string) {
  const result = await client.schema("app").from("staff_role_assignments").select("role_key")
    .eq("user_id", userId).eq("status", "active");

  return Boolean(
    !result.error && result.data?.some((row) => ["ds_admin", "super_admin"].includes(row.role_key)),
  );
}

function getString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function failure(
  code: Exclude<AdminUserCreationResult["code"], "user_created">,
  plainEnglishMessage: string,
): AdminUserCreationResult {
  return { success: false, code, plainEnglishMessage };
}
