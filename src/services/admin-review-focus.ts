import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type {
  AuditLogRow,
  AutomationOutboxRow,
  IntegrationEventRow,
  JsonValue,
} from "@/shared/types/persistence";

export type AdminReviewFocusKey = "luma-live-pilot";

export type AdminReviewFocus = {
  key: AdminReviewFocusKey;
  sourceParam: string;
  label: string;
  summary: string;
};

const lumaLivePilotFocus: AdminReviewFocus = {
  key: "luma-live-pilot",
  sourceParam: "luma-live-pilot",
  label: "Staging Luma pilot",
  summary:
    "Showing only the staging Luma event, RSVP, attendance, points, and blocked-send evidence tied to the pilot loop.",
};

export function resolveAdminReviewFocus(
  source?: string,
): AdminReviewFocus | null {
  return source === lumaLivePilotFocus.sourceParam ? lumaLivePilotFocus : null;
}

export function applyAdminReviewFocus(
  data: ReadOnlyAppData,
  focus: AdminReviewFocus | null,
): ReadOnlyAppData {
  if (!focus) {
    return data;
  }

  switch (focus.key) {
    case "luma-live-pilot":
      return filterForLumaLivePilot(data);
  }
}

export function appendAdminReviewFocus(
  href: string,
  focus: AdminReviewFocus | null,
): string {
  if (!focus) {
    return href;
  }

  const url = new URL(href, "https://mymedlife.local");
  url.searchParams.set("source", focus.sourceParam);

  return `${url.pathname}${url.search}${url.hash}`;
}

function filterForLumaLivePilot(data: ReadOnlyAppData): ReadOnlyAppData {
  const integrationEventRows = data.integrationEventRows.filter((row) =>
    matchesLumaLivePilotIntegrationRow(row),
  );
  const integrationEventIds = new Set(integrationEventRows.map((row) => row.id));
  const automationOutboxRows = data.automationOutboxRows.filter((row) => {
    return (
      matchesLumaLivePilotOutboxRow(row) ||
      (row.integration_event_id !== null && integrationEventIds.has(row.integration_event_id))
    );
  });
  const outboxIds = new Set(automationOutboxRows.map((row) => row.id));
  const auditLogs = data.auditLogs.filter((row) =>
    matchesLumaLivePilotAuditRow(row, integrationEventIds),
  );

  return {
    ...data,
    integrationEvents: data.integrationEvents.filter((row) =>
      integrationEventIds.has(row.id),
    ),
    outboxItems: data.outboxItems.filter((row) => outboxIds.has(row.id)),
    integrationEventRows,
    automationOutboxRows,
    auditLogs,
  };
}

function matchesLumaLivePilotIntegrationRow(row: IntegrationEventRow) {
  return (
    hasSourceValue(row.payload, "luma_live_pilot") ||
    row.event_type.startsWith("luma_") ||
    row.destination === "luma"
  );
}

function matchesLumaLivePilotOutboxRow(row: AutomationOutboxRow) {
  return (
    hasSourceValue(row.payload, "luma_live_pilot") ||
    row.idempotency_key.startsWith("luma-pilot:") ||
    row.event_type.startsWith("luma_")
  );
}

function matchesLumaLivePilotAuditRow(
  row: AuditLogRow,
  integrationEventIds: Set<string>,
) {
  return (
    row.action.startsWith("luma_") ||
    row.target_table === "luma_event_links" ||
    (row.target_table === "integration_events" &&
      row.target_id !== null &&
      integrationEventIds.has(row.target_id)) ||
    (typeof row.reason === "string" &&
      row.reason.toLowerCase().includes("luma"))
  );
}

function hasSourceValue(
  payload: JsonValue,
  expectedSource: string,
) {
  return isRecord(payload) && payload.source === expectedSource;
}

function isRecord(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
