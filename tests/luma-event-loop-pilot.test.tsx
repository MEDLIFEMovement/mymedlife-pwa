import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LumaEventLoopPilotPanel } from "@/components/luma-event-loop-pilot-panel";
import type { LumaCalendarReadinessSnapshot } from "@/services/luma-calendar-readiness";
import {
  getLumaEventLoopPilotReadback,
  type LumaEventLoopPilotRole,
} from "@/services/luma-event-loop-pilot";

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
});
