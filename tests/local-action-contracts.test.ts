import { describe, expect, it } from "vitest";
import { assignments, evidenceItems } from "@/data/mock-rush-month";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  canMakeHqSharingDecision,
  canSubmitProofForAssignment,
  createActionStartedMock,
  createHqSharingDecisionMock,
  createProofSubmissionMock,
  getProofSubmissionGuidance,
  getReviewQueueForActor,
} from "@/services/local-action-contracts";

describe("local action contracts", () => {
  it("starts a visible not-started assignment without mutating the original", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const assignment = assignments.find((item) => item.id === "coach-summary");

    if (!assignment) {
      throw new Error("Expected coach-summary mock assignment");
    }

    const result = createActionStartedMock(coach, assignment);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignment.status).toBe("in_progress");
      expect(result.data.integrationEvent.eventType).toBe("action_started");
      expect(result.data.auditLog.action).toBe("action_started");
    }
    expect(assignment.status).toBe("not_started");
  });

  it("keeps DS Admin from starting student assignments", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const assignment = assignments.find((item) => item.id === "member-push");

    if (!assignment) {
      throw new Error("Expected member-push mock assignment");
    }

    expect(createActionStartedMock(dsAdmin, assignment)).toEqual(
      expect.objectContaining({
        success: false,
      }),
    );
  });

  it("allows members and leaders to submit proof for visible student/chapter work", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = assignments.find((item) => item.id === "member-push");

    if (!assignment) {
      throw new Error("Expected member-push mock assignment");
    }

    expect(canSubmitProofForAssignment(member, assignment)).toBe(true);

    const result = createProofSubmissionMock(member, assignment, {
      evidenceType: "bridge_video",
      summary: "This bridge video explains why the invite push helped freshmen join.",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignment.status).toBe("submitted");
      expect(result.data.evidenceItem.status).toBe("pending_review");
      expect(result.data.integrationEvent.eventType).toBe("evidence_submitted");
      expect(result.data.automationOutbox.status).toBe("disabled");
    }
  });

  it("blocks coach and DS Admin proof submissions", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const assignment = assignments.find((item) => item.id === "member-push");

    if (!assignment) {
      throw new Error("Expected member-push mock assignment");
    }

    expect(canSubmitProofForAssignment(coach, assignment)).toBe(false);
    expect(canSubmitProofForAssignment(dsAdmin, assignment)).toBe(false);
  });

  it("limits HQ proof-sharing decisions to admin and super admin", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const evidence = evidenceItems[0];

    expect(canMakeHqSharingDecision(admin)).toBe(true);
    expect(canMakeHqSharingDecision(leader)).toBe(false);

    const approved = createHqSharingDecisionMock(admin, evidence, {
      decision: "approved",
      note: "Useful testimonial for other Rush Month chapters.",
    });
    const blocked = createHqSharingDecisionMock(leader, evidence, {
      decision: "approved",
      note: "Leader should not own HQ sharing decisions.",
    });

    expect(approved.success).toBe(true);
    if (approved.success) {
      expect(approved.data.evidenceItem.status).toBe("approved");
      expect(approved.data.approval.reviewerRole).toBe("Admin");
      expect(approved.data.automationOutbox.status).toBe("disabled");
    }
    expect(blocked.success).toBe(false);
  });

  it("returns role-appropriate proof review queues and guidance", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const admin = getMockLocalActorContext("admin@mymedlife.test");

    expect(getReviewQueueForActor(member, evidenceItems)).toEqual([]);
    expect(getReviewQueueForActor(leader, evidenceItems)).toEqual([
      expect.objectContaining({ status: "pending_review" }),
    ]);
    expect(getReviewQueueForActor(admin, evidenceItems)).toHaveLength(evidenceItems.length);
    expect(getProofSubmissionGuidance(member)).toContain("Submit a short testimonial");
    expect(getProofSubmissionGuidance(admin)).toContain("HQ can preview");
  });
});
