import type {
  Assignment,
  AuditLog,
  AutomationOutbox,
  EvidenceItem,
  IntegrationEvent,
  KpiSummary,
  PointsEvent,
  PointsSummary,
} from "@/shared/types/domain";

export type RushMonthLoopCommand =
  | "assign_action"
  | "start_action"
  | "submit_proof"
  | "review_completion"
  | "record_hq_sharing"
  | "log_coach_decision";

export type RushMonthLoopStepStatus = "complete" | "current" | "locked";

export type RushMonthLoopStep = {
  command: RushMonthLoopCommand;
  label: string;
  owner: "Leader" | "Member" | "HQ" | "Coach";
  helper: string;
  status: RushMonthLoopStepStatus;
};

export type RushMonthLocalLoopState = {
  sequence: number;
  assignmentAssigned: boolean;
  completionReviewStatus: "not_ready" | "pending" | "approved";
  hqSharingStatus: "not_ready" | "pending" | "approved";
  coachDecisionLogged: boolean;
  nextAction: string;
  assignment: Assignment;
  evidenceItem: EvidenceItem | null;
  pointsSummary: PointsSummary;
  pointsEvents: PointsEvent[];
  kpiSummary: KpiSummary;
  kpiEvents: IntegrationEvent[];
  integrationEvents: IntegrationEvent[];
  automationOutbox: AutomationOutbox[];
  auditLogs: AuditLog[];
};

const localAssignment: Assignment = {
  id: "local-loop-rush-invite-owner",
  title: "Run two Rush Month invite conversations",
  ownerRole: "General Member",
  lane: "Member",
  dueLabel: "This week",
  status: "not_started",
  evidenceRequired: "Short testimonial, invite note, or bridge video link.",
  instructions:
    "Invite two students to the next Rush Month event, then share what happened and what concern the proof addresses.",
  points: 15,
  kpi: "Student invites completed",
};

export function createInitialRushMonthLocalLoopState(): RushMonthLocalLoopState {
  const campaignOpened = createIntegrationEvent(0, {
    eventType: "campaign_opened",
    title: "Rush Month loop opened",
    destination: "internal",
    status: "recorded",
    detail:
      "A local Rush Month operating-loop simulation was opened. No browser write or external automation happened.",
  });

  return {
    sequence: 0,
    assignmentAssigned: false,
    completionReviewStatus: "not_ready",
    hqSharingStatus: "not_ready",
    coachDecisionLogged: false,
    nextAction: "Leader assigns the first concrete invite action.",
    assignment: localAssignment,
    evidenceItem: null,
    pointsSummary: {
      earned: 0,
      available: localAssignment.points,
      approvedActions: 0,
    },
    pointsEvents: [],
    kpiSummary: {
      invitePushes: 0,
      proofPending: 0,
      eventsLinked: 1,
      coachDecision: "hold",
    },
    kpiEvents: [],
    integrationEvents: [campaignOpened],
    automationOutbox: [],
    auditLogs: [
      createAuditLog(0, "system", "campaign_opened", "campaign", "rush-month-2026"),
    ],
  };
}

export function applyRushMonthLoopCommand(
  state: RushMonthLocalLoopState,
  command: RushMonthLoopCommand,
): RushMonthLocalLoopState {
  if (!canApplyRushMonthLoopCommand(state, command)) {
    throw new Error(`Rush Month local loop command is not available: ${command}`);
  }

  switch (command) {
    case "assign_action":
      return assignAction(state);
    case "start_action":
      return startAction(state);
    case "submit_proof":
      return submitProof(state);
    case "review_completion":
      return reviewCompletion(state);
    case "record_hq_sharing":
      return recordHqSharingDecision(state);
    case "log_coach_decision":
      return logCoachDecision(state);
  }
}

export function canApplyRushMonthLoopCommand(
  state: RushMonthLocalLoopState,
  command: RushMonthLoopCommand,
): boolean {
  switch (command) {
    case "assign_action":
      return !state.assignmentAssigned;
    case "start_action":
      return state.assignmentAssigned && state.assignment.status === "not_started";
    case "submit_proof":
      return state.assignment.status === "in_progress" && !state.evidenceItem;
    case "review_completion":
      return state.evidenceItem?.status === "pending_review";
    case "record_hq_sharing":
      return (
        state.completionReviewStatus === "approved" &&
        state.hqSharingStatus === "pending"
      );
    case "log_coach_decision":
      return state.hqSharingStatus === "approved" && !state.coachDecisionLogged;
  }
}

export function getRushMonthLoopSteps(
  state: RushMonthLocalLoopState,
): RushMonthLoopStep[] {
  return [
    buildStep(state, "assign_action", "Assign action", "Leader", "Name the owner, due date, and proof requirement."),
    buildStep(state, "start_action", "Start action", "Member", "The member commits to doing the invite push."),
    buildStep(state, "submit_proof", "Submit proof", "Member", "The member submits testimonial/proof metadata."),
    buildStep(state, "review_completion", "Review completion", "Leader", "Local completion review unlocks points and KPI movement."),
    buildStep(state, "record_hq_sharing", "HQ sharing decision", "HQ", "HQ decides whether the proof can be reused broadly later."),
    buildStep(state, "log_coach_decision", "Coach decision", "Coach", "Coach records advance, hold, or intervene posture."),
  ];
}

export function getRushMonthLoopProgress(state: RushMonthLocalLoopState): number {
  const steps = getRushMonthLoopSteps(state);
  const completeCount = steps.filter((step) => step.status === "complete").length;

  return Math.round((completeCount / steps.length) * 100);
}

function assignAction(state: RushMonthLocalLoopState): RushMonthLocalLoopState {
  const sequence = state.sequence + 1;
  const event = createIntegrationEvent(sequence, {
    eventType: "action_assigned",
    title: "Invite action assigned",
    destination: "n8n",
    status: "disabled",
    detail:
      "Leader assigned one concrete Rush Month invite action. Future reminder automation remains disabled.",
  });

  return {
    ...state,
    sequence,
    assignmentAssigned: true,
    nextAction: "Member starts the invite action.",
    integrationEvents: [...state.integrationEvents, event],
    automationOutbox: [
      ...state.automationOutbox,
      createOutbox(sequence, event.id, "n8n", "Disabled reminder for the assigned member."),
    ],
    auditLogs: [
      ...state.auditLogs,
      createAuditLog(sequence, "local-leader", "action_assigned", "assignment", state.assignment.id),
    ],
  };
}

function startAction(state: RushMonthLocalLoopState): RushMonthLocalLoopState {
  const sequence = state.sequence + 1;
  const event = createIntegrationEvent(sequence, {
    eventType: "action_started",
    title: "Invite action started",
    destination: "internal",
    status: "recorded",
    detail: "Member started the assigned Rush Month invite action.",
  });

  return {
    ...state,
    sequence,
    assignment: {
      ...state.assignment,
      status: "in_progress",
    },
    nextAction: "Member submits proof or testimonial after completing the invite push.",
    integrationEvents: [...state.integrationEvents, event],
    auditLogs: [
      ...state.auditLogs,
      createAuditLog(sequence, "local-member", "action_started", "assignment", state.assignment.id),
    ],
  };
}

function submitProof(state: RushMonthLocalLoopState): RushMonthLocalLoopState {
  const sequence = state.sequence + 1;
  const evidenceItem: EvidenceItem = {
    id: "local-loop-proof-invite-story",
    assignmentId: state.assignment.id,
    submittedBy: "Sofia Alvarez",
    evidenceType: "testimonial_text",
    summary:
      "I invited two freshmen and learned they were worried about joining alone, so I shared how MEDLIFE events help people make friends while taking action.",
    status: "pending_review",
  };
  const event = createIntegrationEvent(sequence, {
    eventType: "evidence_submitted",
    title: "Invite proof submitted",
    destination: "n8n",
    status: "disabled",
    detail:
      "Member submitted testimonial/proof metadata. No upload, publish action, or external workflow happened.",
  });

  return {
    ...state,
    sequence,
    assignment: {
      ...state.assignment,
      status: "submitted",
    },
    evidenceItem,
    completionReviewStatus: "pending",
    hqSharingStatus: "pending",
    nextAction: "Leader reviews local completion; HQ sharing remains separate.",
    kpiSummary: {
      ...state.kpiSummary,
      proofPending: state.kpiSummary.proofPending + 1,
    },
    integrationEvents: [...state.integrationEvents, event],
    automationOutbox: [
      ...state.automationOutbox,
      createOutbox(sequence, event.id, "n8n", "Disabled HQ review notification for submitted proof."),
    ],
    auditLogs: [
      ...state.auditLogs,
      createAuditLog(sequence, "local-member", "evidence_submitted", "evidence_item", evidenceItem.id),
    ],
  };
}

function reviewCompletion(state: RushMonthLocalLoopState): RushMonthLocalLoopState {
  const evidenceItem = requireEvidence(state);
  const sequence = state.sequence + 1;
  const approvalEvent = createIntegrationEvent(sequence, {
    eventType: "evidence_approved",
    title: "Completion proof approved",
    destination: "internal",
    status: "recorded",
    detail:
      "Leader approved local completion for points. HQ still owns any broad proof-sharing decision.",
  });
  const pointsEvent = createIntegrationEvent(sequence + 1, {
    eventType: "points_awarded",
    title: "Points awarded",
    destination: "internal",
    status: "recorded",
    detail: `${state.assignment.points} local points were awarded for the completed invite action.`,
  });
  const kpiEvent = createIntegrationEvent(sequence + 2, {
    eventType: "kpi_event_recorded",
    title: "Invite KPI recorded",
    destination: "internal",
    status: "recorded",
    detail: "Rush Month invite completion moved the mock KPI count by one.",
  });

  return {
    ...state,
    sequence: sequence + 2,
    assignment: {
      ...state.assignment,
      status: "approved",
    },
    evidenceItem: {
      ...evidenceItem,
      status: "approved",
    },
    completionReviewStatus: "approved",
    nextAction: "HQ records whether this proof should be shared broadly later.",
    pointsSummary: {
      earned: state.assignment.points,
      available: state.assignment.points,
      approvedActions: 1,
    },
    pointsEvents: [
      ...state.pointsEvents,
      {
        id: "points-local-loop-invite",
        assignmentId: state.assignment.id,
        userId: "local-member",
        points: state.assignment.points,
        reason: "Leader approved local completion proof.",
      },
    ],
    kpiSummary: {
      ...state.kpiSummary,
      invitePushes: state.kpiSummary.invitePushes + 1,
      proofPending: Math.max(0, state.kpiSummary.proofPending - 1),
    },
    kpiEvents: [...state.kpiEvents, kpiEvent],
    integrationEvents: [...state.integrationEvents, approvalEvent, pointsEvent, kpiEvent],
    auditLogs: [
      ...state.auditLogs,
      createAuditLog(sequence, "local-leader", "completion_review_approved", "evidence_item", evidenceItem.id),
      createAuditLog(sequence + 1, "system", "points_awarded", "assignment", state.assignment.id),
      createAuditLog(sequence + 2, "system", "kpi_event_recorded", "assignment", state.assignment.id),
    ],
  };
}

function recordHqSharingDecision(
  state: RushMonthLocalLoopState,
): RushMonthLocalLoopState {
  const evidenceItem = requireEvidence(state);
  const sequence = state.sequence + 1;
  const event = createIntegrationEvent(sequence, {
    eventType: "hq_sharing_decision",
    title: "HQ sharing decision recorded",
    destination: "warehouse",
    status: "disabled",
    detail:
      "HQ approved this proof for future reuse consideration. No public proof library publish or warehouse export happened.",
  });

  return {
    ...state,
    sequence,
    hqSharingStatus: "approved",
    nextAction: "Coach reviews chapter health and logs advance, hold, or intervene.",
    integrationEvents: [...state.integrationEvents, event],
    automationOutbox: [
      ...state.automationOutbox,
      createOutbox(sequence, event.id, "warehouse", "Disabled proof-sharing export for future data warehouse."),
    ],
    auditLogs: [
      ...state.auditLogs,
      createAuditLog(sequence, "local-admin", "hq_sharing_decision", "evidence_item", evidenceItem.id),
    ],
  };
}

function logCoachDecision(state: RushMonthLocalLoopState): RushMonthLocalLoopState {
  const sequence = state.sequence + 1;
  const decision: KpiSummary["coachDecision"] =
    state.pointsSummary.approvedActions > 0 && state.hqSharingStatus === "approved"
      ? "advance"
      : "hold";
  const event = createIntegrationEvent(sequence, {
    eventType: "coach_decision_logged",
    title: "Coach decision logged",
    destination: "n8n",
    status: "disabled",
    detail:
      "Coach logged the mock campaign decision. Any escalation packet or AI summary remains disabled.",
  });
  const phaseEvent = createIntegrationEvent(sequence + 1, {
    eventType: "phase_completed",
    title: "Rush Month phase completed locally",
    destination: "internal",
    status: "recorded",
    detail: "The local Rush Month operating loop reached its complete state.",
  });

  return {
    ...state,
    sequence: sequence + 1,
    coachDecisionLogged: true,
    nextAction: "Local MVP loop complete. Review event, outbox, audit, points, and KPI records.",
    kpiSummary: {
      ...state.kpiSummary,
      coachDecision: decision,
    },
    integrationEvents: [...state.integrationEvents, event, phaseEvent],
    automationOutbox: [
      ...state.automationOutbox,
      createOutbox(sequence, event.id, "n8n", "Disabled coach decision packet for future automation."),
    ],
    auditLogs: [
      ...state.auditLogs,
      createAuditLog(sequence, "local-coach", "coach_decision_logged", "phase", "rush-month-phase-1"),
      createAuditLog(sequence + 1, "system", "phase_completed", "phase", "rush-month-phase-1"),
    ],
  };
}

function buildStep(
  state: RushMonthLocalLoopState,
  command: RushMonthLoopCommand,
  label: string,
  owner: RushMonthLoopStep["owner"],
  helper: string,
): RushMonthLoopStep {
  return {
    command,
    label,
    owner,
    helper,
    status: getStepStatus(state, command),
  };
}

function getStepStatus(
  state: RushMonthLocalLoopState,
  command: RushMonthLoopCommand,
): RushMonthLoopStepStatus {
  if (isCommandComplete(state, command)) {
    return "complete";
  }

  return canApplyRushMonthLoopCommand(state, command) ? "current" : "locked";
}

function isCommandComplete(
  state: RushMonthLocalLoopState,
  command: RushMonthLoopCommand,
): boolean {
  switch (command) {
    case "assign_action":
      return state.assignmentAssigned;
    case "start_action":
      return state.assignment.status !== "not_started";
    case "submit_proof":
      return Boolean(state.evidenceItem);
    case "review_completion":
      return state.completionReviewStatus === "approved";
    case "record_hq_sharing":
      return state.hqSharingStatus === "approved";
    case "log_coach_decision":
      return state.coachDecisionLogged;
  }
}

function requireEvidence(state: RushMonthLocalLoopState): EvidenceItem {
  if (!state.evidenceItem) {
    throw new Error("Rush Month local loop expected evidence before review.");
  }

  return state.evidenceItem;
}

function createIntegrationEvent(
  sequence: number,
  input: Omit<IntegrationEvent, "id" | "occurredAt">,
): IntegrationEvent {
  return {
    ...input,
    id: `local-loop-event-${sequence}-${input.eventType}`,
    occurredAt: `step-${sequence}`,
  };
}

function createOutbox(
  sequence: number,
  sourceEventId: string,
  destination: AutomationOutbox["destination"],
  payloadSummary: string,
): AutomationOutbox {
  return {
    id: `local-loop-outbox-${sequence}`,
    sourceEventId,
    destination,
    status: "disabled",
    payloadSummary,
  };
}

function createAuditLog(
  sequence: number,
  actorUserId: string,
  action: string,
  targetType: string,
  targetId: string,
): AuditLog {
  return {
    id: `local-loop-audit-${sequence}-${action}`,
    actorUserId,
    action,
    targetType,
    targetId,
  };
}
