import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { IntegrationDestination } from "@/shared/types/persistence";

export type IntegrationContractStatus = "ready" | "watch" | "blocked";

export type IntegrationContractReviewItem = {
  key: string;
  label: string;
  status: IntegrationContractStatus;
  currentPosture: string;
  sourceOfTruth: string;
  requiredEvidence: string;
  liveGate: string;
  requiredFields: string[];
  routeEvidence: string[];
  browserWritesExpected: 0;
  externalWritesExpected: 0;
};

export type IntegrationContractReview = {
  title: string;
  summary: string;
  items: IntegrationContractReviewItem[];
  counts: {
    total: number;
    ready: number;
    watch: number;
    blocked: number;
    browserWritesEnabled: 0;
    externalWritesEnabled: 0;
  };
  blockedControls: string[];
};

const liveSendStatuses = new Set([
  "approved_for_live_send",
  "sent",
  "failed",
  "dead_lettered",
]);

export function getIntegrationContractReview(
  data: ReadOnlyAppData,
): IntegrationContractReview {
  const items: IntegrationContractReviewItem[] = [
    buildDestinationContract({
      key: "luma",
      label: "Luma event sync contract",
      data,
      destination: "Luma",
      sourceOfTruth:
        "myMEDLIFE stores the chapter event link posture; registration and attendance stay gated outside the browser.",
      requiredEvidence:
        "A Luma-linked event and disabled/mock-safe send path should be visible before any attendance import is approved.",
      liveGate:
        "Pilot approval needs the exact read/import path, duplicate handling, rollback, and owner sign-off for attendance truth.",
      requiredFields: [
        "chapter_id",
        "campaign_id",
        "chapter_event_id",
        "external_object_id",
        "event_url",
        "attendance_mode",
      ],
      defaultPosture:
        "No Luma contract rows are visible yet. Keep registration and attendance manual until the contract is seeded.",
    }),
    buildDestinationContract({
      key: "hubspot",
      label: "HubSpot follow-up handoff contract",
      data,
      destination: "HubSpot",
      sourceOfTruth:
        "myMEDLIFE owns chapter action truth; HubSpot remains the downstream follow-up system when explicitly approved.",
      requiredEvidence:
        "A mock CRM handoff event and outbox row should exist before any follow-up sync or contact mutation is approved.",
      liveGate:
        "Pilot approval needs contact mapping, replay/idempotency, duplicate strategy, and a human-owned rollback path.",
      requiredFields: [
        "chapter_id",
        "member_or_contact_key",
        "handoff_reason",
        "campaign_context",
        "follow_up_type",
        "idempotency_key",
      ],
      defaultPosture:
        "No HubSpot contract rows are visible yet. Keep CRM follow-up outside the app until the contract is seeded.",
    }),
    buildDestinationContract({
      key: "warehouse_power_bi",
      label: "Warehouse and Power BI export contract",
      data,
      destination: "warehouse",
      sourceOfTruth:
        "myMEDLIFE stays the operational source of truth; warehouse and Power BI are governed read models, never the authority for writes.",
      requiredEvidence:
        "A mock export event and queue row should show the governed payload before any refresh, backfill, or analytics feed is approved.",
      liveGate:
        "Pilot approval needs export ownership, freshness SLA, replay rules, and a rollback path for bad batches.",
      requiredFields: [
        "event_type",
        "chapter_id",
        "campaign_id",
        "export_batch_key",
        "occurred_at",
        "governed_metric_scope",
      ],
      defaultPosture:
        "No governed export packet is visible yet. Keep analytics downstream and manual until the contract is seeded.",
    }),
    buildAiContract(data),
  ];

  return {
    title: "Mock-safe integration contracts",
    summary:
      "Use this review before any Luma, HubSpot, warehouse, Power BI, or AI lane is treated as launch-ready. The contract should exist, the owner boundary should be obvious, and all sends should still be blocked from the browser.",
    items,
    counts: {
      total: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      watch: items.filter((item) => item.status === "watch").length,
      blocked: items.filter((item) => item.status === "blocked").length,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
    },
    blockedControls: [
      "open live vendor credentials",
      "approve vendor sends",
      "retry export batches",
      "run AI suggestions without review",
    ],
  };
}

function buildDestinationContract(input: {
  key: string;
  label: string;
  data: ReadOnlyAppData;
  destination: "Luma" | "HubSpot" | "warehouse";
  sourceOfTruth: string;
  requiredEvidence: string;
  liveGate: string;
  requiredFields: string[];
  defaultPosture: string;
}): IntegrationContractReviewItem {
  const eventCount = input.data.integrationEvents.filter(
    (event) => event.destination === input.destination,
  ).length;
  const outboxCount = input.data.outboxItems.filter(
    (item) => item.destination === input.destination,
  ).length;
  const liveSendRowCount =
    input.data.integrationEventRows.filter((row) => {
      return (
        normalizeDestination(row.destination) === input.destination &&
        liveSendStatuses.has(row.status)
      );
    }).length +
    input.data.automationOutboxRows.filter((row) => {
      return (
        normalizeDestination(row.destination) === input.destination &&
        liveSendStatuses.has(row.status)
      );
    }).length;

  return {
    key: input.key,
    label: input.label,
    status:
      liveSendRowCount > 0 ? "blocked" : eventCount + outboxCount > 0 ? "ready" : "watch",
    currentPosture:
      liveSendRowCount > 0
        ? `${liveSendRowCount} live-send-like row(s) need review before this contract can be trusted.`
        : eventCount + outboxCount > 0
          ? `${eventCount} event(s) and ${outboxCount} queue row(s) are visible in the current mock-safe posture.`
          : input.defaultPosture,
    sourceOfTruth: input.sourceOfTruth,
    requiredEvidence: input.requiredEvidence,
    liveGate: input.liveGate,
    requiredFields: input.requiredFields,
    routeEvidence: ["/admin/integration-outbox", "/admin/launch-gate"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}

function buildAiContract(data: ReadOnlyAppData): IntegrationContractReviewItem {
  const contractEvents = data.integrationEvents.filter((event) => {
    return event.eventType.includes("ai_");
  });

  return {
    key: "ai_recommendations",
    label: "AI recommendation contract",
    status: contractEvents.length > 0 ? "ready" : "watch",
    currentPosture:
      contractEvents.length > 0
        ? `${contractEvents.length} internal contract event(s) define prompt/version and review posture while all model calls stay disabled.`
        : "No AI contract event is visible yet. Keep recommendations manual until the prompt and review contract is logged.",
    sourceOfTruth:
      "myMEDLIFE may eventually log bounded AI recommendations, but approval, chapter truth, and final decisions remain human-owned.",
    requiredEvidence:
      "An internal contract event should name the prompt version, input snapshot, reviewer boundary, and output shape before any AI call is approved.",
    liveGate:
      "Pilot approval needs prompt logging, bounded outputs, audit readback, takedown/disable posture, and explicit human review.",
    requiredFields: [
      "actor_scope",
      "input_snapshot",
      "prompt_version",
      "output_shape",
      "review_required",
      "decision_owner",
    ],
    routeEvidence: ["/admin/integration-outbox", "/admin/release-readiness"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
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
