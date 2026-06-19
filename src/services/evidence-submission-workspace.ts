import { assignments, evidenceItems } from "@/data/mock-rush-month";
import { getActionProofHandoffWorkspace } from "@/services/action-proof-handoff";
import {
  canSubmitProofForAssignment,
  createProofSubmissionMock,
  type ProofSubmissionInput,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getDisabledProofSubmissionResultPreview,
  type ProofSubmissionResultCode,
} from "@/services/proof-submission-result-states";
import { getProofSubmissionWriteReadiness } from "@/services/proof-submission-write";
import { canReadAssignment } from "@/services/role-visibility";
import type { Assignment, EvidenceItem, IntegrationEvent } from "@/shared/types/domain";

export type EvidenceSubmissionStatus =
  | "action_not_ready"
  | "ready_to_submit"
  | "waiting_review"
  | "changes_requested"
  | "approved_internal";

export type EvidenceSubmissionRow = {
  assignmentId: string;
  assignmentTitle: string;
  ownerLabel: string;
  dueLabel: string;
  evidenceRequired: string;
  status: EvidenceSubmissionStatus;
  statusLabel: string;
  plainEnglishStatus: string;
  nextStep: string;
  actionHref: string;
  canPrepareNow: boolean;
  canUseLocalWritePath: boolean;
  isRecommended: boolean;
  disabledReason: string;
  storyPrompt: string;
  preparationChecklist: string[];
  reviewLane: string;
  proofIntakeHref: string;
  proofIntakeLabel: string;
  disabledControls: string[];
};

export type EvidenceSubmissionPacket = {
  title: string;
  assignmentId: string;
  assignmentTitle: string;
  localFunction: "app.submit_assignment_proof_metadata";
  targetRoute: string;
  reviewRoute: "/rush-month/review";
  payload: ProofSubmissionInput;
  currentResultCode: ProofSubmissionResultCode;
  currentResultTitle: string;
  futureResultCode: ProofSubmissionResultCode;
  futureResultTitle: string;
  readinessReason: string;
  readinessChecks: Array<{
    key: string;
    label: string;
    passed: boolean;
  }>;
  recordPreview: Array<{
    label: string;
    value: string;
  }>;
  blockedControls: string[];
};

export type EvidenceSubmissionWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  nextSubmission: EvidenceSubmissionRow | null;
  submissionPacket: EvidenceSubmissionPacket | null;
  rows: EvidenceSubmissionRow[];
  futureStructuredEvents: IntegrationEvent[];
  blockedWrites: string[];
  safetyNotes: string[];
  counts: {
    total: number;
    readyToSubmit: number;
    waitingReview: number;
    changesRequested: number;
    actionNotReady: number;
    approvedInternal: number;
    localWriteControlsEnabled: 0;
    uploadsEnabled: 0;
    externalSendsEnabled: 0;
    prepPackets: number;
    submissionPackets: number;
  };
};

export function getEvidenceSubmissionWorkspace(
  actor: LocalActorContext,
  allAssignments: Assignment[] = assignments,
  allEvidence: EvidenceItem[] = evidenceItems,
): EvidenceSubmissionWorkspace {
  if (actor.audience === "ds_admin") {
    return hiddenWorkspace();
  }

  const visibleAssignments = allAssignments.filter((assignment) =>
    canReadAssignment(actor, assignment),
  );
  const baseRows = visibleAssignments.map((assignment) =>
    toSubmissionRow(actor, assignment, findEvidenceForAssignment(allEvidence, assignment.id)),
  );
  const nextSubmission = pickNextSubmission(baseRows);
  const rows = baseRows.map((row) => ({
    ...row,
    isRecommended: nextSubmission?.assignmentId === row.assignmentId,
  }));
  const recommendedRow = rows.find((row) => row.isRecommended) ?? null;
  const recommendedAssignment = recommendedRow
    ? visibleAssignments.find((assignment) => assignment.id === recommendedRow.assignmentId)
    : undefined;
  const submissionPacket =
    recommendedRow && recommendedAssignment
      ? buildSubmissionPacket(actor, recommendedRow, recommendedAssignment)
      : null;

  return {
    canReadWorkspace: true,
    title: getTitle(actor),
    summary:
      "This route turns proof and testimonial work into a clear submission queue. Students and chapter operators can see what proof to prepare next while live uploads, public publishing, and external sends stay disabled.",
    nextSubmission: rows.find((row) => row.isRecommended) ?? null,
    submissionPacket,
    rows,
    futureStructuredEvents: buildFutureEvents(actor),
    blockedWrites: [
      "production proof metadata saves",
      "file uploads",
      "public proof publishing",
      "direct points ledger writes",
      "KPI browser writes",
      "member reminder sends",
      "warehouse proof exports",
      "AI proof summaries",
    ],
    safetyNotes: [
      "Use the linked action detail to preview the local-only proof metadata write gate.",
      "Proof submission is metadata-only until storage, consent, RLS, audit, and rollback are approved.",
      "No HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI write runs from this route.",
    ],
    counts: {
      total: rows.length,
      readyToSubmit: rows.filter((row) => row.status === "ready_to_submit").length,
      waitingReview: rows.filter((row) => row.status === "waiting_review").length,
      changesRequested: rows.filter((row) => row.status === "changes_requested")
        .length,
      actionNotReady: rows.filter((row) => row.status === "action_not_ready")
        .length,
      approvedInternal: rows.filter((row) => row.status === "approved_internal")
        .length,
      localWriteControlsEnabled: 0,
      uploadsEnabled: 0,
      externalSendsEnabled: 0,
      prepPackets: rows.filter((row) => row.preparationChecklist.length > 0).length,
      submissionPackets: submissionPacket ? 1 : 0,
    },
  };
}

function buildSubmissionPacket(
  actor: LocalActorContext,
  row: EvidenceSubmissionRow,
  assignment: Assignment,
): EvidenceSubmissionPacket {
  const payload = buildProofSubmissionInput(row);
  const preview = createProofSubmissionMock(actor, assignment, payload);
  const resultPreview = getDisabledProofSubmissionResultPreview(
    actor,
    assignment,
    payload,
  );
  const readiness = getProofSubmissionWriteReadiness(actor, assignment, payload);

  return {
    title: "Goal 158 proof submission packet",
    assignmentId: row.assignmentId,
    assignmentTitle: row.assignmentTitle,
    localFunction: "app.submit_assignment_proof_metadata",
    targetRoute: row.actionHref,
    reviewRoute: "/rush-month/review",
    payload,
    currentResultCode: resultPreview.currentResult.code,
    currentResultTitle: resultPreview.currentResult.title,
    futureResultCode: resultPreview.futureResultIfEnabled.code,
    futureResultTitle: resultPreview.futureResultIfEnabled.title,
    readinessReason: readiness.reason,
    readinessChecks: readiness.checks.map((check) => ({
      key: check.key,
      label: check.label,
      passed: check.passed,
    })),
    recordPreview: preview.success
      ? [
          {
            label: "Evidence item",
            value: preview.data.evidenceItem.id,
          },
          {
            label: "Structured event",
            value: preview.data.integrationEvent.eventType,
          },
          {
            label: "Disabled outbox",
            value: `${preview.data.automationOutbox.destination} ${preview.data.automationOutbox.status}`,
          },
          {
            label: "Audit action",
            value: preview.data.auditLog.action,
          },
        ]
      : [
          {
            label: "Packet blocked",
            value: preview.error,
          },
        ],
    blockedControls: [
      "proof metadata save",
      "file upload",
      "public proof publish",
      "member reminder send",
      "external send",
    ],
  };
}

function buildProofSubmissionInput(row: EvidenceSubmissionRow): ProofSubmissionInput {
  return {
    evidenceType: row.status === "changes_requested" ? "bridge_video" : "testimonial_text",
    summary: `Local preview: ${row.storyPrompt}`,
  };
}

function toSubmissionRow(
  actor: LocalActorContext,
  assignment: Assignment,
  evidence: EvidenceItem | undefined,
): EvidenceSubmissionRow {
  const status = getSubmissionStatus(assignment, evidence);
  const canSubmit = canSubmitProofForAssignment(actor, assignment);
  const proofHandoff = getActionProofHandoffWorkspace(actor, assignment);
  const canPrepareNow =
    canSubmit && (status === "ready_to_submit" || status === "changes_requested");

  return {
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    ownerLabel: assignment.ownerRole,
    dueLabel: assignment.dueLabel,
    evidenceRequired: assignment.evidenceRequired,
    status,
    ...getStatusCopy(status, assignment),
    actionHref: `/rush-month/actions/${assignment.id}`,
    canPrepareNow,
    canUseLocalWritePath: canPrepareNow,
    isRecommended: false,
    disabledReason: getDisabledReason(canSubmit, status),
    storyPrompt: proofHandoff.storyPrompt,
    preparationChecklist: proofHandoff.checklist,
    reviewLane: getReviewLane(status, assignment),
    proofIntakeHref: proofHandoff.nextBestAction.href,
    proofIntakeLabel: proofHandoff.nextBestAction.label,
    disabledControls: [
      "proof metadata save",
      "file upload",
      "public proof publish",
      "external send",
    ],
  };
}

function getSubmissionStatus(
  assignment: Assignment,
  evidence: EvidenceItem | undefined,
): EvidenceSubmissionStatus {
  if (evidence?.status === "approved" || assignment.status === "approved") {
    return "approved_internal";
  }

  if (evidence?.status === "changes_requested" || assignment.status === "changes_requested") {
    return "changes_requested";
  }

  if (evidence?.status === "pending_review" || assignment.status === "submitted") {
    return "waiting_review";
  }

  if (assignment.status === "not_started") {
    return "action_not_ready";
  }

  return "ready_to_submit";
}

function getStatusCopy(
  status: EvidenceSubmissionStatus,
  assignment: Assignment,
): Pick<EvidenceSubmissionRow, "nextStep" | "plainEnglishStatus" | "statusLabel"> {
  switch (status) {
    case "action_not_ready":
      return {
        statusLabel: "Start action first",
        plainEnglishStatus:
          "Proof should come after the action starts, so this item is not ready for evidence yet.",
        nextStep: "Open the action and understand the task before preparing proof.",
      };
    case "ready_to_submit":
      return {
        statusLabel: "Ready for proof",
        plainEnglishStatus:
          "The action is active and needs proof or a testimonial before it can move to review.",
        nextStep: `Prepare evidence for: ${assignment.evidenceRequired}`,
      };
    case "waiting_review":
      return {
        statusLabel: "Waiting for review",
        plainEnglishStatus:
          "Proof has been submitted locally and is waiting for leader or HQ review.",
        nextStep: "Wait for review or add context only if changes are requested.",
      };
    case "changes_requested":
      return {
        statusLabel: "Changes requested",
        plainEnglishStatus:
          "The proof idea is useful, but it needs clearer context before it can count.",
        nextStep:
          "Add what happened, who it helped, and why this proof answers a student concern.",
      };
    case "approved_internal":
      return {
        statusLabel: "Approved internally",
        plainEnglishStatus:
          "This proof has value for internal learning. It is not automatically public.",
        nextStep: "Use this as learning context while public publishing remains locked.",
      };
  }
}

function getDisabledReason(
  canSubmit: boolean,
  status: EvidenceSubmissionStatus,
): string {
  if (!canSubmit) {
    return "This local role can inspect the row but cannot submit proof for it.";
  }

  if (status === "ready_to_submit" || status === "changes_requested") {
    return "The browser write path still requires local auth, explicit write flags, RLS, and rollback approval.";
  }

  return "No proof metadata save is expected for this status.";
}

function getReviewLane(
  status: EvidenceSubmissionStatus,
  assignment: Assignment,
): string {
  switch (status) {
    case "action_not_ready":
      return `${assignment.ownerRole} starts the action before proof moves to review.`;
    case "ready_to_submit":
      return `${assignment.ownerRole} prepares the proof story; chapter leadership and HQ review later.`;
    case "waiting_review":
      return "Chapter leadership and HQ review the submitted proof posture.";
    case "changes_requested":
      return `${assignment.ownerRole} revises context before leader or HQ review continues.`;
    case "approved_internal":
      return "HQ can keep this as internal learning until a separate public-sharing workflow exists.";
  }
}

function pickNextSubmission(
  rows: EvidenceSubmissionRow[],
): EvidenceSubmissionRow | null {
  return (
    rows.find((row) => row.canPrepareNow && row.status === "changes_requested") ??
    rows.find((row) => row.canPrepareNow && row.status === "ready_to_submit") ??
    null
  );
}

function findEvidenceForAssignment(
  allEvidence: EvidenceItem[],
  assignmentId: string,
): EvidenceItem | undefined {
  return allEvidence.find((item) => item.assignmentId === assignmentId);
}

function buildFutureEvents(actor: LocalActorContext): IntegrationEvent[] {
  return [
    {
      id: `${actor.user.id}-proof-status-viewed`,
      eventType: "proof_submission_queue_viewed",
      title: "Future proof queue viewed",
      destination: "internal",
      status: "disabled",
      detail:
        "A future production view can record that the actor reviewed proof submission needs.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${actor.user.id}-evidence-submitted`,
      eventType: "evidence_submitted",
      title: "Future evidence submitted",
      destination: "internal",
      status: "disabled",
      detail:
        "Metadata-only proof submission must run through the approved local function before browser controls are enabled.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${actor.user.id}-proof-reminder-outbox`,
      eventType: "automation_outbox_recorded",
      title: "Future proof reminder outbox",
      destination: "n8n",
      status: "disabled",
      detail:
        "A future reminder can be queued only after Nick approves automation sends.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${actor.user.id}-proof-audit-log`,
      eventType: "audit_log_recorded",
      title: "Future proof audit log",
      destination: "internal",
      status: "disabled",
      detail:
        "Future proof metadata saves must create audit evidence with actor, target, and before/after posture.",
      occurredAt: "local-mock-time",
    },
  ];
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "Submit proof for your next action";
    case "chapter_leader":
      return "Prepare and follow up proof";
    case "coach":
      return "Evidence submission posture";
    case "admin":
      return "Evidence submission readiness";
    case "super_admin":
      return "Full evidence submission readiness";
    case "ds_admin":
      return "Evidence submission hidden for DS Admin";
  }
}

function hiddenWorkspace(): EvidenceSubmissionWorkspace {
  return {
    canReadWorkspace: false,
    title: "Evidence submission hidden for DS Admin",
    summary:
      "DS Admin can inspect integration posture, but should not read student proof submission queues.",
    nextSubmission: null,
    submissionPacket: null,
    rows: [],
    futureStructuredEvents: [],
    blockedWrites: [],
    safetyNotes: [],
    counts: {
      total: 0,
      readyToSubmit: 0,
      waitingReview: 0,
      changesRequested: 0,
      actionNotReady: 0,
      approvedInternal: 0,
      localWriteControlsEnabled: 0,
      uploadsEnabled: 0,
      externalSendsEnabled: 0,
      prepPackets: 0,
      submissionPackets: 0,
    },
  };
}
