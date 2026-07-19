import type { LocalActorContext } from "@/services/local-actor-context";
import { getLaunchLaneAttendancePointsValue } from "@/services/launch-lane-points-policy";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import type {
  AuditLog,
  AutomationOutbox,
  IntegrationEvent,
  PointsEvent,
} from "@/shared/types/domain";
import type {
  AuditLogRow,
  AutomationOutboxRow,
  EventRow,
  IntegrationEventRow,
  PointsEventRow,
} from "@/shared/types/persistence";

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
  status: "going" | "cancelled";
  source: "mymedlife";
  recordedAt: string;
  cancelledAt?: string;
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

export type StagingLumaEventLoopEvidenceSnapshot = {
  eventRows: EventRow[];
  integrationEventRows: IntegrationEventRow[];
  automationOutboxRows: AutomationOutboxRow[];
  pointsEventRows: PointsEventRow[];
  auditLogRows?: AuditLogRow[];
};

export type StagingLumaCrossRoleProofStatus = "ready" | "needs_review";

export type StagingLumaCrossRoleProofCheck = {
  label: string;
  value: string;
  status: StagingLumaCrossRoleProofStatus;
};

export type StagingLumaCrossRoleProofCard = {
  id: "member" | "leader" | "staff" | "admin";
  title: string;
  summary: string;
  verdict: StagingLumaCrossRoleProofStatus;
  routeLinks: Array<{
    href: string;
    label: string;
  }>;
  checks: StagingLumaCrossRoleProofCheck[];
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
    pointsForAttendance: input.pointsForAttendance ?? getLaunchLaneAttendancePointsValue(),
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

  const existing = state.rsvps.find(
    (rsvp) => rsvp.eventId === event.id && rsvp.userId === actor.user.id,
  );

  if (existing?.status === "going") {
    return state;
  }

  const rsvp: EventRsvp = {
    id: existing?.id ?? `rsvp-${event.id}-${actor.user.id}`,
    eventId: event.id,
    userId: actor.user.id,
    userEmail: actor.user.email,
    status: "going",
    source: "mymedlife",
    recordedAt: defaultOccurredAt,
  };

  return {
    ...state,
    rsvps: existing
      ? state.rsvps.map((row) => (row.id === existing.id ? rsvp : row))
      : [...state.rsvps, rsvp],
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

export function cancelMemberEventRsvp(
  state: StagingLumaEventLoopState,
  actor: LocalActorContext,
): StagingLumaEventLoopState {
  const event = requireEvent(state);
  assertCanRsvpAsSelf(actor);

  const attendanceAlreadyRecorded = state.attendance.some(
    (row) => row.eventId === event.id && row.userId === actor.user.id,
  );
  const hasPointsEvent = state.pointsEvents.some(
    (pointsEvent) =>
      pointsEvent.assignmentId === event.id && pointsEvent.userId === actor.user.id,
  );

  if (attendanceAlreadyRecorded || hasPointsEvent) {
    return {
      ...state,
      integrationEvents: [
        ...state.integrationEvents,
        createIntegrationEvent("event_rsvp_cancel_blocked", {
          title: "RSVP cancellation blocked after check-in",
          destination: "internal",
          status: "recorded",
          detail:
            "The member already has attendance or points for this event, so myMEDLIFE preserved the RSVP ledger instead of silently reversing launch proof.",
        }),
      ],
      auditRecords: [
        ...state.auditRecords,
        createAuditRecord(actor, "event_rsvp_cancel_blocked", "chapter_event", event.id),
      ],
    };
  }

  const existing = state.rsvps.find(
    (rsvp) =>
      rsvp.eventId === event.id &&
      rsvp.userId === actor.user.id &&
      rsvp.status === "going",
  );

  if (!existing) {
    return state;
  }

  return {
    ...state,
    rsvps: state.rsvps.map((row) =>
      row.id === existing.id
        ? {
            ...row,
            status: "cancelled",
            cancelledAt: defaultOccurredAt,
          }
        : row,
    ),
    integrationEvents: [
      ...state.integrationEvents,
      createIntegrationEvent("event_rsvp_cancelled", {
        title: "Member RSVP cancelled",
        destination: "internal",
        status: "recorded",
        detail:
          "A member cancelled their app-owned RSVP before check-in. No Luma attendee delete or external provider write occurred.",
      }),
    ],
    auditRecords: [
      ...state.auditRecords,
      createAuditRecord(actor, "event_rsvp_cancelled", "chapter_event", event.id),
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
    rsvpCount: state.rsvps.filter((row) => row.status === "going").length,
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
  input:
    | StagingLumaMode
    | {
        mode?: StagingLumaMode;
        data?: StagingLumaEventLoopEvidenceSnapshot;
      } = "staging",
): StagingLumaEventLoopReadModel {
  const { mode, data } = normalizeReadModelInput(input);
  const providerEnabled = mode === "mock" || mode === "staging";
  const evidenceSummary = data ? deriveEvidenceSummary(data) : null;
  const summary = evidenceSummary ?? {
    mode,
    eventStored: true,
    lumaLinkReady: providerEnabled,
    qrReady: providerEnabled,
    sharedToFeed: true,
    rsvpCount: 1,
    attendanceCount: 1,
    pointsAwarded: 20,
    duplicatePointsPrevented: true,
    externalWritesEnabled: false,
  };
  const providerStatusLabel = evidenceSummary
    ? evidenceSummary.lumaLinkReady
      ? "Staging evidence rows recorded"
      : "Staging evidence pending Luma link"
    : providerEnabled
      ? "Staging-safe link attached"
      : mode === "live_ready_not_enabled"
        ? "Live-ready, not enabled"
        : "Disabled";

  return {
    summary,
    providerStatusLabel,
    sequence: buildReadModelSequence(providerEnabled),
    safetyNotes: [
      "No production Luma write is enabled.",
      "No raw Luma key is exposed to the browser, logs, audit details, or local storage.",
      summary.externalWritesEnabled
        ? "Review the outbox carefully: external execution should still stay off for the pilot."
        : "Automation outbox rows remain disabled until a later approval opens live execution.",
    ],
  };
}

export function getStagingLumaCrossRoleProof(
  input:
    | StagingLumaMode
    | {
        mode?: StagingLumaMode;
        data?: StagingLumaEventLoopEvidenceSnapshot;
      } = "staging",
): StagingLumaCrossRoleProofCard[] {
  const { mode, data } = normalizeReadModelInput(input);
  const readModel = getStagingLumaEventLoopReadModel({ mode, data });
  const summary = readModel.summary;
  const relevantOutboxRows = data
    ? selectRelevantOutboxRows(data.automationOutboxRows)
    : [];
  const relevantAuditRows = data?.auditLogRows
    ? selectRelevantAuditRows(data.auditLogRows)
    : [];
  const outboxSafe =
    relevantOutboxRows.length > 0
      ? relevantOutboxRows.every((row) => row.status === "disabled")
      : !summary.externalWritesEnabled;
  const auditReady = relevantAuditRows.length > 0;

  return [
    buildProofCard({
      id: "member",
      title: "Member app",
      routeLinks: [
        { href: "/app", label: "Member home" },
        { href: "/app/events", label: "Member events" },
        { href: "/app/points", label: "Member points" },
      ],
      checks: [
        {
          label: "Event + Luma posture",
          value:
            summary.eventStored && summary.lumaLinkReady
              ? "Visible from the event flow"
              : "Still needs staging proof",
          status:
            summary.eventStored && summary.lumaLinkReady ? "ready" : "needs_review",
        },
        {
          label: "RSVP state",
          value:
            summary.rsvpCount > 0
              ? `${summary.rsvpCount} RSVP recorded`
              : "No RSVP proof yet",
          status: summary.rsvpCount > 0 ? "ready" : "needs_review",
        },
        {
          label: "Points + leaderboard",
          value:
            summary.pointsAwarded > 0
              ? `${summary.pointsAwarded} pts reflected`
              : "Points proof still pending",
          status: summary.pointsAwarded > 0 ? "ready" : "needs_review",
        },
      ],
    }),
    buildProofCard({
      id: "leader",
      title: "Leader command center",
      routeLinks: [
        { href: "/leader?view=events", label: "Leader events" },
        { href: "/leader?view=attendance", label: "Leader attendance" },
        { href: "/leader?view=leaderboard", label: "Leader leaderboard" },
      ],
      checks: [
        {
          label: "Event ownership",
          value: summary.eventStored ? "Chapter event recorded" : "Event proof missing",
          status: summary.eventStored ? "ready" : "needs_review",
        },
        {
          label: "Attendance review",
          value:
            summary.attendanceCount > 0
              ? `${summary.attendanceCount} attendee(s) confirmed`
              : "Attendance import still pending",
          status: summary.attendanceCount > 0 ? "ready" : "needs_review",
        },
        {
          label: "Chapter points impact",
          value:
            summary.pointsAwarded > 0
              ? `${summary.pointsAwarded} pts ready for chapter rank`
              : "Chapter rank impact still pending",
          status: summary.pointsAwarded > 0 ? "ready" : "needs_review",
        },
      ],
    }),
    buildProofCard({
      id: "staff",
      title: "Staff command center",
      routeLinks: [
        { href: "/staff?view=chapters", label: "Staff chapters" },
        { href: "/staff?view=events", label: "Staff events" },
        { href: "/staff?view=leaderboard", label: "Organization leaderboard" },
        { href: "/leader?view=leaderboard", label: "Chapter leaderboard" },
      ],
      checks: [
        {
          label: "Chapter event health",
          value:
            summary.eventStored && summary.attendanceCount > 0
              ? "Event loop visible with attendance"
              : "Still waiting on event-loop proof",
          status:
            summary.eventStored && summary.attendanceCount > 0
              ? "ready"
              : "needs_review",
        },
        {
          label: "Points + leaderboard",
          value:
            summary.pointsAwarded > 0
              ? `${summary.pointsAwarded} pts and chapter leaderboard visible for staff review`
              : "Leaderboard readback still pending",
          status: summary.pointsAwarded > 0 ? "ready" : "needs_review",
        },
        {
          label: "External sends",
          value: outboxSafe ? "Still blocked" : "Needs review",
          status: outboxSafe ? "ready" : "needs_review",
        },
      ],
    }),
    buildProofCard({
      id: "admin",
      title: "Admin proof surfaces",
      routeLinks: [
        { href: "/admin/audit-log", label: "Audit log" },
        { href: "/admin/integration-outbox", label: "Integration outbox" },
        { href: "/admin/pilot-scope", label: "Pilot scope" },
        { href: "/rush-month/leaderboard", label: "Rush Month leaderboard" },
        { href: "/app/points", label: "Member leaderboard" },
      ],
      checks: [
        {
          label: "Audit trail",
          value:
            auditReady
              ? `${relevantAuditRows.length} pilot audit row(s)`
              : "Audit proof still pending",
          status: auditReady ? "ready" : "needs_review",
        },
        {
          label: "Outbox safety",
          value:
            relevantOutboxRows.length > 0
              ? `${relevantOutboxRows.length} disabled outbox row(s)`
              : outboxSafe
                ? "No live sends opened"
                : "Outbox safety needs review",
          status: outboxSafe ? "ready" : "needs_review",
        },
        {
          label: "Leaderboard posture",
          value:
            summary.eventStored && summary.pointsAwarded > 0
              ? "Leaderboard readback stays tied to the narrow pilot posture"
              : "Leaderboard readback still needs review",
          status:
            summary.eventStored && summary.pointsAwarded > 0
              ? "ready"
              : "needs_review",
        },
      ],
    }),
  ];
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

function normalizeReadModelInput(
  input:
    | StagingLumaMode
    | {
        mode?: StagingLumaMode;
        data?: StagingLumaEventLoopEvidenceSnapshot;
      },
) {
  if (typeof input === "string") {
    return { mode: input, data: undefined };
  }

  return {
    mode: input.mode ?? "staging",
    data: input.data,
  };
}

function deriveEvidenceSummary(
  data: StagingLumaEventLoopEvidenceSnapshot,
): StagingLumaEventLoopSummary | null {
  const allRelevantEventRows = data.eventRows.filter(isRelevantEventRow);
  const allRelevantIntegrationRows = data.integrationEventRows.filter(isRelevantIntegrationRow);
  const allRelevantOutboxRows = data.automationOutboxRows.filter(isRelevantOutboxRow);
  const allRelevantPointsRows = data.pointsEventRows.filter(isRelevantPointsRow);
  const pilotEventRows = allRelevantEventRows.filter(isPilotEventRow);
  const pilotIntegrationRows = allRelevantIntegrationRows.filter(isPilotIntegrationRow);
  const pilotOutboxRows = allRelevantOutboxRows.filter(isPilotOutboxRow);
  const pilotChapterEventIds = new Set(
    pilotEventRows
      .map((row) => row.chapter_event_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );
  const pilotPointsRows = allRelevantPointsRows.filter((row) =>
    isPilotPointsRow(row, pilotChapterEventIds),
  );
  const usePilotRows =
    pilotEventRows.length > 0 ||
    pilotIntegrationRows.length > 0 ||
    pilotOutboxRows.length > 0 ||
    pilotPointsRows.length > 0;
  const relevantEventRows = usePilotRows ? pilotEventRows : allRelevantEventRows;
  const relevantIntegrationRows = usePilotRows
    ? pilotIntegrationRows
    : allRelevantIntegrationRows;
  const relevantOutboxRows = usePilotRows ? pilotOutboxRows : allRelevantOutboxRows;
  const relevantPointsRows = usePilotRows ? pilotPointsRows : allRelevantPointsRows;

  if (
    relevantEventRows.length === 0 &&
    relevantIntegrationRows.length === 0 &&
    relevantOutboxRows.length === 0 &&
    relevantPointsRows.length === 0
  ) {
    return null;
  }

  const eventStored =
    relevantEventRows.some((row) => {
      return row.event_type === "event_created" ||
        row.event_type === "luma_event_upserted" ||
        row.chapter_event_id !== null;
    }) ||
    relevantIntegrationRows.some((row) => row.event_type.includes("luma_event"));
  const lumaLinkReady = relevantIntegrationRows.some((row) => {
    return row.destination === "luma" &&
      row.status !== "disabled" &&
      row.status !== "failed";
  });
  const qrReady =
    lumaLinkReady ||
    relevantIntegrationRows.some((row) => row.event_type === "event_qr_generated");
  const sharedToFeed = relevantIntegrationRows.some(
    (row) => row.event_type === "event_shared_to_feed",
  );
  const rsvpCount =
    sumPayloadMetric(relevantEventRows, ["rsvp_count", "rsvpCount"]) +
      sumPayloadMetric(relevantIntegrationRows, ["rsvp_count", "rsvpCount"]) ||
    relevantEventRows.filter((row) => isRsvpEventType(row.event_type)).length +
      relevantIntegrationRows.filter((row) => isRsvpEventType(row.event_type)).length;
  const attendanceCount =
    sumPayloadMetric(relevantEventRows, [
      "attendance_count",
      "attendanceCount",
      "imported_guest_count",
      "importedGuestCount",
    ]) +
      sumPayloadMetric(relevantIntegrationRows, [
        "attendance_count",
        "attendanceCount",
        "imported_guest_count",
        "importedGuestCount",
      ]) ||
    relevantEventRows.filter((row) => isAttendanceEventType(row.event_type)).length +
      relevantIntegrationRows.filter((row) => isAttendanceEventType(row.event_type)).length;
  const pointsAwarded = relevantPointsRows.reduce(
    (total, row) => total + row.points_delta,
    0,
  );
  const uniquePointKeys = new Set(
    relevantPointsRows.map((row) =>
      [row.chapter_event_id ?? "no-event", row.awarded_to_user_id].join(":"),
    ),
  );

  return {
    mode: "staging",
    eventStored,
    lumaLinkReady,
    qrReady,
    sharedToFeed,
    rsvpCount,
    attendanceCount,
    pointsAwarded,
    duplicatePointsPrevented: uniquePointKeys.size === relevantPointsRows.length,
    externalWritesEnabled: false,
  };
}

function buildReadModelSequence(providerEnabled: boolean) {
  return [
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
  ];
}

function buildProofCard(input: {
  id: StagingLumaCrossRoleProofCard["id"];
  title: string;
  routeLinks: StagingLumaCrossRoleProofCard["routeLinks"];
  checks: StagingLumaCrossRoleProofCheck[];
}): StagingLumaCrossRoleProofCard {
  const verdict = input.checks.every((check) => check.status === "ready")
    ? "ready"
    : "needs_review";

  return {
    id: input.id,
    title: input.title,
    summary:
      verdict === "ready"
        ? "This workspace is telling the same event-to-points story as the rest of the staging pilot."
        : "This workspace still needs more staging proof before the loop is fully aligned.",
    verdict,
    routeLinks: input.routeLinks,
    checks: input.checks,
  };
}

function isRelevantEventRow(row: EventRow) {
  return row.chapter_event_id !== null ||
    row.event_type === "event_shared_to_feed" ||
    row.event_type.includes("luma") ||
    row.event_type.includes("rsvp") ||
    row.event_type.includes("attendance") ||
    row.event_type.includes("points");
}

function isRelevantIntegrationRow(row: IntegrationEventRow) {
  return row.event_type === "event_shared_to_feed" ||
    row.destination === "luma" ||
    row.event_type.includes("luma") ||
    row.event_type.includes("rsvp") ||
    row.event_type.includes("attendance") ||
    row.event_type.includes("points");
}

function isRelevantOutboxRow(row: AutomationOutboxRow) {
  return row.destination === "luma" ||
    row.event_type.includes("luma") ||
    row.event_type.includes("rsvp") ||
    row.event_type.includes("attendance") ||
    row.event_type.includes("points");
}

function isRelevantAuditRow(row: AuditLogRow) {
  return row.action.startsWith("luma_") ||
    row.target_table === "luma_event_links" ||
    row.target_table === "chapter_events" ||
    hasPilotSource(row.before_value) ||
    hasPilotSource(row.after_value) ||
    row.reason?.toLowerCase().includes("staging luma") === true;
}

function isRelevantPointsRow(row: PointsEventRow) {
  return row.chapter_event_id !== null ||
    row.reason.toLowerCase().includes("attendance");
}

function isRsvpEventType(eventType: string) {
  return eventType.includes("rsvp");
}

function isAttendanceEventType(eventType: string) {
  return eventType.includes("attendance");
}

function isPilotEventRow(row: EventRow) {
  return Boolean(row.correlation_id?.startsWith("luma-pilot:")) || hasPilotSource(row.payload);
}

function isPilotIntegrationRow(row: IntegrationEventRow) {
  return hasPilotSource(row.payload);
}

function isPilotOutboxRow(row: AutomationOutboxRow) {
  return row.idempotency_key.startsWith("luma-pilot:") || hasPilotSource(row.payload);
}

function isPilotAuditRow(row: AuditLogRow) {
  return row.action.startsWith("luma_") ||
    hasPilotSource(row.before_value) ||
    hasPilotSource(row.after_value);
}

function isPilotPointsRow(row: PointsEventRow, chapterEventIds: Set<string>) {
  return (
    (row.chapter_event_id !== null && chapterEventIds.has(row.chapter_event_id)) ||
    row.reason.toLowerCase().includes("luma pilot")
  );
}

function sumPayloadMetric(
  rows: Array<{ payload: unknown }>,
  keys: string[],
) {
  return rows.reduce((total, row) => total + getPayloadMetric(row.payload, keys), 0);
}

function selectRelevantOutboxRows(rows: AutomationOutboxRow[]) {
  const allRelevantRows = rows.filter(isRelevantOutboxRow);
  const pilotRows = allRelevantRows.filter(isPilotOutboxRow);

  return pilotRows.length > 0 ? pilotRows : allRelevantRows;
}

function selectRelevantAuditRows(rows: AuditLogRow[]) {
  const allRelevantRows = rows.filter(isRelevantAuditRow);
  const pilotRows = allRelevantRows.filter(isPilotAuditRow);

  return pilotRows.length > 0 ? pilotRows : allRelevantRows;
}

function getPayloadMetric(payload: unknown, keys: string[]) {
  if (!isRecord(payload)) {
    return 0;
  }

  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasPilotSource(payload: unknown) {
  return isRecord(payload) && payload.source === "luma_live_pilot";
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
    ? `https://staging.mymedlife.org/app/events/${event.id}?provider=luma`
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
