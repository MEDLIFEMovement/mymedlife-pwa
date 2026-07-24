import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { AdminHubSpotSyncWorkspace } from "@/services/admin-hubspot-sync-workspace";
import type { AdminLumaSyncWorkspace } from "@/services/admin-luma-sync-workspace";
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

export type IntegrationContractProviderReadback = {
  hubspot?: AdminHubSpotSyncWorkspace;
  luma?: AdminLumaSyncWorkspace;
};

const liveSendStatuses = new Set([
  "approved_for_live_send",
  "sent",
  "failed",
  "dead_lettered",
]);

export function getIntegrationContractReview(
  data: ReadOnlyAppData,
  providerReadback: IntegrationContractProviderReadback = {},
): IntegrationContractReview {
  const items: IntegrationContractReviewItem[] = [
    buildLumaContract(data, providerReadback.luma),
    buildHubSpotContract(data, providerReadback.hubspot),
    buildDestinationContract({
      key: "warehouse_power_bi",
      label: "Databricks and Power BI export contract",
      data,
      destination: "warehouse",
      sourceOfTruth:
        "myMEDLIFE stays the operational source of truth; Databricks and Power BI are downstream governed read models, never the authority for product writes.",
      requiredEvidence:
        "A governed export event and queue row should show the idempotent batch key, freshness metadata, and replay posture before any analytics feed is approved.",
      liveGate:
        "Pilot approval needs export ownership, a freshness SLA, failure visibility, replay rules, and a rollback path for bad batches.",
      requiredFields: [
        "event_type",
        "chapter_id",
        "campaign_id",
        "export_batch_key",
        "occurred_at",
        "governed_metric_scope",
      ],
      defaultPosture:
        "No governed Databricks export packet is visible yet. Keep analytics downstream and review-only until the contract is seeded.",
    }),
    buildAiContract(data),
  ];
  const hasProviderReadback = Boolean(
    providerReadback.luma || providerReadback.hubspot,
  );

  return {
    title: hasProviderReadback
      ? "Integration contracts and live readback"
      : "Mock-safe integration contracts",
    summary: hasProviderReadback
      ? "This review combines server-side provider sync readback with the guarded outbox contract. Luma and HubSpot are upstream sources, myMEDLIFE-owned tables remain operational truth, Databricks is downstream only, and browser-triggered provider sends stay blocked."
      : "Use this review before any Luma, HubSpot, Databricks, Power BI, or AI lane is treated as launch-ready. The contract should exist, the owner boundary should be obvious, and all sends should still be blocked from the browser.",
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

function buildLumaContract(
  data: ReadOnlyAppData,
  sync: AdminLumaSyncWorkspace | undefined,
): IntegrationContractReviewItem {
  const fallback = buildDestinationContract({
    key: "luma",
    label: "Luma event sync contract",
    data,
    destination: "Luma",
    sourceOfTruth:
      "Luma is the approved upstream event provider; myMEDLIFE-owned event, import, and link tables are operational truth for product workflows.",
    requiredEvidence:
      "A Luma-linked event, scheduled sync run, scoped app-owned mapping, and disabled provider-write path should be visible before attendance import is approved.",
    liveGate:
      "Pilot approval needs exact read/import mapping, duplicate handling, replay, failure visibility, rollback, and cross-role browser proof.",
    requiredFields: [
      "chapter_id",
      "campaign_id",
      "chapter_event_id",
      "external_object_id",
      "event_url",
      "attendance_mode",
    ],
    defaultPosture:
      "No live Luma sync readback is available on this surface. Keep attendance import review-only until the provider workspace can be verified.",
  });

  if (!sync?.canRead) return fallback;

  const needsReview =
    sync.counts.conflicts > 0 ||
    sync.counts.openFailures > 0 ||
    sync.lastRun?.status === "failed" ||
    sync.lastRun?.status === "partial";
  const hasMaterializedEvents =
    sync.config.enabled &&
    sync.counts.importedEvents > 0 &&
    sync.counts.materializedEvents > 0;

  return {
    ...fallback,
    status: needsReview ? "blocked" : hasMaterializedEvents ? "ready" : "watch",
    currentPosture:
      `${sync.counts.importedEvents} provider event(s) imported; ` +
      `${sync.counts.materializedEvents} materialized in app-owned tables; ` +
      `${sync.counts.conflicts} conflict(s); ${sync.counts.openFailures} open failure(s). ` +
      `Latest run: ${sync.lastRun?.status ?? "not yet recorded"}. Luma provider writes remain disabled.`,
    routeEvidence: [
      "/admin/integrations/luma",
      "/admin/integration-outbox",
      "/admin/audit-log",
    ],
  };
}

function buildHubSpotContract(
  data: ReadOnlyAppData,
  sync: AdminHubSpotSyncWorkspace | undefined,
): IntegrationContractReviewItem {
  const fallback = buildDestinationContract({
    key: "hubspot",
    label: "HubSpot upstream CRM sync contract",
    data,
    destination: "HubSpot",
    sourceOfTruth:
      "HubSpot is the approved upstream CRM for organizations, contacts, and membership metadata; myMEDLIFE-owned tables are operational truth after reconciliation.",
    requiredEvidence:
      "Stable external mappings, backfill and incremental runs, conflict rules, retry/replay behavior, source timestamps, and app readback should be visible before the sync is trusted.",
    liveGate:
      "Pilot approval needs current-term membership qualification, idempotent mapping, conflict/failure visibility, rollback, and browser proof that product routes use app-owned records.",
    requiredFields: [
      "hubspot_company_id",
      "hubspot_contact_id",
      "chapter_id",
      "profile_id",
      "membership_status",
      "source_updated_at",
    ],
    defaultPosture:
      "No live HubSpot sync readback is available on this surface. Keep CRM ingestion review-only until the provider workspace can be verified.",
  });

  if (!sync?.canRead) return fallback;

  const needsReview =
    sync.counts.openFailures > 0 ||
    sync.lastRun?.status === "failed" ||
    sync.lastRun?.status === "partial";
  const hasImportedRecords =
    sync.config.enabled &&
    sync.counts.companies + sync.counts.contacts > 0 &&
    sync.lastRun !== null;

  return {
    ...fallback,
    status: needsReview ? "blocked" : hasImportedRecords ? "ready" : "watch",
    currentPosture:
      `${sync.counts.companies} company record(s), ${sync.counts.contacts} contact record(s), and ` +
      `${sync.counts.materializedMemberships} membership(s) are materialized or staged in app-owned tables; ` +
      `${sync.counts.openFailures} open failure(s). Latest run: ${sync.lastRun?.status ?? "not yet recorded"}. ` +
      "HubSpot writes and invitations remain disabled.",
    routeEvidence: [
      "/admin/integrations/hubspot",
      "/admin/integration-outbox",
      "/admin/audit-log",
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
