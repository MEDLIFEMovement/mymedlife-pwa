import {
  buildPointsKpiLedger,
  type MetricsPosture,
  type PointsKpiLedger,
} from "@/services/points-kpi-ledger";
import {
  getRushMonthEventRsvpPosture,
  type RushMonthEventRsvpPosture,
  type RushMonthEventRsvpTone,
} from "@/services/rush-month-event-rsvp";
import {
  createEmptyStagingLumaEventLoop,
  getStagingLumaCrossRoleProof,
  getStagingLumaEventLoopReadModel,
  prepStagingLumaEvent,
  recordEventAttendanceAndAwardPoints,
  recordLumaSyncFailure,
  recordMemberEventRsvp,
  shareStagingEventToFeed,
  summarizeStagingLumaEventLoop,
  type EventAttendance,
  type EventProviderLink,
  type EventRsvp,
  type StagingEvent,
  type StagingLumaCrossRoleProofCard,
  type StagingLumaEventLoopEvidenceSnapshot,
  type StagingLumaEventLoopReadModel,
  type StagingLumaEventLoopState,
  type StagingLumaEventLoopSummary,
  type StagingLumaMode,
} from "@/services/staging-luma-event-loop";

/**
 * Canonical event-loop entrypoint for the production path.
 *
 * If someone needs to understand the core live loop, start here:
 * event -> RSVP -> attendance -> points -> leaderboard.
 *
 * Older route-specific services still exist underneath this file so we can
 * simplify the public API without breaking the rest of the app all at once.
 */

export type EventLoopReadModel = StagingLumaEventLoopReadModel;
export type EventLoopSummary = StagingLumaEventLoopSummary;
export type EventLoopState = StagingLumaEventLoopState;
export type EventLoopMode = StagingLumaMode;
export type EventLoopEvidenceSnapshot = StagingLumaEventLoopEvidenceSnapshot;
export type EventLoopCrossRoleProofCard = StagingLumaCrossRoleProofCard;
export type EventPointsLedger = PointsKpiLedger;
export type EventMetricsPosture = MetricsPosture;
export type EventRsvpPosture = RushMonthEventRsvpPosture;
export type EventRsvpTone = RushMonthEventRsvpTone;
export type EventLoopEvent = StagingEvent;
export type EventLoopProviderLink = EventProviderLink;
export type EventLoopRsvp = EventRsvp;
export type EventLoopAttendance = EventAttendance;

export {
  createEmptyStagingLumaEventLoop,
  prepStagingLumaEvent,
  shareStagingEventToFeed,
  recordMemberEventRsvp,
  recordEventAttendanceAndAwardPoints,
  recordLumaSyncFailure,
  summarizeStagingLumaEventLoop,
};

export function buildEventPointsLedger(input: Parameters<typeof buildPointsKpiLedger>[0]) {
  return buildPointsKpiLedger(input);
}

export function getEventRsvpPosture(
  ...args: Parameters<typeof getRushMonthEventRsvpPosture>
) {
  return getRushMonthEventRsvpPosture(...args);
}

export function getPilotEventLoopReadModel(
  input: Parameters<typeof getStagingLumaEventLoopReadModel>[0] = "staging",
) {
  return getStagingLumaEventLoopReadModel(input);
}

export function getPilotCrossRoleEventProof(
  input: Parameters<typeof getStagingLumaCrossRoleProof>[0] = "staging",
) {
  return getStagingLumaCrossRoleProof(input);
}
