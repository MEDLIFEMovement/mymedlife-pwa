import type { LocalActorContext } from "@/services/local-actor-context";
import { buildMemberLaunchLaneEventDetailHref } from "@/services/member-launch-lane-events";
import {
  getLaunchLaneActorProfileId,
  getLaunchLaneEventSnapshots,
  hasLaunchLaneRecordedRsvp,
  sumLaunchLanePointsForEvent,
} from "@/services/launch-lane-event-snapshots";
import {
  getMemberLaunchLaneLoopState,
  type MemberLaunchLaneLoopStage,
} from "@/services/member-launch-lane-loop-state";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { resolveChapterLumaCalendar } from "@/services/chapter-luma-calendars";

export type LaunchLaneResultStatus = "success" | "error" | null;

export type LaunchLaneResultNotice = {
  status: LaunchLaneResultStatus;
  message: string | null;
};

export type MemberLaunchLaneRsvpCard = {
  chapterEventId: string;
  lumaEventId: string;
  detailHref: string;
  title: string;
  timing: string;
  chapterName: string;
  loopStage: MemberLaunchLaneLoopStage;
  statusLabel: string;
  detail: string;
  nextStepLabel: string;
  nextStepDetail: string;
  alreadyRecorded: boolean;
  rsvpCount: number;
  attendanceCount: number;
  pointsAwarded: number;
};

export type LeaderLaunchLaneEventCard = {
  chapterEventId: string;
  chapterId: string;
  chapterName: string;
  readyForPilot: boolean;
  wideningReady: boolean;
  calendarLabel: string;
  calendarStatusLabel: string;
  calendarMapSourceLabel: string;
  calendarNote: string;
  title: string;
  timing: string;
  startAt: string;
  endAt: string | null;
  timezone: string;
  address: string | null;
  descriptionMd: string | null;
  lumaEventId: string | null;
  lumaEventUrl: string | null;
  eventActionLabel: string;
  attendanceActionLabel: string;
  statusLabel: string;
  rsvpCount: number;
  attendanceCount: number;
  pointsAwarded: number;
};

export function getLaunchLaneResultNotice(input: {
  lumaResult?: string;
  lumaMessage?: string;
}): LaunchLaneResultNotice {
  const status =
    input.lumaResult === "success"
      ? "success"
      : input.lumaResult === "error"
        ? "error"
        : null;

  return {
    status,
    message: status ? input.lumaMessage ?? null : null,
  };
}

export function getMemberLaunchLaneRsvpCard(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): MemberLaunchLaneRsvpCard | null {
  return getMemberLaunchLaneRsvpCardForEvent(actor, data);
}

export function getMemberLaunchLaneRsvpCardForEvent(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  options: {
    eventTitle?: string | null;
  } = {},
): MemberLaunchLaneRsvpCard | null {
  const linkedEvents = getLaunchLaneEventSnapshots(data).filter((row) => row.hasLumaLink);
  const linkedEvent = options.eventTitle
    ? linkedEvents.find((event) => titlesMatch(event.title, options.eventTitle)) ?? null
    : linkedEvents[0] ?? null;

  if (!linkedEvent || !linkedEvent.lumaEventId) {
    return null;
  }

  const profileId = getLaunchLaneActorProfileId(actor, data);
  const alreadyRecorded = hasLaunchLaneRecordedRsvp({
    eventRows: data.allEventRows,
    chapterEventId: linkedEvent.id,
    userEmail: actor.user.email,
    profileId,
  });
  const memberPointsAwarded = profileId
    ? sumLaunchLanePointsForEvent(data.allPointsEventRows, linkedEvent.id, profileId)
    : 0;
  const loopState = getMemberLaunchLaneLoopState({
    alreadyRecorded,
    attendanceCount: linkedEvent.attendanceCount,
    memberPointsAwarded,
    hasLumaLink: true,
  });

  return {
    chapterEventId: linkedEvent.id,
    lumaEventId: linkedEvent.lumaEventId,
    detailHref: buildMemberLaunchLaneEventDetailHref(linkedEvent.id),
    title: linkedEvent.title,
    timing: linkedEvent.timing,
    chapterName: linkedEvent.chapterName,
    loopStage: loopState.stage,
    statusLabel: loopState.statusLabel,
    detail: loopState.statusDetail,
    nextStepLabel: loopState.nextStepLabel,
    nextStepDetail: loopState.nextStepDetail,
    alreadyRecorded,
    rsvpCount: linkedEvent.rsvpCount,
    attendanceCount: linkedEvent.attendanceCount,
    pointsAwarded: linkedEvent.pointsAwarded,
  };
}

export function getLeaderLaunchLaneEventCards(
  data: ReadOnlyAppData,
): LeaderLaunchLaneEventCard[] {
  return getLaunchLaneEventSnapshots(data)
    .slice(0, 3)
    .map((event) => {
      const chapterName = event.chapterName;
      const chapterCalendar = resolveChapterLumaCalendar(
        {
          chapterId: event.chapterId,
          chapterName,
          allowSharedDefaultFallback: true,
        },
        {
          chapters: data.chapterRows,
          persistedRows: data.chapterLumaCalendarRows,
        },
      );
      const readyForPilot = chapterCalendar?.readyForPilot ?? false;

      return {
        chapterEventId: event.id,
        chapterId: event.chapterId,
        chapterName,
        readyForPilot,
        wideningReady: chapterCalendar?.wideningReady ?? false,
        calendarLabel: chapterCalendar?.calendarLabel ?? "Calendar not assigned",
        calendarStatusLabel: readyForPilot
          ? "Chapter calendar ready"
          : "Calendar setup needed",
        calendarMapSourceLabel:
          chapterCalendar?.mappingSourceLabel ?? "Needs saved map",
        calendarNote:
          chapterCalendar?.note ??
          "Assign a chapter Luma calendar before creating or updating live events from this workspace.",
        title: event.title,
        timing: event.timing,
        startAt: event.startsAt ?? "",
        endAt: event.endsAt,
        timezone: event.timeZone,
        address: event.memberLocationLabel,
        descriptionMd:
          event.promotionSummary ??
          "Keep the event, RSVP, attendance, and points loop simple and readable.",
        lumaEventId: event.lumaEventId,
        lumaEventUrl: event.lumaEventUrl,
        eventActionLabel: readyForPilot
          ? event.lumaEventId
            ? "Update in Luma"
            : "Create in Luma"
          : "Chapter calendar needed",
        attendanceActionLabel: "Import attendance",
        statusLabel: toLeaderLaunchLaneStatusLabel(event),
        rsvpCount: event.rsvpCount,
        attendanceCount: event.attendanceCount,
        pointsAwarded: event.pointsAwarded,
      };
    });
}

function toLeaderLaunchLaneStatusLabel(
  event: ReturnType<typeof getLaunchLaneEventSnapshots>[number],
) {
  if (!event.lumaEventId) {
    return "Needs Luma event";
  }

  if (event.attendanceCount > 0) {
    return "Attendance recorded";
  }

  return "Live Luma link ready";
}

function normalizeTitle(value: string | null | undefined) {
  return value
    ?.trim()
    .toLowerCase()
    .replace(/^pilot\s+/, "")
    .replace(/\s+/g, " ") ?? "";
}

function titlesMatch(left: string | null | undefined, right: string | null | undefined) {
  const normalizedLeft = normalizeTitle(left);
  const normalizedRight = normalizeTitle(right);

  return normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft);
}
