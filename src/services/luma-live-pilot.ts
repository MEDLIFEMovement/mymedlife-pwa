import {
  getFeatureResolvedState,
  getFeatureResolvedStateDurable,
  isFeatureEnabled,
} from "@/modules/feature-flags";

export type LumaLivePilotEnv = {
  LUMA_API_KEY?: string;
  LUMA_CALENDAR_ID?: string;
  MYMEDLIFE_ENABLE_LUMA_WRITES?: string;
  MYMEDLIFE_ENABLE_LUMA_EVENT_WRITES?: string;
  MYMEDLIFE_ENABLE_LUMA_RSVP_WRITES?: string;
  MYMEDLIFE_ENABLE_LUMA_ATTENDANCE_IMPORT?: string;
  MYMEDLIFE_LUMA_ENVIRONMENT?: string;
  VERCEL_ENV?: string;
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

type LumaJson = Record<string, unknown>;
type LumaLivePilotGateOptions = {
  lumaFeatureEnabled?: boolean;
  lumaFeatureFallback?: string;
};

const LUMA_API_BASE = "https://public-api.luma.com/v1";

export function getLumaLivePilotGate(
  env: LumaLivePilotEnv = process.env as LumaLivePilotEnv,
  options: LumaLivePilotGateOptions = {},
): LumaLivePilotGate {
  const apiKeyConfigured = Boolean(env.LUMA_API_KEY?.trim());
  const calendarIdConfigured = Boolean(env.LUMA_CALENDAR_ID?.trim());
  const environment = normalizeEnvironment(env);
  const productionBlocked = env.VERCEL_ENV === "production" || environment === "production";
  const lumaFeatureEnabled =
    options.lumaFeatureEnabled ?? isFeatureEnabled("integration_luma", { env });
  const baseEnabled =
    env.MYMEDLIFE_ENABLE_LUMA_WRITES === "true" &&
    apiKeyConfigured &&
    calendarIdConfigured &&
    environment === "staging" &&
    !productionBlocked &&
    lumaFeatureEnabled;

  const eventWritesEnabled =
    baseEnabled && env.MYMEDLIFE_ENABLE_LUMA_EVENT_WRITES === "true";
  const rsvpWritesEnabled =
    baseEnabled && env.MYMEDLIFE_ENABLE_LUMA_RSVP_WRITES === "true";
  const attendanceImportEnabled =
    baseEnabled && env.MYMEDLIFE_ENABLE_LUMA_ATTENDANCE_IMPORT === "true";
  const enabledOperations = [
    eventWritesEnabled,
    rsvpWritesEnabled,
    attendanceImportEnabled,
  ].filter(Boolean).length;

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
      lumaFeatureEnabled,
      lumaFeatureFallback: options.lumaFeatureFallback,
    }),
  };
}

export async function getLumaLivePilotGateDurable(
  env: LumaLivePilotEnv = process.env as LumaLivePilotEnv,
): Promise<LumaLivePilotGate> {
  const featureState = await getDurableLumaFeatureState(env);

  return getLumaLivePilotGate(env, {
    lumaFeatureEnabled: featureState.enabled,
    lumaFeatureFallback: featureState.gracefulFallback,
  });
}

export async function createOrUpdateLumaEvent(
  input: LumaEventUpsertInput,
  options: {
    env?: LumaLivePilotEnv;
    fetchImpl?: LumaLivePilotFetch;
  } = {},
): Promise<LumaLivePilotResult> {
  const featureState = await getDurableLumaFeatureState(options.env);
  const gate = getLumaLivePilotGate(options.env, {
    lumaFeatureEnabled: featureState.enabled,
    lumaFeatureFallback: featureState.gracefulFallback,
  });
  const eventId = normalizeOptionalString(input.eventId);
  const operation = eventId ? "event_update" : "event_create";

  if (!featureState.enabled) {
    return blockedResult(operation, featureState.gracefulFallback);
  }

  if (!gate.eventWritesEnabled) {
    return blockedResult(operation, "Luma event create/update is not enabled for this staging environment.");
  }

  const apiKey = requireApiKey(options.env);
  const body = sanitizeEventPayload(input, eventId);
  const endpoint = `${LUMA_API_BASE}/events/${eventId ? "update" : "create"}`;

  return postLuma(endpoint, body, apiKey, operation, options.fetchImpl);
}

export async function writeLumaRsvp(
  input: LumaRsvpWriteInput,
  options: {
    env?: LumaLivePilotEnv;
    fetchImpl?: LumaLivePilotFetch;
  } = {},
): Promise<LumaLivePilotResult> {
  const featureState = await getDurableLumaFeatureState(options.env);
  const gate = getLumaLivePilotGate(options.env, {
    lumaFeatureEnabled: featureState.enabled,
    lumaFeatureFallback: featureState.gracefulFallback,
  });

  if (!featureState.enabled) {
    return blockedResult("rsvp_write", featureState.gracefulFallback);
  }

  if (!gate.rsvpWritesEnabled) {
    return blockedResult("rsvp_write", "Luma RSVP writeback is not enabled for this staging environment.");
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

  return postLuma(
    `${LUMA_API_BASE}/events/guests/add`,
    body,
    apiKey,
    "rsvp_write",
    options.fetchImpl,
  );
}

export async function importLumaAttendance(
  input: LumaAttendanceImportInput,
  options: {
    env?: LumaLivePilotEnv;
    fetchImpl?: LumaLivePilotFetch;
  } = {},
): Promise<LumaLivePilotResult> {
  const featureState = await getDurableLumaFeatureState(options.env);
  const gate = getLumaLivePilotGate(options.env, {
    lumaFeatureEnabled: featureState.enabled,
    lumaFeatureFallback: featureState.gracefulFallback,
  });

  if (!featureState.enabled) {
    return blockedResult("attendance_import", featureState.gracefulFallback);
  }

  if (!gate.attendanceImportEnabled) {
    return blockedResult("attendance_import", "Luma attendance import is not enabled for this staging environment.");
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
    const attendanceRows = Array.isArray(payload.entries)
      ? payload.entries.map(toAttendanceRow)
      : [];
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

function toAttendanceRow(value: unknown): LumaImportedAttendanceRow {
  const row = isRecord(value) ? value : {};
  const checkedInAt = stringOrNull(row.checked_in_at);
  return {
    guestId: stringOrFallback(row.id, "unknown-guest"),
    emailHint: maskEmail(stringOrNull(row.user_email)),
    name: stringOrNull(row.user_name),
    approvalStatus: stringOrFallback(row.approval_status, "unknown"),
    checkedInAt,
    attended: Boolean(checkedInAt),
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

function normalizeEnvironment(env: LumaLivePilotEnv) {
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
  lumaFeatureEnabled: boolean;
  lumaFeatureFallback?: string;
}): string {
  if (input.productionBlocked) {
    return "Production Luma setup stays blocked. This live pilot can only run in the staging environment.";
  }

  if (!input.lumaFeatureEnabled) {
    return input.lumaFeatureFallback ??
      "The integration_luma feature flag is disabled, so no Luma API calls can run.";
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

  return [
    input.eventWritesEnabled ? "event create/update on" : "event create/update off",
    input.rsvpWritesEnabled ? "RSVP writeback on" : "RSVP writeback off",
    input.attendanceImportEnabled ? "attendance import on" : "attendance import off",
    "n8n and production Luma remain off",
  ].join("; ");
}

async function getDurableLumaFeatureState(
  env: LumaLivePilotEnv | undefined,
) {
  try {
    return await getFeatureResolvedStateDurable("integration_luma", { env });
  } catch {
    return {
      ...getFeatureResolvedState("integration_luma", { env }),
      enabled: false,
      status: "emergency_disabled" as const,
      reason:
        "Luma feature flag could not be verified from durable controls.",
      gracefulFallback:
        "Luma feature flag could not be verified from durable controls, so no Luma API calls can run.",
    };
  }
}

function requireApiKey(env: LumaLivePilotEnv = process.env as LumaLivePilotEnv): string {
  return requireNonEmpty(env.LUMA_API_KEY, "LUMA_API_KEY");
}

function requireNonEmpty(value: string | null | undefined, label: string): string {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
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
