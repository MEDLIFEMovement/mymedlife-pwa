"use server";

import { redirect } from "next/navigation";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import {
  getAuthSessionState,
  type AuthSessionState,
} from "@/services/auth-session";
import {
  adminChapterOperationConfirmation,
  getAdminChapterConfirmationRequiredResult,
  getAdminChapterDisabledResult,
  getAdminChapterWriteConfig,
  hasAdminChapterSupabaseIds,
  mapAdminChapterRpcError,
  mapAdminChapterRpcSuccess,
  normalizeAdminChapterReturnTo,
  parseAdminChapterOperation,
  parseAdminChapterStatus,
  parseAdminStudentLeaderRole,
  type AdminChapterOperation,
  type AdminChapterRpcRow,
  type AdminChapterServerResult,
} from "@/services/admin-chapter-management-write";

type AdminChapterRpcParams = {
  operation_input: AdminChapterOperation;
  chapter_uuid: string | null;
  name_input: string | null;
  campus_input: string | null;
  region_input: string | null;
  status_input: string | null;
  target_user_uuid: string | null;
  role_key_input: string | null;
  audit_reason_input: string;
};

type AdminChapterRpcClient = {
  schema: (schemaName: "app") => {
    rpc: (
      functionName: "admin_manage_chapter",
      params: AdminChapterRpcParams,
    ) => Promise<{
      data: unknown;
      error: { code?: string; message?: string } | null;
    }>;
  };
};

type AdminChapterActionDeps = {
  createServerClient?: () => Promise<{
    client: AdminChapterRpcClient | null;
    config: { reason: string };
  }>;
  getSessionState?: (
    client: AdminChapterRpcClient,
  ) => Promise<AuthSessionState>;
};

const operationsThatRequireChapter = new Set<AdminChapterOperation>([
  "update_chapter",
  "archive_chapter",
  "disable_chapter",
  "assign_coach",
  "remove_coach",
  "assign_student_leader",
  "remove_student_leader",
]);

const operationsThatRequireTargetUser = new Set<AdminChapterOperation>([
  "assign_coach",
  "assign_student_leader",
  "remove_student_leader",
]);

export async function submitAdminChapterAction(formData: FormData) {
  const result = await submitAdminChapterForLocalSupabase(formData);
  const returnTo = normalizeAdminChapterReturnTo(formData.get("returnTo"));
  const chapterId = String(formData.get("chapterId") ?? "").trim();
  const operation = String(formData.get("operation") ?? "").trim();
  const params = new URLSearchParams({
    adminChapterResult: result.code,
    chapterId: result.success ? result.chapterId : chapterId,
    operation,
  });

  redirect(appendSearchParams(returnTo, params));
}

export async function submitAdminChapterForLocalSupabase(
  formData: FormData,
  deps: AdminChapterActionDeps = {},
): Promise<AdminChapterServerResult> {
  const config = getAdminChapterWriteConfig();

  if (!config.enabled) {
    return getAdminChapterDisabledResult(config.reason);
  }

  const operation = parseAdminChapterOperation(formData.get("operation"));
  const chapterId = getOptionalString(formData.get("chapterId"));
  const targetUserId = getOptionalString(formData.get("targetUserId"));
  const name = getOptionalString(formData.get("name"));
  const campus = getOptionalString(formData.get("campus"));
  const region = getOptionalString(formData.get("region"));
  const status = parseAdminChapterStatus(formData.get("status"));
  const roleKey = parseAdminStudentLeaderRole(formData.get("roleKey"));
  const auditReason = String(formData.get("auditReason") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (!operation) {
    return {
      success: false,
      code: "invalid_operation",
      chapterId: null,
      plainEnglishMessage:
        "Choose a supported chapter management operation before saving.",
    };
  }

  if (operationsThatRequireChapter.has(operation) && !chapterId) {
    return {
      success: false,
      code: "invalid_chapter",
      chapterId: null,
      plainEnglishMessage: "Choose the chapter before saving this change.",
    };
  }

  if (operationsThatRequireTargetUser.has(operation) && !targetUserId) {
    return {
      success: false,
      code: "invalid_user",
      chapterId: null,
      plainEnglishMessage: "Choose the user before saving this chapter change.",
    };
  }

  if (
    operation === "assign_student_leader" &&
    !roleKey
  ) {
    return {
      success: false,
      code: "invalid_role",
      chapterId: null,
      plainEnglishMessage: "Choose a valid student leader role before saving.",
    };
  }

  if (
    operation === "create_chapter" &&
    (!name || !campus)
  ) {
    return {
      success: false,
      code: "invalid_profile",
      chapterId: null,
      plainEnglishMessage: "Add the chapter name and school before creating it.",
    };
  }

  if (
    formData.has("status") &&
    String(formData.get("status") ?? "").trim().length > 0 &&
    !status
  ) {
    return {
      success: false,
      code: "invalid_status",
      chapterId: null,
      plainEnglishMessage: "Choose a supported chapter status before saving.",
    };
  }

  if (!hasAdminChapterSupabaseIds({ chapterId, targetUserId })) {
    return {
      success: false,
      code: "target_not_found",
      chapterId: null,
      plainEnglishMessage:
        "The selected chapter or user uses mock data instead of approved Supabase UUIDs, so no chapter changed.",
    };
  }

  const expectedConfirmation = adminChapterOperationConfirmation[operation];

  if (expectedConfirmation && confirmation !== expectedConfirmation) {
    return getAdminChapterConfirmationRequiredResult(
      `Type ${expectedConfirmation} before this chapter change can run.`,
    );
  }

  if (auditReason.length < 12) {
    return {
      success: false,
      code: "audit_reason_required",
      chapterId: null,
      plainEnglishMessage:
        "Add a clear audit reason so DS can explain why the chapter changed.",
    };
  }

  const createServerClient =
    deps.createServerClient ?? createSupabaseServerClientForAdminChapter;
  const { client, config: authConfig } = await createServerClient();

  if (!client) {
    return getAdminChapterDisabledResult(authConfig.reason);
  }

  const getSessionState =
    deps.getSessionState ?? getAuthSessionStateForAdminChapter;
  const authSession = await getSessionState(client);

  if (authSession.status !== "signed_in") {
    return {
      success: false,
      code: "missing_auth",
      chapterId: null,
      plainEnglishMessage:
        "Sign in with a DS Admin or Super Admin account before changing chapters.",
    };
  }

  const { data, error } = await client
    .schema("app")
    .rpc("admin_manage_chapter", {
      operation_input: operation,
      chapter_uuid: chapterId,
      name_input: name,
      campus_input: campus,
      region_input: region,
      status_input: status,
      target_user_uuid: targetUserId,
      role_key_input: roleKey,
      audit_reason_input: auditReason,
    });

  if (error) {
    return mapAdminChapterRpcError(error);
  }

  const firstRow = Array.isArray(data)
    ? (data[0] as AdminChapterRpcRow | undefined)
    : undefined;

  if (!firstRow) {
    return {
      success: false,
      code: "server_error",
      chapterId: null,
      plainEnglishMessage:
        "Supabase did not return the expected chapter management record. No external automation ran.",
    };
  }

  return mapAdminChapterRpcSuccess(firstRow);
}

async function createSupabaseServerClientForAdminChapter() {
  const { client, config } = await createLocalSupabaseServerClient();

  return {
    client: client as AdminChapterRpcClient | null,
    config,
  };
}

async function getAuthSessionStateForAdminChapter(
  client: AdminChapterRpcClient,
) {
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
