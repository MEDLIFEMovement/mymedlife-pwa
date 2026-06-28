import { describe, expect, it, vi } from "vitest";
import {
  buildLumaCalendarEventsEndpoint,
  getLumaCalendarReadinessSnapshot,
  type LumaCalendarFetch,
} from "@/services/luma-calendar-readiness";

describe("luma calendar readiness", () => {
  it("stays blocked until server-only Luma config exists", async () => {
    const snapshot = await getLumaCalendarReadinessSnapshot({
      env: {},
      fetchImpl: vi.fn(),
    });

    expect(snapshot.status).toBe("missing_config");
    expect(snapshot.apiKeyConfigured).toBe(false);
    expect(snapshot.eventCount).toBe(0);
    expect(snapshot.writesEnabled).toBe(false);
    expect(snapshot.externalWritesEnabled).toBe(0);
    expect(snapshot.secretReturned).toBe(false);
  });

  it("builds the read-only Luma calendar endpoint without putting the secret in the URL", () => {
    const endpoint = buildLumaCalendarEventsEndpoint(
      "cal-7WNftYCpBJclZyG",
      1000,
    );

    expect(endpoint).toBe(
      "https://public-api.luma.com/v1/calendar/list-events?calendar_api_id=cal-7WNftYCpBJclZyG&pagination_limit=50",
    );
    expect(endpoint).not.toContain("secret-");
  });

  it("maps Luma events into a safe readback shape and keeps writes disabled", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        entries: [
          {
            id: "evt-db-id",
            api_id: "evt-api-id",
            name: "UCLA MEDLIFE Info Night",
            url: "https://lu.ma/medlife-events-info-night",
            start_at: "2026-07-20T23:00:00.000Z",
            end_at: "2026-07-21T00:00:00.000Z",
            timezone: "America/Los_Angeles",
            visibility: "public",
            location_type: "offline",
            registration_questions: [{ label: "Private question" }],
            feedback_email: "private@example.test",
          },
        ],
        has_more: true,
      }),
    })) satisfies LumaCalendarFetch;

    const snapshot = await getLumaCalendarReadinessSnapshot({
      env: {
        LUMA_API_KEY: "secret-example-do-not-return",
        LUMA_CALENDAR_ID: "cal-7WNftYCpBJclZyG",
      },
      fetchImpl,
      limit: 5,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://public-api.luma.com/v1/calendar/list-events?calendar_api_id=cal-7WNftYCpBJclZyG&pagination_limit=5",
      {
        headers: {
          "x-luma-api-key": "secret-example-do-not-return",
        },
        cache: "no-store",
      },
    );
    expect(snapshot.status).toBe("ready");
    expect(snapshot.eventCount).toBe(1);
    expect(snapshot.hasMore).toBe(true);
    expect(snapshot.safeEvents).toEqual([
      {
        id: "evt-db-id",
        apiId: "evt-api-id",
        title: "UCLA MEDLIFE Info Night",
        url: "https://lu.ma/medlife-events-info-night",
        startAt: "2026-07-20T23:00:00.000Z",
        endAt: "2026-07-21T00:00:00.000Z",
        timezone: "America/Los_Angeles",
        visibility: "public",
        locationType: "offline",
      },
    ]);
    expect(JSON.stringify(snapshot)).not.toContain(
      "secret-example-do-not-return",
    );
    expect(JSON.stringify(snapshot)).not.toContain("private@example.test");
    expect(snapshot.attendeeDataReturned).toBe(false);
    expect(snapshot.writesEnabled).toBe(false);
    expect(snapshot.externalWritesEnabled).toBe(0);
    expect(snapshot.detail).toContain("Event creation");
  });

  it("returns a sanitized API error without exposing credential details", async () => {
    const snapshot = await getLumaCalendarReadinessSnapshot({
      env: {
        LUMA_API_KEY: "secret-example-do-not-return",
        LUMA_CALENDAR_ID: "cal-7WNftYCpBJclZyG",
      },
      fetchImpl: vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({
          message: "secret-example-do-not-return",
        }),
      })),
    });

    expect(snapshot.status).toBe("api_error");
    expect(snapshot.detail).toBe("Luma calendar read returned HTTP 401.");
    expect(JSON.stringify(snapshot)).not.toContain(
      "secret-example-do-not-return",
    );
  });
});
