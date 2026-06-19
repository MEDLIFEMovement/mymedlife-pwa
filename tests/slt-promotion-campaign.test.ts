import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getSltPromotionCampaignPlan } from "@/services/slt-promotion-campaign";

describe("slt promotion campaign", () => {
  it("gives chapter leaders a deeper mock-safe SLT promotion operating plan", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const plan = getSltPromotionCampaignPlan(actor);

    expect(plan.canReadPlan).toBe(true);
    expect(plan.title).toBe("Leader SLT Promotion campaign plan");
    expect(plan.route).toBe("/campaigns/slt-promotion");
    expect(plan.browserWritesExpected).toBe(0);
    expect(plan.externalWritesExpected).toBe(0);
    expect(plan.phases.map((phase) => phase.key)).toEqual([
      "belief_proof_setup",
      "info_session_ready",
      "question_followup",
      "commitment_path",
      "coach_slt_review",
    ]);
    expect(plan.phases.map((phase) => phase.ownerRole)).toEqual([
      "President / VP",
      "Action Committee Chair",
      "Action Committee Member",
      "President / VP",
      "Coach",
    ]);
  });

  it("keeps every phase event-backed and external-send disabled", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const plan = getSltPromotionCampaignPlan(actor);

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
        "slt_belief_proof_planned",
        "slt_info_session_planned",
        "slt_question_followup_planned",
        "slt_commitment_path_planned",
        "coach_slt_review_prepared",
      ]),
    );
    expect(plan.closeoutChecks.join(" ")).toContain("info session");
    expect(plan.safetyReminders.join(" ")).toContain("does not collect deposits");
  });

  it("uses role-specific titles for coach, admin, and super admin reviewers", () => {
    expect(
      getSltPromotionCampaignPlan(getMockLocalActorContext("coach@mymedlife.test")).title,
    ).toBe("Coach SLT Promotion campaign plan");
    expect(
      getSltPromotionCampaignPlan(getMockLocalActorContext("admin@mymedlife.test")).title,
    ).toBe("Admin SLT Promotion campaign plan");
    expect(
      getSltPromotionCampaignPlan(getMockLocalActorContext("super.admin@mymedlife.test"))
        .title,
    ).toBe("Full SLT Promotion campaign plan");
  });

  it("hides the deeper SLT promotion campaign from members and DS Admin", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getSltPromotionCampaignPlan(member).canReadPlan).toBe(false);
    expect(getSltPromotionCampaignPlan(member).phases).toEqual([]);
    expect(getSltPromotionCampaignPlan(dsAdmin).canReadPlan).toBe(false);
    expect(getSltPromotionCampaignPlan(dsAdmin).phases).toEqual([]);
  });
});
