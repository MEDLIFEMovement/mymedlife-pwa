import { describe, expect, it } from "vitest";
import { campaignShells } from "@/data/mock-campaigns";
import {
  getCampaignStarterShellReadiness,
  requiredStarterCampaigns,
} from "@/services/campaign-starter-shell-readiness";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("campaign starter shell readiness", () => {
  it("proves the exact required campaign lanes are present", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const readiness = getCampaignStarterShellReadiness(actor);

    expect(readiness.canReadReadiness).toBe(true);
    expect(readiness.requiredCount).toBe(7);
    expect(readiness.presentCount).toBe(7);
    expect(readiness.workflowBackedCount).toBe(7);
    expect(readiness.shellOnlyCount).toBe(0);
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

  it("keeps all workflow-backed lanes mock-safe and visibly incomplete", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const readiness = getCampaignStarterShellReadiness(actor);

    expect(readiness.browserWritesExpected).toBe(0);
    expect(readiness.externalWritesExpected).toBe(0);
    const workflowBacked = readiness.items.filter(
      (item) => item.status === "workflow_backed_draft",
    );
    expect(
      readiness.items.every(
        (item) =>
          item.status !== "missing" &&
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
    expect(workflowBacked).toHaveLength(7);
    expect(
      workflowBacked
        .filter((item) =>
          [
            "planning-goal-setting",
            "chapter-engagement",
            "slt-promotion",
            "moving-mountains",
            "leadership-transition",
          ].includes(item.slug),
        )
        .every(
          (item) =>
            item.workflowSource === "template_version" &&
            item.workflowVersionLabel === "v0 reviewed" &&
            item.currentPhaseLabel !== null,
        ),
    ).toBe(true);
    expect(
      workflowBacked
        .filter((item) =>
          ["grow-the-movement", "start-a-chapter"].includes(item.slug),
        )
        .every(
          (item) =>
            item.workflowSource === "template_version" &&
            item.workflowVersionLabel === "v0 reviewed" &&
            item.currentPhaseLabel !== null,
        ),
    ).toBe(true);
    expect(
      workflowBacked.every(
        (item) =>
          item.nextBuildStep.length > 30,
      ),
    ).toBe(true);
    expect(readiness.summary).toContain("All required lanes are now workflow-backed drafts");
  });

  it("reports a missing required campaign lane without hiding the gap", () => {
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

  it("hides the workflow-readiness review from members and DS Admin", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getCampaignStarterShellReadiness(member).canReadReadiness).toBe(false);
    expect(getCampaignStarterShellReadiness(member).items).toEqual([]);
    expect(getCampaignStarterShellReadiness(committeeMember).canReadReadiness).toBe(false);
    expect(getCampaignStarterShellReadiness(committeeMember).items).toEqual([]);
    expect(getCampaignStarterShellReadiness(committeeChair).canReadReadiness).toBe(true);
    expect(getCampaignStarterShellReadiness(committeeChair).title).toBe(
      "Leader campaign workflow readiness checkpoint",
    );
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
