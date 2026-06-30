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
  status: "executed" | "blocked" | "failed" | "pending_verification";
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
    sleepImpl?: (ms: number) => Promise<void>;
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

  const verification = await verifyLumaGuestAfterRsvp(
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

  if (!verification.verified) {
    if (verification.pendingVerification) {
      return pendingVerificationResult(
        "rsvp_write",
        verification.failedReason ??
          "Luma accepted the RSVP request, but the guest did not appear in the approved guest list yet. Review guest visibility before treating this as a live pilot pass.",
        {
          eventId: input.eventId,
          externalReads: verification.externalReads,
        },
      );
    }

    return failedResult(
      "rsvp_write",
      verification.failedReason ??
        "Luma RSVP verification failed before the approved guest list could be checked safely.",
    );
  }

  return {
    ...result,
    externalReads: verification.externalReads,
  };
}

export async function importLumaAttendance(
  input: LumaAttendanceImportInput,
  options: {
    env?: LumaLivePilotEnv;
    fetchImpl?: LumaLivePilotFetch;
    onImportedRows?: (rows: LumaImportedAttendanceRawRow[]) => void;
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

    const payload = (await response.json()) as LumaJson;
    const rawRows = getAttendanceEntries(payload).map(toRawAttendanceRow);
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
  input: {
    eventId: string;
    email: string;
  },
  options: {
    apiKey: string;
    fetchImpl?: LumaLivePilotFetch;
    sleepImpl?: (ms: number) => Promise<void>;
  },
): Promise<{
  verified: boolean;
  externalReads: number;
  pendingVerification?: boolean;
  failedReason?: string;
}> {
  const endpoint = buildLumaGuestListEndpoint(input.eventId, 100);
  const targetEmail = normalizeEmail(input.email);
  const delaysMs = [0, 750, 1500];
  let externalReads = 0;

  for (const delayMs of delaysMs) {
    if (delayMs > 0) {
      await (options.sleepImpl ?? sleep)(delayMs);
    }

    try {
      const response = await (options.fetchImpl ?? fetch)(endpoint, {
        method: "GET",
        headers: {
          "x-luma-api-key": options.apiKey,
        },
        cache: "no-store",
      });
      externalReads += 1;

      if (!response.ok) {
        return {
          verified: false,
          externalReads,
          failedReason: getSafeLumaFailureMessage(
            response.status,
            "Luma RSVP verification",
          ),
        };
      }

      const payload = (await response.json()) as LumaJson;
      const guestEmails = getAttendanceEntries(payload)
        .map(toRawAttendanceRow)
        .map((row) => normalizeEmail(row.email));

      if (guestEmails.includes(targetEmail)) {
        return {
          verified: true,
          externalReads,
        };
      }
    } catch {
      return {
        verified: false,
        externalReads,
        failedReason:
          "Luma RSVP verification failed before the approved guest list could be checked safely.",
      };
    }
  }

  return {
    verified: false,
    externalReads,
    pendingVerification: true,
    failedReason:
      "Luma accepted the RSVP request, but the guest did not appear in the approved guest list yet. Retry after the event settles or review the event's guest settings before treating this as a live pilot pass.",
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
  const guest = getNestedRecord(row, "guest");
  const user = getNestedRecord(guest ?? row, "user");
  const checkedInAt = resolveCheckedInAt(row, guest);
  const attended =
    Boolean(checkedInAt) ||
    getBooleanAttendanceFlag(row, guest) ||
    hasTicketCheckIn(row, guest);

  return {
    guestId: stringOrFallback(
      guest?.id ??
        guest?.api_id ??
        row.id ??
        row.api_id,
      "unknown-guest",
    ),
    email: stringOrNull(
      guest?.user_email ??
        guest?.userEmail ??
        guest?.email ??
        user?.email ??
        row.user_email ??
        row.userEmail ??
        row.email,
    ),
    name: stringOrNull(
      guest?.user_name ??
        guest?.userName ??
        guest?.name ??
        user?.name ??
        user?.full_name ??
        row.user_name ??
        row.userName ??
        row.name,
    ),
    approvalStatus: stringOrFallback(
      guest?.approval_status ??
        guest?.approvalStatus ??
        row.approval_status ??
        row.approvalStatus,
      "unknown",
    ),
    checkedInAt,
    attended,
  };
}

function getAttendanceEntries(payload: LumaJson): unknown[] {
  if (Array.isArray(payload.entries)) {
    return payload.entries;
  }

  if (Array.isArray(payload.guests)) {
    return payload.guests;
  }

  return [];
}

function resolveCheckedInAt(
  row: LumaJson,
  guest: LumaJson | null,
): string | null {
  return (
    stringOrNull(row.checked_in_at) ??
    stringOrNull(row.checkedInAt) ??
    stringOrNull(guest?.checked_in_at) ??
    stringOrNull(guest?.checkedInAt) ??
    findTicketCheckInAt(row) ??
    findTicketCheckInAt(guest)
  );
}

function hasTicketCheckIn(row: LumaJson, guest: LumaJson | null) {
  return Boolean(findTicketCheckInAt(row) ?? findTicketCheckInAt(guest));
}

function getBooleanAttendanceFlag(row: LumaJson, guest: LumaJson | null) {
  return (
    booleanOrFalse(row.checked_in) ||
    booleanOrFalse(row.checkedIn) ||
    booleanOrFalse(guest?.checked_in) ||
    booleanOrFalse(guest?.checkedIn)
  );
}

function findTicketCheckInAt(row: LumaJson | null): string | null {
  if (!row) {
    return null;
  }

  const ticketCollections = [
    row.event_tickets,
    row.eventTickets,
    row.tickets,
  ];

  for (const value of ticketCollections) {
    if (!Array.isArray(value)) {
      continue;
    }

    for (const ticket of value) {
      if (!isRecord(ticket)) {
        continue;
      }

      const checkedInAt =
        stringOrNull(ticket.checked_in_at) ??
        stringOrNull(ticket.checkedInAt);

      if (checkedInAt) {
        return checkedInAt;
      }
    }
  }

  return null;
}

function toMaskedAttendanceRow(value: LumaImportedAttendanceRawRow): LumaImportedAttendanceRow {
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

function pendingVerificationResult(
  operation: LumaLivePilotResult["operation"],
  safeMessage: string,
  input: {
    eventId: string | null;
    externalReads: number;
  },
): LumaLivePilotResult {
  return {
    ok: false,
    operation,
    status: "pending_verification",
    safeMessage,
    externalWrites: 1,
    externalReads: input.externalReads,
    eventId: input.eventId,
    eventUrl: null,
    attendanceRows: [],
    secretsReturned: false,
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

function normalizeEmail(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null;
}

function stringOrFallback(value: unknown, fallback: string): string {
  return stringOrNull(value) ?? fallback;
}

function booleanOrFalse(value: unknown) {
  return value === true;
}

function getNestedRecord(
  value: LumaJson | null,
  key: string,
): LumaJson | null {
  if (!value) {
    return null;
  }

  const nested = value[key];
  return isRecord(nested) ? nested : null;
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

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
