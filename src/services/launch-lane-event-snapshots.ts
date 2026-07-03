import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { resolveChapterTimeZone } from "@/services/chapter-timezone";
import type {
  ChapterEventRow,
  EventRow,
  LumaEventLinkRow,
  PointsEventRow,
  ProfileRow,
} from "@/shared/types/persistence";

export type LaunchLaneEventSnapshot = {
  event: ChapterEventRow;
  link: LumaEventLinkRow | null;
  id: string;
  chapterId: string;
  chapterName: string;
  campus: string;
  timeZone: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  timing: string;
  memberDateTimeLabel: string;
  memberLocationLabel: string;
  eventTypeLabel: string;
  status: string;
  promotionSummary: string | null;
  rsvpCount: number;
  attendanceCount: number;
  pointsAwarded: number;
  lumaEventId: string | null;
  lumaEventUrl: string | null;
  hasLumaLink: boolean;
};

export type LaunchLaneEventSnapshotOptions = {
  chapterEvents?: readonly ChapterEventRow[];
  lumaEventLinks?: readonly LumaEventLinkRow[];
};

export function getLaunchLaneEventSnapshots(
  data: ReadOnlyAppData,
  options: LaunchLaneEventSnapshotOptions = {},
): LaunchLaneEventSnapshot[] {
  const chapterEvents = [...(options.chapterEvents ?? data.chapterEventRows)].sort(
    compareEventStartsAscending,
  );
  const linksByEventId = new Map(
    (options.lumaEventLinks ?? data.lumaEventLinkRows)
      .filter((row) => row.chapter_event_id)
      .map((row) => [row.chapter_event_id as string, row]),
  );

  return chapterEvents.map((event) => {
    const chapter =
      data.chapterRows.find((row) => row.id === event.chapter_id) ?? data.chapter;
    const chapterName = chapter.name;
    const campus = chapter.campus;
    const timeZone = resolveChapterTimeZone(chapter);
    const link = linksByEventId.get(event.id) ?? null;

    return {
      event,
      link,
      id: event.id,
      chapterId: event.chapter_id,
      chapterName,
      campus,
      timeZone,
      title: event.title,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      timing: formatLaunchLaneTiming(event.starts_at, event.ends_at, timeZone),
      memberDateTimeLabel: formatLaunchLaneMemberDateTimeLabel(
        event.starts_at,
        event.ends_at,
        timeZone,
      ),
      memberLocationLabel: getLaunchLaneMemberLocationLabel(event, campus),
      eventTypeLabel: event.event_type.replaceAll("_", " "),
      status: event.status,
      promotionSummary: event.promotion_summary,
      rsvpCount: countLaunchLaneRsvpsForEvent(data.allEventRows, event.id),
      attendanceCount: getLaunchLaneAttendanceCountForEvent(event, data.allEventRows),
      pointsAwarded: sumLaunchLanePointsForEvent(data.allPointsEventRows, event.id),
      lumaEventId: link?.luma_event_id ?? null,
      lumaEventUrl: link?.luma_event_url ?? null,
      hasLumaLink: Boolean(link?.luma_event_id),
    };
  });
}

export function getLaunchLaneEventSnapshotById(
  data: ReadOnlyAppData,
  eventId: string,
  options: LaunchLaneEventSnapshotOptions = {},
) {
  return getLaunchLaneEventSnapshots(data, options).find((row) => row.id === eventId) ?? null;
}

export function getMostRecentLaunchLaneEventSnapshot(
  data: ReadOnlyAppData,
  options: LaunchLaneEventSnapshotOptions = {},
) {
  const snapshots = getLaunchLaneEventSnapshots(data, options);
  return snapshots[snapshots.length - 1] ?? null;
}

export function getSoonestLaunchLaneEventSnapshot(
  data: ReadOnlyAppData,
  options: LaunchLaneEventSnapshotOptions = {},
) {
  return getLaunchLaneEventSnapshots(data, options)[0] ?? null;
}

export function findLaunchLaneProfileIdByEmail(
  profiles: readonly ProfileRow[],
  email: string,
) {
  return (
    profiles.find(
      (profile) => normalizeEmail(profile.email) === normalizeEmail(email),
    )?.id ?? null
  );
}

export function getLaunchLaneActorProfileId(
  actor: Pick<LocalActorContext, "user">,
  data: Pick<ReadOnlyAppData, "profiles">,
) {
  return findLaunchLaneProfileIdByEmail(data.profiles, actor.user.email);
}

export function hasLaunchLaneRecordedRsvp(input: {
  eventRows: readonly EventRow[];
  chapterEventId: string;
  userEmail: string;
  profileId: string | null;
}) {
  const normalizedEmail = normalizeEmail(input.userEmail);

  return input.eventRows.some((row) => {
    if (row.chapter_event_id !== input.chapterEventId) {
      return false;
    }

    if (row.event_type !== "event_rsvp_recorded") {
      return false;
    }

    const payload = asRecord(row.payload);
    const userEmail =
      typeof payload.userEmail === "string"
        ? payload.userEmail
        : typeof payload.userEmailHint === "string"
          ? payload.userEmailHint
          : null;
    const userId = typeof payload.userId === "string" ? payload.userId : null;

    return normalizeEmail(userEmail) === normalizedEmail || userId === input.profileId;
  });
}

export function countLaunchLaneRsvpsForEvent(
  rows: readonly EventRow[],
  chapterEventId: string,
) {
  return rows.filter(
    (row) =>
      row.chapter_event_id === chapterEventId &&
      row.event_type === "event_rsvp_recorded",
  ).length;
}

export function countLaunchLaneRsvpsByChapter(rows: readonly EventRow[]) {
  const totals = new Map<string, number>();

  for (const row of rows) {
    if (row.event_type !== "event_rsvp_recorded" || !row.chapter_id) {
      continue;
    }

    totals.set(row.chapter_id, (totals.get(row.chapter_id) ?? 0) + 1);
  }

  return totals;
}

export function getLaunchLaneAttendanceCountForEvent(
  event: ChapterEventRow,
  rows: readonly EventRow[],
) {
  const latestAttendanceRow = rows
    .filter(
      (row) =>
        row.chapter_event_id === event.id &&
        row.event_type === "event_attendance_recorded",
    )
    .sort(
      (left, right) =>
        new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime(),
    )[0];

  if (latestAttendanceRow) {
    const payload = asRecord(latestAttendanceRow.payload);
    const payloadCount =
      typeof payload.attendanceCount === "number"
        ? payload.attendanceCount
        : typeof payload.attendance_count === "number"
          ? payload.attendance_count
          : null;

    if (payloadCount !== null) {
      return payloadCount;
    }
  }

  return event.attendance_count ?? 0;
}

export function sumLaunchLanePointsForEvent(
  rows: readonly PointsEventRow[],
  chapterEventId: string,
  awardedToUserId?: string,
) {
  return rows
    .filter(
      (row) =>
        row.chapter_event_id === chapterEventId &&
        (awardedToUserId ? row.awarded_to_user_id === awardedToUserId : true),
    )
    .reduce((total, row) => total + row.points_delta, 0);
}

export function sumLaunchLanePointsForChapter(
  rows: readonly PointsEventRow[],
  chapterId: string,
) {
  return rows
    .filter((row) => row.chapter_id === chapterId)
    .reduce((total, row) => total + row.points_delta, 0);
}

export function sumLaunchLanePointsByEvent(rows: readonly PointsEventRow[]) {
  const totals = new Map<string, number>();

  for (const row of rows) {
    if (!row.chapter_event_id) {
      continue;
    }

    totals.set(row.chapter_event_id, (totals.get(row.chapter_event_id) ?? 0) + row.points_delta);
  }

  return totals;
}

export function sumLaunchLanePointsForAllChapters(
  rows: readonly PointsEventRow[],
) {
  const totals = new Map<string, number>();

  for (const row of rows) {
    totals.set(row.chapter_id, (totals.get(row.chapter_id) ?? 0) + row.points_delta);
  }

  return totals;
}

export function countLaunchLaneChapterEventsByChapter(
  rows: readonly ChapterEventRow[],
) {
  const totals = new Map<string, number>();

  for (const row of rows) {
    totals.set(row.chapter_id, (totals.get(row.chapter_id) ?? 0) + 1);
  }

  return totals;
}

export function getLaunchLaneChapterName(
  data: Pick<ReadOnlyAppData, "chapterRows" | "chapter">,
  chapterId: string,
) {
  return data.chapterRows.find((row) => row.id === chapterId)?.name ?? data.chapter.name;
}

export function formatLaunchLaneTiming(
  startAt: string | null,
  endAt: string | null,
  timeZone: string,
) {
  if (!startAt) {
    return "Time to be confirmed";
  }

  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;
  const startLabel = start.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });

  if (!end) {
    return startLabel;
  }

  const endLabel = end.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });

  return `${startLabel} - ${endLabel}`;
}

export function formatLaunchLaneMemberDateTimeLabel(
  startAt: string | null,
  endAt: string | null,
  timeZone: string,
) {
  if (!startAt) {
    return "Time to be confirmed";
  }

  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;
  const dateLabel = start
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone,
    })
    .replace(",", "");
  const startTimeLabel = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });

  if (!end) {
    return `${dateLabel} · ${startTimeLabel}`;
  }

  const endTimeLabel = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });

  return `${dateLabel} · ${startTimeLabel} - ${endTimeLabel}`;
}

export function getLaunchLaneMemberLocationLabel(
  event: ChapterEventRow,
  campus: string,
) {
  switch (event.id) {
    case "chapter-event-ucla-kickoff":
      return "Bruin Plaza";
    case "chapter-event-lakeside-welcome":
      return "Lakeside student center";
    case "chapter-event-boston-info-night":
      return "Boston College campus event";
    case "chapter-event-ucsd-service-social":
      return "UC San Diego campus event";
    default:
      return `${campus} campus event`;
  }
}

function compareEventStartsAscending(left: ChapterEventRow, right: ChapterEventRow) {
  return getEventStartSortValue(left.starts_at) - getEventStartSortValue(right.starts_at);
}

function getEventStartSortValue(value: string | null) {
  return new Date(value ?? "9999-12-31T00:00:00Z").getTime();
}

function normalizeEmail(value: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
