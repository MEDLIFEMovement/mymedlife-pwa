import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/rush-month/leaderboard",
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

describe("leaderboard page", () => {
  it("lets the member leaderboard route open with the member points surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leaderboard page."),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/rush-month/leaderboard/page"
    );
    const html = renderToStaticMarkup(await RushMonthLeaderboardPage({}));

    expect(html).toContain("Points &amp; Recognition");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("What should I do next?");
    expect(html).not.toContain("Points loop");
    expect(html).toContain("Recent Approved Actions");
    expect(html).toContain("How points work");
    expect(html).toContain("Chapter Leaderboard — Rush Month");
    expect(html).toContain("Welcome one new student at tabling");
    expect(html).not.toContain("Open the chapter home and align the leader team");
    expect(html).not.toContain("Assign Rush Month outreach owners");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });

  it("treats committee members as part of the member-owned leaderboard surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("committee.member@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing committee-member leaderboard page."),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/rush-month/leaderboard/page"
    );
    const html = renderToStaticMarkup(await RushMonthLeaderboardPage({}));

    expect(html).toContain("Points &amp; Recognition");
    expect(html).not.toContain("What should I do next?");
    expect(html).not.toContain("Points loop");
  });

  it("keeps campaign focus on the same leaderboard route when a campaign query is selected", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leaderboard campaign focus."),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/rush-month/leaderboard/page"
    );
    const html = renderToStaticMarkup(
      await RushMonthLeaderboardPage({
        searchParams: Promise.resolve({ campaign: "rush-month" }),
      }),
    );

    expect(html).toContain("Campaign focus");
    expect(html).toContain("Rush Month");
    expect(html).toContain("See how to earn more points");
    expect(html).toContain("/rush-month/leaderboard?campaign=rush-month#campaign-focus");
  });

  it("keeps the home handoff visible across the member points route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leaderboard home handoff."),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/rush-month/leaderboard/page"
    );
    const html = renderToStaticMarkup(
      await RushMonthLeaderboardPage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(html).toContain("From home");
    expect(html).toContain(
      "Home handed you into recognition as part of the weekly loop. Review progress here and still jump back without losing the member-home context.",
    );
    expect(html).toContain("Back to home");
    expect(html).toContain('href="/"');
    expect(html).toContain("/rush-month/leaderboard?campaign=rush-month&amp;source=home#campaign-focus");
    expect(html.indexOf("Points &amp; Recognition")).toBeLessThan(html.indexOf("From home"));
  });

  it("keeps the profile handoff visible across the member points route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leaderboard profile handoff."),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/rush-month/leaderboard/page"
    );
    const html = renderToStaticMarkup(
      await RushMonthLeaderboardPage({
        searchParams: Promise.resolve({ source: "profile" }),
      }),
    );

    expect(html).toContain("From profile");
    expect(html).toContain(
      "Profile should stay distinct while still connecting to meaningful recognition. Review your standing here and return when you need the broader member summary.",
    );
    expect(html).toContain("Back to profile");
    expect(html).toContain('href="/profile"');
    expect(html).toContain("/rush-month/leaderboard?campaign=rush-month&amp;source=profile#campaign-focus");
    expect(html.indexOf("Points &amp; Recognition")).toBeLessThan(html.indexOf("From profile"));
  });
});
