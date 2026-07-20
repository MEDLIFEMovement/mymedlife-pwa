import "server-only";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getLumaEventSyncConfig } from "@/services/luma-event-sync";

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
    objectType: string;
    externalId: string | null;
    code: string;
    message: string;
    retryCount: number;
    createdAt: string;
  }>;
  message: string;
};

type AdminLumaSyncWorkspaceDeps = {
  createServerClient?: typeof createLocalSupabaseServerClient;
  getSyncConfig?: typeof getLumaEventSyncConfig;
};

export async function getAdminLumaSyncWorkspace(
  deps: AdminLumaSyncWorkspaceDeps = {},
): Promise<AdminLumaSyncWorkspace> {
  const config = (deps.getSyncConfig ?? getLumaEventSyncConfig)();
  const { client, config: authConfig } = await (deps.createServerClient ?? createLocalSupabaseServerClient)();
  if (!client) return emptyWorkspace(config, authConfig.reason);

  const app = client.schema("app");
  const [runs, calendars, imports, materialized, conflicts, failures] = await Promise.all([
    app.from("luma_sync_runs").select("id,mode,status,trigger_source,retry_of_run_id,calendar_id,chapter_id,started_at,completed_at,heartbeat_at,source_event_count,materialized_event_count,updated_event_count,conflict_count,failure_count").order("started_at", { ascending: false }).limit(1),
    app.from("chapter_luma_calendars").select("id", { count: "exact", head: true }),
    app.from("luma_event_imports").select("luma_event_id", { count: "exact", head: true }),
    app.from("luma_event_imports").select("luma_event_id", { count: "exact", head: true }).eq("reconciliation_status", "materialized"),
    app.from("luma_event_imports").select("luma_event_id", { count: "exact", head: true }).eq("reconciliation_status", "conflict"),
    app.from("luma_sync_failures").select("id,object_type,external_id,error_code,error_message,retry_count,created_at", { count: "exact" }).is("resolved_at", null).order("created_at", { ascending: false }).limit(20),
  ]);

  const queryError = [runs, calendars, imports, materialized, conflicts, failures]
    .find((result) => result.error)?.error;
  if (queryError) {
    return emptyWorkspace(config, `Luma sync readback is unavailable: ${queryError.message}`);
  }

  const run = runs.data?.[0];
  return {
    canRead: true,
    config,
    lastRun: run ? {
      id: String(run.id),
      mode: String(run.mode),
      status: String(run.status),
      triggerSource: String(run.trigger_source ?? "manual"),
      retryOfRunId: run.retry_of_run_id ? String(run.retry_of_run_id) : null,
      calendarId: String(run.calendar_id),
      chapterId: String(run.chapter_id),
      startedAt: String(run.started_at),
      completedAt: run.completed_at ? String(run.completed_at) : null,
      heartbeatAt: String(run.heartbeat_at ?? run.started_at),
      sourceEvents: Number(run.source_event_count ?? 0),
      materializedEvents: Number(run.materialized_event_count ?? 0),
      updatedEvents: Number(run.updated_event_count ?? 0),
      conflicts: Number(run.conflict_count ?? 0),
      failures: Number(run.failure_count ?? 0),
    } : null,
    counts: {
      calendars: calendars.count ?? 0,
      importedEvents: imports.count ?? 0,
      materializedEvents: materialized.count ?? 0,
      conflicts: conflicts.count ?? 0,
      openFailures: failures.count ?? 0,
    },
    failures: (failures.data ?? []).map((failure: Record<string, unknown>) => ({
      id: String(failure.id),
      objectType: String(failure.object_type),
      externalId: failure.external_id ? String(failure.external_id) : null,
      code: String(failure.error_code),
      message: String(failure.error_message),
      retryCount: Number(failure.retry_count ?? 0),
      createdAt: String(failure.created_at),
    })),
    message: config.enabled
      ? "Luma event reads and app-owned reconciliation writes are enabled. Luma provider writes remain off."
      : config.reason,
  };
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
    message,
  };
}
