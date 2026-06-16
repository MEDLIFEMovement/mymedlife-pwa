import {
  getActionCommittees,
  getEventPlansForCampaign,
} from "@/services/campaign-ops-service";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ChapterEventPlan } from "@/shared/types/campaigns";
import type { IntegrationEvent, OutboxItem } from "@/shared/types/domain";

export type RushMonthEventReadinessRow = {
  id: string;
  title: string;
  committeeName: string;
  timing: string;
  eventTypeLabel: string;
  lumaStatusLabel: string;
  lumaStatusTone: ChapterEventPlan["lumaStatus"];
  ownerRole: string;
  expectedStudentAction: string;
  feedbackPlan: string;
  npsQuestion: string;
  proofPrompt: string;
};

export type RushMonthEventReadinessWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  counts: {
    totalEvents: number;
    mockLinkedLumaEvents: number;
    disabledLumaSyncs: number;
    npsPrompts: number;
    proofPrompts: number;
    externalWritesExpected: 0;
  };
  rows: RushMonthEventReadinessRow[];
  futureStructuredEvents: IntegrationEvent[];
  disabledOutboxItems: OutboxItem[];
  safetyNotes: string[];
};

export function getRushMonthEventReadinessWorkspace(
  actor: LocalActorContext,
): RushMonthEventReadinessWorkspace {
  if (actor.audience === "ds_admin") {
    return hiddenWorkspace();
  }

  const eventPlans = getEventPlansForCampaign("rush-month");
  const rows = eventPlans.map(toEventReadinessRow);

  return {
    canReadWorkspace: true,
    title: getTitle(actor),
    summary:
      "Rush Month events should create the moments that make MEDLIFE feel active: socials, Med Talks, volunteer pushes, and proof-worthy experiences. This view shows the event/NPS/proof loop without sending anything to Luma or n8n.",
    counts: {
      totalEvents: eventPlans.length,
      mockLinkedLumaEvents: eventPlans.filter(
        (eventPlan) => eventPlan.lumaStatus === "mock_linked",
      ).length,
      disabledLumaSyncs: eventPlans.filter(
        (eventPlan) => eventPlan.lumaStatus === "future_sync_disabled",
      ).length,
      npsPrompts: eventPlans.filter((eventPlan) => eventPlan.npsQuestion.length > 0)
        .length,
      proofPrompts: eventPlans.filter((eventPlan) => eventPlan.proofPrompt.length > 0)
        .length,
      externalWritesExpected: 0,
    },
    rows,
    futureStructuredEvents: buildFutureEvents(eventPlans),
    disabledOutboxItems: buildDisabledOutboxItems(eventPlans),
    safetyNotes: [
      "No Luma event is created or updated from this route.",
      "No Luma attendance/check-in import runs from this route.",
      "No NPS email, SMS, or reminder is sent from this route.",
      "No warehouse, Power BI, HubSpot, n8n, or AI export runs from this route.",
      "Event attendance and NPS remain mock/readiness posture until approved.",
    ],
  };
}

function toEventReadinessRow(
  eventPlan: ChapterEventPlan,
): RushMonthEventReadinessRow {
  return {
    id: eventPlan.id,
    title: eventPlan.title,
    committeeName: getCommitteeName(eventPlan.committeeId),
    timing: eventPlan.timing,
    eventTypeLabel: eventPlan.eventType.replaceAll("_", " "),
    lumaStatusLabel: eventPlan.lumaStatus.replaceAll("_", " "),
    lumaStatusTone: eventPlan.lumaStatus,
    ownerRole: eventPlan.ownerRole,
    expectedStudentAction: eventPlan.expectedStudentAction,
    feedbackPlan: eventPlan.feedbackPlan,
    npsQuestion: eventPlan.npsQuestion,
    proofPrompt: eventPlan.proofPrompt,
  };
}

function buildFutureEvents(eventPlans: ChapterEventPlan[]): IntegrationEvent[] {
  const eventIds = eventPlans.map((eventPlan) => eventPlan.id);
  const sourceSummary = `${eventIds.length} Rush Month event plan${
    eventIds.length === 1 ? "" : "s"
  }`;

  return [
    {
      id: "rush-events-luma-link",
      eventType: "luma_event_linked",
      title: "Future Luma event linked",
      destination: "Luma",
      status: "disabled",
      detail: `${sourceSummary} would eventually record approved Luma event IDs. No Luma API write runs now.`,
      occurredAt: "local-mock-time",
    },
    {
      id: "rush-events-attendance-import",
      eventType: "luma_attendance_import_mocked",
      title: "Future attendance import mocked",
      destination: "Luma",
      status: "disabled",
      detail:
        "Attendance/check-in data would eventually flow into KPIs after approval. This route only names the future event.",
      occurredAt: "local-mock-time",
    },
    {
      id: "rush-events-nps-recorded",
      eventType: "kpi_event_recorded",
      title: "Future NPS KPI recorded",
      destination: "internal",
      status: "disabled",
      detail:
        "Post-event NPS feedback would eventually become a KPI event. No feedback form or write is triggered here.",
      occurredAt: "local-mock-time",
    },
    {
      id: "rush-events-proof-requested",
      eventType: "evidence_submitted",
      title: "Future event proof requested",
      destination: "internal",
      status: "disabled",
      detail:
        "Bridge videos and testimonials should connect back to event experiences, but uploads remain disabled.",
      occurredAt: "local-mock-time",
    },
    {
      id: "rush-events-audit-ready",
      eventType: "audit_log_recorded",
      title: "Future event audit log recorded",
      destination: "internal",
      status: "disabled",
      detail:
        "Approved future event imports and syncs should leave audit records. No audit row is written now.",
      occurredAt: "local-mock-time",
    },
  ];
}

function buildDisabledOutboxItems(eventPlans: ChapterEventPlan[]): OutboxItem[] {
  const sourceEventId = eventPlans[0]?.id ?? "rush-month-event-readiness";

  return [
    {
      id: "outbox-rush-events-luma-create",
      sourceEventId,
      destination: "Luma",
      status: "disabled",
      payloadSummary: "Future Luma event creation/update is blocked until approved.",
    },
    {
      id: "outbox-rush-events-luma-attendance",
      sourceEventId,
      destination: "Luma",
      status: "disabled",
      payloadSummary: "Future Luma attendance import is blocked until approved.",
    },
    {
      id: "outbox-rush-events-nps-reminder",
      sourceEventId,
      destination: "n8n",
      status: "disabled",
      payloadSummary: "Future post-event NPS reminder job is blocked until approved.",
    },
    {
      id: "outbox-rush-events-warehouse-export",
      sourceEventId,
      destination: "warehouse",
      status: "disabled",
      payloadSummary: "Future event/NPS warehouse export is blocked until approved.",
    },
  ];
}

function hiddenWorkspace(): RushMonthEventReadinessWorkspace {
  return {
    canReadWorkspace: false,
    title: "Rush Month event readiness hidden for DS Admin",
    summary:
      "DS Admin can inspect disabled integration posture in admin surfaces, but should not read or own chapter event, attendance, NPS, or proof truth.",
    counts: {
      totalEvents: 0,
      mockLinkedLumaEvents: 0,
      disabledLumaSyncs: 0,
      npsPrompts: 0,
      proofPrompts: 0,
      externalWritesExpected: 0,
    },
    rows: [],
    futureStructuredEvents: [],
    disabledOutboxItems: [],
    safetyNotes: [],
  };
}

function getCommitteeName(committeeId: string): string {
  return (
    getActionCommittees().find((committee) => committee.id === committeeId)?.name ??
    "Action Committee"
  );
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "Your Rush Month events";
    case "chapter_leader":
      return "Leader event readiness";
    case "coach":
      return "Coach event and NPS readiness";
    case "admin":
      return "HQ event readiness";
    case "super_admin":
      return "Full Rush Month event readiness";
    case "ds_admin":
      return "Rush Month event readiness hidden for DS Admin";
  }
}
