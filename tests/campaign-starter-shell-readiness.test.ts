import { describe, expect, it } from "vitest";
import { campaignShells } from "@/data/mock-campaigns";
import {
  getCampaignStarterShellReadiness,
  requiredStarterCampaigns,
} from "@/services/campaign-starter-shell-readiness";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("campaign starter shell readiness", () => {
  it("proves the exact required starter campaign shells are present", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const readiness = getCampaignStarterShellReadiness(actor);

    expect(readiness.canReadReadiness).toBe(true);
    expect(readiness.requiredCount).toBe(7);
    expect(readiness.presentCount).toBe(7);
    expect(readiness.missingCount).toBe(0);
    expect(readiness.items.map((item) => item.name)).toEqual([
      "Planning / Goal Setting",
      "Chapter Engagement",
      "SLT Promotion",
      "Moving Mountains",
      "Leadership Transition",
      "Grow the Movement",
      "Start a Chapter",
    ]);
    expect(readiness.items.map((item) => item.route)).toEqual([
      "/campaigns/planning-goal-setting",
      "/campaigns/chapter-engagement",
      "/campaigns/slt-promotion",
      "/campaigns/moving-mountains",
      "/campaigns/leadership-transition",
      "/campaigns/grow-the-movement",
      "/campaigns/start-a-chapter",
    ]);
  });

  it("keeps starter shells mock-safe and visibly incomplete beyond shell readiness", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const readiness = getCampaignStarterShellReadiness(actor);

    expect(readiness.browserWritesExpected).toBe(0);
    expect(readiness.externalWritesExpected).toBe(0);
    expect(
      readiness.items.every(
        (item) =>
          item.status === "shell_ready" &&
          item.browserWritesExpected === 0 &&
          item.externalWritesExpected === 0 &&
          item.safeToSendExternally === false &&
          item.actionLaneCount > 0 &&
          item.kpiCount > 0 &&
          item.hasStudentPromise &&
          item.hasOperatingRhythm &&
          item.nextBuildStep.length > 30,
      ),
    ).toBe(true);
    expect(readiness.summary).toContain("not end-to-end campaign builds yet");
  });

  it("reports a missing required campaign shell without hiding the gap", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const shellsWithoutSlt = campaignShells.filter(
      (campaign) => campaign.slug !== "slt-promotion",
    );
    const readiness = getCampaignStarterShellReadiness(actor, shellsWithoutSlt);
    const missing = readiness.items.find((item) => item.slug === "slt-promotion");

    expect(readiness.presentCount).toBe(6);
    expect(readiness.missingCount).toBe(1);
    expect(missing).toEqual(
      expect.objectContaining({
        name: "SLT Promotion",
        route: "/campaigns/slt-promotion",
        status: "missing",
        actionLaneCount: 0,
        kpiCount: 0,
      }),
    );
  });

  it("hides the starter-shell review from members and DS Admin", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getCampaignStarterShellReadiness(member).canReadReadiness).toBe(false);
    expect(getCampaignStarterShellReadiness(member).items).toEqual([]);
    expect(getCampaignStarterShellReadiness(dsAdmin).canReadReadiness).toBe(false);
    expect(getCampaignStarterShellReadiness(dsAdmin).items).toEqual([]);
  });

  it("keeps the source required-campaign list aligned to the final MVP names", () => {
    expect(requiredStarterCampaigns.map((campaign) => campaign.slug)).toEqual([
      "planning-goal-setting",
      "chapter-engagement",
      "slt-promotion",
      "moving-mountains",
      "leadership-transition",
      "grow-the-movement",
      "start-a-chapter",
    ]);
  });
});
