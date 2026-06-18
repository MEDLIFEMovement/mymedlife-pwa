import { describe, expect, it } from "vitest";
import { assignments, evidenceItems, integrationEvents } from "@/data/mock-rush-month";
import {
  approveEvidenceMock,
  calculateKpiSummary,
  calculatePointsSummary,
  createAutomationOutboxMock,
  createIntegrationEventMock,
  getAssignmentById,
  getAssignmentsForRole,
  getAssignmentsForUser,
  getCoachDecisionState,
  kpiEventsFromAssignments,
  pointsEventsFromApprovedAssignments,
  rejectEvidenceMock,
  submitEvidenceMock,
} from "@/services/rush-month-service";

describe("rush month service", () => {
  it("returns role-based assignment visibility", () => {
    expect(getAssignmentsForRole(assignments, "member")).toEqual([
      expect.objectContaining({ lane: "Member" }),
    ]);
    expect(getAssignmentsForRole(assignments, "leader")).toHaveLength(assignments.length);
    expect(getAssignmentsForRole(assignments, "coach")).not.toContainEqual(
      expect.objectContaining({ id: "open-home" }),
    );
  });

  it("returns assignments for a mock user role", () => {
    const visible = getAssignmentsForUser(assignments, {
      id: "user-1",
      role: "member",
      chapterRoles: ["General Member"],
    });

    expect(visible).toEqual([expect.objectContaining({ id: "member-push" })]);
  });

  it("finds assignments by id", () => {
    expect(getAssignmentById(assignments, "member-push")?.title).toBe(
      "Run the general member invite push",
    );
    expect(getAssignmentById(assignments, "missing")).toBeUndefined();
  });

  it("submits evidence as pending review", () => {
    const updated = submitEvidenceMock(evidenceItems, {
      assignmentId: "member-push",
      submittedBy: "Test Member",
      evidenceType: "text",
      summary: "I invited three students.",
    });

    expect(updated).toHaveLength(evidenceItems.length + 1);
    expect(updated.at(-1)).toEqual(
      expect.objectContaining({
        assignmentId: "member-push",
        status: "pending_review",
      }),
    );
  });

  it("approves and rejects evidence without mutating other rows", () => {
    const approved = approveEvidenceMock(evidenceItems, "evidence-assign-eboard");
    const rejected = rejectEvidenceMock(evidenceItems, "evidence-assign-eboard");

    expect(approved.find((item) => item.id === "evidence-assign-eboard")?.status).toBe(
      "approved",
    );
    expect(rejected.find((item) => item.id === "evidence-assign-eboard")?.status).toBe(
      "changes_requested",
    );
    expect(evidenceItems.find((item) => item.id === "evidence-assign-eboard")?.status).toBe(
      "pending_review",
    );
  });

  it("calculates points from approved assignments", () => {
    expect(calculatePointsSummary(assignments)).toEqual({
      earned: 10,
      available: 95,
      approvedActions: 1,
    });
  });

  it("calculates KPI summary from mock data", () => {
    expect(calculateKpiSummary(assignments, integrationEvents)).toEqual({
      invitePushes: 1,
      proofPending: 2,
      eventsLinked: 1,
      coachDecision: "intervene",
    });
  });

  it("returns coach decision states", () => {
    expect(getCoachDecisionState(assignments)).toBe("intervene");
    expect(
      getCoachDecisionState(
        assignments.map((assignment) => ({
          ...assignment,
          status: assignment.id === "assign-eboard" ? "submitted" : "in_progress",
        })),
      ),
    ).toBe("hold");
    expect(
      getCoachDecisionState(
        assignments.map((assignment) => ({
          ...assignment,
          status: assignment.id === "coach-summary" ? "in_progress" : "approved",
        })),
      ),
    ).toBe("advance");
  });

  it("creates mock integration events and outbox items", () => {
    const event = createIntegrationEventMock({
      eventType: "hubspot_handoff_mocked",
      title: "HubSpot handoff mocked",
      destination: "HubSpot",
      detail: "No live write.",
      occurredAt: "09:00",
    });
    const outbox = createAutomationOutboxMock({
      sourceEventId: event.id,
      destination: "HubSpot",
      payloadSummary: "Mock CRM handoff",
    });

    expect(event).toEqual(
      expect.objectContaining({
        status: "mocked",
        destination: "HubSpot",
      }),
    );
    expect(outbox).toEqual(
      expect.objectContaining({
        sourceEventId: event.id,
        status: "mocked",
      }),
    );
  });

  it("creates ledger event rows from assignments", () => {
    expect(pointsEventsFromApprovedAssignments(assignments, "user-1")).toEqual([
      expect.objectContaining({
        assignmentId: "open-home",
        points: 10,
      }),
    ]);
    expect(kpiEventsFromAssignments(assignments)).toHaveLength(assignments.length);
  });
});
