import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LumaEventLoopPilotPanel } from "@/components/luma-event-loop-pilot-panel";
import type { LumaCalendarReadinessSnapshot } from "@/services/luma-calendar-readiness";
import {
  getLumaEventLoopPilotReadback,
  type LumaEventLoopPilotRole,
} from "@/services/luma-event-loop-pilot";
import { getStagingLumaEventLoopReadModel } from "@/services/staging-luma-event-loop";

const readySnapshot: LumaCalendarReadinessSnapshot = {
  status: "ready",
  calendarId: "cal-7WNftYCpBJclZyG",
  apiKeyConfigured: true,
  endpoint:
    "https://public-api.luma.com/v1/calendar/list-events?calendar_api_id=cal-7WNftYCpBJclZyG&pagination_limit=10",
  eventCount: 2,
  hasMore: false,
  safeEvents: [
    {
      id: "evt-db-1",
      apiId: "evt-api-1",
      title: "UCLA MEDLIFE Info Night",
      url: "https://lu.ma/medlife-events-info-night",
      startAt: "2026-07-20T23:00:00.000Z",
      endAt: "2026-07-21T00:00:00.000Z",
      timezone: "America/Los_Angeles",
      visibility: "public",
      locationType: "offline",
    },
    {
      id: "evt-db-2",
      apiId: "evt-api-2",
      title: "Volunteer Orientation",
      url: "https://lu.ma/medlife-events-orientation",
      startAt: "2026-07-25T18:00:00.000Z",
      endAt: "2026-07-25T19:00:00.000Z",
      timezone: "America/New_York",
      visibility: "public",
      locationType: "online",
    },
  ],
  writesEnabled: false,
  externalWritesEnabled: 0,
  attendeeDataReturned: false,
  secretReturned: false,
  detail:
    "Luma read-only calendar access is configured. Event creation, RSVP writes, attendance imports, reminders, webhooks, and external sends remain disabled.",
};

describe("luma event loop pilot readback", () => {
  it.each([
    ["member", "Live Luma events can drive your next RSVP."],
    ["leader", "Luma-backed events are ready for leader review."],
    ["staff", "Staff can read Luma event health without turning on sends."],
    ["admin", "Admin can verify Luma readback with zero external sends."],
  ] as Array<[LumaEventLoopPilotRole, string]>)(
    "creates role-specific %s copy while keeping writes blocked",
    (role, expectedTitle) => {
      const readback = getLumaEventLoopPilotReadback(role, readySnapshot);

      expect(readback.title).toBe(expectedTitle);
      expect(readback.importedEvents).toHaveLength(2);
      expect(readback.counts.importedEvents).toBe(2);
      expect(readback.counts.writesEnabled).toBe(0);
      expect(readback.counts.externalSends).toBe(0);
      expect(readback.counts.attendeeRowsReturned).toBe(0);
      expect(readback.counts.secretsReturned).toBe(0);
      expect(readback.safetyGates).toContain("Luma event creation and updates are off.");
      expect(readback.safetyGates).toContain("No Luma secret is returned to browser-safe UI data.");
      expect(JSON.stringify(readback)).not.toContain("secret-");
    },
  );

  it("renders imported Luma events and safety gates without leaking secret material", () => {
    const readback = getLumaEventLoopPilotReadback("member", readySnapshot);
    const html = renderToStaticMarkup(
      <LumaEventLoopPilotPanel readback={readback} compact />,
    );

    expect(html).toContain("UCLA MEDLIFE Info Night");
    expect(html).toContain("Volunteer Orientation");
    expect(html).toContain("RSVP");
    expect(html).toContain("Attendance");
    expect(html).toContain("Points");
    expect(html).toContain("Luma event creation and updates are off.");
    expect(html).toContain("HubSpot, warehouse, Power BI, SMS/email, and AI actions are off.");
    expect(html).not.toContain("secret-");
  });

  it("falls back to staging setup copy when Luma env is missing", () => {
    const readback = getLumaEventLoopPilotReadback("admin", {
      status: "missing_config",
      calendarId: null,
      apiKeyConfigured: false,
      endpoint: null,
      eventCount: 0,
      hasMore: false,
      safeEvents: [],
      writesEnabled: false,
      externalWritesEnabled: 0,
      attendeeDataReturned: false,
      secretReturned: false,
      detail:
        "Luma read-only import is not configured until LUMA_API_KEY and LUMA_CALENDAR_ID are both present in the server environment.",
    });

    expect(readback.statusLabel).toBe("Luma read not configured");
    expect(readback.summary).toContain("existing mock event loop remains visible");
    expect(readback.counts.writesEnabled).toBe(0);
    expect(readback.counts.externalSends).toBe(0);
  });

  it("distinguishes rejected hosted credentials from missing Luma config", () => {
    const readback = getLumaEventLoopPilotReadback("admin", {
      status: "api_error",
      calendarId: "cal-7WNftYCpBJclZyG",
      apiKeyConfigured: true,
      endpoint:
        "https://public-api.luma.com/v1/calendar/list-events?calendar_api_id=cal-7WNftYCpBJclZyG&pagination_limit=10",
      eventCount: 0,
      hasMore: false,
      safeEvents: [],
      writesEnabled: false,
      externalWritesEnabled: 0,
      attendeeDataReturned: false,
      secretReturned: false,
      detail:
        "Luma calendar read returned HTTP 401. The server has Luma config, but Luma rejected the staged credential. Refresh LUMA_API_KEY in the Vercel Preview environment before treating imported events as verified.",
    });

    expect(readback.statusLabel).toBe("Luma read needs review");
    expect(readback.statusDetail).toContain("Refresh LUMA_API_KEY");
    expect(readback.cards[0]).toMatchObject({
      label: "Luma events",
      value: "0",
      detail: expect.stringContaining("hosted credential"),
    });
    expect(readback.counts.externalSends).toBe(0);
  });

  it("switches to staging-proof language when evidence rows already exist", () => {
    const activation = getStagingLumaEventLoopReadModel({
      mode: "staging",
      data: {
        eventRows: [
          {
            id: "event-1",
            event_type: "event_rsvp_recorded",
            actor_user_id: "leader-1",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "chapter-event-1",
            payload: { rsvpCount: 3 },
            correlation_id: null,
            occurred_at: "2026-06-28T10:00:00Z",
            created_at: "2026-06-28T10:00:00Z",
          },
          {
            id: "event-2",
            event_type: "event_attendance_recorded",
            actor_user_id: "leader-1",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "chapter-event-1",
            payload: { attendanceCount: 2 },
            correlation_id: null,
            occurred_at: "2026-06-28T10:05:00Z",
            created_at: "2026-06-28T10:05:00Z",
          },
        ],
        integrationEventRows: [
          {
            id: "integration-1",
            source_event_id: "event-1",
            chapter_id: "chapter-1",
            event_type: "luma_event_linked",
            destination: "luma",
            external_object_type: "event",
            external_object_id: "evt_123",
            status: "recorded",
            payload: {},
            created_by: "leader-1",
            created_at: "2026-06-28T10:01:00Z",
            updated_at: "2026-06-28T10:01:00Z",
          },
        ],
        automationOutboxRows: [
          {
            id: "outbox-1",
            source_event_id: "event-1",
            integration_event_id: "integration-1",
            chapter_id: "chapter-1",
            destination: "luma",
            event_type: "luma_event_linked",
            payload: {},
            idempotency_key: "luma-1",
            status: "disabled",
            attempt_count: 0,
            available_at: "2026-06-28T10:01:00Z",
            locked_at: null,
            sent_at: null,
            last_error: null,
            created_at: "2026-06-28T10:01:00Z",
            updated_at: "2026-06-28T10:01:00Z",
          },
        ],
        auditLogRows: [
          {
            id: "audit-1",
            actor_user_id: "leader-1",
            chapter_id: "chapter-1",
            action: "luma_attendance_import_recorded",
            target_table: "chapter_events",
            target_id: "chapter-event-1",
            before_value: {},
            after_value: {},
            reason: "Recorded the staging Luma attendance proof in app tables.",
            created_at: "2026-06-28T10:09:00Z",
          },
        ],
        pointsEventRows: [
          {
            id: "points-1",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "chapter-event-1",
            evidence_item_id: null,
            approval_id: null,
            awarded_to_user_id: "member-1",
            points_delta: 20,
            reason: "Attendance confirmed for Intro GBM",
            created_by: "leader-1",
            created_at: "2026-06-28T10:07:00Z",
          },
          {
            id: "points-2",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "chapter-event-1",
            evidence_item_id: null,
            approval_id: null,
            awarded_to_user_id: "member-2",
            points_delta: 15,
            reason: "Attendance confirmed for Intro GBM",
            created_by: "leader-1",
            created_at: "2026-06-28T10:08:00Z",
          },
        ],
      },
    });

    const readback = getLumaEventLoopPilotReadback("admin", readySnapshot, {
      activation,
    });
    const html = renderToStaticMarkup(
      <LumaEventLoopPilotPanel readback={readback} compact />,
    );

    expect(readback.statusLabel).toBe("Staging proof recorded");
    expect(readback.statusDetail).toContain("Staging evidence rows recorded");
    expect(readback.summary).toContain("3 RSVP, 2 attendance, and 35 points");
    expect(readback.statusDetail).toContain("1 disabled outbox row(s), 1 audit row(s), and 0 sent row(s)");
    expect(readback.cards[1]).toMatchObject({ label: "RSVP path", value: "3" });
    expect(readback.cards[2]).toMatchObject({ label: "Attendance", value: "2" });
    expect(readback.cards[3]).toMatchObject({ label: "Points", value: "35 pts" });
    expect(readback.counts.attendeeRowsReturned).toBe(2);
    expect(html).toContain("Staging proof recorded");
    expect(html).toContain("35 pts");
  });
});
