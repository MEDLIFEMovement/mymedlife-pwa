import { describe, expect, it } from "vitest";

import { assignments as mockAssignments } from "@/data/mock-rush-month";
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
    expect(overview.statusLabel).toBe("Active");
    expect(overview.weekLabel).toBe("Week 1 of 4");
    expect(overview.chapterProgressPercent).toBe(67);
    expect(overview.currentPhaseTitle).toBe("Week 1: Visibility + Lead Capture");
    expect(overview.kpis.map((kpi) => kpi.label)).toEqual([
      "Leads Captured",
      "Intro GBM RSVPs",
      "Follow-ups Done",
      "New Members",
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
    expect(overview.primaryActions.viewActionsHref).toBe("/rush-month/actions?source=campaigns");
    expect(overview.primaryActions.submitEvidenceHref).toBe(
      "/rush-month/actions/share-rush-flyer?step=submit&source=campaigns#submit-evidence",
    );
  });

  it("keeps the campaign-origin proof route when no proof-ready assignment is available", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const memberPushAssignment = mockAssignments.find(
      (assignment) => assignment.id === "member-push",
    );

    expect(memberPushAssignment).toBeDefined();

    const data = {
      ...getMockReadOnlyAppData("Testing campaign proof fallback."),
      assignments: memberPushAssignment ? [memberPushAssignment] : [],
    };
    const overview = getMemberRushMonthCampaignOverview(actor, data);

    expect(overview.primaryActions.submitEvidenceHref).toBe(
      "/rush-month/evidence?source=campaigns",
    );
  });
});
