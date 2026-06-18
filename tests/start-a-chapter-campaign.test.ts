import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getStartAChapterCampaignPlan } from "@/services/start-a-chapter-campaign";

describe("start a chapter campaign", () => {
  it("gives chapter leaders a deeper mock-safe start-a-chapter operating plan", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const plan = getStartAChapterCampaignPlan(actor);

    expect(plan.canReadPlan).toBe(true);
    expect(plan.title).toBe("Leader Start a Chapter campaign plan");
    expect(plan.route).toBe("/campaigns/start-a-chapter");
    expect(plan.browserWritesExpected).toBe(0);
    expect(plan.externalWritesExpected).toBe(0);
    expect(plan.phases.map((phase) => phase.key)).toEqual([
      "expansion_interest",
      "founding_team",
      "first_event_plan",
      "readiness_gate_review",
      "coach_handoff",
    ]);
    expect(plan.phases.map((phase) => phase.ownerRole)).toEqual([
      "Admin",
      "Coach",
      "Action Committee Chair",
      "Admin",
      "Coach",
    ]);
  });

  it("keeps every phase event-backed and external-send disabled", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const plan = getStartAChapterCampaignPlan(actor);

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
        "chapter_expansion_interest_planned",
        "founding_team_recruitment_planned",
        "first_chapter_event_planned",
        "chapter_readiness_gate_reviewed",
        "coach_expansion_handoff_prepared",
      ]),
    );
    expect(plan.closeoutChecks.join(" ")).toContain("Campus interest");
    expect(plan.safetyReminders.join(" ")).toContain("does not create chapters");
  });

  it("uses role-specific titles for coach, admin, and super admin reviewers", () => {
    expect(
      getStartAChapterCampaignPlan(getMockLocalActorContext("coach@mymedlife.test"))
        .title,
    ).toBe("Coach Start a Chapter campaign plan");
    expect(
      getStartAChapterCampaignPlan(getMockLocalActorContext("admin@mymedlife.test"))
        .title,
    ).toBe("Admin Start a Chapter campaign plan");
    expect(
      getStartAChapterCampaignPlan(
        getMockLocalActorContext("super.admin@mymedlife.test"),
      ).title,
    ).toBe("Full Start a Chapter campaign plan");
  });

  it("hides the deeper start-a-chapter campaign from members and DS Admin", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getStartAChapterCampaignPlan(member).canReadPlan).toBe(false);
    expect(getStartAChapterCampaignPlan(member).phases).toEqual([]);
    expect(getStartAChapterCampaignPlan(dsAdmin).canReadPlan).toBe(false);
    expect(getStartAChapterCampaignPlan(dsAdmin).phases).toEqual([]);
  });
});
