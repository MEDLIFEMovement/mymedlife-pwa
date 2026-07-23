import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const LUMA_API_ROOT = "https://public-api.luma.com";
const RECONCILE_PAST_DAYS = 90;
const RECONCILE_FUTURE_DAYS = 365;

export type LumaSyncMode = "backfill" | "reconcile";
export type LumaSyncTriggerSource = "manual" | "scheduled" | "replay";

export type LumaEventSyncConfig = {
  enabled: boolean;
  environment: "local" | "staging" | "production";
  chapterId: string | null;
  calendarId: string | null;
  calendarLabel: string | null;
  reason: string;
};

export type LumaEventRecord = {
  id: string;
  calendarId: string;
  name: string;
  url: string;
  startsAt: string;
  endsAt: string;
  timezone: string | null;
  locationLabel: string | null;
  visibility: string | null;
  registrationOpen: boolean | null;
  createdAt: string | null;
  source: Record<string, unknown>;
};

export type LumaCalendarRecord = {
  id: string;
  name: string;
  url: string;
};

export type LumaReadClient = {
  readCalendar?: () => Promise<LumaCalendarRecord>;
  readEvents: (mode: LumaSyncMode, now: Date) => Promise<LumaEventRecord[]>;
};

export type LumaSyncCounts = {
  sourceEvents: number;
  eventUpserts: number;
  materializedEvents: number;
  updatedEvents: number;
  conflicts: number;
  failures: number;
};

export type LumaEventSyncResult =
  | {
      success: true;
      code: "luma_sync_succeeded" | "luma_sync_partial";
      runId: string;
      counts: LumaSyncCounts;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code:
        | "sync_disabled"
        | "missing_auth"
        | "permission_denied"
        | "sync_already_running"
        | "server_error";
      runId: string | null;
      plainEnglishMessage: string;
    };

type AppClient = SupabaseClient<Record<string, unknown>>;

type LumaEventSyncDeps = {
  appClient?: AppClient;
  lumaClient?: LumaReadClient;
  env?: Record<string, string | undefined>;
  now?: () => Date;
  triggerSource?: LumaSyncTriggerSource;
  retryOfRunId?: string | null;
};

type LumaEventPage = {
  entries?: unknown[];
  next_cursor?: string | null;
  has_more?: boolean;
};

export function getLumaEventSyncConfig(
  env: Record<string, string | undefined> = process.env,
): LumaEventSyncConfig {
  const environment = getEnvironment(env);
  const chapterId = optional(env.MYMEDLIFE_LUMA_CHAPTER_ID);
  const calendarId = optional(env.LUMA_CALENDAR_ID);
  const calendarLabel = optional(env.MYMEDLIFE_LUMA_CALENDAR_LABEL) ?? calendarId;

  if (env.MYMEDLIFE_ENABLE_LUMA_READ_SYNC !== "true") {
    return disabled(environment, chapterId, calendarId, calendarLabel, "Luma event read sync is disabled by configuration.");
  }
  if (!env.LUMA_API_KEY) {
    return disabled(environment, chapterId, calendarId, calendarLabel, "Luma event read sync is disabled because the server-only API key is missing.");
  }
  if (!calendarId || !chapterId) {
    return disabled(environment, chapterId, calendarId, calendarLabel, "Luma event read sync needs one approved pilot chapter and calendar mapping.");
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !(env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL)) {
    return disabled(environment, chapterId, calendarId, calendarLabel, "Luma event read sync is disabled because the server-only Supabase client is incomplete.");
  }

  const approvalFlag = environment === "production"
    ? env.MYMEDLIFE_ALLOW_PRODUCTION_LUMA_READ_SYNC
    : environment === "staging"
      ? env.MYMEDLIFE_ALLOW_STAGING_LUMA_READ_SYNC
      : env.MYMEDLIFE_ALLOW_LOCAL_LUMA_READ_SYNC;
  if (approvalFlag !== "true") {
    return disabled(
      environment,
      chapterId,
      calendarId,
      calendarLabel,
      `${capitalize(environment)} Luma reads are disabled until the explicit environment approval flag is enabled.`,
    );
  }

  return {
    enabled: true,
    environment,
    chapterId,
    calendarId,
    calendarLabel,
    reason: `Server-only Luma event reads and app-owned reconciliation writes are enabled for ${environment}. Luma event, guest, RSVP, reminder, and attendance writes remain disabled.`,
  };
}

export function createLumaReadClient(
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): LumaReadClient | null {
  const config = getLumaEventSyncConfig(env);
  const apiKey = env.LUMA_API_KEY;
  if (!config.enabled || !apiKey || !config.calendarId) return null;

  const request = async <T>(path: string): Promise<T> => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetchImpl(`${LUMA_API_ROOT}${path}`, {
        headers: { "x-luma-api-key": apiKey },
        cache: "no-store",
      });
      if (response.ok) return response.json() as Promise<T>;

      const retryAfter = Number.parseInt(response.headers.get("retry-after") ?? "0", 10);
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === 2) {
        throw new Error(`Luma request failed (${response.status})${retryAfter > 0 ? `; retry after ${retryAfter}s` : ""}.`);
      }
      await wait(Math.max(retryAfter * 1000, 250 * (attempt + 1)));
    }
    throw new Error("Luma request failed after retries.");
  };

  return {
    async readCalendar() {
      const calendar = mapLumaCalendar(await request<unknown>("/v1/calendars/get"));
      if (!calendar) {
        throw new Error("Luma returned a malformed calendar identity; reconciliation stopped before materialization.");
      }
      return calendar;
    },
    async readEvents(mode, now) {
      const events: LumaEventRecord[] = [];
      let cursor: string | null = null;
      do {
        const params = new URLSearchParams({
          pagination_limit: "100",
          sort_column: "start_at",
          sort_direction: "asc",
          status: "approved",
          access: "manage",
        });
        if (mode === "reconcile") {
          params.set("after", offsetDays(now, -RECONCILE_PAST_DAYS).toISOString());
          params.set("before", offsetDays(now, RECONCILE_FUTURE_DAYS).toISOString());
        }
        if (cursor) params.set("pagination_cursor", cursor);

        const page = await request<LumaEventPage>(`/v1/calendars/events/list?${params}`);
        const mapped = (page.entries ?? []).map(mapLumaEvent);
        const malformedCount = mapped.filter((event) => event === null).length;
        if (malformedCount > 0) {
          throw new Error(`Luma returned ${malformedCount} malformed event record(s); reconciliation stopped before materialization.`);
        }
        events.push(...mapped.filter(isPresent));
        cursor = optional(page.next_cursor);
      } while (cursor);

      return events.filter((event) => event.calendarId === config.calendarId);
    },
  };
}

export async function runLumaEventSync(
  actorUserId: string | null,
  mode: LumaSyncMode,
  deps: LumaEventSyncDeps = {},
): Promise<LumaEventSyncResult> {
  const env = deps.env ?? process.env;
  const config = getLumaEventSyncConfig(env);
  const triggerSource = deps.triggerSource ?? "manual";
  const retryOfRunId = deps.retryOfRunId ?? null;
  const now = deps.now ?? (() => new Date());
  if (!config.enabled || !config.chapterId || !config.calendarId || !config.calendarLabel) {
    return failure("sync_disabled", config.reason);
  }
  if (triggerSource !== "scheduled" && !actorUserId) {
    return failure("missing_auth", "Sign in with a DS Admin or Super Admin account before running Luma event sync.");
  }
  if (triggerSource === "replay" && !retryOfRunId) {
    return failure("server_error", "A replay must identify the failed or partial Luma sync run being retried.");
  }

  const appClient = deps.appClient ?? createLumaSyncAppClient(env);
  const lumaClient = deps.lumaClient ?? createLumaReadClient(env);
  if (!appClient || !lumaClient) {
    return failure("sync_disabled", "The server-only Luma and Supabase sync clients are not configured.");
  }

  if (actorUserId) {
    const actorRoleResult = await readActorRoles(appClient, actorUserId);
    if (actorRoleResult.error) {
      return failure("server_error", "Could not verify the Luma sync administrator role.");
    }
    if (!actorRoleResult.roles.some((role) => role === "ds_admin" || role === "super_admin")) {
      return failure("permission_denied", "Only a DS Admin or Super Admin can run Luma event sync.");
    }
  }

  const chapter = await appClient.schema("app").from("chapters")
    .select("id,name")
    .eq("id", config.chapterId)
    .eq("status", "active")
    .limit(1);
  if (chapter.error || !chapter.data?.[0]?.id) {
    return failure("server_error", "The approved Luma pilot chapter is missing or inactive.");
  }

  const startedAt = now().toISOString();
  const staleBefore = new Date(Date.parse(startedAt) - 30 * 60 * 1000).toISOString();
  const recovered = await appClient.schema("app").from("luma_sync_runs").update({
    status: "failed",
    completed_at: startedAt,
    heartbeat_at: startedAt,
    error_summary: "Recovered abandoned Luma sync after its heartbeat expired.",
  }).eq("status", "running").lt("heartbeat_at", staleBefore);
  if (recovered.error) return failure("server_error", "Could not recover abandoned Luma sync runs.");

  const running = await appClient.schema("app").from("luma_sync_runs")
    .select("id")
    .eq("status", "running")
    .limit(1);
  if (running.error) return failure("server_error", "Could not verify the Luma sync lock.");
  if ((running.data ?? []).length > 0) {
    return failure("sync_already_running", "A Luma sync is already running. Review that run before retrying.");
  }

  const checkpointResult = await readLastCheckpoint(appClient, config.chapterId);
  if (checkpointResult.error) {
    return failure("server_error", `Could not read the Luma sync checkpoint: ${checkpointResult.error}`);
  }
  const checkpointBefore = checkpointResult.checkpoint;
  const created = await appClient.schema("app").from("luma_sync_runs").insert({
    mode,
    status: "running",
    trigger_source: triggerSource,
    requested_by: actorUserId,
    retry_of_run_id: retryOfRunId,
    attempt: triggerSource === "replay" ? 2 : 1,
    calendar_id: config.calendarId,
    chapter_id: config.chapterId,
    checkpoint_before: checkpointBefore,
    started_at: startedAt,
    heartbeat_at: startedAt,
  }).select("id").single();
  const runId = String(created.data?.id ?? "");
  if (created.error || !runId) {
    if (isRunningRunConflict(created.error)) {
      return failure("sync_already_running", "A Luma sync is already running. Review that run before retrying.");
    }
    return failure("server_error", "Could not create the app-owned Luma sync run.");
  }

  const counts = emptyCounts();
  try {
    if (lumaClient.readCalendar) {
      const calendar = await lumaClient.readCalendar();
      if (calendar.id !== config.calendarId) {
        throw new Error(
          `The configured Luma calendar ${config.calendarId} does not match the API key calendar ${calendar.id}.`,
        );
      }
    }
    await upsertCalendarMapping(appClient, config, actorUserId, startedAt);
    const events = await lumaClient.readEvents(mode, now());
    counts.sourceEvents = events.length;
    await heartbeatRun(appClient, runId, now().toISOString());

    for (const [index, event] of events.entries()) {
      await reconcileEvent(appClient, runId, actorUserId, config, event, counts, now().toISOString());
      if ((index + 1) % 25 === 0) await heartbeatRun(appClient, runId, now().toISOString());
    }

    const completedAt = now().toISOString();
    const status = counts.failures > 0 || counts.conflicts > 0 ? "partial" : "succeeded";
    if (status === "succeeded" && triggerSource === "replay" && retryOfRunId) {
      await resolveReplayedFailures(appClient, retryOfRunId, completedAt);
    }
    const finalized = await finishRun(appClient, runId, status, completedAt, counts);
    if (!finalized) {
      return failure(
        "server_error",
        "Luma source data was processed, but the final sync status could not be recorded. The run remains incomplete and must not be treated as successful.",
        runId,
      );
    }
    return {
      success: true,
      code: status === "partial" ? "luma_sync_partial" : "luma_sync_succeeded",
      runId,
      counts,
      plainEnglishMessage: status === "partial"
        ? "Luma event reconciliation completed with reviewable conflicts or failures. No Luma writes ran."
        : "Luma events were reconciled into app-owned event and provider-link rows. No Luma writes ran.",
    };
  } catch (error) {
    counts.failures += 1;
    const message = safeErrorMessage(error);
    const failureDetailsRecorded = await tryRecordFailure(
      appClient,
      runId,
      "run",
      null,
      "luma_read_failed",
      message,
      {},
    );
    const errorSummary = failureDetailsRecorded
      ? message
      : `${message} The Luma sync failure register could not be updated.`;
    const finalized = await finishRun(
      appClient,
      runId,
      "failed",
      now().toISOString(),
      counts,
      errorSummary,
    );
    if (!finalized) {
      return failure(
        "server_error",
        `Luma event sync failed safely, but the failed run status could not be recorded: ${errorSummary}`,
        runId,
      );
    }
    return failure("server_error", `Luma event sync failed safely: ${errorSummary}`, runId);
  }
}

async function reconcileEvent(
  client: AppClient,
  runId: string,
  actorUserId: string | null,
  config: LumaEventSyncConfig,
  event: LumaEventRecord,
  counts: LumaSyncCounts,
  importedAt: string,
) {
  if (event.calendarId !== config.calendarId || !config.chapterId) {
    counts.conflicts += 1;
    await recordFailure(client, runId, "event", event.id, "calendar_mismatch", "Luma event does not belong to the approved pilot calendar.", event.source);
    return;
  }

  const staged = await client.schema("app").from("luma_event_imports").upsert({
    environment: config.environment,
    luma_event_id: event.id,
    calendar_id: event.calendarId,
    chapter_id: config.chapterId,
    event_name: event.name,
    event_url: event.url,
    starts_at: event.startsAt,
    ends_at: event.endsAt,
    timezone: event.timezone,
    location_label: event.locationLabel,
    visibility: event.visibility,
    registration_open: event.registrationOpen,
    source_created_at: event.createdAt,
    source_payload: event.source,
    reconciliation_status: "pending",
    reconciliation_note: null,
    last_seen_run_id: runId,
    last_imported_at: importedAt,
  }, { onConflict: "environment,luma_event_id" });
  if (staged.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "event", event.id, "event_stage_failed", staged.error.message, event.source);
    return;
  }
  counts.eventUpserts += 1;

  const existing = await client.schema("app").from("luma_event_links")
    .select("id,chapter_id,chapter_event_id")
    .eq("luma_event_id", event.id)
    .limit(2);
  if (existing.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "event", event.id, "event_link_lookup_failed", existing.error.message, event.source);
    return;
  }
  if ((existing.data ?? []).length > 1 || (existing.data?.[0]?.chapter_id && existing.data[0].chapter_id !== config.chapterId)) {
    counts.conflicts += 1;
    const markError = await markImport(client, config.environment, event.id, "conflict", "The provider event is already linked to another app chapter.", null, null);
    if (markError) {
      counts.failures += 1;
      await recordFailure(client, runId, "event", event.id, "event_conflict_mark_failed", markError, event.source);
    }
    return;
  }

  let chapterEventId = existing.data?.[0]?.chapter_event_id ? String(existing.data[0].chapter_event_id) : null;
  let linkId = existing.data?.[0]?.id ? String(existing.data[0].id) : null;
  const eventPatch = {
    title: event.name,
    event_type: "luma_event",
    status: Date.parse(event.endsAt) <= Date.parse(importedAt) ? "completed" : "published",
    starts_at: event.startsAt,
    ends_at: event.endsAt,
  };

  if (chapterEventId) {
    const updated = await client.schema("app").from("chapter_events").update(eventPatch).eq("id", chapterEventId);
    if (updated.error) {
      counts.failures += 1;
      await recordFailure(client, runId, "event", event.id, "chapter_event_update_failed", updated.error.message, event.source);
      return;
    }
    counts.updatedEvents += 1;
  } else {
    const inserted = await client.schema("app").from("chapter_events").insert({
      chapter_id: config.chapterId,
      planned_by_user_id: actorUserId,
      owner_user_id: actorUserId,
      ...eventPatch,
      promotion_summary: event.locationLabel
        ? `Imported from Luma. Location: ${event.locationLabel}`
        : "Imported from Luma. Review provider details before promotion.",
    }).select("id").single();
    chapterEventId = inserted.error ? null : String(inserted.data?.id ?? "") || null;
    if (!chapterEventId) {
      counts.failures += 1;
      await recordFailure(client, runId, "event", event.id, "chapter_event_create_failed", inserted.error?.message ?? "No event id returned.", event.source);
      return;
    }
    counts.materializedEvents += 1;
  }

  if (linkId) {
    const updated = await client.schema("app").from("luma_event_links").update({
      chapter_event_id: chapterEventId,
      luma_event_url: event.url,
      status: "linked",
      last_imported_at: importedAt,
    }).eq("id", linkId);
    if (updated.error) linkId = null;
  } else {
    const inserted = await client.schema("app").from("luma_event_links").insert({
      chapter_id: config.chapterId,
      chapter_event_id: chapterEventId,
      luma_event_id: event.id,
      luma_event_url: event.url,
      status: "linked",
      linked_by: actorUserId,
      linked_at: importedAt,
      last_imported_at: importedAt,
    }).select("id").single();
    linkId = inserted.error ? null : String(inserted.data?.id ?? "") || null;
  }
  if (!linkId) {
    counts.failures += 1;
    await recordFailure(client, runId, "event", event.id, "event_link_write_failed", "The app provider link could not be created or updated.", event.source);
    return;
  }

  const linkedEvent = await client.schema("app").from("chapter_events")
    .update({ luma_event_link_id: linkId }).eq("id", chapterEventId);
  if (linkedEvent.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "event", event.id, "chapter_event_backlink_failed", linkedEvent.error.message, event.source);
    return;
  }
  const markError = await markImport(client, config.environment, event.id, "materialized", null, chapterEventId, linkId);
  if (markError) {
    counts.failures += 1;
    await recordFailure(client, runId, "event", event.id, "event_materialization_mark_failed", markError, event.source);
    return;
  }
  const audit = await client.schema("app").from("audit_logs").insert({
    actor_user_id: actorUserId,
    chapter_id: config.chapterId,
    action: "luma_event_reconciled",
    target_table: "chapter_events",
    target_id: chapterEventId,
    after_value: { luma_event_id: event.id, luma_sync_run_id: runId, starts_at: event.startsAt, ends_at: event.endsAt },
    reason: "Authorized server-only Luma read reconciliation into app-owned event records.",
  });
  if (audit.error) {
    counts.failures += 1;
    await recordFailure(client, runId, "event", event.id, "audit_log_failed", audit.error.message, event.source);
  }
}

function mapLumaEvent(value: unknown): LumaEventRecord | null {
  if (!isRecord(value)) return null;
  const id = optional(value.id);
  const calendarId = optional(value.calendar_id);
  const name = optional(value.name);
  const url = optional(value.url);
  const startsAt = validDate(value.start_at);
  const endsAt = validDate(value.end_at);
  if (!id || !calendarId || !name || !url || !startsAt || !endsAt) return null;

  const geo = isRecord(value.geo_address_json) ? value.geo_address_json : null;
  return {
    id,
    calendarId,
    name,
    url,
    startsAt,
    endsAt,
    timezone: optional(value.timezone),
    locationLabel: optional(geo?.full_address) ?? optional(geo?.address) ?? optional(value.meeting_url),
    visibility: optional(value.visibility),
    registrationOpen: typeof value.registration_open === "boolean" ? value.registration_open : null,
    createdAt: validDate(value.created_at),
    source: value,
  };
}

function mapLumaCalendar(value: unknown): LumaCalendarRecord | null {
  if (!isRecord(value)) return null;
  const id = optional(value.id);
  const name = optional(value.name);
  const url = optional(value.url);
  if (!id || !name || !url) return null;
  return { id, name, url };
}

async function upsertCalendarMapping(
  client: AppClient,
  config: LumaEventSyncConfig,
  actorUserId: string | null,
  linkedAt: string,
) {
  if (!config.chapterId || !config.calendarId || !config.calendarLabel) return;
  const result = await client.schema("app").from("chapter_luma_calendars").upsert({
    chapter_id: config.chapterId,
    environment: config.environment,
    calendar_id: config.calendarId,
    calendar_label: config.calendarLabel,
    is_default: true,
    status: "linked",
    linked_by: actorUserId,
    linked_at: linkedAt,
    notes: "Server-only Luma read mapping. Provider writes remain disabled.",
  }, { onConflict: "chapter_id,environment" });
  if (result.error) throw new Error(`Luma calendar mapping failed: ${result.error.message}`);
}

function createLumaSyncAppClient(env: Record<string, string | undefined>): AppClient | null {
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) as AppClient;
}

async function readActorRoles(
  client: AppClient,
  actorUserId: string,
): Promise<{ roles: string[]; error: string | null }> {
  const result = await client.schema("app").from("staff_role_assignments")
    .select("role_key").eq("user_id", actorUserId).eq("status", "active");
  if (result.error) return { roles: [], error: result.error.message };
  return {
    roles: (result.data ?? []).map((row) => String(row.role_key)),
    error: null,
  };
}

async function readLastCheckpoint(
  client: AppClient,
  chapterId: string,
): Promise<{ checkpoint: string | null; error: string | null }> {
  const result = await client.schema("app").from("luma_sync_runs")
    .select("checkpoint_after").eq("chapter_id", chapterId).eq("status", "succeeded")
    .order("completed_at", { ascending: false }).limit(1);
  if (result.error) {
    return { checkpoint: null, error: result.error.message };
  }
  return {
    checkpoint: validDate(result.data?.[0]?.checkpoint_after),
    error: null,
  };
}

async function markImport(
  client: AppClient,
  environment: string,
  eventId: string,
  status: "materialized" | "conflict",
  note: string | null,
  chapterEventId: string | null,
  linkId: string | null,
) {
  const result = await client.schema("app").from("luma_event_imports").update({
    reconciliation_status: status,
    reconciliation_note: note,
    materialized_chapter_event_id: chapterEventId,
    materialized_luma_link_id: linkId,
  }).eq("environment", environment).eq("luma_event_id", eventId);
  return result.error?.message ?? null;
}

async function recordFailure(
  client: AppClient,
  runId: string,
  objectType: "event" | "run",
  externalId: string | null,
  errorCode: string,
  errorMessage: string,
  sourcePayload: Record<string, unknown>,
) {
  const result = await client.schema("app").from("luma_sync_failures").insert({
    run_id: runId,
    object_type: objectType,
    external_id: externalId,
    error_code: errorCode,
    error_message: errorMessage.slice(0, 500),
    source_payload: sourcePayload,
  });
  if (result.error) {
    throw new Error("The Luma sync failure register could not be updated.");
  }
}

async function tryRecordFailure(
  client: AppClient,
  runId: string,
  objectType: "event" | "run",
  externalId: string | null,
  errorCode: string,
  errorMessage: string,
  sourcePayload: Record<string, unknown>,
): Promise<boolean> {
  try {
    await recordFailure(
      client,
      runId,
      objectType,
      externalId,
      errorCode,
      errorMessage,
      sourcePayload,
    );
    return true;
  } catch {
    return false;
  }
}

async function finishRun(
  client: AppClient,
  runId: string,
  status: "succeeded" | "partial" | "failed",
  completedAt: string,
  counts: LumaSyncCounts,
  errorSummary: string | null = null,
): Promise<boolean> {
  const result = await client.schema("app").from("luma_sync_runs").update({
    status,
    completed_at: completedAt,
    checkpoint_after: completedAt,
    heartbeat_at: completedAt,
    source_event_count: counts.sourceEvents,
    event_upsert_count: counts.eventUpserts,
    materialized_event_count: counts.materializedEvents,
    updated_event_count: counts.updatedEvents,
    conflict_count: counts.conflicts,
    failure_count: counts.failures,
    error_summary: errorSummary,
  }).eq("id", runId);
  return !result.error;
}

async function heartbeatRun(client: AppClient, runId: string, heartbeatAt: string) {
  const result = await client.schema("app").from("luma_sync_runs").update({ heartbeat_at: heartbeatAt })
    .eq("id", runId).eq("status", "running");
  if (result.error) throw new Error(`Luma sync heartbeat failed: ${result.error.message}`);
}

async function resolveReplayedFailures(
  client: AppClient,
  retryOfRunId: string,
  resolvedAt: string,
) {
  const result = await client.schema("app").from("luma_sync_failures").update({
    resolved_at: resolvedAt,
  }).eq("run_id", retryOfRunId).is("resolved_at", null);
  if (result.error) {
    throw new Error("The replayed Luma failures could not be marked resolved.");
  }
}

function getEnvironment(env: Record<string, string | undefined>): LumaEventSyncConfig["environment"] {
  if (env.MYMEDLIFE_AUTH_MODE === "production_supabase") return "production";
  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") return "staging";
  return "local";
}

function disabled(
  environment: LumaEventSyncConfig["environment"],
  chapterId: string | null,
  calendarId: string | null,
  calendarLabel: string | null,
  reason: string,
): LumaEventSyncConfig {
  return { enabled: false, environment, chapterId, calendarId, calendarLabel, reason };
}

function validDate(value: unknown): string | null {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

function optional(value: unknown): string | null {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function offsetDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function safeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Unknown server error.";
}

function isRunningRunConflict(error: { message?: string; code?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "23505" || message.includes("luma_sync_runs_one_running") || message.includes("duplicate key");
}

function capitalize(value: string) {
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

function emptyCounts(): LumaSyncCounts {
  return { sourceEvents: 0, eventUpserts: 0, materializedEvents: 0, updatedEvents: 0, conflicts: 0, failures: 0 };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function failure(
  code: Extract<LumaEventSyncResult, { success: false }>["code"],
  plainEnglishMessage: string,
  runId: string | null = null,
): LumaEventSyncResult {
  return { success: false, code, runId, plainEnglishMessage };
}
