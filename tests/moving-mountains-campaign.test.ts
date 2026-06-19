import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMovingMountainsCampaignPlan } from "@/services/moving-mountains-campaign";

describe("moving mountains campaign", () => {
  it("gives chapter leaders a deeper mock-safe Moving Mountains operating plan", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const plan = getMovingMountainsCampaignPlan(actor);

    expect(plan.canReadPlan).toBe(true);
    expect(plan.title).toBe("Leader Moving Mountains campaign plan");
    expect(plan.route).toBe("/campaigns/moving-mountains");
    expect(plan.browserWritesExpected).toBe(0);
    expect(plan.externalWritesExpected).toBe(0);
    expect(plan.phases.map((phase) => phase.key)).toEqual([
      "movement_story_setup",
      "advocacy_action_ready",
      "fundraising_momentum",
      "supporter_followup",
      "coach_movement_review",
    ]);
    expect(plan.phases.map((phase) => phase.ownerRole)).toEqual([
      "President / VP",
      "Action Committee Chair",
      "Action Committee Member",
      "E-Board Member",
      "Coach",
    ]);
  });

  it("keeps every phase event-backed and external-send disabled", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const plan = getMovingMountainsCampaignPlan(actor);

    expect(
      plan.phases.every(
        (phase) =>
          phase.structuredEvents.length > 0 &&
          phase.disabledOutboxDestinations.length > 0 &&
          phase.kpiSignals.length > 0 &&
          phase.proofPrompt.length > 30 &&
          phase.browserWritesExpected === 0 &&
          phase.externalWritesExpected === 0,
      ),
    ).toBe(true);
    expect(
      plan.phases.flatMap((phase) => phase.structuredEvents),
    ).toEqual(
      expect.arrayContaining([
        "moving_mountains_story_planned",
        "movement_advocacy_action_planned",
        "movement_fundraising_push_planned",
        "movement_supporter_followup_planned",
        "coach_moving_mountains_review_prepared",
      ]),
    );
    expect(plan.closeoutChecks.join(" ")).toContain("MEDLIFE's broader mission");
    expect(plan.safetyReminders.join(" ")).toContain("does not process payments");
  });

  it("uses role-specific titles for coach, admin, and super admin reviewers", () => {
    expect(
      getMovingMountainsCampaignPlan(getMockLocalActorContext("coach@mymedlife.test"))
        .title,
    ).toBe("Coach Moving Mountains campaign plan");
    expect(
      getMovingMountainsCampaignPlan(getMockLocalActorContext("admin@mymedlife.test"))
        .title,
    ).toBe("Admin Moving Mountains campaign plan");
    expect(
      getMovingMountainsCampaignPlan(
        getMockLocalActorContext("super.admin@mymedlife.test"),
      ).title,
    ).toBe("Full Moving Mountains campaign plan");
  });

  it("hides the deeper Moving Mountains campaign from members and DS Admin", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getMovingMountainsCampaignPlan(member).canReadPlan).toBe(false);
    expect(getMovingMountainsCampaignPlan(member).phases).toEqual([]);
    expect(getMovingMountainsCampaignPlan(dsAdmin).canReadPlan).toBe(false);
    expect(getMovingMountainsCampaignPlan(dsAdmin).phases).toEqual([]);
  });
});
