import "server-only";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getLumaEventSyncConfig } from "@/services/luma-event-sync";
import {
  getProviderSyncHealth,
  type ProviderSyncHealth,
} from "@/services/provider-sync-health";

export type AdminLumaSyncWorkspace = {
  canRead: boolean;
  config: ReturnType<typeof getLumaEventSyncConfig>;
  lastRun: {
    id: string;
    mode: string;
    status: string;
    triggerSource: string;
    retryOfRunId: string | null;
    calendarId: string;
    chapterId: string;
    startedAt: string;
    completedAt: string | null;
    heartbeatAt: string;
    sourceEvents: number;
    materializedEvents: number;
    updatedEvents: number;
    conflicts: number;
    failures: number;
  } | null;
  counts: {
    calendars: number;
    importedEvents: number;
    materializedEvents: number;
    conflicts: number;
    openFailures: number;
  };
  failures: Array<{
    id: string;
    runId: string;
    mode: "backfill" | "reconcile";
    objectType: string;
    externalId: string | null;
    code: string;
    message: string;
    retryCount: number;
    createdAt: string;
  }>;
  health: ProviderSyncHealth;
  message: string;
};

type AdminLumaSyncWorkspaceDeps = {
  createServerClient?: typeof createLocalSupabaseServerClient;
  getSyncConfig?: typeof getLumaEventSyncConfig;
  now?: () => Date;
};

export async function getAdminLumaSyncWorkspace(
  deps: AdminLumaSyncWorkspaceDeps = {},
): Promise<AdminLumaSyncWorkspace> {
  const config = (deps.getSyncConfig ?? getLumaEventSyncConfig)();
  const { client, config: authConfig } = await (deps.createServerClient ?? createLocalSupabaseServerClient)();
  if (!client) return emptyWorkspace(config, authConfig.reason);

  const app = client.schema("app");
  const scopedCalendarId =
    config.calendarId ?? "__mymedlife_unconfigured_luma_calendar__";
  const scopedChapterId =
    config.chapterId ?? "00000000-0000-0000-0000-000000000000";
  const [runs, calendars, imports, materialized, conflicts, failures] = await Promise.all([
    app.from("luma_sync_runs")
      .select("id,mode,status,trigger_source,retry_of_run_id,calendar_id,chapter_id,started_at,completed_at,heartbeat_at,source_event_count,materialized_event_count,updated_event_count,conflict_count,failure_count")
      .eq("calendar_id", scopedCalendarId)
      .eq("chapter_id", scopedChapterId)
      .order("started_at", { ascending: false })
      .limit(1),
    app.from("chapter_luma_calendars")
      .select("id", { count: "exact", head: true })
      .eq("environment", config.environment)
      .eq("calendar_id", scopedCalendarId)
      .eq("chapter_id", scopedChapterId),
    app.from("luma_event_imports")
      .select("luma_event_id", { count: "exact", head: true })
      .eq("environment", config.environment)
      .eq("calendar_id", scopedCalendarId)
      .eq("chapter_id", scopedChapterId),
    app.from("luma_event_imports")
      .select("luma_event_id", { count: "exact", head: true })
      .eq("environment", config.environment)
      .eq("calendar_id", scopedCalendarId)
      .eq("chapter_id", scopedChapterId)
      .eq("reconciliation_status", "materialized"),
    app.from("luma_event_imports")
      .select("luma_event_id", { count: "exact", head: true })
      .eq("environment", config.environment)
      .eq("calendar_id", scopedCalendarId)
      .eq("chapter_id", scopedChapterId)
      .eq("reconciliation_status", "conflict"),
    app.from("luma_sync_failures")
      .select("id,run_id,object_type,external_id,error_code,error_message,retry_count,created_at,luma_sync_runs!inner(mode,calendar_id,chapter_id)", { count: "exact" })
      .eq("luma_sync_runs.calendar_id", scopedCalendarId)
      .eq("luma_sync_runs.chapter_id", scopedChapterId)
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const queryError = [runs, calendars, imports, materialized, conflicts, failures]
    .find((result) => result.error)?.error;
  if (queryError) {
    return emptyWorkspace(config, `Luma sync readback is unavailable: ${queryError.message}`);
  }

  const lastRun = runs.data?.[0]
    ? normalizeRun(runs.data[0] as Record<string, unknown>)
    : null;
  const openFailures = Array.isArray(failures.data)
    ? failures.data.map((row: unknown) => normalizeFailure(row as Record<string, unknown>))
    : [];
  const openFailureCount = failures.count ?? 0;
  return {
    canRead: true,
    config,
    lastRun,
    counts: {
      calendars: calendars.count ?? 0,
      importedEvents: imports.count ?? 0,
      materializedEvents: materialized.count ?? 0,
      conflicts: conflicts.count ?? 0,
      openFailures: openFailureCount,
    },
    failures: openFailures,
    health: getProviderSyncHealth({
      enabled: config.enabled,
      lastRun,
      openFailures: openFailureCount,
      now: deps.now?.(),
    }),
    message: config.enabled
      ? "Luma event reads and app-owned reconciliation writes are enabled. Luma provider writes remain off."
      : config.reason,
  };
}

function normalizeRun(row: Record<string, unknown>): NonNullable<AdminLumaSyncWorkspace["lastRun"]> {
  const text = (key: string) => String(row[key] ?? "");
  const count = (key: string) => Number(row[key] ?? 0);
  const optionalText = (key: string) => row[key] ? String(row[key]) : null;

  return {
    id: text("id"),
    mode: text("mode"),
    status: text("status"),
    triggerSource: text("trigger_source") || "manual",
    retryOfRunId: optionalText("retry_of_run_id"),
    calendarId: text("calendar_id"),
    chapterId: text("chapter_id"),
    startedAt: text("started_at"),
    completedAt: optionalText("completed_at"),
    heartbeatAt: text("heartbeat_at") || text("started_at"),
    sourceEvents: count("source_event_count"),
    materializedEvents: count("materialized_event_count"),
    updatedEvents: count("updated_event_count"),
    conflicts: count("conflict_count"),
    failures: count("failure_count"),
  };
}

function normalizeFailure(row: Record<string, unknown>): AdminLumaSyncWorkspace["failures"][number] {
  const { id, run_id, object_type, external_id, error_code, error_message, retry_count, created_at } = row;
  return {
    id: String(id ?? ""),
    runId: String(run_id ?? ""),
    mode: nestedMode(row.luma_sync_runs),
    objectType: String(object_type ?? ""),
    externalId: external_id ? String(external_id) : null,
    code: String(error_code ?? ""),
    message: String(error_message ?? ""),
    retryCount: Number(retry_count ?? 0),
    createdAt: String(created_at ?? ""),
  };
}

function nestedMode(value: unknown): "backfill" | "reconcile" {
  if (
    value &&
    typeof value === "object" &&
    "mode" in value &&
    value.mode === "backfill"
  ) {
    return "backfill";
  }
  return "reconcile";
}

function emptyWorkspace(
  config: ReturnType<typeof getLumaEventSyncConfig>,
  message: string,
): AdminLumaSyncWorkspace {
  return {
    canRead: false,
    config,
    lastRun: null,
    counts: { calendars: 0, importedEvents: 0, materializedEvents: 0, conflicts: 0, openFailures: 0 },
    failures: [],
    health: getProviderSyncHealth({
      enabled: config.enabled,
      lastRun: null,
      openFailures: 0,
    }),
    message,
  };
}
