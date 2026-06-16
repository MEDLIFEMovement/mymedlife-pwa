import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getPilotScopePlanner } from "@/services/pilot-scope-planner";

describe("pilot scope planner", () => {
  it("gives admin a conservative first-pilot planner with zero writes and sends", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const planner = getPilotScopePlanner(actor);

    expect(planner.canReadPlanner).toBe(true);
    expect(planner.title).toBe("Admin first pilot scope planner");
    expect(planner.verdict).toBe("pilot_scope_not_approved");
    expect(planner.counts.candidates).toBe(4);
    expect(planner.counts.recommendedCandidates).toBe(1);
    expect(planner.counts.browserWritesExpected).toBe(0);
    expect(planner.counts.externalWritesExpected).toBe(0);
    expect(planner.recommendedScope).toContain("one chapter");
  });

  it("recommends one chapter after gates and rejects broad launch as the first move", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const planner = getPilotScopePlanner(actor);

    expect(
      planner.candidates.find((candidate) => candidate.key === "one_chapter_rush_month")
        ?.status,
    ).toBe("recommended_after_gates");
    expect(
      planner.candidates.find((candidate) => candidate.key === "broad_launch")
        ?.status,
    ).toBe("not_recommended");
    expect(
      planner.candidates.find((candidate) => candidate.key === "staff_only_dry_run")
        ?.routeEvidence,
    ).toContain("/admin/staff-dry-run");
  });

  it("keeps the first minimum path narrow and event/NPS manual first", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const planner = getPilotScopePlanner(actor);
    const actionStart = planner.minimumPilotPath.find(
      (step) => step.key === "action_start",
    );
    const eventNps = planner.minimumPilotPath.find(
      (step) => step.key === "event_nps_manual",
    );

    expect(actionStart?.pilotMode).toBe("first_live_candidate");
    expect(actionStart?.structuredEvents).toContain("action_started");
    expect(eventNps?.pilotMode).toBe("manual_first");
    expect(eventNps?.safetyBoundary).toContain("No Luma writes");
  });

  it("names the decisions that still block a real student pilot", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const planner = getPilotScopePlanner(actor);

    expect(planner.decisions.map((decision) => decision.key)).toEqual([
      "pilot_group",
      "first_write",
      "event_nps",
      "proof_rules",
      "coach_owner",
      "external_writes",
    ]);
    expect(
      planner.decisions.find((decision) => decision.key === "first_write")?.status,
    ).toBe("blocked_before_pilot");
    expect(
      planner.decisions.find((decision) => decision.key === "external_writes")
        ?.recommendation,
    ).toContain("do not send");
  });

  it("keeps DS Admin eligible and operating roles hidden", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getPilotScopePlanner(dsAdmin).canReadPlanner).toBe(true);
    expect(getPilotScopePlanner(dsAdmin).title).toBe(
      "DS Admin pilot safety planner",
    );
    expect(getPilotScopePlanner(member).canReadPlanner).toBe(false);
    expect(getPilotScopePlanner(leader).canReadPlanner).toBe(false);
    expect(getPilotScopePlanner(coach).canReadPlanner).toBe(false);
  });
});
