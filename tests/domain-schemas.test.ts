import { describe, expect, it } from "vitest";
import {
  actionTemplateSchema,
  approvalSchema,
  assignmentSchema,
  auditLogSchema,
  automationOutboxSchema,
  campaignSchema,
  chapterSchema,
  evidenceItemSchema,
  integrationEventSchema,
  kpiEventSchema,
  membershipSchema,
  phaseSchema,
  pointsEventSchema,
  roleSchema,
  userSchema,
} from "@/shared/schemas/domain";
import {
  assignments,
  evidenceItems,
  integrationEvents,
  mockCampaign,
  mockChapter,
  outboxItems,
} from "@/data/mock-rush-month";

describe("domain schemas", () => {
  it("accepts valid mock domain objects", () => {
    expect(userSchema.safeParse(validUser).success).toBe(true);
    expect(chapterSchema.safeParse(mockChapter).success).toBe(true);
    expect(membershipSchema.safeParse(validMembership).success).toBe(true);
    expect(roleSchema.safeParse(validRole).success).toBe(true);
    expect(campaignSchema.safeParse(mockCampaign).success).toBe(true);
    expect(phaseSchema.safeParse(validPhase).success).toBe(true);
    expect(actionTemplateSchema.safeParse(validActionTemplate).success).toBe(true);
    expect(assignmentSchema.safeParse(assignments[0]).success).toBe(true);
    expect(evidenceItemSchema.safeParse(evidenceItems[0]).success).toBe(true);
    expect(approvalSchema.safeParse(validApproval).success).toBe(true);
    expect(pointsEventSchema.safeParse(validPointsEvent).success).toBe(true);
    expect(kpiEventSchema.safeParse(validKpiEvent).success).toBe(true);
    expect(integrationEventSchema.safeParse(integrationEvents[0]).success).toBe(true);
    expect(automationOutboxSchema.safeParse(outboxItems[0]).success).toBe(true);
    expect(auditLogSchema.safeParse(validAuditLog).success).toBe(true);
  });

  it("rejects invalid assignment status", () => {
    const result = assignmentSchema.safeParse({
      ...assignments[0],
      status: "done",
    });

    expect(result.success).toBe(false);
  });
});

const validUser = {
  id: "user-1",
  displayName: "Test Member",
  email: "member@example.org",
};

const validMembership = {
  id: "membership-1",
  userId: "user-1",
  chapterId: "chapter-northview",
  roles: ["General Member"],
  status: "approved",
};

const validRole = {
  key: "General Member",
  label: "General Member",
  chapterScoped: true,
};

const validPhase = {
  id: "phase-1",
  campaignId: "rush-month-2026",
  title: "Invite week",
  objective: "Run the first invite push.",
  status: "active",
};

const validActionTemplate = {
  id: "template-1",
  campaignId: "rush-month-2026",
  title: "Invite students",
  defaultOwnerRole: "General Member",
  evidenceRequired: "Invite proof",
  points: 15,
  kpi: "Student invites sent",
};

const validApproval = {
  id: "approval-1",
  evidenceItemId: "evidence-assign-eboard",
  reviewerRole: "Chapter President / Vice President",
  decision: "approved",
  note: "Proof is clear.",
};

const validPointsEvent = {
  id: "points-1",
  assignmentId: "open-home",
  userId: "user-1",
  points: 10,
  reason: "Approved proof",
};

const validKpiEvent = {
  id: "kpi-1",
  assignmentId: "open-home",
  metric: "Leader alignment completed",
  value: 1,
};

const validAuditLog = {
  id: "audit-1",
  actorUserId: "user-1",
  action: "evidence_approved",
  targetType: "EvidenceItem",
  targetId: "evidence-assign-eboard",
};
