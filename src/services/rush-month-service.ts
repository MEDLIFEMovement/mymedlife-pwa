import type {
  Assignment,
  AutomationOutbox,
  ChapterRole,
  EvidenceItem,
  IntegrationEvent,
  KPIEvent,
  KpiSummary,
  PointsEvent,
  PointsSummary,
  RoleKey,
} from "@/shared/types/domain";

export type MockUserContext = {
  id: string;
  role: RoleKey;
  chapterRoles: ChapterRole[];
};

export function getAssignmentsForRole(
  assignmentList: Assignment[],
  role: RoleKey,
): Assignment[] {
  if (role === "member") {
    return assignmentList.filter((assignment) => assignment.lane === "Member");
  }

  if (role === "coach") {
    return assignmentList.filter(
      (assignment) => assignment.lane === "Coach" || assignment.status !== "approved",
    );
  }

  return assignmentList;
}

export function getAssignmentsForUser(
  assignmentList: Assignment[],
  user: MockUserContext,
): Assignment[] {
  if (user.role === "admin") {
    return assignmentList;
  }

  if (user.role === "coach") {
    return getAssignmentsForRole(assignmentList, "coach");
  }

  return assignmentList.filter((assignment) =>
    user.chapterRoles.includes(assignment.ownerRole),
  );
}

export function getAssignmentById(
  assignmentList: Assignment[],
  id: string,
): Assignment | undefined {
  return assignmentList.find((assignment) => assignment.id === id);
}

export function submitEvidenceMock(
  evidenceList: EvidenceItem[],
  input: {
    assignmentId: string;
    submittedBy: string;
    evidenceType: EvidenceItem["evidenceType"];
    summary: string;
  },
): EvidenceItem[] {
  return [
    ...evidenceList,
    {
      id: `evidence-${input.assignmentId}-${evidenceList.length + 1}`,
      assignmentId: input.assignmentId,
      submittedBy: input.submittedBy,
      evidenceType: input.evidenceType,
      summary: input.summary,
      status: "pending_review",
    },
  ];
}

export function approveEvidenceMock(
  evidenceList: EvidenceItem[],
  evidenceId: string,
): EvidenceItem[] {
  return updateEvidenceStatus(evidenceList, evidenceId, "approved");
}

export function rejectEvidenceMock(
  evidenceList: EvidenceItem[],
  evidenceId: string,
): EvidenceItem[] {
  return updateEvidenceStatus(evidenceList, evidenceId, "changes_requested");
}

export function calculatePointsSummary(assignments: Assignment[]): PointsSummary {
  const approvedAssignments = assignments.filter(
    (assignment) => assignment.status === "approved",
  );

  return {
    earned: approvedAssignments.reduce(
      (total, assignment) => total + assignment.points,
      0,
    ),
    available: assignments.reduce((total, assignment) => total + assignment.points, 0),
    approvedActions: approvedAssignments.length,
  };
}

export function calculateKpiSummary(
  assignments: Assignment[],
  integrationEvents: IntegrationEvent[],
): KpiSummary {
  const proofPending = assignments.filter(
    (assignment) =>
      assignment.status === "submitted" || assignment.status === "changes_requested",
  ).length;
  const invitePushes = assignments.filter((assignment) =>
    assignment.kpi.toLowerCase().includes("invite"),
  ).length;
  const eventsLinked = integrationEvents.filter(
    (event) => event.eventType === "luma_event_linked",
  ).length;

  return {
    invitePushes,
    proofPending,
    eventsLinked,
    coachDecision: getCoachDecisionState(assignments),
  };
}

export function getCoachDecisionState(
  assignments: Assignment[],
): KpiSummary["coachDecision"] {
  const stalledCount = assignments.filter(
    (assignment) =>
      assignment.status === "not_started" ||
      assignment.status === "changes_requested",
  ).length;
  const pendingReviewCount = assignments.filter(
    (assignment) => assignment.status === "submitted",
  ).length;
  const approvedCount = assignments.filter(
    (assignment) => assignment.status === "approved",
  ).length;

  if (stalledCount >= 2) {
    return "intervene";
  }

  if (pendingReviewCount > 0) {
    return "hold";
  }

  if (approvedCount >= Math.ceil(assignments.length * 0.6)) {
    return "advance";
  }

  return "hold";
}

export function createIntegrationEventMock(input: {
  eventType: string;
  title: string;
  destination: IntegrationEvent["destination"];
  detail: string;
  occurredAt?: string;
}): IntegrationEvent {
  return {
    id: `evt-${input.eventType}`,
    eventType: input.eventType,
    title: input.title,
    destination: input.destination,
    status: input.destination === "internal" ? "recorded" : "mocked",
    detail: input.detail,
    occurredAt: input.occurredAt ?? "mock-time",
  };
}

export function createAutomationOutboxMock(input: {
  sourceEventId: string;
  destination: AutomationOutbox["destination"];
  payloadSummary: string;
}): AutomationOutbox {
  return {
    id: `outbox-${input.sourceEventId}`,
    sourceEventId: input.sourceEventId,
    destination: input.destination,
    status: "mocked",
    payloadSummary: input.payloadSummary,
  };
}

export function pointsEventsFromApprovedAssignments(
  assignments: Assignment[],
  userId: string,
): PointsEvent[] {
  return assignments
    .filter((assignment) => assignment.status === "approved")
    .map((assignment) => ({
      id: `points-${assignment.id}`,
      assignmentId: assignment.id,
      userId,
      points: assignment.points,
      reason: `Approved proof for ${assignment.title}`,
    }));
}

export function kpiEventsFromAssignments(assignments: Assignment[]): KPIEvent[] {
  return assignments.map((assignment) => ({
    id: `kpi-${assignment.id}`,
    assignmentId: assignment.id,
    metric: assignment.kpi,
    value: assignment.status === "approved" ? 1 : 0,
  }));
}

function updateEvidenceStatus(
  evidenceList: EvidenceItem[],
  evidenceId: string,
  status: EvidenceItem["status"],
): EvidenceItem[] {
  return evidenceList.map((item) =>
    item.id === evidenceId
      ? {
          ...item,
          status,
        }
      : item,
  );
}
