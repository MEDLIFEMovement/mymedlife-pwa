import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  createDatabricksEventMetricsClient,
  getDatabricksEventMetricsExportConfig,
  runDatabricksEventMetricsExport,
} from "@/services/databricks-event-metrics-export";

const enabledEnv = {
  MYMEDLIFE_AUTH_MODE: "production_supabase",
  MYMEDLIFE_ENABLE_DATABRICKS_EVENT_METRICS_EXPORT: "true",
  MYMEDLIFE_ALLOW_PRODUCTION_DATABRICKS_EVENT_METRICS_EXPORT: "true",
  DATABRICKS_HOST: "https://dbc-example.cloud.databricks.com",
  DATABRICKS_TOKEN: "server-only-databricks-token",
  DATABRICKS_SQL_WAREHOUSE_ID: "warehouse-1",
  DATABRICKS_CATALOG: "mymedlife",
  DATABRICKS_SCHEMA: "analytics",
  DATABRICKS_EVENT_METRICS_TABLE: "event_metrics",
  SUPABASE_SERVICE_ROLE_KEY: "server-only-service-key",
  SUPABASE_URL: "https://example.supabase.co",
};

describe("Databricks event metrics export", () => {
  it("requires server-only credentials, safe identifiers, and explicit environment approval", () => {
    expect(getDatabricksEventMetricsExportConfig({
      ...enabledEnv,
      MYMEDLIFE_ENABLE_DATABRICKS_EVENT_METRICS_EXPORT: undefined,
    })).toMatchObject({
      enabled: false,
      environment: "production",
    });
    expect(getDatabricksEventMetricsExportConfig({
      ...enabledEnv,
      DATABRICKS_TOKEN: undefined,
    })).toMatchObject({
      enabled: false,
      reason:
        "Databricks export is disabled because its server-only host, token, or SQL warehouse is missing.",
    });
    expect(getDatabricksEventMetricsExportConfig({
      ...enabledEnv,
      DATABRICKS_CATALOG: "unsafe-name",
    })).toMatchObject({
      enabled: false,
      targetTable: null,
    });
    expect(getDatabricksEventMetricsExportConfig({
      ...enabledEnv,
      DATABRICKS_EVENT_METRICS_TABLE: undefined,
    })).toMatchObject({
      enabled: false,
      table: null,
      targetTable: null,
      reason:
        "Databricks export is disabled until safe catalog, schema, and table identifiers are configured.",
    });
    expect(getDatabricksEventMetricsExportConfig({
      ...enabledEnv,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    })).toMatchObject({
      enabled: false,
      reason:
        "Databricks export is disabled because the server-only Supabase client is incomplete.",
    });
    expect(getDatabricksEventMetricsExportConfig({
      ...enabledEnv,
      DATABRICKS_HOST: "https://example.com",
    })).toMatchObject({
      enabled: false,
      host: null,
    });
    expect(getDatabricksEventMetricsExportConfig({
      ...enabledEnv,
      MYMEDLIFE_ALLOW_PRODUCTION_DATABRICKS_EVENT_METRICS_EXPORT: undefined,
    })).toMatchObject({
      enabled: false,
      reason:
        "Production Databricks export is disabled until its explicit environment approval flag is enabled.",
    });
    expect(getDatabricksEventMetricsExportConfig(enabledEnv)).toMatchObject({
      enabled: true,
      targetTable: "mymedlife.analytics.event_metrics",
    });
    expect(getDatabricksEventMetricsExportConfig({
      ...enabledEnv,
      MYMEDLIFE_AUTH_MODE: "staging_supabase",
      MYMEDLIFE_ALLOW_PRODUCTION_DATABRICKS_EVENT_METRICS_EXPORT: undefined,
      MYMEDLIFE_ALLOW_STAGING_DATABRICKS_EVENT_METRICS_EXPORT: "true",
    })).toMatchObject({ enabled: true, environment: "staging" });
    expect(getDatabricksEventMetricsExportConfig({
      ...enabledEnv,
      MYMEDLIFE_AUTH_MODE: undefined,
      MYMEDLIFE_ALLOW_PRODUCTION_DATABRICKS_EVENT_METRICS_EXPORT: undefined,
      MYMEDLIFE_ALLOW_LOCAL_DATABRICKS_EVENT_METRICS_EXPORT: "true",
    })).toMatchObject({ enabled: true, environment: "local" });
    expect(getDatabricksEventMetricsExportConfig({
      ...enabledEnv,
      DATABRICKS_HOST: "https://%",
    })).toMatchObject({ enabled: false, host: null });
    expect(createDatabricksEventMetricsClient({
      ...enabledEnv,
      MYMEDLIFE_ENABLE_DATABRICKS_EVENT_METRICS_EXPORT: "false",
    })).toBeNull();
  });

  it("creates the Delta read model and merges a parameterized aggregate payload", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        statement_id: "10000000-0000-4000-8000-000000000001",
        status: { state: "SUCCEEDED" },
      }))
      .mockResolvedValueOnce(jsonResponse({
        statement_id: "10000000-0000-4000-8000-000000000002",
        status: { state: "SUCCEEDED" },
      }));
    const client = createDatabricksEventMetricsClient(enabledEnv, {
      fetchImpl: fetchMock,
    });

    await expect(client?.upsertEventMetrics({
      rows: [exportMetric()],
      batchKey: "batch-1",
      exportedAt: "2026-07-23T18:00:00.000Z",
    })).resolves.toEqual({
      statementId: "10000000-0000-4000-8000-000000000002",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const createBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const mergeBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(createBody.statement).toContain(
      "create table if not exists identifier(:target_table)",
    );
    expect(mergeBody.statement).toContain(
      "merge into identifier(:target_table)",
    );
    expect(mergeBody.statement).toContain("from_json");
    expect(mergeBody.statement).toContain(
      "target.current_rsvp_count = source.current_rsvp_count",
    );
    expect(mergeBody.statement).not.toMatch(/update set \*|insert \*/);
    expect(mergeBody.parameters).toEqual(expect.arrayContaining([
      {
        name: "target_table",
        value: "mymedlife.analytics.event_metrics",
      },
      { name: "batch_key", value: "batch-1" },
    ]));
    const payload = String(
      mergeBody.parameters.find(
        (parameter: { name: string }) => parameter.name === "payload_json",
      )?.value,
    );
    expect(JSON.parse(payload)).toEqual([
      expect.objectContaining({
        event_id: "10000000-0000-4000-8000-000000000010",
        current_rsvp_count: 4,
        attendance_count: 3,
        attendance_points_awarded: 30,
      }),
    ]);
    expect(payload).not.toMatch(/email|display_name|user_id/i);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: {
        authorization: "Bearer server-only-databricks-token",
        "content-type": "application/json",
      },
      cache: "no-store",
    });

    await expect(client?.upsertEventMetrics({
      rows: Array.from({ length: 501 }, () => exportMetric()),
      batchKey: "batch-too-large",
      exportedAt: "2026-07-23T18:00:00.000Z",
    })).rejects.toThrow(
      "Databricks export batches cannot exceed 500 rows.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("polls asynchronous statements and reports terminal provider failures without response-body leakage", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        statement_id: "10000000-0000-4000-8000-000000000011",
        status: { state: "PENDING" },
      }))
      .mockResolvedValueOnce(jsonResponse({
        statement_id: "10000000-0000-4000-8000-000000000011",
        status: { state: "SUCCEEDED" },
      }))
      .mockResolvedValueOnce(jsonResponse({
        statement_id: "10000000-0000-4000-8000-000000000012",
        status: { state: "FAILED", error: { error_code: "TABLE_OR_VIEW_NOT_FOUND" } },
      }));
    const client = createDatabricksEventMetricsClient(enabledEnv, {
      fetchImpl: fetchMock,
      waitImpl: async () => undefined,
    });

    await expect(client?.upsertEventMetrics({
      rows: [exportMetric()],
      batchKey: "batch-2",
      exportedAt: "2026-07-23T18:00:00.000Z",
    })).rejects.toThrow(
      "Databricks statement failed (TABLE_OR_VIEW_NOT_FOUND).",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://dbc-example.cloud.databricks.com/api/2.0/sql/statements/10000000-0000-4000-8000-000000000011",
    );

    const rejectedClient = createDatabricksEventMetricsClient(enabledEnv, {
      fetchImpl: vi.fn().mockResolvedValue(
        new Response("private provider response", { status: 400 }),
      ),
    });
    await expect(rejectedClient?.upsertEventMetrics({
      rows: [exportMetric()],
      batchKey: "batch-3",
      exportedAt: "2026-07-23T18:00:00.000Z",
    })).rejects.toThrow("Databricks request failed (400).");
  });

  it("retries transient network failures without exposing provider details", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error("socket contained private details"))
      .mockResolvedValueOnce(jsonResponse({
        statement_id: "10000000-0000-4000-8000-000000000021",
        status: { state: "SUCCEEDED" },
      }))
      .mockResolvedValueOnce(jsonResponse({
        statement_id: "10000000-0000-4000-8000-000000000022",
        status: { state: "SUCCEEDED" },
      }));
    const client = createDatabricksEventMetricsClient(enabledEnv, {
      fetchImpl: fetchMock,
      waitImpl: async () => undefined,
    });

    await expect(client?.upsertEventMetrics({
      rows: [exportMetric()],
      batchKey: "batch-retry",
      exportedAt: "2026-07-23T18:00:00.000Z",
    })).resolves.toEqual({
      statementId: "10000000-0000-4000-8000-000000000022",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const rejected = createDatabricksEventMetricsClient(enabledEnv, {
      fetchImpl: vi.fn().mockRejectedValue(new Error("private network detail")),
      waitImpl: async () => undefined,
    });
    await expect(rejected?.upsertEventMetrics({
      rows: [exportMetric()],
      batchKey: "batch-network-failure",
      exportedAt: "2026-07-23T18:00:00.000Z",
    })).rejects.toThrow("Databricks request failed after network retries.");
  });

  it("retries provider throttling and fails closed for invalid or unfinished statements", async () => {
    const throttledFetch = vi.fn()
      .mockResolvedValueOnce(new Response("busy", {
        status: 429,
        headers: { "retry-after": "0" },
      }))
      .mockResolvedValueOnce(jsonResponse({
        statement_id: "10000000-0000-4000-8000-000000000081",
        status: { state: "SUCCEEDED" },
      }))
      .mockResolvedValueOnce(jsonResponse({
        statement_id: "10000000-0000-4000-8000-000000000082",
        status: { state: "SUCCEEDED" },
      }));
    const throttled = createDatabricksEventMetricsClient(enabledEnv, {
      fetchImpl: throttledFetch,
      waitImpl: async () => undefined,
    });
    await expect(throttled?.upsertEventMetrics({
      rows: [exportMetric()],
      batchKey: "batch-throttled",
      exportedAt: "2026-07-23T18:00:00.000Z",
    })).resolves.toEqual({
      statementId: "10000000-0000-4000-8000-000000000082",
    });
    expect(throttledFetch).toHaveBeenCalledTimes(3);

    const invalidStatement = createDatabricksEventMetricsClient(enabledEnv, {
      fetchImpl: vi.fn().mockResolvedValue(jsonResponse({
        statement_id: "private invalid statement",
        status: { state: "SUCCEEDED" },
      })),
      waitImpl: async () => undefined,
    });
    await expect(invalidStatement?.upsertEventMetrics({
      rows: [exportMetric()],
      batchKey: "batch-invalid-statement",
      exportedAt: "2026-07-23T18:00:00.000Z",
    })).rejects.toThrow("Databricks did not return a valid statement id.");

    const unfinished = createDatabricksEventMetricsClient(enabledEnv, {
      fetchImpl: vi.fn().mockImplementation(async () => jsonResponse({
        statement_id: "10000000-0000-4000-8000-000000000083",
        status: { state: "PENDING" },
      })),
      waitImpl: async () => undefined,
    });
    await expect(unfinished?.upsertEventMetrics({
      rows: [exportMetric()],
      batchKey: "batch-timeout",
      exportedAt: "2026-07-23T18:00:00.000Z",
    })).rejects.toThrow(
      "Databricks statement did not finish before the export timeout.",
    );
  });

  it("exports one validated app-owned aggregate snapshot with audit and checkpoint readback", async () => {
    const queries: FakeQuery[] = [];
    const rpc = vi.fn().mockResolvedValue({
      data: [metricRow({
        event_id: "10000000-0000-4000-8000-000000000010",
        chapter_id: "10000000-0000-4000-8000-000000000020",
      })],
      error: null,
    });
    const appClient = createFakeAppClient((query) => {
      queries.push(query);
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "ds_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "select"
      ) {
        return ok([]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "insert"
      ) {
        return ok({ id: "10000000-0000-4000-8000-000000000030" });
      }
      return ok([]);
    }, rpc);
    const upsertEventMetrics = vi.fn().mockResolvedValue({
      statementId: "10000000-0000-4000-8000-000000000040",
    });

    const result = await runDatabricksEventMetricsExport(
      "10000000-0000-4000-8000-000000000050",
      "backfill",
      {
        env: enabledEnv,
        appClient: appClient as never,
        databricksClient: { upsertEventMetrics },
        batchKey: "batch-backfill",
        now: () => new Date("2026-07-23T18:00:00.000Z"),
      },
    );

    expect(result).toMatchObject({
      success: true,
      code: "databricks_export_succeeded",
      runId: "10000000-0000-4000-8000-000000000030",
      batchKey: "batch-backfill",
      sourceRows: 1,
      exportedRows: 1,
    });
    expect(rpc).toHaveBeenCalledWith(
      "get_databricks_event_metrics_export",
      {
        checkpoint_before_input: null,
        checkpoint_through_input: "2026-07-23T18:00:00.000Z",
        cursor_updated_at_input: null,
        cursor_event_id_input: null,
        page_size_input: 500,
      },
    );
    expect(upsertEventMetrics).toHaveBeenCalledWith({
      rows: [expect.objectContaining({
        eventId: "10000000-0000-4000-8000-000000000010",
        chapterId: "10000000-0000-4000-8000-000000000020",
      })],
      batchKey: "batch-backfill",
      exportedAt: "2026-07-23T18:00:00.000Z",
    });
    const audit = queries.find(
      (query) => query.table === "audit_logs" && query.operation === "insert",
    );
    expect(audit?.payload).toMatchObject({
      action: "databricks_event_metrics_exported",
      after_value: expect.objectContaining({
        batch_key: "batch-backfill",
        destination: "databricks",
        source_row_count: 1,
      }),
    });
    expect(JSON.stringify(
      (audit?.payload as { after_value?: unknown })?.after_value,
    )).not.toMatch(
      /email|display_name|user_id/i,
    );
    const abandonedRunRecovery = queries.find(
      (query) =>
        query.table === "warehouse_export_runs" &&
        query.operation === "update" &&
        (query.payload as { error_summary?: string }).error_summary?.startsWith(
          "Recovered abandoned",
        ),
    );
    expect(abandonedRunRecovery?.filters).toEqual(expect.arrayContaining([
      { column: "status", value: "running" },
      { column: "destination", value: "databricks" },
      { column: "dataset", value: "event_metrics" },
    ]));
  });

  it("uses the last successful checkpoint and skips Databricks when nothing changed", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const appClient = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "super_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "select"
      ) {
        return query.filters.some(
          (filter) => filter.column === "status" && filter.value === "succeeded",
        )
          ? ok([{ checkpoint_after: "2026-07-22T18:00:00.000Z" }])
          : ok([]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "insert"
      ) {
        return ok({ id: "10000000-0000-4000-8000-000000000031" });
      }
      return ok([]);
    }, rpc);
    const upsertEventMetrics = vi.fn();

    const result = await runDatabricksEventMetricsExport(
      "10000000-0000-4000-8000-000000000051",
      "incremental",
      {
        env: enabledEnv,
        appClient: appClient as never,
        databricksClient: { upsertEventMetrics },
        batchKey: "batch-incremental",
        now: () => new Date("2026-07-23T18:00:00.000Z"),
      },
    );

    expect(result).toMatchObject({
      success: true,
      sourceRows: 0,
      exportedRows: 0,
    });
    expect(rpc).toHaveBeenCalledWith(
      "get_databricks_event_metrics_export",
      {
        checkpoint_before_input: "2026-07-22T18:00:00.000Z",
        checkpoint_through_input: "2026-07-23T18:00:00.000Z",
        cursor_updated_at_input: null,
        cursor_event_id_input: null,
        page_size_input: 500,
      },
    );
    expect(upsertEventMetrics).not.toHaveBeenCalled();
  });

  it("exports stable keyset pages instead of failing when more than 1,000 events are in scope", async () => {
    const rows = Array.from({ length: 1_001 }, (_, index) =>
      metricRow({
        event_id:
          `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        source_updated_at: new Date(
          Date.UTC(2026, 6, 22, 0, 0, index),
        ).toISOString(),
      }));
    const rpc = vi.fn()
      .mockResolvedValueOnce({ data: rows.slice(0, 500), error: null })
      .mockResolvedValueOnce({ data: rows.slice(500, 1_000), error: null })
      .mockResolvedValueOnce({ data: rows.slice(1_000), error: null });
    const appClient = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "ds_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "select"
      ) {
        return ok([]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "insert"
      ) {
        return ok({ id: "10000000-0000-4000-8000-000000000035" });
      }
      return ok([]);
    }, rpc);
    const upsertEventMetrics = vi.fn()
      .mockResolvedValueOnce({
        statementId: "10000000-0000-4000-8000-000000000071",
      })
      .mockResolvedValueOnce({
        statementId: "10000000-0000-4000-8000-000000000072",
      })
      .mockResolvedValueOnce({
        statementId: "10000000-0000-4000-8000-000000000073",
      });

    const result = await runDatabricksEventMetricsExport(
      "10000000-0000-4000-8000-000000000054",
      "backfill",
      {
        env: enabledEnv,
        appClient: appClient as never,
        databricksClient: { upsertEventMetrics },
        batchKey: "batch-paged-backfill",
        now: () => new Date("2026-07-23T18:00:00.000Z"),
      },
    );

    expect(result).toMatchObject({
      success: true,
      sourceRows: 1_001,
      exportedRows: 1_001,
    });
    expect(upsertEventMetrics).toHaveBeenCalledTimes(3);
    expect(upsertEventMetrics.mock.calls.map(([input]) => input.rows.length))
      .toEqual([500, 500, 1]);
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      "get_databricks_event_metrics_export",
      expect.objectContaining({
        cursor_updated_at_input: rows[499]?.source_updated_at,
        cursor_event_id_input: rows[499]?.event_id,
        checkpoint_through_input: "2026-07-23T18:00:00.000Z",
      }),
    );
    expect(rpc).toHaveBeenNthCalledWith(
      3,
      "get_databricks_event_metrics_export",
      expect.objectContaining({
        cursor_updated_at_input: rows[999]?.source_updated_at,
        cursor_event_id_input: rows[999]?.event_id,
      }),
    );
  });

  it("records a partial run with real exported counts when the app audit fails after Databricks accepts the batch", async () => {
    const queries: FakeQuery[] = [];
    const appClient = createFakeAppClient((query) => {
      queries.push(query);
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "ds_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "select"
      ) {
        return ok([]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "insert"
      ) {
        return ok({ id: "10000000-0000-4000-8000-000000000033" });
      }
      if (query.table === "audit_logs" && query.operation === "insert") {
        return {
          data: null,
          error: { message: "audit write unavailable" },
        };
      }
      return ok([]);
    }, vi.fn().mockResolvedValue({
      data: [metricRow()],
      error: null,
    }));

    const result = await runDatabricksEventMetricsExport(
      "10000000-0000-4000-8000-000000000052",
      "backfill",
      {
        env: enabledEnv,
        appClient: appClient as never,
        databricksClient: {
          upsertEventMetrics: vi.fn().mockResolvedValue({
            statementId: "10000000-0000-4000-8000-000000000041",
          }),
        },
        batchKey: "batch-partial",
        now: () => new Date("2026-07-23T18:00:00.000Z"),
      },
    );

    expect(result).toMatchObject({
      success: false,
      code: "server_error",
      runId: "10000000-0000-4000-8000-000000000033",
    });
    const finalUpdate = queries.findLast(
      (query) =>
        query.table === "warehouse_export_runs" &&
        query.operation === "update" &&
        (query.payload as { status?: string })?.status === "partial",
    );
    expect(finalUpdate?.payload).toMatchObject({
      status: "partial",
      source_row_count: 1,
      exported_row_count: 1,
      statement_id: "10000000-0000-4000-8000-000000000041",
      checkpoint_after: null,
    });
    const failure = queries.find(
      (query) =>
        query.table === "warehouse_export_failures" &&
        query.operation === "insert",
    );
    expect(failure?.payload).toMatchObject({
      error_code: "databricks_export_partial",
      source_payload: expect.objectContaining({
        source_row_count: 1,
        exported_row_count: 1,
      }),
    });
  });

  it("replays only failed or partial same-mode runs and increments attempt lineage", async () => {
    const queries: FakeQuery[] = [];
    const appClient = createFakeAppClient((query) => {
      queries.push(query);
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "super_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "select"
      ) {
        return query.filters.some(
          (filter) => filter.column === "id" && filter.value === "failed-run",
        )
          ? ok([{
            id: "failed-run",
            mode: "incremental",
            status: "partial",
            attempt: 3,
          }])
          : ok([]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "insert"
      ) {
        return ok({ id: "10000000-0000-4000-8000-000000000034" });
      }
      return ok([]);
    }, vi.fn().mockResolvedValue({ data: [], error: null }));

    const result = await runDatabricksEventMetricsExport(
      "10000000-0000-4000-8000-000000000053",
      "incremental",
      {
        env: enabledEnv,
        appClient: appClient as never,
        databricksClient: { upsertEventMetrics: vi.fn() },
        triggerSource: "replay",
        retryOfRunId: "failed-run",
        batchKey: "batch-replay",
        now: () => new Date("2026-07-23T18:00:00.000Z"),
      },
    );

    expect(result).toMatchObject({
      success: true,
      runId: "10000000-0000-4000-8000-000000000034",
    });
    const created = queries.find(
      (query) =>
        query.table === "warehouse_export_runs" &&
        query.operation === "insert",
    );
    expect(created?.payload).toMatchObject({
      trigger_source: "replay",
      retry_of_run_id: "failed-run",
      attempt: 4,
    });
    const resolved = queries.find(
      (query) =>
        query.table === "warehouse_export_failures" &&
        query.operation === "update",
    );
    expect(resolved?.filters).toEqual(expect.arrayContaining([
      { column: "run_id", value: "failed-run" },
      { column: "resolved_at", value: null },
    ]));
  });

  it("fails closed for unauthorized actors, lock conflicts, malformed snapshots, and provider failures", async () => {
    const nonAdmin = createFakeAppClient((query) =>
      query.table === "staff_role_assignments"
        ? ok([{ role_key: "general_member" }])
        : ok([]),
    );
    await expect(runDatabricksEventMetricsExport(
      "10000000-0000-4000-8000-000000000060",
      "backfill",
      {
        env: enabledEnv,
        appClient: nonAdmin as never,
        databricksClient: { upsertEventMetrics: vi.fn() },
      },
    )).resolves.toMatchObject({
      success: false,
      code: "permission_denied",
    });

    const locked = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "ds_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "select"
      ) {
        return ok([{ id: "running" }]);
      }
      return ok([]);
    });
    await expect(runDatabricksEventMetricsExport(
      "10000000-0000-4000-8000-000000000061",
      "backfill",
      {
        env: enabledEnv,
        appClient: locked as never,
        databricksClient: { upsertEventMetrics: vi.fn() },
      },
    )).resolves.toMatchObject({
      success: false,
      code: "export_already_running",
    });

    const failureQueries: FakeQuery[] = [];
    const failing = createFakeAppClient((query) => {
      failureQueries.push(query);
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "ds_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "select"
      ) {
        return ok([]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "insert"
      ) {
        return ok({ id: "10000000-0000-4000-8000-000000000032" });
      }
      return ok([]);
    }, vi.fn().mockResolvedValue({
      data: [metricRow({ attendance_count: -1 })],
      error: null,
    }));
    await expect(runDatabricksEventMetricsExport(
      "10000000-0000-4000-8000-000000000062",
      "backfill",
      {
        env: enabledEnv,
        appClient: failing as never,
        databricksClient: { upsertEventMetrics: vi.fn() },
        batchKey: "batch-malformed",
        now: () => new Date("2026-07-23T18:00:00.000Z"),
      },
    )).resolves.toMatchObject({
      success: false,
      code: "server_error",
      runId: "10000000-0000-4000-8000-000000000032",
    });
    expect(failureQueries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        table: "warehouse_export_failures",
        operation: "insert",
      }),
    ]));
  });

  it("fails closed for control-plane read, lock, checkpoint, replay, and run-creation errors", async () => {
    const databricksClient = { upsertEventMetrics: vi.fn() };

    await expect(runDatabricksEventMetricsExport(
      null,
      "backfill",
      {
        env: enabledEnv,
        appClient: createFakeAppClient(() => ok([])) as never,
        databricksClient,
      },
    )).resolves.toMatchObject({ success: false, code: "missing_auth" });
    await expect(runDatabricksEventMetricsExport(
      "actor-1",
      "incremental",
      {
        env: enabledEnv,
        appClient: createFakeAppClient(() => ok([])) as never,
        databricksClient,
        triggerSource: "replay",
      },
    )).resolves.toMatchObject({ success: false, code: "server_error" });

    const roleReadFailure = createFakeAppClient((query) =>
      query.table === "staff_role_assignments"
        ? failedResult("role read failed")
        : ok([])
    );
    await expect(runDatabricksEventMetricsExport(
      "actor-2",
      "backfill",
      {
        env: enabledEnv,
        appClient: roleReadFailure as never,
        databricksClient,
      },
    )).resolves.toMatchObject({ success: false, code: "server_error" });

    const recoveryFailure = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "ds_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "update"
      ) {
        return failedResult("recovery failed");
      }
      return ok([]);
    });
    await expect(runDatabricksEventMetricsExport(
      "actor-3",
      "backfill",
      {
        env: enabledEnv,
        appClient: recoveryFailure as never,
        databricksClient,
      },
    )).resolves.toMatchObject({ success: false, code: "server_error" });

    const lockReadFailure = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "ds_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "select"
      ) {
        return failedResult("lock read failed");
      }
      return ok([]);
    });
    await expect(runDatabricksEventMetricsExport(
      "actor-4",
      "backfill",
      {
        env: enabledEnv,
        appClient: lockReadFailure as never,
        databricksClient,
      },
    )).resolves.toMatchObject({ success: false, code: "server_error" });

    const replayReadFailure = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "super_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "select" &&
        query.filters.some((filter) => filter.column === "id")
      ) {
        return failedResult("replay read failed");
      }
      return ok([]);
    });
    await expect(runDatabricksEventMetricsExport(
      "actor-5",
      "incremental",
      {
        env: enabledEnv,
        appClient: replayReadFailure as never,
        databricksClient,
        triggerSource: "replay",
        retryOfRunId: "failed-run",
      },
    )).resolves.toMatchObject({ success: false, code: "server_error" });

    const invalidReplay = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "super_admin" }]);
      }
      return ok([]);
    });
    await expect(runDatabricksEventMetricsExport(
      "actor-6",
      "incremental",
      {
        env: enabledEnv,
        appClient: invalidReplay as never,
        databricksClient,
        triggerSource: "replay",
        retryOfRunId: "succeeded-run",
      },
    )).resolves.toMatchObject({ success: false, code: "server_error" });

    const checkpointFailure = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "ds_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "select" &&
        query.filters.some(
          (filter) => filter.column === "status" &&
            filter.value === "succeeded",
        )
      ) {
        return failedResult("checkpoint read failed");
      }
      return ok([]);
    });
    await expect(runDatabricksEventMetricsExport(
      "actor-7",
      "incremental",
      {
        env: enabledEnv,
        appClient: checkpointFailure as never,
        databricksClient,
      },
    )).resolves.toMatchObject({ success: false, code: "server_error" });

    for (const insertError of [
      { message: "duplicate key", code: "23505" },
      { message: "run insert failed" },
    ]) {
      const createFailure = createFakeAppClient((query) => {
        if (query.table === "staff_role_assignments") {
          return ok([{ role_key: "ds_admin" }]);
        }
        if (
          query.table === "warehouse_export_runs" &&
          query.operation === "insert"
        ) {
          return { data: null, error: insertError };
        }
        return ok([]);
      });
      await expect(runDatabricksEventMetricsExport(
        "actor-8",
        "backfill",
        {
          env: enabledEnv,
          appClient: createFailure as never,
          databricksClient,
        },
      )).resolves.toMatchObject({
        success: false,
        code: insertError.code === "23505"
          ? "export_already_running"
          : "server_error",
      });
    }
  });

  it("records page, heartbeat, finalization, and replay-cleanup failures honestly", async () => {
    const baseHandler = (query: FakeQuery) => {
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "ds_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "select"
      ) {
        return ok([]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "insert"
      ) {
        return ok({ id: "10000000-0000-4000-8000-000000000091" });
      }
      return ok([]);
    };
    const rpcFailure = createFakeAppClient(
      baseHandler,
      vi.fn().mockResolvedValue({
        data: null,
        error: { message: "snapshot read failed" },
      }),
    );
    await expect(runDatabricksEventMetricsExport(
      "actor-9",
      "backfill",
      {
        env: enabledEnv,
        appClient: rpcFailure as never,
        databricksClient: { upsertEventMetrics: vi.fn() },
      },
    )).resolves.toMatchObject({ success: false, code: "server_error" });

    const oversizedPage = createFakeAppClient(
      baseHandler,
      vi.fn().mockResolvedValue({
        data: Array.from({ length: 501 }, () => metricRow()),
        error: null,
      }),
    );
    await expect(runDatabricksEventMetricsExport(
      "actor-10",
      "backfill",
      {
        env: enabledEnv,
        appClient: oversizedPage as never,
        databricksClient: { upsertEventMetrics: vi.fn() },
      },
    )).resolves.toMatchObject({ success: false, code: "server_error" });

    let heartbeatUpdates = 0;
    const heartbeatFailure = createFakeAppClient((query) => {
      const base = baseHandler(query);
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "update" &&
        !("status" in (query.payload as Record<string, unknown>))
      ) {
        heartbeatUpdates += 1;
        if (heartbeatUpdates === 1) return failedResult("heartbeat failed");
      }
      return base;
    }, vi.fn().mockResolvedValue({ data: [], error: null }));
    await expect(runDatabricksEventMetricsExport(
      "actor-11",
      "backfill",
      {
        env: enabledEnv,
        appClient: heartbeatFailure as never,
        databricksClient: { upsertEventMetrics: vi.fn() },
      },
    )).resolves.toMatchObject({ success: false, code: "server_error" });

    const finalizationFailure = createFakeAppClient((query) => {
      const base = baseHandler(query);
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "update" &&
        (query.payload as { completed_at?: unknown }).completed_at &&
        ["succeeded", "failed", "partial"].includes(
          String((query.payload as { status?: unknown }).status ?? ""),
        )
      ) {
        return failedResult("finalization failed");
      }
      return base;
    }, vi.fn().mockResolvedValue({ data: [], error: null }));
    await expect(runDatabricksEventMetricsExport(
      "actor-12",
      "backfill",
      {
        env: enabledEnv,
        appClient: finalizationFailure as never,
        databricksClient: { upsertEventMetrics: vi.fn() },
      },
    )).resolves.toMatchObject({ success: false, code: "server_error" });

    const replayQueries: FakeQuery[] = [];
    const replayCleanupFailure = createFakeAppClient((query) => {
      replayQueries.push(query);
      if (query.table === "staff_role_assignments") {
        return ok([{ role_key: "super_admin" }]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "select"
      ) {
        return query.filters.some(
          (filter) => filter.column === "id" && filter.value === "failed-run",
        )
          ? ok([{
            id: "failed-run",
            mode: "backfill",
            status: "failed",
            attempt: 1,
          }])
          : ok([]);
      }
      if (
        query.table === "warehouse_export_runs" &&
        query.operation === "insert"
      ) {
        return ok({ id: "10000000-0000-4000-8000-000000000092" });
      }
      if (
        query.table === "warehouse_export_failures" &&
        query.operation === "update"
      ) {
        return failedResult("cleanup failed");
      }
      return ok([]);
    }, vi.fn().mockResolvedValue({ data: [], error: null }));
    await expect(runDatabricksEventMetricsExport(
      "actor-13",
      "backfill",
      {
        env: enabledEnv,
        appClient: replayCleanupFailure as never,
        databricksClient: { upsertEventMetrics: vi.fn() },
        triggerSource: "replay",
        retryOfRunId: "failed-run",
      },
    )).resolves.toMatchObject({
      success: true,
      plainEnglishMessage:
        "The Databricks replay and checkpoint succeeded, but the prior failure rows still need operator cleanup.",
    });
    expect(replayQueries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        table: "warehouse_export_failures",
        operation: "insert",
        payload: expect.objectContaining({
          error_code: "databricks_replay_cleanup_failed",
        }),
      }),
    ]));
  });

  it("rejects malformed snapshots without leaking malformed values", async () => {
    for (const malformed of [
      { data: { not: "an array" }, expected: "snapshot was malformed" },
      { data: ["private malformed row"], expected: "row 1 was malformed" },
      {
        data: [metricRow({ campaign_id: "not-a-uuid" })],
        expected: "row 1 failed validation",
      },
    ]) {
      const queries: FakeQuery[] = [];
      const appClient = createFakeAppClient((query) => {
        queries.push(query);
        if (query.table === "staff_role_assignments") {
          return ok([{ role_key: "ds_admin" }]);
        }
        if (
          query.table === "warehouse_export_runs" &&
          query.operation === "select"
        ) {
          return ok([]);
        }
        if (
          query.table === "warehouse_export_runs" &&
          query.operation === "insert"
        ) {
          return ok({ id: "10000000-0000-4000-8000-000000000093" });
        }
        return ok([]);
      }, vi.fn().mockResolvedValue({
        data: malformed.data,
        error: null,
      }));
      const result = await runDatabricksEventMetricsExport(
        "actor-14",
        "backfill",
        {
          env: enabledEnv,
          appClient: appClient as never,
          databricksClient: { upsertEventMetrics: vi.fn() },
        },
      );
      expect(result).toMatchObject({ success: false, code: "server_error" });
      const failure = queries.find(
        (query) =>
          query.table === "warehouse_export_failures" &&
          query.operation === "insert",
      );
      expect(JSON.stringify(failure?.payload)).toContain(malformed.expected);
      expect(JSON.stringify(failure?.payload)).not.toContain(
        "private malformed row",
      );
    }
  });

  it("keeps the SQL export aggregate-only, checkpointed, RLS-protected, and service-role-only", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260723174505_databricks_event_metrics_export.sql",
      ),
      "utf8",
    );
    expect(sql).toContain("create table app.warehouse_export_runs");
    expect(sql).toContain("create table app.warehouse_export_failures");
    expect(sql).toContain("warehouse_export_runs_one_running");
    expect(sql).toContain("checkpoint_before_input");
    expect(sql).toContain("current_rsvp_count");
    expect(sql).toContain("attendance_points_awarded");
    expect(sql).toContain(
      "attendance confirmed([[:space:]]|$)",
    );
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("grant execute on function app.get_databricks_event_metrics_export");
    expect(sql).toContain("to service_role");
    expect(sql).not.toMatch(/display_name|email|storage_path|submitted_by_user_id/i);
    expect(sql).not.toContain("DATABRICKS_TOKEN");
  });
});

function metricRow(overrides: Record<string, unknown> = {}) {
  return {
    event_id: "10000000-0000-4000-8000-000000000010",
    chapter_id: "10000000-0000-4000-8000-000000000020",
    campaign_id: null,
    title: "MEDLIFE Community Night",
    event_type: "luma_event",
    status: "published",
    starts_at: "2026-08-01T22:00:00.000Z",
    ends_at: "2026-08-02T00:00:00.000Z",
    current_rsvp_count: 4,
    attendance_count: 3,
    eligible_member_count: 10,
    attendance_rate: 0.3,
    attendance_points_awarded: 30,
    source_updated_at: "2026-07-23T17:30:00.000Z",
    ...overrides,
  };
}

function exportMetric(overrides: Record<string, unknown> = {}) {
  return {
    eventId: "10000000-0000-4000-8000-000000000010",
    chapterId: "10000000-0000-4000-8000-000000000020",
    campaignId: null,
    title: "MEDLIFE Community Night",
    eventType: "luma_event",
    status: "published",
    startsAt: "2026-08-01T22:00:00.000Z",
    endsAt: "2026-08-02T00:00:00.000Z",
    currentRsvpCount: 4,
    attendanceCount: 3,
    eligibleMemberCount: 10,
    attendanceRate: 0.3,
    attendancePointsAwarded: 30,
    sourceUpdatedAt: "2026-07-23T17:30:00.000Z",
    ...overrides,
  };
}

function jsonResponse(value: unknown) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

type FakeResult = {
  data: unknown;
  error: { message: string; code?: string } | null;
};

class FakeQuery {
  operation = "select";
  payload: unknown = null;
  filters: Array<{ column: string; value: unknown }> = [];

  constructor(
    readonly table: string,
    private readonly handler: (query: FakeQuery) => FakeResult,
  ) {}

  select() { return this; }
  insert(payload: unknown) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: unknown) {
    this.operation = "update";
    this.payload = payload;
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
  lt(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }
  order() { return this; }
  limit() { return this; }
  single() { return Promise.resolve(this.handler(this)); }
  then(
    resolve: (value: FakeResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) {
    return Promise.resolve(this.handler(this)).then(resolve, reject);
  }
}

function createFakeAppClient(
  handler: (query: FakeQuery) => FakeResult,
  rpc: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue({
    data: [],
    error: null,
  }),
) {
  return {
    schema: () => ({
      from: (table: string) => new FakeQuery(table, handler),
      rpc,
    }),
  };
}

function ok(data: unknown): FakeResult {
  return { data, error: null };
}

function failedResult(message: string, code?: string): FakeResult {
  return {
    data: null,
    error: {
      message,
      ...(code ? { code } : {}),
    },
  };
}
