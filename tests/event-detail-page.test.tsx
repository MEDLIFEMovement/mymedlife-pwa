import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound should not be called in this test");
  }),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  usePathname: () => "/app/events/event-rush-social-001",
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

vi.mock("@/services/luma-live-pilot", () => ({
  getLumaLivePilotGateDurable: vi.fn(),
}));

vi.mock("@/services/luma-live-pilot-persistence", () => ({
  getLumaPilotPersistenceReadiness: vi.fn(),
}));

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("event detail page", () => {
  it("lets the member event-detail route lead with the event game plan only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member event detail."),
    );
    vi.mocked(lumaModule.getLumaLivePilotGateDurable).mockResolvedValue({
      apiKeyConfigured: true,
      calendarIdConfigured: true,
      environment: "staging",
      productionBlocked: false,
      eventWritesEnabled: true,
      rsvpWritesEnabled: true,
      attendanceImportEnabled: true,
      enabledOperations: 3,
      detail: "Ready",
    });
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const { default: EventDetailPage } = await import(
      "@/app/app/events/[eventId]/page"
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
    expect(html).toContain("Chapter invite");
    expect(html).toContain("Check-in confirms turnout");
    expect(html).toContain("RSVP status");
    expect(html).toContain("You&#x27;re on the list");
    expect(html).toContain("Why this event matters");
    expect(html).toContain('href="/app/points?source=events"');
    expect(html).toContain('href="/app/events?source=events"');
    expect(html).toContain("Open leaderboard");
    expect(html).toContain("Open events");
    expect(html).toContain("Back to events");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).toContain(
      "See when to show up, what kind of student moment to create, and how RSVP, attendance, and points connect after the event.",
    );
    expect(html).not.toContain("Open submit evidence");
    expect(html).not.toContain("Start here");
    expect(html).not.toContain("See how effort gets recognized");
    expect(html).not.toContain("Safety notes");
    expect(html).not.toContain("What should I do next?");
    expect(html).not.toContain("Feedback plan");
    expect(html).not.toContain("Proof prompt");
    expect(html).not.toContain("NPS question");
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

  it("renders a live chapter-event detail when the member opens a real linked launch-lane event", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing live chapter-event detail."),
    );
    vi.mocked(lumaModule.getLumaLivePilotGateDurable).mockResolvedValue({
      apiKeyConfigured: true,
      calendarIdConfigured: true,
      environment: "staging",
      productionBlocked: false,
      eventWritesEnabled: true,
      rsvpWritesEnabled: true,
      attendanceImportEnabled: true,
      enabledOperations: 3,
      detail: "Ready",
    });
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const { default: EventDetailPage } = await import(
      "@/app/app/events/[eventId]/page"
    );
    const html = renderToStaticMarkup(
      await EventDetailPage({
        params: Promise.resolve({ eventId: "chapter-event-ucla-kickoff" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain("Rush Month kickoff social");
    expect(html).toContain("Sun Nov 15 · 10:00 AM - 12:00 PM");
    expect(html).toContain("Bruin Plaza");
    expect(html).toContain("Attendance confirmed; points pending");
    expect(html).toContain("Luma linked");
    expect(html).toContain("24 attended");
    expect(html).toContain("0 pts awarded");
    expect(html).toContain("Open event detail");
    expect(html).toContain(
      "Attendance is confirmed, and points are the next readback to watch.",
    );
    expect(html).toContain("Open events");
  });

  it("folds a legacy campaign-origin event detail into the standard member event loop", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing campaign-source event detail."),
    );
    vi.mocked(lumaModule.getLumaLivePilotGateDurable).mockResolvedValue({
      apiKeyConfigured: true,
      calendarIdConfigured: true,
      environment: "staging",
      productionBlocked: false,
      eventWritesEnabled: true,
      rsvpWritesEnabled: true,
      attendanceImportEnabled: true,
      enabledOperations: 3,
      detail: "Ready",
    });
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const { default: EventDetailPage } = await import(
      "@/app/app/events/[eventId]/page"
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
    expect(html).toContain("Live event loop");
    expect(html).toContain("Attendance confirmed; points pending");
    expect(html).toContain("2 RSVP");
    expect(html).toContain("24 attended");
    expect(html).toContain("0 pts awarded");
    expect(html).toContain("Chapter invite");
    expect(html).toContain("Back to events");
    expect(html).not.toContain("From campaigns");
    expect(html).toContain('href="/app/events"');
    expect(html).toContain('href="/app/points?source=events"');
    expect(html).toContain('href="/app/events?source=events"');
  });

  it("routes a direct leader event-detail landing back into the leader workspace with the selected event preserved", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: EventDetailPage } = await import(
      "@/app/app/events/[eventId]/page"
    );

    await expect(
      EventDetailPage({
        params: Promise.resolve({ eventId: "event-rush-social-001" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/leader?view=events&event=event-rush-social-001");
  });

  it("returns members to home when the event detail was opened from the home surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing home-source event detail."),
    );
    vi.mocked(lumaModule.getLumaLivePilotGateDurable).mockResolvedValue({
      apiKeyConfigured: true,
      calendarIdConfigured: true,
      environment: "staging",
      productionBlocked: false,
      eventWritesEnabled: true,
      rsvpWritesEnabled: true,
      attendanceImportEnabled: true,
      enabledOperations: 3,
      detail: "Ready",
    });
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const { default: EventDetailPage } = await import(
      "@/app/app/events/[eventId]/page"
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
      "Home surfaced this chapter moment as the next place to show up. Keep the weekly loop attached while you inspect the event plan.",
    );
    expect(html).toContain("Back to home");
    expect(html).toContain('href="/app"');
    expect(html).toContain('href="/app/points?source=home"');
    expect(html).toContain('href="/app"');
    expect(html.indexOf("Tabling at Bruin Walk")).toBeLessThan(html.indexOf("From home"));
  });

  it("returns members to points when the event detail was opened from points and recognition", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing points-source event detail."),
    );
    vi.mocked(lumaModule.getLumaLivePilotGateDurable).mockResolvedValue({
      apiKeyConfigured: true,
      calendarIdConfigured: true,
      environment: "staging",
      productionBlocked: false,
      eventWritesEnabled: true,
      rsvpWritesEnabled: true,
      attendanceImportEnabled: true,
      enabledOperations: 3,
      detail: "Ready",
    });
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const { default: EventDetailPage } = await import(
      "@/app/app/events/[eventId]/page"
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
      "Points and recognition led you here because this event can move the chapter leaderboard forward.",
    );
    expect(html).toContain("Back to points");
    expect(html).toContain('href="/app/points"');
    expect(html).toContain('href="/app/points?source=points"');
    expect(html).toContain('href="/app/events?source=points"');
    expect(html.indexOf("Intro GBM")).toBeLessThan(html.indexOf("From points"));
  });

  it("returns members to profile when the event detail was opened from the profile route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing profile-source event detail."),
    );
    vi.mocked(lumaModule.getLumaLivePilotGateDurable).mockResolvedValue({
      apiKeyConfigured: true,
      calendarIdConfigured: true,
      environment: "staging",
      productionBlocked: false,
      eventWritesEnabled: true,
      rsvpWritesEnabled: true,
      attendanceImportEnabled: true,
      enabledOperations: 3,
      detail: "Ready",
    });
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Ready",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const { default: EventDetailPage } = await import(
      "@/app/app/events/[eventId]/page"
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
      "Profile pointed you into a real chapter moment. Keep that member-owned handoff attached while you inspect this event detail.",
    );
    expect(html).toContain("Back to profile");
    expect(html).toContain('href="/profile"');
    expect(html).toContain('href="/app/points?source=profile"');
    expect(html).toContain('href="/app/events?source=profile"');
    expect(html.indexOf("Tabling at Bruin Walk")).toBeLessThan(html.indexOf("From profile"));
  });

  it("keeps chapter event-review handoffs inside the leader workspace", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: EventDetailPage } = await import(
      "@/app/app/events/[eventId]/page"
    );
    await expect(
      EventDetailPage({
        params: Promise.resolve({ eventId: "event-rush-social-001" }),
        searchParams: Promise.resolve({
          source: "chapter_event_review",
          returnTo:
            "/chapter?view=events&member=member-ivy&eventCommittee=events&event=bc-event-moving-mountains-kickoff",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/leader?view=events&event=event-rush-social-001");
  });
});
