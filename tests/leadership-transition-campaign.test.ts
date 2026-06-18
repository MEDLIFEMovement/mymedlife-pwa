import { describe, expect, it } from "vitest";
import { getLeadershipTransitionCampaignPlan } from "@/services/leadership-transition-campaign";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("leadership transition campaign", () => {
  it("gives chapter leaders a deeper mock-safe leadership transition operating plan", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const plan = getLeadershipTransitionCampaignPlan(actor);

    expect(plan.canReadPlan).toBe(true);
    expect(plan.title).toBe("Leader Leadership Transition campaign plan");
    expect(plan.route).toBe("/campaigns/leadership-transition");
    expect(plan.browserWritesExpected).toBe(0);
    expect(plan.externalWritesExpected).toBe(0);
    expect(plan.phases.map((phase) => phase.key)).toEqual([
      "successor_map",
      "role_notes_handoff",
      "committee_chair_confirm",
      "coach_handoff",
      "transition_risk_closeout",
    ]);
    expect(plan.phases.map((phase) => phase.ownerRole)).toEqual([
      "President / VP",
      "E-Board Member",
      "Action Committee Chair",
      "Coach",
      "President / VP",
    ]);
  });

  it("keeps every phase event-backed and external-send disabled", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const plan = getLeadershipTransitionCampaignPlan(actor);

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
        "leadership_successor_map_planned",
        "leadership_role_notes_planned",
        "action_committee_chair_handoff_planned",
        "coach_transition_review_prepared",
        "transition_risk_closeout_planned",
      ]),
    );
    expect(plan.closeoutChecks.join(" ")).toContain("critical chapter role");
    expect(plan.safetyReminders.join(" ")).toContain("does not change roles");
  });

  it("uses role-specific titles for coach, admin, and super admin reviewers", () => {
    expect(
      getLeadershipTransitionCampaignPlan(
        getMockLocalActorContext("coach@mymedlife.test"),
      ).title,
    ).toBe("Coach Leadership Transition campaign plan");
    expect(
      getLeadershipTransitionCampaignPlan(
        getMockLocalActorContext("admin@mymedlife.test"),
      ).title,
    ).toBe("Admin Leadership Transition campaign plan");
    expect(
      getLeadershipTransitionCampaignPlan(
        getMockLocalActorContext("super.admin@mymedlife.test"),
      ).title,
    ).toBe("Full Leadership Transition campaign plan");
  });

  it("hides the deeper leadership transition campaign from members and DS Admin", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getLeadershipTransitionCampaignPlan(member).canReadPlan).toBe(false);
    expect(getLeadershipTransitionCampaignPlan(member).phases).toEqual([]);
    expect(getLeadershipTransitionCampaignPlan(dsAdmin).canReadPlan).toBe(false);
    expect(getLeadershipTransitionCampaignPlan(dsAdmin).phases).toEqual([]);
  });
});
