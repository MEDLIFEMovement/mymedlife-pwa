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
    expect(html).toContain('href="/profile"');
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

    expect(html).toContain("Hi, TEST Sofia");
    expect(html).toContain("TEST UCLA MEDLIFE");
    expect(html).toContain("Upcoming Events");
    expect(html).toContain("Start next action");
    expect(html).toContain("SLT Prep");
    expect(html).toContain("TEST Peru SLT");
    expect(html).toContain("TEST Return flight still needs final confirmation");
    expect(html).toContain('href="/app/slt-prep?source=home"');
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
    const lineCount = source.split("\n").length;

    expect(lineCount).toBeGreaterThanOrEqual(3450);
    expect(lineCount).toBeLessThanOrEqual(3640);
    expect(source).toContain("initialScreen = \"home\"");
    expect(source).toContain("const [screen, setScreen] = useState<Screen>(initialScreen);");
    expect(source).toContain('case "events": return <EventsScreen navigate={navigate} />;');
    expect(source).toContain('case "event-detail": return <EventDetailScreen navigate={navigate} />;');
    expect(source).toContain('case "points": return <PointsLeaderboard source={pointsSource} />;');
    expect(source).toContain('"/app/stories"');
    expect(source).toContain('"/app/events"');
    expect(source).toContain('"/app/points"');
    expect(source).toContain('"/profile"');
    expect(source).toContain("<BottomNav active={screen} navigate={navigate} />");
    expect(source).toContain("disabled={!onClick}");
    expect(source).toContain("Secure admin route required");
    expect(source).toContain("External source links are blocked in this preview");
    expect(source).not.toContain("onClick={() => {}}");
    expect(source).not.toContain('href="#"');
  });
});
