import type { LocalActorContext } from "@/services/local-actor-context";
import {
  canReadAssignment,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
  getVisibleAssignmentsForActor,
} from "@/services/role-visibility";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";

export type LeaderProofDecisionStatus =
  | "ready_for_approval"
  | "needs_changes"
  | "not_ready"
  | "already_approved";

export type LeaderProofDecisionValue = "approve" | "request_changes" | "reject";

export type LeaderProofDecisionOption = {
  value: LeaderProofDecisionValue;
  label: string;
  disabledReason: string;
};

export type LeaderProofReviewRubricItem = {
  label: string;
  question: string;
  passSignal: string;
};

export type LeaderProofDecisionRow = {
  key: string;
  assignmentId: string;
  evidenceId: string | null;
  assignmentTitle: string;
  ownerLabel: string;
  dueLabel: string;
  status: LeaderProofDecisionStatus;
  recommendedDecision: LeaderProofDecisionValue;
  evidenceSummary: string;
  proofTypeLabel: string;
  leaderNextStep: string;
  hqSharingBoundary: string;
  storyContextPrompt: string;
  pointsKpiImpact: string;
  recommendedDecisionRationale: string;
  reviewRubric: LeaderProofReviewRubricItem[];
  decisionOptions: LeaderProofDecisionOption[];
  futureStructuredEvent: string;
  auditAction: string;
  browserWritesExpected: 0;
  externalWritesExpected: 0;
};

export type LeaderProofDecisionWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  rows: LeaderProofDecisionRow[];
  counts: {
    total: number;
    readyForApproval: number;
    needsChanges: number;
    notReady: number;
    alreadyApproved: number;
    browserWritesEnabled: 0;
    externalWritesEnabled: 0;
  };
  finalPrompt: string;
};

export function getLeaderProofDecisionWorkspace(
  actor: LocalActorContext,
  assignments: Assignment[],
  evidenceItems: EvidenceItem[],
): LeaderProofDecisionWorkspace {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadLeaderProofDecisionWorkspace(surfaceFamily)) {
    return {
      canReadWorkspace: false,
      title: getTitle(surfaceFamily),
      summary:
        "Chapter proof decisions are visible to chapter leaders and HQ staff, not members, coaches, or DS Admin.",
      rows: [],
      counts: emptyCounts(),
      finalPrompt: "",
    };
  }

  const rows = getDecisionAssignments(actor, assignments).map((assignment) => {
    return toDecisionRow(
      assignment,
      evidenceItems.find((item) => item.assignmentId === assignment.id),
    );
  });

  return {
    canReadWorkspace: true,
    title: getTitle(surfaceFamily),
    summary:
      "Review the chapter-level proof decisions leaders need for points and KPI movement: approve, request changes, or reject. These controls are still disabled, and HQ broad sharing remains separate.",
    rows,
    counts: {
      total: rows.length,
      readyForApproval: rows.filter((row) => row.status === "ready_for_approval")
        .length,
      needsChanges: rows.filter((row) => row.status === "needs_changes").length,
      notReady: rows.filter((row) => row.status === "not_ready").length,
      alreadyApproved: rows.filter((row) => row.status === "already_approved").length,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
    },
    finalPrompt:
      "Use this to review the chapter proof decision model only. Do not enable proof decisions, points ledger writes, member nudges, public proof sharing, exports, or AI summaries until auth, RLS, audit readback, and approval gates are current.",
  };
}

function canReadLeaderProofDecisionWorkspace(surfaceFamily: ActorSurfaceFamily): boolean {
  return (
    surfaceFamily === "leader" ||
    surfaceFamily === "staff" ||
    surfaceFamily === "super_admin"
  );
}

function getDecisionAssignments(
  actor: LocalActorContext,
  assignments: Assignment[],
): Assignment[] {
  return getVisibleAssignmentsForActor(actor, assignments).filter((assignment) => {
    return assignment.lane !== "Coach" && canReadAssignment(actor, assignment);
  });
}

function toDecisionRow(
  assignment: Assignment,
  evidence: EvidenceItem | undefined,
): LeaderProofDecisionRow {
  const status = getDecisionStatus(assignment, evidence);
  const recommendedDecision = getRecommendedDecision(status);

  return {
    key: evidence?.id ?? `proof-decision-${assignment.id}`,
    assignmentId: assignment.id,
    evidenceId: evidence?.id ?? null,
    assignmentTitle: assignment.title,
    ownerLabel: assignment.ownerRole,
    dueLabel: assignment.dueLabel,
    status,
    recommendedDecision,
    evidenceSummary: evidence?.summary ?? "No proof has been submitted yet.",
    proofTypeLabel: evidence?.evidenceType.replaceAll("_", " ") ?? assignment.evidenceRequired,
    leaderNextStep: getLeaderNextStep(status, assignment, evidence),
    hqSharingBoundary:
      "This chapter decision only affects local proof, points, and KPI posture. HQ still owns broad proof sharing or public reuse.",
    storyContextPrompt: getStoryContextPrompt(status, assignment, evidence),
    pointsKpiImpact: `${assignment.points} local points and KPI: ${assignment.kpi}.`,
    recommendedDecisionRationale: getRecommendedDecisionRationale(status),
    reviewRubric: getReviewRubric(assignment),
    decisionOptions: decisionOptions,
    futureStructuredEvent: getFutureStructuredEvent(recommendedDecision),
    auditAction: getAuditAction(recommendedDecision),
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}

function getDecisionStatus(
  assignment: Assignment,
  evidence: EvidenceItem | undefined,
): LeaderProofDecisionStatus {
  if (evidence?.status === "approved" || assignment.status === "approved") {
    return "already_approved";
  }

  if (evidence?.status === "pending_review" || assignment.status === "submitted") {
    return "ready_for_approval";
  }

  if (evidence?.status === "changes_requested" || assignment.status === "changes_requested") {
    return "needs_changes";
  }

  return "not_ready";
}

function getRecommendedDecision(
  status: LeaderProofDecisionStatus,
): LeaderProofDecisionValue {
  switch (status) {
    case "ready_for_approval":
    case "already_approved":
      return "approve";
    case "needs_changes":
    case "not_ready":
      return "request_changes";
  }
}

function getLeaderNextStep(
  status: LeaderProofDecisionStatus,
  assignment: Assignment,
  evidence: EvidenceItem | undefined,
): string {
  switch (status) {
    case "ready_for_approval":
      return "Review the proof against the assignment ask, then approve only after the owner and story context are clear.";
    case "needs_changes":
      return evidence
        ? "Request clearer context from the owner before this counts toward points or KPI movement."
        : `Ask the owner to submit clearer proof for: ${assignment.evidenceRequired}`;
    case "not_ready":
      return "Wait for proof or nudge the owner before making a decision.";
    case "already_approved":
      return "Treat this as complete for chapter learning unless HQ asks for a separate sharing packet.";
  }
}

function getStoryContextPrompt(
  status: LeaderProofDecisionStatus,
  assignment: Assignment,
  evidence: EvidenceItem | undefined,
): string {
  switch (status) {
    case "ready_for_approval":
      return evidence
        ? "Confirm the proof explains what happened, who it helped, and why it answers the assignment ask."
        : "Confirm the submitted proof explains the action result before approving it.";
    case "needs_changes":
      return "Ask for the missing story: what happened, who it helped, and why this proof answers a student concern.";
    case "not_ready":
      return `Wait for proof that answers this requirement: ${assignment.evidenceRequired}`;
    case "already_approved":
      return "Use the approved proof as internal learning unless HQ separately asks for a sharing packet.";
  }
}

function getRecommendedDecisionRationale(
  status: LeaderProofDecisionStatus,
): string {
  switch (status) {
    case "ready_for_approval":
      return "Approve only when every rubric check is clear; otherwise request changes.";
    case "needs_changes":
      return "Request changes because the proof still needs clearer context before points or KPI movement.";
    case "not_ready":
      return "Request changes or wait because proof is not ready for a final decision.";
    case "already_approved":
      return "Keep as approved and avoid creating a duplicate points, KPI, or audit record.";
  }
}

function getReviewRubric(assignment: Assignment): LeaderProofReviewRubricItem[] {
  return [
    {
      label: "Assignment fit",
      question: `Does the proof directly answer: ${assignment.evidenceRequired}`,
      passSignal: "The evidence matches the task instead of only showing general activity.",
    },
    {
      label: "Story context",
      question: "Does it say what happened, who it helped, and why it matters?",
      passSignal: "A future coach or HQ reviewer could understand the student-facing outcome.",
    },
    {
      label: "Points and KPI",
      question: `Would approval fairly support ${assignment.points} points and KPI movement for ${assignment.kpi}?`,
      passSignal: "Points and KPI posture are earned by the proof, not by intention alone.",
    },
    {
      label: "Sharing boundary",
      question: "Does the decision stay separate from public sharing, nudges, exports, and AI summaries?",
      passSignal: "Approval only affects local chapter completion unless HQ later approves reuse.",
    },
  ];
}

function getFutureStructuredEvent(decision: LeaderProofDecisionValue): string {
  switch (decision) {
    case "approve":
      return "evidence_approved";
    case "request_changes":
      return "evidence_changes_requested";
    case "reject":
      return "evidence_rejected";
  }
}

function getAuditAction(decision: LeaderProofDecisionValue): string {
  switch (decision) {
    case "approve":
      return "leader_proof_approved";
    case "request_changes":
      return "leader_proof_changes_requested";
    case "reject":
      return "leader_proof_rejected";
  }
}

const decisionOptions: LeaderProofDecisionOption[] = [
  {
    value: "approve",
    label: "Approve",
    disabledReason:
      "Approval writes stay disabled until auth, RLS, points, audit, and rollback evidence are approved.",
  },
  {
    value: "request_changes",
    label: "Request changes",
    disabledReason:
      "Change-request nudges stay disabled until notification and audit gates are approved.",
  },
  {
    value: "reject",
    label: "Reject",
    disabledReason:
      "Reject decisions stay disabled until the team approves the proof-review write path.",
  },
];

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "leader":
      return "Chapter proof decision board";
    case "staff":
      return "Chapter proof support desk";
    case "super_admin":
      return "Proof decision operations";
    case "member":
    case "coach":
    case "ds_admin":
      return "Chapter proof decisions hidden for this role";
  }
}

function emptyCounts(): LeaderProofDecisionWorkspace["counts"] {
  return {
    total: 0,
    readyForApproval: 0,
    needsChanges: 0,
    notReady: 0,
    alreadyApproved: 0,
    browserWritesEnabled: 0,
    externalWritesEnabled: 0,
  };
}
