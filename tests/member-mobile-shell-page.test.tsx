import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { FigmaMemberMobileHome } from "@/components/figma-member-mobile-home";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getVisibleMemberGreetingName } from "@/services/member-mobile-identity-context";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
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

function getBottomNavHtml(html: string) {
  return html.match(/<nav aria-label="Member bottom navigation"[\s\S]*?<\/nav>/)?.[0] ?? "";
}

describe("member mobile shell routes", () => {
  it("renders the Home route with route-backed event and points links", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: HomePage } = await import("@/app/app/member-home-page");
    const html = renderToStaticMarkup(await HomePage({}));

    expect(html).toContain('href="/app/events"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=home&amp;step=rsvp"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=home"');
    expect(html).toContain('href="/app/events/chapter-event-lakeside-welcome?source=home"');
    expect(html).toContain('href="/app/points?source=home"');
    expect(html).toContain('href="/app/stories"');
    expect(html).toContain('href="/profile?source=home"');
  });

  it("renders the Home route with the full visible production TEST member identity", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const actor = getSignedInActor("member.a@mymedlife.test");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue({
      ...actor,
      user: {
        ...actor.user,
        displayName: "Test UCLA General Member Sam",
      },
    });

    const { default: HomePage } = await import("@/app/app/member-home-page");
    const html = renderToStaticMarkup(await HomePage({}));

    expect(html).toContain("Hi, TEST Test UCLA General Member Sam");
    expect(html).not.toContain("Hi, TEST Test 👋");
  });

  it("keeps zero-count signed-in members from inheriting demo progress", () => {
    const zeroContext = {
      displayName: "TEST Nick Ellis",
      firstName: "TEST Nick",
      chapterName: "TEST myMEDLIFE Review Chapter",
      campusName: "TEST myMEDLIFE Review Campus",
      pointsTotal: 0,
      pointsWeeklyLabel: "+0",
      pointsRankLabel: "#6",
      completedActions: 0,
      leaderboardRows: [
        { rank: 1, name: "TEST Aisha N.", role: "President", pts: 220 },
        { rank: 2, name: "TEST Marcus T.", role: "VP Outreach", pts: 185 },
        { rank: 6, name: "TEST Nick Ellis", role: "General Member", pts: 0, me: true },
      ],
    };

    const homeHtml = renderToStaticMarkup(
      <FigmaMemberMobileHome memberContext={zeroContext} />,
    );
    const pointsHtml = renderToStaticMarkup(
      <FigmaMemberMobileHome initialScreen="points" memberContext={zeroContext} />,
    );

    expect(homeHtml).toContain("Hi, TEST Nick");
    expect(homeHtml).toContain("Production assignment readback is not connected.");
    expect(homeHtml).toContain("No fixture task, due date, status, or point value is substituted");
    expect(homeHtml).not.toContain("actions done");
    expect(pointsHtml).toContain("TEST myMEDLIFE Review Chapter");
    expect(pointsHtml).toContain("0 / 150 pts");
    expect(pointsHtml).toContain("0 / 100 pts");
    expect(pointsHtml).toContain("0 / 80 pts");
    expect(pointsHtml).toContain("No approved TEST actions yet");
    expect(pointsHtml).toContain("You (TEST Nick Ellis)");
    expect(pointsHtml).not.toContain("75 / 150 pts");
    expect(pointsHtml).not.toContain("Approved 2h ago in preview");
  });

  it("keeps production TEST account identity visible on the member home greeting", () => {
    const productionMemberName = "Test UCLA General Member Sam";
    const homeHtml = renderToStaticMarkup(
      <FigmaMemberMobileHome
        memberContext={{
          displayName: "TEST Test UCLA General Member Sam",
          firstName: getVisibleMemberGreetingName(productionMemberName),
          chapterName: "TEST Test UCLA",
          campusName: "TEST UCLA",
          pointsTotal: 0,
          pointsWeeklyLabel: "+0",
          pointsRankLabel: "#6",
          completedActions: 0,
          leaderboardRows: [
            {
              rank: 6,
              name: "TEST Test UCLA General Member Sam",
              role: "General Member",
              pts: 0,
              me: true,
            },
          ],
        }}
      />,
    );

    expect(getVisibleMemberGreetingName("Nick Ellis")).toBe("TEST Nick");
    expect(getVisibleMemberGreetingName("TEST Nick Ellis")).toBe("TEST Nick");
    expect(homeHtml).toContain("Hi, TEST Test UCLA General Member Sam");
    expect(homeHtml).not.toContain("Hi, TEST Test 👋");
  });

  it("renders the Stories route through the shared Figma member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: StoriesPage } = await import("@/app/app/stories/page");
    const html = renderToStaticMarkup(await StoriesPage({}));

    expect(html).toContain(">Stories<");
    expect(html).toContain("MEDLIFE Stories · preview-only student feed");
    expect(html).toContain("For You");
    expect(html).toContain("Preview");
    expect(html).toContain("TEST @uconn");
    expect(html).toContain('href="/app/stories?filter=For+You&amp;story=1"');
    expect(html).toContain('href="/app/stories?filter=Events"');
    expect(html).toContain('href="/app/stories?filter=SLT"');
    expect(html).toContain('href="/app/stories?filter=Fundraising"');
    expect(html).toContain('href="/app/stories?filter=Leadership"');
    expect(html).not.toContain('href="/app/stories?filter=My+Chapter"');
    expect(html).not.toContain('href="/app/stories?filter=Trip+Moments"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("preview likes");
    expect(html).toContain("Preview only - comments open the reader; shares and saves stay blocked.");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-current="true"');
    expect(html).toContain(">Home<");
    expect(html).toContain(">Stories<");
    expect(html).toContain(">Events<");
    expect(html).toContain(">Points<");
    expect(html).toContain(">Profile<");
    expect(getBottomNavHtml(html)).toContain('href="/profile?source=stories"');
    expect(html).not.toContain("Live from the field");
    expect(html).not.toContain("Add Story");
    expect(html).not.toContain("stories published");
  });

  it("keeps the filtered stories route tied to profile inside the member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: StoriesPage } = await import("@/app/app/stories/page");
    const html = renderToStaticMarkup(
      await StoriesPage({
        searchParams: Promise.resolve({ filter: "Events" }),
      }),
    );

    expect(html).toContain('href="/app/stories?filter=Events"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(getBottomNavHtml(html)).toContain('href="/profile?source=stories&amp;storyFilter=Events"');
  });

  it("keeps the events route tied to the filtered stories feed when opened from stories", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(
      await EventsPage({
        searchParams: Promise.resolve({
          source: "stories",
          storyFilter: "Events",
          campaign: "Spring Showcase",
        }),
      }),
    );

    expect(html).toContain("Opened from the TEST stories feed");
    expect(html).toContain("Keep stories, events, and points in one member loop.");
    expect(html).toContain('href="/app/stories?filter=Events"');
    expect(html).toContain('href="/app/events?source=stories&amp;storyFilter=Events"');
    expect(html).toContain(
      'href="/app/events?source=stories&amp;storyFilter=Events&amp;campaign=Spring+Showcase"',
    );
    expect(html).toContain(
      'href="/app/events/chapter-event-mcgill-coffee-chat?source=stories&amp;storyFilter=Events&amp;campaign=Spring+Showcase"',
    );
    expect(html).not.toContain(
      'href="/app/events/test-showcase-planning-meeting?source=stories&amp;storyFilter=Events&amp;campaign=Spring+Showcase"',
    );
    expect(getBottomNavHtml(html)).toContain(
      'href="/app/points?source=stories&amp;campaign=Spring+Showcase&amp;storyFilter=Events"',
    );
    expect(getBottomNavHtml(html)).toContain(
      'href="/profile?source=stories&amp;storyFilter=Events&amp;campaign=Spring+Showcase"',
    );
  });

  it("renders the Events route through the shared Figma member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(await EventsPage({}));

    expect(html).toContain(">Events<");
    expect(html).toContain("Show up. Check in. Earn points.");
    expect(html).toContain("TEST Intro GBM");
    expect(html).not.toContain('href="/app/events/chapter-event-ucla-kickoff?source=events&amp;step=rsvp"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff"');
    expect(html).toContain('href="/app/events/chapter-event-lakeside-welcome"');
    expect(html).toContain('href="/app/events?campaign=Rush+Month"');
    expect(html).toContain('href="/app/events?campaign=Spring+Showcase"');
    expect(html).toContain('href="/app/events?campaign=Safe+Homes+Fundraiser"');
    expect(html).toContain('href="/app/events?campaign=Community+Health+Fair"');
    expect(html).toContain('aria-label="Show all TEST event campaigns"');
  });

  it("keeps the events route campaign filter route-backed inside the member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(
      await EventsPage({
        searchParams: Promise.resolve({ campaign: "Spring Showcase" }),
      }),
    );

    expect(html).toContain("Spring Showcase");
    expect(html).toContain("TEST Spring Showcase Kickoff");
    expect(html).toContain("TEST Showcase Planning Meeting");
    expect(html).toContain("Detail stays in this TEST campaign list preview for now.");
    expect(html).toContain("Upcoming");
    expect(html).toContain('href="/app/events"');
    expect(html).toContain('href="/app/events?campaign=Spring+Showcase"');
    expect(html).toContain(
      'href="/app/events/chapter-event-mcgill-coffee-chat?campaign=Spring+Showcase"',
    );
    expect(html).not.toContain(
      'href="/app/events/test-showcase-planning-meeting?source=events&amp;campaign=Spring+Showcase"',
    );
  });

  it("keeps the events route tied to the member points handoff when opened from points", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(
      await EventsPage({
        searchParams: Promise.resolve({ source: "points" }),
      }),
    );

    expect(html).toContain("Opened from Points &amp; Recognition");
    expect(html).toContain("Move from TEST points readback into the next event.");
    expect(html).toContain('href="/app/points?source=events"');
    expect(html).toContain("Back to Points");
    expect(getBottomNavHtml(html)).toContain('href="/app/points?source=events"');
    expect(getBottomNavHtml(html)).toContain('href="/profile?source=points"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=points&amp;step=rsvp"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=points"');
    expect(html).toContain('href="/app/events?source=points&amp;campaign=Rush+Month"');
  });

  it("keeps the events route tied to the home walkthrough when opened from home", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(
      await EventsPage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(html).toContain("Opened from the TEST home walkthrough");
    expect(html).toContain("Keep home, events, and points in one member loop.");
    expect(html).toContain('href="/app"');
    expect(html).toContain("Back to Home");
    expect(getBottomNavHtml(html)).toContain('href="/app/points?source=home"');
    expect(getBottomNavHtml(html)).toContain('href="/profile?source=home"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=home&amp;step=rsvp"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=home"');
  });

  it("keeps the events route tied to the profile walkthrough when opened from profile", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(
      await EventsPage({
        searchParams: Promise.resolve({ source: "profile" }),
      }),
    );

    expect(html).toContain("Opened from your TEST profile");
    expect(html).toContain("Keep profile, events, and points in one member loop.");
    expect(html).toContain('href="/profile"');
    expect(html).toContain("Back to Profile");
    expect(getBottomNavHtml(html)).toContain('href="/app/points?source=profile"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=profile&amp;step=rsvp"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=profile"');
  });

  it("keeps the filtered events route tied back to profile when opened from profile", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(
      await EventsPage({
        searchParams: Promise.resolve({
          source: "profile",
          campaign: "Spring Showcase",
        }),
      }),
    );

    expect(getBottomNavHtml(html)).toContain('href="/app/points?source=profile&amp;campaign=Spring%20Showcase"');
    expect(getBottomNavHtml(html)).toContain('href="/profile?campaign=Spring%20Showcase"');
    expect(html).toContain('href="/profile?campaign=Spring+Showcase"');
  });

  it("drops the generic All campaign marker when the filtered events loop returns from profile after points", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(
      await EventsPage({
        searchParams: Promise.resolve({
          source: "profile",
          profileSource: "points",
          campaign: "All",
        }),
      }),
    );

    expect(getBottomNavHtml(html)).toContain('href="/app/points?source=points"');
    expect(getBottomNavHtml(html)).toContain('href="/profile?source=points"');
    expect(html).toContain('href="/app/events?source=profile&amp;profileSource=points"');
    expect(html).not.toContain("campaign=All");
  });

  it("preserves exact profile-to-points continuity when the filtered events loop was opened from profile after points", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(
      await EventsPage({
        searchParams: Promise.resolve({
          source: "profile",
          profileSource: "points",
          campaign: "Spring Showcase",
        }),
      }),
    );

    expect(html).toContain("Opened from Points &amp; Recognition via your TEST profile");
    expect(html).toContain('href="/profile?source=points&amp;campaign=Spring+Showcase"');
    expect(getBottomNavHtml(html)).toContain('href="/app/points?source=points&amp;campaign=Spring%20Showcase"');
    expect(getBottomNavHtml(html)).toContain('href="/profile?source=points&amp;campaign=Spring%20Showcase"');
    expect(html).toContain('href="/profile?source=points&amp;campaign=Spring+Showcase"');
    expect(html).toContain(
      'href="/app/events/chapter-event-mcgill-coffee-chat?source=profile&amp;profileSource=points&amp;campaign=Spring+Showcase"',
    );
    expect(html).toContain(
      'href="/app/events?source=profile&amp;profileSource=points&amp;campaign=Spring+Showcase"',
    );
    expect(getBottomNavHtml(html)).not.toContain('href="/app/points?source=profile&amp;campaign=Spring%20Showcase"');
  });
  it("renders the Points route through the shared Figma member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(await PointsPage({}));

    expect(html).toContain("Points &amp; Recognition");
    expect(html).toContain("TEST UCLA MEDLIFE");
    expect(html).toContain("Preview-only TEST points come from route-backed member actions.");
    expect(html).toContain("Chapter Leaderboard — TEST Rush Month");
    expect(html).toContain("TEST Aisha N.");
    expect(html).toContain("Recent Approved Actions");
    expect(html).toContain("Add 5 TEST leads to the TEST chapter spreadsheet");
    expect(html).toContain("Preview-only recognition readback");
    expect(html).toContain("TEST points in this member shell are a read-only preview");
    expect(html).toContain('href="/app/events?source=points"');
    expect(html).toContain("See how to earn more points");
  });

  it("keeps the member points route connected to the event loop when opened from an event detail handoff", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({ source: "events" }),
      }),
    );

    expect(html).toContain("Back to the TEST event loop");
    expect(html).toContain('href="/app/events?source=points"');
    expect(html).toContain("without claiming a live award sync");
  });

  it("returns the member points route to the exact TEST event detail when that handoff is available", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({
          source: "events",
          event: "chapter-event-ucla-kickoff",
        }),
      }),
    );

    expect(html).toContain("Back to the TEST event detail");
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=points"');
    expect(html).toContain("without claiming a live award sync");
    expect(html).toContain("Exact TEST event readback");
    expect(html).toContain("TEST Intro GBM brought you here");
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=points&amp;step=rsvp"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=points&amp;step=checkin"');
    expect(html).toContain("Preview RSVP posture");
    expect(html).toContain("Preview check-in posture");
    expect(getBottomNavHtml(html)).toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=points"',
    );
    expect(getBottomNavHtml(html)).toContain(
      'href="/profile?source=points&amp;event=chapter-event-ucla-kickoff"',
    );
  });

  it("preserves selected campaign context through the points route return links", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({
          source: "events",
          event: "chapter-event-mcgill-coffee-chat",
          campaign: "Spring Showcase",
        }),
      }),
    );

    expect(html).toContain(
      'href="/app/events/chapter-event-mcgill-coffee-chat?source=points&amp;campaign=Spring+Showcase"',
    );
    expect(html).toContain(
      'href="/app/events/chapter-event-mcgill-coffee-chat?source=points&amp;campaign=Spring+Showcase&amp;step=rsvp"',
    );
    expect(html).toContain(
      'href="/app/events/chapter-event-mcgill-coffee-chat?source=points&amp;campaign=Spring+Showcase&amp;step=checkin"',
    );
    expect(getBottomNavHtml(html)).toContain(
      'href="/app/events/chapter-event-mcgill-coffee-chat?source=points&amp;campaign=Spring%20Showcase"',
    );
    expect(getBottomNavHtml(html)).toContain(
      'href="/profile?source=points&amp;event=chapter-event-mcgill-coffee-chat&amp;campaign=Spring%20Showcase"',
    );
  });

  it("keeps selected campaign context when points opens profile without an exact event handoff", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({
          source: "events",
          campaign: "Spring Showcase",
        }),
      }),
    );

    expect(getBottomNavHtml(html)).toContain(
      'href="/profile?source=points&amp;campaign=Spring+Showcase"',
    );
    expect(getBottomNavHtml(html)).not.toContain('href="/profile?source=points"></a>');
  });

  it("keeps the points route tied to the filtered stories feed when opened from stories", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({
          source: "stories",
          storyFilter: "Events",
          campaign: "Spring Showcase",
        }),
      }),
    );

    expect(html).toContain("Opened from the TEST stories feed");
    expect(html).toContain("Back to Stories");
    expect(html).toContain('href="/app/stories?filter=Events"');
    expect(getBottomNavHtml(html)).toContain(
      'href="/app/events?source=stories&amp;campaign=Spring+Showcase&amp;storyFilter=Events"',
    );
    expect(getBottomNavHtml(html)).toContain(
      'href="/profile?source=stories&amp;storyFilter=Events&amp;campaign=Spring+Showcase"',
    );
  });

  it("preserves exact stories event context inside the points readback card", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({
          source: "stories",
          storyFilter: "Events",
          campaign: "Rush Month",
          event: "chapter-event-ucla-kickoff",
          story: "2",
        }),
      }),
    );

    expect(html).toContain("Back to Stories");
    expect(html).toContain("Back to TEST event detail");
    expect(html).toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=stories&amp;storyFilter=Events&amp;story=2&amp;campaign=Rush+Month"',
    );
    expect(html).toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=stories&amp;storyFilter=Events&amp;story=2&amp;campaign=Rush+Month&amp;step=rsvp"',
    );
    expect(html).toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=stories&amp;storyFilter=Events&amp;story=2&amp;campaign=Rush+Month&amp;step=checkin"',
    );
  });

  it("keeps the points bottom-nav events link tied to the exact stories event context", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({
          source: "stories",
          storyFilter: "Events",
          campaign: "Rush Month",
          event: "chapter-event-ucla-kickoff",
          story: "2",
        }),
      }),
    );

    expect(getBottomNavHtml(html)).toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=stories&amp;campaign=Rush+Month&amp;storyFilter=Events&amp;story=2"',
    );
    expect(getBottomNavHtml(html)).toContain(
      'href="/profile?source=stories&amp;storyFilter=Events&amp;campaign=Rush+Month&amp;story=2"',
    );
    expect(getBottomNavHtml(html)).not.toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=events&amp;campaign=Rush+Month&amp;storyFilter=Events"',
    );
  });
  it("keeps the member points route connected to the profile walkthrough when opened from profile", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({ source: "profile" }),
      }),
    );

    expect(html).toContain("Back to your TEST profile");
    expect(html).toContain('href="/profile?source=points"');
    expect(html).toContain("pretending profile writes are live");
    expect(getBottomNavHtml(html)).toContain('href="/app/events?source=profile"');
  });

  it("keeps the member points route connected to the profile walkthrough when opened from points", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({ source: "points" }),
      }),
    );

    expect(html).toContain('href="/profile?source=points"');
  });

  it("keeps the member points route connected to the exact TEST profile context when points already knows the event handoff", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({
          source: "points",
          event: "chapter-event-ucla-kickoff",
        }),
      }),
    );

    expect(getBottomNavHtml(html)).toContain(
      'href="/profile?source=points&amp;event=chapter-event-ucla-kickoff"',
    );
  });

  it("drops the generic All campaign marker when points returns to profile without a real filtered campaign", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({
          source: "points",
          campaign: "All",
        }),
      }),
    );

    expect(getBottomNavHtml(html)).toContain('href="/profile?source=points"');
    expect(html).toContain('href="/app/events?source=points"');
    expect(html).not.toContain("campaign=All");
  });

  it("returns the member points route to the exact TEST event detail when the home walkthrough opens a specific event", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({
          source: "home",
          event: "chapter-event-ucla-kickoff",
        }),
      }),
    );

    expect(html).toContain("Back to the TEST event detail");
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=home"');
    expect(html).toContain("TEST Intro GBM brought you here");
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=home&amp;step=rsvp"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=home&amp;step=checkin"');
    expect(getBottomNavHtml(html)).toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=home"',
    );
    expect(getBottomNavHtml(html)).toContain(
      'href="/profile?source=points&amp;event=chapter-event-ucla-kickoff"',
    );
  });

  it("returns the member points route to the exact TEST event detail when the profile walkthrough opens a specific event", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({
          source: "profile",
          event: "chapter-event-ucla-kickoff",
        }),
      }),
    );

    expect(html).toContain("Back to the TEST event detail");
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=profile"');
    expect(html).toContain("TEST Intro GBM brought you here");
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=profile&amp;step=rsvp"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=profile&amp;step=checkin"');
    expect(getBottomNavHtml(html)).toContain(
      'href="/app/events/chapter-event-ucla-kickoff?source=profile&amp;profileSource=points"',
    );
  });

  it("keeps the member points route connected to the home walkthrough when opened from home", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(
      await PointsPage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(html).toContain("Opened from the TEST home walkthrough");
    expect(html).toContain("Continue from home into events");
    expect(html).toContain('href="/app/events?source=home"');
    expect(getBottomNavHtml(html)).toContain('href="/app/events?source=home"');
  });

  it("keeps internal member preview states visibly marked as TEST content", () => {
    const previewScreens = [
      "campaign",
      "action",
      "evidence",
      "confirm",
      "event-detail",
      "rsvp-confirm",
      "checkin",
      "points",
      "events",
      "stories",
    ] as const;
    const htmlByScreen = new Map(
      previewScreens.map((screen) => [
        screen,
        renderToStaticMarkup(<FigmaMemberMobileHome initialScreen={screen as never} />),
      ]),
    );

    expect(htmlByScreen.get("campaign")).toContain("TEST Rush Month preview");
    expect(htmlByScreen.get("campaign")).toContain("No fixture event or RSVP count is substituted.");
    expect(htmlByScreen.get("campaign")).toContain("Open TEST action preview");
    expect(htmlByScreen.get("campaign")).not.toContain("Ackerman 2100");
    expect(htmlByScreen.get("action")).toContain("Invite 3 TEST friends to the TEST Intro GBM");
    expect(htmlByScreen.get("action")).toContain("Assigned by TEST Marcus T.");
    expect(htmlByScreen.get("evidence")).toContain("Invite 3 TEST friends to the TEST Intro GBM");
    expect(htmlByScreen.get("evidence")).toContain("Privacy Reminder");
    expect(htmlByScreen.get("confirm")).toContain("TEST Marcus T. will review your submission");
    expect(htmlByScreen.get("points")).toContain("TEST Rush Month");
    expect(htmlByScreen.get("points")).toContain("You (TEST Sofia Alvarez)");
    expect(htmlByScreen.get("points")).toContain("Share TEST Rush Week flyer on Instagram");
    expect(htmlByScreen.get("events")).toContain("TEST Spring Showcase Kickoff");
    expect(htmlByScreen.get("event-detail")).toContain("TEST Ackerman Union 2100");
    expect(htmlByScreen.get("event-detail")).toContain("Organized by <span class=\"text-primary font-semibold\">TEST Marcus T.</span>");
    expect(htmlByScreen.get("rsvp-confirm")).toContain("TEST Ackerman Union 2100");
    expect(htmlByScreen.get("checkin")).toContain("TEST Intro GBM — TEST Rush Month");
    expect(htmlByScreen.get("stories")).toContain("TEST Students in Lima joined a Mobile Clinic");
    expect(htmlByScreen.get("stories")).toContain("TEST UConn MEDLIFE chapter packed the room");
  });

  it("renders actor-scoped campaign readback without UCLA fixture metrics", () => {
    const html = renderToStaticMarkup(
      <FigmaMemberMobileHome
        initialScreen={"campaign" as never}
        memberContext={{
          displayName: "TEST Phase 1 Recovery",
          firstName: "TEST Phase 1",
          chapterName: "TEST Test Boston University",
          campusName: "TEST Boston University",
          pointsTotal: 0,
          pointsWeeklyLabel: "+0",
          pointsRankLabel: "#6",
          completedActions: 0,
          leaderboardRows: [
            {
              rank: 6,
              name: "TEST Phase 1 Recovery",
              role: "General Member",
              pts: 0,
              me: true,
            },
          ],
        }}
        memberCampaign={{
          name: "Test Rush Month",
          objective: "Test actor-scoped campaign objective.",
        }}
        memberEvents={[
          {
            id: "97901445-604f-40bd-828e-517775af97b1",
            routeId: "97901445-604f-40bd-828e-517775af97b1",
            title: "TEST Attendance and Points Review",
            date: "Fri Jul 24 · 12:00 PM",
            loc: "Location not set",
            pts: 0,
            status: "RSVP Open",
            campaign: "Test Rush Month",
            eventType: "GBM",
            featured: true,
            luma: false,
            rsvps: 0,
          },
        ]}
      />,
    );

    expect(html).toContain("Production readback");
    expect(html).toContain("Test Rush Month");
    expect(html).toContain("Test actor-scoped campaign objective.");
    expect(html).toContain("TEST Test Boston University");
    expect(html).toContain("TEST Attendance and Points Review");
    expect(html).toContain("Chapter events");
    expect(html).toContain("Open events");
    expect(html).toContain("Production assignment readback is not connected.");
    expect(html).not.toContain("UCLA");
    expect(html).not.toContain("Ackerman");
    expect(html).not.toContain("Leads Captured");
    expect(html).not.toContain("23 RSVPs");
    expect(html).not.toContain("67%");
  });

  it("renders live TEST event-loop points readback on the points screen", () => {
    const html = renderToStaticMarkup(
      <FigmaMemberMobileHome
        initialScreen="points"
        pointsSource="home"
        pointsReturnEventId="chapter-event-ucla-kickoff"
        memberContext={{
          displayName: "TEST Boston University General Member Sam",
          firstName: "TEST Sam",
          chapterName: "TEST Test Boston University",
          campusName: "TEST Boston University",
          pointsTotal: 20,
          pointsWeeklyLabel: "+20",
          pointsRankLabel: "#6",
          completedActions: 1,
          leaderboardRows: [
            { rank: 1, name: "TEST Aisha N.", role: "President / VP", pts: 220 },
            { rank: 2, name: "TEST Marcus T.", role: "Action Committee Chair", pts: 185 },
            {
              rank: 6,
              name: "TEST Test Boston University General Member Sam",
              role: "General Member",
              pts: 20,
              me: true,
            },
          ],
        }}
        pointsReadback={{
          eventTitle: "TEST Intro GBM",
          chapterName: "TEST Test Boston University",
          timing: "Jul 16, 10:35 AM - 12:35 PM",
          loopStage: "points_awarded",
          rsvpCount: 1,
          attendanceCount: 1,
          eventPointsAwarded: 20,
          memberPointsAwarded: 20,
          chapterTotalPoints: 20,
          memberStatusLabel: "Points awarded",
          memberStatusDetail: "Attendance and points are recorded.",
          eventDetailHref: "/app/events/chapter-event-ucla-kickoff?source=points",
          leaderboardHref: "/app/points?source=points",
          nextStepLabel: "Open leaderboard",
          nextStepDetail: "Review points.",
        }}
      />,
    );

    expect(html).toContain("Live TEST event-loop points from internal myMEDLIFE readback.");
    expect(html).toContain("20 points are recorded for your");
    expect(html).toContain("Checked in to TEST Intro GBM");
    expect(html).toContain("Recorded in myMEDLIFE internal TEST ledger");
    expect(html).not.toContain("No approved TEST actions yet");
  });

  it("keeps assignment and admin communication controls preview-only", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/figma-member-mobile-home.tsx"),
      "utf8",
    );

    expect(source).toContain("Preview only - no member notifications");
    expect(source).toContain("Close assignment preview");
    expect(source).not.toContain("This will notify all General Members immediately");

    const adminHtml = renderToStaticMarkup(
      <FigmaMemberMobileHome initialScreen="admin" />,
    );

    expect(adminHtml).toContain("Integration posture: preview-only; external writes blocked");
    expect(adminHtml).toContain("No CRM sync, contact mutation, or task creation from this preview.");
    expect(adminHtml).toContain("No event writes, reminders, attendance sync, or RSVP writeback from this preview.");
    expect(adminHtml).toContain("Automation Outbox Preview (n8n disabled)");
    expect(adminHtml).toContain("HubSpot lifecycle update blocked");
    expect(adminHtml).toContain("Luma attendance sync blocked");
    expect(adminHtml).toContain("Overdue action reminder blocked");
    expect(adminHtml).toContain("Preview only - no email, SMS, push, or n8n workflow");
    expect(adminHtml).not.toContain("47 contacts synced today");
    expect(adminHtml).not.toContain("Luma attendance sync</p>");
    expect(adminHtml).not.toContain("System health: 5 of 6 integrations active");
  });
});
