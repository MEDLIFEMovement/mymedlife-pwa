import {
  canSubmitProofForAssignment,
  type ProofSubmissionInput,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getWriteReadinessSummary } from "@/services/write-readiness";
import type { Assignment } from "@/shared/types/domain";

export type ProofSubmissionResultCode =
  | "action_not_ready"
  | "already_submitted"
  | "assignment_not_found"
  | "missing_auth"
  | "permission_denied"
  | "proof_submitted"
  | "server_error"
  | "summary_too_short"
  | "upload_disabled"
  | "write_disabled";

export type ProofSubmissionResultTone = "error" | "info" | "success" | "warning";

export type ProofSubmissionResultState = {
  code: ProofSubmissionResultCode;
  title: string;
  plainEnglishMessage: string;
  nextStep: string;
  tone: ProofSubmissionResultTone;
  success: boolean;
  retryAllowed: boolean;
  createsEvidenceItem: boolean;
  createsOutboxItem: boolean;
};

export type ProofSubmissionResultPreview = {
  operation: "evidence_submitted";
  currentResult: ProofSubmissionResultState;
  futureResultIfEnabled: ProofSubmissionResultState;
  serverResultShape: {
    success: boolean;
    errorCode?: ProofSubmissionResultCode;
    assignmentId: string;
    plainEnglishMessage: string;
  };
};

const proofSubmissionResultStates = [
  {
    code: "proof_submitted",
    title: "Proof submitted for HQ review",
    plainEnglishMessage:
      "Your testimonial or proof note is saved for MEDLIFE headquarters to review before any broader sharing.",
    nextStep:
      "Show the pending HQ review state and keep public sharing off until HQ decides.",
    tone: "success",
    success: true,
    retryAllowed: false,
    createsEvidenceItem: true,
    createsOutboxItem: true,
  },
  {
    code: "write_disabled",
    title: "Proof save is not turned on yet",
    plainEnglishMessage:
      "This proof form is safe to preview, but the app is not allowed to save proof from the browser yet.",
    nextStep:
      "Keep using the mock preview until Nick approves live auth and browser-facing writes.",
    tone: "info",
    success: false,
    retryAllowed: false,
    createsEvidenceItem: false,
    createsOutboxItem: false,
  },
  {
    code: "upload_disabled",
    title: "File uploads are not turned on yet",
    plainEnglishMessage:
      "Bridge videos and photos can be described or linked in the mock app, but this path cannot upload files yet.",
    nextStep:
      "Use a link or note in the preview and wait for a later approved proof-storage goal before uploads.",
    tone: "info",
    success: false,
    retryAllowed: false,
    createsEvidenceItem: false,
    createsOutboxItem: false,
  },
  {
    code: "action_not_ready",
    title: "Finish the action before submitting proof",
    plainEnglishMessage:
      "The action has not been started yet, so proof should not be submitted for it.",
    nextStep: "Start the action first, then come back with a testimonial, link, or note.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsEvidenceItem: false,
    createsOutboxItem: false,
  },
  {
    code: "already_submitted",
    title: "Proof is already submitted",
    plainEnglishMessage:
      "This action already has submitted or approved proof, so the app should not create a duplicate proof item.",
    nextStep: "Show the existing proof status or ask HQ to request changes if something is missing.",
    tone: "warning",
    success: false,
    retryAllowed: false,
    createsEvidenceItem: false,
    createsOutboxItem: false,
  },
  {
    code: "permission_denied",
    title: "This role cannot submit proof here",
    plainEnglishMessage:
      "Proof submission belongs to student and chapter operators, not coaches, DS Admins, or unrelated staff roles.",
    nextStep: "Switch to the correct local role or ask the chapter owner to submit proof.",
    tone: "error",
    success: false,
    retryAllowed: false,
    createsEvidenceItem: false,
    createsOutboxItem: false,
  },
  {
    code: "missing_auth",
    title: "Sign-in is required",
    plainEnglishMessage:
      "The app must know who is signed in before it can save proof or testimonial metadata.",
    nextStep: "After live auth is approved, send the student through the sign-in flow.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsEvidenceItem: false,
    createsOutboxItem: false,
  },
  {
    code: "assignment_not_found",
    title: "Action was not found",
    plainEnglishMessage:
      "The proof link does not match an active assignment in this chapter.",
    nextStep: "Send the student back to My Actions and avoid saving proof.",
    tone: "error",
    success: false,
    retryAllowed: false,
    createsEvidenceItem: false,
    createsOutboxItem: false,
  },
  {
    code: "summary_too_short",
    title: "Proof needs more context",
    plainEnglishMessage:
      "The proof note needs enough context for HQ to understand what happened and why it matters.",
    nextStep:
      "Ask for a short testimonial, event context, or bridge-video summary before saving.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsEvidenceItem: false,
    createsOutboxItem: false,
  },
  {
    code: "server_error",
    title: "Something went wrong",
    plainEnglishMessage:
      "The app could not safely save this proof item. No HQ sharing or external automation should run.",
    nextStep: "Show a friendly retry message and log the error for the product team.",
    tone: "error",
    success: false,
    retryAllowed: true,
    createsEvidenceItem: false,
    createsOutboxItem: false,
  },
] as const satisfies readonly ProofSubmissionResultState[];

export function getProofSubmissionResultStates(): readonly ProofSubmissionResultState[] {
  return proofSubmissionResultStates;
}

export function getProofSubmissionResultState(
  code: ProofSubmissionResultCode,
): ProofSubmissionResultState {
  const state = proofSubmissionResultStates.find((item) => item.code === code);

  if (!state) {
    throw new Error(`Unknown proof submission result code: ${code}`);
  }

  return state;
}

export function getFutureProofSubmissionResultIfEnabled(
  actor: LocalActorContext | null,
  assignment: Assignment | null,
  input: ProofSubmissionInput,
): ProofSubmissionResultState {
  if (!actor) {
    return getProofSubmissionResultState("missing_auth");
  }

  if (!assignment) {
    return getProofSubmissionResultState("assignment_not_found");
  }

  if (!canSubmitProofForAssignment(actor, assignment)) {
    return getProofSubmissionResultState("permission_denied");
  }

  if (input.summary.trim().length < 12) {
    return getProofSubmissionResultState("summary_too_short");
  }

  if (assignment.status === "not_started") {
    return getProofSubmissionResultState("action_not_ready");
  }

  if (assignment.status === "submitted" || assignment.status === "approved") {
    return getProofSubmissionResultState("already_submitted");
  }

  return getProofSubmissionResultState("proof_submitted");
}

export function getDisabledProofSubmissionResultPreview(
  actor: LocalActorContext,
  assignment: Assignment,
  input: ProofSubmissionInput,
): ProofSubmissionResultPreview {
  const currentResult = getProofSubmissionResultState("write_disabled");

  return {
    operation: "evidence_submitted",
    currentResult,
    futureResultIfEnabled: getFutureProofSubmissionResultIfEnabled(
      actor,
      assignment,
      input,
    ),
    serverResultShape: {
      success: false,
      errorCode: currentResult.code,
      assignmentId: assignment.id,
      plainEnglishMessage: `${currentResult.plainEnglishMessage} ${getWriteReadinessSummary()}`,
    },
  };
}
