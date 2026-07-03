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

const enabledRolloutFlags = {
  eventCreateEnabled: true,
  eventUpdateEnabled: true,
  rsvpWritebackEnabled: true,
  attendanceImportEnabled: true,
  source: "env" as const,
};

describe("luma live pilot gateway", () => {
  it("fails closed unless staging environment, base flag, and granular flags are enabled", () => {
    expect(getLumaLivePilotGate({}).enabledOperations).toBe(0);
    expect(getLumaLivePilotGate({}).detail).toContain(
      "Luma API key and calendar id must both be configured server-side",
    );
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
    expect(
      getLumaLivePilotGate(enabledEnv, {
        rolloutFlags: enabledRolloutFlags,
      }).detail,
    ).toContain("explicit calendar assignment");
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
      { env: enabledEnv, fetchImpl, rolloutFlags: enabledRolloutFlags },
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
      { env: enabledEnv, fetchImpl, rolloutFlags: enabledRolloutFlags },
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

  it("can create a Luma event for an explicitly mapped chapter outside the seeded fallback list", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "evt-ucsd",
        url: "https://lu.ma/evt-ucsd",
      }),
    })) satisfies LumaLivePilotFetch;

    const result = await createOrUpdateLumaEvent(
      {
        chapterId: "chapter-san-diego",
        chapterName: "UC San Diego MEDLIFE",
        name: "UCSD Rush Kickoff",
        startAt: "2026-07-24T23:00:00.000Z",
        timezone: "America/Los_Angeles",
      },
      {
        env: {
          ...enabledEnv,
          MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON: JSON.stringify([
            {
              chapterId: "chapter-san-diego",
              chapterName: "UC San Diego MEDLIFE",
              calendarId: "cal-ucsd-9999",
              calendarLabel: "UCSD chapter calendar",
            },
          ]),
        },
        fetchImpl,
        rolloutFlags: enabledRolloutFlags,
      },
    );

    expect(result).toMatchObject({
      ok: true,
      operation: "event_create",
      eventId: "evt-ucsd",
    });
    expect(result.safeMessage).toContain(
      "Chapter mapping: UC San Diego MEDLIFE (UCSD chapter calendar).",
    );
  });

  it("can create a Luma event from a saved in-app chapter calendar mapping", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "evt-persisted",
        url: "https://lu.ma/evt-persisted",
      }),
    })) satisfies LumaLivePilotFetch;

    const result = await createOrUpdateLumaEvent(
      {
        chapterId: "chapter-northview",
        chapterName: "UCLA MEDLIFE",
        name: "UCLA Saved Mapping Event",
        startAt: "2026-07-24T23:00:00.000Z",
        timezone: "America/Los_Angeles",
      },
      {
        env: {
          ...enabledEnv,
          VERCEL_ENV: "preview",
        },
        fetchImpl,
        rolloutFlags: enabledRolloutFlags,
        persistedCalendarRows: [
          {
            id: "chapter-luma-ucla",
            chapter_id: "chapter-northview",
            environment: "staging",
            calendar_id: "cal-ucla-saved",
            calendar_label: "UCLA saved calendar",
            is_default: false,
            status: "linked",
            linked_by: "leader-1",
            linked_at: "2026-06-30T00:00:00Z",
            notes: "Saved in app for staging.",
            created_at: "2026-06-30T00:00:00Z",
            updated_at: "2026-06-30T00:00:00Z",
          },
        ],
      },
    );

    expect(result).toMatchObject({
      ok: true,
      operation: "event_create",
      eventId: "evt-persisted",
    });
    expect(result.safeMessage).toContain(
      "Chapter mapping: UCLA MEDLIFE (UCLA saved calendar).",
    );
  });

  it("blocks event creation when a specific chapter was requested but only the shared default calendar exists", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "evt-should-not-run",
        url: "https://lu.ma/evt-should-not-run",
      }),
    })) satisfies LumaLivePilotFetch;

    const result = await createOrUpdateLumaEvent(
      {
        chapterId: "chapter-not-configured",
        chapterName: "Unmapped MEDLIFE",
        name: "Unmapped Pilot Event",
        startAt: "2026-07-24T23:00:00.000Z",
        timezone: "America/Los_Angeles",
      },
      {
        env: {
          ...enabledEnv,
          LUMA_CALENDAR_ID: "cal-shared-default",
          MYMEDLIFE_LUMA_SHARED_DEFAULT_CHAPTER_ID: "chapter-northview",
        },
        fetchImpl,
        rolloutFlags: enabledRolloutFlags,
      },
    );

    expect(result).toMatchObject({
      ok: false,
      operation: "event_create",
      status: "blocked",
      safeMessage:
        "Select a chapter with a ready Luma calendar before running event create/update.",
      externalWrites: 0,
      externalReads: 0,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("writes RSVP guests back to Luma with Luma email sending off", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "guest-created",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          entries: [
            {
              id: "guest-created",
              user_email: "member.a@mymedlife.test",
              user_name: "Member A",
              approval_status: "approved",
              checked_in_at: null,
            },
          ],
        }),
      }) satisfies LumaLivePilotFetch;

    const result = await writeLumaRsvp(
      {
        eventId: "evt-existing",
        email: "member.a@mymedlife.test",
        name: "Member A",
      },
      {
        env: enabledEnv,
        fetchImpl,
        rolloutFlags: enabledRolloutFlags,
        sleepImpl: async () => {},
      },
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
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://public-api.luma.com/v1/events/guests/list?event_id=evt-existing&approval_status=approved&pagination_limit=100&sort_column=checked_in_at&sort_direction=desc+nulls+last",
      expect.any(Object),
    );
    expect(result.safeMessage).toContain("email sending off");
    expect(result.externalWrites).toBe(1);
    expect(result.externalReads).toBe(1);
  });

  it("fails the RSVP lane if Luma never shows the guest in the approved list", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          entries: [],
        }),
      }) satisfies LumaLivePilotFetch;

    const result = await writeLumaRsvp(
      {
        eventId: "evt-existing",
        email: "member.a@mymedlife.test",
      },
      {
        env: enabledEnv,
        fetchImpl,
        rolloutFlags: enabledRolloutFlags,
        sleepImpl: async () => {},
      },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(result).toMatchObject({
      ok: false,
      operation: "rsvp_write",
      status: "failed",
      externalWrites: 0,
      eventId: null,
    });
    expect(result.safeMessage).toContain("did not appear in the approved guest list");
  });

  it("imports attendance without returning QR codes or raw secrets", async () => {
    let rawRows: Array<{ email: string | null }> = [];
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
      {
        env: enabledEnv,
        fetchImpl,
        onImportedRows(rows) {
          rawRows = rows;
        },
        rolloutFlags: enabledRolloutFlags,
      },
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
    expect(rawRows.map((row) => ({ email: row.email }))).toEqual([
      { email: "member.a@mymedlife.test" },
      { email: "member.b@mymedlife.test" },
    ]);
  });

  it("builds the attendance import URL without secrets", () => {
    const endpoint = buildLumaGuestListEndpoint("evt-existing", 500);

    expect(endpoint).toBe(
      "https://public-api.luma.com/v1/events/guests/list?event_id=evt-existing&approval_status=approved&pagination_limit=100&sort_column=checked_in_at&sort_direction=desc+nulls+last",
    );
    expect(endpoint).not.toContain("secret");
  });
});
