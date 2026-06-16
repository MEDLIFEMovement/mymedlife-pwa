"use server";

import { redirect } from "next/navigation";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import {
  getActionStartWriteConfig,
  isUuid,
  mapActionStartRpcError,
  mapActionStartRpcSuccess,
  type ActionStartRpcRow,
  type ActionStartServerResult,
} from "@/services/action-start-write";

export async function startAssignmentAction(formData: FormData) {
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const returnTo = normalizeReturnTo(formData.get("returnTo"), assignmentId);
  const result = await startAssignmentActionForLocalSupabase(assignmentId);

  redirect(`${returnTo}?actionStartResult=${result.code}`);
}

export async function startAssignmentActionForLocalSupabase(
  assignmentId: string,
): Promise<ActionStartServerResult> {
  const config = getActionStartWriteConfig();

  if (!config.enabled) {
    return {
      success: false,
      code: "write_disabled",
      assignmentId,
      plainEnglishMessage: config.reason,
    };
  }

  if (!isUuid(assignmentId)) {
    return {
      success: false,
      code: "assignment_not_found",
      assignmentId,
      plainEnglishMessage:
        "The current action uses mock data, not a local Supabase UUID, so nothing was saved.",
    };
  }

  const { client, config: authConfig } = await createLocalSupabaseServerClient();

  if (!client) {
    return {
      success: false,
      code: "write_disabled",
      assignmentId,
      plainEnglishMessage: authConfig.reason,
    };
  }

  const authSession = await getAuthSessionState(client);

  if (authSession.status !== "signed_in") {
    return {
      success: false,
      code: "missing_auth",
      assignmentId,
      plainEnglishMessage:
        "Sign in with a local Supabase seed user before starting this action.",
    };
  }

  const { data, error } = await client
    .schema("app")
    .rpc("start_assignment_action", {
      assignment_uuid: assignmentId,
    });

  if (error) {
    return mapActionStartRpcError(assignmentId, error);
  }

  const firstRow = Array.isArray(data) ? (data[0] as ActionStartRpcRow | undefined) : undefined;

  if (!firstRow) {
    return {
      success: false,
      code: "server_error",
      assignmentId,
      plainEnglishMessage:
        "Local Supabase did not return the expected action-start record. No external automation ran.",
    };
  }

  return mapActionStartRpcSuccess(assignmentId, firstRow);
}

function normalizeReturnTo(value: FormDataEntryValue | null, assignmentId: string) {
  if (typeof value !== "string") {
    return `/rush-month/actions/${assignmentId}`;
  }

  const trimmed = value.trim();

  if (
    !trimmed.startsWith("/rush-month/actions/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\n") ||
    trimmed.includes("\r")
  ) {
    return `/rush-month/actions/${assignmentId}`;
  }

  return trimmed;
}
