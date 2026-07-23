import { describe, expect, it } from "vitest";

import { getAdminDatabricksExportWorkspace } from "@/services/admin-databricks-export-workspace";

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

const exportConfig = {
  enabled: true,
  environment: "production" as const,
  host: "https://dbc-example.cloud.databricks.com",
  warehouseId: "warehouse-1",
  catalog: "mymedlife",
  schema: "analytics",
  table: "event_metrics",
  targetTable: "mymedlife.analytics.event_metrics",
  reason: "Enabled.",
};

describe("admin Databricks export workspace", () => {
  it("returns database-backed counts, latest run, and unresolved failures", async () => {
    const client = createFakeAppClient((query) => {
      if (query.table === "warehouse_export_failures") {
        return result([{
          id: "failure-1",
          run_id: "run-1",
          error_code: "databricks_export_partial",
          error_message: "Audit checkpoint needs replay",
          retry_count: 1,
          created_at: "2026-07-23T18:05:00.000Z",
          warehouse_export_runs: { mode: "backfill" },
        }], 1);
      }
      const status = query.filters.find(
        (filter) => filter.column === "status",
      )?.value;
      if (query.head) {
        return result(
          [],
          status === "succeeded"
            ? 4
            : status === "partial"
              ? 1
              : status === "failed"
                ? 2
                : 7,
        );
      }
      return result([{
        id: "run-1",
        mode: "backfill",
        status: "partial",
        trigger_source: "manual",
        retry_of_run_id: null,
        batch_key: "batch-1",
        checkpoint_before: null,
        checkpoint_after: null,
        source_row_count: 12,
        exported_row_count: 12,
        statement_id: "statement-1",
        statement_ids: ["statement-1"],
        started_at: "2026-07-23T18:00:00.000Z",
        completed_at: "2026-07-23T18:05:00.000Z",
        error_summary: "Audit checkpoint needs replay",
      }]);
    });

    const workspace = await getAdminDatabricksExportWorkspace({
      getConfig: () => exportConfig,
      createServerClient: async () => ({
        client: client as never,
        config: authConfig,
      }),
    });

    expect(workspace).toMatchObject({
      canRead: true,
      counts: {
        totalRuns: 7,
        succeededRuns: 4,
        partialRuns: 1,
        failedRuns: 2,
        openFailures: 1,
      },
      lastRun: {
        statementIds: ["statement-1"],
        id: "run-1",
        mode: "backfill",
        status: "partial",
        sourceRows: 12,
        exportedRows: 12,
      },
      failures: [{
        runId: "run-1",
        mode: "backfill",
        code: "databricks_export_partial",
      }],
    });
  });

  it("fails closed when auth or database readback is unavailable", async () => {
    const noAuth = await getAdminDatabricksExportWorkspace({
      getConfig: () => ({ ...exportConfig, enabled: false }),
      createServerClient: async () => ({
        client: null,
        config: { ...authConfig, reason: "Auth unavailable." },
      }),
    });
    expect(noAuth).toMatchObject({
      canRead: false,
      message: "Auth unavailable.",
    });

    const failedClient = createFakeAppClient((query) =>
      query.table === "warehouse_export_failures"
        ? failed("readback query failed")
        : result([], 0)
    );
    const failedReadback = await getAdminDatabricksExportWorkspace({
      getConfig: () => exportConfig,
      createServerClient: async () => ({
        client: failedClient as never,
        config: authConfig,
      }),
    });
    expect(failedReadback).toMatchObject({
      canRead: false,
      message: "Databricks export readback is unavailable: readback query failed",
    });
  });

  it("keeps an honest zero state when no export has run", async () => {
    const client = createFakeAppClient(() => result([], 0));
    const workspace = await getAdminDatabricksExportWorkspace({
      getConfig: () => ({ ...exportConfig, enabled: false, reason: "Disabled." }),
      createServerClient: async () => ({
        client: client as never,
        config: authConfig,
      }),
    });
    expect(workspace).toMatchObject({
      canRead: true,
      counts: {
        totalRuns: 0,
        succeededRuns: 0,
        partialRuns: 0,
        failedRuns: 0,
        openFailures: 0,
      },
      lastRun: null,
      failures: [],
      message: "Disabled.",
    });
  });
});

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
  count: number | null;
};

class FakeQuery {
  readonly filters: Array<{ column: string; value: unknown }> = [];
  head = false;

  constructor(
    readonly table: string,
    private readonly handler: (query: FakeQuery) => QueryResult,
  ) {}

  select(_columns?: string, options?: { head?: boolean }) {
    this.head = options?.head ?? false;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  order() {
    return this;
  }

  limit() {
    return this;
  }

  then(
    resolve: (value: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) {
    return Promise.resolve(this.handler(this)).then(resolve, reject);
  }
}

function createFakeAppClient(handler: (query: FakeQuery) => QueryResult) {
  return {
    schema: () => ({
      from: (table: string) => new FakeQuery(table, handler),
    }),
  };
}

function result(data: unknown, count: number | null = 0): QueryResult {
  return { data, count, error: null };
}

function failed(message: string): QueryResult {
  return { data: null, count: null, error: { message } };
}
