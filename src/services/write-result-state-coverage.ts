import { getActionStartResultStates } from "@/services/action-start-result-states";
import { getCoachDecisionResultStates } from "@/services/coach-decision-result-states";
import { getHqProofDecisionResultStates } from "@/services/hq-proof-decision-result-states";
import { getProofSubmissionResultStates } from "@/services/proof-submission-result-states";
import type { WriteOperation } from "@/services/write-readiness";

export type WriteResultStateCoverageStatus = "covered" | "missing";

export type WriteResultStateCoverageItem = {
  operation: WriteOperation;
  route: string;
  status: WriteResultStateCoverageStatus;
  resultStateCount: number;
  successStateCount: number;
  blockedStateCount: number;
  externalWritesStayDisabled: boolean;
  notes: string;
  nextAction: string;
};

export type WriteResultStateCoverageSummary = {
  totalCandidateCount: number;
  coveredCount: number;
  missingCount: number;
  allCandidatesCovered: boolean;
  browserWritesEnabled: false;
  externalWritesEnabled: false;
  items: readonly WriteResultStateCoverageItem[];
};

export function getWriteResultStateCoverageSummary(): WriteResultStateCoverageSummary {
  const items = [
    buildCoveredItem({
      operation: "action_started",
      route: "/rush-month/actions/[assignmentId]",
      stateCount: getActionStartResultStates().length,
      successCount: getActionStartResultStates().filter((state) => state.success).length,
      notes: "Action-start success, disabled, duplicate, auth, permission, not-found, and error states are defined.",
      nextAction:
        "Keep disabled until live auth, server action identity, RLS, and rollback review are approved.",
    }),
    buildMissingItem({
      operation: "action_assigned",
      route: "/rush-month/actions",
      notes:
        "Leader assignment creation has a browser write gate, but no reviewed result-state copy yet.",
      nextAction:
        "Define assignment-create success, duplicate/validation, permission, disabled, and external-reminder-disabled states before activation.",
    }),
    buildCoveredItem({
      operation: "evidence_submitted",
      route: "/rush-month/actions/[assignmentId]",
      stateCount: getProofSubmissionResultStates().length,
      successCount: getProofSubmissionResultStates().filter((state) => state.success)
        .length,
      notes: "Proof submission success, disabled, upload-disabled, duplicate, auth, permission, not-ready, not-found, validation, and error states are defined.",
      nextAction:
        "Keep disabled until live auth, proof metadata write activation, and upload-disabled behavior are approved.",
    }),
    buildCoveredItem({
      operation: "hq_sharing_decision",
      route: "/rush-month/review",
      stateCount: getHqProofDecisionResultStates().length,
      successCount: getHqProofDecisionResultStates().filter((state) => state.success)
        .length,
      notes: "HQ sharing approval, changes-requested, do-not-share, disabled, public-sharing-disabled, auth, permission, duplicate, validation, and error states are defined.",
      nextAction:
        "Keep disabled until HQ decision writes and separate public proof-publishing workflows are approved.",
    }),
    buildCoveredItem({
      operation: "coach_decision_logged",
      route: "/coach",
      stateCount: getCoachDecisionResultStates().length,
      successCount: getCoachDecisionResultStates().filter((state) => state.success)
        .length,
      notes: "Coach advance, hold, intervene, disabled, escalation-disabled, auth, permission, portfolio, validation, and error states are defined.",
      nextAction:
        "Keep disabled until coach decision writes and any future n8n escalation packet activation are approved.",
    }),
  ] as const satisfies readonly WriteResultStateCoverageItem[];
  const coveredCount = items.filter((item) => item.status === "covered").length;
  const missingCount = items.length - coveredCount;

  return {
    totalCandidateCount: items.length,
    coveredCount,
    missingCount,
    allCandidatesCovered: missingCount === 0,
    browserWritesEnabled: false,
    externalWritesEnabled: false,
    items,
  };
}

function buildCoveredItem(input: {
  operation: WriteOperation;
  route: string;
  stateCount: number;
  successCount: number;
  notes: string;
  nextAction: string;
}): WriteResultStateCoverageItem {
  return {
    operation: input.operation,
    route: input.route,
    status: "covered",
    resultStateCount: input.stateCount,
    successStateCount: input.successCount,
    blockedStateCount: input.stateCount - input.successCount,
    externalWritesStayDisabled: true,
    notes: input.notes,
    nextAction: input.nextAction,
  };
}

function buildMissingItem(input: {
  operation: WriteOperation;
  route: string;
  notes: string;
  nextAction: string;
}): WriteResultStateCoverageItem {
  return {
    operation: input.operation,
    route: input.route,
    status: "missing",
    resultStateCount: 0,
    successStateCount: 0,
    blockedStateCount: 0,
    externalWritesStayDisabled: true,
    notes: input.notes,
    nextAction: input.nextAction,
  };
}
