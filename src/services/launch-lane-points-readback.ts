import { getEventPlansForCampaign } from "@/services/campaign-ops-service";
import { resolveChapterLumaCalendar } from "@/services/chapter-luma-calendars";
import {
  getLaunchLaneLeaderEventsHref,
  getLaunchLaneMemberPointsHref,
  getLaunchLaneStaffEventsHref,
} from "@/services/events-points-launch-lane";
import {
  countLaunchLaneChapterEventsByChapter,
  countLaunchLaneRsvpsByChapter,
  findLaunchLaneProfileIdByEmail,
  getLaunchLaneEventSnapshotById,
  getLaunchLaneEventSnapshots,
  getActiveLaunchLaneRsvpRowsForEvent,
  getMostRecentLaunchLaneEventSnapshot,
  hasLaunchLaneRecordedRsvp,
  sumLaunchLanePointsByEvent,
  sumLaunchLanePointsForAllChapters,
  sumLaunchLanePointsForChapter,
  sumLaunchLanePointsForEvent,
} from "@/services/launch-lane-event-snapshots";
import type { LocalActorContext } from "@/services/local-actor-context";
import { ensureVisibleTestLabel } from "@/services/member-mobile-identity-context";
import {
  buildMemberLaunchLaneEventDetailHref,
} from "@/services/member-launch-lane-events";
import {
  getMemberLaunchLaneLoopState,
  type MemberLaunchLaneLoopStage,
} from "@/services/member-launch-lane-loop-state";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

type EventStatusTone = "blue" | "gold" | "slate";

export type LaunchLaneMemberPointsReadback = {
  eventTitle: string;
  chapterName: string;
  timing: string;
  loopStage: MemberLaunchLaneLoopStage;
  rsvpCount: number;
  attendanceCount: number;
  eventPointsAwarded: number;
  memberPointsAwarded: number;
  chapterTotalPoints: number;
  memberStatusLabel: string;
  memberStatusDetail: string;
  eventDetailHref: string;
  leaderboardHref: string;
  nextStepLabel: string;
  nextStepDetail: string;
};

export type LaunchLaneOrgPointsReadback = {
  totalRsvps: number;
  totalAttendance: number;
  totalPoints: number;
  chaptersWithPoints: number;
  topChapterName: string | null;
  topChapterPoints: number;
  featuredEventTitle: string | null;
  featuredEventChapterName: string | null;
  featuredEventAttendanceCount: number;
  featuredEventPointsAwarded: number;
};

export type LaunchLaneMemberHistoryItem = {
  label: string;
  detail: string;
};

export type LaunchLaneMemberProfileReadback = {
  usesLiveLedger: boolean;
  totalPoints: number;
  weeklyPoints: number;
  attendedEventCount: number;
  completedActionCount: number;
  recentActivity: Array<{
    title: string;
    detail: string;
    pointsLabel: string;
  }>;
};

export type LaunchLaneLeaderEventReadback = {
  id: string;
  chapterName: string;
  title: string;
  timing: string;
  location: string;
  rsvpCount: number;
  attendanceCount: number;
  pointsAwarded: number;
  qrHref: string;
  detailHref: string;
  statusLabel: string;
  tone: EventStatusTone;
};

export type LaunchLaneLeaderAttendanceReadback = {
  name: string;
  status: "Checked in" | "RSVP only" | "Needs follow-up";
  pointsLabel: string;
};

export type LaunchLaneChapterLeaderboardReadback = {
  name: string;
  points: number;
  detail: string;
};

export type LaunchLaneStaffRisk =
  | "Healthy"
  | "Low attendance"
  | "No upcoming events"
  | "No RSVPs";

export type LaunchLaneStaffChapterReadback = {
  id: string;
  name: string;
  chapterEventId: string | null;
  detailHref: string | null;
  calendarLabel: string;
  calendarStatusLabel: string;
  calendarReady: boolean;
  nextEvent: string;
  rsvps: number;
  attendance: number;
  points: number;
  risk: LaunchLaneStaffRisk;
};

export type LaunchLaneOrgLeaderboardRow = {
  chapterName: string;
  points: number;
  eventCount: number;
  statusLabel: LaunchLaneStaffRisk;
};

type EventLoopSeed = {
  id: string;
  location: string;
  rsvpCount: number;
  attendanceCount: number;
  pointsAwarded: number;
  statusLabel: string;
  tone: EventStatusTone;
};

const eventLoopSeeds: Record<string, EventLoopSeed> = {
  "event-rush-social-001": {
    id: "event-rush-social-001",
    location: "Bruin Walk Table 7",
    rsvpCount: 32,
    attendanceCount: 0,
    pointsAwarded: 0,
    statusLabel: "RSVP open",
    tone: "blue",
  },
  "event-rush-med-talk-001": {
    id: "event-rush-med-talk-001",
    location: "Ackerman 2100",
    rsvpCount: 48,
    attendanceCount: 39,
    pointsAwarded: 780,
    statusLabel: "Check-in open",
    tone: "gold",
  },
  "event-rush-social-002": {
    id: "event-rush-social-002",
    location: "Student Activities Center",
    rsvpCount: 22,
    attendanceCount: 18,
    pointsAwarded: 360,
    statusLabel: "Attendance recorded",
    tone: "gold",
  },
  "event-rush-orientation-001": {
    id: "event-rush-orientation-001",
    location: "Engineering VI 289",
    rsvpCount: 15,
    attendanceCount: 0,
    pointsAwarded: 0,
    statusLabel: "RSVP open",
    tone: "slate",
  },
};

export function getLaunchLaneMemberPointsReadback(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  eventId?: string | null,
): LaunchLaneMemberPointsReadback | null {
  const event = eventId
    ? getLaunchLaneEventSnapshotById(data, eventId)
    : getMostRecentLaunchLaneEventSnapshot(data);

  if (!event) {
    return null;
  }

  const profileId = findLaunchLaneProfileIdByEmail(data.profiles, actor.user.email);
  const memberPointsAwarded = profileId
    ? sumLaunchLanePointsForEvent(data.allPointsEventRows, event.id, profileId)
    : 0;
  const chapterTotalPoints = sumLaunchLanePointsForChapter(
    data.allPointsEventRows,
    event.chapterId,
  );
  const memberHasRsvp = hasLaunchLaneRecordedRsvp({
    eventRows: data.allEventRows,
    chapterEventId: event.id,
    userEmail: actor.user.email,
    profileId,
  });
  const loopState = getMemberLaunchLaneLoopState({
    alreadyRecorded: memberHasRsvp,
    attendanceCount: event.attendanceCount,
    memberPointsAwarded,
    hasLumaLink: event.hasLumaLink,
  });

  return {
    eventTitle: getVisibleLaunchLaneEventTitle(event.title),
    chapterName: event.chapterName,
    timing: event.timing,
    loopStage: loopState.stage,
    rsvpCount: event.rsvpCount,
    attendanceCount: event.attendanceCount,
    eventPointsAwarded: event.pointsAwarded,
    memberPointsAwarded,
    chapterTotalPoints,
    memberStatusLabel: loopState.statusLabel,
    memberStatusDetail: loopState.statusDetail,
    eventDetailHref: buildMemberLaunchLaneEventDetailHref(event.id, "points"),
    leaderboardHref: getLaunchLaneMemberPointsHref("points"),
    nextStepLabel: loopState.nextStepLabel,
    nextStepDetail: loopState.nextStepDetail,
  };
}

export function getLaunchLaneMemberProfileReadback(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  now = new Date(),
): LaunchLaneMemberProfileReadback {
  const profileId = findLaunchLaneProfileIdByEmail(data.profiles, actor.user.email);

  if (!profileId) {
    return {
      usesLiveLedger: data.source.mode === "supabase",
      totalPoints: 0,
      weeklyPoints: 0,
      attendedEventCount: 0,
      completedActionCount: 0,
      recentActivity: [],
    };
  }

  const memberRows = data.allPointsEventRows
    .filter((row) => row.awarded_to_user_id === profileId)
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
  const eventSnapshots = new Map(
    getLaunchLaneEventSnapshots(data).map((event) => [event.id, event]),
  );
  const attendedEventIds = new Set(
    memberRows
      .map((row) => row.chapter_event_id)
      .filter((eventId): eventId is string => Boolean(eventId)),
  );
  const weekStart = getUtcWeekStart(now);
  const weeklyPoints = memberRows.reduce((total, row) => {
    const createdAt = new Date(row.created_at);

    if (Number.isNaN(createdAt.getTime()) || createdAt < weekStart || createdAt > now) {
      return total;
    }

    return total + row.points_delta;
  }, 0);

  return {
    usesLiveLedger: data.source.mode === "supabase",
    totalPoints: memberRows.reduce((total, row) => total + row.points_delta, 0),
    weeklyPoints,
    attendedEventCount: attendedEventIds.size,
    completedActionCount: memberRows.length,
    recentActivity: memberRows.slice(0, 5).map((row) => {
      const event = row.chapter_event_id
        ? eventSnapshots.get(row.chapter_event_id)
        : null;

      return {
        title: event
          ? `Checked in to ${
              data.source.mode === "mock"
                ? ensureVisibleTestLabel(event.title)
                : getVisibleLaunchLaneEventTitle(event.title)
            }`
          : ensureVisibleTestLabel(row.reason),
        detail: "Recorded in myMEDLIFE internal TEST ledger",
        pointsLabel: `${row.points_delta > 0 ? "+" : ""}${row.points_delta} pts`,
      };
    }),
  };
}

function getUtcWeekStart(now: Date) {
  const weekStart = new Date(now);
  const daysSinceMonday = (weekStart.getUTCDay() + 6) % 7;

  weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  return weekStart;
}

export function getLaunchLaneOrgPointsReadback(
  data: ReadOnlyAppData,
): LaunchLaneOrgPointsReadback {
  const eventSnapshots = getLaunchLaneEventSnapshots(data, {
    chapterEvents: data.allChapterEventRows,
    lumaEventLinks: data.allLumaEventLinkRows,
  });
  const chapterSummaries = data.chapterRows.map((chapter) => {
    const chapterEvents = eventSnapshots.filter((row) => row.chapterId === chapter.id);
    const latestEvent = chapterEvents[chapterEvents.length - 1] ?? null;
    const totalRsvps = chapterEvents.reduce((total, event) => total + event.rsvpCount, 0);
    const totalAttendance = chapterEvents.reduce(
      (total, event) => total + event.attendanceCount,
      0,
    );
    const totalPoints = sumLaunchLanePointsForChapter(data.allPointsEventRows, chapter.id);

    return {
      chapterId: chapter.id,
      chapterName: chapter.name,
      totalRsvps,
      totalAttendance,
      totalPoints,
      latestEvent,
      latestEventAttendance: latestEvent?.attendanceCount ?? 0,
      latestEventPoints: latestEvent?.pointsAwarded ?? 0,
    };
  });

  const topChapter = chapterSummaries
    .slice()
    .sort((left, right) => right.totalPoints - left.totalPoints)[0] ?? null;
  const featuredEvent = getFeaturedLaunchLaneEventSummary(data);

  return {
    totalRsvps: chapterSummaries.reduce((total, row) => total + row.totalRsvps, 0),
    totalAttendance: chapterSummaries.reduce((total, row) => total + row.totalAttendance, 0),
    totalPoints: chapterSummaries.reduce((total, row) => total + row.totalPoints, 0),
    chaptersWithPoints: chapterSummaries.filter((row) => row.totalPoints > 0).length,
    topChapterName: topChapter?.chapterName ?? null,
    topChapterPoints: topChapter?.totalPoints ?? 0,
    featuredEventTitle: featuredEvent?.title ?? null,
    featuredEventChapterName: featuredEvent?.chapterName ?? null,
    featuredEventAttendanceCount: featuredEvent?.attendanceCount ?? 0,
    featuredEventPointsAwarded: featuredEvent?.pointsAwarded ?? 0,
  };
}

export function getLaunchLaneMemberHistory(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): LaunchLaneMemberHistoryItem[] {
  const liveReadback = getLaunchLaneMemberPointsReadback(actor, data);

  if (!liveReadback) {
    return [
      {
        label: "No event history yet",
        detail: "Your attendance and points will appear here after your first event.",
      },
    ];
  }

  return [
    {
      label: liveReadback.eventTitle,
      detail: liveReadback.memberStatusLabel,
    },
    {
      label: `${liveReadback.attendanceCount} attendee(s) confirmed`,
      detail:
        liveReadback.eventPointsAwarded > 0
          ? `${liveReadback.eventPointsAwarded} event point(s) awarded`
          : "Points are still pending for this event.",
    },
    {
      label: `${liveReadback.chapterName} chapter total`,
      detail: `${liveReadback.chapterTotalPoints} point(s) currently visible.`,
    },
  ];
}

export function getLaunchLaneLeaderEventReadback(
  data: ReadOnlyAppData,
): LaunchLaneLeaderEventReadback[] {
  const eventSnapshots = getLaunchLaneEventSnapshots(data);

  if (eventSnapshots.length === 0) {
    return getSeededLeaderEventReadback();
  }

  const pointsByEvent = sumLaunchLanePointsByEvent(data.pointsEventRows);

  return eventSnapshots
    .slice(0, 4)
    .map((row) => {
      return {
        id: row.id,
        chapterName: row.chapterName,
        title: row.title,
        timing: row.timing,
        location: row.lumaEventUrl
          ? "Luma-linked chapter event"
          : `${row.chapterName} campus event`,
        rsvpCount: row.rsvpCount,
        attendanceCount: row.attendanceCount,
        pointsAwarded: pointsByEvent.get(row.id) ?? 0,
        qrHref: getLaunchLaneLeaderEventsHref(row.id),
        detailHref: getLaunchLaneLeaderEventsHref(row.id),
        statusLabel: toLeaderEventStatusLabel(row.status, row.attendanceCount),
        tone: toLeaderEventTone(row.status, row.attendanceCount),
      };
    });
}

export function getLaunchLaneLeaderAttendanceReadback(
  data: ReadOnlyAppData,
): LaunchLaneLeaderAttendanceReadback[] {
  const latestEvent = getMostRecentLaunchLaneEventSnapshot(data);

  if (!latestEvent) {
    return [];
  }

  const profileNames = new Map(
    data.profiles.map((profile) => [profile.id, profile.display_name]),
  );
  const attendeeRows = data.pointsEventRows
    .filter((row) => row.chapter_event_id === latestEvent.id)
    .map((row) => ({
      key: toAttendanceRowKey(
        row.awarded_to_user_id,
        profileNames.get(row.awarded_to_user_id) ?? "Confirmed attendee",
      ),
      name: profileNames.get(row.awarded_to_user_id) ?? "Confirmed attendee",
      status: "Checked in" as const,
      pointsLabel: `${row.points_delta > 0 ? "+" : ""}${row.points_delta} pts`,
    }));
  const checkedInKeys = new Set(attendeeRows.map((row) => row.key));
  const rsvpRows = dedupeAttendanceRows(
    getActiveLaunchLaneRsvpRowsForEvent(data.allEventRows, latestEvent.id)
      .map((row) => {
        const payload = asRecord(row.payload);
        const userId = typeof payload.userId === "string" ? payload.userId : null;
        const userEmailHint =
          typeof payload.userEmailHint === "string"
            ? payload.userEmailHint
            : typeof payload.userEmail === "string"
              ? payload.userEmail
              : "RSVP guest";
        const name = userId ? profileNames.get(userId) ?? userEmailHint : userEmailHint;

        return {
          key: toAttendanceRowKey(userId, name),
          name,
        };
      }),
  ).filter((row) => !checkedInKeys.has(row.key));
  const attendanceSlotsRemaining = Math.max(
    latestEvent.attendanceCount - attendeeRows.length,
    0,
  );
  const confirmedRsvpRows = rsvpRows.slice(0, attendanceSlotsRemaining).map((row) => ({
    name: row.name,
    status: "Checked in" as const,
    pointsLabel: "Points pending",
  }));
  const rsvpOnlyRows = rsvpRows
    .slice(attendanceSlotsRemaining)
    .map((row) => ({
      name: row.name,
      status: "RSVP only" as const,
      pointsLabel: "Waiting on attendance",
    }));
  const placeholderRows = Array.from({
    length: Math.max(attendanceSlotsRemaining - confirmedRsvpRows.length, 0),
  }).map((_, index) => ({
    name: `Confirmed attendee ${index + 1}`,
    status: "Checked in" as const,
    pointsLabel: "Points pending",
  }));

  const combined = [
    ...attendeeRows.map((row) => ({
      name: row.name,
      status: row.status,
      pointsLabel: row.pointsLabel,
    })),
    ...confirmedRsvpRows,
    ...rsvpOnlyRows,
    ...placeholderRows,
  ];
  return combined.slice(0, 4);
}

export function getLaunchLaneChapterLeaderboardReadback(
  data: ReadOnlyAppData,
): LaunchLaneChapterLeaderboardReadback[] {
  const profileNames = new Map(
    data.profiles.map((profile) => [profile.id, profile.display_name]),
  );
  const totals = new Map<string, number>();

  for (const row of data.pointsEventRows) {
    totals.set(
      row.awarded_to_user_id,
      (totals.get(row.awarded_to_user_id) ?? 0) + row.points_delta,
    );
  }

  const rows = [...totals.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([userId, points], index) => ({
      name: profileNames.get(userId) ?? `Member ${index + 1}`,
      points,
      detail: index === 0 ? "Leading this chapter right now" : "Attendance-backed points",
    }));

  return rows.length > 0
    ? rows.slice(0, 5)
    : [
        {
          name: "No points yet",
          points: 0,
          detail: "Attendance-backed points will show here once the first event is confirmed.",
        },
      ];
}

function dedupeAttendanceRows<
  T extends {
    key: string;
  },
>(rows: T[]) {
  const seen = new Set<string>();

  return rows.filter((row) => {
    if (seen.has(row.key)) {
      return false;
    }

    seen.add(row.key);
    return true;
  });
}

function getVisibleLaunchLaneEventTitle(title: string) {
  return /^test\b/iu.test(title) ? ensureVisibleTestLabel(title) : title;
}

function toAttendanceRowKey(userId: string | null, name: string) {
  if (userId) {
    return `user:${userId}`;
  }

  return `name:${name.trim().toLowerCase()}`;
}

export function getLaunchLaneStaffChapterReadback(
  data: ReadOnlyAppData,
): LaunchLaneStaffChapterReadback[] {
  const allEventSnapshots = getLaunchLaneEventSnapshots(data, {
    chapterEvents: data.allChapterEventRows,
    lumaEventLinks: data.allLumaEventLinkRows,
  });
  const rsvpsByChapter = countLaunchLaneRsvpsByChapter(data.allEventRows);
  const pointsByChapter = sumLaunchLanePointsForAllChapters(data.allPointsEventRows);

  return data.chapterRows.map((chapter) => {
    const chapterEvents = allEventSnapshots.filter((row) => row.chapterId === chapter.id);
    const chapterCalendar = resolveChapterLumaCalendar(
      {
        chapterId: chapter.id,
        chapterName: chapter.name,
        allowSharedDefaultFallback: true,
      },
      {
        chapters: data.chapterRows,
        persistedRows: data.chapterLumaCalendarRows,
      },
    );
    const nextEvent = chapterEvents[0] ?? null;
    const attendance = nextEvent?.attendanceCount ?? 0;
    const rsvps = rsvpsByChapter.get(chapter.id) ?? attendance;
    const points = pointsByChapter.get(chapter.id) ?? 0;

    return {
      id: chapter.id,
      name: chapter.name,
      chapterEventId: nextEvent?.id ?? null,
      detailHref: nextEvent
        ? getLaunchLaneStaffEventsHref({
            campaignSlug: "rush-month",
            eventId: nextEvent.id,
          })
        : null,
      calendarLabel: chapterCalendar?.calendarLabel ?? "No calendar assigned",
      calendarStatusLabel: chapterCalendar
        ? chapterCalendar.status === "ready"
          ? "Explicit map"
          : chapterCalendar.status === "shared_default"
            ? "Shared default"
            : "Needs setup"
        : "Needs setup",
      calendarReady: chapterCalendar?.readyForPilot ?? false,
      nextEvent: nextEvent?.title ?? "No event scheduled",
      rsvps,
      attendance,
      points,
      risk: toStaffRiskLabel(
        nextEvent ? { status: nextEvent.status } : undefined,
        rsvps,
        attendance,
      ),
    };
  });
}

export function getLaunchLaneOrgLeaderboardRows(
  data: ReadOnlyAppData,
): LaunchLaneOrgLeaderboardRow[] {
  const eventCountsByChapter = countLaunchLaneChapterEventsByChapter(
    data.allChapterEventRows,
  );

  return getLaunchLaneStaffChapterReadback(data)
    .slice()
    .sort((left, right) => right.points - left.points)
    .map((chapter) => ({
      chapterName: chapter.name,
      points: chapter.points,
      eventCount: eventCountsByChapter.get(chapter.id) ?? 0,
      statusLabel: chapter.risk,
    }));
}

function getSeededLeaderEventReadback(): LaunchLaneLeaderEventReadback[] {
  return getEventPlansForCampaign("rush-month")
    .slice(0, 4)
    .map((eventPlan) => {
      const seed = eventLoopSeeds[eventPlan.id] ?? {
        id: eventPlan.id,
        location: "Location to be confirmed",
        rsvpCount: 0,
        attendanceCount: 0,
        pointsAwarded: 0,
        statusLabel: "Needs setup",
        tone: "slate" as const,
      };

      return {
        id: eventPlan.id,
        chapterName: "Rush Month",
        title: eventPlan.title,
        timing: eventPlan.timing,
        location: seed.location,
        rsvpCount: seed.rsvpCount,
        attendanceCount: seed.attendanceCount,
        pointsAwarded: seed.pointsAwarded,
        qrHref: getLaunchLaneLeaderEventsHref(eventPlan.id),
        detailHref: getLaunchLaneLeaderEventsHref(eventPlan.id),
        statusLabel: seed.statusLabel,
        tone: seed.tone,
      };
    });
}

function getFeaturedLaunchLaneEventSummary(data: ReadOnlyAppData) {
  const rankedEvents = getLaunchLaneEventSnapshots(data, {
    chapterEvents: data.allChapterEventRows,
    lumaEventLinks: data.allLumaEventLinkRows,
  })
    .slice()
    .reverse();

  return (
    rankedEvents.find(
      (event) => event.attendanceCount > 0 || event.pointsAwarded > 0,
    ) ??
    rankedEvents[0] ??
    null
  );
}

function toLeaderEventStatusLabel(status: string, attendanceCount: number) {
  if (attendanceCount > 0) {
    return "Attendance recorded";
  }

  switch (status) {
    case "planning":
      return "Needs promotion";
    case "published":
    case "promoting":
      return "RSVP open";
    case "feedback_collected":
    case "completed":
      return "Follow-up ready";
    default:
      return "Needs setup";
  }
}

function toLeaderEventTone(status: string, attendanceCount: number): EventStatusTone {
  if (attendanceCount > 0 || status === "feedback_collected" || status === "completed") {
    return "gold";
  }

  if (status === "published" || status === "promoting") {
    return "blue";
  }

  return "slate";
}

function toStaffRiskLabel(
  nextEvent: { status: string } | undefined,
  rsvps: number,
  attendance: number,
): LaunchLaneStaffRisk {
  if (!nextEvent) {
    return "No upcoming events";
  }

  if (rsvps === 0 && nextEvent.status !== "completed" && nextEvent.status !== "feedback_collected") {
    return "No RSVPs";
  }

  if (attendance > 0 && attendance < 15) {
    return "Low attendance";
  }

  return "Healthy";
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
