import { describe, expect, it } from "vitest";
import { getGrowTheMovementCampaignPlan } from "@/services/grow-the-movement-campaign";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("grow the movement campaign", () => {
  it("gives chapter leaders a deeper mock-safe growth operating plan", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const plan = getGrowTheMovementCampaignPlan(actor);

    expect(plan.canReadPlan).toBe(true);
    expect(plan.title).toBe("Leader Grow the Movement campaign plan");
    expect(plan.route).toBe("/campaigns/grow-the-movement");
    expect(plan.browserWritesExpected).toBe(0);
    expect(plan.externalWritesExpected).toBe(0);
    expect(plan.phases.map((phase) => phase.key)).toEqual([
      "referral_owner_map",
      "partnership_outreach",
      "alumni_proof_setup",
      "conversion_followup",
      "coach_growth_review",
    ]);
    expect(plan.phases.map((phase) => phase.ownerRole)).toEqual([
      "President / VP",
      "Action Committee Chair",
      "E-Board Member",
      "Action Committee Member",
      "Coach",
    ]);
  });

  it("keeps every phase event-backed and external-send disabled", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const plan = getGrowTheMovementCampaignPlan(actor);

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
        "growth_referral_owner_map_planned",
        "growth_partnership_outreach_planned",
        "growth_alumni_proof_planned",
        "growth_conversion_followup_planned",
        "coach_growth_review_prepared",
      ]),
    );
    expect(plan.closeoutChecks.join(" ")).toContain("named human owner");
    expect(plan.safetyReminders.join(" ")).toContain("does not create contacts");
  });

  it("uses role-specific titles for coach, admin, and super admin reviewers", () => {
    expect(
      getGrowTheMovementCampaignPlan(getMockLocalActorContext("coach@mymedlife.test"))
        .title,
    ).toBe("Coach Grow the Movement campaign plan");
    expect(
      getGrowTheMovementCampaignPlan(getMockLocalActorContext("admin@mymedlife.test"))
        .title,
    ).toBe("Admin Grow the Movement campaign plan");
    expect(
      getGrowTheMovementCampaignPlan(
        getMockLocalActorContext("super.admin@mymedlife.test"),
      ).title,
    ).toBe("Full Grow the Movement campaign plan");
  });

  it("hides the deeper growth campaign from members and DS Admin", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getGrowTheMovementCampaignPlan(member).canReadPlan).toBe(false);
    expect(getGrowTheMovementCampaignPlan(member).phases).toEqual([]);
    expect(getGrowTheMovementCampaignPlan(dsAdmin).canReadPlan).toBe(false);
    expect(getGrowTheMovementCampaignPlan(dsAdmin).phases).toEqual([]);
  });
});
