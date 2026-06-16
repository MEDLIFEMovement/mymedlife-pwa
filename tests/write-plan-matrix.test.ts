import { describe, expect, it } from "vitest";
import { assignments, evidenceItems } from "@/data/mock-rush-month";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getWritePlanOperation,
  getWritePlanSummary,
  isActorAllowedForPlannedWrite,
  writePlanOperations,
} from "@/services/write-plan-matrix";
import {
  prepareDisabledAssignmentCreateWrite,
  prepareDisabledActionStartWrite,
  prepareDisabledHqSharingDecisionWrite,
  prepareDisabledProofSubmissionWrite,
} from "@/services/write-readiness";

describe("write plan matrix", () => {
  it("tracks the local write operations without enabling them", () => {
    expect(writePlanOperations.map((operation) => operation.key)).toEqual([
      "action_assigned",
      "action_started",
      "evidence_submitted",
      "hq_sharing_decision",
    ]);

    expect(writePlanOperations.every((operation) => operation.stillDisabled)).toBe(true);
    expect(getWritePlanSummary()).toEqual(
      expect.objectContaining({
        operationCount: 4,
        allOperationsStillDisabled: true,
        externalWritesAllowed: false,
      }),
    );
  });

  it("keeps future table targets aligned with the disabled write-readiness service", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const actionAssignment = requireAssignment("member-push");
    const evidenceItem = evidenceItems[0];

    expect(Array.from(getWritePlanOperation("action_assigned").futureTables)).toEqual(
      prepareDisabledAssignmentCreateWrite(leader, {
        title: "Assign tabling event owner",
        instructions: "Ask one student to own and promote the next Rush Month event.",
        ownerRole: "General Member",
        dueLabel: "Friday",
        evidenceRequired: "Owner name and proof plan.",
        points: 10,
        kpi: "Owner assigned",
      }).wouldWriteTables,
    );
    expect(Array.from(getWritePlanOperation("action_started").futureTables)).toEqual(
      prepareDisabledActionStartWrite(member, actionAssignment).wouldWriteTables,
    );
    expect(Array.from(getWritePlanOperation("evidence_submitted").futureTables)).toEqual(
      prepareDisabledProofSubmissionWrite(member, actionAssignment, {
        evidenceType: "bridge_video",
        summary: "This local proof preview would be saved only after Goal 13.",
      }).wouldWriteTables,
    );
    expect(Array.from(getWritePlanOperation("hq_sharing_decision").futureTables)).toEqual(
      prepareDisabledHqSharingDecisionWrite(admin, evidenceItem, {
        decision: "approved",
        note: "Strong future proof-sharing candidate.",
      }).wouldWriteTables,
    );
  });

  it("blocks DS Admin from owning student truth or HQ sharing decisions", () => {
    expect(
      writePlanOperations.every((operation) => {
        return operation.blockedActors.includes("ds_admin");
      }),
    ).toBe(true);
    expect(isActorAllowedForPlannedWrite("ds_admin", "action_assigned")).toBe(false);
    expect(isActorAllowedForPlannedWrite("ds_admin", "action_started")).toBe(false);
    expect(isActorAllowedForPlannedWrite("ds_admin", "evidence_submitted")).toBe(false);
    expect(isActorAllowedForPlannedWrite("ds_admin", "hq_sharing_decision")).toBe(
      false,
    );
  });

  it("limits assignment creation to chapter leaders and super admins", () => {
    const assignmentCreate = getWritePlanOperation("action_assigned");

    expect(Array.from(assignmentCreate.allowedActors)).toEqual([
      "chapter_leader",
      "super_admin",
    ]);
    expect(assignmentCreate.blockedActors).toEqual([
      "chapter_member",
      "coach",
      "admin",
      "ds_admin",
    ]);
    expect(isActorAllowedForPlannedWrite("chapter_leader", "action_assigned")).toBe(true);
    expect(isActorAllowedForPlannedWrite("super_admin", "action_assigned")).toBe(true);
    expect(isActorAllowedForPlannedWrite("admin", "action_assigned")).toBe(false);
  });

  it("limits proof submission to student or chapter operators", () => {
    const proofSubmission = getWritePlanOperation("evidence_submitted");

    expect(Array.from(proofSubmission.allowedActors)).toEqual([
      "chapter_member",
      "chapter_leader",
    ]);
    expect(proofSubmission.blockedActors).toEqual([
      "coach",
      "admin",
      "ds_admin",
      "super_admin",
    ]);
  });

  it("limits HQ sharing decisions to MEDLIFE HQ admin roles", () => {
    const hqDecision = getWritePlanOperation("hq_sharing_decision");

    expect(Array.from(hqDecision.allowedActors)).toEqual(["admin", "super_admin"]);
    expect(hqDecision.blockedActors).toEqual([
      "chapter_member",
      "chapter_leader",
      "coach",
      "ds_admin",
    ]);
    expect(isActorAllowedForPlannedWrite("admin", "hq_sharing_decision")).toBe(true);
    expect(isActorAllowedForPlannedWrite("super_admin", "hq_sharing_decision")).toBe(
      true,
    );
    expect(isActorAllowedForPlannedWrite("chapter_leader", "hq_sharing_decision")).toBe(
      false,
    );
  });

  it("marks assignment, proof, and HQ decisions as future outbox-producing writes", () => {
    expect(getWritePlanSummary().operationsTouchingOutbox).toEqual([
      "action_assigned",
      "evidence_submitted",
      "hq_sharing_decision",
    ]);
  });
});

function requireAssignment(assignmentId: string) {
  const assignment = assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    throw new Error(`Missing mock assignment ${assignmentId}`);
  }

  return assignment;
}
