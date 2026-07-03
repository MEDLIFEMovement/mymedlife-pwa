import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getWriteSequencePlanner } from "@/services/write-sequence-planner";

const mockData = getMockReadOnlyAppData("Testing write sequence planner.");

describe("write sequence planner", () => {
  it("shows admin the safe Rush Month write promotion order", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const planner = getWriteSequencePlanner(actor, mockData);

    expect(planner.canReadPlanner).toBe(true);
    expect(planner.title).toBe("Admin write sequence planner");
    expect(planner.counts.operations).toBe(9);
    expect(planner.counts.localBrowserWriteCandidates).toBe(9);
    expect(planner.counts.externalWritesExpected).toBe(0);
    expect(planner.nextRecommendedOperation).toBe("action_started");
    expect(planner.operations.map((operation) => operation.key)).toEqual([
      "action_started",
      "membership_approved",
      "action_assigned",
      "evidence_submitted",
      "leader_proof_decision_logged",
      "hq_sharing_decision_logged",
      "points_kpi_materialized",
      "slt_checklist_completed",
      "coach_decision_logged",
    ]);
    expect(
      planner.operations.find((operation) => operation.key === "coach_decision_logged"),
    ).toMatchObject({
      route: "/admin/coach-write",
      status: "packet_ready",
    });
  });

  it("separates student journey order from technical promotion order", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const planner = getWriteSequencePlanner(actor, mockData);
    const leaderAssignment = planner.operations.find(
      (operation) => operation.key === "action_assigned",
    );
    const actionStart = planner.operations.find(
      (operation) => operation.key === "action_started",
    );
    const membershipApproval = planner.operations.find(
      (operation) => operation.key === "membership_approved",
    );

    expect(membershipApproval?.promotionOrder).toBe(2);
    expect(membershipApproval?.studentJourneyOrder).toBe(1);
    expect(leaderAssignment?.promotionOrder).toBe(3);
    expect(leaderAssignment?.studentJourneyOrder).toBe(2);
    expect(actionStart?.promotionOrder).toBe(1);
    expect(actionStart?.studentJourneyOrder).toBe(3);
    expect(
      planner.operations.find(
        (operation) => operation.key === "leader_proof_decision_logged",
      )?.promotionOrder,
    ).toBe(5);
    expect(
      planner.operations.find((operation) => operation.key === "membership_approved")
        ?.promotionOrder,
    ).toBe(2);
    expect(planner.promotionSummary).toContain("prove `action_started` first");
  });

  it("surfaces live packet status for every write step", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const planner = getWriteSequencePlanner(actor, mockData);
    const packetStatuses = planner.operations.map((operation) => ({
      key: operation.key,
      packetLabel: operation.packetStatus.label,
      packetRoute: operation.packetStatus.route,
      externalWritesExpected: operation.packetStatus.externalWritesExpected,
    }));

    expect(packetStatuses).toEqual([
      {
        key: "action_started",
        packetLabel: "Action-start packet",
        packetRoute: "/admin/first-write",
        externalWritesExpected: 0,
      },
      {
        key: "membership_approved",
        packetLabel: "Membership approval readiness packet",
        packetRoute: "/chapter/members",
        externalWritesExpected: 0,
      },
      {
        key: "action_assigned",
        packetLabel: "Leader assignment packet",
        packetRoute: "/admin/assignment-write",
        externalWritesExpected: 0,
      },
      {
        key: "evidence_submitted",
        packetLabel: "Proof metadata packet",
        packetRoute: "/admin/proof-write",
        externalWritesExpected: 0,
      },
      {
        key: "leader_proof_decision_logged",
        packetLabel: "Leader proof decision server action",
        packetRoute: "/rush-month/review",
        externalWritesExpected: 0,
      },
      {
        key: "hq_sharing_decision_logged",
        packetLabel: "HQ proof decision packet",
        packetRoute: "/admin/hq-proof-write",
        externalWritesExpected: 0,
      },
      {
        key: "points_kpi_materialized",
        packetLabel: "Points and KPI packet",
        packetRoute: "/admin/points-write",
        externalWritesExpected: 0,
      },
      {
        key: "slt_checklist_completed",
        packetLabel: "SLT checklist packet",
        packetRoute: "/admin/slt-checklist-write",
        externalWritesExpected: 0,
      },
      {
        key: "coach_decision_logged",
        packetLabel: "Staff chapter decision and coach note packet",
        packetRoute: "/admin/coach-write",
        externalWritesExpected: 0,
      },
    ]);
    expect(
      planner.operations.every((operation) =>
        operation.packetStatus.plainEnglish.length > 20,
      ),
    ).toBe(true);
  });

  it("adds role responsibility to every guarded write step", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const planner = getWriteSequencePlanner(actor, mockData);
    const assignment = planner.operations.find(
      (operation) => operation.key === "action_assigned",
    );

    expect(
      planner.operations.every(
        (operation) =>
          operation.roleResponsibility.roleLabel.length > 0 &&
          operation.roleResponsibility.reviewPrompt.length > 20 &&
          operation.roleResponsibility.safetyBoundary.length > 20,
      ),
    ).toBe(true);
    expect(assignment?.roleResponsibility).toEqual(
      expect.objectContaining({
        roleLabel: "President / VP + E-Board + Action Committee Chair",
        responsibility: "Approve, hand off, and coordinate assignment work",
      }),
    );
    expect(assignment?.roleResponsibility.reviewPrompt).toContain(
      "President / VP approval guardrails",
    );
  });

  it("keeps DS Admin as a safety reviewer without making DS Admin an operator", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const planner = getWriteSequencePlanner(actor, mockData);

    expect(planner.canReadPlanner).toBe(true);
    expect(planner.title).toBe("DS Admin write sequence safety planner");
    expect(
      planner.operations.every(
        (operation) => operation.localActorEmail !== "ds.admin@mymedlife.test",
      ),
    ).toBe(true);
    expect(
      planner.operations.every((operation) =>
        operation.outboxPosture.toLowerCase().includes("no"),
      ),
    ).toBe(true);
  });

  it("hides the planner from operating roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getWriteSequencePlanner(member, mockData).canReadPlanner).toBe(false);
    expect(getWriteSequencePlanner(committeeMember, mockData).canReadPlanner).toBe(
      false,
    );
    expect(getWriteSequencePlanner(committeeChair, mockData).canReadPlanner).toBe(
      false,
    );
    expect(getWriteSequencePlanner(leader, mockData).canReadPlanner).toBe(false);
    expect(getWriteSequencePlanner(coach, mockData).canReadPlanner).toBe(false);
  });
});
