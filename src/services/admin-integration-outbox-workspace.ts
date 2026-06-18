import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getIntegrationContractReview,
  type IntegrationContractReview,
} from "@/services/integration-contract-review";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { IntegrationEvent, OutboxItem } from "@/shared/types/domain";
import type { IntegrationDestination, JsonValue } from "@/shared/types/persistence";

export type AdminOutboxPosture = "mock_safe" | "needs_live_send_review";
export type AdminLiveSendPreflightStatus = "ready" | "watch" | "blocked";

export type AdminIntegrationDestinationSummary = {
  destination: string;
  integrationEvents: number;
  outboxRows: number;
  disabledOrMockedRows: number;
  liveSendRows: number;
  posture: AdminOutboxPosture;
  detail: string;
};

export type AdminIntegrationEventItem = {
  id: string;
  eventType: string;
  title: string;
  destination: string;
  status: string;
  detail: string;
  occurredAt: string;
};

export type AdminOutboxItem = {
  id: string;
  sourceEventId: string;
  destination: string;
  status: string;
  payloadSummary: string;
  safety: string;
};

export type AdminIntegrationReadbackItem = {
  id: string;
  eventType: string;
  destination: string;
  status: string;
  source: "integration_event" | "automation_outbox";
  createdAt: string;
  payloadSummary: string;
};

export type AdminIntegrationAuditItem = {
  id: string;
  action: string;
  target: string;
  createdAt: string;
  reason: string;
};

export type AdminLiveSendPreflightItem = {
  key: string;
  label: string;
  status: AdminLiveSendPreflightStatus;
  question: string;
  requiredEvidence: string;
  currentPosture: string;
  routeEvidence: string[];
  browserWritesExpected: 0;
  externalWritesExpected: 0;
};

export type AdminLiveSendPreflightChecklist = {
  title: string;
  summary: string;
  items: AdminLiveSendPreflightItem[];
  blockedControls: string[];
  counts: {
    total: number;
    ready: number;
    watch: number;
    blocked: number;
    browserWritesEnabled: 0;
    externalWritesEnabled: 0;
    secretsShown: 0;
  };
};

export type AdminIntegrationOutboxWorkspace = {
  canReadWorkspace: boolean;
  canReadAuditRows: boolean;
  title: string;
  summary: string;
  sourceLabel: string;
  nextStep: {
    label: string;
    href: string;
    detail: string;
  };
  counts: {
    structuredEvents: number;
    visibleOutboxRows: number;
    rawIntegrationEventRows: number;
    rawAutomationOutboxRows: number;
    visibleAuditRows: number;
    hiddenAuditRows: number;
    liveSendRows: number;
    browserWritesEnabled: 0;
    externalWritesEnabled: 0;
    secretsShown: 0;
  };
  destinationSummaries: AdminIntegrationDestinationSummary[];
  contractReview: IntegrationContractReview;
  integrationEvents: AdminIntegrationEventItem[];
  outboxItems: AdminOutboxItem[];
  readbackRows: AdminIntegrationReadbackItem[];
  auditRows: AdminIntegrationAuditItem[];
  liveSendPreflight: AdminLiveSendPreflightChecklist;
  blockedControls: string[];
  safetyNotes: string[];
};

const destinationLabels = [
  "internal",
  "n8n",
  "HubSpot",
  "Luma",
  "warehouse",
] as const;

const liveSendStatuses = new Set([
  "approved_for_live_send",
  "sent",
  "failed",
  "dead_lettered",
]);

export function getAdminIntegrationOutboxWorkspace(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): AdminIntegrationOutboxWorkspace {
  if (!canReadIntegrationOutbox(actor)) {
    return hiddenWorkspace(data);
  }

  const canReadAuditRows =
    actor.audience === "admin" || actor.audience === "super_admin";
  const readbackRows = getReadbackRows(data);
  const auditRows = canReadAuditRows
    ? data.auditLogs.map((row) => ({
        id: row.id,
        action: row.action,
        target: row.target_id
          ? `${row.target_table}:${row.target_id}`
          : row.target_table,
        createdAt: row.created_at,
        reason: row.reason ?? "No reason recorded.",
      }))
    : [];
  const liveSendRows = countLiveSendRows(data);

  return {
    canReadWorkspace: true,
    canReadAuditRows,
    title: getTitle(actor),
    summary:
      "This route gives DS and HQ one focused read-only view of structured integration events, disabled automation outbox rows, audit posture, and blocked live-send controls before any external automation is approved.",
    sourceLabel: data.source.mode,
    nextStep: getNextStep(actor),
    counts: {
      structuredEvents: data.integrationEvents.length,
      visibleOutboxRows: data.outboxItems.length,
      rawIntegrationEventRows: data.integrationEventRows.length,
      rawAutomationOutboxRows: data.automationOutboxRows.length,
      visibleAuditRows: auditRows.length,
      hiddenAuditRows: canReadAuditRows ? 0 : data.auditLogs.length,
      liveSendRows,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    },
    destinationSummaries: getDestinationSummaries(data),
    contractReview: getIntegrationContractReview(data),
    integrationEvents: data.integrationEvents.map(toEventItem),
    outboxItems: data.outboxItems.map(toOutboxItem),
    readbackRows,
    auditRows,
    liveSendPreflight: buildLiveSendPreflightChecklist({
      auditRows,
      canReadAuditRows,
      data,
      liveSendRows,
    }),
    blockedControls: [
      "approve live sends",
      "retry failed sends",
      "edit payloads",
      "unlock queue rows",
      "rotate integration secrets",
      "send reminders",
      "export warehouse or Power BI rows",
      "run AI summaries",
    ],
    safetyNotes: [
      "The route reads existing event/outbox posture only; it does not mutate queue state.",
      "DS Admin can review integration and outbox safety without row-level audit details.",
      "Live n8n, HubSpot, Luma, warehouse, Power BI, SMS, email, and AI writes require explicit approval.",
      liveSendRows > 0
        ? "One or more local rows look live-send related; review them before any pilot approval."
        : "No live-send approvals or sent external rows are expected from this review route.",
    ],
  };
}

function canReadIntegrationOutbox(actor: LocalActorContext): boolean {
  return (
    actor.audience === "admin" ||
    actor.audience === "ds_admin" ||
    actor.audience === "super_admin"
  );
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin integration and outbox review";
    case "ds_admin":
      return "DS Admin integration safety review";
    case "super_admin":
      return "Full integration and outbox review";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Integration outbox hidden for this role";
  }
}

function getNextStep(
  actor: LocalActorContext,
): AdminIntegrationOutboxWorkspace["nextStep"] {
  if (actor.audience === "ds_admin") {
    return {
      label: "Open release readiness",
      href: "/admin",
      detail:
        "Return to the admin dashboard to review release readiness before any integration approval.",
    };
  }

  return {
    label: "Review write sequence",
    href: "/admin/write-sequence",
    detail:
      "Review the guarded write sequence before any event, outbox, or audit-producing write is promoted.",
  };
}

function hiddenWorkspace(data: ReadOnlyAppData): AdminIntegrationOutboxWorkspace {
  return {
    canReadWorkspace: false,
    canReadAuditRows: false,
    title: "Integration outbox hidden for this role",
    summary:
      "Integration and automation queue review is an admin/DS safety surface, not a chapter operating view.",
    sourceLabel: data.source.mode,
    nextStep: {
      label: "Back to Rush Month",
      href: "/rush-month",
      detail: "Use the operating route for this local role.",
    },
    counts: {
      structuredEvents: 0,
      visibleOutboxRows: 0,
      rawIntegrationEventRows: 0,
      rawAutomationOutboxRows: 0,
      visibleAuditRows: 0,
      hiddenAuditRows: 0,
      liveSendRows: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    },
    destinationSummaries: [],
    contractReview: {
      title: "Integration contract review hidden for this role",
      summary:
        "Use an Admin, DS Admin, or Super Admin role to inspect integration contract posture.",
      items: [],
      counts: {
        total: 0,
        ready: 0,
        watch: 0,
        blocked: 0,
        browserWritesEnabled: 0,
        externalWritesEnabled: 0,
      },
      blockedControls: [],
    },
    integrationEvents: [],
    outboxItems: [],
    readbackRows: [],
    auditRows: [],
    liveSendPreflight: emptyLiveSendPreflightChecklist(),
    blockedControls: [],
    safetyNotes: [],
  };
}

function getDestinationSummaries(
  data: ReadOnlyAppData,
): AdminIntegrationDestinationSummary[] {
  return destinationLabels.map((destination) => {
    const integrationEvents = data.integrationEvents.filter((event) => {
      return event.destination === destination;
    });
    const outboxRows = data.outboxItems.filter((item) => {
      return item.destination === destination;
    });
    const disabledOrMockedRows = [...integrationEvents, ...outboxRows].filter(
      (item) => {
        return item.status === "disabled" || item.status === "mocked";
      },
    ).length;
    const liveSendRows =
      data.integrationEventRows.filter((row) => {
        return (
          normalizeDestination(row.destination) === destination &&
          liveSendStatuses.has(row.status)
        );
      }).length +
      data.automationOutboxRows.filter((row) => {
        return (
          normalizeDestination(row.destination) === destination &&
          liveSendStatuses.has(row.status)
        );
      }).length;

    return {
      destination,
      integrationEvents: integrationEvents.length,
      outboxRows: outboxRows.length,
      disabledOrMockedRows,
      liveSendRows,
      posture: liveSendRows > 0 ? "needs_live_send_review" : "mock_safe",
      detail:
        liveSendRows > 0
          ? "Review live-send-like local rows before any pilot approval."
          : "No live-send control is enabled from this route.",
    };
  });
}

function toEventItem(event: IntegrationEvent): AdminIntegrationEventItem {
  return {
    id: event.id,
    eventType: event.eventType,
    title: event.title,
    destination: event.destination,
    status: event.status,
    detail: event.detail,
    occurredAt: event.occurredAt,
  };
}

function toOutboxItem(item: OutboxItem): AdminOutboxItem {
  return {
    id: item.id,
    sourceEventId: item.sourceEventId,
    destination: item.destination,
    status: item.status,
    payloadSummary: item.payloadSummary,
    safety:
      item.status === "disabled"
        ? "Disabled queue row. No send worker should pick this up."
        : "Mock/read-only row. It is not approval for a live external send.",
  };
}

function getReadbackRows(data: ReadOnlyAppData): AdminIntegrationReadbackItem[] {
  return [
    ...data.integrationEventRows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      destination: normalizeDestination(row.destination),
      status: row.status,
      source: "integration_event" as const,
      createdAt: row.created_at,
      payloadSummary: summarizeJson(row.payload),
    })),
    ...data.automationOutboxRows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      destination: normalizeDestination(row.destination),
      status: row.status,
      source: "automation_outbox" as const,
      createdAt: row.created_at,
      payloadSummary: summarizeJson(row.payload),
    })),
  ];
}

function countLiveSendRows(data: ReadOnlyAppData): number {
  return (
    data.integrationEventRows.filter((row) => {
      return liveSendStatuses.has(row.status);
    }).length +
    data.automationOutboxRows.filter((row) => {
      return liveSendStatuses.has(row.status);
    }).length
  );
}

function buildLiveSendPreflightChecklist({
  auditRows,
  canReadAuditRows,
  data,
  liveSendRows,
}: {
  auditRows: AdminIntegrationAuditItem[];
  canReadAuditRows: boolean;
  data: ReadOnlyAppData;
  liveSendRows: number;
}): AdminLiveSendPreflightChecklist {
  const structuredEventCount =
    data.integrationEvents.length + data.integrationEventRows.length;
  const outboxRowCount = data.outboxItems.length + data.automationOutboxRows.length;
  const visibleOrHiddenAuditRows =
    auditRows.length + (canReadAuditRows ? 0 : data.auditLogs.length);
  const rawQueueRows = data.automationOutboxRows.length;

  const items: AdminLiveSendPreflightItem[] = [
    {
      key: "source_event",
      label: "Confirm source event",
      status: structuredEventCount > 0 ? "ready" : "blocked",
      question: "Is every future send tied to a structured app event?",
      requiredEvidence:
        "A named IntegrationEvent exists before any n8n, HubSpot, Luma, warehouse, Power BI, SMS, email, or AI send is considered.",
      currentPosture: `${structuredEventCount} structured event row(s) visible in the current read model.`,
      routeEvidence: ["/admin/integration-outbox", "/admin/audit-log"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "payload_and_idempotency",
      label: "Check payload and idempotency",
      status: rawQueueRows > 0 ? "ready" : "watch",
      question: "Can DS review the payload shape, destination, and idempotency before retry logic exists?",
      requiredEvidence:
        "AutomationOutbox rows need payload summaries, destination, status, attempt count, and idempotency keys before live retry approval.",
      currentPosture: `${outboxRowCount} outbox row(s) visible; ${rawQueueRows} raw queue row(s) include local Supabase retry metadata.`,
      routeEvidence: ["/admin/integration-outbox", "/admin/write-sequence"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "audit_readback",
      label: "Prove audit readback",
      status: visibleOrHiddenAuditRows > 0 ? "ready" : "watch",
      question: "Can reviewers prove who approved or blocked a future send?",
      requiredEvidence:
        "AuditLog readback must exist before approving queue mutations, retries, payload edits, or live-send state changes.",
      currentPosture: canReadAuditRows
        ? `${auditRows.length} audit row(s) visible to this role.`
        : `${data.auditLogs.length} audit row(s) hidden from this role by design.`,
      routeEvidence: ["/admin/audit-log", "/admin/integration-outbox"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "destination_policy",
      label: "Approve destination policy",
      status: liveSendRows > 0 ? "blocked" : "ready",
      question: "Has Nick approved the exact destination and send policy?",
      requiredEvidence:
        "Each destination needs owner approval, retry policy, rollback/disable path, and pilot scope before live sends.",
      currentPosture: liveSendRows > 0
        ? `${liveSendRows} live-send-like row(s) need review.`
        : "No live-send approvals or sent rows are visible.",
      routeEvidence: ["/admin/integration-outbox", "/admin/operations"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "secrets_boundary",
      label: "Keep secrets and sends locked",
      status: "ready",
      question: "Are credentials, live-send buttons, and external workers still unavailable from the browser?",
      requiredEvidence:
        "No secret values should render, and no browser control should approve, retry, unlock, or send queue rows.",
      currentPosture: "0 secrets shown, 0 browser writes enabled, 0 external sends enabled.",
      routeEvidence: ["/admin/integration-outbox", "/admin/system-health"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  ];

  return {
    title: "Live-send preflight checklist",
    summary:
      "Use this before approving any queue mutation, retry, payload edit, destination unlock, or external automation.",
    items,
    blockedControls: [
      "approve live sends",
      "retry failed sends",
      "edit payloads",
      "unlock queue rows",
      "show integration secrets",
      "start external workers",
    ],
    counts: {
      total: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      watch: items.filter((item) => item.status === "watch").length,
      blocked: items.filter((item) => item.status === "blocked").length,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    },
  };
}

function emptyLiveSendPreflightChecklist(): AdminLiveSendPreflightChecklist {
  return {
    title: "Live-send preflight checklist hidden for this role",
    summary:
      "Use an Admin, DS Admin, or Super Admin role to inspect integration send readiness.",
    items: [],
    blockedControls: [],
    counts: {
      total: 0,
      ready: 0,
      watch: 0,
      blocked: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    },
  };
}

function normalizeDestination(destination: IntegrationDestination): string {
  switch (destination) {
    case "hubspot":
      return "HubSpot";
    case "luma":
      return "Luma";
    case "warehouse":
    case "power_bi":
      return "warehouse";
    case "n8n":
      return "n8n";
    case "internal":
      return "internal";
  }
}

function summarizeJson(value: JsonValue): string {
  if (value === null) {
    return "empty payload";
  }

  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    return keys.length > 0 ? keys.slice(0, 5).join(", ") : "empty payload";
  }

  return String(value);
}
