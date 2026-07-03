import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/events",
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

describe("events page", () => {
  it("lets the member events route lead with a clean mobile events list", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing events page."),
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

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(await EventsPage({}));

    expect(html).toContain("Events");
    expect(html).toContain("Live RSVP");
    expect(html).toContain("Rush Month kickoff social");
    expect(html).toContain("RSVP already recorded");
    expect(html).toContain("Show up where your chapter is active");
    expect(html).toContain("Coming Up");
    expect(html).toContain("Rush Month kickoff social");
    expect(html).toContain("Bruin Plaza");
    expect(html).toContain("/app/events/chapter-event-ucla-kickoff?source=events");
    expect(html).not.toContain("This Week: 2");
    expect(html).not.toContain("RSVP Open: 3");
    expect(html).not.toContain("RSVP&#x27;d: 1");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });

  it("treats committee members as part of the member-owned events surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("committee.member@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing committee-member events page."),
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

    const { default: EventsPage } = await import("@/app/app/events/page");
    const html = renderToStaticMarkup(await EventsPage({}));

    expect(html).toContain("Events");
    expect(html).toContain("Show up where your chapter is active");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("routes a direct leader landing back into the leader workspace", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");

    await expect(EventsPage({})).rejects.toThrow("NEXT_REDIRECT:/leader?view=events");
  });

  it("keeps the home handoff visible across the member events list", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const lumaModule = await import("@/services/luma-live-pilot");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing events home handoff."),
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

    const { default: EventsPage } = await import("@/app/app/events/page");
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
    expect(html).toContain("/app/events/chapter-event-ucla-kickoff?source=home");
    expect(html.indexOf("Events")).toBeLessThan(html.indexOf("From home"));
  });

  it("keeps chapter-event handoffs inside the leader workspace instead of the shared member route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");
    await expect(
      EventsPage({
        searchParams: Promise.resolve({
          source: "chapter_create_event",
          returnTo: "/chapter?view=events&eventCommittee=events&quickAction=create_event",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/leader?view=events");
  });

  it("sends signed-out reviewers through the single login page before showing member events", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: EventsPage } = await import("@/app/app/events/page");

    await expect(EventsPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fapp%2Fevents",
    );
  });
});
