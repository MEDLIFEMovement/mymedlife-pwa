"use server";

import { redirect } from "next/navigation";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState, type AuthSessionState } from "@/services/auth-session";
import {
  getAdminAccessConfirmationRequiredResult,
  getAdminAccessDisabledResult,
  getAdminAccessWriteConfig,
  hasAdminAccessSupabaseIds,
  mapAdminAccessRpcError,
  mapAdminAccessRpcSuccess,
  normalizeAdminAccessReturnTo,
  parseAdminAccessOperation,
  parseAdminAccessRole,
  type AdminAccessOperation,
  type AdminAccessRpcRow,
  type AdminAccessServerResult,
} from "@/services/admin-management-write";

type AdminAccessRpcParams = {
  target_user_uuid: string;
  operation_input: AdminAccessOperation;
  chapter_uuid: string | null;
  role_key_input: string | null;
  audit_reason_input: string;
};

type AdminAccessRpcClient = {
  schema: (schemaName: "app") => {
    rpc: (
      functionName: "admin_change_user_access",
      params: AdminAccessRpcParams,
    ) => Promise<{
      data: unknown;
      error: { code?: string; message?: string } | null;
    }>;
  };
};

type AdminAccessActionDeps = {
  createServerClient?: () => Promise<{
    client: AdminAccessRpcClient | null;
    config: { reason: string };
  }>;
  getSessionState?: (client: AdminAccessRpcClient) => Promise<AuthSessionState>;
};

const operationConfirmation: Partial<Record<AdminAccessOperation, string>> = {
  remove_chapter_membership: "REMOVE CHAPTER ACCESS",
  remove_staff_role: "REMOVE STAFF ROLE",
  remove_coach_portfolio: "REMOVE PORTFOLIO",
  deactivate_user: "DEACTIVATE USER",
};

const operationsThatRequireChapter = new Set<AdminAccessOperation>([
  "set_chapter_role",
  "remove_chapter_membership",
  "set_coach_portfolio",
  "remove_coach_portfolio",
]);

const operationsThatRequireRole = new Set<AdminAccessOperation>([
  "set_chapter_role",
  "set_staff_role",
  "remove_staff_role",
]);

export async function submitAdminUserAccessAction(formData: FormData) {
  const result = await submitAdminUserAccessForLocalSupabase(formData);
  const returnTo = normalizeAdminAccessReturnTo(formData.get("returnTo"));
  const targetUserId = String(formData.get("targetUserId") ?? "").trim();
  const operation = String(formData.get("operation") ?? "").trim();
  const params = new URLSearchParams({
    adminAccessResult: result.code,
    targetUserId,
    operation,
  });

  redirect(appendSearchParams(returnTo, params));
}

export async function submitAdminUserAccessForLocalSupabase(
  formData: FormData,
  deps: AdminAccessActionDeps = {},
): Promise<AdminAccessServerResult> {
  const config = getAdminAccessWriteConfig();

  if (!config.enabled) {
    return getAdminAccessDisabledResult(config.reason);
  }

  const operation = parseAdminAccessOperation(formData.get("operation"));
  const targetUserId = String(formData.get("targetUserId") ?? "").trim();
  const chapterId = getOptionalString(formData.get("chapterId"));
  const roleKey = parseAdminAccessRole(formData.get("roleKey"));
  const auditReason = String(formData.get("auditReason") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (!operation) {
    return {
      success: false,
      code: "invalid_operation",
      targetUserId: null,
      plainEnglishMessage: "Choose a supported admin access operation before saving.",
    };
  }

  if (!hasAdminAccessSupabaseIds({ targetUserId, chapterId })) {
    return {
      success: false,
      code: "target_not_found",
      targetUserId: null,
      plainEnglishMessage:
        "The selected user or chapter uses mock data instead of approved Supabase UUIDs, so no access changed.",
    };
  }

  if (operationsThatRequireChapter.has(operation) && !chapterId) {
    return {
      success: false,
      code: "invalid_scope",
      targetUserId: null,
      plainEnglishMessage: "Choose the chapter or portfolio scope before saving.",
    };
  }

  if (operationsThatRequireRole.has(operation) && !roleKey) {
    return {
      success: false,
      code: "invalid_role",
      targetUserId: null,
      plainEnglishMessage: "Choose a valid role for this access change.",
    };
  }

  const expectedConfirmation = operationConfirmation[operation];

  if (expectedConfirmation && confirmation !== expectedConfirmation) {
    return getAdminAccessConfirmationRequiredResult(
      `Type ${expectedConfirmation} before this admin access change can run.`,
    );
  }

  if (auditReason.length < 12) {
    return {
      success: false,
      code: "audit_reason_required",
      targetUserId: null,
      plainEnglishMessage:
        "Add a clear audit reason so DS can explain why access changed.",
    };
  }

  const createServerClient = deps.createServerClient ?? createSupabaseServerClientForAdminAccess;
  const { client, config: authConfig } = await createServerClient();

  if (!client) {
    return getAdminAccessDisabledResult(authConfig.reason);
  }

  const getSessionState = deps.getSessionState ?? getAuthSessionStateForAdminAccess;
  const authSession = await getSessionState(client);

  if (authSession.status !== "signed_in") {
    return {
      success: false,
      code: "missing_auth",
      targetUserId: null,
      plainEnglishMessage:
        "Sign in with a DS Admin or Super Admin account before changing user access.",
    };
  }

  const { data, error } = await client
    .schema("app")
    .rpc("admin_change_user_access", {
      target_user_uuid: targetUserId,
      operation_input: operation,
      chapter_uuid: chapterId,
      role_key_input: roleKey,
      audit_reason_input: auditReason,
    });

  if (error) {
    return mapAdminAccessRpcError(error);
  }

  const firstRow = Array.isArray(data)
    ? (data[0] as AdminAccessRpcRow | undefined)
    : undefined;

  if (!firstRow) {
    return {
      success: false,
      code: "server_error",
      targetUserId: null,
      plainEnglishMessage:
        "Supabase did not return the expected admin access record. No external automation ran.",
    };
  }

  return mapAdminAccessRpcSuccess(firstRow);
}

async function createSupabaseServerClientForAdminAccess() {
  const { client, config } = await createLocalSupabaseServerClient();

  return {
    client: client as AdminAccessRpcClient | null,
    config,
  };
}

async function getAuthSessionStateForAdminAccess(client: AdminAccessRpcClient) {
  return getAuthSessionState(
    client as unknown as Parameters<typeof getAuthSessionState>[0],
  );
}

function getOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function appendSearchParams(path: string, params: URLSearchParams) {
  const joiner = path.includes("?") ? "&" : "?";

  return `${path}${joiner}${params.toString()}`;
}
