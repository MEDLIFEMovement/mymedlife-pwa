import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  usePathname: () => "/app/points",
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

describe("leaderboard page", () => {
  it("lets the member leaderboard route open with the member points surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leaderboard page."),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/app/points/page"
    );
    const html = renderToStaticMarkup(await RushMonthLeaderboardPage({}));

    expect(html).toContain("Points &amp; Recognition");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("What should I do next?");
    expect(html).not.toContain("Points loop");
    expect(html).toContain("Live pilot readback");
    expect(html).toContain("Attendance confirmed; points pending");
    expect(html).toContain("Recent points activity");
    expect(html).toContain("How points work");
    expect(html).toContain("Chapter Leaderboard");
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
      getSignedInActor("committee.member@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing committee-member leaderboard page."),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/app/points/page"
    );
    const html = renderToStaticMarkup(await RushMonthLeaderboardPage({}));

    expect(html).toContain("Points &amp; Recognition");
    expect(html).not.toContain("What should I do next?");
    expect(html).not.toContain("Points loop");
  });

  it("ignores the old campaign query and keeps the points surface focused on the core loop", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leaderboard campaign focus."),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/app/points/page"
    );
    const html = renderToStaticMarkup(
      await RushMonthLeaderboardPage({
        searchParams: Promise.resolve({ campaign: "rush-month" }),
      }),
    );

    expect(html).toContain("Points &amp; Recognition");
    expect(html).toContain("Event loop");
    expect(html).toContain("Events create attendance, attendance creates points.");
    expect(html).not.toContain("Launch lane focus");
  });

  it("keeps the home handoff visible across the member points route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leaderboard home handoff."),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/app/points/page"
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
    expect(html).toContain('href="/app"');
    expect(html.indexOf("Points &amp; Recognition")).toBeLessThan(html.indexOf("From home"));
  });

  it("folds a legacy campaign-origin points landing into the standard member points surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leaderboard campaign handoff."),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/app/points/page"
    );
    const html = renderToStaticMarkup(
      await RushMonthLeaderboardPage({
        searchParams: Promise.resolve({ source: "campaigns" }),
      }),
    );

    expect(html).toContain("Points &amp; Recognition");
    expect(html).not.toContain("From campaigns");
    expect(html).toContain('href="/app/events?source=points"');
    expect(html).not.toContain('href="/campaigns"');
  });

  it("keeps the profile handoff visible across the member points route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leaderboard profile handoff."),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/app/points/page"
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
    expect(html.indexOf("Points &amp; Recognition")).toBeLessThan(html.indexOf("From profile"));
  });

  it("sends signed-out reviewers through login before showing the member points route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/app/points/page"
    );

    await expect(RushMonthLeaderboardPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fapp%2Fpoints",
    );
  });

  it("returns leaders to the leader points workspace instead of rendering the shared member leaderboard", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: RushMonthLeaderboardPage } = await import(
      "@/app/app/points/page"
    );

    await expect(RushMonthLeaderboardPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/leader?view=leaderboard",
    );
  });
});
