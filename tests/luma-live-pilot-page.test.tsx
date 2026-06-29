import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
  usePathname: () => "/admin/luma-live-pilot",
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
    getReadOnlyAppData: vi.fn(actual.getReadOnlyAppData),
  };
});

describe("Luma live pilot admin page", () => {
  it("shows DS Admin the event, RSVP, attendance, points, leaderboard, and outbox proof path", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    const baseData = dataModule.getMockReadOnlyAppData("Testing pending host check-in.");
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue({
      ...baseData,
      eventRows: [
        {
          id: "pilot-rsvp",
          event_type: "event_rsvp_recorded",
          actor_user_id: "pilot-user",
          chapter_id: "chapter-1",
          campaign_id: null,
          assignment_id: null,
          chapter_event_id: "pilot-chapter-event",
          payload: {
            source: "luma_live_pilot",
            lumaEventId: "evt-bJE178Q02N5DaLH",
            userEmail: "nellis@medlifemovement.org",
            userEmailHint: "ne***@medlifemovement.org",
            rsvpCount: 1,
          },
          correlation_id: "luma-pilot:rsvp:evt-bJE178Q02N5DaLH:user-1",
          occurred_at: "2026-06-29T03:17:53.728Z",
          created_at: "2026-06-29T03:17:53.728Z",
        },
        {
          id: "pilot-attendance",
          event_type: "event_attendance_recorded",
          actor_user_id: "pilot-user",
          chapter_id: "chapter-1",
          campaign_id: null,
          assignment_id: null,
          chapter_event_id: "pilot-chapter-event",
          payload: {
            source: "luma_live_pilot",
            attendanceCount: 0,
            importedGuestCount: 1,
          },
          correlation_id: "luma-pilot:attendance:evt-bJE178Q02N5DaLH:1",
          occurred_at: "2026-06-29T11:07:42.137Z",
          created_at: "2026-06-29T11:07:42.137Z",
        },
      ],
      integrationEventRows: [
        {
          id: "pilot-link",
          source_event_id: "pilot-rsvp",
          chapter_id: "chapter-1",
          event_type: "luma_event_linked",
          destination: "luma",
          external_object_type: "event",
          external_object_id: "evt-bJE178Q02N5DaLH",
          status: "recorded",
          payload: { source: "luma_live_pilot" },
          created_by: "pilot-user",
          created_at: "2026-06-29T03:17:33.923Z",
          updated_at: "2026-06-29T03:17:33.923Z",
        },
      ],
      pointsEventRows: [],
    });

    const { default: LumaLivePilotPage } = await import("@/app/admin/luma-live-pilot/page");
    const html = renderToStaticMarkup(await LumaLivePilotPage({}));

    expect(html).toContain("Staging Luma pilot");
    expect(html).toContain("Event and points evidence");
    expect(html).toContain("RSVP, attendance, and leaderboard impact stay tied together.");
    expect(html).toContain("These counters are cumulative staging proof totals");
    expect(html).toContain("RSVPs");
    expect(html).toContain("Attendance");
    expect(html).toContain("Points");
    expect(html).toContain("Leaderboard");
    expect(html).toContain("Outbox sends");
    expect(html).toContain("event_rsvp_recorded");
    expect(html).toContain("event_points_awarded");
    expect(html).toContain("Audit/outbox review remains visible before pilot expansion.");
    expect(html).toContain("Pending host step");
    expect(html).toContain("One Luma guest still needs a real host-side check-in.");
    expect(html).toContain("Open Luma guest list");
    expect(html).toContain("evt-bJE178Q02N5DaLH");
    expect(html).toContain("nellis@medlifemovement.org");
    expect(html).toContain("Hosted reviewer proof");
    expect(html).toContain("Use this route as the staging evidence checklist.");
    expect(html).toContain("Open staging.mymedlife.org, pass Vercel SSO");
    expect(html).toContain("Luma event create/update");
    expect(html).toContain("RSVP writeback");
    expect(html).toContain("Attendance import");
    expect(html).toContain("approved guest list");
    expect(html).toContain("Points and leaderboard readback");
    expect(html).toContain("Audit/outbox safety");
    expect(html).toContain("the public API does not expose a public attendee check-in write");
    expect(html).not.toContain("secret-example");
  });

  it("blocks non-DS users from staging Luma write and import controls", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      dataModule.getMockReadOnlyAppData("Testing restricted state."),
    );

    const { default: LumaLivePilotPage } = await import("@/app/admin/luma-live-pilot/page");
    const html = renderToStaticMarkup(await LumaLivePilotPage({}));

    expect(html).toContain("Luma live pilot restricted");
    expect(html).toContain("Only DS Admin and Super Admin can run staging Luma write or import controls.");
    expect(html).not.toContain("Create/update Luma event");
  });
});
