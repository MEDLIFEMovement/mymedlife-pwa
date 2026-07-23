import "server-only";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getDatabricksEventMetricsExportConfig } from "@/services/databricks-event-metrics-export";

export type AdminDatabricksExportWorkspace = {
  canRead: boolean;
  config: ReturnType<typeof getDatabricksEventMetricsExportConfig>;
  counts: {
    totalRuns: number;
    succeededRuns: number;
    partialRuns: number;
    failedRuns: number;
    openFailures: number;
  };
  lastRun: {
    id: string;
    mode: "backfill" | "incremental";
    status: "running" | "succeeded" | "partial" | "failed";
    triggerSource: "manual" | "scheduled" | "replay";
    retryOfRunId: string | null;
    batchKey: string;
    checkpointBefore: string | null;
    checkpointAfter: string | null;
    sourceRows: number;
    exportedRows: number;
    statementId: string | null;
    startedAt: string;
    completedAt: string | null;
    errorSummary: string | null;
  } | null;
  failures: Array<{
    id: string;
    runId: string;
    mode: "backfill" | "incremental";
    code: string;
    message: string;
    retryCount: number;
    createdAt: string;
  }>;
  message: string;
};

type WorkspaceDeps = {
  createServerClient?: typeof createLocalSupabaseServerClient;
  getConfig?: typeof getDatabricksEventMetricsExportConfig;
};

export async function getAdminDatabricksExportWorkspace(
  deps: WorkspaceDeps = {},
): Promise<AdminDatabricksExportWorkspace> {
  const config = (deps.getConfig ?? getDatabricksEventMetricsExportConfig)();
  const { client, config: authConfig } = await (
    deps.createServerClient ?? createLocalSupabaseServerClient
  )();
  if (!client) return emptyWorkspace(config, authConfig.reason);

  const app = client.schema("app");
  const [latest, total, succeeded, partial, failed, failures] = await Promise.all([
    app
      .from("warehouse_export_runs")
      .select(
        "id,mode,status,trigger_source,retry_of_run_id,batch_key,checkpoint_before,checkpoint_after,source_row_count,exported_row_count,statement_id,started_at,completed_at,error_summary",
      )
      .eq("destination", "databricks")
      .eq("dataset", "event_metrics")
      .order("started_at", { ascending: false })
      .limit(1),
    countRuns(app, null),
    countRuns(app, "succeeded"),
    countRuns(app, "partial"),
    countRuns(app, "failed"),
    app
      .from("warehouse_export_failures")
      .select(
        "id,run_id,error_code,error_message,retry_count,created_at,warehouse_export_runs!inner(mode)",
        { count: "exact" },
      )
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const queryError = [latest, total, succeeded, partial, failed, failures]
    .find((result) => result.error)?.error;
  if (queryError) {
    return emptyWorkspace(
      config,
      `Databricks export readback is unavailable: ${queryError.message}`,
    );
  }

  return {
    canRead: true,
    config,
    counts: {
      totalRuns: total.count ?? 0,
      succeededRuns: succeeded.count ?? 0,
      partialRuns: partial.count ?? 0,
      failedRuns: failed.count ?? 0,
      openFailures: failures.count ?? 0,
    },
    lastRun: latest.data?.[0]
      ? normalizeRun(latest.data[0] as Record<string, unknown>)
      : null,
    failures: Array.isArray(failures.data)
      ? failures.data.map((row: unknown) =>
        normalizeFailure(row as Record<string, unknown>)
      )
      : [],
    message: config.enabled
      ? "Aggregate event metrics export is enabled for this environment."
      : config.reason,
  };
}

function countRuns(
  app: ReturnType<
    NonNullable<Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"]>["schema"]
  >,
  status: string | null,
) {
  let query = app
    .from("warehouse_export_runs")
    .select("id", { count: "exact", head: true })
    .eq("destination", "databricks")
    .eq("dataset", "event_metrics");
  if (status) query = query.eq("status", status);
  return query;
}

function normalizeRun(
  row: Record<string, unknown>,
): NonNullable<AdminDatabricksExportWorkspace["lastRun"]> {
  return {
    id: text(row.id),
    mode: row.mode === "incremental" ? "incremental" : "backfill",
    status: normalizeStatus(row.status),
    triggerSource: normalizeTrigger(row.trigger_source),
    retryOfRunId: optionalText(row.retry_of_run_id),
    batchKey: text(row.batch_key),
    checkpointBefore: optionalText(row.checkpoint_before),
    checkpointAfter: optionalText(row.checkpoint_after),
    sourceRows: count(row.source_row_count),
    exportedRows: count(row.exported_row_count),
    statementId: optionalText(row.statement_id),
    startedAt: text(row.started_at),
    completedAt: optionalText(row.completed_at),
    errorSummary: optionalText(row.error_summary),
  };
}

function normalizeFailure(
  row: Record<string, unknown>,
): AdminDatabricksExportWorkspace["failures"][number] {
  return {
    id: text(row.id),
    runId: text(row.run_id),
    mode: nestedMode(row.warehouse_export_runs),
    code: text(row.error_code),
    message: text(row.error_message),
    retryCount: count(row.retry_count),
    createdAt: text(row.created_at),
  };
}

function emptyWorkspace(
  config: ReturnType<typeof getDatabricksEventMetricsExportConfig>,
  message: string,
): AdminDatabricksExportWorkspace {
  return {
    canRead: false,
    config,
    counts: {
      totalRuns: 0,
      succeededRuns: 0,
      partialRuns: 0,
      failedRuns: 0,
      openFailures: 0,
    },
    lastRun: null,
    failures: [],
    message,
  };
}

function normalizeStatus(
  value: unknown,
): NonNullable<AdminDatabricksExportWorkspace["lastRun"]>["status"] {
  if (value === "running" || value === "succeeded" || value === "partial") {
    return value;
  }
  return "failed";
}

function normalizeTrigger(
  value: unknown,
): NonNullable<AdminDatabricksExportWorkspace["lastRun"]>["triggerSource"] {
  if (value === "scheduled" || value === "replay") return value;
  return "manual";
}

function text(value: unknown) {
  return String(value ?? "");
}

function optionalText(value: unknown) {
  return value ? String(value) : null;
}

function count(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function nestedMode(value: unknown): "backfill" | "incremental" {
  if (
    value &&
    typeof value === "object" &&
    "mode" in value &&
    value.mode === "backfill"
  ) {
    return "backfill";
  }
  return "incremental";
}
