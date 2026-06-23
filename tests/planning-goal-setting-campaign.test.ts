import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getPlanningGoalSettingCampaignPlan } from "@/services/planning-goal-setting-campaign";

describe("planning goal setting campaign", () => {
  it("gives chapter leaders a deeper mock-safe campaign operating plan", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const plan = getPlanningGoalSettingCampaignPlan(actor);

    expect(plan.canReadPlan).toBe(true);
    expect(plan.title).toBe("Leader Planning / Goal Setting campaign plan");
    expect(plan.route).toBe("/campaigns/planning-goal-setting");
    expect(plan.browserWritesExpected).toBe(0);
    expect(plan.externalWritesExpected).toBe(0);
    expect(plan.phases.map((phase) => phase.key)).toEqual([
      "goal_alignment",
      "owner_map",
      "action_calendar",
      "risk_review",
      "coach_checkin",
    ]);
    expect(plan.phases.map((phase) => phase.ownerRole)).toEqual([
      "President / VP",
      "E-Board Member",
      "Action Committee Chair",
      "President / VP",
      "Coach",
    ]);
  });

  it("keeps every phase event-backed and external-send disabled", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const plan = getPlanningGoalSettingCampaignPlan(actor);

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
        "campaign_goal_defined",
        "campaign_owner_assigned",
        "campaign_action_calendar_planned",
        "campaign_risk_flagged",
        "coach_checkin_prepared",
      ]),
    );
    expect(plan.closeoutChecks.join(" ")).toContain("accountable owner");
    expect(plan.safetyReminders.join(" ")).toContain("does not create goals");
  });

  it("uses role-specific titles for coach, admin, and super admin reviewers", () => {
    expect(
      getPlanningGoalSettingCampaignPlan(getMockLocalActorContext("coach@mymedlife.test")).title,
    ).toBe("Coach Planning / Goal Setting campaign plan");
    expect(
      getPlanningGoalSettingCampaignPlan(getMockLocalActorContext("admin@mymedlife.test")).title,
    ).toBe("Admin Planning / Goal Setting campaign plan");
    expect(
      getPlanningGoalSettingCampaignPlan(
        getMockLocalActorContext("super.admin@mymedlife.test"),
      ).title,
    ).toBe("Full Planning / Goal Setting campaign plan");
  });

  it("hides the deeper planning campaign from members and DS Admin", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getPlanningGoalSettingCampaignPlan(member).canReadPlan).toBe(false);
    expect(getPlanningGoalSettingCampaignPlan(member).phases).toEqual([]);
    expect(getPlanningGoalSettingCampaignPlan(committeeMember).canReadPlan).toBe(false);
    expect(getPlanningGoalSettingCampaignPlan(committeeMember).phases).toEqual([]);
    expect(getPlanningGoalSettingCampaignPlan(committeeChair).canReadPlan).toBe(true);
    expect(getPlanningGoalSettingCampaignPlan(committeeChair).title).toBe(
      "Leader Planning / Goal Setting campaign plan",
    );
    expect(getPlanningGoalSettingCampaignPlan(dsAdmin).canReadPlan).toBe(false);
    expect(getPlanningGoalSettingCampaignPlan(dsAdmin).phases).toEqual([]);
  });
});
