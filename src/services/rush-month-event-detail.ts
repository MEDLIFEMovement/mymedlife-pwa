import {
  getActionCommittees,
  getChapterEventPlans,
} from "@/services/campaign-ops-service";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  type MemberActionRouteSource,
  buildMemberActionRouteHref,
} from "@/services/member-action-route-href";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import { getRushMonthEventRsvpPosture } from "@/services/rush-month-event-rsvp";
import type { ChapterEventPlan } from "@/shared/types/campaigns";
import type { IntegrationEvent, OutboxItem } from "@/shared/types/domain";

export type EventDetailCheckStatus = "ready" | "mocked" | "disabled";

export type EventDetailCheck = {
  label: string;
  status: EventDetailCheckStatus;
  detail: string;
};

export type EventDetailNextStep = {
  label: string;
  href: string;
  detail: string;
};

export type RushMonthEventDetail = {
  id: string;
  title: string;
  committeeName: string;
  timing: string;
  memberDateTimeLabel: string;
  memberLocationLabel: string;
  memberCampaignLabel: string;
  memberPointsLabel: string;
  memberLumaLabel: string | null;
  eventTypeLabel: string;
  rsvpStatusLabel: string;
  rsvpDetail: string;
  rsvpStatusTone: EventDetailCheckStatus;
  lumaStatusLabel: string;
  lumaStatusTone: ChapterEventPlan["lumaStatus"];
  ownerRole: string;
  supportLane: string;
  expectedStudentAction: string;
  feedbackPlan: string;
  proofPrompt: string;
  npsQuestion: string;
};

export type RushMonthEventDetailWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  event: RushMonthEventDetail | null;
  nextStep: EventDetailNextStep;
  proofNextStep: EventDetailNextStep;
  readinessChecks: EventDetailCheck[];
  futureStructuredEvents: IntegrationEvent[];
  disabledOutboxItems: OutboxItem[];
  safetyNotes: string[];
  counts: {
    readinessChecks: number;
    disabledOutboxItems: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export function getRushMonthEventDetailWorkspace(
  actor: LocalActorContext,
  eventId: string,
  source: MemberActionRouteSource | null = null,
): RushMonthEventDetailWorkspace | null {
  const surfaceFamily = getActorSurfaceFamily(actor);
  const eventPlan = getChapterEventPlans().find(
    (item) => item.id === eventId && item.campaignSlug === "rush-month",
  );

  if (!eventPlan) {
    return null;
  }

  if (surfaceFamily === "ds_admin") {
    return hiddenWorkspace();
  }

  const readinessChecks = buildReadinessChecks(actor, eventPlan);
  const disabledOutboxItems = buildDisabledOutboxItems(eventPlan);

  return {
    canReadWorkspace: true,
    title: getTitle(actor, surfaceFamily),
    summary:
      "See when to show up, what kind of student moment to create, and what proof to capture after the event.",
    event: toEventDetail(actor, eventPlan),
    nextStep: getNextStep(actor, surfaceFamily, eventPlan.id, source),
    proofNextStep: getProofNextStep(surfaceFamily, eventPlan.id, source),
    readinessChecks,
    futureStructuredEvents: buildFutureEvents(eventPlan),
    disabledOutboxItems,
    safetyNotes: [
      "No Luma event create/update runs from this event detail.",
      "No attendance import, NPS reminder, proof upload, or event recap write runs from this route.",
      "No warehouse, Power BI, HubSpot, n8n, SMS, email, or AI write runs from this route.",
      "Production event data must come from approved server-side write paths with audit records.",
    ],
    counts: {
      readinessChecks: readinessChecks.length,
      disabledOutboxItems: disabledOutboxItems.length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function toEventDetail(
  actor: LocalActorContext,
  eventPlan: ChapterEventPlan,
): RushMonthEventDetail {
  const rsvpPosture = getRushMonthEventRsvpPosture(actor, eventPlan);
  const memberDisplay = getMemberEventDetailDisplay(eventPlan);
  return {
    id: eventPlan.id,
    title: eventPlan.title,
    committeeName: getCommitteeName(eventPlan.committeeId),
    timing: eventPlan.timing,
    memberDateTimeLabel: memberDisplay.memberDateTimeLabel,
    memberLocationLabel: memberDisplay.memberLocationLabel,
    memberCampaignLabel: memberDisplay.memberCampaignLabel,
    memberPointsLabel: memberDisplay.memberPointsLabel,
    memberLumaLabel: memberDisplay.memberLumaLabel,
    eventTypeLabel: eventPlan.eventType.replaceAll("_", " "),
    rsvpStatusLabel: rsvpPosture.label,
    rsvpDetail: rsvpPosture.detail,
    rsvpStatusTone: rsvpPosture.tone,
    lumaStatusLabel: eventPlan.lumaStatus.replaceAll("_", " "),
    lumaStatusTone: eventPlan.lumaStatus,
    ownerRole: eventPlan.ownerRole,
    supportLane: eventPlan.supportLane,
    expectedStudentAction: eventPlan.expectedStudentAction,
    feedbackPlan: eventPlan.feedbackPlan,
    proofPrompt: eventPlan.proofPrompt,
    npsQuestion: eventPlan.npsQuestion,
  };
}

function getMemberEventDetailDisplay(eventPlan: ChapterEventPlan) {
  switch (eventPlan.id) {
    case "event-rush-social-001":
      return {
        memberDateTimeLabel: "Tue Nov 13 · 11:00 AM - 1:00 PM",
        memberLocationLabel: "Bruin Walk Table 7",
        memberCampaignLabel: "Rush Month",
        memberPointsLabel: "20 pts for attending",
        memberLumaLabel: null,
      };
    case "event-rush-med-talk-001":
      return {
        memberDateTimeLabel: "Thu Nov 15 · 6:00 PM - 8:00 PM",
        memberLocationLabel: "Ackerman 2100",
        memberCampaignLabel: "Rush Month",
        memberPointsLabel: "20 pts for attending",
        memberLumaLabel: "Luma",
      };
    case "event-rush-social-002":
      return {
        memberDateTimeLabel: "Sat Nov 18 · 7:00 PM",
        memberLocationLabel: "Student Activities Center",
        memberCampaignLabel: "Rush Month",
        memberPointsLabel: "20 pts for attending",
        memberLumaLabel: null,
      };
    case "event-rush-orientation-001":
      return {
        memberDateTimeLabel: "Wed Nov 22 · 5:30 PM",
        memberLocationLabel: "Engineering VI 289",
        memberCampaignLabel: "Rush Month",
        memberPointsLabel: "20 pts for attending",
        memberLumaLabel: null,
      };
    default:
      return {
        memberDateTimeLabel: eventPlan.timing,
        memberLocationLabel: "Location to be confirmed",
        memberCampaignLabel: "Rush Month",
        memberPointsLabel: "20 pts for attending",
        memberLumaLabel: null,
      };
  }
}

function buildReadinessChecks(
  actor: LocalActorContext,
  eventPlan: ChapterEventPlan,
): EventDetailCheck[] {
  const rsvpPosture = getRushMonthEventRsvpPosture(actor, eventPlan);

  return [
    {
      label: "Owner",
      status: "ready",
      detail: `${eventPlan.ownerRole} owns the event plan in the local campaign model.`,
    },
    {
      label: "Student action",
      status: "ready",
      detail: eventPlan.expectedStudentAction,
    },
    {
      label: "RSVP posture",
      status: rsvpPosture.tone,
      detail: rsvpPosture.detail,
    },
    {
      label: "Luma posture",
      status: eventPlan.lumaStatus === "mock_linked" ? "mocked" : "disabled",
      detail: getLumaStatusDetail(eventPlan),
    },
    {
      label: "NPS prompt",
      status: "ready",
      detail: eventPlan.npsQuestion,
    },
    {
      label: "Proof prompt",
      status: "ready",
      detail: eventPlan.proofPrompt,
    },
  ];
}

function buildFutureEvents(eventPlan: ChapterEventPlan): IntegrationEvent[] {
  return [
    {
      id: `${eventPlan.id}-viewed`,
      eventType: "chapter_event_viewed",
      title: "Future event detail viewed",
      destination: "internal",
      status: "disabled",
      detail:
        "A future audited event workspace view could be recorded after auth and privacy rules are approved.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${eventPlan.id}-luma`,
      eventType: "luma_event_linked",
      title: "Future Luma event linked",
      destination: "Luma",
      status: eventPlan.lumaStatus === "mock_linked" ? "mocked" : "disabled",
      detail: getLumaStatusDetail(eventPlan),
      occurredAt: "local-mock-time",
    },
    {
      id: `${eventPlan.id}-attendance`,
      eventType: "luma_attendance_import_mocked",
      title: "Future attendance import mocked",
      destination: "Luma",
      status: "disabled",
      detail:
        "Attendance/check-in rows would eventually update event KPIs after approval.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${eventPlan.id}-nps`,
      eventType: "kpi_event_recorded",
      title: "Future NPS KPI recorded",
      destination: "internal",
      status: "disabled",
      detail:
        "Post-event feedback would eventually become a KPI event, but this route only shows the prompt.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${eventPlan.id}-proof`,
      eventType: "evidence_submitted",
      title: "Future event proof requested",
      destination: "internal",
      status: "disabled",
      detail: eventPlan.proofPrompt,
      occurredAt: "local-mock-time",
    },
  ];
}

function buildDisabledOutboxItems(eventPlan: ChapterEventPlan[]): OutboxItem[];
function buildDisabledOutboxItems(eventPlan: ChapterEventPlan): OutboxItem[];
function buildDisabledOutboxItems(
  eventPlanOrPlans: ChapterEventPlan | ChapterEventPlan[],
): OutboxItem[] {
  const eventPlan = Array.isArray(eventPlanOrPlans)
    ? eventPlanOrPlans[0]
    : eventPlanOrPlans;
  const sourceEventId = eventPlan?.id ?? "rush-month-event-detail";

  return [
    {
      id: `${sourceEventId}-luma-outbox`,
      sourceEventId,
      destination: "Luma",
      status: "disabled",
      payloadSummary: "Future Luma create/update is blocked until approved.",
    },
    {
      id: `${sourceEventId}-attendance-outbox`,
      sourceEventId,
      destination: "Luma",
      status: "disabled",
      payloadSummary: "Future Luma attendance import is blocked until approved.",
    },
    {
      id: `${sourceEventId}-nps-outbox`,
      sourceEventId,
      destination: "n8n",
      status: "disabled",
      payloadSummary: "Future post-event NPS reminder is blocked until approved.",
    },
    {
      id: `${sourceEventId}-warehouse-outbox`,
      sourceEventId,
      destination: "warehouse",
      status: "disabled",
      payloadSummary: "Future event, proof, and NPS export is blocked until approved.",
    },
  ];
}

function getNextStep(
  actor: LocalActorContext,
  surfaceFamily: ActorSurfaceFamily,
  eventId?: string,
  source: MemberActionRouteSource | null = null,
): EventDetailNextStep {
  if (actor.chapterRoles.includes("Action Committee Chair")) {
    return {
      label: "Check event assignments",
      href: "/rush-month/actions",
      detail:
        "Confirm the owner, support action, feedback prompt, and proof prompt before the chapter meeting.",
    };
  }

  if (actor.chapterRoles.includes("Action Committee Member")) {
    return {
      label: "Find my support action",
      href: "/rush-month/actions",
      detail:
        "Pick the concrete promotion, hosting, or follow-up action tied to this event.",
    };
  }

  switch (surfaceFamily) {
    case "member":
      return {
        label: "Start next action",
        href: buildMemberActionRouteHref("member-push", {
          eventId,
          source: source ?? "events",
        }),
        detail:
          "Show up ready, do the linked Rush Month action, and capture a quick proof note after the event.",
      };
    case "leader":
      return {
        label: "Review assignments",
        href: "/rush-month/actions",
        detail:
          "Make sure this event has an owner, a student action, and a proof collector before it goes live.",
      };
    case "coach":
      return {
        label: "Open coach readout",
        href: "/coach",
        detail:
          "Use the event detail as a coaching signal for chapter momentum, overdue work, and proof quality.",
      };
    case "staff":
    case "super_admin":
      return {
        label: "Open admin outbox",
        href: "/admin",
        detail:
          "Review disabled integration and audit posture before any event automation approval.",
      };
    case "ds_admin":
      return {
        label: "Open admin",
        href: "/admin",
        detail:
          "DS Admin should inspect integration posture from admin surfaces, not chapter event truth.",
      };
  }
}

function getProofNextStep(
  surfaceFamily: ActorSurfaceFamily,
  eventId?: string,
  source: MemberActionRouteSource | null = null,
): EventDetailNextStep {
  switch (surfaceFamily) {
    case "member":
      return {
        label: "Submit evidence",
        href: buildMemberActionRouteHref("member-push", {
          eventId,
          source: source ?? "events",
          step: "submit",
        }),
        detail:
          "After the event, save one photo, quote, or short proof note on the same action route.",
      };
    case "leader":
    case "coach":
    case "staff":
    case "super_admin":
    case "ds_admin":
      return {
        label: "Open evidence posture",
        href: "/rush-month/evidence",
        detail:
          "Inspect the proof posture without enabling live uploads, public sharing, or external sends.",
      };
  }
}

function getLumaStatusDetail(eventPlan: ChapterEventPlan): string {
  if (eventPlan.lumaStatus === "mock_linked") {
    return "A mock Luma link is represented locally. No Luma API write happened.";
  }

  if (eventPlan.lumaStatus === "future_sync_disabled") {
    return "Future Luma create/update is intentionally disabled for this event.";
  }

  return "No Luma link is represented yet, and no Luma write is available.";
}

function getCommitteeName(committeeId: string): string {
  return (
    getActionCommittees().find((committee) => committee.id === committeeId)?.name ??
    "Action Committee"
  );
}

function getTitle(
  actor: LocalActorContext,
  surfaceFamily: ActorSurfaceFamily,
): string {
  if (actor.chapterRoles.includes("Action Committee Chair")) {
    return "Chair event execution check";
  }

  if (actor.chapterRoles.includes("Action Committee Member")) {
    return "Your event support plan";
  }

  switch (surfaceFamily) {
    case "member":
      return "Your event game plan";
    case "leader":
      return "Leader event execution check";
    case "coach":
      return "Coach event risk readout";
    case "staff":
      return "HQ event readiness detail";
    case "super_admin":
      return "Full event readiness detail";
    case "ds_admin":
      return "Event detail hidden for DS Admin";
  }
}

function hiddenWorkspace(): RushMonthEventDetailWorkspace {
  const disabledOutboxItems = buildDisabledOutboxItems([]);

  return {
    canReadWorkspace: false,
    title: "Event detail hidden for DS Admin",
    summary:
      "DS Admin can inspect disabled integration posture from admin surfaces, but should not read chapter event, attendance, NPS, or proof truth.",
    event: null,
    nextStep: {
      label: "Open admin",
      href: "/admin",
      detail:
        "Use the admin control center for integration posture and outbox readiness.",
    },
    proofNextStep: {
      label: "Open admin",
      href: "/admin",
      detail:
        "Use the admin control center for disabled proof and integration posture.",
    },
    readinessChecks: [],
    futureStructuredEvents: [],
    disabledOutboxItems,
    safetyNotes: [],
    counts: {
      readinessChecks: 0,
      disabledOutboxItems: disabledOutboxItems.length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}
