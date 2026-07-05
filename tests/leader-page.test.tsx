import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/leader",
  useRouter: () => ({
    replace: vi.fn(),
  }),
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
    expect(html).toContain("College / University Chapter");
    expect(html).toContain("Create Event");
    expect(html).toContain("Chapter Metrics — June 2025");
    expect(html).toContain("Risk Alerts");
    expect(html).toContain("This Week&#x27;s Priority");
    expect(html).toContain("Weekly Points Trend");
    expect(html).not.toContain("Assign Task");
    expect(html).not.toContain("Promote Emerging Leader");
    expect(html).not.toContain("Leadership page not yet available");
    expect(html).not.toContain("MEDLIFE Stories");
    expect(html).not.toContain("Bridge Videos");
    expect(html).not.toContain("Leadership Training");
    expect(html).not.toContain("Proof Review");
    expect(html).not.toContain("Campaigns");
    expect(html).not.toContain("Leader navigation");
    expect(html).not.toContain("Live event controls");
    expect(html).not.toContain("Leader event tracking");
  });

  it("opens the requested Figma-owned screen from the leader view query", async () => {
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

    expect(html).toContain("Event Performance");
    expect(html).toContain("Create Event");
    expect(html).toContain("All Events — June 2025");
    expect(html).not.toContain("Chapter Metrics — June 2025");
    expect(html).not.toContain("Live event controls");
    expect(html).not.toContain("Luma readback");
  });

  it("renders the chapter leaderboard when reviewers open /leader?view=leaderboard", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader leaderboard view."),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");
    const html = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view: "leaderboard",
        }),
      }),
    );

    expect(html).toContain("Chapter Leaderboard");
    expect(html).toContain("Ranked Chapter Leaderboard");
    expect(html).toContain("Points Score");
    expect(html).toContain("Organizational Average");
    expect(html).toContain("Boston College vs. National");
    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Your Chapter");
    expect(html).not.toContain("Chapter Metrics — June 2025");
  });

  it.each([
    ["overview", "This Week&#x27;s Priority"],
    ["leaderboard", "Ranked Chapter Leaderboard"],
    ["events", "All Events — June 2025"],
  ])("renders the %s core launch view as its own screen", async (view, expectedCopy) => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData(`Testing leader ${view} view.`),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");
    const html = renderToStaticMarkup(
      await LeaderPage({
        searchParams: Promise.resolve({
          view,
        }),
      }),
    );

    expect(html).toContain(expectedCopy);
  });

  it.each([
    ["members", "/leader?view=events"],
    ["member_profile", "/leader?view=events"],
    ["committees", "/leader?view=events"],
    ["succession", "/leader?view=events"],
    ["impact", "/leader?view=leaderboard"],
    ["bridge_videos", "/leader?view=leaderboard"],
    ["feed_analytics", "/leader?view=leaderboard"],
    ["training", "/leader?view=overview"],
    ["values", "/leader?view=overview"],
    ["leaders", "/leader?view=overview"],
    ["create_event", "/leader?view=overview"],
    ["stories", "/leader?view=overview"],
  ])("parks the %s leader view inside the launch lane", async (view, expectedHref) => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData(`Testing parked leader ${view} view.`),
    );

    const { default: LeaderPage } = await import("@/app/leader/page");

    await expect(
      LeaderPage({
        searchParams: Promise.resolve({
          view,
        }),
      }),
    ).rejects.toThrow(`NEXT_REDIRECT:${expectedHref}`);
  });

  it("keeps the copied Figma leader shell close to the exported code size and state map", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/figma-leader-command-center.tsx"),
      "utf8",
    );
    const lineCount = source.split("\n").length;

    expect(lineCount).toBeGreaterThanOrEqual(3950);
    expect(lineCount).toBeLessThanOrEqual(4150);
    expect(source).toContain('initialScreen = "home"');
    expect(source).toContain("const [screen, setScreen] = useState<Screen>(initialScreen);");
    expect(source).toContain("<Sidebar active={screen} onNav={navigateToScreen}/>");
    expect(source).toContain("buildLeaderCommandCenterHrefForScreen");
    expect(source).toContain("Ranked Chapter Leaderboard");
    expect(source).toContain('aria-label="Ranked chapter leaderboard"');
    expect(source).toContain("disabled={isBlocked}");
    expect(source).toContain('screen==="events"');
    expect(source).toContain('screen==="create-event"');
    expect(source).toContain('screen==="stories"');
    expect(source).toContain("CreateEventForm");
    expect(source).toContain("MedlifeStoriesScreen");
    expect(source).toContain("MISSING_LEADERSHIP_PAGES");
    expect(source).toContain("Leadership page not yet available");
  });
});
