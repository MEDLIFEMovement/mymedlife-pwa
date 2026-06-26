import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/rush-month/events",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

describe("events page", () => {
  it("lets the member events route lead with a clean mobile events list", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/rush-month/events/page");
    const html = renderToStaticMarkup(await EventsPage({}));

    expect(html).toContain("Events");
    expect(html).toContain("Show up where your chapter is active");
    expect(html).toContain("Coming Up");
    expect(html).toContain("Tabling at Bruin Walk");
    expect(html).toContain("Intro GBM");
    expect(html).toContain("/rush-month/events/event-rush-social-001?source=events");
    expect(html).toContain("/rush-month/events/event-rush-med-talk-001?source=events");
    expect(html).not.toContain("This Week: 2");
    expect(html).not.toContain("RSVP Open: 3");
    expect(html).not.toContain("RSVP&#x27;d: 1");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });

  it("treats committee members as part of the member-owned events surface", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("committee.member@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/rush-month/events/page");
    const html = renderToStaticMarkup(await EventsPage({}));

    expect(html).toContain("Events");
    expect(html).toContain("Show up where your chapter is active");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("routes a direct leader landing back into the chapter-owned events surface", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/rush-month/events/page");

    await expect(EventsPage({})).rejects.toThrow("NEXT_REDIRECT:/chapter?view=events");
  });

  it("keeps the home handoff visible across the member events list", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/rush-month/events/page");
    const html = renderToStaticMarkup(
      await EventsPage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(html).toContain("From home");
    expect(html).toContain(
      "Home surfaced this events list as the next place to show up. Keep that chapter moment tied to the weekly loop you came from.",
    );
    expect(html).toContain("Back to home");
    expect(html).toContain('href="/app"');
    expect(html).toContain("/rush-month/events/event-rush-social-001?source=home");
    expect(html).toContain("/rush-month/events/event-rush-med-talk-001?source=home");
    expect(html.indexOf("Events")).toBeLessThan(html.indexOf("From home"));
  });

  it("keeps the chapter-events handoff visible across the broader leader events lane", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/rush-month/events/page");
    const html = renderToStaticMarkup(
      await EventsPage({
        searchParams: Promise.resolve({
          source: "chapter_create_event",
          returnTo: "/chapter?view=events&eventCommittee=events&quickAction=create_event",
        }),
      }),
    );

    expect(html).toContain("From chapter events");
    expect(html).toContain("Keep chapter event ownership in view.");
    expect(html).toContain(
      "Use the broader event flow without losing the committee focus, event ownership, or follow-through that opened this from the command center.",
    );
    expect(html).toContain("Back to chapter events");
    expect(html).toContain("Review mode only");
    expect(html).toContain(
      'href="/chapter?view=events&amp;eventCommittee=events&amp;quickAction=create_event"',
    );
    expect(html).not.toContain("Still mock-safe");
  });
});
