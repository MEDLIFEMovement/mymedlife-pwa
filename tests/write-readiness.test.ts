import { describe, expect, it } from "vitest";
import { assignments, evidenceItems } from "@/data/mock-rush-month";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getWriteReadinessConfig,
  prepareDisabledAssignmentCreateWrite,
  prepareDisabledActionStartWrite,
  prepareDisabledHqSharingDecisionWrite,
  prepareDisabledProofSubmissionWrite,
} from "@/services/write-readiness";

describe("write readiness service", () => {
  it("keeps app writes disabled by default", () => {
    expect(getWriteReadinessConfig({})).toEqual(
      expect.objectContaining({
        enabled: false,
        reason: expect.stringContaining("App writes are disabled"),
      }),
    );
  });

  it("keeps app writes disabled even when the local write env var is true", () => {
    expect(
      getWriteReadinessConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      }),
    ).toEqual(
      expect.objectContaining({
        enabled: false,
        reason: expect.stringContaining("browser-facing writes remain disabled"),
      }),
    );
  });

  it("prepares a disabled assignment-create write attempt with future table names", () => {
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const attempt = prepareDisabledAssignmentCreateWrite(leader, {
      title: "Assign tabling event owner",
      instructions: "Ask one student to own and promote the next Rush Month event.",
      ownerRole: "General Member",
      dueLabel: "Friday",
      evidenceRequired: "Owner name and proof plan.",
      points: 10,
      kpi: "Owner assigned",
    });

    expect(attempt.success).toBe(false);
    expect(attempt.operation).toBe("action_assigned");
    expect(attempt.wouldWriteTables).toEqual([
      "assignments",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ]);
    expect(attempt.preview.success).toBe(true);
  });

  it("prepares a disabled action-start write attempt with future table names", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const assignment = requireAssignment("coach-summary");
    const attempt = prepareDisabledActionStartWrite(coach, assignment);

    expect(attempt.success).toBe(false);
    expect(attempt.operation).toBe("action_started");
    expect(attempt.wouldWriteTables).toEqual([
      "assignments",
      "events",
      "integration_events",
      "audit_logs",
    ]);
    expect(attempt.preview.success).toBe(true);
  });

  it("prepares a disabled proof-submission write attempt without saving proof", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = requireAssignment("member-push");
    const attempt = prepareDisabledProofSubmissionWrite(member, assignment, {
      evidenceType: "bridge_video",
      summary: "This bridge video preview would explain why the invite push worked.",
    });

    expect(attempt.success).toBe(false);
    expect(attempt.operation).toBe("evidence_submitted");
    expect(attempt.wouldWriteTables).toEqual([
      "assignments",
      "evidence_items",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ]);
    expect(attempt.preview.success).toBe(true);
  });

  it("prepares a disabled HQ sharing decision write attempt", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const evidence = evidenceItems[0];
    const attempt = prepareDisabledHqSharingDecisionWrite(admin, evidence, {
      decision: "approved",
      note: "Strong testimonial to share after approval.",
    });

    expect(attempt.success).toBe(false);
    expect(attempt.operation).toBe("hq_sharing_decision");
    expect(attempt.wouldWriteTables).toEqual([
      "evidence_items",
      "approvals",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ]);
    expect(attempt.preview.success).toBe(true);
  });
});

function requireAssignment(assignmentId: string) {
  const assignment = assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    throw new Error(`Missing mock assignment ${assignmentId}`);
  }

  return assignment;
}
