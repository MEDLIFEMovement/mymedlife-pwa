import type { LocalActorContext } from "@/services/local-actor-context";
import { canReadAssignment } from "@/services/role-visibility";
import type {
  Approval,
  Assignment,
  AuditLog,
  AutomationOutbox,
  ChapterRole,
  EvidenceItem,
  IntegrationEvent,
  KpiSummary,
  KPIEvent,
  PointsEvent,
} from "@/shared/types/domain";
import type { DatabaseRoleKey } from "@/shared/types/persistence";

export type LocalContractResult<TData> =
  | { success: true; data: TData }
  | { success: false; error: string };

export type LocalActionStarted = {
  assignment: Assignment;
  integrationEvent: IntegrationEvent;
  auditLog: AuditLog;
};

export type LocalAssignmentCreated = {
  assignment: Assignment;
  integrationEvent: IntegrationEvent;
  automationOutbox: AutomationOutbox;
  auditLog: AuditLog;
};

export type LocalProofSubmission = {
  assignment: Assignment;
  evidenceItem: EvidenceItem;
  integrationEvent: IntegrationEvent;
  automationOutbox: AutomationOutbox;
  auditLog: AuditLog;
};

export type LocalHqSharingDecision = {
  evidenceItem: EvidenceItem;
  approval: Approval;
  integrationEvent: IntegrationEvent;
  automationOutbox: AutomationOutbox;
  auditLog: AuditLog;
};

export type LocalLeaderProofDecision = {
  assignment: Assignment;
  evidenceItem: EvidenceItem;
  approval: Approval;
  pointsEvent: PointsEvent | null;
  kpiEvent: KPIEvent | null;
  integrationEvent: IntegrationEvent;
  automationOutbox: AutomationOutbox;
  auditLog: AuditLog;
};

export type LocalCoachDecision = {
  decision: KpiSummary["coachDecision"];
  readinessStatus: "ready" | "validated" | "blocked";
  coachValidationStatus: "pending" | "validated" | "blocked";
  integrationEvent: IntegrationEvent;
  automationOutbox: AutomationOutbox;
  auditLog: AuditLog;
};

export type LocalMembershipApproval = {
  membership: {
    id: string;
    userId: string;
    chapterId: string;
    roles: ChapterRole[];
    status: "approved";
    committeeLane: string;
    requestedRoleKey: DatabaseRoleKey;
    approvedBy: string;
    approvalReason: string;
  };
  integrationEvent: IntegrationEvent;
  automationOutbox: AutomationOutbox;
  auditLog: AuditLog;
};

export type ProofSubmissionInput = {
  evidenceType: EvidenceItem["evidenceType"];
  summary: string;
};

export type ChapterAssignmentInput = {
  title: string;
  instructions: string;
  ownerRole: ChapterRole;
  dueLabel: string;
  evidenceRequired: string;
  points: number;
  kpi: string;
};

export type HqSharingDecisionInput = {
  decision: Approval["decision"];
  note: string;
};

export type LeaderProofDecisionInput = {
  decision: "approve" | "request_changes" | "reject";
  note: string;
};

export type CoachDecisionInput = {
  decision: KpiSummary["coachDecision"];
  note: string;
  blockerSummary?: string;
};

export type ChapterMembershipApprovalInput = {
  chapterId: string;
  joinRequestId: string;
  applicantEmail: string;
  requestedRoleKey: DatabaseRoleKey;
  requestedCommitteeLane: string;
  auditReason: string;
};

const localOccurredAt = "local-mock-time";

export function canSubmitProofForAssignment(
  actor: LocalActorContext,
  assignment: Assignment,
): boolean {
  if (!canReadAssignment(actor, assignment)) {
    return false;
  }

  return actor.audience === "chapter_member" || actor.audience === "chapter_leader";
}

export function canCreateChapterAssignment(actor: LocalActorContext): boolean {
  return actor.audience === "chapter_leader" || actor.audience === "super_admin";
}

export function canMakeHqSharingDecision(actor: LocalActorContext): boolean {
  return actor.audience === "admin" || actor.audience === "super_admin";
}

export function canRecordLeaderProofDecision(actor: LocalActorContext): boolean {
  return actor.audience === "chapter_leader" || actor.audience === "super_admin";
}

export function canLogCoachDecision(actor: LocalActorContext): boolean {
  return (
    actor.audience === "coach" ||
    actor.audience === "admin" ||
    actor.audience === "super_admin"
  );
}

export function canApproveChapterMembership(actor: LocalActorContext): boolean {
  return (
    actor.audience === "chapter_leader" ||
    actor.audience === "admin" ||
    actor.audience === "super_admin"
  );
}

export function createChapterAssignmentMock(
  actor: LocalActorContext,
  input: ChapterAssignmentInput,
): LocalContractResult<LocalAssignmentCreated> {
  if (!canCreateChapterAssignment(actor)) {
    return {
      success: false,
      error:
        "Only chapter leaders or Super Admin can create chapter assignments in the local contract.",
    };
  }

  const normalizedTitle = input.title.trim();
  const normalizedInstructions = input.instructions.trim();
  const normalizedEvidence = input.evidenceRequired.trim();
  const normalizedKpi = input.kpi.trim();

  if (normalizedTitle.length < 5) {
    return {
      success: false,
      error: "Assignment title must be at least 5 characters.",
    };
  }

  if (normalizedInstructions.length < 12) {
    return {
      success: false,
      error: "Assignment instructions must explain the action.",
    };
  }

  if (normalizedEvidence.length < 5) {
    return {
      success: false,
      error: "Assignment evidence requirement is too short.",
    };
  }

  if (normalizedKpi.length < 2) {
    return {
      success: false,
      error: "Assignment KPI is required.",
    };
  }

  if (input.points < 0 || input.points > 1000) {
    return {
      success: false,
      error: "Assignment points must be between 0 and 1000.",
    };
  }

  const assignment: Assignment = {
    id: `assignment-${slugify(normalizedTitle)}-${slugify(actor.user.id)}`,
    title: normalizedTitle,
    ownerRole: input.ownerRole,
    lane: roleToAssignmentLane(input.ownerRole),
    dueLabel: input.dueLabel.trim() || "No due date",
    status: "not_started",
    evidenceRequired: normalizedEvidence,
    instructions: normalizedInstructions,
    points: input.points,
    kpi: normalizedKpi,
  };
  const event = createLocalIntegrationEvent({
    targetId: assignment.id,
    eventType: "action_assigned",
    title: "Assignment created locally",
    destination: "internal",
    detail:
      "A local mock assignment-create contract was shaped for future Supabase persistence. No database write happened.",
  });

  return {
    success: true,
    data: {
      assignment,
      integrationEvent: event,
      automationOutbox: createDisabledOutbox({
        sourceEventId: event.id,
        destination: "n8n",
        eventType: "action_assigned",
        payloadSummary:
          "Future n8n workflow could remind the assigned owner after a leader creates an action.",
      }),
      auditLog: createLocalAuditLog(actor, "action_assigned", "assignment", assignment.id),
    },
  };
}

export function createActionStartedMock(
  actor: LocalActorContext,
  assignment: Assignment,
): LocalContractResult<LocalActionStarted> {
  if (!canReadAssignment(actor, assignment)) {
    return {
      success: false,
      error: "This local actor cannot read or start this assignment.",
    };
  }

  if (assignment.status === "approved") {
    return {
      success: false,
      error: "Approved assignments cannot be restarted in the local mock contract.",
    };
  }

  const nextAssignment: Assignment = {
    ...assignment,
    status: assignment.status === "not_started" ? "in_progress" : assignment.status,
  };

  return {
    success: true,
    data: {
      assignment: nextAssignment,
      integrationEvent: createLocalIntegrationEvent({
        targetId: assignment.id,
        eventType: "action_started",
        title: "Action started locally",
        destination: "internal",
        detail: `${actor.user.displayName} previewed starting ${assignment.title}.`,
      }),
      auditLog: createLocalAuditLog(actor, "action_started", "assignment", assignment.id),
    },
  };
}

export function createProofSubmissionMock(
  actor: LocalActorContext,
  assignment: Assignment,
  input: ProofSubmissionInput,
): LocalContractResult<LocalProofSubmission> {
  if (!canSubmitProofForAssignment(actor, assignment)) {
    return {
      success: false,
      error:
        "This role cannot submit proof for this assignment. Proof submission is for student/chapter operators in the local contract.",
    };
  }

  const normalizedSummary = input.summary.trim();

  if (normalizedSummary.length < 12) {
    return {
      success: false,
      error: "Proof summary must describe what happened in at least 12 characters.",
    };
  }

  const evidenceItem: EvidenceItem = {
    id: `evidence-${assignment.id}-${slugify(actor.user.id)}`,
    assignmentId: assignment.id,
    submittedBy: actor.user.displayName,
    evidenceType: input.evidenceType,
    summary: normalizedSummary,
    status: "pending_review",
  };
  const event = createLocalIntegrationEvent({
    targetId: evidenceItem.id,
    eventType: "evidence_submitted",
    title: "Proof/testimonial submitted locally",
    destination: "internal",
    detail:
      "A local mock proof submission was shaped for future Supabase persistence. No upload or database write happened.",
  });

  return {
    success: true,
    data: {
      assignment: {
        ...assignment,
        status: "submitted",
      },
      evidenceItem,
      integrationEvent: event,
      automationOutbox: createDisabledOutbox({
        sourceEventId: event.id,
        destination: "n8n",
        eventType: "evidence_submitted",
        payloadSummary:
          "Future n8n workflow could notify HQ that a testimonial/proof item needs sharing review.",
      }),
      auditLog: createLocalAuditLog(actor, "evidence_submitted", "evidence_item", evidenceItem.id),
    },
  };
}

export function createHqSharingDecisionMock(
  actor: LocalActorContext,
  evidenceItem: EvidenceItem,
  input: HqSharingDecisionInput,
): LocalContractResult<LocalHqSharingDecision> {
  if (!canMakeHqSharingDecision(actor)) {
    return {
      success: false,
      error:
        "Only HQ Admin or Super Admin can make proof-sharing decisions in the local contract.",
    };
  }

  const normalizedNote = input.note.trim();

  if (normalizedNote.length < 8) {
    return {
      success: false,
      error: "HQ sharing decisions need a short plain-English note.",
    };
  }

  const nextStatus: EvidenceItem["status"] =
    input.decision === "approved" ? "approved" : "changes_requested";
  const approval: Approval = {
    id: `approval-${evidenceItem.id}-${slugify(actor.user.id)}`,
    evidenceItemId: evidenceItem.id,
    reviewerRole: actorToReviewerRole(actor),
    decision: input.decision,
    note: normalizedNote,
  };
  const event = createLocalIntegrationEvent({
    targetId: approval.id,
    eventType:
      input.decision === "approved" ? "evidence_approved" : "evidence_rejected",
    title: "HQ proof-sharing decision previewed locally",
    destination: "internal",
    detail:
      "HQ sharing decision was shaped for future persistence. No public sharing or external workflow happened.",
  });

  return {
    success: true,
    data: {
      evidenceItem: {
        ...evidenceItem,
        status: nextStatus,
      },
      approval,
      integrationEvent: event,
      automationOutbox: createDisabledOutbox({
        sourceEventId: event.id,
        destination: "warehouse",
        eventType: "proof_sharing_decision_recorded",
        payloadSummary:
          "Future warehouse export could include HQ proof-sharing outcome after approval.",
      }),
      auditLog: createLocalAuditLog(actor, "hq_sharing_decision_mocked", "approval", approval.id),
    },
  };
}

export function createLeaderProofDecisionMock(
  actor: LocalActorContext,
  assignment: Assignment,
  evidenceItem: EvidenceItem,
  input: LeaderProofDecisionInput,
): LocalContractResult<LocalLeaderProofDecision> {
  if (!canRecordLeaderProofDecision(actor)) {
    return {
      success: false,
      error:
        "Only chapter leaders or Super Admin can record chapter proof decisions in the local contract.",
    };
  }

  if (assignment.status !== "submitted" || evidenceItem.status !== "pending_review") {
    return {
      success: false,
      error:
        "Leader proof decisions require a submitted assignment and proof pending review.",
    };
  }

  const normalizedNote = input.note.trim();

  if (normalizedNote.length < 12) {
    return {
      success: false,
      error: "Leader proof decisions need a short plain-English note.",
    };
  }

  const approved = input.decision === "approve";
  const nextAssignmentStatus: Assignment["status"] = approved
    ? "approved"
    : "changes_requested";
  const nextEvidenceStatus: EvidenceItem["status"] =
    input.decision === "approve"
      ? "approved"
      : input.decision === "reject"
        ? "rejected"
        : "changes_requested";
  const decision: Approval["decision"] =
    input.decision === "approve"
      ? "approved"
      : input.decision === "reject"
        ? "rejected"
        : "changes_requested";
  const eventType =
    input.decision === "approve"
      ? "evidence_approved"
      : input.decision === "reject"
        ? "evidence_rejected"
        : "evidence_changes_requested";
  const approval: Approval = {
    id: `leader-approval-${evidenceItem.id}-${slugify(actor.user.id)}`,
    evidenceItemId: evidenceItem.id,
    reviewerRole: actorToReviewerRole(actor),
    decision,
    note: normalizedNote,
  };
  const integrationEvent = createLocalIntegrationEvent({
    targetId: approval.id,
    eventType,
    title: "Leader proof decision previewed locally",
    destination: "internal",
    detail:
      "A local leader proof decision was shaped for future Supabase persistence. No member nudge, public sharing, or external workflow happened.",
  });
  const pointsEvent: PointsEvent | null = approved
    ? {
        id: `points-${evidenceItem.id}-${slugify(actor.user.id)}`,
        assignmentId: assignment.id,
        userId: evidenceItem.submittedBy,
        points: assignment.points,
        reason: "Leader approved chapter proof for completion.",
      }
    : null;
  const kpiEvent: KPIEvent | null = approved
    ? {
        id: `kpi-${evidenceItem.id}-${slugify(actor.user.id)}`,
        assignmentId: assignment.id,
        metric: assignment.kpi,
        value: 1,
      }
    : null;

  return {
    success: true,
    data: {
      assignment: {
        ...assignment,
        status: nextAssignmentStatus,
      },
      evidenceItem: {
        ...evidenceItem,
        status: nextEvidenceStatus,
      },
      approval,
      pointsEvent,
      kpiEvent,
      integrationEvent,
      automationOutbox: createDisabledOutbox({
        sourceEventId: integrationEvent.id,
        destination: "n8n",
        eventType,
        payloadSummary:
          "Future n8n workflow could notify the owner after leader proof review once member nudges are approved.",
      }),
      auditLog: createLocalAuditLog(
        actor,
        `leader_proof_${input.decision}`,
        "evidence_item",
        evidenceItem.id,
      ),
    },
  };
}

export function createCoachDecisionMock(
  actor: LocalActorContext,
  input: CoachDecisionInput,
): LocalContractResult<LocalCoachDecision> {
  if (!canLogCoachDecision(actor)) {
    return {
      success: false,
      error:
        "Only Coach, Admin, or Super Admin can log coach decisions in the local contract.",
    };
  }

  const normalizedNote = input.note.trim();
  const normalizedBlockerSummary = input.blockerSummary?.trim() ?? "";

  if (normalizedNote.length < 12) {
    return {
      success: false,
      error: "Coach decisions need a short plain-English note.",
    };
  }

  if (input.decision === "intervene" && normalizedBlockerSummary.length < 8) {
    return {
      success: false,
      error: "Intervene decisions need a blocker summary.",
    };
  }

  const statuses = coachDecisionToStatuses(input.decision);
  const event = createLocalIntegrationEvent({
    targetId: `coach-decision-${input.decision}-${slugify(actor.user.id)}`,
    eventType: "coach_decision_logged",
    title: "Coach decision previewed locally",
    destination: "internal",
    detail:
      "Coach decision was shaped for future persistence. No external escalation packet or automation happened.",
  });

  return {
    success: true,
    data: {
      decision: input.decision,
      readinessStatus: statuses.readinessStatus,
      coachValidationStatus: statuses.coachValidationStatus,
      integrationEvent: event,
      automationOutbox: createDisabledOutbox({
        sourceEventId: event.id,
        destination: "n8n",
        eventType: "coach_decision_logged",
        payloadSummary:
          "Future n8n workflow could assemble a coach escalation packet after explicit approval.",
      }),
      auditLog: createLocalAuditLog(
        actor,
        "coach_decision_logged",
        "phase_readiness_review",
        event.id,
      ),
    },
  };
}

export function createChapterMembershipApprovalMock(
  actor: LocalActorContext,
  input: ChapterMembershipApprovalInput,
  existingMemberEmails: readonly string[] = [],
): LocalContractResult<LocalMembershipApproval> {
  if (!canApproveChapterMembership(actor)) {
    return {
      success: false,
      error:
        "Only chapter leaders, Admin, or Super Admin can approve chapter membership in the local contract.",
    };
  }

  const normalizedJoinRequestId = input.joinRequestId.trim();
  const normalizedChapterId = input.chapterId.trim();
  const normalizedEmail = input.applicantEmail.trim().toLowerCase();
  const normalizedCommitteeLane = input.requestedCommitteeLane.trim();
  const normalizedReason = input.auditReason.trim();
  const role = databaseRoleKeyToChapterRole(input.requestedRoleKey);

  if (normalizedChapterId.length < 3 || normalizedJoinRequestId.length < 3) {
    return {
      success: false,
      error: "Membership approval requires a chapter and join request.",
    };
  }

  if (!normalizedEmail.includes("@") || normalizedEmail.length < 5) {
    return {
      success: false,
      error: "Membership approval requires a valid applicant profile email.",
    };
  }

  if (!role) {
    return {
      success: false,
      error: "Membership approval can only assign chapter-scoped roles.",
    };
  }

  if (normalizedReason.length < 12) {
    return {
      success: false,
      error: "Membership approval needs a clear audit reason.",
    };
  }

  const duplicateMembership = existingMemberEmails.some((email) => {
    return email.trim().toLowerCase() === normalizedEmail;
  });

  if (duplicateMembership) {
    return {
      success: false,
      error: "This applicant already has a membership row in the chapter roster.",
    };
  }

  const membershipId = `membership-${slugify(normalizedChapterId)}-${slugify(normalizedEmail)}`;
  const integrationEvent = createLocalIntegrationEvent({
    targetId: membershipId,
    eventType: "membership_approved",
    title: "Membership approval previewed locally",
    destination: "internal",
    detail:
      "A local membership approval was shaped for future Supabase persistence. No welcome message, CRM sync, or external automation happened.",
  });

  return {
    success: true,
    data: {
      membership: {
        id: membershipId,
        userId: `profile-${slugify(normalizedEmail)}`,
        chapterId: normalizedChapterId,
        roles: [role],
        status: "approved",
        committeeLane: normalizedCommitteeLane || "Unassigned",
        requestedRoleKey: input.requestedRoleKey,
        approvedBy: actor.user.id,
        approvalReason: normalizedReason,
      },
      integrationEvent,
      automationOutbox: createDisabledOutbox({
        sourceEventId: integrationEvent.id,
        destination: "HubSpot",
        eventType: "membership_approved",
        payloadSummary:
          "Future welcome message and HubSpot membership sync stay disabled until external communication and CRM approvals are complete.",
      }),
      auditLog: createLocalAuditLog(
        actor,
        "membership_approved",
        "membership",
        membershipId,
      ),
    },
  };
}

export function getReviewQueueForActor(
  actor: LocalActorContext,
  evidenceItems: EvidenceItem[],
): EvidenceItem[] {
  if (canMakeHqSharingDecision(actor)) {
    return evidenceItems;
  }

  if (actor.audience === "chapter_leader" || actor.audience === "coach") {
    return evidenceItems.filter((item) => item.status === "pending_review");
  }

  return [];
}

export function getProofSubmissionGuidance(actor: LocalActorContext): string {
  if (actor.audience === "chapter_member") {
    return "Submit a short testimonial, bridge video link, event photo, or proof note showing what happened.";
  }

  if (actor.audience === "chapter_leader") {
    return "Leaders can help collect proof, but HQ decides whether a testimonial should be shared broadly.";
  }

  if (canMakeHqSharingDecision(actor)) {
    return "HQ can preview proof-sharing decisions here. This local contract does not publish or send anything.";
  }

  return "This role can read permitted context only; proof submission and HQ sharing decisions are restricted.";
}

function createLocalIntegrationEvent(input: {
  targetId: string;
  eventType: string;
  title: string;
  destination: IntegrationEvent["destination"];
  detail: string;
}): IntegrationEvent {
  return {
    id: `evt-${input.eventType}-${slugify(input.targetId)}`,
    eventType: input.eventType,
    title: input.title,
    destination: input.destination,
    status: input.destination === "internal" ? "recorded" : "disabled",
    detail: input.detail,
    occurredAt: localOccurredAt,
  };
}

function createDisabledOutbox(input: {
  sourceEventId: string;
  destination: AutomationOutbox["destination"];
  eventType: string;
  payloadSummary: string;
}): AutomationOutbox {
  return {
    id: `outbox-${slugify(input.eventType)}-${slugify(input.sourceEventId)}`,
    sourceEventId: input.sourceEventId,
    destination: input.destination,
    status: "disabled",
    payloadSummary: input.payloadSummary,
  };
}

function createLocalAuditLog(
  actor: LocalActorContext,
  action: string,
  targetType: string,
  targetId: string,
): AuditLog {
  return {
    id: `audit-${slugify(action)}-${slugify(targetId)}`,
    actorUserId: actor.user.id,
    action,
    targetType,
    targetId,
  };
}

function actorToReviewerRole(actor: LocalActorContext): ChapterRole {
  return actor.audience === "super_admin" ? "Super Admin" : "Admin";
}

function coachDecisionToStatuses(decision: KpiSummary["coachDecision"]): {
  readinessStatus: LocalCoachDecision["readinessStatus"];
  coachValidationStatus: LocalCoachDecision["coachValidationStatus"];
} {
  if (decision === "advance") {
    return {
      readinessStatus: "validated",
      coachValidationStatus: "validated",
    };
  }

  if (decision === "intervene") {
    return {
      readinessStatus: "blocked",
      coachValidationStatus: "blocked",
    };
  }

  return {
    readinessStatus: "ready",
    coachValidationStatus: "pending",
  };
}

function roleToAssignmentLane(role: ChapterRole): Assignment["lane"] {
  if (role === "General Member" || role === "Action Committee Member") {
    return "Member";
  }

  if (role === "Coach") {
    return "Coach";
  }

  return "Leader";
}

function databaseRoleKeyToChapterRole(roleKey: DatabaseRoleKey): ChapterRole | null {
  switch (roleKey) {
    case "general_member":
      return "General Member";
    case "action_committee_member":
      return "Action Committee Member";
    case "action_committee_chair":
      return "Action Committee Chair";
    case "e_board_member":
      return "E-Board Member";
    case "president_vp":
      return "Chapter President / Vice President";
    case "coach":
    case "admin":
    case "ds_admin":
    case "super_admin":
    case "test":
      return null;
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
