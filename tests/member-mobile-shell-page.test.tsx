import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { FigmaMemberMobileHome } from "@/components/figma-member-mobile-home";
import { getMockLocalActorContext } from "@/services/local-actor-context";

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
    expect(html).toContain('href="/app/points"');
    expect(html).toContain('href="/app/stories"');
    expect(html).toContain('href="/profile"');
  });

  it("renders the Stories route through the shared Figma member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: StoriesPage } = await import("@/app/app/stories/page");
    const html = renderToStaticMarkup(await StoriesPage());

    expect(html).toContain("MEDLIFE Stories");
    expect(html).toContain("For You");
    expect(html).toContain("Preview-only student feed");
    expect(html).toContain("Preview");
    expect(html).not.toContain("Live from the field");
    expect(html).not.toContain("Add Story");
    expect(html).not.toContain("stories published");
  });

  it("renders the Events route through the shared Figma member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(await EventsPage());

    expect(html).toContain(">Events<");
    expect(html).toContain("Show up. Check in. Earn points.");
    expect(html).toContain("TEST Intro GBM");
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=events&amp;step=rsvp"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=events"');
    expect(html).toContain('href="/app/events/chapter-event-lakeside-welcome?source=events"');
  });

  it("renders the Points route through the shared Figma member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: PointsPage } = await import("@/app/app/points/page");
    const html = renderToStaticMarkup(await PointsPage());

    expect(html).toContain("Points &amp; Recognition");
    expect(html).toContain("Chapter Leaderboard");
    expect(html).toContain("Recent Approved Actions");
    expect(html).toContain('href="/app/events?source=points"');
    expect(html).toContain("See how to earn more points");
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

    expect(htmlByScreen.get("campaign")).toContain("TEST Intro GBM RSVPs");
    expect(htmlByScreen.get("campaign")).toContain("TEST Intro GBM event is live on Luma");
    expect(htmlByScreen.get("campaign")).toContain("TEST Intro GBM");
    expect(htmlByScreen.get("action")).toContain("Invite 3 TEST friends to the TEST Intro GBM");
    expect(htmlByScreen.get("action")).toContain("Assigned by TEST Marcus T.");
    expect(htmlByScreen.get("evidence")).toContain("Invite 3 TEST friends to the TEST Intro GBM");
    expect(htmlByScreen.get("evidence")).toContain("Privacy Reminder");
    expect(htmlByScreen.get("confirm")).toContain("TEST Marcus T. will review your submission");
    expect(htmlByScreen.get("points")).toContain("TEST Rush Month");
    expect(htmlByScreen.get("points")).toContain("You (TEST Sofia R.)");
    expect(htmlByScreen.get("points")).toContain("Share TEST Rush Week flyer on Instagram");
    expect(htmlByScreen.get("events")).toContain("TEST Spring Showcase Kickoff");
    expect(htmlByScreen.get("event-detail")).toContain("TEST Ackerman Union 2100");
    expect(htmlByScreen.get("event-detail")).toContain("Organized by <span class=\"text-primary font-semibold\">TEST Marcus T.</span>");
    expect(htmlByScreen.get("rsvp-confirm")).toContain("TEST Ackerman Union 2100");
    expect(htmlByScreen.get("checkin")).toContain("TEST Intro GBM — TEST Rush Month");
    expect(htmlByScreen.get("stories")).toContain("TEST Students in Lima joined a Mobile Clinic");
    expect(htmlByScreen.get("stories")).toContain("TEST UConn MEDLIFE chapter packed the room");
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
