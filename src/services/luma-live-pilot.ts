import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getPersistedChapterLumaCalendarRows } from "@/services/chapter-luma-calendar-store";
import {
  getChapterLumaCalendarSummary,
  resolveChapterLumaCalendar,
} from "@/services/chapter-luma-calendars";
import { getFeatureFlagDefinition } from "@/services/admin-rollout-controls-registry";
import type {
  FeatureFlagKey,
  RolloutEnvironment,
} from "@/shared/types/admin-rollout-controls";
import type {
  ChapterLumaCalendarRow,
  FeatureFlagRow,
} from "@/shared/types/persistence";

export type LumaLivePilotEnv = {
  LUMA_API_KEY?: string;
  LUMA_CALENDAR_ID?: string;
  MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON?: string;
  MYMEDLIFE_LUMA_SHARED_DEFAULT_CHAPTER_ID?: string;
  MYMEDLIFE_ENABLE_LUMA_WRITES?: string;
  MYMEDLIFE_ENABLE_LUMA_EVENT_WRITES?: string;
  MYMEDLIFE_ENABLE_LUMA_RSVP_WRITES?: string;
  MYMEDLIFE_ENABLE_LUMA_ATTENDANCE_IMPORT?: string;
  MYMEDLIFE_LUMA_ENVIRONMENT?: string;
  MYMEDLIFE_AUTH_MODE?: string;
  VERCEL_ENV?: string;
};

export type LumaLivePilotRolloutFlags = {
  eventCreateEnabled: boolean;
  eventUpdateEnabled: boolean;
  rsvpWritebackEnabled: boolean;
  attendanceImportEnabled: boolean;
  source: "env" | "supabase" | "defaults";
};

export type LumaLivePilotGate = {
  apiKeyConfigured: boolean;
  calendarIdConfigured: boolean;
  environment: "staging" | "local" | "production" | "unknown";
  productionBlocked: boolean;
  eventWritesEnabled: boolean;
  rsvpWritesEnabled: boolean;
  attendanceImportEnabled: boolean;
  enabledOperations: number;
  detail: string;
};

export type LumaLivePilotFetch = (
  input: string,
  init: {
    method: "GET" | "POST";
    headers: Record<string, string>;
    body?: string;
    cache: "no-store";
  },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export type LumaEventUpsertInput = {
  eventId?: string | null;
  chapterId?: string | null;
  chapterName?: string | null;
  name: string;
  startAt: string;
  endAt?: string | null;
  timezone: string;
  address?: string | null;
  descriptionMd?: string | null;
};

export type LumaRsvpWriteInput = {
  eventId: string;
  email: string;
  name?: string | null;
};

export type LumaAttendanceImportInput = {
  eventId: string;
  limit?: number;
};

export type LumaLivePilotResult = {
  ok: boolean;
  operation: "event_create" | "event_update" | "rsvp_write" | "attendance_import";
  status: "executed" | "blocked" | "failed";
  safeMessage: string;
  externalWrites: number;
  externalReads: number;
  eventId: string | null;
  eventUrl: string | null;
  attendanceRows: LumaImportedAttendanceRow[];
  secretsReturned: false;
};

export type LumaImportedAttendanceRow = {
  guestId: string;
  emailHint: string;
  name: string | null;
  approvalStatus: string;
  checkedInAt: string | null;
  attended: boolean;
};

export type LumaImportedAttendanceRawRow = {
  guestId: string;
  email: string | null;
  name: string | null;
  approvalStatus: string;
  checkedInAt: string | null;
  attended: boolean;
};

type LumaJson = Record<string, unknown>;

type LumaLivePilotGateOptions = {
  rolloutFlags?: LumaLivePilotRolloutFlags;
  rolloutFallback?: string;
  chapterCalendarDetail?: string;
};

const LUMA_API_BASE = "https://public-api.luma.com/v1";

const lumaFeatureFlagKeys = [
  "luma_event_create",
  "luma_event_update",
  "luma_rsvp_writeback",
  "luma_attendance_import",
] as const satisfies readonly FeatureFlagKey[];

export function getLumaLivePilotGate(
  env: LumaLivePilotEnv = process.env as LumaLivePilotEnv,
  options: LumaLivePilotGateOptions = {},
): LumaLivePilotGate {
  const apiKeyConfigured = Boolean(env.LUMA_API_KEY?.trim());
  const calendarIdConfigured = Boolean(env.LUMA_CALENDAR_ID?.trim());
  const environment = normalizeEnvironment(env);
  const productionBlocked =
    env.VERCEL_ENV === "production" || environment === "production";
  const rolloutFlags = options.rolloutFlags ?? getEnvRolloutFlags(env);
  const baseEnabled =
    env.MYMEDLIFE_ENABLE_LUMA_WRITES === "true" &&
    apiKeyConfigured &&
    calendarIdConfigured &&
    environment === "staging" &&
    !productionBlocked;

  const eventWritesEnabled =
    baseEnabled &&
    env.MYMEDLIFE_ENABLE_LUMA_EVENT_WRITES === "true" &&
    (rolloutFlags.eventCreateEnabled || rolloutFlags.eventUpdateEnabled);
  const rsvpWritesEnabled =
    baseEnabled &&
    env.MYMEDLIFE_ENABLE_LUMA_RSVP_WRITES === "true" &&
    rolloutFlags.rsvpWritebackEnabled;
  const attendanceImportEnabled =
    baseEnabled &&
    env.MYMEDLIFE_ENABLE_LUMA_ATTENDANCE_IMPORT === "true" &&
    rolloutFlags.attendanceImportEnabled;
  const enabledOperations = [
    eventWritesEnabled,
    rsvpWritesEnabled,
    attendanceImportEnabled,
  ].filter(Boolean).length;
  const chapterCalendarDetail =
    options.chapterCalendarDetail ??
    getChapterLumaCalendarSummary(env).detail;

  return {
    apiKeyConfigured,
    calendarIdConfigured,
    environment,
    productionBlocked,
    eventWritesEnabled,
    rsvpWritesEnabled,
    attendanceImportEnabled,
    enabledOperations,
    detail: getGateDetail({
      apiKeyConfigured,
      calendarIdConfigured,
      environment,
      productionBlocked,
      eventWritesEnabled,
      rsvpWritesEnabled,
      attendanceImportEnabled,
      baseWritesFlag: env.MYMEDLIFE_ENABLE_LUMA_WRITES === "true",
      rolloutFlags,
      rolloutFallback: options.rolloutFallback,
      chapterCalendarDetail,
    }),
  };
}

export async function getLumaLivePilotGateDurable(
  env: LumaLivePilotEnv = process.env as LumaLivePilotEnv,
): Promise<LumaLivePilotGate> {
  const [rolloutFlags, persistedCalendarRows] = await Promise.all([
    getDurableLumaRolloutFlags(env),
    getPersistedChapterLumaCalendarRows(env),
  ]);

  return getLumaLivePilotGate(env, {
    rolloutFlags,
    rolloutFallback:
      rolloutFlags.source === "supabase"
        ? undefined
        : "Luma rollout flags are still in the safe default posture until DS/Admin feature flags are recorded.",
    chapterCalendarDetail: getChapterLumaCalendarSummary({
      env,
      persistedRows: persistedCalendarRows,
    }).detail,
  });
}

export async function createOrUpdateLumaEvent(
  input: LumaEventUpsertInput,
  options: {
    env?: LumaLivePilotEnv;
    fetchImpl?: LumaLivePilotFetch;
    rolloutFlags?: LumaLivePilotRolloutFlags;
    persistedCalendarRows?: readonly ChapterLumaCalendarRow[];
  } = {},
): Promise<LumaLivePilotResult> {
  const resolvedEnv =
    options.env ?? (process.env as LumaLivePilotEnv);
  const [rolloutFlags, persistedCalendarRows] = await Promise.all([
    options.rolloutFlags
      ? Promise.resolve(options.rolloutFlags)
      : getDurableLumaRolloutFlags(resolvedEnv),
    options.persistedCalendarRows
      ? Promise.resolve([...options.persistedCalendarRows])
      : getPersistedChapterLumaCalendarRows(resolvedEnv),
  ]);
  const gate = getLumaLivePilotGate(resolvedEnv, {
    rolloutFlags,
    chapterCalendarDetail: getChapterLumaCalendarSummary({
      env: resolvedEnv,
      persistedRows: persistedCalendarRows,
    }).detail,
  });
  const eventId = normalizeOptionalString(input.eventId);
  const operation = eventId ? "event_update" : "event_create";
  const chapterCalendar = resolveChapterLumaCalendar(
    {
      chapterId: input.chapterId,
      chapterName: input.chapterName,
      allowSharedDefaultFallback: shouldAllowSharedDefaultFallback(input),
    },
    {
      env: resolvedEnv,
      persistedRows: persistedCalendarRows,
    },
  );

  if (!gate.eventWritesEnabled) {
    return blockedResult(
      operation,
      "Luma event create/update is not enabled for this staging environment.",
    );
  }

  if (operation === "event_create" && !rolloutFlags.eventCreateEnabled) {
    return blockedResult(
      operation,
      "Turn on the Luma event create rollout flag in staging before creating events.",
    );
  }

  if (operation === "event_update" && !rolloutFlags.eventUpdateEnabled) {
    return blockedResult(
      operation,
      "Turn on the Luma event update rollout flag in staging before updating events.",
    );
  }

  if (!chapterCalendar || !chapterCalendar.readyForPilot) {
    return blockedResult(
      operation,
      "Select a chapter with a ready Luma calendar before running event create/update.",
    );
  }

  const apiKey = requireApiKey(resolvedEnv);
  const body = sanitizeEventPayload(input, eventId);
  const endpoint = `${LUMA_API_BASE}/events/${eventId ? "update" : "create"}`;
  const result = await postLuma(endpoint, body, apiKey, operation, options.fetchImpl);

  if (!result.ok) {
    return result;
  }

  return {
    ...result,
    safeMessage: `${result.safeMessage} Chapter mapping: ${chapterCalendar.chapterName} (${chapterCalendar.calendarLabel}).`,
  };
}

export async function writeLumaRsvp(
  input: LumaRsvpWriteInput,
  options: {
    env?: LumaLivePilotEnv;
    fetchImpl?: LumaLivePilotFetch;
    rolloutFlags?: LumaLivePilotRolloutFlags;
    sleepImpl?: (ms: number) => Promise<void>;
  } = {},
): Promise<LumaLivePilotResult> {
  const rolloutFlags =
    options.rolloutFlags ?? (await getDurableLumaRolloutFlags(options.env));
  const gate = getLumaLivePilotGate(options.env, {
    rolloutFlags,
  });

  if (!gate.rsvpWritesEnabled) {
    return blockedResult(
      "rsvp_write",
      "Luma RSVP writeback is not enabled for this staging environment.",
    );
  }

  if (!rolloutFlags.rsvpWritebackEnabled) {
    return blockedResult(
      "rsvp_write",
      "Turn on the Luma RSVP writeback rollout flag in staging before writing RSVPs.",
    );
  }

  const apiKey = requireApiKey(options.env);
  const body = {
    event_id: requireNonEmpty(input.eventId, "event_id"),
    guests: [
      {
        email: requireNonEmpty(input.email, "email"),
        ...(normalizeOptionalString(input.name)
          ? { name: normalizeOptionalString(input.name) }
          : {}),
      },
    ],
    approval_status: "approved",
    send_email: false,
  };

  const result = await postLuma(
    `${LUMA_API_BASE}/events/guests/add`,
    body,
    apiKey,
    "rsvp_write",
    options.fetchImpl,
  );

  if (!result.ok) {
    return result;
  }

  const guestVisible = await verifyLumaGuestAfterRsvp(
    {
      eventId: input.eventId,
      email: input.email,
    },
    {
      apiKey,
      fetchImpl: options.fetchImpl,
      sleepImpl: options.sleepImpl,
    },
  );

  if (!guestVisible.ok) {
    return failedResult("rsvp_write", guestVisible.safeMessage);
  }

  return {
    ...result,
    eventId: requireNonEmpty(input.eventId, "event_id"),
    externalReads: guestVisible.externalReads,
  };
}

export async function importLumaAttendance(
  input: LumaAttendanceImportInput,
  options: {
    env?: LumaLivePilotEnv;
    fetchImpl?: LumaLivePilotFetch;
    onImportedRows?: (rows: LumaImportedAttendanceRawRow[]) => void;
    rolloutFlags?: LumaLivePilotRolloutFlags;
  } = {},
): Promise<LumaLivePilotResult> {
  const rolloutFlags =
    options.rolloutFlags ?? (await getDurableLumaRolloutFlags(options.env));
  const gate = getLumaLivePilotGate(options.env, {
    rolloutFlags,
  });

  if (!gate.attendanceImportEnabled) {
    return blockedResult(
      "attendance_import",
      "Luma attendance import is not enabled for this staging environment.",
    );
  }

  if (!rolloutFlags.attendanceImportEnabled) {
    return blockedResult(
      "attendance_import",
      "Turn on the Luma attendance import rollout flag in staging before importing guests.",
    );
  }

  const apiKey = requireApiKey(options.env);
  const endpoint = buildLumaGuestListEndpoint(input.eventId, input.limit);

  try {
    const response = await (options.fetchImpl ?? fetch)(endpoint, {
      method: "GET",
      headers: {
        "x-luma-api-key": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return failedResult(
        "attendance_import",
        getSafeLumaFailureMessage(response.status, "Attendance import"),
      );
    }

    const payload = (await response.json()) as { entries?: unknown[] };
    const rawRows = Array.isArray(payload.entries)
      ? payload.entries.map(toRawAttendanceRow)
      : [];
    options.onImportedRows?.(rawRows);
    const attendanceRows = rawRows.map(toMaskedAttendanceRow);
    const attendedCount = attendanceRows.filter((row) => row.attended).length;

    return {
      ok: true,
      operation: "attendance_import",
      status: "executed",
      safeMessage: `Imported ${attendanceRows.length} approved Luma guest row(s); ${attendedCount} row(s) include check-in attendance.`,
      externalWrites: 0,
      externalReads: 1,
      eventId: input.eventId,
      eventUrl: null,
      attendanceRows,
      secretsReturned: false,
    };
  } catch {
    return failedResult(
      "attendance_import",
      "Attendance import failed before returning a safe Luma guest snapshot.",
    );
  }
}

export function buildLumaGuestListEndpoint(eventId: string, limit = 50): string {
  const url = new URL(`${LUMA_API_BASE}/events/guests/list`);
  url.searchParams.set("event_id", requireNonEmpty(eventId, "event_id"));
  url.searchParams.set("approval_status", "approved");
  url.searchParams.set("pagination_limit", String(clampLimit(limit)));
  url.searchParams.set("sort_column", "checked_in_at");
  url.searchParams.set("sort_direction", "desc nulls last");
  return url.toString();
}

async function postLuma(
  endpoint: string,
  body: LumaJson,
  apiKey: string,
  operation: LumaLivePilotResult["operation"],
  fetchImpl?: LumaLivePilotFetch,
): Promise<LumaLivePilotResult> {
  try {
    const response = await (fetchImpl ?? fetch)(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-luma-api-key": apiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      return failedResult(
        operation,
        getSafeLumaFailureMessage(response.status, getOperationLabel(operation)),
      );
    }

    const payload = (await response.json()) as LumaJson;
    const eventId =
      stringOrNull(payload.id) ??
      stringOrNull(payload.event_id) ??
      stringOrNull(body.event_id);

    return {
      ok: true,
      operation,
      status: "executed",
      safeMessage: getSuccessMessage(operation),
      externalWrites: 1,
      externalReads: 0,
      eventId,
      eventUrl: stringOrNull(payload.url),
      attendanceRows: [],
      secretsReturned: false,
    };
  } catch {
    return failedResult(
      operation,
      `${getOperationLabel(operation)} failed before returning a safe response.`,
    );
  }
}

async function verifyLumaGuestAfterRsvp(
  input: Pick<LumaRsvpWriteInput, "eventId" | "email">,
  options: {
    apiKey: string;
    fetchImpl?: LumaLivePilotFetch;
    sleepImpl?: (ms: number) => Promise<void>;
  },
): Promise<{ ok: boolean; safeMessage: string; externalReads: number }> {
  const normalizedEmail = normalizeEmail(input.email);
  const endpoint = buildLumaGuestListEndpoint(input.eventId, 100);
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleepImpl = options.sleepImpl ?? sleep;
  let externalReads = 0;

  for (const delayMs of [0, 750, 1500]) {
    if (delayMs > 0) {
      await sleepImpl(delayMs);
    }

    try {
      const response = await fetchImpl(endpoint, {
        method: "GET",
        headers: {
          "x-luma-api-key": options.apiKey,
        },
        cache: "no-store",
      });
      externalReads += 1;

      if (!response.ok) {
        return {
          ok: false,
          safeMessage: getSafeLumaFailureMessage(response.status, "Luma RSVP verification"),
          externalReads,
        };
      }

      const payload = (await response.json()) as { entries?: unknown[] };
      const rawRows = Array.isArray(payload.entries)
        ? payload.entries.map(toRawAttendanceRow)
        : [];

      if (
        rawRows.some((row) => row.email && normalizeEmail(row.email) === normalizedEmail)
      ) {
        return {
          ok: true,
          safeMessage: "Verified the RSVP guest in the approved Luma guest list.",
          externalReads,
        };
      }
    } catch {
      return {
        ok: false,
        safeMessage:
          "Luma RSVP verification failed before the approved guest list could be checked safely.",
        externalReads,
      };
    }
  }

  return {
    ok: false,
    safeMessage:
      "Luma accepted the RSVP request, but the guest did not appear in the approved guest list. Retry after the event settles or review the event's guest settings before treating this as a live pilot pass.",
    externalReads,
  };
}

function sanitizeEventPayload(
  input: LumaEventUpsertInput,
  eventId: string | null,
): LumaJson {
  return {
    ...(eventId ? { event_id: eventId, suppress_notifications: true } : {}),
    name: requireNonEmpty(input.name, "name"),
    start_at: requireNonEmpty(input.startAt, "start_at"),
    timezone: requireNonEmpty(input.timezone, "timezone"),
    ...(normalizeOptionalString(input.endAt)
      ? { end_at: normalizeOptionalString(input.endAt) }
      : {}),
    ...(normalizeOptionalString(input.address)
      ? {
          geo_address_json: {
            type: "manual",
            address: normalizeOptionalString(input.address),
          },
        }
      : {}),
    ...(normalizeOptionalString(input.descriptionMd)
      ? { description_md: normalizeOptionalString(input.descriptionMd) }
      : {}),
    visibility: "public",
  };
}

function toRawAttendanceRow(value: unknown): LumaImportedAttendanceRawRow {
  const row = isRecord(value) ? value : {};
  const checkedInAt = stringOrNull(row.checked_in_at);
  return {
    guestId: stringOrFallback(row.id, "unknown-guest"),
    email: stringOrNull(row.user_email),
    name: stringOrNull(row.user_name),
    approvalStatus: stringOrFallback(row.approval_status, "unknown"),
    checkedInAt,
    attended: Boolean(checkedInAt),
  };
}

function toMaskedAttendanceRow(
  value: LumaImportedAttendanceRawRow,
): LumaImportedAttendanceRow {
  return {
    guestId: value.guestId,
    emailHint: maskEmail(value.email),
    name: value.name,
    approvalStatus: value.approvalStatus,
    checkedInAt: value.checkedInAt,
    attended: value.attended,
  };
}

function blockedResult(
  operation: LumaLivePilotResult["operation"],
  safeMessage: string,
): LumaLivePilotResult {
  return {
    ok: false,
    operation,
    status: "blocked",
    safeMessage,
    externalWrites: 0,
    externalReads: 0,
    eventId: null,
    eventUrl: null,
    attendanceRows: [],
    secretsReturned: false,
  };
}

function failedResult(
  operation: LumaLivePilotResult["operation"],
  safeMessage: string,
): LumaLivePilotResult {
  return {
    ...blockedResult(operation, safeMessage),
    status: "failed",
  };
}

function normalizeEnvironment(
  env: LumaLivePilotEnv = process.env as LumaLivePilotEnv,
) {
  switch (env.MYMEDLIFE_LUMA_ENVIRONMENT) {
    case "staging":
    case "local":
    case "production":
      return env.MYMEDLIFE_LUMA_ENVIRONMENT;
    default:
      return "unknown";
  }
}

function getGateDetail(input: {
  apiKeyConfigured: boolean;
  calendarIdConfigured: boolean;
  environment: LumaLivePilotGate["environment"];
  productionBlocked: boolean;
  eventWritesEnabled: boolean;
  rsvpWritesEnabled: boolean;
  attendanceImportEnabled: boolean;
  baseWritesFlag: boolean;
  rolloutFlags: LumaLivePilotRolloutFlags;
  rolloutFallback?: string;
  chapterCalendarDetail: string;
}): string {
  if (input.productionBlocked) {
    return "Production Luma setup stays blocked. This live pilot can only run in the staging environment.";
  }

  if (!input.apiKeyConfigured || !input.calendarIdConfigured) {
    return "Luma API key and calendar id must both be configured server-side before staging writes or imports can run.";
  }

  if (input.environment !== "staging") {
    return "Set MYMEDLIFE_LUMA_ENVIRONMENT=staging before enabling Luma staging write/import controls.";
  }

  if (!input.baseWritesFlag) {
    return "Set MYMEDLIFE_ENABLE_LUMA_WRITES=true before enabling individual staging Luma operations.";
  }

  if (
    !input.rolloutFlags.eventCreateEnabled &&
    !input.rolloutFlags.eventUpdateEnabled &&
    !input.rolloutFlags.rsvpWritebackEnabled &&
    !input.rolloutFlags.attendanceImportEnabled
  ) {
    return (
      input.rolloutFallback ??
      "Staging Luma rollout flags are still off in /admin/feature-flags, so no Luma API calls can run."
    );
  }

  return [
    input.eventWritesEnabled ? "event create/update on" : "event create/update off",
    input.rsvpWritesEnabled ? "RSVP writeback on" : "RSVP writeback off",
    input.attendanceImportEnabled ? "attendance import on" : "attendance import off",
    "n8n and production Luma remain off",
    input.chapterCalendarDetail,
  ].join("; ");
}

function getEnvRolloutFlags(
  env: LumaLivePilotEnv = process.env as LumaLivePilotEnv,
): LumaLivePilotRolloutFlags {
  const eventWritesEnabled = env.MYMEDLIFE_ENABLE_LUMA_EVENT_WRITES === "true";

  return {
    eventCreateEnabled: eventWritesEnabled,
    eventUpdateEnabled: eventWritesEnabled,
    rsvpWritebackEnabled: env.MYMEDLIFE_ENABLE_LUMA_RSVP_WRITES === "true",
    attendanceImportEnabled: env.MYMEDLIFE_ENABLE_LUMA_ATTENDANCE_IMPORT === "true",
    source: "env",
  };
}

async function getDurableLumaRolloutFlags(
  env: LumaLivePilotEnv | undefined,
): Promise<LumaLivePilotRolloutFlags> {
  const environment = normalizeEnvironment(env ?? (process.env as LumaLivePilotEnv));
  const defaults = getDefaultRolloutFlags(environment);

  if (environment === "unknown") {
    return defaults;
  }

  try {
    const { client } = await createLocalSupabaseServerClient(
      env as Record<string, string | undefined> | undefined,
    );

    if (!client) {
      return defaults;
    }

    const result = await client
      .schema("app")
      .from("feature_flags")
      .select("flag_key, enabled")
      .eq("environment", environment)
      .in("flag_key", [...lumaFeatureFlagKeys]);

    if (result.error) {
      return defaults;
    }

    const rows = (result.data ?? []) as Array<
      Pick<FeatureFlagRow, "flag_key" | "enabled">
    >;
    const enabledByKey = new Map<string, boolean>(
      rows.map((row) => [row.flag_key, row.enabled]),
    );

    return {
      eventCreateEnabled: enabledByKey.get("luma_event_create") ?? defaults.eventCreateEnabled,
      eventUpdateEnabled: enabledByKey.get("luma_event_update") ?? defaults.eventUpdateEnabled,
      rsvpWritebackEnabled:
        enabledByKey.get("luma_rsvp_writeback") ?? defaults.rsvpWritebackEnabled,
      attendanceImportEnabled:
        enabledByKey.get("luma_attendance_import") ?? defaults.attendanceImportEnabled,
      source: "supabase",
    };
  } catch {
    return defaults;
  }
}

function getDefaultRolloutFlags(
  environment: RolloutEnvironment | "unknown",
): LumaLivePilotRolloutFlags {
  if (environment === "unknown") {
    return {
      eventCreateEnabled: false,
      eventUpdateEnabled: false,
      rsvpWritebackEnabled: false,
      attendanceImportEnabled: false,
      source: "defaults",
    };
  }

  return {
    eventCreateEnabled: getFeatureFlagDefault("luma_event_create", environment),
    eventUpdateEnabled: getFeatureFlagDefault("luma_event_update", environment),
    rsvpWritebackEnabled: getFeatureFlagDefault("luma_rsvp_writeback", environment),
    attendanceImportEnabled: getFeatureFlagDefault(
      "luma_attendance_import",
      environment,
    ),
    source: "defaults",
  };
}

function getFeatureFlagDefault(
  key: FeatureFlagKey,
  environment: RolloutEnvironment,
) {
  return getFeatureFlagDefinition(key)?.defaultEnabledByEnvironment[environment] ?? false;
}

function requireApiKey(
  env: LumaLivePilotEnv = process.env as LumaLivePilotEnv,
): string {
  return requireNonEmpty(env.LUMA_API_KEY, "LUMA_API_KEY");
}

function requireNonEmpty(value: string | null | undefined, label: string): string {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function shouldAllowSharedDefaultFallback(input: LumaEventUpsertInput) {
  return !normalizeOptionalString(input.chapterId) && !normalizeOptionalString(input.chapterName);
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null;
}

function stringOrFallback(value: unknown, fallback: string): string {
  return stringOrNull(value) ?? fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function maskEmail(email: string | null): string {
  if (!email) {
    return "unknown";
  }

  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "masked";
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return 50;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 100);
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getSafeLumaFailureMessage(status: number, label: string): string {
  if (status === 401 || status === 403) {
    return `${label} returned HTTP ${status}. Refresh the staging Luma credential or API permissions before retrying.`;
  }

  if (status === 429) {
    return `${label} returned HTTP 429. Wait before retrying the Luma staging pilot.`;
  }

  return `${label} returned HTTP ${status}.`;
}

function getOperationLabel(operation: LumaLivePilotResult["operation"]): string {
  switch (operation) {
    case "event_create":
      return "Luma event creation";
    case "event_update":
      return "Luma event update";
    case "rsvp_write":
      return "Luma RSVP writeback";
    case "attendance_import":
      return "Luma attendance import";
  }
}

function getSuccessMessage(operation: LumaLivePilotResult["operation"]): string {
  switch (operation) {
    case "event_create":
      return "Created a Luma event from myMEDLIFE staging.";
    case "event_update":
      return "Updated a Luma event from myMEDLIFE staging with notifications suppressed.";
    case "rsvp_write":
      return "Wrote one RSVP guest to Luma from myMEDLIFE staging with Luma email sending off.";
    case "attendance_import":
      return "Imported Luma attendance into a browser-safe staging readback.";
  }
}
