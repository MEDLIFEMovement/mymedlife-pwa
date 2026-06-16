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
    expect(planner.counts.operations).toBe(5);
    expect(planner.counts.localBrowserWriteCandidates).toBe(5);
    expect(planner.counts.externalWritesExpected).toBe(0);
    expect(planner.nextRecommendedOperation).toBe("action_started");
    expect(planner.operations.map((operation) => operation.key)).toEqual([
      "action_started",
      "evidence_submitted",
      "hq_sharing_decision_logged",
      "action_assigned",
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

    expect(actionStart?.promotionOrder).toBe(1);
    expect(actionStart?.studentJourneyOrder).toBe(2);
    expect(leaderAssignment?.promotionOrder).toBe(4);
    expect(leaderAssignment?.studentJourneyOrder).toBe(1);
    expect(planner.promotionSummary).toContain("seed assignments already exist");
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
        key: "evidence_submitted",
        packetLabel: "Proof metadata packet",
        packetRoute: "/admin/proof-write",
        externalWritesExpected: 0,
      },
      {
        key: "hq_sharing_decision_logged",
        packetLabel: "HQ proof decision packet",
        packetRoute: "/admin/hq-proof-write",
        externalWritesExpected: 0,
      },
      {
        key: "action_assigned",
        packetLabel: "Leader assignment packet",
        packetRoute: "/admin/assignment-write",
        externalWritesExpected: 0,
      },
      {
        key: "coach_decision_logged",
        packetLabel: "Coach decision packet",
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
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getWriteSequencePlanner(member, mockData).canReadPlanner).toBe(false);
    expect(getWriteSequencePlanner(leader, mockData).canReadPlanner).toBe(false);
    expect(getWriteSequencePlanner(coach, mockData).canReadPlanner).toBe(false);
  });
});
