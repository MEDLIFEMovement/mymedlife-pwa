import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  createLumaReadClient,
  getLumaEventSyncConfig,
  runLumaEventSync,
} from "@/services/luma-event-sync";

const enabledEnv = {
  MYMEDLIFE_AUTH_MODE: "production_supabase",
  MYMEDLIFE_ENABLE_LUMA_READ_SYNC: "true",
  MYMEDLIFE_ALLOW_PRODUCTION_LUMA_READ_SYNC: "true",
  MYMEDLIFE_LUMA_CHAPTER_ID: "90000000-0000-4000-8000-000000000001",
  MYMEDLIFE_LUMA_CALENDAR_LABEL: "Production Review Calendar",
  LUMA_CALENDAR_ID: "cal-production",
  LUMA_API_KEY: "server-only-luma-key",
  SUPABASE_SERVICE_ROLE_KEY: "server-only-service-key",
  SUPABASE_URL: "https://example.supabase.co",
};

describe("Luma event read sync", () => {
  it("requires a feature flag, server-only credentials, mapping, and environment approval", () => {
    expect(getLumaEventSyncConfig({
      ...enabledEnv,
      MYMEDLIFE_ENABLE_LUMA_READ_SYNC: undefined,
    })).toMatchObject({ enabled: false, environment: "production" });

    expect(getLumaEventSyncConfig({ ...enabledEnv, LUMA_API_KEY: undefined })).toMatchObject({
      enabled: false,
      reason: "Luma event read sync is disabled because the server-only API key is missing.",
    });

    expect(getLumaEventSyncConfig({ ...enabledEnv, MYMEDLIFE_LUMA_CHAPTER_ID: undefined })).toMatchObject({
      enabled: false,
      reason: "Luma event read sync needs one approved pilot chapter and calendar mapping.",
    });

    expect(getLumaEventSyncConfig({
      ...enabledEnv,
      MYMEDLIFE_ALLOW_PRODUCTION_LUMA_READ_SYNC: undefined,
    })).toMatchObject({ enabled: false, environment: "production" });

    expect(getLumaEventSyncConfig(enabledEnv)).toMatchObject({
      enabled: true,
      environment: "production",
      chapterId: "90000000-0000-4000-8000-000000000001",
      calendarId: "cal-production",
    });

    expect(getLumaEventSyncConfig({
      ...enabledEnv,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    })).toMatchObject({ enabled: false, reason: "Luma event read sync is disabled because the server-only Supabase client is incomplete." });
    expect(getLumaEventSyncConfig({
      ...enabledEnv,
      MYMEDLIFE_AUTH_MODE: "staging_supabase",
      MYMEDLIFE_ALLOW_PRODUCTION_LUMA_READ_SYNC: undefined,
      MYMEDLIFE_ALLOW_STAGING_LUMA_READ_SYNC: "true",
    })).toMatchObject({ enabled: true, environment: "staging" });
    expect(getLumaEventSyncConfig({
      ...enabledEnv,
      MYMEDLIFE_AUTH_MODE: "local",
      MYMEDLIFE_ALLOW_PRODUCTION_LUMA_READ_SYNC: undefined,
      MYMEDLIFE_ALLOW_LOCAL_LUMA_READ_SYNC: "true",
    })).toMatchObject({ enabled: true, environment: "local" });
  });

  it("paginates the official calendar event endpoint and keeps only the approved calendar", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        entries: [lumaEvent({ id: "evt-one" })],
        next_cursor: "page-two",
      }))
      .mockResolvedValueOnce(jsonResponse({
        entries: [
          lumaEvent({ id: "evt-two" }),
          lumaEvent({ id: "evt-wrong", calendar_id: "cal-other" }),
        ],
      }));

    const client = createLumaReadClient(enabledEnv, fetchMock);
    const events = await client?.readEvents("backfill", new Date("2026-07-20T00:00:00.000Z"));

    expect(events).toHaveLength(2);
    expect(events?.[0]).toMatchObject({
      id: "evt-one",
      calendarId: "cal-production",
      locationLabel: "123 Main Street",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/v1/calendars/events/list?");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("pagination_cursor=page-two");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: { "x-luma-api-key": "server-only-luma-key" },
      cache: "no-store",
    });
  });

  it("uses a bounded rolling window for scheduled reconciliation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ entries: [] }));
    const client = createLumaReadClient(enabledEnv, fetchMock);
    await client?.readEvents("reconcile", new Date("2026-07-20T00:00:00.000Z"));

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("after=2026-04-21T00%3A00%3A00.000Z");
    expect(url).toContain("before=2027-07-20T00%3A00%3A00.000Z");
  });

  it("fails the read before materialization when Luma returns malformed events", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      entries: [lumaEvent(), { id: "missing-required-fields" }],
    }));
    const client = createLumaReadClient(enabledEnv, fetchMock);

    await expect(client?.readEvents("backfill", new Date("2026-07-20T00:00:00.000Z"))).rejects.toThrow(
      "Luma returned 1 malformed event record(s); reconciliation stopped before materialization.",
    );
  });

  it("retries transient provider failures and never exposes provider response content", async () => {
    vi.useFakeTimers();
    const transientFetch = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(jsonResponse({ entries: [] }));
    const client = createLumaReadClient(enabledEnv, transientFetch);
    const read = client?.readEvents("backfill", new Date("2026-07-20T00:00:00.000Z"));
    await vi.runAllTimersAsync();
    await expect(read).resolves.toEqual([]);
    expect(transientFetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();

    const failedClient = createLumaReadClient(enabledEnv, vi.fn().mockResolvedValue(
      new Response("private provider response", { status: 400 }),
    ));
    await expect(failedClient?.readEvents("backfill", new Date())).rejects.toThrow("Luma request failed (400).");
  });

  it("materializes a real provider event into app-owned event, link, import, and audit rows", async () => {
    const queries: FakeQuery[] = [];
    const appClient = createFakeAppClient((query) => {
      queries.push(query);
      if (query.table === "staff_role_assignments") return ok([{ role_key: "ds_admin" }]);
      if (query.table === "chapters" && query.operation === "select") {
        return ok([{ id: enabledEnv.MYMEDLIFE_LUMA_CHAPTER_ID, name: "Production Review Chapter" }]);
      }
      if (query.table === "luma_sync_runs" && query.operation === "select") return ok([]);
      if (query.table === "luma_sync_runs" && query.operation === "insert") return ok({ id: "run-1" });
      if (query.table === "luma_event_links" && query.operation === "select") return ok([]);
      if (query.table === "luma_event_links" && query.operation === "insert") return ok({ id: "link-1" });
      if (query.table === "chapter_events" && query.operation === "insert") return ok({ id: "event-1" });
      return ok([]);
    });

    const result = await runLumaEventSync("actor-1", "backfill", {
      env: enabledEnv,
      appClient: appClient as never,
      lumaClient: { readEvents: async () => [mappedLumaEvent()] },
      now: () => new Date("2026-07-20T02:00:00.000Z"),
    });

    expect(result).toMatchObject({
      success: true,
      code: "luma_sync_succeeded",
      runId: "run-1",
      counts: { sourceEvents: 1, eventUpserts: 1, materializedEvents: 1, failures: 0 },
    });
    expect(queries).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: "chapter_luma_calendars", operation: "upsert" }),
      expect.objectContaining({ table: "luma_event_imports", operation: "upsert" }),
      expect.objectContaining({ table: "chapter_events", operation: "insert" }),
      expect.objectContaining({ table: "luma_event_links", operation: "insert" }),
      expect.objectContaining({ table: "audit_logs", operation: "insert" }),
    ]));
    const providerLink = queries.find((query) => query.table === "luma_event_links" && query.operation === "insert");
    expect(providerLink?.payload).toMatchObject({ status: "linked", luma_event_id: "evt-one" });
    expect(queries.some((query) => query.table === "automation_outbox")).toBe(false);
  });

  it("fails closed for non-admin actors and honors the database lock", async () => {
    const nonAdmin = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") return ok([{ role_key: "general_member" }]);
      return ok([]);
    });
    await expect(runLumaEventSync("member-1", "backfill", {
      env: enabledEnv,
      appClient: nonAdmin as never,
      lumaClient: { readEvents: vi.fn() },
    })).resolves.toMatchObject({ success: false, code: "permission_denied" });

    const locked = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") return ok([{ role_key: "super_admin" }]);
      if (query.table === "chapters") return ok([{ id: enabledEnv.MYMEDLIFE_LUMA_CHAPTER_ID }]);
      if (query.table === "luma_sync_runs" && query.operation === "select") return ok([{ id: "running" }]);
      return ok([]);
    });
    const lumaClient = { readEvents: vi.fn() };
    await expect(runLumaEventSync("admin-1", "reconcile", {
      env: enabledEnv,
      appClient: locked as never,
      lumaClient,
    })).resolves.toMatchObject({ success: false, code: "sync_already_running" });
    expect(lumaClient.readEvents).not.toHaveBeenCalled();
  });

  it("requires an actor for manual work and replay lineage for replays", async () => {
    await expect(runLumaEventSync(null, "backfill", { env: enabledEnv })).resolves.toMatchObject({
      success: false,
      code: "missing_auth",
    });
    await expect(runLumaEventSync("admin-1", "reconcile", {
      env: enabledEnv,
      triggerSource: "replay",
    })).resolves.toMatchObject({ success: false, code: "server_error" });
  });

  it("updates an existing linked event without creating a duplicate", async () => {
    const queries: FakeQuery[] = [];
    const appClient = createFakeAppClient((query) => {
      queries.push(query);
      if (query.table === "staff_role_assignments") return ok([{ role_key: "super_admin" }]);
      if (query.table === "chapters" && query.operation === "select") return ok([{ id: enabledEnv.MYMEDLIFE_LUMA_CHAPTER_ID }]);
      if (query.table === "luma_sync_runs" && query.operation === "select") return ok([]);
      if (query.table === "luma_sync_runs" && query.operation === "insert") return ok({ id: "run-update" });
      if (query.table === "luma_event_links" && query.operation === "select") {
        return ok([{ id: "link-existing", chapter_id: enabledEnv.MYMEDLIFE_LUMA_CHAPTER_ID, chapter_event_id: "event-existing" }]);
      }
      return ok([]);
    });

    const result = await runLumaEventSync("admin-1", "reconcile", {
      env: enabledEnv,
      appClient: appClient as never,
      lumaClient: { readEvents: async () => [mappedLumaEvent()] },
      now: () => new Date("2026-07-20T03:00:00.000Z"),
    });

    expect(result).toMatchObject({
      success: true,
      code: "luma_sync_succeeded",
      counts: { materializedEvents: 0, updatedEvents: 1 },
    });
    expect(queries.some((query) => query.table === "chapter_events" && query.operation === "insert")).toBe(false);
    expect(queries).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: "chapter_events", operation: "update" }),
      expect.objectContaining({ table: "luma_event_links", operation: "update" }),
    ]));
    const eventUpdate = queries.find((query) => query.table === "chapter_events" && query.operation === "update");
    expect(eventUpdate?.payload).not.toHaveProperty("promotion_summary");
  });

  it("records provider failures and cross-chapter link conflicts without provider writes", async () => {
    const failureQueries: FakeQuery[] = [];
    const failingClient = createFakeAppClient((query) => {
      failureQueries.push(query);
      if (query.table === "staff_role_assignments") return ok([{ role_key: "ds_admin" }]);
      if (query.table === "chapters" && query.operation === "select") return ok([{ id: enabledEnv.MYMEDLIFE_LUMA_CHAPTER_ID }]);
      if (query.table === "luma_sync_runs" && query.operation === "select") return ok([]);
      if (query.table === "luma_sync_runs" && query.operation === "insert") return ok({ id: "run-failed" });
      return ok([]);
    });
    const failedResult = await runLumaEventSync("admin-1", "backfill", {
      env: enabledEnv,
      appClient: failingClient as never,
      lumaClient: { readEvents: async () => { throw new Error("provider unavailable"); } },
      now: () => new Date("2026-07-20T04:00:00.000Z"),
    });
    expect(failedResult).toMatchObject({ success: false, code: "server_error", runId: "run-failed" });
    expect(failureQueries).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: "luma_sync_failures", operation: "insert" }),
    ]));

    const conflictClient = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") return ok([{ role_key: "ds_admin" }]);
      if (query.table === "chapters" && query.operation === "select") return ok([{ id: enabledEnv.MYMEDLIFE_LUMA_CHAPTER_ID }]);
      if (query.table === "luma_sync_runs" && query.operation === "select") return ok([]);
      if (query.table === "luma_sync_runs" && query.operation === "insert") return ok({ id: "run-conflict" });
      if (query.table === "luma_event_links" && query.operation === "select") {
        return ok([{ id: "link-other", chapter_id: "chapter-other", chapter_event_id: "event-other" }]);
      }
      return ok([]);
    });
    const conflictResult = await runLumaEventSync("admin-1", "backfill", {
      env: enabledEnv,
      appClient: conflictClient as never,
      lumaClient: { readEvents: async () => [mappedLumaEvent()] },
      now: () => new Date("2026-07-20T05:00:00.000Z"),
    });
    expect(conflictResult).toMatchObject({
      success: true,
      code: "luma_sync_partial",
      counts: { conflicts: 1, materializedEvents: 0 },
    });
  });

  it("fails closed when chapter, recovery, lock, or run creation cannot be verified", async () => {
    const scenarios = [
      {
        name: "missing chapter",
        handler: (query: FakeQuery) => query.table === "staff_role_assignments"
          ? ok([{ role_key: "ds_admin" }])
          : ok([]),
        code: "server_error",
      },
      {
        name: "stale recovery failure",
        handler: (query: FakeQuery) => {
          if (query.table === "staff_role_assignments") return ok([{ role_key: "ds_admin" }]);
          if (query.table === "chapters") return ok([{ id: enabledEnv.MYMEDLIFE_LUMA_CHAPTER_ID }]);
          if (query.table === "luma_sync_runs" && query.operation === "update") return failed("recovery failed");
          return ok([]);
        },
        code: "server_error",
      },
      {
        name: "lock lookup failure",
        handler: (query: FakeQuery) => {
          if (query.table === "staff_role_assignments") return ok([{ role_key: "ds_admin" }]);
          if (query.table === "chapters") return ok([{ id: enabledEnv.MYMEDLIFE_LUMA_CHAPTER_ID }]);
          if (query.table === "luma_sync_runs" && query.operation === "select") return failed("lock failed");
          return ok([]);
        },
        code: "server_error",
      },
      {
        name: "run insert conflict",
        handler: (query: FakeQuery) => {
          if (query.table === "staff_role_assignments") return ok([{ role_key: "ds_admin" }]);
          if (query.table === "chapters") return ok([{ id: enabledEnv.MYMEDLIFE_LUMA_CHAPTER_ID }]);
          if (query.table === "luma_sync_runs" && query.operation === "insert") return failed("duplicate key", "23505");
          return ok([]);
        },
        code: "sync_already_running",
      },
      {
        name: "run insert failure",
        handler: (query: FakeQuery) => {
          if (query.table === "staff_role_assignments") return ok([{ role_key: "ds_admin" }]);
          if (query.table === "chapters") return ok([{ id: enabledEnv.MYMEDLIFE_LUMA_CHAPTER_ID }]);
          if (query.table === "luma_sync_runs" && query.operation === "insert") return failed("insert failed");
          return ok([]);
        },
        code: "server_error",
      },
    ] as const;

    for (const scenario of scenarios) {
      const result = await runLumaEventSync("admin-1", "reconcile", {
        env: enabledEnv,
        appClient: createFakeAppClient(scenario.handler) as never,
        lumaClient: { readEvents: async () => [] },
        now: () => new Date("2026-07-20T06:00:00.000Z"),
      });
      expect(result, scenario.name).toMatchObject({ success: false, code: scenario.code });
    }
  });

  it.each([
    ["source staging", "luma_event_imports", "upsert"],
    ["provider-link lookup", "luma_event_links", "select"],
    ["chapter-event creation", "chapter_events", "insert"],
    ["provider-link creation", "luma_event_links", "insert"],
    ["chapter-event backlink", "chapter_events", "update"],
    ["materialization marker", "luma_event_imports", "update"],
    ["audit record", "audit_logs", "insert"],
  ] as const)("surfaces %s persistence failures as partial reconciliation", async (_label, table, operation) => {
    const appClient = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") return ok([{ role_key: "ds_admin" }]);
      if (query.table === "chapters" && query.operation === "select") return ok([{ id: enabledEnv.MYMEDLIFE_LUMA_CHAPTER_ID }]);
      if (query.table === "luma_sync_runs" && query.operation === "select") return ok([]);
      if (query.table === "luma_sync_runs" && query.operation === "insert") return ok({ id: "run-fault" });
      if (query.table === table && query.operation === operation) return failed(`${table} ${operation} failed`);
      if (query.table === "luma_event_links" && query.operation === "select") return ok([]);
      if (query.table === "chapter_events" && query.operation === "insert") return ok({ id: "event-fault" });
      if (query.table === "luma_event_links" && query.operation === "insert") return ok({ id: "link-fault" });
      return ok([]);
    });

    const result = await runLumaEventSync("admin-1", "backfill", {
      env: enabledEnv,
      appClient: appClient as never,
      lumaClient: { readEvents: async () => [mappedLumaEvent()] },
      now: () => new Date("2026-07-20T07:00:00.000Z"),
    });

    expect(result).toMatchObject({ success: true, code: "luma_sync_partial" });
    if (result.success) expect(result.counts.failures).toBeGreaterThan(0);
  });

  it("keeps mappings, snapshots, locks, failures, and admin-only RLS in the migration", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260720014500_luma_event_ingestion_foundation.sql"),
      "utf8",
    );
    expect(sql).toContain("create table app.chapter_luma_calendars");
    expect(sql).toContain("create table app.luma_sync_runs");
    expect(sql).toContain("create table app.luma_event_imports");
    expect(sql).toContain("create table app.luma_sync_failures");
    expect(sql).toContain("luma_sync_runs_one_running");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("using (app.is_ds_admin())");
    expect(sql).not.toContain("LUMA_API_KEY");
  });
});

function lumaEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt-one",
    calendar_id: "cal-production",
    name: "MEDLIFE Community Night",
    url: "https://luma.com/evt-one",
    start_at: "2026-08-01T22:00:00.000Z",
    end_at: "2026-08-02T00:00:00.000Z",
    created_at: "2026-07-18T00:00:00.000Z",
    timezone: "America/New_York",
    visibility: "public",
    registration_open: true,
    geo_address_json: { address: "123 Main Street", full_address: "123 Main Street" },
    ...overrides,
  };
}

function mappedLumaEvent() {
  return {
    id: "evt-one",
    calendarId: "cal-production",
    name: "MEDLIFE Community Night",
    url: "https://luma.com/evt-one",
    startsAt: "2026-08-01T22:00:00.000Z",
    endsAt: "2026-08-02T00:00:00.000Z",
    timezone: "America/New_York",
    locationLabel: "123 Main Street",
    visibility: "public",
    registrationOpen: true,
    createdAt: "2026-07-18T00:00:00.000Z",
    source: lumaEvent(),
  };
}

function jsonResponse(value: unknown) {
  return new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
}

type FakeResult = { data: unknown; error: { message: string; code?: string } | null; count?: number | null };

class FakeQuery {
  operation = "select";
  payload: unknown = null;
  filters: Array<{ column: string; value: unknown }> = [];

  constructor(readonly table: string, private readonly handler: (query: FakeQuery) => FakeResult) {}

  select() { return this; }
  insert(payload: unknown) { this.operation = "insert"; this.payload = payload; return this; }
  update(payload: unknown) { this.operation = "update"; this.payload = payload; return this; }
  upsert(payload: unknown) { this.operation = "upsert"; this.payload = payload; return this; }
  eq(column: string, value: unknown) { this.filters.push({ column, value }); return this; }
  is(column: string, value: unknown) { this.filters.push({ column, value }); return this; }
  lt(column: string, value: unknown) { this.filters.push({ column, value }); return this; }
  order() { return this; }
  limit() { return this; }
  single() { return Promise.resolve(this.handler(this)); }
  then(resolve: (value: FakeResult) => unknown, reject?: (reason: unknown) => unknown) {
    return Promise.resolve(this.handler(this)).then(resolve, reject);
  }
}

function createFakeAppClient(handler: (query: FakeQuery) => FakeResult) {
  return { schema: () => ({ from: (table: string) => new FakeQuery(table, handler) }) };
}

function ok(data: unknown): FakeResult {
  return { data, error: null };
}

function failed(message: string, code?: string): FakeResult {
  return { data: null, error: { message, code } };
}
