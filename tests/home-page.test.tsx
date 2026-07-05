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

    expect(html).toContain("Hi, Sofia");
    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Start next action");
    expect(html).toContain("My Points · Rush Month");
    expect(html).toContain("MEDLIFE Stories");
    expect(html).toContain("Upcoming Events");
    expect(html).toContain("Intro GBM");
    expect(html).toContain("Tabling at Bruin Walk");
    expect(html).toContain("Active Campaign");
    expect(html).toContain("Rush Month");
    expect(html).toContain("Chapter Leaderboard");
    expect(html).toContain("Profile");
    expect(html).toContain("Events");
    expect(html).toContain("Points");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain('href="/slt-prep"');
  });

  it("keeps traveler users inside the same Figma mobile shell when SLT Prep stays hidden from the launch lane", async () => {
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

    expect(html).toContain("Hi, Sofia");
    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Upcoming Events");
    expect(html).toContain("Start next action");
    expect(html).not.toContain("Open SLT Prep");
    expect(html).not.toContain('href="/app/slt-prep?source=home"');
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

    expect(lineCount).toBeGreaterThanOrEqual(3490);
    expect(lineCount).toBeLessThanOrEqual(3510);
    expect(source).toContain('const [screen, setScreen] = useState<Screen>("home");');
    expect(source).toContain('case "events": return <EventsScreen navigate={navigate} />;');
    expect(source).toContain('case "event-detail": return <EventDetailScreen navigate={navigate} />;');
    expect(source).toContain('case "points": return <PointsLeaderboard navigate={navigate} />;');
    expect(source).toContain("<BottomNav active={screen} navigate={navigate} />");
    expect(source).toContain("disabled={!onClick}");
    expect(source).toContain("Secure admin route required");
    expect(source).toContain("External source links are blocked in this preview");
    expect(source).not.toContain("onClick={() => {}}");
    expect(source).not.toContain('href="#"');
  });
});
