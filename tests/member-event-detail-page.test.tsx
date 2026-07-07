import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { redirect } from "next/navigation";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

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

describe("member event detail route", () => {
  it("parks unknown event ids back to the member events route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing unknown member event route."),
    );
    vi.mocked(redirect).mockImplementation((href: string) => {
      throw new Error(`redirect:${href}`);
    });

    const { default: EventDetailPage } = await import("@/app/app/events/[eventId]/page");

    await expect(
      EventDetailPage({
        params: Promise.resolve({ eventId: "missing-event" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/app/events");
  });

  it("renders the source-backed event detail shell on the standalone route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member event detail route."),
    );

    const { default: EventDetailPage } = await import("@/app/app/events/[eventId]/page");
    const html = renderToStaticMarkup(
      await EventDetailPage({
        params: Promise.resolve({ eventId: "chapter-event-ucla-kickoff" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain("Event RSVP");
    expect(html).toContain("TEST Rush Month kickoff social");
    expect(html).toContain("Points Available");
    expect(html).toContain("preview link only");
    expect(html).toContain("Route-backed preview");
    expect(html).toContain("Review the full TEST event loop here");
    expect(html).toContain("Add to Calendar");
    expect(html).toContain("Share");
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=events&amp;step=rsvp"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=events&amp;step=checkin"');
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=events&amp;step=points"');
  });

  it("renders the RSVP confirmation step as a route-backed preview state", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member RSVP preview state."),
    );

    const { default: EventDetailPage } = await import("@/app/app/events/[eventId]/page");
    const html = renderToStaticMarkup(
      await EventDetailPage({
        params: Promise.resolve({ eventId: "chapter-event-ucla-kickoff" }),
        searchParams: Promise.resolve({ source: "home", step: "rsvp" }),
      }),
    );

    expect(html).toContain("You&#x27;re RSVP&#x27;d!");
    expect(html).toContain("Go to Check-In");
    expect(html).toContain("Route-backed preview only");
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=home&amp;step=checkin"');
  });

  it("renders the check-in step with TEST-labeled preview event content", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member check-in preview state."),
    );

    const { default: EventDetailPage } = await import("@/app/app/events/[eventId]/page");
    const html = renderToStaticMarkup(
      await EventDetailPage({
        params: Promise.resolve({ eventId: "chapter-event-ucla-kickoff" }),
        searchParams: Promise.resolve({ source: "events", step: "checkin" }),
      }),
    );

    expect(html).toContain("Preview event QR code");
    expect(html).toContain("TEST Rush Month kickoff social");
    expect(html).toContain("This route only previews the next state.");
    expect(html).toContain("Confirm Check-In");
    expect(html).toContain('href="/app/events/chapter-event-ucla-kickoff?source=events&amp;step=points"');
  });

  it("renders the points-impact step with chapter leaderboard context", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member points impact preview state."),
    );

    const { default: EventDetailPage } = await import("@/app/app/events/[eventId]/page");
    const html = renderToStaticMarkup(
      await EventDetailPage({
        params: Promise.resolve({ eventId: "chapter-event-ucla-kickoff" }),
        searchParams: Promise.resolve({ source: "events", step: "points" }),
      }),
    );

    expect(html).toContain("Checked in!");
    expect(html).toContain("Chapter Leaderboard");
    expect(html).toContain("View leaderboard impact");
    expect(html).toContain("Local preview of the post-check-in state");
    expect(html).toContain('href="/app/points?source=events"');
  });
});
