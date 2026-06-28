import type { LocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import type {
  AuditLog,
  AutomationOutbox,
  IntegrationEvent,
  PointsEvent,
} from "@/shared/types/domain";

export type StagingLumaMode =
  | "mock"
  | "staging"
  | "disabled"
  | "live_ready_not_enabled";

export type StagingEvent = {
  id: string;
  chapterName: string;
  campaignSlug: "rush-month";
  title: string;
  eventType: "social" | "med_talk" | "local_volunteering" | "fundraiser";
  startsAtLabel: string;
  locationLabel: string;
  ownerUserId: string;
  ownerEmail: string;
  status: "draft" | "prepped" | "shared";
  pointsForAttendance: number;
};

export type EventProviderLink = {
  id: string;
  eventId: string;
  provider: "luma";
  mode: StagingLumaMode;
  status: "attached" | "requested" | "disabled";
  externalEventId: string | null;
  publicUrl: string | null;
  qrCodeValue: string | null;
  browserSafeKeyExposure: false;
};

export type EventRsvp = {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  status: "going";
  source: "mymedlife";
  recordedAt: string;
};

export type EventAttendance = {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  status: "confirmed";
  source: "leader_check_in" | "luma_sync_mock";
  recordedAt: string;
};

export type StagingLumaEventLoopState = {
  mode: StagingLumaMode;
  chapterName: string;
  event: StagingEvent | null;
  providerLink: EventProviderLink | null;
  feedShared: boolean;
  rsvps: EventRsvp[];
  attendance: EventAttendance[];
  pointsEvents: PointsEvent[];
  integrationEvents: IntegrationEvent[];
  automationOutbox: AutomationOutbox[];
  auditRecords: AuditLog[];
};

export type StagingLumaEventLoopSummary = {
  mode: StagingLumaMode;
  eventStored: boolean;
  lumaLinkReady: boolean;
  qrReady: boolean;
  sharedToFeed: boolean;
  rsvpCount: number;
  attendanceCount: number;
  pointsAwarded: number;
  duplicatePointsPrevented: boolean;
  externalWritesEnabled: false;
};

export type StagingLumaEventLoopReadModel = {
  summary: StagingLumaEventLoopSummary;
  providerStatusLabel: string;
  sequence: {
    label: string;
    detail: string;
    eventType: string;
  }[];
  safetyNotes: string[];
};

const defaultChapterName = "UCLA MEDLIFE";
const defaultOccurredAt = "local-staging-time";

export function createEmptyStagingLumaEventLoop(
  input: {
    mode?: StagingLumaMode;
    chapterName?: string;
  } = {},
): StagingLumaEventLoopState {
  return {
    mode: input.mode ?? "staging",
    chapterName: input.chapterName ?? defaultChapterName,
    event: null,
    providerLink: null,
    feedShared: false,
    rsvps: [],
    attendance: [],
    pointsEvents: [],
    integrationEvents: [],
    automationOutbox: [],
    auditRecords: [],
  };
}

export function prepStagingLumaEvent(
  state: StagingLumaEventLoopState,
  actor: LocalActorContext,
  input: {
    title?: string;
    eventType?: StagingEvent["eventType"];
    startsAtLabel?: string;
    locationLabel?: string;
    pointsForAttendance?: number;
  } = {},
): StagingLumaEventLoopState {
  assertCanManageChapterEvent(actor, state.chapterName);

  const event: StagingEvent = {
    id: "staging-rush-month-intro-gbm",
    chapterName: state.chapterName,
    campaignSlug: "rush-month",
    title: input.title ?? "Intro GBM",
    eventType: input.eventType ?? "med_talk",
    startsAtLabel: input.startsAtLabel ?? "Thu Nov 15 · 6:00 PM - 8:00 PM",
    locationLabel: input.locationLabel ?? "Ackerman 2100",
    ownerUserId: actor.user.id,
    ownerEmail: actor.user.email,
    status: "prepped",
    pointsForAttendance: input.pointsForAttendance ?? 20,
  };
  const providerLink = createProviderLink(state.mode, event);
  const eventCreated = createIntegrationEvent("event_created", {
    title: "Chapter event stored in myMEDLIFE",
    destination: "internal",
    status: "recorded",
    detail:
      "Leader prepped the event in the app-owned staging model before any Luma or external send can run.",
  });
  const lumaRequested = createIntegrationEvent("luma_event_create_requested", {
    title: "Luma event create/link requested",
    destination: "Luma",
    status: getProviderEventStatus(state.mode),
    detail: getProviderRequestDetail(state.mode),
  });
  const lumaLinked = createIntegrationEvent("luma_event_linked", {
    title: "Luma link attached",
    destination: "Luma",
    status: providerLink.status === "attached" ? "mocked" : "disabled",
    detail:
      providerLink.publicUrl && providerLink.qrCodeValue
        ? "Staging-safe Luma URL and QR value were generated from app state. No raw Luma key is present."
        : "Luma link remains disabled until the provider mode is approved.",
  });
  const rsvpLink = createIntegrationEvent("event_rsvp_link_generated", {
    title: "RSVP link generated",
    destination: "internal",
    status: providerLink.publicUrl ? "recorded" : "disabled",
    detail:
      providerLink.publicUrl
        ? "Member RSVP can route through the app-owned event page."
        : "No RSVP link is exposed while the provider mode is disabled.",
  });
  const qrEvent = createIntegrationEvent("event_qr_generated", {
    title: "Event QR generated",
    destination: "internal",
    status: providerLink.qrCodeValue ? "recorded" : "disabled",
    detail:
      providerLink.qrCodeValue
        ? "QR value points at the staging-safe event link."
        : "QR generation stays disabled with the provider link.",
  });

  return {
    ...state,
    event,
    providerLink,
    integrationEvents: [
      ...state.integrationEvents,
      eventCreated,
      lumaRequested,
      lumaLinked,
      rsvpLink,
      qrEvent,
    ],
    automationOutbox: [
      ...state.automationOutbox,
      createOutboxItem(lumaRequested.id, "Luma", "Luma event creation remains blocked from external execution."),
    ],
    auditRecords: [
      ...state.auditRecords,
      createAuditRecord(actor, "event_prepped", "chapter_event", event.id),
    ],
  };
}

export function shareStagingEventToFeed(
  state: StagingLumaEventLoopState,
  actor: LocalActorContext,
): StagingLumaEventLoopState {
  const event = requireEvent(state);
  assertCanManageChapterEvent(actor, event.chapterName);

  return {
    ...state,
    event: {
      ...event,
      status: "shared",
    },
    feedShared: true,
    integrationEvents: [
      ...state.integrationEvents,
      createIntegrationEvent("event_shared_to_feed", {
        title: "Event shared to student feed",
        destination: "internal",
        status: "recorded",
        detail:
          "The event is visible in the member feed/read model. No email, SMS, n8n, or Luma send occurred.",
      }),
    ],
    auditRecords: [
      ...state.auditRecords,
      createAuditRecord(actor, "event_shared_to_feed", "chapter_event", event.id),
    ],
  };
}

export function recordMemberEventRsvp(
  state: StagingLumaEventLoopState,
  actor: LocalActorContext,
): StagingLumaEventLoopState {
  const event = requireEvent(state);
  assertCanRsvpAsSelf(actor);

  if (state.rsvps.some((rsvp) => rsvp.eventId === event.id && rsvp.userId === actor.user.id)) {
    return state;
  }

  const rsvp: EventRsvp = {
    id: `rsvp-${event.id}-${actor.user.id}`,
    eventId: event.id,
    userId: actor.user.id,
    userEmail: actor.user.email,
    status: "going",
    source: "mymedlife",
    recordedAt: defaultOccurredAt,
  };

  return {
    ...state,
    rsvps: [...state.rsvps, rsvp],
    integrationEvents: [
      ...state.integrationEvents,
      createIntegrationEvent("event_rsvp_recorded", {
        title: "Member RSVP recorded",
        destination: "internal",
        status: "recorded",
        detail:
          "A member RSVP was recorded as app-owned state. No Luma attendee write or external send occurred.",
      }),
    ],
    auditRecords: [
      ...state.auditRecords,
      createAuditRecord(actor, "event_rsvp_recorded", "chapter_event", event.id),
    ],
  };
}

export function recordEventAttendanceAndAwardPoints(
  state: StagingLumaEventLoopState,
  actor: LocalActorContext,
  input: {
    userId: string;
    userEmail: string;
    source?: EventAttendance["source"];
  },
): StagingLumaEventLoopState {
  const event = requireEvent(state);
  assertCanManageChapterEvent(actor, event.chapterName);

  const attendanceAlreadyRecorded = state.attendance.some(
    (row) => row.eventId === event.id && row.userId === input.userId,
  );
  const attendance: EventAttendance = {
    id: `attendance-${event.id}-${input.userId}`,
    eventId: event.id,
    userId: input.userId,
    userEmail: input.userEmail,
    status: "confirmed",
    source: input.source ?? "leader_check_in",
    recordedAt: defaultOccurredAt,
  };
  const nextAttendance = attendanceAlreadyRecorded
    ? state.attendance
    : [...state.attendance, attendance];
  const hasPointsEvent = state.pointsEvents.some(
    (pointsEvent) =>
      pointsEvent.assignmentId === event.id && pointsEvent.userId === input.userId,
  );
  const pointsEvent: PointsEvent = {
    id: `points-${event.id}-${input.userId}`,
    assignmentId: event.id,
    userId: input.userId,
    points: event.pointsForAttendance,
    reason: `Attendance confirmed for ${event.title}`,
  };

  return {
    ...state,
    attendance: nextAttendance,
    pointsEvents: hasPointsEvent
      ? state.pointsEvents
      : [...state.pointsEvents, pointsEvent],
    integrationEvents: [
      ...state.integrationEvents,
      ...(attendanceAlreadyRecorded
        ? []
        : [
            createIntegrationEvent("event_attendance_recorded", {
              title: "Attendance recorded",
              destination: "internal",
              status: "recorded",
              detail:
                "Leader confirmed attendance inside myMEDLIFE. Luma sync remains mocked or disabled.",
            }),
          ]),
      ...(hasPointsEvent
        ? []
        : [
            createIntegrationEvent("event_points_awarded", {
              title: "Attendance points awarded once",
              destination: "internal",
              status: "recorded",
              detail:
                "Confirmed attendance created one points event for the member/event pair.",
            }),
          ]),
    ],
    auditRecords: [
      ...state.auditRecords,
      ...(attendanceAlreadyRecorded
        ? []
        : [createAuditRecord(actor, "event_attendance_recorded", "chapter_event", event.id)]),
      ...(hasPointsEvent
        ? []
        : [createAuditRecord(actor, "event_points_awarded", "points_event", pointsEvent.id)]),
    ],
  };
}

export function recordLumaSyncFailure(
  state: StagingLumaEventLoopState,
  actor: LocalActorContext,
  detail = "Luma sync stayed disabled or failed safely; no retry or external send ran.",
): StagingLumaEventLoopState {
  assertCanConfigureProvider(actor);

  return {
    ...state,
    integrationEvents: [
      ...state.integrationEvents,
      createIntegrationEvent("luma_sync_failed", {
        title: "Luma sync failed safely",
        destination: "Luma",
        status: "disabled",
        detail,
      }),
    ],
    auditRecords: [
      ...state.auditRecords,
      createAuditRecord(actor, "luma_sync_failed", "integration_provider", "luma"),
    ],
  };
}

export function summarizeStagingLumaEventLoop(
  state: StagingLumaEventLoopState,
): StagingLumaEventLoopSummary {
  return {
    mode: state.mode,
    eventStored: Boolean(state.event),
    lumaLinkReady: Boolean(state.providerLink?.publicUrl),
    qrReady: Boolean(state.providerLink?.qrCodeValue),
    sharedToFeed: state.feedShared,
    rsvpCount: state.rsvps.length,
    attendanceCount: state.attendance.length,
    pointsAwarded: state.pointsEvents.reduce(
      (total, pointsEvent) => total + pointsEvent.points,
      0,
    ),
    duplicatePointsPrevented: state.attendance.length >= state.pointsEvents.length,
    externalWritesEnabled: false,
  };
}

export function getStagingLumaEventLoopReadModel(
  mode: StagingLumaMode = "staging",
): StagingLumaEventLoopReadModel {
  const eventStored = true;
  const providerEnabled = mode === "mock" || mode === "staging";

  return {
    summary: {
      mode,
      eventStored,
      lumaLinkReady: providerEnabled,
      qrReady: providerEnabled,
      sharedToFeed: true,
      rsvpCount: 1,
      attendanceCount: 1,
      pointsAwarded: 20,
      duplicatePointsPrevented: true,
      externalWritesEnabled: false,
    },
    providerStatusLabel: providerEnabled
      ? "Staging-safe link attached"
      : mode === "live_ready_not_enabled"
        ? "Live-ready, not enabled"
        : "Disabled",
    sequence: [
      {
        label: "Leader preps event",
        detail: "Event is stored in myMEDLIFE with chapter ownership.",
        eventType: "event_created",
      },
      {
        label: "Luma link and QR",
        detail: providerEnabled
          ? "Link and QR are generated without exposing Luma keys."
          : "Provider link remains blocked until approved.",
        eventType: providerEnabled ? "luma_event_linked" : "luma_event_create_requested",
      },
      {
        label: "Shared to feed",
        detail: "Members can discover the event from the app-owned feed.",
        eventType: "event_shared_to_feed",
      },
      {
        label: "Member RSVP",
        detail: "RSVP is recorded as the signed-in member only.",
        eventType: "event_rsvp_recorded",
      },
      {
        label: "Attendance to points",
        detail: "Confirmed attendance creates one points event per member/event.",
        eventType: "event_points_awarded",
      },
    ],
    safetyNotes: [
      "No production Luma write is enabled.",
      "No raw Luma key is exposed to the browser, logs, audit details, or local storage.",
      "Automation outbox rows remain disabled until a later approval opens live execution.",
    ],
  };
}

export function canActorCreateChapterEvent(
  actor: LocalActorContext,
  chapterName: string,
): boolean {
  return canManageChapterEvent(actor, chapterName);
}

export function canActorRsvpToEvent(actor: LocalActorContext): boolean {
  return getActorSurfaceFamily(actor) === "member";
}

export function canActorViewEventAnalytics(
  actor: LocalActorContext,
  chapterName: string,
): boolean {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "coach") {
    return actor.coachPortfolioChapterNames.includes(chapterName);
  }

  return ["staff", "ds_admin", "super_admin"].includes(surfaceFamily);
}

export function canActorConfigureLumaStatus(actor: LocalActorContext): boolean {
  return canConfigureProvider(actor);
}

function assertCanManageChapterEvent(
  actor: LocalActorContext,
  chapterName: string,
) {
  if (!canManageChapterEvent(actor, chapterName)) {
    throw new Error("This actor cannot manage events for this chapter.");
  }
}

function assertCanRsvpAsSelf(actor: LocalActorContext) {
  if (!canActorRsvpToEvent(actor)) {
    throw new Error("Only member workspace actors can RSVP as themselves.");
  }
}

function assertCanConfigureProvider(actor: LocalActorContext) {
  if (!canConfigureProvider(actor)) {
    throw new Error("Only DS Admin or Super Admin can configure Luma provider status.");
  }
}

function canManageChapterEvent(actor: LocalActorContext, chapterName: string): boolean {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "super_admin") {
    return true;
  }

  return surfaceFamily === "leader" && actor.chapterNames.includes(chapterName);
}

function canConfigureProvider(actor: LocalActorContext): boolean {
  const surfaceFamily = getActorSurfaceFamily(actor);
  return surfaceFamily === "ds_admin" || surfaceFamily === "super_admin";
}

function createProviderLink(
  mode: StagingLumaMode,
  event: StagingEvent,
): EventProviderLink {
  const enabled = mode === "mock" || mode === "staging";
  const slug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const url = enabled
    ? `https://staging.mymedlife.org/rush-month/events/${event.id}?provider=luma`
    : null;

  return {
    id: `provider-link-${event.id}-luma`,
    eventId: event.id,
    provider: "luma",
    mode,
    status: enabled ? "attached" : mode === "live_ready_not_enabled" ? "requested" : "disabled",
    externalEventId: enabled ? `luma-staging-${slug}` : null,
    publicUrl: url,
    qrCodeValue: url ? `mymedlife-luma-qr:${url}` : null,
    browserSafeKeyExposure: false,
  };
}

function getProviderEventStatus(mode: StagingLumaMode): IntegrationEvent["status"] {
  return mode === "mock" || mode === "staging" ? "mocked" : "disabled";
}

function getProviderRequestDetail(mode: StagingLumaMode): string {
  switch (mode) {
    case "mock":
      return "A local Luma create request was modeled. No Luma API write happened.";
    case "staging":
      return "A staging-safe Luma request was recorded for reviewer flow proof. No production Luma write happened.";
    case "live_ready_not_enabled":
      return "The provider contract is ready to review, but live Luma execution is not enabled.";
    case "disabled":
      return "Luma event creation is disabled.";
  }
}

function requireEvent(state: StagingLumaEventLoopState): StagingEvent {
  if (!state.event) {
    throw new Error("Create or prep the event before continuing the Luma event loop.");
  }

  return state.event;
}

function createIntegrationEvent(
  eventType: string,
  input: Omit<IntegrationEvent, "id" | "eventType" | "occurredAt">,
): IntegrationEvent {
  return {
    id: `integration-${eventType}`,
    eventType,
    occurredAt: defaultOccurredAt,
    ...input,
  };
}

function createOutboxItem(
  sourceEventId: string,
  destination: AutomationOutbox["destination"],
  payloadSummary: string,
): AutomationOutbox {
  return {
    id: `outbox-${sourceEventId}-${destination.toLowerCase()}`,
    sourceEventId,
    destination,
    status: "disabled",
    payloadSummary,
  };
}

function createAuditRecord(
  actor: LocalActorContext,
  action: string,
  targetType: string,
  targetId: string,
): AuditLog {
  return {
    id: `audit-${action}-${targetId}`,
    actorUserId: actor.user.id,
    action,
    targetType,
    targetId,
  };
}
