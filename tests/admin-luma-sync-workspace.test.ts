import { describe, expect, it } from "vitest";

import { getAdminLumaSyncWorkspace } from "@/services/admin-luma-sync-workspace";

const authConfig = {
  enabled: true,
  mode: "production_supabase",
  environment: "production",
  url: "https://example.supabase.co",
  anonKey: "browser-key",
  isLocalOnly: false,
  isHostedStaging: false,
  reason: "Auth enabled.",
} as const;

describe("admin Luma sync workspace", () => {
  it("returns database-backed counts, latest run, and unresolved failures", async () => {
    const client = createFakeAppClient((query) => {
      if (query.table === "luma_sync_runs") return result([{
        id: "run-1",
        mode: "reconcile",
        status: "partial",
        trigger_source: "scheduled",
        retry_of_run_id: null,
        calendar_id: "cal-1",
        chapter_id: "chapter-1",
        started_at: "2026-07-20T01:00:00.000Z",
        completed_at: "2026-07-20T01:05:00.000Z",
        heartbeat_at: "2026-07-20T01:05:00.000Z",
        source_event_count: 10,
        materialized_event_count: 4,
        updated_event_count: 5,
        conflict_count: 1,
        failure_count: 1,
      }]);
      if (query.table === "chapter_luma_calendars") return result([], 1);
      if (query.table === "luma_sync_failures") return result([{
        id: "failure-1",
        object_type: "event",
        external_id: "evt-1",
        error_code: "calendar_mismatch",
        error_message: "Needs review",
        retry_count: 0,
        created_at: "2026-07-20T01:04:00.000Z",
      }], 1);
      const status = query.filters.find((filter) => filter.column === "reconciliation_status")?.value;
      return result([], status === "materialized" ? 8 : status === "conflict" ? 1 : 10);
    });

    const workspace = await getAdminLumaSyncWorkspace({
      getSyncConfig: () => ({
        enabled: true,
        environment: "production",
        chapterId: "chapter-1",
        calendarId: "cal-1",
        calendarLabel: "Pilot calendar",
        reason: "Enabled.",
      }),
      createServerClient: async () => ({ client: client as never, config: authConfig }),
    });

    expect(workspace).toMatchObject({
      canRead: true,
      lastRun: {
        id: "run-1",
        status: "partial",
        triggerSource: "scheduled",
        sourceEvents: 10,
        materializedEvents: 4,
        updatedEvents: 5,
      },
      counts: { calendars: 1, importedEvents: 10, materializedEvents: 8, conflicts: 1, openFailures: 1 },
      failures: [{ code: "calendar_mismatch", message: "Needs review" }],
    });
  });

  it("fails closed when auth or database readback is unavailable", async () => {
    const disabledConfig = () => ({
      enabled: false,
      environment: "production" as const,
      chapterId: null,
      calendarId: null,
      calendarLabel: null,
      reason: "Sync disabled.",
    });
    const unavailable = await getAdminLumaSyncWorkspace({
      getSyncConfig: disabledConfig,
      createServerClient: async () => ({ client: null, config: { ...authConfig, reason: "Auth unavailable." } }),
    });
    expect(unavailable).toMatchObject({ canRead: false, message: "Auth unavailable." });

    const failedClient = createFakeAppClient((query) => (
      query.table === "luma_event_imports" ? failed("readback query failed") : result([])
    ));
    const failedReadback = await getAdminLumaSyncWorkspace({
      getSyncConfig: disabledConfig,
      createServerClient: async () => ({ client: failedClient as never, config: authConfig }),
    });
    expect(failedReadback).toMatchObject({
      canRead: false,
      message: "Luma sync readback is unavailable: readback query failed",
    });
  });

  it("keeps honest zero states when no sync has run", async () => {
    const client = createFakeAppClient(() => result(null, null));
    const workspace = await getAdminLumaSyncWorkspace({
      getSyncConfig: () => ({
        enabled: false,
        environment: "production",
        chapterId: null,
        calendarId: null,
        calendarLabel: null,
        reason: "Sync disabled.",
      }),
      createServerClient: async () => ({ client: client as never, config: authConfig }),
    });
    expect(workspace).toMatchObject({
      canRead: true,
      lastRun: null,
      counts: { calendars: 0, importedEvents: 0, materializedEvents: 0, conflicts: 0, openFailures: 0 },
      failures: [],
      message: "Sync disabled.",
    });
  });
});

type QueryResult = { data: unknown; error: { message: string } | null; count: number | null };

class FakeQuery {
  readonly filters: Array<{ column: string; value: unknown }> = [];
  constructor(readonly table: string, private readonly handler: (query: FakeQuery) => QueryResult) {}
  select() { return this; }
  eq(column: string, value: unknown) { this.filters.push({ column, value }); return this; }
  is(column: string, value: unknown) { this.filters.push({ column, value }); return this; }
  order() { return this; }
  limit() { return this; }
  then(resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) {
    return Promise.resolve(this.handler(this)).then(resolve, reject);
  }
}

function createFakeAppClient(handler: (query: FakeQuery) => QueryResult) {
  return { schema: () => ({ from: (table: string) => new FakeQuery(table, handler) }) };
}

function result(data: unknown, count: number | null = 0): QueryResult {
  return { data, count, error: null };
}

function failed(message: string): QueryResult {
  return { data: null, count: null, error: { message } };
}
