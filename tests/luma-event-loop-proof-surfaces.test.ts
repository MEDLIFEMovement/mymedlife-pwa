import { describe, expect, it } from "vitest";
import type { LumaCalendarReadinessSnapshot } from "@/services/luma-calendar-readiness";
import { getLumaEventLoopProofSurfaces } from "@/services/luma-event-loop-proof-surfaces";
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

describe("luma event loop proof surfaces", () => {
  it("maps the member, leader, staff, and admin routes into one reviewer matrix", () => {
    const activation = getStagingLumaEventLoopReadModel({
      mode: "staging",
      data: {
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
              attendanceCount: 1,
              importedGuestCount: 1,
            },
            correlation_id: "luma-pilot:attendance:evt-bJE178Q02N5DaLH:1",
            occurred_at: "2026-06-29T11:07:42.137Z",
            created_at: "2026-06-29T11:07:42.137Z",
          },
        ],
        integrationEventRows: [],
        automationOutboxRows: [],
        auditLogRows: [],
        pointsEventRows: [
          {
            id: "points-1",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "pilot-chapter-event",
            evidence_item_id: null,
            approval_id: null,
            awarded_to_user_id: "member-1",
            points_delta: 20,
            reason: "Attendance confirmed for Intro GBM",
            created_by: "leader-1",
            created_at: "2026-06-29T10:07:00Z",
          },
        ],
      },
    });

    const surfaces = getLumaEventLoopProofSurfaces({
      snapshot: readySnapshot,
      activation,
    });

    expect(surfaces.map((surface) => surface.route)).toEqual([
      "/app",
      "/leader",
      "/staff",
      "/admin",
    ]);
    expect(surfaces.map((surface) => surface.label)).toEqual([
      "General member workspace",
      "Student leader workspace",
      "Sales coach / staff workspace",
      "DS / admin workspace",
    ]);
    expect(
      surfaces.every(
        (surface) =>
          surface.facts.map((fact) => fact.label).join("|") ===
          "RSVP path|Attendance|Points|Leaderboard",
      ),
    ).toBe(true);
    expect(surfaces[0]?.summary).toContain("1 RSVP, 1 attendance, and 20 points");
    expect(surfaces[3]?.reviewGoal).toContain("audit, outbox, and launch-gate posture");
    expect(surfaces[1]?.note).toContain("Current staging evidence shows");
    expect(surfaces[2]?.facts.find((fact) => fact.label === "Leaderboard")?.value).toBe(
      "Portfolio",
    );
  });
});
