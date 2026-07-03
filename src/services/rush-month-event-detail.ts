import {
  getActionCommittees,
  getChapterEventPlans,
} from "@/services/campaign-ops-service";
import { getEventRsvpPosture } from "@/services/event-loop";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getMemberLaunchLaneEventRowById,
  type MemberLaunchLaneEventRow,
} from "@/services/member-launch-lane-events";
import {
  type MemberActionRouteSource,
} from "@/services/member-action-route-href";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getLaunchLaneMemberEventsHref,
  getLaunchLaneMemberPointsHref,
} from "@/services/events-points-launch-lane";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
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
  secondaryStep: EventDetailNextStep;
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
  data?: ReadOnlyAppData | null,
): RushMonthEventDetailWorkspace | null {
  const surfaceFamily = getActorSurfaceFamily(actor);
  const normalizedSource = normalizeMemberDetailSource(source);
  const liveEvent = data ? getMemberLaunchLaneEventRowById(actor, data, eventId) : null;
  const eventPlan = getChapterEventPlans().find(
    (item) => item.id === eventId && item.campaignSlug === "rush-month",
  );

  if (!eventPlan && !liveEvent) {
    return null;
  }

  if (surfaceFamily === "ds_admin") {
    return hiddenWorkspace();
  }

  if (liveEvent) {
    return buildLiveEventWorkspace(actor, surfaceFamily, liveEvent, normalizedSource);
  }

  if (!eventPlan) {
    return null;
  }

  const readinessChecks = buildReadinessChecks(actor, eventPlan);
  const disabledOutboxItems = buildDisabledOutboxItems(eventPlan);

  return {
    canReadWorkspace: true,
    title: getTitle(actor, surfaceFamily),
    summary:
      "See when to show up, what kind of student moment to create, and how RSVP, attendance, and points connect after the event. Luma is the source of truth, RSVP shows intent, attendance confirms who showed up, and points move once attendance is confirmed.",
    event: toEventDetail(actor, eventPlan),
    nextStep: getNextStep(actor, surfaceFamily, normalizedSource),
    secondaryStep: getSecondaryStep(surfaceFamily, normalizedSource),
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

function buildLiveEventWorkspace(
  actor: LocalActorContext,
  surfaceFamily: ActorSurfaceFamily,
  event: MemberLaunchLaneEventRow,
  source: MemberActionRouteSource | null,
): RushMonthEventDetailWorkspace {
  const readinessChecks = buildLiveReadinessChecks(event);
  const disabledOutboxItems = buildDisabledOutboxItemsForSource(event.id);

  return {
    canReadWorkspace: true,
    title: getTitle(actor, surfaceFamily),
    summary:
      "See the real chapter event, what RSVP already says, how attendance is confirmed, and how points move once the chapter can trust the record. Luma is the source of truth, RSVP shows intent, attendance confirms who showed up, and points move once attendance is confirmed.",
    event: toLiveEventDetail(event),
    nextStep: getNextStep(actor, surfaceFamily, source),
    secondaryStep: getSecondaryStep(surfaceFamily, source),
    readinessChecks,
    futureStructuredEvents: buildLiveFutureEvents(event),
    disabledOutboxItems,
    safetyNotes: [
      "No Luma event create/update runs from this event detail.",
      "No attendance import, proof upload, or event recap write runs from this route.",
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
  const rsvpPosture = getEventRsvpPosture(actor, eventPlan);
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

function toLiveEventDetail(event: MemberLaunchLaneEventRow): RushMonthEventDetail {
  return {
    id: event.id,
    title: event.title,
    committeeName: "Chapter events",
    timing: event.timing,
    memberDateTimeLabel: event.memberDateTimeLabel,
    memberLocationLabel: event.memberLocationLabel,
    memberCampaignLabel: event.memberCampaignLabel,
    memberPointsLabel: event.memberPointsLabel,
    memberLumaLabel: event.memberLumaLabel,
    eventTypeLabel: event.eventTypeLabel,
    rsvpStatusLabel:
      event.memberRsvpState === "registered"
        ? "RSVP already recorded"
        : event.rsvpStatusLabel,
    rsvpDetail: event.rsvpDetail,
    rsvpStatusTone: event.rsvpStatusTone,
    lumaStatusLabel: event.lumaStatusLabel,
    lumaStatusTone: event.lumaStatusTone,
    ownerRole: "Chapter leader",
    supportLane: "Event loop",
    expectedStudentAction:
      "Show up, check in, and help the chapter turn this event into attendance and points.",
    feedbackPlan:
      "Use the same event record to confirm attendance, keep follow-up clean, and document what students took away from the event.",
    proofPrompt:
      "This launch lane stays simple: attendance and points readback should do the proof work before broader modules turn on.",
    npsQuestion:
      "Did this event make MEDLIFE feel worth coming back to?",
  };
}

function getMemberEventDetailDisplay(eventPlan: ChapterEventPlan) {
  switch (eventPlan.id) {
    case "event-rush-social-001":
      return {
        memberDateTimeLabel: "Tue Nov 13 · 11:00 AM - 1:00 PM",
        memberLocationLabel: "Bruin Walk Table 7",
        memberCampaignLabel: "Event loop",
        memberPointsLabel: "20 pts for attending",
        memberLumaLabel: null,
      };
    case "event-rush-med-talk-001":
      return {
        memberDateTimeLabel: "Thu Nov 15 · 6:00 PM - 8:00 PM",
        memberLocationLabel: "Ackerman 2100",
        memberCampaignLabel: "Event loop",
        memberPointsLabel: "20 pts for attending",
        memberLumaLabel: "Luma",
      };
    case "event-rush-social-002":
      return {
        memberDateTimeLabel: "Sat Nov 18 · 7:00 PM",
        memberLocationLabel: "Student Activities Center",
        memberCampaignLabel: "Event loop",
        memberPointsLabel: "20 pts for attending",
        memberLumaLabel: null,
      };
    case "event-rush-orientation-001":
      return {
        memberDateTimeLabel: "Wed Nov 22 · 5:30 PM",
        memberLocationLabel: "Engineering VI 289",
        memberCampaignLabel: "Event loop",
        memberPointsLabel: "20 pts for attending",
        memberLumaLabel: null,
      };
    default:
      return {
        memberDateTimeLabel: eventPlan.timing,
        memberLocationLabel: "Location to be confirmed",
        memberCampaignLabel: "Event loop",
        memberPointsLabel: "20 pts for attending",
        memberLumaLabel: null,
      };
  }
}

function buildReadinessChecks(
  actor: LocalActorContext,
  eventPlan: ChapterEventPlan,
): EventDetailCheck[] {
  const rsvpPosture = getEventRsvpPosture(actor, eventPlan);

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

function buildLiveReadinessChecks(event: MemberLaunchLaneEventRow): EventDetailCheck[] {
  return [
    {
      label: "Owner",
      status: "ready",
      detail: "Chapter leaders own the live event loop for this chapter event.",
    },
    {
      label: "Student action",
      status: "ready",
      detail:
        "RSVP, show up, and let attendance become the clean readback that explains points.",
    },
    {
      label: "RSVP posture",
      status: event.rsvpStatusTone,
      detail: event.rsvpDetail,
    },
    {
      label: "Luma posture",
      status: event.memberLumaLabel ? "mocked" : "disabled",
      detail: event.memberLumaLabel
        ? "A chapter event is linked in the pilot lane. Event truth lives in Luma while the app keeps RSVP, attendance, and points readable."
        : "The chapter event is visible, but no Luma link is active yet for member RSVP.",
    },
    {
      label: "Attendance posture",
      status: event.attendanceCount > 0 ? "ready" : "mocked",
      detail:
        event.attendanceCount > 0
          ? `${event.attendanceCount} attendee(s) are already visible in the event readback.`
          : "Attendance has not been confirmed in the current readback yet.",
    },
    {
      label: "Points posture",
      status: event.pointsAwarded > 0 ? "ready" : "mocked",
      detail:
        event.pointsAwarded > 0
          ? `${event.pointsAwarded} point(s) are already visible for this event.`
          : "Points are still pending for this event readback.",
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

function buildLiveFutureEvents(event: MemberLaunchLaneEventRow): IntegrationEvent[] {
  return [
    {
      id: `${event.id}-viewed`,
      eventType: "chapter_event_viewed",
      title: "Future event detail viewed",
      destination: "internal",
      status: "disabled",
      detail:
        "A future audited event workspace view could be recorded after auth and privacy rules are approved.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${event.id}-luma`,
      eventType: "luma_event_linked",
      title: "Future Luma event linked",
      destination: "Luma",
      status: event.memberLumaLabel ? "mocked" : "disabled",
      detail: event.memberLumaLabel
        ? "The chapter event is already represented in the pilot Luma lane. No new Luma write runs from this route."
        : "No Luma link is represented yet, and no Luma write is available from this route.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${event.id}-attendance`,
      eventType: "luma_attendance_import_mocked",
      title: "Future attendance import mocked",
      destination: "Luma",
      status: "disabled",
      detail:
        "Attendance/check-in rows would eventually update event KPIs after approval.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${event.id}-nps`,
      eventType: "kpi_event_recorded",
      title: "Future NPS KPI recorded",
      destination: "internal",
      status: "disabled",
      detail:
        "Post-event feedback would eventually become a KPI event, but this route only shows the prompt.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${event.id}-proof`,
      eventType: "evidence_submitted",
      title: "Future event proof requested",
      destination: "internal",
      status: "disabled",
      detail:
        "This launch lane keeps proof simple for now and relies on attendance plus points readback before broader proof modules turn on.",
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

  return buildDisabledOutboxItemsForSource(sourceEventId);
}

function buildDisabledOutboxItemsForSource(sourceEventId: string): OutboxItem[] {

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
  source: MemberActionRouteSource | null = null,
): EventDetailNextStep {
  switch (surfaceFamily) {
    case "member":
      return {
        label: "Open leaderboard",
        href: getLaunchLaneMemberPointsHref(source ?? "events"),
        detail:
          "After attendance is confirmed, the chapter leaderboard is the clearest place to see the point impact.",
      };
    case "leader":
      return {
        label: "Open leader events",
        href: "/leader?view=events",
        detail:
          "Keep event planning, RSVP posture, attendance, and points inside the leader workspace.",
      };
    case "coach":
      return {
        label: "Open staff chapters",
        href: "/staff?view=chapters",
        detail:
          "Use the staff chapter list to compare RSVP posture, attendance, points, and chapter movement.",
      };
    case "staff":
      return {
        label: "Open staff chapters",
        href: "/staff?view=chapters",
        detail:
          "Return to the staff chapter list to compare this event against the broader org picture.",
      };
    case "super_admin":
      return {
        label: "Open admin backend",
        href: "/admin",
        detail:
          "Use the backend for rollout and audit review while chapter teams stay in the event loop.",
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

function getSecondaryStep(
  surfaceFamily: ActorSurfaceFamily,
  source: MemberActionRouteSource | null = null,
): EventDetailNextStep {
  switch (surfaceFamily) {
    case "member":
      return {
        label: "Open events",
        href: getLaunchLaneMemberEventsHref(source ?? "events"),
        detail:
          "Stay close to the event list so RSVP, attendance, and the next chapter moment all stay easy to reach.",
      };
    case "leader":
      return {
        label: "Open leader points",
        href: "/leader?view=leaderboard",
        detail:
          "Use the chapter leaderboard to confirm that attendance is turning into points the way the team expects.",
      };
    case "coach":
    case "staff":
      return {
        label: "Open staff points",
        href: "/staff?view=leaderboard",
        detail:
          "Use the staff leaderboard to compare point movement across chapters without opening extra modules.",
      };
    case "super_admin":
    case "ds_admin":
      return {
        label: "Open admin",
        href: "/admin",
        detail:
          "Keep backend review in admin while the chapter-facing product stays centered on events and points.",
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

function normalizeMemberDetailSource(source: MemberActionRouteSource | null) {
  if (source === "campaigns") {
    return null;
  }

  return source;
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
    secondaryStep: {
      label: "Open admin",
      href: "/admin",
      detail:
        "Use the admin control center for disabled integration posture.",
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
