import { describe, expect, it } from "vitest";
import { getLeaderProofDecisionWorkspace } from "@/services/leader-proof-decision-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing leader proof decisions.");

describe("leader proof decision workspace", () => {
  it("gives chapter leaders explicit proof decisions without enabling writes", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const workspace = getLeaderProofDecisionWorkspace(
      actor,
      data.assignments,
      data.evidenceItems,
    );

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Chapter proof decision board");
    expect(workspace.counts).toEqual({
      total: 6,
      readyForApproval: 2,
      needsChanges: 1,
      notReady: 2,
      alreadyApproved: 1,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
    });
    expect(workspace.finalPrompt).toContain("points ledger writes");
  });

  it("treats committee chairs as part of the leader-owned proof decision surface", () => {
    const actor = getMockLocalActorContext("committee.chair@mymedlife.test");
    const workspace = getLeaderProofDecisionWorkspace(
      actor,
      data.assignments,
      data.evidenceItems,
    );

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Chapter proof decision board");
    expect(workspace.counts.total).toBe(6);
  });

  it("shows approve, request changes, and reject controls as disabled options", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const workspace = getLeaderProofDecisionWorkspace(
      actor,
      data.assignments,
      data.evidenceItems,
    );
    const row = workspace.rows.find((item) => item.assignmentId === "assign-eboard");

    expect(row).toEqual(
      expect.objectContaining({
        status: "ready_for_approval",
        recommendedDecision: "approve",
        pointsKpiImpact: "20 local points and KPI: Role-based assignments created.",
        recommendedDecisionRationale:
          "Approve only when every rubric check is clear; otherwise request changes.",
        futureStructuredEvent: "evidence_approved",
        auditAction: "leader_proof_approved",
        browserWritesExpected: 0,
        externalWritesExpected: 0,
      }),
    );
    expect(row?.decisionOptions.map((option) => option.label)).toEqual([
      "Approve",
      "Request changes",
      "Reject",
    ]);
    expect(
      row?.decisionOptions.every((option) => option.disabledReason.length > 30),
    ).toBe(true);
  });

  it("adds a leader review rubric before any points or KPI decision", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const workspace = getLeaderProofDecisionWorkspace(
      actor,
      data.assignments,
      data.evidenceItems,
    );
    const row = workspace.rows.find((item) => item.assignmentId === "assign-eboard");

    expect(row?.storyContextPrompt).toContain("what happened, who it helped");
    expect(row?.reviewRubric.map((item) => item.label)).toEqual([
      "Assignment fit",
      "Story context",
      "Points and KPI",
      "Sharing boundary",
    ]);
    expect(row?.reviewRubric[0].question).toContain(
      "Assignment list with owner, due date, and proof requirement.",
    );
    expect(row?.reviewRubric[2].question).toContain(
      "20 points and KPI movement",
    );
    expect(row?.reviewRubric[3].passSignal).toContain(
      "only affects local chapter completion",
    );
  });

  it("maps changes-requested proof to request-changes posture", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const workspace = getLeaderProofDecisionWorkspace(
      actor,
      data.assignments,
      data.evidenceItems,
    );
    const row = workspace.rows.find((item) => item.assignmentId === "proof-pack");

    expect(row?.status).toBe("needs_changes");
    expect(row?.recommendedDecision).toBe("request_changes");
    expect(row?.futureStructuredEvent).toBe("evidence_changes_requested");
    expect(row?.leaderNextStep).toContain("Request clearer context");
    expect(row?.recommendedDecisionRationale).toContain("points or KPI movement");
  });

  it("allows HQ staff to inspect support posture without turning on chapter decisions", () => {
    const admin = getLeaderProofDecisionWorkspace(
      getMockLocalActorContext("admin@mymedlife.test"),
      data.assignments,
      data.evidenceItems,
    );
    const superAdmin = getLeaderProofDecisionWorkspace(
      getMockLocalActorContext("super.admin@mymedlife.test"),
      data.assignments,
      data.evidenceItems,
    );

    expect(admin.canReadWorkspace).toBe(true);
    expect(admin.title).toBe("Chapter proof support desk");
    expect(superAdmin.canReadWorkspace).toBe(true);
    expect(superAdmin.title).toBe("Proof decision operations");
    expect(admin.counts.browserWritesEnabled).toBe(0);
  });

  it("hides leader proof decisions from members, coaches, and DS Admin", () => {
    const member = getLeaderProofDecisionWorkspace(
      getMockLocalActorContext("member.a@mymedlife.test"),
      data.assignments,
      data.evidenceItems,
    );
    const coach = getLeaderProofDecisionWorkspace(
      getMockLocalActorContext("coach@mymedlife.test"),
      data.assignments,
      data.evidenceItems,
    );
    const dsAdmin = getLeaderProofDecisionWorkspace(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
      data.assignments,
      data.evidenceItems,
    );

    expect(member.canReadWorkspace).toBe(false);
    expect(coach.canReadWorkspace).toBe(false);
    expect(dsAdmin.canReadWorkspace).toBe(false);
    expect(dsAdmin.rows).toEqual([]);
  });

  it("treats committee members as part of the member-owned hidden proof decision boundary", () => {
    const member = getLeaderProofDecisionWorkspace(
      getMockLocalActorContext("committee.member@mymedlife.test"),
      data.assignments,
      data.evidenceItems,
    );

    expect(member.canReadWorkspace).toBe(false);
    expect(member.title).toBe("Chapter proof decisions hidden for this role");
    expect(member.rows).toEqual([]);
  });
});
