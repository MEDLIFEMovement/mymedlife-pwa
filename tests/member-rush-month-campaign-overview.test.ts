import { describe, expect, it } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberRushMonthCampaignOverview } from "@/services/member-rush-month-campaign-overview";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("member rush month campaign overview", () => {
  it("maps the member campaign screen to the mockup copy and routes", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member campaign overview.");
    const overview = getMemberRushMonthCampaignOverview(actor, data);

    expect(overview.chapterName).toBe("UCLA MEDLIFE");
    expect(overview.campaignName).toBe("Rush Month");
    expect(overview.workflowSource).toBe("template_version");
    expect(overview.workflowVersionLabel).toBe("v2.1");
    expect(overview.workflowCurrentStepId).toBe("rush-visibility");
    expect(overview.statusLabel).toBe("Active");
    expect(overview.weekLabel).toBe("Week 1 of 4");
    expect(overview.chapterProgressPercent).toBe(67);
    expect(overview.currentPhaseTitle).toBe("Planning: Make MEDLIFE visible on campus");
    expect(overview.currentPhaseDates).toBe(
      "Exit signal: Members can see the campaign phase, KPI strip, and the first concrete action inside the app.",
    );
    expect(overview.whyItMattersBody).toContain("Current phase objective:");
    expect(overview.kpis.map((kpi) => kpi.label)).toEqual([
      "Leads Captured",
      "Intro GBM RSVPs",
      "Follow-ups Done",
      "New Members",
    ]);
    expect(overview.kpis).toEqual([
      {
        label: "Leads Captured",
        value: 47,
        goal: 80,
        progressLabel: "59% of goal",
      },
      {
        label: "Intro GBM RSVPs",
        value: 23,
        goal: 50,
        progressLabel: "46% of goal",
      },
      {
        label: "Follow-ups Done",
        value: 18,
        goal: 47,
        progressLabel: "38% of goal",
      },
      {
        label: "New Members",
        value: 9,
        goal: 25,
        progressLabel: "36% of goal",
      },
    ]);
    expect(overview.assignedActionsByRole.map((group) => group.roleLabel)).toEqual([
      "General Members",
      "Action Committee Chairs",
      "E-Board",
      "President / VP",
    ]);
    expect(overview.assignedActionsByRole.map((group) => group.id)).toEqual([
      "general-members",
      "action-committee-chairs",
      "eboard",
      "president-vp",
    ]);
    expect(overview.whatGoodLooksLike.items).toEqual([
      "Assignment can move to in progress",
      "Proof requirements are visible before submission",
      "Points surface stays in the same loop",
      "Story or outcome proof stays metadata-first",
      "Leader review confirms chapter completion",
    ]);
    expect(overview.primaryActions.openEventsHref).toBe("/app/events?source=campaigns");
    expect(overview.primaryActions.openPointsHref).toBe("/app/points?source=campaigns");
  });

  it("keeps campaign next steps in the core event-and-points loop", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing campaign next-step fallback.");
    const overview = getMemberRushMonthCampaignOverview(actor, data);

    expect(overview.primaryActions.openEventsHref).toBe("/app/events?source=campaigns");
    expect(overview.primaryActions.openPointsHref).toBe("/app/points?source=campaigns");
  });
});
