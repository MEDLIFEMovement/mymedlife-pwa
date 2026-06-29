import { describe, expect, it } from "vitest";
import type {
  SupabaseAppClient,
  SupabaseAppMutateOptions,
  SupabaseAppSelectOptions,
} from "@/lib/supabase-app-client";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";
import {
  persistLumaAttendanceImportProof,
  persistLumaEventUpsertProof,
  persistLumaRsvpProof,
} from "@/services/luma-live-pilot-persistence";

describe("luma live pilot persistence", () => {
  it("records durable event and feed proof rows for a staged Luma event", async () => {
    const db = createFakeSupabaseAppClient();
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");

    const result = await persistLumaEventUpsertProof(
      {
        actor,
        request: {
          name: "myMEDLIFE Staging Luma Pilot Event",
          startAt: "2026-07-20T23:00:00.000Z",
          endAt: "2026-07-21T00:00:00.000Z",
          timezone: "America/Los_Angeles",
          address: "UCLA, Los Angeles, CA",
          descriptionMd: "Staging pilot only.",
        },
        result: {
          ok: true,
          operation: "event_create",
          status: "executed",
          safeMessage: "Created Luma event.",
          externalWrites: 1,
          externalReads: 0,
          eventId: "evt-live-pilot",
          eventUrl: "https://lu.ma/evt-live-pilot",
          attendanceRows: [],
          secretsReturned: false,
        },
      },
      createPersistenceDeps(db.client),
    );

    expect(result.eventId).toBe("evt-live-pilot");
    expect(db.tables.chapter_events).toHaveLength(1);
    expect(db.tables.luma_event_links).toHaveLength(1);
    expect(db.tables.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: "luma_event_upserted",
          chapter_event_id: result.chapterEventId,
          correlation_id: expect.stringContaining("luma-pilot:event:evt-live-pilot"),
        }),
      ]),
    );
    expect(db.tables.integration_events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: "luma_event_linked",
          destination: "luma",
        }),
        expect.objectContaining({
          event_type: "event_shared_to_feed",
          destination: "internal",
        }),
      ]),
    );
    expect(db.tables.automation_outbox).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: "luma_event_external_send_blocked",
          status: "disabled",
        }),
      ]),
    );
    expect(db.tables.audit_logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "luma_event_upsert_recorded",
        }),
      ]),
    );
  });

  it("dedupes repeated RSVP proof for the same member and event", async () => {
    const db = createFakeSupabaseAppClient();
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const deps = createPersistenceDeps(db.client);

    await persistLumaEventUpsertProof(
      {
        actor,
        request: {
          name: "Pilot event",
          startAt: "2026-07-20T23:00:00.000Z",
          endAt: null,
          timezone: "America/Los_Angeles",
          address: null,
          descriptionMd: null,
        },
        result: {
          ok: true,
          operation: "event_create",
          status: "executed",
          safeMessage: "Created Luma event.",
          externalWrites: 1,
          externalReads: 0,
          eventId: "evt-rsvp",
          eventUrl: "https://lu.ma/evt-rsvp",
          attendanceRows: [],
          secretsReturned: false,
        },
      },
      deps,
    );

    const first = await persistLumaRsvpProof(
      {
        actor,
        request: {
          eventId: "evt-rsvp",
          email: "nellis@medlifemovement.org",
          name: "Nick Ellis",
        },
        result: {
          ok: true,
          operation: "rsvp_write",
          status: "executed",
          safeMessage: "RSVP written.",
          externalWrites: 1,
          externalReads: 0,
          eventId: "evt-rsvp",
          eventUrl: null,
          attendanceRows: [],
          secretsReturned: false,
        },
      },
      deps,
    );
    const second = await persistLumaRsvpProof(
      {
        actor,
        request: {
          eventId: "evt-rsvp",
          email: "nellis@medlifemovement.org",
          name: "Nick Ellis",
        },
        result: {
          ok: true,
          operation: "rsvp_write",
          status: "executed",
          safeMessage: "RSVP written.",
          externalWrites: 1,
          externalReads: 0,
          eventId: "evt-rsvp",
          eventUrl: null,
          attendanceRows: [],
          secretsReturned: false,
        },
      },
      deps,
    );

    expect(first.rsvpRecorded).toBe(true);
    expect(second.rsvpRecorded).toBe(false);
    expect(
      db.tables.events.filter((row) => row.event_type === "event_rsvp_recorded"),
    ).toHaveLength(1);
  });

  it("creates attendance points once per matched member across repeated imports", async () => {
    const db = createFakeSupabaseAppClient();
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const deps = createPersistenceDeps(db.client);

    await persistLumaEventUpsertProof(
      {
        actor,
        request: {
          name: "Pilot event",
          startAt: "2026-07-20T23:00:00.000Z",
          endAt: null,
          timezone: "America/Los_Angeles",
          address: null,
          descriptionMd: null,
        },
        result: {
          ok: true,
          operation: "event_create",
          status: "executed",
          safeMessage: "Created Luma event.",
          externalWrites: 1,
          externalReads: 0,
          eventId: "evt-attendance",
          eventUrl: "https://lu.ma/evt-attendance",
          attendanceRows: [],
          secretsReturned: false,
        },
      },
      deps,
    );

    const first = await persistLumaAttendanceImportProof(
      {
        actor,
        eventId: "evt-attendance",
        result: {
          ok: true,
          operation: "attendance_import",
          status: "executed",
          safeMessage: "Attendance imported.",
          externalWrites: 0,
          externalReads: 1,
          eventId: "evt-attendance",
          eventUrl: null,
          attendanceRows: [],
          secretsReturned: false,
        },
        attendanceRows: [
          {
            guestId: "guest-1",
            email: "nellis@medlifemovement.org",
            name: "Nick Ellis",
            approvalStatus: "approved",
            checkedInAt: "2026-07-20T23:30:00.000Z",
            attended: true,
          },
        ],
      },
      deps,
    );
    const second = await persistLumaAttendanceImportProof(
      {
        actor,
        eventId: "evt-attendance",
        result: {
          ok: true,
          operation: "attendance_import",
          status: "executed",
          safeMessage: "Attendance imported.",
          externalWrites: 0,
          externalReads: 1,
          eventId: "evt-attendance",
          eventUrl: null,
          attendanceRows: [],
          secretsReturned: false,
        },
        attendanceRows: [
          {
            guestId: "guest-1",
            email: "nellis@medlifemovement.org",
            name: "Nick Ellis",
            approvalStatus: "approved",
            checkedInAt: "2026-07-20T23:30:00.000Z",
            attended: true,
          },
        ],
      },
      deps,
    );

    expect(first.pointsCreated).toBe(1);
    expect(second.pointsCreated).toBe(0);
    expect(db.tables.points_events).toEqual([
      expect.objectContaining({
        points_delta: 20,
        reason: "Luma pilot attendance confirmed for Pilot event",
      }),
    ]);
  });
});

function createPersistenceDeps(client: SupabaseAppClient) {
  const baseData = getMockReadOnlyAppData("test");
  const data: ReadOnlyAppData = {
    ...baseData,
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "test",
    },
    profiles: [
      {
        id: "00000000-0000-4000-8000-000000000012",
        display_name: "Nellis",
        email: "nellis@medlifemovement.org",
        status: "active",
        created_at: "2026-06-01T00:00:00Z",
        updated_at: "2026-06-01T00:00:00Z",
      },
    ],
    phases: [
      {
        id: "41000000-0000-4000-8000-000000000001",
        chapter_id: baseData.chapter.id,
        campaign_id: baseData.campaign.id,
        phase_template_id: null,
        title: "Invite week",
        objective: "Get students to the first Rush Month events.",
        starts_at: null,
        ends_at: null,
        status: "active",
        readiness_status: "ready",
        coach_validation_status: "validated",
        required_outputs: {},
        entry_criteria: {},
        exit_criteria: {},
        created_at: "2026-06-01T00:00:00Z",
        updated_at: "2026-06-01T00:00:00Z",
      },
    ],
    eventRows: [],
    pointsEventRows: [],
    integrationEventRows: [],
    automationOutboxRows: [],
    auditLogs: [],
  };

  return {
    createClient: async () => ({
      client,
      persistence: {
        mode: "supabase" as const,
        status: "ready" as const,
        reason: "test",
        isLocalOnly: false,
      },
    }),
    getData: async () => data,
    now: () => "2026-06-28T20:00:00.000Z",
  };
}

function createFakeSupabaseAppClient() {
  const tables: Record<string, Array<Record<string, unknown>>> = {
    chapter_events: [],
    luma_event_links: [],
    events: [],
    integration_events: [],
    automation_outbox: [],
    audit_logs: [],
    points_events: [],
  };
  let counter = 1;
  const timestamp = "2026-06-28T20:00:00.000Z";

  const client: SupabaseAppClient = {
    persistence: {
      mode: "supabase",
      status: "ready",
      reason: "test",
      isLocalOnly: false,
    },
    async selectRows<TRow>(tableName: string, options: SupabaseAppSelectOptions = {}) {
      const rows = [...(tables[tableName] ?? [])];
      const filtered = rows.filter((row) => matchesQuery(row, options.query ?? {}));
      return filtered.slice(0, options.limit ?? filtered.length) as TRow[];
    },
    async insertRows<TRow>(tableName: string, rows: Record<string, unknown>[]) {
      const nextRows = rows.map((row) => {
        const materialized = {
          id: `${tableName}-${counter++}`,
          created_at: timestamp,
          updated_at: timestamp,
          attempt_count: 0,
          available_at: timestamp,
          locked_at: null,
          sent_at: null,
          last_error: null,
          ...row,
        };
        tables[tableName] = [...(tables[tableName] ?? []), materialized];
        return materialized;
      });
      return nextRows as TRow[];
    },
    async upsertRows<TRow>(tableName: string, rows: Record<string, unknown>[]) {
      return this.insertRows<TRow>(tableName, rows);
    },
    async updateRows<TRow>(
      tableName: string,
      values: Record<string, unknown>,
      options: SupabaseAppMutateOptions,
    ) {
      const nextRows = (tables[tableName] ?? []).map((row) =>
        matchesQuery(row, options.query ?? {})
          ? { ...row, ...values, updated_at: timestamp }
          : row,
      );
      tables[tableName] = nextRows;
      return nextRows.filter((row) => matchesQuery(row, options.query ?? {})) as TRow[];
    },
  };

  return { client, tables };
}

function matchesQuery(
  row: Record<string, unknown>,
  query: Record<string, string>,
) {
  return Object.entries(query).every(([key, value]) => {
    if (!value.startsWith("eq.")) {
      return true;
    }

    return String(row[key] ?? "") === value.slice(3);
  });
}
