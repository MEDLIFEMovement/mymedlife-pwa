export type LumaCalendarReadinessStatus =
  | "missing_config"
  | "ready"
  | "api_error";

export type LumaCalendarReadinessEvent = {
  id: string;
  apiId: string | null;
  title: string;
  url: string | null;
  startAt: string | null;
  endAt: string | null;
  timezone: string | null;
  visibility: string | null;
  locationType: string | null;
};

export type LumaCalendarReadinessSnapshot = {
  status: LumaCalendarReadinessStatus;
  calendarId: string | null;
  apiKeyConfigured: boolean;
  endpoint: string | null;
  eventCount: number;
  hasMore: boolean;
  safeEvents: LumaCalendarReadinessEvent[];
  writesEnabled: false;
  externalWritesEnabled: 0;
  attendeeDataReturned: false;
  secretReturned: false;
  detail: string;
};

type LumaCalendarApiEntry = {
  id?: unknown;
  api_id?: unknown;
  name?: unknown;
  url?: unknown;
  start_at?: unknown;
  end_at?: unknown;
  timezone?: unknown;
  visibility?: unknown;
  location_type?: unknown;
};

type LumaCalendarApiResponse = {
  entries?: LumaCalendarApiEntry[];
  has_more?: boolean;
  message?: unknown;
};

type FetchResponseLike = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

export type LumaCalendarFetch = (
  input: string,
  init: {
    headers: Record<string, string>;
    cache: "no-store";
  },
) => Promise<FetchResponseLike>;

const LUMA_API_BASE = "https://public-api.luma.com/v1";

export async function getLumaCalendarReadinessSnapshot(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: LumaCalendarFetch;
  limit?: number;
}): Promise<LumaCalendarReadinessSnapshot> {
  const env = options?.env ?? process.env;
  const apiKey = env.LUMA_API_KEY?.trim();
  const calendarId = env.LUMA_CALENDAR_ID?.trim() || null;
  const limit = clampLimit(options?.limit ?? 10);

  if (!apiKey || !calendarId) {
    return {
      status: "missing_config",
      calendarId,
      apiKeyConfigured: Boolean(apiKey),
      endpoint: null,
      eventCount: 0,
      hasMore: false,
      safeEvents: [],
      writesEnabled: false,
      externalWritesEnabled: 0,
      attendeeDataReturned: false,
      secretReturned: false,
      detail:
        "Luma read-only import is not configured until LUMA_API_KEY and LUMA_CALENDAR_ID are both present in the server environment.",
    };
  }

  const endpoint = buildLumaCalendarEventsEndpoint(calendarId, limit);

  try {
    const response = await (options?.fetchImpl ?? fetch)(endpoint, {
      headers: {
        "x-luma-api-key": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return apiErrorSnapshot({
        calendarId,
        endpoint,
        apiKeyConfigured: true,
        detail: `Luma calendar read returned HTTP ${response.status}.`,
      });
    }

    const payload = (await response.json()) as LumaCalendarApiResponse;
    const entries = Array.isArray(payload.entries) ? payload.entries : [];
    const safeEvents = entries.map(toSafeLumaEvent);

    return {
      status: "ready",
      calendarId,
      apiKeyConfigured: true,
      endpoint,
      eventCount: safeEvents.length,
      hasMore: payload.has_more === true,
      safeEvents,
      writesEnabled: false,
      externalWritesEnabled: 0,
      attendeeDataReturned: false,
      secretReturned: false,
      detail:
        "Luma read-only calendar access is configured. Event creation, RSVP writes, attendance imports, reminders, webhooks, and external sends remain disabled.",
    };
  } catch {
    return apiErrorSnapshot({
      calendarId,
      endpoint,
      apiKeyConfigured: true,
      detail: "Luma calendar read failed before returning a safe event snapshot.",
    });
  }
}

export function buildLumaCalendarEventsEndpoint(
  calendarId: string,
  limit = 10,
): string {
  const url = new URL(`${LUMA_API_BASE}/calendar/list-events`);
  url.searchParams.set("calendar_api_id", calendarId);
  url.searchParams.set("pagination_limit", String(clampLimit(limit)));
  return url.toString();
}

function toSafeLumaEvent(
  entry: LumaCalendarApiEntry,
): LumaCalendarReadinessEvent {
  return {
    id: stringOrFallback(entry.id, "unknown-event"),
    apiId: stringOrNull(entry.api_id),
    title: stringOrFallback(entry.name, "Untitled Luma event"),
    url: stringOrNull(entry.url),
    startAt: stringOrNull(entry.start_at),
    endAt: stringOrNull(entry.end_at),
    timezone: stringOrNull(entry.timezone),
    visibility: stringOrNull(entry.visibility),
    locationType: stringOrNull(entry.location_type),
  };
}

function apiErrorSnapshot(input: {
  calendarId: string;
  endpoint: string;
  apiKeyConfigured: boolean;
  detail: string;
}): LumaCalendarReadinessSnapshot {
  return {
    status: "api_error",
    calendarId: input.calendarId,
    apiKeyConfigured: input.apiKeyConfigured,
    endpoint: input.endpoint,
    eventCount: 0,
    hasMore: false,
    safeEvents: [],
    writesEnabled: false,
    externalWritesEnabled: 0,
    attendeeDataReturned: false,
    secretReturned: false,
    detail: input.detail,
  };
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null;
}

function stringOrFallback(value: unknown, fallback: string): string {
  return stringOrNull(value) ?? fallback;
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return 10;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 50);
}
