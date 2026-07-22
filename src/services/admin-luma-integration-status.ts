import {
  getPilotEventLoopReadModel,
  type EventLoopMode,
} from "@/services/event-loop";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import type {
  AutomationOutboxRow,
  IntegrationEventRow,
} from "@/shared/types/persistence";

export type AdminLumaProviderStatus =
  | "mock_ready"
  | "staging_ready"
  | "disabled"
  | "live_ready_not_enabled";

export type AdminLumaTestStatus = "pass" | "blocked" | "needs_setup";

export type AdminLumaStatusCheck = {
  label: string;
  value: string;
  status: AdminLumaTestStatus;
  detail: string;
};

export type AdminLumaErrorLogItem = {
  source: "integration_event" | "automation_outbox" | "status";
  status: string;
  message: string;
  occurredAt: string;
};

export type AdminLumaIntegrationStatus = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  providerStatus: AdminLumaProviderStatus;
  environment: EventLoopMode;
  environmentLabel: string;
  testConnection: {
    status: AdminLumaTestStatus;
    label: string;
    detail: string;
  };
  lastTestTime: string;
  lastSync: string;
  outboxStatus: string;
  counts: {
    calendars: number;
    linkedEvents: number;
    lumaIntegrationEvents: number;
    lumaOutboxRows: number;
    liveSendRows: number;
    browserSecretsShown: 0;
    externalWritesEnabled: 0;
  };
  setupChecks: AdminLumaStatusCheck[];
  errorLog: AdminLumaErrorLogItem[];
  safetyNotes: string[];
  blockedControls: string[];
};

type LumaStatusEnv = Record<string, string | undefined>;

const lumaModes: EventLoopMode[] = [
  "mock",
  "staging",
  "disabled",
  "live_ready_not_enabled",
];

const liveSendStatuses = new Set(["approved_for_live_send", "sent"]);
const failureStatuses = new Set(["failed", "dead_lettered"]);

export function getAdminLumaIntegrationStatus(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  env: LumaStatusEnv = process.env,
): AdminLumaIntegrationStatus {
  if (!canReadAdminIntegrationsSecurity(actor)) {
    return hiddenStatus();
  }

  const environment = resolveLumaEnvironment(data, env);
  const providerStatus = getProviderStatus(environment, data);
  const environmentLabel = getEnvironmentLabel(environment, env);
  const readModel = getPilotEventLoopReadModel({
    mode: environment,
    data: {
      eventRows: data.allEventRows,
      integrationEventRows: data.integrationEventRows,
      automationOutboxRows: data.automationOutboxRows,
      pointsEventRows: data.allPointsEventRows,
      auditLogRows: data.auditLogs,
    },
  });
  const lumaIntegrationEvents = data.integrationEventRows.filter(isLumaIntegrationEvent);
  const lumaOutboxRows = data.automationOutboxRows.filter(isLumaOutboxRow);
  const liveSendRows = lumaOutboxRows.filter((row) => liveSendStatuses.has(row.status));
  const lastTestTime = getLatestTimestamp([
    ...lumaIntegrationEvents.map((row) => row.updated_at),
    ...lumaOutboxRows.map((row) => row.updated_at),
  ]);
  const lastSync = getLatestTimestamp([
    ...data.allLumaEventLinkRows.map((row) => row.last_imported_at ?? row.updated_at),
    ...data.chapterLumaCalendarRows.map((row) => row.linked_at ?? row.updated_at),
  ]);

  return {
    canReadWorkspace: true,
    title: "Luma integration status",
    summary:
      "DS Admin can inspect Luma calendar mapping, event link posture, test-readiness, outbox safety, and blocked live-send controls without exposing keys or enabling production writes.",
    providerStatus,
    environment,
    environmentLabel,
    testConnection: getTestConnection(environment, data),
    lastTestTime,
    lastSync,
    outboxStatus: liveSendRows.length > 0 ? "Review required" : "No live sends enabled",
    counts: {
      calendars: data.chapterLumaCalendarRows.length,
      linkedEvents: data.allLumaEventLinkRows.filter((row) => row.luma_event_url).length,
      lumaIntegrationEvents: lumaIntegrationEvents.length,
      lumaOutboxRows: lumaOutboxRows.length,
      liveSendRows: liveSendRows.length,
      browserSecretsShown: 0,
      externalWritesEnabled: 0,
    },
    setupChecks: [
      {
        label: "Provider mode",
        value: environmentLabel,
        status: environment === "disabled" ? "blocked" : "pass",
        detail:
          environment === "disabled"
            ? "Luma is intentionally disabled; local/mock event flow must still work."
            : "The page can read staging/mock-safe Luma posture without making an API call.",
      },
      {
        label: "Event link and QR readback",
        value: readModel.summary.lumaLinkReady && readModel.summary.qrReady ? "ready" : "pending",
        status: readModel.summary.lumaLinkReady && readModel.summary.qrReady ? "pass" : "needs_setup",
        detail:
          readModel.summary.lumaLinkReady && readModel.summary.qrReady
            ? "At least one Luma/mock RSVP link and QR-ready event path is visible in app state."
            : "The local event path can run, but Luma/QR readback needs setup evidence.",
      },
      {
        label: "Outbox safety",
        value: liveSendRows.length === 0 ? "zero live sends" : `${liveSendRows.length} live-send rows`,
        status: liveSendRows.length === 0 ? "pass" : "blocked",
        detail:
          liveSendRows.length === 0
            ? "No Luma outbox row is approved for live send or sent."
            : "Review Luma outbox rows before approving any pilot action.",
      },
      {
        label: "Secrets exposure",
        value: "0 browser secrets",
        status: "pass",
        detail:
          "The status model reports counts and posture only; raw Luma keys never appear in browser data.",
      },
    ],
    errorLog: buildErrorLog(lumaIntegrationEvents, lumaOutboxRows),
    safetyNotes: [
      "This route does not call the Luma API.",
      "This route does not create, update, delete, or sync Luma events.",
      "Production Luma writes, reminders, webhooks, n8n, HubSpot, warehouse, Power BI, SMS, email, and AI actions remain off.",
      "Use `/admin/integration-outbox` for disabled queue readback before any live-send approval.",
    ],
    blockedControls: [
      "create production Luma event",
      "update production Luma event",
      "delete Luma event",
      "send Luma reminders",
      "enable webhook execution",
      "approve live outbox send",
      "show raw API key",
    ],
  };
}

function hiddenStatus(): AdminLumaIntegrationStatus {
  return {
    canReadWorkspace: false,
    title: "Luma integration hidden for this role",
    summary:
      "Only DS Admin and Super Admin can inspect Luma provider setup, keys posture, and integration safety.",
    providerStatus: "disabled",
    environment: "disabled",
    environmentLabel: "Disabled",
    testConnection: {
      status: "blocked",
      label: "Blocked",
      detail: "This role cannot inspect provider setup.",
    },
    lastTestTime: "Not available",
    lastSync: "Not available",
    outboxStatus: "Hidden",
    counts: {
      calendars: 0,
      linkedEvents: 0,
      lumaIntegrationEvents: 0,
      lumaOutboxRows: 0,
      liveSendRows: 0,
      browserSecretsShown: 0,
      externalWritesEnabled: 0,
    },
    setupChecks: [],
    errorLog: [],
    safetyNotes: [],
    blockedControls: [],
  };
}

function resolveLumaEnvironment(
  data: ReadOnlyAppData,
  env: LumaStatusEnv,
): EventLoopMode {
  const configuredMode = env.MYMEDLIFE_LUMA_MODE;

  if (isEventLoopMode(configuredMode)) {
    return configuredMode;
  }

  if (env.MYMEDLIFE_LUMA_DISABLED === "true") {
    return "disabled";
  }

  if (env.LUMA_API_KEY && env.LUMA_CALENDAR_ID) {
    return "live_ready_not_enabled";
  }

  if (env.VERCEL_ENV === "production") {
    return "disabled";
  }

  if (data.source.mode === "supabase") {
    return "staging";
  }

  if (data.chapterLumaCalendarRows.length > 0 || data.allLumaEventLinkRows.length > 0) {
    return "mock";
  }

  return "disabled";
}

function isEventLoopMode(value: unknown): value is EventLoopMode {
  return typeof value === "string" && lumaModes.includes(value as EventLoopMode);
}

function getProviderStatus(
  environment: EventLoopMode,
  data: ReadOnlyAppData,
): AdminLumaProviderStatus {
  if (environment === "disabled") {
    return "disabled";
  }

  if (environment === "live_ready_not_enabled") {
    return "live_ready_not_enabled";
  }

  if (environment === "staging" || data.source.mode === "supabase") {
    return "staging_ready";
  }

  return "mock_ready";
}

function getEnvironmentLabel(
  environment: EventLoopMode,
  env: LumaStatusEnv = process.env,
): string {
  if (env.VERCEL_ENV === "production") {
    return "Production";
  }

  switch (environment) {
    case "mock":
      return "Mock";
    case "staging":
      return "Staging";
    case "disabled":
      return "Disabled";
    case "live_ready_not_enabled":
      return "Live-ready, not enabled";
  }
}

function getTestConnection(
  environment: EventLoopMode,
  data: ReadOnlyAppData,
): AdminLumaIntegrationStatus["testConnection"] {
  if (environment === "disabled") {
    return {
      status: "blocked",
      label: "Connection disabled",
      detail:
        "Luma is disabled for this environment; reviewers can still use local event, RSVP, check-in, and points flow.",
    };
  }

  if (data.chapterLumaCalendarRows.length === 0 && data.allLumaEventLinkRows.length === 0) {
    return {
      status: "needs_setup",
      label: "Setup evidence needed",
      detail:
        "No calendar mapping or Luma/mock event link rows are visible in app readback yet.",
    };
  }

  return {
    status: "pass",
    label: "Dry-run check passed",
    detail:
      "Readback has Luma/mock mapping evidence. No external API call or secret exposure occurred.",
  };
}

function isLumaIntegrationEvent(row: IntegrationEventRow): boolean {
  return row.destination === "luma" || row.event_type.toLowerCase().includes("luma");
}

function isLumaOutboxRow(row: AutomationOutboxRow): boolean {
  return row.destination === "luma" || row.event_type.toLowerCase().includes("luma");
}

function buildErrorLog(
  integrationEvents: IntegrationEventRow[],
  outboxRows: AutomationOutboxRow[],
): AdminLumaErrorLogItem[] {
  const failedIntegrationEvents = integrationEvents
    .filter((row) => row.status === "failed")
    .map((row) => ({
      source: "integration_event" as const,
      status: row.status,
      message: `Luma integration event ${row.event_type} failed safely.`,
      occurredAt: row.updated_at,
    }));
  const failedOutboxRows = outboxRows
    .filter((row) => failureStatuses.has(row.status) || row.last_error)
    .map((row) => ({
      source: "automation_outbox" as const,
      status: row.status,
      message: sanitizeProviderError(row.last_error ?? `Luma outbox row ${row.event_type} requires review.`),
      occurredAt: row.updated_at,
    }));

  const failures = [...failedIntegrationEvents, ...failedOutboxRows];

  if (failures.length > 0) {
    return failures;
  }

  return [
    {
      source: "status",
      status: "clear",
      message: "No Luma provider errors are visible in read-only app data.",
      occurredAt: "Not recorded",
    },
  ];
}

function sanitizeProviderError(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/api[_-]?key[=:]\s*[A-Za-z0-9._-]+/gi, "api_key=[redacted]")
    .replace(/token[=:]\s*[A-Za-z0-9._-]+/gi, "token=[redacted]");
}

function getLatestTimestamp(values: Array<string | null | undefined>): string {
  const timestamps = values.filter((value): value is string => Boolean(value));

  if (timestamps.length === 0) {
    return "Not recorded";
  }

  return timestamps.sort().at(-1) ?? "Not recorded";
}
