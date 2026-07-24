"use server";

import { redirect } from "next/navigation";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import {
  getActionStartAlreadyStartedServerResult,
  getActionStartStaleServerResult,
  getActionStartWriteConfig,
  isActionStartableStatus,
  isUuid,
  mapActionStartRpcError,
  mapActionStartRpcSuccess,
  parseActionStartStatus,
  type ActionStartRpcRow,
  type ActionStartServerResult,
} from "@/services/action-start-write";
import type { Assignment } from "@/shared/types/domain";
import {
  getProofSubmissionAccuracyRequiredServerResult,
  getProofSubmissionActionNotReadyServerResult,
  getProofSubmissionAlreadySubmittedServerResult,
  getProofSubmissionWriteConfig,
  isProofAccuracyConfirmed,
  mapProofSubmissionRpcError,
  mapProofSubmissionRpcSuccess,
  parseProofEvidenceType,
  type ProofSubmissionRpcRow,
  type ProofSubmissionServerResult,
} from "@/services/proof-submission-write";

export async function startAssignmentAction(formData: FormData) {
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const expectedStatus = parseActionStartStatus(
    String(formData.get("expectedStatus") ?? "").trim() || null,
  );
  const returnTo = normalizeReturnTo(formData.get("returnTo"), assignmentId);
  const result = await startAssignmentActionForSupabase(
    assignmentId,
    expectedStatus,
  );

  redirect(`${returnTo}?actionStartResult=${result.code}`);
}

export async function submitAssignmentProofAction(formData: FormData) {
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const returnTo = normalizeReturnTo(formData.get("returnTo"), assignmentId);
  const result = await submitAssignmentProofForLocalSupabase(formData);

  redirect(`${returnTo}?proofSubmissionResult=${result.code}`);
}

export async function startAssignmentActionForSupabase(
  assignmentId: string,
  expectedStatus: Assignment["status"] | null = null,
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
        "The current action does not use an app-owned Supabase UUID, so nothing was saved.",
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
        "Sign in with an eligible Supabase account before starting this action.",
    };
  }

  const { data, error } = await client
    .schema("app")
    .rpc("start_assignment_action", {
      assignment_uuid: assignmentId,
    });

  if (error) {
    const conflictResult = await getActionStartConflictResult(
      client,
      assignmentId,
      expectedStatus,
      error,
    );

    if (conflictResult) {
      return conflictResult;
    }

    return mapActionStartRpcError(assignmentId, error);
  }

  const firstRow = Array.isArray(data) ? (data[0] as ActionStartRpcRow | undefined) : undefined;

  if (!firstRow) {
    return {
      success: false,
      code: "server_error",
      assignmentId,
      plainEnglishMessage:
        "Supabase did not return the expected action-start record. No external automation ran.",
    };
  }

  return mapActionStartRpcSuccess(assignmentId, firstRow);
}

async function getActionStartConflictResult(
  client: NonNullable<
    Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"]
  >,
  assignmentId: string,
  expectedStatus: Assignment["status"] | null,
  error: { code?: string; message?: string },
): Promise<ActionStartServerResult | null> {
  const message = error.message?.toLowerCase() ?? "";

  if (error.code !== "42501" && !message.includes("cannot start")) {
    return null;
  }

  const currentStatus = await readCurrentAssignmentStatus(client, assignmentId);

  if (!currentStatus) {
    return null;
  }

  if (expectedStatus && currentStatus !== expectedStatus) {
    return getActionStartStaleServerResult(assignmentId, currentStatus);
  }

  if (!isActionStartableStatus(currentStatus)) {
    return getActionStartAlreadyStartedServerResult(assignmentId);
  }

  return null;
}

async function readCurrentAssignmentStatus(
  client: NonNullable<
    Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"]
  >,
  assignmentId: string,
): Promise<Assignment["status"] | null> {
  const { data } = await client
    .schema("app")
    .from("assignments")
    .select("status")
    .eq("id", assignmentId)
    .maybeSingle();

  const status =
    data && typeof data === "object" && "status" in data && typeof data.status === "string"
      ? data.status
      : null;

  return parseActionStartStatus(status);
}

export async function submitAssignmentProofForLocalSupabase(
  formData: FormData,
): Promise<ProofSubmissionServerResult> {
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const evidenceType = parseProofEvidenceType(formData.get("evidenceType"));
  const proofSummary = String(formData.get("proofSummary") ?? "").trim();
  const proofUrl = String(formData.get("proofUrl") ?? "").trim();
  const accuracyConfirmed = isProofAccuracyConfirmed(
    formData.get("accuracyConfirmed"),
  );
  const config = getProofSubmissionWriteConfig();

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
        "The current action does not use an app-owned Supabase UUID, so no proof was saved.",
    };
  }

  if (!evidenceType) {
    return {
      success: false,
      code: "server_error",
      assignmentId,
      plainEnglishMessage:
        "The proof type was not recognized. No upload or external automation ran.",
    };
  }

  if (proofSummary.length < 12) {
    return {
      success: false,
      code: "summary_too_short",
      assignmentId,
      plainEnglishMessage:
        "Add a short testimonial or context note before saving proof.",
    };
  }

  if (!accuracyConfirmed) {
    return getProofSubmissionAccuracyRequiredServerResult(assignmentId);
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
        "Sign in with an approved Supabase account before submitting proof.",
    };
  }

  const { data, error } = await client
    .schema("app")
    .rpc("submit_assignment_proof_metadata", {
      assignment_uuid: assignmentId,
      evidence_kind: evidenceType,
      proof_summary: proofSummary,
      proof_url: proofUrl || null,
      target_audiences_input: ["student", "chapter_leader"],
      proof_categories_input: ["rush_month", "belief_building"],
      messenger_type_input: "student",
      lifecycle_stage_input: "rush_month",
      hesitation_addressed_input: "Will I belong and know what to do next?",
      activity_label_input: "Rush Month action proof",
      nps_score_input: null,
    });

  if (error) {
    const conflictResult = await getProofSubmissionConflictResult(
      client,
      assignmentId,
      error,
    );

    if (conflictResult) {
      return conflictResult;
    }

    return mapProofSubmissionRpcError(assignmentId, error);
  }

  const firstRow = Array.isArray(data)
    ? (data[0] as ProofSubmissionRpcRow | undefined)
    : undefined;

  if (!firstRow) {
    return {
      success: false,
      code: "server_error",
      assignmentId,
      plainEnglishMessage:
        "Supabase did not return the expected proof-submission record. No upload or external automation ran.",
    };
  }

  return mapProofSubmissionRpcSuccess(assignmentId, firstRow);
}

async function getProofSubmissionConflictResult(
  client: NonNullable<
    Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"]
  >,
  assignmentId: string,
  error: { code?: string; message?: string },
): Promise<ProofSubmissionServerResult | null> {
  const message = error.message?.toLowerCase() ?? "";

  if (error.code !== "42501" && !message.includes("cannot submit proof")) {
    return null;
  }

  const currentStatus = await readCurrentAssignmentStatus(client, assignmentId);

  if (!currentStatus) {
    return null;
  }

  if (currentStatus === "submitted" || currentStatus === "approved") {
    return getProofSubmissionAlreadySubmittedServerResult(assignmentId);
  }

  if (currentStatus === "not_started") {
    return getProofSubmissionActionNotReadyServerResult(assignmentId);
  }

  return null;
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
