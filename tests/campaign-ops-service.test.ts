import { describe, expect, it } from "vitest";
import { actionCommittees, campaignShells } from "@/data/mock-campaigns";
import {
  getCampaignIntegrationPosture,
  getCampaignReadinessSummary,
  getCampaignShellBySlug,
  getEventPlansForCampaign,
  getNextEventPlanForCommittee,
  getProofLibraryItemsForActor,
  getVisibleCampaignShellsForActor,
} from "@/services/campaign-ops-service";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("campaign ops service", () => {
  it("returns the active Rush Month campaign shell", () => {
    expect(getCampaignShellBySlug("rush-month")).toEqual(
      expect.objectContaining({
        name: "Rush Month",
        status: "active",
      }),
    );
  });

  it("filters visible campaigns by local actor role", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getVisibleCampaignShellsForActor(member).map((item) => item.slug)).toEqual([
      "rush-month",
    ]);
    expect(getVisibleCampaignShellsForActor(leader).map((item) => item.status)).not.toContain(
      "template",
    );
    expect(getVisibleCampaignShellsForActor(dsAdmin)).toEqual([]);
  });

  it("summarizes campaign readiness and disabled integration posture", () => {
    expect(getCampaignReadinessSummary()).toEqual({
      activeCampaigns: 1,
      plannedCampaigns: 2,
      templateCampaigns: 9,
      linkedMockEvents: 1,
      hqProofItems: 2,
      disabledIntegrationEvents: 2,
    });
  });

  it("groups event plans and proof around campaigns", () => {
    expect(getEventPlansForCampaign("rush-month").map((item) => item.title)).toEqual([
      "Freshman welcome social",
      "Health equity intro Med Talk",
    ]);
    expect(getNextEventPlanForCommittee("committee-social")).toEqual(
      expect.objectContaining({
        title: "Freshman welcome social",
      }),
    );
  });

  it("keeps proof library hidden from DS Admin", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getProofLibraryItemsForActor(admin).length).toBeGreaterThan(0);
    expect(getProofLibraryItemsForActor(dsAdmin)).toEqual([]);
  });

  it("marks campaign integration events as not safe for external sending", () => {
    const posture = getCampaignIntegrationPosture("rush-month");

    expect(posture.safeToSendExternally).toBe(false);
    expect(posture.events.length).toBeGreaterThan(0);
    expect(posture.events.every((event) => event.status !== "recorded")).toBe(true);
    expect(posture.events.some((event) => event.destination === "Luma")).toBe(true);
    expect(posture.events.some((event) => event.destination === "warehouse")).toBe(true);
  });

  it("keeps the catalog intentionally small and readable", () => {
    expect(campaignShells.map((campaign) => campaign.name)).toEqual(
      expect.arrayContaining([
        "Planning / Goal Setting",
        "Chapter Engagement",
        "SLT Promotion",
        "Moving Mountains",
        "Leadership Transition",
        "Grow the Movement",
        "Start a Chapter",
      ]),
    );
    expect(campaignShells).toHaveLength(12);
    expect(actionCommittees).toHaveLength(5);
  });
});
