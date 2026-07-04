import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/leader",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
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

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("leader page", () => {
  it("returns members to their owned student surface instead of showing the leader shell", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member redirect from leader route."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");

    await expect(LeaderPage({})).rejects.toThrow("NEXT_REDIRECT:/app");
  });

  it("sends signed-out reviewers to login before opening the command center", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing signed-out leader redirect."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");

    await expect(LeaderPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fleader%3Fview%3Doverview",
    );
  });

  it("renders the student leadership command center as the real leader workspace", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader command center page."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");
    const html = renderToStaticMarkup(await LeaderPage({}));

    expect(html).toContain("Leadership Center");
    expect(html).toContain("Chapter Dashboard · Jun 2025");
    expect(html).toContain("Boston College MEDLIFE");
    expect(html).toContain("Create Event");
    expect(html).toContain("Assign Action");
    expect(html).toContain("Promote Emerging Leader");
    expect(html).toContain("Chapter Metrics — June 2025");
    expect(html).toContain("Risk Alerts");
    expect(html).toContain("This Week&#x27;s Priority");
    expect(html).toContain("Weekly Points Trend");
    expect(html).not.toContain("Leader navigation");
    expect(html).not.toContain("Live event controls");
    expect(html).not.toContain("Leader event tracking");
  });

  it("renders the events view inside the command center instead of the old parked launch lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader events view."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");
    const html = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "events",
        }),
      }),
    );

    expect(html).toContain(">Events<");
    expect(html).toContain("Event Performance");
    expect(html).toContain("Luma event creation, RSVP, attendance, and points");
    expect(html).toContain("Luma readback");
    expect(html).toContain("Moving Mountains Kickoff");
    expect(html).not.toContain("Live event controls");
    expect(html).not.toContain("Simple attendance list");
  });

  it("renders route-specific leader screens instead of parking sidebar items", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing route-specific leader screens."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");
    const bridgeHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
        }),
      }),
    );
    const membersHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "members",
        }),
      }),
    );
    const committeesHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "committees",
        }),
      }),
    );
    const successionHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "succession",
        }),
      }),
    );
    const feedHtml = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "feed_analytics",
        }),
      }),
    );

    expect(bridgeHtml).toContain("Bridge Video Hub");
    expect(bridgeHtml).toContain("Chapters Using");
    expect(bridgeHtml).not.toContain("Chapter Leaderboard");

    expect(membersHtml).toContain("Member Pipeline");
    expect(membersHtml).toContain("leadership growth and points");
    expect(membersHtml).not.toContain("Chapter Metrics — June 2025");

    expect(committeesHtml).toContain("Event Committees");
    expect(committeesHtml).toContain("open actions");
    expect(committeesHtml).not.toContain("Chapter Metrics — June 2025");

    expect(successionHtml).toContain("Succession Planning");
    expect(successionHtml).toContain("transition");
    expect(successionHtml).not.toContain("Chapter Metrics — June 2025");

    expect(feedHtml).toContain("Feed Analytics");
    expect(feedHtml).toContain("Chapter feed engagement");
    expect(feedHtml).not.toContain("Chapter Metrics — June 2025");
  });
});
