import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  usePathname: () => "/",
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

describe("home page", () => {
  it("keeps the member home focused on the student workspace instead of preview controls", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "member.a@mymedlife.test",
        undefined,
        "mock_fallback",
        "local_actor_email",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member home page."),
    );

    const { default: HomePage } = await import("@/app/page");
    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Hi, Sofia");
    expect(html).not.toContain("Hi, Sofia 👋");
    expect(html).toContain("This Week&#x27;s Priority");
    expect(html).toContain("Week 1 of 4");
    expect(html).toContain("Event loop");
    expect(html).toContain("Luma, RSVP, attendance, and points are the story to watch.");
    expect(html).toContain(
      "Turn campus interest into actual student action through invites, events, follow-up, and proof.",
    );
    expect(html).toContain("Campaign progress");
    expect(html).toContain("Upcoming events");
    expect(html).toContain("Points");
    expect(html).toContain("Next: Tabling at Bruin Walk · RSVP and attendance drive points");
    expect(html).toContain("Full board");
    expect(html).toContain("/rush-month/leaderboard");
    expect(html).toContain("Open Rush Month campaign");
    expect(html).not.toContain("Traveler access");
    expect(html).toContain('href="/campaigns?source=home"');
    expect(html).toContain('href="/rush-month/actions?source=home"');
    expect(html).toContain('href="/rush-month/events?source=home"');
    expect(html).toContain('href="/rush-month/leaderboard?source=home"');
    expect(html).toContain('href="/campaigns"');
    expect(html).toContain('href="/rush-month/events"');
    expect(html).toContain('href="/rush-month/leaderboard"');
    expect(html).toContain('href="/profile"');
    expect(html).toContain("Upcoming Events");
    expect(html).toContain("Intro GBM");
    expect(html).toContain("Ackerman 2100");
    expect(html).toContain("Luma");
    expect(html).toContain("RSVP");
    expect(html).toContain("RSVP&#x27;d");
    expect(html).toContain("Bruin Walk Table 7");
    expect(html).toContain("Add 5 leads");
    expect(html).toContain(">Submitted<");
    expect(html).toContain("RSVP → attendance → points");
    expect(html).not.toContain("mock linked");
    expect(html).not.toContain("future sync disabled");
    expect(html.indexOf("Intro GBM")).toBeLessThan(html.indexOf("Tabling at Bruin Walk"));
    expect(html).toContain("Coach David Kim");
    expect(html).toContain("Coach message");
    expect(html).toContain("My Points · Rush Month");
    expect(html).toContain(">145<");
    expect(html).toContain("+75 this week · Chapter rank #3");
    expect(html).toContain("Leaderboard →");
    expect(html).toContain("Aisha N.");
    expect(html).toContain("Marcus T.");
    expect(html).toContain("You (Sofia Alvarez)");
    expect(html).toContain("James L.");
    expect(html).not.toContain("Switch View");
    expect(html.indexOf("Active Campaign")).toBeLessThan(html.indexOf("Coach message"));
    expect(html).not.toContain("Data source status");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("See your chapter campaigns");
    expect(html).not.toContain("Evidence and belief");
    expect(html).not.toContain("Your role and account");
    expect(html).not.toContain("SLT readiness");
    expect(html).not.toContain('href="/slt-prep"');
    expect(html).not.toContain('href="/rush-month/evidence"');
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });

  it("shows traveler users a visible SLT Prep entry point on home", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "traveler.a@mymedlife.test",
        undefined,
        "mock_fallback",
        "local_actor_email",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing traveler home page."),
    );

    const { default: HomePage } = await import("@/app/page");
    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Traveler access");
    expect(html).toContain("SLT Prep");
    expect(html).toContain("Open SLT Prep");
    expect(html).toContain('href="/app/slt-prep?source=home"');
  });

  it("keeps committee members on the owned mobile home route instead of redirecting them away", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const navigationModule = await import("next/navigation");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "committee.member@mymedlife.test",
        undefined,
        "mock_fallback",
        "local_actor_email",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing committee-member home ownership."),
    );
    vi.mocked(navigationModule.redirect).mockClear();

    const { default: HomePage } = await import("@/app/page");
    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("This Week&#x27;s Priority");
    expect(html).toContain("My Actions");
    expect(vi.mocked(navigationModule.redirect)).not.toHaveBeenCalled();
  });
});
