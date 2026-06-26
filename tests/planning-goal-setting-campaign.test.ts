import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getPlanningGoalSettingCampaignPlan } from "@/services/planning-goal-setting-campaign";

describe("planning goal setting campaign", () => {
  it("gives chapter leaders a deeper mock-safe campaign operating plan", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const plan = getPlanningGoalSettingCampaignPlan(actor);

    expect(plan.canReadPlan).toBe(true);
    expect(plan.title).toBe("Leader Planning / Goal Setting campaign plan");
    expect(plan.workflowSource).toBe("template_version");
    expect(plan.workflowName).toContain("Planning Workflow");
    expect(plan.workflowVersionLabel).toBe("v0 reviewed");
    expect(plan.importStatus).toBe("draft_reviewed");
    expect(plan.summary).toContain("Current phase objective:");
    expect(plan.currentPhaseLabel).toBe("GSW Preparation");
    expect(plan.currentPhaseObjective).toContain("chapter goal");
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
      "President / Vice President",
      "Vice President / Committee Chair",
      "Committee Chair / Vice President",
      "President / Coach",
      "Coach / Sales Admin",
    ]);
    expect(plan.phases[0]?.label).toBe("Define the chapter goal and deadline");
    expect(plan.phases[0]?.leaderTask).toContain("single visible goal");
    expect(plan.operationPosture.length).toBeGreaterThan(0);
    expect(plan.validators.length).toBeGreaterThan(0);
    expect(plan.handoffs.length).toBeGreaterThan(0);
    expect(plan.featureFlags.length).toBeGreaterThan(0);
    expect(plan.risks.length).toBeGreaterThan(0);
    expect(plan.escalations.length).toBeGreaterThan(0);
    expect(plan.sourceCoverage.scriptTemplates.length).toBeGreaterThan(0);
    expect(plan.sourceCoverage.resourceLinks.length).toBeGreaterThan(0);
    expect(plan.tracePosture.sourceCount).toBeGreaterThan(0);
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
        "campaign.phase.started",
        "kpi.event.created",
        "coach.decision.advance_hold_intervene",
      ]),
    );
    expect(plan.closeoutChecks.join(" ")).toContain("accountable owner");
    expect(plan.safetyReminders.join(" ")).toContain("does not create goals");
    expect(plan.currentPhaseExitSignal).toContain("Goal brief is visible");
    expect(plan.operationPosture.map((operation) => operation.operation)).toEqual(
      expect.arrayContaining(["draft edit", "publish approve"]),
    );
    expect(plan.validators.map((validator) => validator.label)).toEqual(
      expect.arrayContaining(["Goal brief validator", "Coach readiness validator"]),
    );
    expect(plan.risks.map((risk) => risk.label)).toEqual(
      expect.arrayContaining([
        "Missing owner on a core lane",
        "Coach support needed before launch",
      ]),
    );
    expect(plan.escalations.map((escalation) => escalation.label)).toEqual(
      expect.arrayContaining([
        "Escalate missing owner gaps",
        "Escalate unresolved launch blockers",
      ]),
    );
    expect(plan.sourceCoverage.scriptTemplates.map((template) => template.label)).toEqual(
      expect.arrayContaining([
        "Goal alignment meeting prompt",
        "Coach check-in prompt",
      ]),
    );
    expect(plan.sourceCoverage.resourceLinks.map((resource) => resource.label)).toEqual(
      expect.arrayContaining([
        "Run A source map",
        "Run A import gap map",
      ]),
    );
    expect(plan.featureFlags.map((flag) => flag.flagKey)).toEqual(
      expect.arrayContaining([
        "workflow.planning_goal_setting.builder_preview",
        "workflow.planning_goal_setting.runtime_reads",
      ]),
    );
    expect(plan.tracePosture.missingSourceConfirmations).toBeGreaterThanOrEqual(1);
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
    expect(getPlanningGoalSettingCampaignPlan(member).workflowSource).toBe("hidden");
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
