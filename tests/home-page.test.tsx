import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

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
  it("keeps the member home focused on the simple event loop", async () => {
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
    expect(html).toContain("This Week&#x27;s Priority");
    expect(html).toContain("Invite 3 friends to the Intro GBM");
    expect(html).toContain("Start next action");
    expect(html).toContain("My Points · Rush Month");
    expect(html).toContain("Leaderboard →");
    expect(html).toContain("MEDLIFE Stories");
    expect(html).toContain("Upcoming Events");
    expect(html).toContain("Tabling at Bruin Walk");
    expect(html).toContain("Active Campaign");
    expect(html).toContain("Rush Month");
    expect(html).toContain("Take Action: My Tasks");
    expect(html).toContain("Add 5 leads to the spreadsheet");
    expect(html).toContain("Chapter Leaderboard");
    expect(html).toContain("Coach David Kim");
    expect(html).toContain('href="/app"');
    expect(html).toContain('href="/app/events"');
    expect(html).toContain('href="/app/points"');
    expect(html).toContain('href="/profile"');
    expect(html).toContain("RSVP&#x27;d");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain('href="/slt-prep"');
  });

  it("keeps traveler users inside the same core home even when SLT Prep stays hidden from the launch lane", async () => {
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

    expect(html).toContain("Hi, Taylor");
    expect(html).toContain("Upcoming Events");
    expect(html).toContain("Take Action: My Tasks");
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
});
