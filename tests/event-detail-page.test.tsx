import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound should not be called in this test");
  }),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  usePathname: () => "/rush-month/events/event-rush-social-001",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

describe("event detail page", () => {
  it("lets the member event-detail route lead with the event game plan only", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: EventDetailPage } = await import(
      "@/app/rush-month/events/[eventId]/page"
    );
    const html = renderToStaticMarkup(
      await EventDetailPage({
        params: Promise.resolve({ eventId: "event-rush-social-001" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain("Tabling at Bruin Walk");
    expect(html).toContain("Tue Nov 13 · 11:00 AM - 1:00 PM");
    expect(html).toContain("Bruin Walk Table 7");
    expect(html).toContain("20 pts for attending");
    expect(html).toContain("Event loop");
    expect(html).toContain("Luma is the source of truth");
    expect(html).toContain("RSVP status");
    expect(html).toContain("You&#x27;re on the list");
    expect(html).toContain("Why this event matters");
    expect(html).toContain("/rush-month/actions/member-push?event=event-rush-social-001&amp;source=events");
    expect(html).toContain(
      "/rush-month/actions/member-push?step=submit&amp;event=event-rush-social-001&amp;source=events#submit-evidence",
    );
    expect(html).toContain("Submit evidence");
    expect(html).toContain("Back to events");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).toContain(
      "See when to show up, what kind of student moment to create, and what proof to capture after the event.",
    );
    expect(html).not.toContain("Open submit evidence");
    expect(html).not.toContain("Start here");
    expect(html).not.toContain("See how effort gets recognized");
    expect(html).not.toContain("Safety notes");
    expect(html).not.toContain("What should I do next?");
    expect(html).not.toContain("disabled automation posture");
    expect(html).not.toContain("launch-ready");
    expect(html).not.toContain("local write path is approved");
    expect(html).not.toContain("future sync disabled");
    expect(html).not.toContain("Leader lane");
    expect(html).not.toContain("Owner lane");
    expect(html).not.toContain("Action Committee Chair / Social Action Committee");
    expect(html).not.toContain("local member flow");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });

  it("returns members to the campaign surface when the event detail was opened from campaigns", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: EventDetailPage } = await import(
      "@/app/rush-month/events/[eventId]/page"
    );
    const html = renderToStaticMarkup(
      await EventDetailPage({
        params: Promise.resolve({ eventId: "event-rush-med-talk-001" }),
        searchParams: Promise.resolve({ source: "campaigns" }),
      }),
    );

    expect(html).toContain("Intro GBM");
    expect(html).toContain("Thu Nov 15 · 6:00 PM - 8:00 PM");
    expect(html).toContain("Ackerman 2100");
    expect(html).toContain("Luma");
    expect(html).toContain("RSVP ready");
    expect(html).toContain("Chapter invite");
    expect(html).toContain("Back to campaign");
    expect(html).toContain('href="/campaigns"');
    expect(html).toContain(
      "/rush-month/actions/member-push?event=event-rush-med-talk-001&amp;source=campaigns",
    );
    expect(html).toContain(
      "/rush-month/actions/member-push?step=submit&amp;event=event-rush-med-talk-001&amp;source=campaigns#submit-evidence",
    );
    expect(html).not.toContain("Back to events");
  });

  it("routes a direct leader event-detail landing back into the chapter-owned events surface with the selected event preserved", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: EventDetailPage } = await import(
      "@/app/rush-month/events/[eventId]/page"
    );

    await expect(
      EventDetailPage({
        params: Promise.resolve({ eventId: "event-rush-social-001" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/chapter?view=events&event=event-rush-social-001");
  });

  it("returns members to home when the event detail was opened from the home surface", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: EventDetailPage } = await import(
      "@/app/rush-month/events/[eventId]/page"
    );
    const html = renderToStaticMarkup(
      await EventDetailPage({
        params: Promise.resolve({ eventId: "event-rush-social-001" }),
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(html).toContain("Tabling at Bruin Walk");
    expect(html).toContain("From home");
    expect(html).toContain(
      "Home surfaced this chapter moment as the next place to show up. Keep the weekly loop attached while you review the event plan.",
    );
    expect(html).toContain("Back to home");
    expect(html).toContain('href="/app"');
    expect(html).toContain(
      "/rush-month/actions/member-push?event=event-rush-social-001&amp;source=home",
    );
    expect(html).toContain(
      "/rush-month/actions/member-push?step=submit&amp;event=event-rush-social-001&amp;source=home#submit-evidence",
    );
    expect(html.indexOf("Tabling at Bruin Walk")).toBeLessThan(html.indexOf("From home"));
  });

  it("returns members to points when the event detail was opened from points and recognition", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: EventDetailPage } = await import(
      "@/app/rush-month/events/[eventId]/page"
    );
    const html = renderToStaticMarkup(
      await EventDetailPage({
        params: Promise.resolve({ eventId: "event-rush-med-talk-001" }),
        searchParams: Promise.resolve({ source: "points" }),
      }),
    );

    expect(html).toContain("Intro GBM");
    expect(html).toContain("From points");
    expect(html).toContain(
      "Points and recognition led you here because this event can move the next approved action forward.",
    );
    expect(html).toContain("Back to points");
    expect(html).toContain('href="/rush-month/leaderboard"');
    expect(html).toContain(
      "/rush-month/actions/member-push?event=event-rush-med-talk-001&amp;source=points",
    );
    expect(html).toContain(
      "/rush-month/actions/member-push?step=submit&amp;event=event-rush-med-talk-001&amp;source=points#submit-evidence",
    );
    expect(html.indexOf("Intro GBM")).toBeLessThan(html.indexOf("From points"));
  });

  it("returns members to profile when the event detail was opened from the profile route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: EventDetailPage } = await import(
      "@/app/rush-month/events/[eventId]/page"
    );
    const html = renderToStaticMarkup(
      await EventDetailPage({
        params: Promise.resolve({ eventId: "event-rush-social-001" }),
        searchParams: Promise.resolve({ source: "profile" }),
      }),
    );

    expect(html).toContain("Tabling at Bruin Walk");
    expect(html).toContain("From profile");
    expect(html).toContain(
      "Profile pointed you into a real chapter moment. Keep that member-owned handoff attached while you review this event detail.",
    );
    expect(html).toContain("Back to profile");
    expect(html).toContain('href="/profile"');
    expect(html).toContain(
      "/rush-month/actions/member-push?event=event-rush-social-001&amp;source=profile",
    );
    expect(html).toContain(
      "/rush-month/actions/member-push?step=submit&amp;event=event-rush-social-001&amp;source=profile#submit-evidence",
    );
    expect(html.indexOf("Tabling at Bruin Walk")).toBeLessThan(html.indexOf("From profile"));
  });

  it("keeps the chapter event-review handoff visible across the broader leader event detail lane", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: EventDetailPage } = await import(
      "@/app/rush-month/events/[eventId]/page"
    );
    const html = renderToStaticMarkup(
      await EventDetailPage({
        params: Promise.resolve({ eventId: "event-rush-social-001" }),
        searchParams: Promise.resolve({
          source: "chapter_event_review",
          returnTo:
            "/chapter?view=events&member=member-ivy&eventCommittee=events&event=bc-event-moving-mountains-kickoff",
        }),
      }),
    );

    expect(html).toContain("From chapter events");
    expect(html).toContain("Tabling at Bruin Walk is still the event in focus.");
    expect(html).toContain("Back to chapter events");
    expect(html).toContain(
      'href="/chapter?view=events&amp;member=member-ivy&amp;eventCommittee=events&amp;event=bc-event-moving-mountains-kickoff"',
    );
  });
});
