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
    expect(planner.counts.pendingNamedOwners).toBe(6);
    expect(planner.counts.browserWritesExpected).toBe(0);
    expect(planner.counts.externalWritesExpected).toBe(0);
    expect(planner.recommendedScope).toContain("one chapter");
    expect(
      planner.closeoutDefaults.find((item) => item.key === "first_hosted_write")
        ?.recommendedDefault,
    ).toBe("`action_started`");
    expect(
      planner.ownerSlots.find((slot) => slot.key === "rollback_owner")
        ?.recommendedDefault,
    ).toContain("Kiomi");
    expect(planner.approvalReplyBlock.join("\n")).toContain(
      "Pilot chapter: UCLA MEDLIFE",
    );
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

  it("keeps the first minimum path narrow with the Luma event loop isolated", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const planner = getPilotScopePlanner(actor);
    const actionStart = planner.minimumPilotPath.find(
      (step) => step.key === "action_start",
    );
    const eventNps = planner.minimumPilotPath.find(
      (step) => step.key === "event_luma_loop",
    );

    expect(actionStart?.pilotMode).toBe("first_live_candidate");
    expect(actionStart?.structuredEvents).toContain("action_started");
    expect(eventNps?.pilotMode).toBe("controlled_luma_pilot");
    expect(eventNps?.structuredEvents).toContain("luma_attendance_imported");
    expect(eventNps?.safetyBoundary).toContain("Only the approved Luma event-loop path");
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
    ).toContain("outside the approved Luma event loop");
    expect(planner.approvalReplyGuide[0]).toContain("approved as written");
  });

  it("keeps DS Admin eligible and operating roles hidden", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getPilotScopePlanner(dsAdmin).canReadPlanner).toBe(true);
    expect(getPilotScopePlanner(dsAdmin).title).toBe(
      "DS Admin pilot safety planner",
    );
    expect(getPilotScopePlanner(member).canReadPlanner).toBe(false);
    expect(getPilotScopePlanner(committeeMember).canReadPlanner).toBe(false);
    expect(getPilotScopePlanner(committeeChair).canReadPlanner).toBe(false);
    expect(getPilotScopePlanner(leader).canReadPlanner).toBe(false);
    expect(getPilotScopePlanner(coach).canReadPlanner).toBe(false);
  });

  it("shows recorded pilot answers when explicit Phase 2 registry values are present", () => {
    const originalChapter = process.env.MYMEDLIFE_PILOT_CHAPTER;
    const originalRollback = process.env.MYMEDLIFE_PILOT_ROLLBACK_OWNER;

    process.env.MYMEDLIFE_PILOT_CHAPTER = "Boston College MEDLIFE";
    process.env.MYMEDLIFE_PILOT_ROLLBACK_OWNER = "Kiomi Matsukawa";

    try {
      const planner = getPilotScopePlanner(
        getMockLocalActorContext("admin@mymedlife.test"),
      );

      expect(
        planner.closeoutDefaults.find((item) => item.key === "pilot_chapter")?.status,
      ).toBe("recorded_final");
      expect(
        planner.closeoutDefaults.find((item) => item.key === "pilot_chapter")
          ?.recommendedDefault,
      ).toBe("Boston College MEDLIFE");
      expect(
        planner.ownerSlots.find((slot) => slot.key === "rollback_owner")?.status,
      ).toBe("recorded_owner");
      expect(planner.approvalReplyBlock.join("\n")).toContain(
        "Rollback owner: Kiomi Matsukawa",
      );
    } finally {
      restoreEnv("MYMEDLIFE_PILOT_CHAPTER", originalChapter);
      restoreEnv("MYMEDLIFE_PILOT_ROLLBACK_OWNER", originalRollback);
    }
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
