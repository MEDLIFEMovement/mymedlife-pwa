import {
  getActionCommittees,
  getEventPlansForCampaign,
} from "@/services/campaign-ops-service";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getRushMonthEventRsvpPosture } from "@/services/rush-month-event-rsvp";
import {
  getSopWorkflowRuntime,
  getWorkflowCurrentPhaseExitSignal,
  getWorkflowCurrentPhaseObjective,
} from "@/services/sop-workflow-runtime";
import type { ChapterEventPlan } from "@/shared/types/campaigns";
import type { IntegrationEvent, OutboxItem } from "@/shared/types/domain";

export type RushMonthEventReadinessRow = {
  id: string;
  title: string;
  committeeName: string;
  timing: string;
  memberSection: "this_week" | "coming_up";
  memberDateTimeLabel: string;
  memberLocationLabel: string;
  memberCampaignLabel: string;
  memberPointsLabel: string;
  memberRsvpLabel: string;
  memberRsvpState: "registered" | "open";
  memberLumaLabel: string | null;
  eventTypeLabel: string;
  rsvpStatusLabel: string;
  rsvpDetail: string;
  rsvpStatusTone: "ready" | "mocked" | "disabled";
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
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "ds_admin") {
    return hiddenWorkspace();
  }

  const eventPlans = getEventPlansForCampaign("rush-month");
  const rows = eventPlans.map((eventPlan) => toEventReadinessRow(eventPlan, actor));
  const runtime = getSopWorkflowRuntime("rush-month");
  const futureStructuredEvents =
    runtime?.futureStructuredEvents.length
      ? runtime.futureStructuredEvents
      : buildFutureEvents(eventPlans);
  const disabledOutboxItems =
    runtime?.disabledOutboxItems.length
      ? runtime.disabledOutboxItems
      : buildDisabledOutboxItems(eventPlans);
  const safetyNotes =
    runtime?.safetyNotes.length
      ? buildRuntimeSafetyNotes(runtime)
      : [
          "No Luma event is created or updated from this route.",
          "No Luma attendance/check-in import runs from this route.",
          "No NPS email, SMS, or reminder is sent from this route.",
          "No warehouse, Power BI, HubSpot, n8n, or AI export runs from this route.",
          "Event attendance and NPS remain mock/readiness posture until approved.",
        ];

  return {
    canReadWorkspace: true,
    title: getTitle(actor),
    summary: `${buildRuntimeSummary(runtime)} Attendance is what turns RSVP into points and leaderboard movement.`,
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
    futureStructuredEvents: [...futureStructuredEvents],
    disabledOutboxItems: [...disabledOutboxItems],
    safetyNotes: [...safetyNotes],
  };
}

function buildRuntimeSummary(runtime: ReturnType<typeof getSopWorkflowRuntime>) {
  const currentPhase = runtime?.currentPhase;
  const eventStep = runtime?.steps.find((step) => step.id === "rush-events") ?? runtime?.currentStep;
  const base =
    eventStep?.whyItMatters ??
    "Rush Month events should create the moments that make MEDLIFE feel active: socials, Med Talks, volunteer pushes, and proof-worthy experiences.";
  const objective = currentPhase?.objective
    ? `Current phase objective: ${getWorkflowCurrentPhaseObjective(runtime, currentPhase.objective)}`
    : null;
  const exitSignal = currentPhase?.exitCriteria[0]
    ? `Exit signal: ${getWorkflowCurrentPhaseExitSignal(runtime, currentPhase.exitCriteria[0])}`
    : null;

  return [base, objective, exitSignal]
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

function buildRuntimeSafetyNotes(
  runtime: NonNullable<ReturnType<typeof getSopWorkflowRuntime>>,
) {
  const phaseObjective = runtime.currentPhase?.objective
    ? `Current phase objective: ${getWorkflowCurrentPhaseObjective(runtime, runtime.currentPhase.objective)}`
    : null;

  return [
    ...(phaseObjective ? [phaseObjective] : []),
    ...runtime.safetyNotes,
  ];
}

function toEventReadinessRow(
  eventPlan: ChapterEventPlan,
  actor: LocalActorContext,
): RushMonthEventReadinessRow {
  const rsvpPosture = getRushMonthEventRsvpPosture(actor, eventPlan);

  return {
    id: eventPlan.id,
    title: eventPlan.title,
    committeeName: getCommitteeName(eventPlan.committeeId),
    timing: eventPlan.timing,
    ...getMemberEventDisplay(eventPlan),
    eventTypeLabel: eventPlan.eventType.replaceAll("_", " "),
    rsvpStatusLabel: rsvpPosture.label,
    rsvpDetail: rsvpPosture.detail,
    rsvpStatusTone: rsvpPosture.tone,
    lumaStatusLabel: eventPlan.lumaStatus.replaceAll("_", " "),
    lumaStatusTone: eventPlan.lumaStatus,
    ownerRole: eventPlan.ownerRole,
    expectedStudentAction: eventPlan.expectedStudentAction,
    feedbackPlan: eventPlan.feedbackPlan,
    npsQuestion: eventPlan.npsQuestion,
    proofPrompt: eventPlan.proofPrompt,
  };
}

function getMemberEventDisplay(eventPlan: ChapterEventPlan) {
  switch (eventPlan.id) {
    case "event-rush-social-001":
      return {
        memberSection: "this_week" as const,
        memberDateTimeLabel: "Tue Nov 13 · 11:00 AM - 1:00 PM",
        memberLocationLabel: "Bruin Walk Table 7",
        memberCampaignLabel: "Rush Month",
        memberPointsLabel: "20 pts for attending",
        memberRsvpLabel: "RSVP'd",
        memberRsvpState: "registered" as const,
        memberLumaLabel: null,
      };
    case "event-rush-med-talk-001":
      return {
        memberSection: "this_week" as const,
        memberDateTimeLabel: "Thu Nov 15 · 6:00 PM - 8:00 PM",
        memberLocationLabel: "Ackerman 2100",
        memberCampaignLabel: "Rush Month",
        memberPointsLabel: "20 pts for attending",
        memberRsvpLabel: "RSVP",
        memberRsvpState: "open" as const,
        memberLumaLabel: "Luma",
      };
    case "event-rush-social-002":
      return {
        memberSection: "coming_up" as const,
        memberDateTimeLabel: "Sat Nov 18 · 7:00 PM",
        memberLocationLabel: "Student Activities Center",
        memberCampaignLabel: "Rush Month",
        memberPointsLabel: "20 pts for attending",
        memberRsvpLabel: "RSVP",
        memberRsvpState: "open" as const,
        memberLumaLabel: null,
      };
    case "event-rush-orientation-001":
      return {
        memberSection: "coming_up" as const,
        memberDateTimeLabel: "Wed Nov 22 · 5:30 PM",
        memberLocationLabel: "Engineering VI 289",
        memberCampaignLabel: "Rush Month",
        memberPointsLabel: "20 pts for attending",
        memberRsvpLabel: "RSVP",
        memberRsvpState: "open" as const,
        memberLumaLabel: null,
      };
    default:
      return {
        memberSection: "coming_up" as const,
        memberDateTimeLabel: eventPlan.timing,
        memberLocationLabel: "Location to be confirmed",
        memberCampaignLabel: "Rush Month",
        memberPointsLabel: "20 pts for attending",
        memberRsvpLabel: "RSVP",
        memberRsvpState: "open" as const,
        memberLumaLabel: null,
      };
  }
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
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return "Your Rush Month events";
    case "leader":
      return "Leader event readiness";
    case "coach":
      return "Coach event and NPS readiness";
    case "staff":
      return "HQ event readiness";
    case "super_admin":
      return "Full Rush Month event readiness";
    case "ds_admin":
      return "Rush Month event readiness hidden for DS Admin";
  }
}
