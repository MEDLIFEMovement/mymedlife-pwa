import { canRecordLeaderProofDecision as canRecordLeaderProofDecisionInContract } from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { LeaderProofDecisionValue } from "@/services/leader-proof-decision-workspace";
import { getWriteReadinessSummary } from "@/services/write-readiness";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";

export type LeaderProofDecisionResultCode =
  | "already_approved"
  | "changes_requested"
  | "evidence_not_found"
  | "missing_auth"
  | "note_too_short"
  | "permission_denied"
  | "points_disabled"
  | "proof_approved"
  | "proof_not_submitted"
  | "proof_rejected"
  | "server_error"
  | "write_disabled";

export type LeaderProofDecisionResultTone =
  | "error"
  | "info"
  | "success"
  | "warning";

export type LeaderProofDecisionInput = {
  decision: LeaderProofDecisionValue;
  note: string;
};

export type LeaderProofDecisionResultState = {
  code: LeaderProofDecisionResultCode;
  title: string;
  plainEnglishMessage: string;
  nextStep: string;
  tone: LeaderProofDecisionResultTone;
  success: boolean;
  retryAllowed: boolean;
  structuredEvent: string | null;
  auditAction: string | null;
  updatesEvidenceStatus: boolean;
  createsApproval: boolean;
  createsPointsEvent: boolean;
  createsKpiEvent: boolean;
  createsOutboxItem: boolean;
  publishesProof: false;
};

export type LeaderProofDecisionResultPreview = {
  operation: "leader_proof_decision";
  currentResult: LeaderProofDecisionResultState;
  futureResultIfEnabled: LeaderProofDecisionResultState;
  serverResultShape: {
    success: false;
    errorCode: LeaderProofDecisionResultCode;
    assignmentId: string;
    evidenceItemId: string | null;
    plainEnglishMessage: string;
  };
};

const leaderProofDecisionResultStates = [
  {
    code: "proof_approved",
    title: "Proof approved for chapter completion",
    plainEnglishMessage:
      "The leader decision would mark the submitted proof as approved for the chapter action, unlock local points, and update KPI posture.",
    nextStep:
      "Record the decision, points event, KPI event, integration event, disabled outbox row, and audit log without publishing proof broadly.",
    tone: "success",
    success: true,
    retryAllowed: false,
    structuredEvent: "evidence_approved",
    auditAction: "leader_proof_approved",
    updatesEvidenceStatus: true,
    createsApproval: true,
    createsPointsEvent: true,
    createsKpiEvent: true,
    createsOutboxItem: true,
    publishesProof: false,
  },
  {
    code: "changes_requested",
    title: "Changes requested from the owner",
    plainEnglishMessage:
      "The leader decision would return the proof to the owner with a clear request before it counts toward points or KPI movement.",
    nextStep:
      "Record the change request, keep points locked, and create only a disabled follow-up outbox row until notifications are approved.",
    tone: "warning",
    success: true,
    retryAllowed: false,
    structuredEvent: "evidence_changes_requested",
    auditAction: "leader_proof_changes_requested",
    updatesEvidenceStatus: true,
    createsApproval: true,
    createsPointsEvent: false,
    createsKpiEvent: false,
    createsOutboxItem: true,
    publishesProof: false,
  },
  {
    code: "proof_rejected",
    title: "Proof rejected for this action",
    plainEnglishMessage:
      "The leader decision would reject the proof for chapter completion while preserving the audit trail and keeping public sharing unavailable.",
    nextStep:
      "Record the rejection reason, keep points locked, and require a new proof submission before the action can count.",
    tone: "error",
    success: true,
    retryAllowed: false,
    structuredEvent: "evidence_rejected",
    auditAction: "leader_proof_rejected",
    updatesEvidenceStatus: true,
    createsApproval: true,
    createsPointsEvent: false,
    createsKpiEvent: false,
    createsOutboxItem: true,
    publishesProof: false,
  },
  {
    code: "write_disabled",
    title: "Leader proof decision save is not turned on yet",
    plainEnglishMessage:
      "The review workspace can preview leader decisions, but the browser is not allowed to save approve, request-changes, or reject decisions yet.",
    nextStep:
      "Keep using the read-only preview until auth, RLS, audit readback, points, KPI, and rollback gates are approved.",
    tone: "info",
    success: false,
    retryAllowed: false,
    structuredEvent: null,
    auditAction: null,
    updatesEvidenceStatus: false,
    createsApproval: false,
    createsPointsEvent: false,
    createsKpiEvent: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "points_disabled",
    title: "Points and KPI writes are not turned on yet",
    plainEnglishMessage:
      "Even an approved leader decision must not award points or move KPIs until the points and KPI ledger writes are approved.",
    nextStep:
      "Use this state as a safety reminder before enabling any approval path that touches recognition or metrics.",
    tone: "info",
    success: false,
    retryAllowed: false,
    structuredEvent: null,
    auditAction: null,
    updatesEvidenceStatus: false,
    createsApproval: false,
    createsPointsEvent: false,
    createsKpiEvent: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "already_approved",
    title: "This proof is already approved",
    plainEnglishMessage:
      "The action already appears approved, so the app should not create another leader approval, points event, or KPI event.",
    nextStep:
      "Show the existing approved state and require a future override workflow before changing the decision.",
    tone: "warning",
    success: false,
    retryAllowed: false,
    structuredEvent: null,
    auditAction: null,
    updatesEvidenceStatus: false,
    createsApproval: false,
    createsPointsEvent: false,
    createsKpiEvent: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "permission_denied",
    title: "This role cannot save chapter proof decisions",
    plainEnglishMessage:
      "Chapter proof decisions should be recorded by chapter leaders or Super Admin support, not members, coaches, Admin, or DS Admin.",
    nextStep:
      "Switch to a chapter leader or Super Admin review context, or keep the workspace read-only.",
    tone: "error",
    success: false,
    retryAllowed: false,
    structuredEvent: null,
    auditAction: null,
    updatesEvidenceStatus: false,
    createsApproval: false,
    createsPointsEvent: false,
    createsKpiEvent: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "missing_auth",
    title: "Sign-in is required",
    plainEnglishMessage:
      "The app must know which leader is signed in before it can save a chapter proof decision.",
    nextStep:
      "After live auth is approved, require a signed-in chapter leader or Super Admin session.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    structuredEvent: null,
    auditAction: null,
    updatesEvidenceStatus: false,
    createsApproval: false,
    createsPointsEvent: false,
    createsKpiEvent: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "evidence_not_found",
    title: "Proof item was not found",
    plainEnglishMessage:
      "The decision does not match a visible submitted proof item, so the app should not save anything.",
    nextStep:
      "Send the reviewer back to the proof queue and ask them to choose a visible proof row.",
    tone: "error",
    success: false,
    retryAllowed: false,
    structuredEvent: null,
    auditAction: null,
    updatesEvidenceStatus: false,
    createsApproval: false,
    createsPointsEvent: false,
    createsKpiEvent: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "proof_not_submitted",
    title: "Proof has not been submitted yet",
    plainEnglishMessage:
      "The assignment does not have submitted proof, so a leader cannot approve, request changes, or reject it yet.",
    nextStep:
      "Ask the owner to submit proof before displaying decision save controls.",
    tone: "warning",
    success: false,
    retryAllowed: false,
    structuredEvent: null,
    auditAction: null,
    updatesEvidenceStatus: false,
    createsApproval: false,
    createsPointsEvent: false,
    createsKpiEvent: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "note_too_short",
    title: "Decision note needs more context",
    plainEnglishMessage:
      "Leader proof decisions need a short explanation so the owner, coach, and future staff understand the reason.",
    nextStep:
      "Ask for a plain-English note before saving the leader proof decision.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    structuredEvent: null,
    auditAction: null,
    updatesEvidenceStatus: false,
    createsApproval: false,
    createsPointsEvent: false,
    createsKpiEvent: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
  {
    code: "server_error",
    title: "Something went wrong",
    plainEnglishMessage:
      "The app could not safely save this leader proof decision. No points, KPI, notification, or sharing action should run.",
    nextStep:
      "Show a friendly retry message and log the error for the product team.",
    tone: "error",
    success: false,
    retryAllowed: true,
    structuredEvent: null,
    auditAction: null,
    updatesEvidenceStatus: false,
    createsApproval: false,
    createsPointsEvent: false,
    createsKpiEvent: false,
    createsOutboxItem: false,
    publishesProof: false,
  },
] as const satisfies readonly LeaderProofDecisionResultState[];

export function getLeaderProofDecisionResultStates(): readonly LeaderProofDecisionResultState[] {
  return leaderProofDecisionResultStates;
}

export function getLeaderProofDecisionResultState(
  code: LeaderProofDecisionResultCode,
): LeaderProofDecisionResultState {
  const state = leaderProofDecisionResultStates.find((item) => item.code === code);

  if (!state) {
    throw new Error(`Unknown leader proof decision result code: ${code}`);
  }

  return state;
}

export function getFutureLeaderProofDecisionResultIfEnabled(
  actor: LocalActorContext | null,
  assignment: Assignment | null,
  evidenceItem: EvidenceItem | null,
  input: LeaderProofDecisionInput,
): LeaderProofDecisionResultState {
  if (!actor) {
    return getLeaderProofDecisionResultState("missing_auth");
  }

  if (!assignment) {
    return getLeaderProofDecisionResultState("evidence_not_found");
  }

  if (!evidenceItem) {
    return getLeaderProofDecisionResultState("proof_not_submitted");
  }

  if (!canRecordLeaderProofDecision(actor)) {
    return getLeaderProofDecisionResultState("permission_denied");
  }

  if (input.note.trim().length < 12) {
    return getLeaderProofDecisionResultState("note_too_short");
  }

  if (assignment.status === "approved" || evidenceItem.status === "approved") {
    return getLeaderProofDecisionResultState("already_approved");
  }

  switch (input.decision) {
    case "approve":
      return getLeaderProofDecisionResultState("proof_approved");
    case "request_changes":
      return getLeaderProofDecisionResultState("changes_requested");
    case "reject":
      return getLeaderProofDecisionResultState("proof_rejected");
  }
}

export function getDisabledLeaderProofDecisionResultPreview(
  actor: LocalActorContext,
  assignment: Assignment,
  evidenceItem: EvidenceItem | null,
  input: LeaderProofDecisionInput,
): LeaderProofDecisionResultPreview {
  const currentResult = getLeaderProofDecisionResultState("write_disabled");

  return {
    operation: "leader_proof_decision",
    currentResult,
    futureResultIfEnabled: getFutureLeaderProofDecisionResultIfEnabled(
      actor,
      assignment,
      evidenceItem,
      input,
    ),
    serverResultShape: {
      success: false,
      errorCode: currentResult.code,
      assignmentId: assignment.id,
      evidenceItemId: evidenceItem?.id ?? null,
      plainEnglishMessage: `${currentResult.plainEnglishMessage} ${getWriteReadinessSummary()}`,
    },
  };
}

function canRecordLeaderProofDecision(actor: LocalActorContext): boolean {
  return canRecordLeaderProofDecisionInContract(actor);
}
