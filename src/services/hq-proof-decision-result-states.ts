import {
  canMakeHqSharingDecision,
  type HqSharingDecisionInput,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getWriteReadinessSummary } from "@/services/write-readiness";
import type { EvidenceItem } from "@/shared/types/domain";

export type HqProofDecisionResultCode =
  | "already_decided"
  | "changes_requested"
  | "decision_noted_without_sharing"
  | "evidence_not_found"
  | "missing_auth"
  | "note_too_short"
  | "permission_denied"
  | "public_sharing_disabled"
  | "server_error"
  | "sharing_approved"
  | "write_disabled";

export type HqProofDecisionResultTone = "error" | "info" | "success" | "warning";

export type HqProofDecisionResultState = {
  code: HqProofDecisionResultCode;
  title: string;
  plainEnglishMessage: string;
  nextStep: string;
  tone: HqProofDecisionResultTone;
  success: boolean;
  retryAllowed: boolean;
  createsApproval: boolean;
  createsOutboxItem: boolean;
  publishesProof: false;
};

export type HqProofDecisionResultPreview = {
  operation: "hq_sharing_decision";
  currentResult: HqProofDecisionResultState;
  futureResultIfEnabled: HqProofDecisionResultState;
  serverResultShape: {
    success: boolean;
    errorCode?: HqProofDecisionResultCode;
    evidenceItemId: string;
    plainEnglishMessage: string;
  };
};

const hqProofDecisionResultStates = [
  {
    code: "sharing_approved",
    title: "Approved for future sharing review",
    plainEnglishMessage:
      "HQ marked this proof as useful to share later, but the app still should not publish it automatically.",
    nextStep:
      "Record the HQ decision, keep public sharing off, and wait for an approved publishing workflow.",
    tone: "success",
    success: true,
    retryAllowed: false,
    createsApproval: true,
    createsOutboxItem: true,
    publishesProof: false,
  },
  {
    code: "changes_requested",
    title: "More context requested",
    plainEnglishMessage:
      "HQ needs better context before this proof can help another chapter or university.",
    nextStep:
      "Record the request and route the student or chapter operator back to improve the testimonial.",
    tone: "warning",
    success: true,
    retryAllowed: false,
    createsApproval: true,
    createsOutboxItem: true,
    publishesProof: false,
  },
  {
    code: "decision_noted_without_sharing",
    title: "Decision recorded: do not share broadly",
    plainEnglishMessage:
      "HQ decided this proof should stay internal or chapter-scoped rather than being shared broadly.",
    nextStep: "Record the decision and keep the proof out of public or cross-campus surfaces.",
    tone: "info",
    success: true,
    retryAllowed: false,
    createsApproval: true,
    createsOutboxItem: true,
    publishesProof: false,
  },
  {
    code: "write_disabled",
    title: "HQ decision save is not turned on yet",
    plainEnglishMessage:
      "This review queue is safe to preview, but the app is not allowed to save HQ proof-sharing decisions from the browser yet.",
    nextStep:
      "Keep using the mock preview until Nick approves live auth and browser-facing writes.",
    tone: "info",
    success: false,
    retryAllowed: false,
    createsApproval: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "public_sharing_disabled",
    title: "Public sharing is not turned on yet",
    plainEnglishMessage:
      "Even an approved HQ decision must not publish proof or syndicate it externally until a later approved sharing workflow exists.",
    nextStep:
      "Record only the future intent; keep public proof library publishing and external sends disabled.",
    tone: "info",
    success: false,
    retryAllowed: false,
    createsApproval: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "already_decided",
    title: "This proof already has a final decision",
    plainEnglishMessage:
      "The proof already appears approved, so the app should not create a duplicate HQ sharing decision.",
    nextStep: "Show the existing decision and require an explicit future override workflow if needed.",
    tone: "warning",
    success: false,
    retryAllowed: false,
    createsApproval: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "permission_denied",
    title: "This role cannot make the HQ sharing decision",
    plainEnglishMessage:
      "Only HQ Admin or Super Admin should decide whether proof is shared beyond the chapter.",
    nextStep: "Switch to an HQ decision-making role or keep the queue read-only.",
    tone: "error",
    success: false,
    retryAllowed: false,
    createsApproval: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "missing_auth",
    title: "Sign-in is required",
    plainEnglishMessage:
      "The app must know which HQ user is signed in before it can save proof-sharing decisions.",
    nextStep: "After live auth is approved, send HQ staff through the sign-in flow.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsApproval: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "evidence_not_found",
    title: "Proof item was not found",
    plainEnglishMessage:
      "The review action does not match an existing proof or testimonial item.",
    nextStep: "Send the reviewer back to the proof queue and avoid saving anything.",
    tone: "error",
    success: false,
    retryAllowed: false,
    createsApproval: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "note_too_short",
    title: "Decision note needs more context",
    plainEnglishMessage:
      "HQ sharing decisions need a short explanation so future staff understand why the decision was made.",
    nextStep: "Ask for a plain-English note before saving the decision.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsApproval: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "server_error",
    title: "Something went wrong",
    plainEnglishMessage:
      "The app could not safely save this HQ decision. No publishing or external automation should run.",
    nextStep: "Show a friendly retry message and log the error for the product team.",
    tone: "error",
    success: false,
    retryAllowed: true,
    createsApproval: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
] as const satisfies readonly HqProofDecisionResultState[];

export function getHqProofDecisionResultStates(): readonly HqProofDecisionResultState[] {
  return hqProofDecisionResultStates;
}

export function getHqProofDecisionResultState(
  code: HqProofDecisionResultCode,
): HqProofDecisionResultState {
  const state = hqProofDecisionResultStates.find((item) => item.code === code);

  if (!state) {
    throw new Error(`Unknown HQ proof decision result code: ${code}`);
  }

  return state;
}

export function getFutureHqProofDecisionResultIfEnabled(
  actor: LocalActorContext | null,
  evidenceItem: EvidenceItem | null,
  input: HqSharingDecisionInput,
): HqProofDecisionResultState {
  if (!actor) {
    return getHqProofDecisionResultState("missing_auth");
  }

  if (!evidenceItem) {
    return getHqProofDecisionResultState("evidence_not_found");
  }

  if (!canMakeHqSharingDecision(actor)) {
    return getHqProofDecisionResultState("permission_denied");
  }

  if (input.note.trim().length < 8) {
    return getHqProofDecisionResultState("note_too_short");
  }

  if (evidenceItem.status === "approved") {
    return getHqProofDecisionResultState("already_decided");
  }

  if (input.decision === "approved") {
    return getHqProofDecisionResultState("sharing_approved");
  }

  if (input.decision === "changes_requested") {
    return getHqProofDecisionResultState("changes_requested");
  }

  return getHqProofDecisionResultState("decision_noted_without_sharing");
}

export function getDisabledHqProofDecisionResultPreview(
  actor: LocalActorContext,
  evidenceItem: EvidenceItem,
  input: HqSharingDecisionInput,
): HqProofDecisionResultPreview {
  const currentResult = getHqProofDecisionResultState("write_disabled");

  return {
    operation: "hq_sharing_decision",
    currentResult,
    futureResultIfEnabled: getFutureHqProofDecisionResultIfEnabled(
      actor,
      evidenceItem,
      input,
    ),
    serverResultShape: {
      success: false,
      errorCode: currentResult.code,
      evidenceItemId: evidenceItem.id,
      plainEnglishMessage: `${currentResult.plainEnglishMessage} ${getWriteReadinessSummary()}`,
    },
  };
}
