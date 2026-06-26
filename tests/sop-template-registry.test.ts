import { describe, expect, it } from "vitest";
import {
  buildOutboxPreviewRecords,
  evaluateCampaignStepAccess,
  getAllowedTemplateVersionTransitions,
  getFirstStructuredImportTemplate,
  getPreferredCampaignVersion,
  getSopTemplateBySlug,
  getSopTemplateRegistry,
} from "@/services/sop-template-registry";

describe("sop template registry", () => {
  it("starts the first structured import with Planning / Goal Setting", () => {
    const template = getFirstStructuredImportTemplate();

    expect(template?.slug).toBe("planning-goal-setting");
    expect(template?.liveVersionId).toBeNull();
    expect(template?.versions.map((version) => version.status)).toEqual([
      "draft_imported",
      "draft_reviewed",
    ]);
  });

  it("prefers the reviewed draft when no live version exists", () => {
    const version = getPreferredCampaignVersion("planning-goal-setting");

    expect(version?.id).toBe("planning-goal-setting-v0-review");
    expect(version?.status).toBe("draft_reviewed");
    expect(version?.coachPdfPages).toBe("1-32");
    expect(version?.chapterPlatformPdfPages).toBe("184-213");
    expect(version?.sourcePerspectives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "coach",
          pdfPages: "1-32",
          label: "Coach perspective",
        }),
        expect.objectContaining({
          key: "chapter_platform",
          pdfPages: "184-213",
          label: "Chapter / platform perspective",
        }),
      ]),
    );
    expect(version?.operationPermissions.length).toBeGreaterThan(0);
    expect(version?.validatorDefinitions.length).toBeGreaterThan(0);
    expect(version?.handoffRules.length).toBeGreaterThan(0);
    expect(version?.featureFlagBindings.length).toBeGreaterThan(0);
    expect(version?.importTraceRecords.length).toBeGreaterThan(0);
  });

  it("keeps lifecycle transitions explicit and conservative", () => {
    expect(getAllowedTemplateVersionTransitions("draft_imported")).toEqual([
      "draft_reviewed",
      "archived",
    ]);
    expect(getAllowedTemplateVersionTransitions("draft_reviewed")).toEqual([
      "live",
      "scheduled",
      "archived",
    ]);
    expect(getAllowedTemplateVersionTransitions("live")).toEqual(["archived"]);
  });

  it("evaluates role and scope access from structured step rules", () => {
    const presidentAccess = evaluateCampaignStepAccess({
      campaignSlug: "planning-goal-setting",
      role: "president",
      scope: "chapter",
      stepId: "planning-goal-brief",
    });
    const memberAccess = evaluateCampaignStepAccess({
      campaignSlug: "planning-goal-setting",
      role: "student_member",
      scope: "own",
      stepId: "planning-goal-brief",
    });

    expect(presidentAccess).toEqual({
      roleMatches: true,
      scopeMatches: true,
      matchingRoleRules: [
        expect.objectContaining({
          id: "planning-president-chapter",
          role: "president",
          scope: "chapter",
        }),
      ],
    });
    expect(memberAccess).toEqual({
      roleMatches: false,
      scopeMatches: false,
      matchingRoleRules: [],
    });
  });

  it("builds outbox preview rows without enabling direct sends", () => {
    const outboxPreview = buildOutboxPreviewRecords({
      campaignSlug: "planning-goal-setting",
    });

    expect(outboxPreview.length).toBeGreaterThan(0);
    expect(outboxPreview.every((row) => row.directSendEnabled === false)).toBe(
      true,
    );
    expect(outboxPreview.map((row) => row.eventName)).toEqual(
      expect.arrayContaining([
        "campaign.phase.started",
        "kpi.event.created",
        "coach.decision.advance_hold_intervene",
      ]),
    );
  });

  it("keeps source-backed planning metadata visible from the registry", () => {
    const registry = getSopTemplateRegistry();
    const template = getSopTemplateBySlug("planning-goal-setting");
    const rushMonth = getSopTemplateBySlug("rush-month");

    expect(registry.map((entry) => entry.slug)).toEqual(
      expect.arrayContaining([
        "planning-goal-setting",
        "rush-month",
        "chapter-engagement",
        "slt-promotion",
        "moving-mountains",
        "leadership-transition",
        "grow-the-movement",
        "start-a-chapter",
      ]),
    );
    expect(template?.primaryAppLocations).toEqual(
      expect.arrayContaining([
        "/campaigns/planning-goal-setting",
        "/admin/sop-builder/planning-goal-setting",
      ]),
    );
    expect(
      template?.versions[0]?.sourceReferences.map((reference) => reference.location),
    ).toEqual(
      expect.arrayContaining([
        "00_START_HERE_CODEX_FULL_SOP_ROLLOUT.md",
        "Pages 1-32",
        "Pages 184-213",
      ]),
    );
    expect(rushMonth?.versions.map((version) => version.label)).toEqual([
      "v2.1 imported",
      "v2.1",
    ]);
    expect(
      rushMonth?.versions[0]?.sourceReferences.map((reference) => reference.location),
    ).toEqual(
      expect.arrayContaining([
        "00_START_HERE_CODEX_FULL_SOP_ROLLOUT.md",
        "Pages 33-59",
        "Pages 214-240",
      ]),
    );
  });

  it("adds draft-template coverage for the remaining required SOP families", () => {
    const chapterEngagement = getSopTemplateBySlug("chapter-engagement");
    const sltPromotion = getPreferredCampaignVersion("slt-promotion");
    const movingMountains = getSopTemplateBySlug("moving-mountains");
    const leadershipTransition = getSopTemplateBySlug("leadership-transition");
    const growTheMovement = getSopTemplateBySlug("grow-the-movement");
    const startAChapter = getSopTemplateBySlug("start-a-chapter");

    expect(chapterEngagement?.versions.map((version) => version.status)).toEqual([
      "draft_imported",
      "draft_reviewed",
    ]);
    expect(sltPromotion?.status).toBe("draft_reviewed");
    expect(movingMountains?.primaryAppLocations).toEqual(
      expect.arrayContaining([
        "/campaigns/moving-mountains",
        "/admin/sop-builder/moving-mountains",
      ]),
    );
    expect(leadershipTransition?.versions[0]?.sourceReferences.map((reference) => reference.location)).toEqual(
      expect.arrayContaining([
        "00_START_HERE_CODEX_FULL_SOP_ROLLOUT.md",
        "Pages 152-183",
        "Pages 323-end",
      ]),
    );
    expect(leadershipTransition?.versions[0]?.sourcePerspectives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "coach",
          pdfPages: "152-183",
        }),
        expect.objectContaining({
          key: "chapter_platform",
          pdfPages: "323-end",
        }),
      ]),
    );
    expect(growTheMovement?.versions[0]?.sourceReferences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: "campaign_catalog",
          certainty: "missing_source_confirmation",
        }),
        expect.objectContaining({
          id: "grow-the-movement-goal-doc",
          sourceType: "repo_context",
          certainty: "repo_only_placeholder",
        }),
      ]),
    );
    expect(startAChapter?.versions[0]?.sourceReferences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: "campaign_catalog",
          certainty: "missing_source_confirmation",
        }),
        expect.objectContaining({
          id: "start-a-chapter-goal-doc",
          sourceType: "repo_context",
          certainty: "repo_only_placeholder",
        }),
      ]),
    );
  });
});
