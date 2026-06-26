import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/campaigns/rush-month",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

describe("campaign detail page", () => {
  it("lets chapter leaders open the campaign detail surface directly", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: CampaignDetailPage } = await import("@/app/campaigns/[campaignSlug]/page");
    const html = renderToStaticMarkup(
      await CampaignDetailPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
      }),
    );

    expect(html).toContain("Rush Month");
    expect(html).toContain("Open active Rush Month loop");
    expect(html).toContain("active campaign");
    expect(html).toContain("Chapter-ready examples");
    expect(html).toContain("Story and proof follow-through");
    expect(html).toContain("Ecosystem boundaries");
    expect(html).toContain("Keep broader routing on hold for this campaign.");
    expect(html).not.toContain("External sends are disabled for this campaign.");
    expect(html).not.toContain("active campaign shell");
    expect(html).not.toContain("Mock/local only");
    expect(html).not.toContain("HQ sharing posture");
  });

  it("routes coaches into the coach-owned campaigns state with the selected campaign preserved", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );

    const { default: CampaignDetailPage } = await import("@/app/campaigns/[campaignSlug]/page");

    await expect(
      CampaignDetailPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/staff?view=campaigns&campaign=rush-month");
  });

  it("routes staff reviewers into the staff-owned campaigns state with the selected campaign preserved", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );

    const { default: CampaignDetailPage } = await import("@/app/campaigns/[campaignSlug]/page");

    await expect(
      CampaignDetailPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/staff?view=campaigns&campaign=rush-month");
  });

  it("shows workflow-engine posture on the Planning / Goal Setting campaign detail lane", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: CampaignDetailPage } = await import("@/app/campaigns/[campaignSlug]/page");
    const html = renderToStaticMarkup(
      await CampaignDetailPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
      }),
    );

    expect(html).toContain("Planning / Goal Setting");
    expect(html).toContain("Deepened starter campaign");
    expect(html).toContain("Operation permissions");
    expect(html).toContain("Validators and handoffs");
    expect(html).toContain("Risk and escalation posture");
    expect(html).toContain("Imported source coverage");
    expect(html).toContain("Feature flag posture");
    expect(html).toContain("Source trace posture");
    expect(html).toContain("Goal alignment meeting prompt");
    expect(html).toContain("Run A source map");
    expect(html).toContain("workflow.planning_goal_setting.builder_preview");
    expect(html).toContain("publish approve");
  });

  it("shows workflow-backed current-state posture on the Chapter Engagement campaign detail lane", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: CampaignDetailPage } = await import("@/app/campaigns/[campaignSlug]/page");
    const html = renderToStaticMarkup(
      await CampaignDetailPage({
        params: Promise.resolve({ campaignSlug: "chapter-engagement" }),
      }),
    );

    expect(html).toContain("Chapter Engagement");
    expect(html).toContain("Current workflow state");
    expect(html).toContain("v0 reviewed");
    expect(html).toContain("source template version");
  });
});
