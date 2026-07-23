import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext, type LocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
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

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/read-only-app-data")>();

  return {
    ...actual,
    getReadOnlyAppData: vi.fn(),
  };
});

function getSignedInActor(email: string): LocalActorContext {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("campaign route pages", () => {
  beforeEach(async () => {
    const dataModule = await import("@/services/read-only-app-data");
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Using TEST campaign fixtures."),
    );
  });

  it("renders the campaign catalog and starter-shell checkpoint for leader reviewers", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");
    const html = renderToStaticMarkup(await CampaignsPage());

    expect(html).toContain("Campaign operating shells");
    expect(html).toContain("Planning / Goal Setting");
    expect(html).toContain("Start a Chapter");
    expect(html).toContain("Required starter shells");
    expect(html).toContain('href="/campaigns/planning-goal-setting"');
  });

  it("renders the source-backed starter campaign detail for leaders", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: CampaignPage } = await import("@/app/campaigns/[campaignSlug]/page");
    const html = renderToStaticMarkup(
      await CampaignPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
      }),
    );

    expect(html).toContain("Planning / Goal Setting");
    expect(html).toContain("Deepened starter campaign");
    expect(html).toContain("Leader Planning / Goal Setting campaign plan");
    expect(html).toContain("Back to campaigns");
  });

  it("renders a Rush Month closeout review shell for coach/staff reviewers", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing campaign closeout route."),
    );

    const { default: CampaignPage } = await import("@/app/campaigns/[campaignSlug]/page");
    const html = renderToStaticMarkup(
      await CampaignPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
      }),
    );

    expect(html).toContain("Rush Month");
    expect(html).toContain("Phase closeout");
    expect(html).toContain("Open event loop");
    expect(html).toContain('href="/rush-month/events"');
    expect(html).toContain('href="/rush-month/leaderboard"');
    expect(html).toContain('href="/proof-library"');
    expect(html).toContain('href="/proof-library/upload"');
  });

  it("keeps non-member starter details out of the member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: CampaignPage } = await import("@/app/campaigns/[campaignSlug]/page");

    await expect(
      CampaignPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/campaigns");
  });

  it("renders the hosted member campaign from app-owned records", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const data = getMockReadOnlyAppData("test");
    const campaignRow = {
      ...data.campaignRows[0],
      id: data.campaign.id,
      chapter_id: data.chapter.id,
      name: "Fall Service Campaign",
      slug: "fall-service-campaign",
      objective: "Serve the local community through one chapter event.",
      status: "active" as const,
    };

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue({
      ...data,
      source: {
        mode: "supabase",
        status: "supabase_ready",
        message: "App-owned campaign data loaded.",
      },
      campaign: {
        ...data.campaign,
        id: campaignRow.id,
        name: campaignRow.name,
        objective: campaignRow.objective,
      },
      campaignRows: [campaignRow],
      assignments: [
        {
          ...data.assignments[0],
          title: "Invite members to Community Health Night",
          status: "approved",
          kpi: "member_invites",
        },
      ],
      phases: [
        {
          id: "phase-live-1",
          chapter_id: data.chapter.id,
          campaign_id: campaignRow.id,
          phase_template_id: null,
          title: "Community outreach",
          objective: "Invite members and confirm attendance.",
          starts_at: "2026-07-20T00:00:00Z",
          ends_at: "2026-07-30T00:00:00Z",
          status: "active",
          readiness_status: "ready",
          coach_validation_status: "not_required",
          required_outputs: [],
          entry_criteria: [],
          exit_criteria: ["Attendance recorded"],
          created_at: "2026-07-20T00:00:00Z",
          updated_at: "2026-07-20T00:00:00Z",
        },
      ],
      chapterEventRows: [
        {
          ...data.chapterEventRows[0],
          id: "event-live-1",
          chapter_id: data.chapter.id,
          campaign_id: campaignRow.id,
          title: "Community Health Night",
          status: "published",
        },
      ],
      lumaEventLinkRows: [],
      evidenceItems: [],
      pointsEventRows: [],
    });

    const { default: CampaignsPage } = await import("@/app/campaigns/page");
    const html = renderToStaticMarkup(await CampaignsPage());

    expect(html).toContain("Fall Service Campaign");
    expect(html).toContain("active · App-owned");
    expect(html).toContain("1/1 assignments approved");
    expect(html).toContain("Community outreach");
    expect(html).toContain("Invite members to Community Health Night");
    expect(html).toContain("Community Health Night");
    expect(html).not.toContain("67%");
    expect(html).not.toContain("TEST Rush Month Info Night");

    const { default: CampaignPage } = await import("@/app/campaigns/[campaignSlug]/page");
    const detailHtml = renderToStaticMarkup(
      await CampaignPage({
        params: Promise.resolve({ campaignSlug: "fall-service-campaign" }),
      }),
    );

    expect(detailHtml).toContain("App-owned campaign");
    expect(detailHtml).toContain("App-owned operating readback");
    expect(detailHtml).toContain("1/1 assignments approved");
    expect(detailHtml).toContain("Community Health Night · published");
    expect(detailHtml).not.toContain("Preview-only campaign shell");
  });
});
