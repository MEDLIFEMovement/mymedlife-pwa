import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getLaunchLaneActorProfileId,
  getLaunchLaneEventSnapshotById,
  getLaunchLaneEventSnapshots,
  hasLaunchLaneRecordedRsvp,
  sumLaunchLanePointsForEvent,
} from "@/services/launch-lane-event-snapshots";
import { resolveMemberEventRouteId } from "@/services/member-event-route-aliases";
import {
  getMemberLaunchLaneLoopState,
  type MemberLaunchLaneLoopStage,
} from "@/services/member-launch-lane-loop-state";
import { getLaunchLaneAttendancePointsLabel } from "@/services/launch-lane-points-policy";
import {
  getMemberEventLifecycleLabel,
  getMemberEventLifecycleState,
  type MemberEventLifecycleState,
} from "@/services/member-event-lifecycle";
import type { MemberActionRouteSource } from "@/services/member-action-route-href";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

export type MemberLaunchLaneEventRow = {
  id: string;
  title: string;
  chapterName: string;
  timing: string;
  memberDateTimeLabel: string;
  memberLocationLabel: string;
  memberCampaignLabel: string;
  memberPointsLabel: string;
  memberRsvpLabel: string;
  memberRsvpState: "registered" | "open";
  memberLifecycleState: MemberEventLifecycleState;
  memberLifecycleLabel: string | null;
  memberActionsClosed: boolean;
  memberCanCancelRsvp: boolean;
  memberRsvpLockLabel: string | null;
  memberLumaLabel: string | null;
  loopStage: MemberLaunchLaneLoopStage;
  rsvpStatusLabel: string;
  rsvpDetail: string;
  rsvpStatusTone: "ready" | "disabled";
  lumaStatusLabel: string;
  lumaStatusTone: "mock_linked" | "future_sync_disabled";
  eventTypeLabel: string;
  rsvpCount: number;
  attendanceCount: number;
  pointsAwarded: number;
  memberPointsAwarded: number;
};

export function buildMemberLaunchLaneEventDetailHref(
  eventId: string,
  source: MemberActionRouteSource | "events" = "events",
) {
  return `/app/events/${eventId}?source=${source}`;
}

export function getMemberLaunchLaneEventRows(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): MemberLaunchLaneEventRow[] {
  const profileId = getLaunchLaneActorProfileId(actor, data);

  return getLaunchLaneEventSnapshots(data).map((event) =>
    toMemberLaunchLaneEventRow(actor, data, event, profileId),
  );
}

export function getMemberLaunchLaneEventRowById(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  eventId: string,
): MemberLaunchLaneEventRow | null {
  return (
    getMemberLaunchLaneEventRows(actor, data).find((row) => row.id === eventId) ?? null
  );
}

export function getMemberLaunchLaneEventDetailData(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  eventId: string,
) {
  const resolvedEventId = resolveMemberEventRouteId(data.chapterEventRows, eventId);

  return {
    event: getMemberLaunchLaneEventRowById(actor, data, resolvedEventId),
    snapshot: getLaunchLaneEventSnapshotById(data, resolvedEventId),
  };
}

function toMemberLaunchLaneEventRow(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  event: ReturnType<typeof getLaunchLaneEventSnapshots>[number],
  profileId: string | null,
): MemberLaunchLaneEventRow {
  const alreadyRecorded = hasLaunchLaneRecordedRsvp({
    eventRows: data.allEventRows,
    chapterEventId: event.id,
    userEmail: actor.user.email,
    profileId,
  });
  const hasLumaLink = event.hasLumaLink;
  const memberLifecycleState = getMemberEventLifecycleState(event.status);
  const memberActionsClosed = memberLifecycleState !== "open";
  const rsvpState = alreadyRecorded ? "registered" : "open";
  const memberPointsAwarded = profileId
    ? sumLaunchLanePointsForEvent(data.allPointsEventRows, event.id, profileId)
    : 0;
  const memberCanCancelRsvp = alreadyRecorded && memberPointsAwarded <= 0 && !memberActionsClosed;
  const loopState = getMemberLaunchLaneLoopState({
    alreadyRecorded,
    attendanceCount: event.attendanceCount,
    memberPointsAwarded,
    hasLumaLink,
  });

  return {
    id: event.id,
    title: event.title,
    chapterName: event.chapterName,
    timing: event.timing,
    memberDateTimeLabel: event.memberDateTimeLabel,
    memberLocationLabel: event.memberLocationLabel,
    memberCampaignLabel: "Event loop",
    memberPointsLabel: getLaunchLaneAttendancePointsLabel(),
    memberRsvpLabel: alreadyRecorded ? "RSVP'd" : "RSVP",
    memberRsvpState: rsvpState,
    memberLifecycleState,
    memberLifecycleLabel: getMemberEventLifecycleLabel(memberLifecycleState),
    memberActionsClosed,
    memberCanCancelRsvp,
    memberRsvpLockLabel:
      alreadyRecorded && !memberCanCancelRsvp
        ? "RSVP locked after check-in"
        : null,
    memberLumaLabel: hasLumaLink ? "Luma" : null,
    loopStage: loopState.stage,
    rsvpStatusLabel: loopState.statusLabel,
    rsvpDetail: loopState.statusDetail,
    rsvpStatusTone: loopState.stage === "preview_only" ? "disabled" : "ready",
    lumaStatusLabel: hasLumaLink ? "invite link ready" : "future sync disabled",
    lumaStatusTone: hasLumaLink ? "mock_linked" : "future_sync_disabled",
    eventTypeLabel: event.eventTypeLabel,
    rsvpCount: event.rsvpCount,
    attendanceCount: event.attendanceCount,
    pointsAwarded: event.pointsAwarded,
    memberPointsAwarded,
  };
}
