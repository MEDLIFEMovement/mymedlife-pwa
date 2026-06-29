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
import {
  getProofSubmissionWriteConfig,
  mapProofSubmissionRpcError,
  mapProofSubmissionRpcSuccess,
  parseProofEvidenceType,
  type ProofSubmissionRpcRow,
  type ProofSubmissionServerResult,
} from "@/services/proof-submission-write";

export async function startAssignmentAction(formData: FormData) {
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const returnTo = normalizeReturnTo(formData.get("returnTo"), assignmentId);
  const result = await startAssignmentActionForLocalSupabase(assignmentId);

  redirect(appendResultQuery(returnTo, "actionStartResult", result.code));
}

export async function submitAssignmentProofAction(formData: FormData) {
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const returnTo = normalizeReturnTo(formData.get("returnTo"), assignmentId);
  const result = await submitAssignmentProofForLocalSupabase(formData);

  redirect(appendResultQuery(returnTo, "proofSubmissionResult", result.code));
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
      plainEnglishMessage: config.isLocalOnly
        ? "Sign in with a local Supabase seed user before starting this action."
        : "Sign in through the approved staging review path before starting this action.",
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
        "Supabase did not return the expected action-start record. No external automation ran.",
    };
  }

  return mapActionStartRpcSuccess(assignmentId, firstRow);
}

export async function submitAssignmentProofForLocalSupabase(
  formData: FormData,
): Promise<ProofSubmissionServerResult> {
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const evidenceType = parseProofEvidenceType(formData.get("evidenceType"));
  const proofSummary = String(formData.get("proofSummary") ?? "").trim();
  const proofUrl = String(formData.get("proofUrl") ?? "").trim();
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
        "The current action uses mock data, not a local Supabase UUID, so no proof was saved.",
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
        "Sign in with a local Supabase seed user before submitting proof.",
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
        "Local Supabase did not return the expected proof-submission record. No upload or external automation ran.",
    };
  }

  return mapProofSubmissionRpcSuccess(assignmentId, firstRow);
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

function appendResultQuery(path: string, key: string, value: string) {
  const url = new URL(path, "https://mymedlife.local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}
