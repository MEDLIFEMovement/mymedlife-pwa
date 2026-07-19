import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  usePathname: () => "/app",
  useSearchParams: () => new URLSearchParams(),
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

describe("home page", () => {
  it("renders the exact Figma general member mobile shell", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member home page."),
    );

    const { default: HomePage } = await import("@/app/app/page");
    const html = renderToStaticMarkup(await HomePage({}));

    expect(html).toContain("Hi, TEST Sofia");
    expect(html).toContain("TEST UCLA MEDLIFE");
    expect(html).toContain("Start next action");
    expect(html).toContain("My Points · Rush Month");
    expect(html).toContain("MEDLIFE Stories");
    expect(html).toContain("Upcoming Events");
    expect(html).toContain("TEST Intro GBM");
    expect(html).toContain("TEST Tabling at Bruin Walk");
    expect(html).toContain("Active Campaign");
    expect(html).toContain("Rush Month");
    expect(html).toContain("Chapter Leaderboard");
    expect(html).toContain("Open TEST profile &amp; chapter scope");
    expect(html).toContain("Profile");
    expect(html).toContain("Stories");
    expect(html).toContain("Events");
    expect(html).toContain("Points");
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=home"');
    expect(html).toContain('href="/app/events/chapter-event-lakeside-welcome?source=home"');
    expect(html).toContain('href="/app/points?source=home"');
    expect(html).toContain('href="/app/stories"');
    expect(html).toContain('href="/profile?source=home"');
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain('href="/slt-prep"');
    expect(html).not.toContain('href="/app/slt-prep?source=home"');
  });

  it("adds a route-backed SLT Prep handoff for traveler users inside the member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("traveler.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing traveler home page."),
    );

    const { default: HomePage } = await import("@/app/app/page");
    const html = renderToStaticMarkup(await HomePage({}));

    expect(html).toContain("Hi, TEST Taylor");
    expect(html).toContain("TEST UCLA MEDLIFE");
    expect(html).toContain("Upcoming Events");
    expect(html).toContain("Start next action");
    expect(html).toContain("SLT Prep");
    expect(html).toContain("TEST Peru SLT");
    expect(html).toContain("TEST Return flight still needs final confirmation");
    expect(html).toContain('href="/app/slt-prep?source=home"');
  });

  it("renders actor-scoped Supabase events instead of cross-chapter Figma fixtures", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const data = getMockReadOnlyAppData("Testing production event scoping.");
    const bostonEventId = "f9589a94-0119-4c28-8ca2-870cb2fce97c";

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue({
      ...data,
      source: {
        mode: "supabase",
        status: "supabase_ready",
        message: "Reading actor-scoped production data.",
      },
      chapterEventRows: [
        {
          ...data.chapterEventRows[0],
          id: bostonEventId,
          title: "Test Boston University Luma RSVP Night",
          starts_at: "2026-11-20T23:00:00Z",
          attendance_count: 0,
        },
      ],
      lumaEventLinkRows: [],
      pointsEventRows: [],
    });

    const { default: HomePage } = await import("@/app/app/page");
    const html = renderToStaticMarkup(await HomePage({}));

    expect(html).toContain("No upcoming events are published for this chapter.");
    expect(html).not.toContain("TEST Test Boston University Luma RSVP Night");
    expect(html).not.toContain(`/app/events/${bostonEventId}?source=home`);
    expect(html).not.toContain("Ackerman 2100");
    expect(html).not.toContain("Bruin Walk Table 7");
    expect(html).not.toContain("chapter-event-lakeside-welcome");
  });

  it("keeps committee members on the owned mobile home route instead of redirecting them away", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const navigationModule = await import("next/navigation");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("committee.member@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing committee-member home ownership."),
    );
    vi.mocked(navigationModule.redirect).mockClear();

    const { default: HomePage } = await import("@/app/app/page");
    const html = renderToStaticMarkup(await HomePage({}));

    expect(html).toContain("Upcoming Events");
    expect(html).toContain("Chapter Leaderboard");
    expect(vi.mocked(navigationModule.redirect)).not.toHaveBeenCalled();
  });

  it("keeps the copied Figma member shell close to the exported code size and state map", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/figma-member-mobile-home.tsx"),
      "utf8",
    );
    const navSource = readFileSync(
      join(process.cwd(), "src/components/member-bottom-nav.tsx"),
      "utf8",
    );
    const lineCount = source.split("\n").length;

    expect(lineCount).toBeGreaterThanOrEqual(3450);
    expect(lineCount).toBeLessThanOrEqual(4500);
    expect(source).toContain("initialScreen = \"home\"");
    expect(source).toContain("const [screen, setScreen] = useState<Screen>(initialScreen);");
    expect(source).toContain('case "events":');
    expect(source).toContain("source={eventsSource}");
    expect(source).toContain("initialCampaign={initialEventsCampaign}");
    expect(source).toContain('case "event-detail": return <EventDetailScreen navigate={navigate} memberContext={memberContext} />;');
    expect(source).toContain('case "points":');
    expect(source).toContain("<PointsLeaderboard");
    expect(source).toContain("returnEventId={pointsReturnEventId}");
    expect(source).toContain("returnCampaign={pointsReturnCampaign}");
    expect(source).toContain('import { MemberBottomNav, type MemberBottomNavTab } from "@/components/member-bottom-nav";');
    expect(source).toContain("<MemberBottomNav");
    expect(source).toContain("activeTab={activeBottomTab}");
    expect(source).toContain("profileHref={profileHref}");
    expect(source).toContain("hrefOverrides={bottomNavHrefOverrides}");
    expect(navSource).toContain('"/app/stories"');
    expect(navSource).toContain('"/app/events"');
    expect(navSource).toContain('"/app/points"');
    expect(navSource).toContain('"/profile"');
    expect(navSource).toContain('aria-label="Member bottom navigation"');
    expect(source).toContain("disabled={!onClick}");
    expect(source).toContain("Secure admin route required");
    expect(source).toContain("External source links are blocked in this preview");
    expect(source).not.toContain("onClick={() => {}}");
    expect(source).not.toContain('href="#"');
  });
});
