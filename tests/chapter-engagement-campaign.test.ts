import { describe, expect, it } from "vitest";
import { getChapterEngagementCampaignPlan } from "@/services/chapter-engagement-campaign";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("chapter engagement campaign", () => {
  it("gives chapter leaders a deeper mock-safe engagement operating plan", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const plan = getChapterEngagementCampaignPlan(actor);

    expect(plan.canReadPlan).toBe(true);
    expect(plan.title).toBe("Leader Chapter Engagement campaign plan");
    expect(plan.route).toBe("/campaigns/chapter-engagement");
    expect(plan.browserWritesExpected).toBe(0);
    expect(plan.externalWritesExpected).toBe(0);
    expect(plan.phases.map((phase) => phase.key)).toEqual([
      "participation_pulse",
      "event_momentum",
      "recognition_loop",
      "retention_followup",
      "coach_engagement_review",
    ]);
    expect(plan.phases.map((phase) => phase.ownerRole)).toEqual([
      "E-Board Member",
      "Action Committee Chair",
      "Action Committee Member",
      "President / VP",
      "Coach",
    ]);
  });

  it("keeps every phase event-backed and external-send disabled", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const plan = getChapterEngagementCampaignPlan(actor);

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
        "engagement_pulse_planned",
        "engagement_event_planned",
        "recognition_moment_planned",
        "retention_risk_flagged",
        "coach_engagement_review_prepared",
      ]),
    );
    expect(plan.closeoutChecks.join(" ")).toContain("Active members");
    expect(plan.safetyReminders.join(" ")).toContain("does not award points");
  });

  it("uses role-specific titles for coach, admin, and super admin reviewers", () => {
    expect(
      getChapterEngagementCampaignPlan(getMockLocalActorContext("coach@mymedlife.test")).title,
    ).toBe("Coach Chapter Engagement campaign plan");
    expect(
      getChapterEngagementCampaignPlan(getMockLocalActorContext("admin@mymedlife.test")).title,
    ).toBe("Admin Chapter Engagement campaign plan");
    expect(
      getChapterEngagementCampaignPlan(
        getMockLocalActorContext("super.admin@mymedlife.test"),
      ).title,
    ).toBe("Full Chapter Engagement campaign plan");
  });

  it("hides the deeper engagement campaign from members and DS Admin", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getChapterEngagementCampaignPlan(member).canReadPlan).toBe(false);
    expect(getChapterEngagementCampaignPlan(member).phases).toEqual([]);
    expect(getChapterEngagementCampaignPlan(dsAdmin).canReadPlan).toBe(false);
    expect(getChapterEngagementCampaignPlan(dsAdmin).phases).toEqual([]);
  });
});
