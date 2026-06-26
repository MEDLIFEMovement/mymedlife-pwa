import { assignments, evidenceItems } from "@/data/mock-rush-month";
import {
  getActionProofHandoffWorkspace,
  type ActionProofHandoffPhase,
} from "@/services/action-proof-handoff";
import { buildLeaderAssignmentRouteHref } from "@/services/leader-assignment-route-href";
import {
  canSubmitProofForAssignment,
  createProofSubmissionMock,
  type ProofSubmissionInput,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { buildMemberActionRouteHref } from "@/services/member-action-route-href";
import {
  getDisabledProofSubmissionResultPreview,
  type ProofSubmissionResultCode,
} from "@/services/proof-submission-result-states";
import { getProofSubmissionWriteReadiness } from "@/services/proof-submission-write";
import {
  canReadAssignment,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import { getSopWorkflowRuntime } from "@/services/sop-workflow-runtime";
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

type WorkflowRuntimeStep =
  NonNullable<ReturnType<typeof getSopWorkflowRuntime>>["steps"][number];

export function getEvidenceSubmissionWorkspace(
  actor: LocalActorContext,
  allAssignments: Assignment[] = assignments,
  allEvidence: EvidenceItem[] = evidenceItems,
): EvidenceSubmissionWorkspace {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "ds_admin") {
    return hiddenWorkspace();
  }

  const visibleAssignments = allAssignments.filter((assignment) =>
    canReadAssignment(actor, assignment),
  );
  const runtime = getSopWorkflowRuntime("rush-month");
  const proofRuntimeStep =
    runtime?.steps.find((step) => step.route === "/rush-month/evidence") ?? null;
  const baseRows = visibleAssignments.map((assignment) =>
    toSubmissionRow(
      actor,
      assignment,
      findEvidenceForAssignment(allEvidence, assignment.id),
      proofRuntimeStep,
    ),
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
    title: getTitle(surfaceFamily),
    summary: runtime
      ? buildRuntimeWorkspaceSummary(runtime, proofRuntimeStep)
      : "This route turns proof and testimonial work into a clear follow-through queue. Students and chapter operators can see what to prepare next, what is waiting on review, and what still needs a stronger story.",
    nextSubmission: rows.find((row) => row.isRecommended) ?? null,
    submissionPacket,
    rows,
    futureStructuredEvents:
      runtime?.futureStructuredEvents.length
        ? [
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
            ...pickProofWorkspaceRuntimeEvents(runtime.futureStructuredEvents),
          ]
        : buildFutureEvents(actor),
    blockedWrites: runtime
      ? buildRuntimeBlockedWrites(runtime, proofRuntimeStep)
      : [
          "proof summary saves",
          "file uploads",
          "broader proof publishing",
          "points updates",
          "KPI updates",
          "member reminders",
          "warehouse proof exports",
          "AI proof summaries",
        ],
    safetyNotes: runtime
      ? buildRuntimeSafetyNotes(runtime)
      : [
          "Use the linked action detail to keep the proof tied to the actual assignment.",
          "Proof still starts as a simple summary and link until storage, consent, audit, and rollback approvals are in place.",
          "No HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI handoff runs from this route.",
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

function pickProofWorkspaceRuntimeEvents(
  events: readonly IntegrationEvent[],
): readonly IntegrationEvent[] {
  const orderedEventTypes = [
    "luma_event_linked",
    "luma_attendance_import_mocked",
    "kpi_event_recorded",
    "evidence_submitted",
    "audit_log_recorded",
    "hubspot_handoff_mocked",
  ] as const;

  return orderedEventTypes.flatMap((eventType) => {
    const match = events.find((event) => event.eventType === eventType);
    return match ? [match] : [];
  });
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
    title: "Proof submission path preview",
    assignmentId: row.assignmentId,
    assignmentTitle: row.assignmentTitle,
    localFunction: "app.submit_assignment_proof_metadata",
    targetRoute: row.proofIntakeHref,
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
            label: "Held handoff",
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
      "proof summary save",
      "file upload",
      "broader proof publish",
      "member reminder",
      "external handoff",
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
  proofRuntimeStep: WorkflowRuntimeStep | null,
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
    ...getStatusCopy(status, assignment, proofRuntimeStep),
    actionHref: getEvidenceActionHref(actor, assignment.id),
    canPrepareNow,
    canUseLocalWritePath: canPrepareNow,
    isRecommended: false,
    disabledReason: getDisabledReason(canSubmit, status),
    storyPrompt: proofHandoff.storyPrompt,
    preparationChecklist: proofHandoff.checklist,
    reviewLane: getReviewLane(status, assignment, proofRuntimeStep),
    proofIntakeHref: getEvidenceProofIntakeHref(actor, assignment.id, proofHandoff.phase, proofHandoff.nextBestAction.href),
    proofIntakeLabel: proofHandoff.nextBestAction.label,
    disabledControls: [
      "proof summary save",
      "file upload",
      "broader proof publish",
      "external handoff",
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
  proofRuntimeStep: WorkflowRuntimeStep | null,
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
          proofRuntimeStep?.whyItMatters ??
          "The action is active and needs proof or a testimonial before it can move to review.",
        nextStep: proofRuntimeStep
          ? `Prepare evidence for: ${assignment.evidenceRequired}. Completion signal: ${proofRuntimeStep.completionSignal}`
          : `Prepare evidence for: ${assignment.evidenceRequired}`,
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

  return "No proof summary save is expected for this status.";
}

function getEvidenceActionHref(
  actor: LocalActorContext,
  assignmentId: string,
): string {
  if (getActorSurfaceFamily(actor) === "member") {
    return buildMemberActionRouteHref(assignmentId, { source: "evidence" });
  }

  return buildLeaderAssignmentRouteHref(assignmentId, {
    source: "evidence_queue",
  });
}

function getEvidenceProofIntakeHref(
  actor: LocalActorContext,
  assignmentId: string,
  phase: ActionProofHandoffPhase,
  fallbackHref: string,
): string {
  if (getActorSurfaceFamily(actor) !== "member") {
    return fallbackHref;
  }

  if (phase === "prepare_story" || phase === "revise_context") {
    return buildMemberActionRouteHref(assignmentId, {
      source: "evidence",
      step: "submit",
    });
  }

  if (phase === "start_first") {
    return buildMemberActionRouteHref(assignmentId, { source: "evidence" });
  }

  return fallbackHref;
}

function getReviewLane(
  status: EvidenceSubmissionStatus,
  assignment: Assignment,
  proofRuntimeStep: WorkflowRuntimeStep | null,
): string {
  switch (status) {
    case "action_not_ready":
      return `${assignment.ownerRole} starts the action before proof moves to review.`;
    case "ready_to_submit":
      return proofRuntimeStep
        ? `${assignment.ownerRole} prepares the proof story for the "${proofRuntimeStep.title}" workflow step; chapter leadership and HQ review later.`
        : `${assignment.ownerRole} prepares the proof story; chapter leadership and HQ review later.`;
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

function buildRuntimeBlockedWrites(
  runtime: NonNullable<ReturnType<typeof getSopWorkflowRuntime>>,
  proofRuntimeStep:
    | NonNullable<ReturnType<typeof getSopWorkflowRuntime>>["steps"][number]
    | null,
) {
  const outboxBlocks = runtime.disabledOutboxItems.map((item) => {
    switch (item.destination) {
      case "n8n":
        return "member reminders";
      case "warehouse":
        return "warehouse proof exports";
      case "HubSpot":
        return "broader proof publishing";
      case "Luma":
        return "external handoff";
    }
  });

  return unique([
    "proof summary saves",
    "file uploads",
    "broader proof publishing",
    "points updates",
    "KPI updates",
    "AI proof summaries",
    ...(proofRuntimeStep?.approvalRequired ? ["leader and HQ review writes"] : []),
    ...outboxBlocks,
  ]);
}

function buildRuntimeSafetyNotes(
  runtime: NonNullable<ReturnType<typeof getSopWorkflowRuntime>>,
) {
  const currentPhaseNote = runtime.currentPhase?.objective
    ? `Current phase objective: ${runtime.currentPhase.objective}`
    : null;

  return unique([
    "Use the linked action detail to keep the proof tied to the actual assignment.",
    "Proof still starts as a simple summary and link until storage, consent, audit, and rollback approvals are in place.",
    ...(currentPhaseNote ? [currentPhaseNote] : []),
    ...runtime.safetyNotes,
  ]);
}

function buildRuntimeWorkspaceSummary(
  runtime: NonNullable<ReturnType<typeof getSopWorkflowRuntime>>,
  proofRuntimeStep:
    | NonNullable<ReturnType<typeof getSopWorkflowRuntime>>["steps"][number]
    | null,
) {
  const stepSummary = proofRuntimeStep?.whyItMatters
    ? `${proofRuntimeStep.whyItMatters}`
    : "Proof and testimonial work should stay tied to the real student action, not float away into a generic upload queue.";
  const phaseExit = runtime.currentPhase?.exitCriteria[0]
    ? `Current phase exit signal: ${runtime.currentPhase.exitCriteria[0]}`
    : null;

  return [stepSummary, phaseExit]
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "member":
      return "Proof for your next action";
    case "leader":
      return "Proof follow-up board";
    case "coach":
      return "Proof follow-up signal";
    case "staff":
      return "Proof submission overview";
    case "super_admin":
      return "Proof submission operations";
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
