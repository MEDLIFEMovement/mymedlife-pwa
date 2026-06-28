import { describe, expect, it, vi } from "vitest";
import {
  buildLumaGuestListEndpoint,
  createOrUpdateLumaEvent,
  getLumaLivePilotGate,
  importLumaAttendance,
  writeLumaRsvp,
  type LumaLivePilotEnv,
  type LumaLivePilotFetch,
} from "@/services/luma-live-pilot";

const enabledEnv: LumaLivePilotEnv = {
  LUMA_API_KEY: "secret-example-do-not-return",
  LUMA_CALENDAR_ID: "cal-7WNftYCpBJclZyG",
  MYMEDLIFE_ENABLE_LUMA_WRITES: "true",
  MYMEDLIFE_ENABLE_LUMA_EVENT_WRITES: "true",
  MYMEDLIFE_ENABLE_LUMA_RSVP_WRITES: "true",
  MYMEDLIFE_ENABLE_LUMA_ATTENDANCE_IMPORT: "true",
  MYMEDLIFE_LUMA_ENVIRONMENT: "staging",
  VERCEL_ENV: "preview",
};

describe("luma live pilot gateway", () => {
  it("fails closed unless staging environment, base flag, and granular flags are enabled", () => {
    expect(getLumaLivePilotGate({}).enabledOperations).toBe(0);
    expect(
      getLumaLivePilotGate({
        ...enabledEnv,
        MYMEDLIFE_LUMA_ENVIRONMENT: "production",
      }),
    ).toMatchObject({
      productionBlocked: true,
      eventWritesEnabled: false,
      rsvpWritesEnabled: false,
      attendanceImportEnabled: false,
    });
    expect(
      getLumaLivePilotGate({
        ...enabledEnv,
        MYMEDLIFE_ENABLE_LUMA_RSVP_WRITES: "false",
      }),
    ).toMatchObject({
      eventWritesEnabled: true,
      rsvpWritesEnabled: false,
      attendanceImportEnabled: true,
    });
  });

  it("creates a Luma event through the documented server-only endpoint", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "evt-created",
        url: "https://lu.ma/staging-created",
      }),
    })) satisfies LumaLivePilotFetch;

    const result = await createOrUpdateLumaEvent(
      {
        name: "myMEDLIFE Staging Pilot Event",
        startAt: "2026-07-20T23:00:00.000Z",
        endAt: "2026-07-21T00:00:00.000Z",
        timezone: "America/Los_Angeles",
        address: "UCLA, Los Angeles, CA",
        descriptionMd: "Staging only.",
      },
      { env: enabledEnv, fetchImpl },
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://public-api.luma.com/v1/events/create",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-luma-api-key": "secret-example-do-not-return",
        },
      }),
    );
    const createCall = vi.mocked(fetchImpl).mock
      .calls[0] as unknown as Parameters<LumaLivePilotFetch>;
    expect(JSON.parse(createCall[1].body ?? "{}")).toMatchObject({
      name: "myMEDLIFE Staging Pilot Event",
      start_at: "2026-07-20T23:00:00.000Z",
      end_at: "2026-07-21T00:00:00.000Z",
      timezone: "America/Los_Angeles",
      visibility: "public",
      geo_address_json: {
        type: "manual",
        address: "UCLA, Los Angeles, CA",
      },
    });
    expect(result).toMatchObject({
      ok: true,
      operation: "event_create",
      externalWrites: 1,
      eventId: "evt-created",
      secretsReturned: false,
    });
    expect(JSON.stringify(result)).not.toContain("secret-example-do-not-return");
  });

  it("updates Luma events with notifications suppressed", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "evt-existing",
      }),
    })) satisfies LumaLivePilotFetch;

    await createOrUpdateLumaEvent(
      {
        eventId: "evt-existing",
        name: "Updated staging event",
        startAt: "2026-07-20T23:00:00.000Z",
        timezone: "America/Los_Angeles",
      },
      { env: enabledEnv, fetchImpl },
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://public-api.luma.com/v1/events/update",
      expect.any(Object),
    );
    const updateCall = vi.mocked(fetchImpl).mock
      .calls[0] as unknown as Parameters<LumaLivePilotFetch>;
    expect(JSON.parse(updateCall[1].body ?? "{}")).toMatchObject({
      event_id: "evt-existing",
      suppress_notifications: true,
      name: "Updated staging event",
    });
  });

  it("writes RSVP guests back to Luma with Luma email sending off", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "guest-created",
      }),
    })) satisfies LumaLivePilotFetch;

    const result = await writeLumaRsvp(
      {
        eventId: "evt-existing",
        email: "member.a@mymedlife.test",
        name: "Member A",
      },
      { env: enabledEnv, fetchImpl },
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://public-api.luma.com/v1/events/guests/add",
      expect.any(Object),
    );
    const rsvpCall = vi.mocked(fetchImpl).mock
      .calls[0] as unknown as Parameters<LumaLivePilotFetch>;
    expect(JSON.parse(rsvpCall[1].body ?? "{}")).toEqual({
      event_id: "evt-existing",
      guests: [{ email: "member.a@mymedlife.test", name: "Member A" }],
      approval_status: "approved",
      send_email: false,
    });
    expect(result.safeMessage).toContain("email sending off");
    expect(result.externalWrites).toBe(1);
  });

  it("imports attendance without returning QR codes or raw secrets", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        entries: [
          {
            id: "guest-1",
            user_email: "member.a@mymedlife.test",
            user_name: "Member A",
            approval_status: "approved",
            checked_in_at: "2026-07-20T23:30:00.000Z",
            check_in_qr_code: "private-qr",
          },
          {
            id: "guest-2",
            user_email: "member.b@mymedlife.test",
            user_name: "Member B",
            approval_status: "approved",
            checked_in_at: null,
            check_in_qr_code: "private-qr",
          },
        ],
      }),
    })) satisfies LumaLivePilotFetch;

    const result = await importLumaAttendance(
      { eventId: "evt-existing", limit: 2 },
      { env: enabledEnv, fetchImpl },
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://public-api.luma.com/v1/events/guests/list?event_id=evt-existing&approval_status=approved&pagination_limit=2&sort_column=checked_in_at&sort_direction=desc+nulls+last",
      expect.any(Object),
    );
    expect(result).toMatchObject({
      ok: true,
      operation: "attendance_import",
      externalReads: 1,
      externalWrites: 0,
      secretsReturned: false,
    });
    expect(result.attendanceRows).toEqual([
      {
        guestId: "guest-1",
        emailHint: "me***@mymedlife.test",
        name: "Member A",
        approvalStatus: "approved",
        checkedInAt: "2026-07-20T23:30:00.000Z",
        attended: true,
      },
      {
        guestId: "guest-2",
        emailHint: "me***@mymedlife.test",
        name: "Member B",
        approvalStatus: "approved",
        checkedInAt: null,
        attended: false,
      },
    ]);
    expect(JSON.stringify(result)).not.toContain("private-qr");
    expect(JSON.stringify(result)).not.toContain("secret-example-do-not-return");
  });

  it("builds the attendance import URL without secrets", () => {
    const endpoint = buildLumaGuestListEndpoint("evt-existing", 500);

    expect(endpoint).toBe(
      "https://public-api.luma.com/v1/events/guests/list?event_id=evt-existing&approval_status=approved&pagination_limit=100&sort_column=checked_in_at&sort_direction=desc+nulls+last",
    );
    expect(endpoint).not.toContain("secret");
  });
});
