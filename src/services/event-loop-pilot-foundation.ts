import {
  getLaunchLaneEventSnapshots,
  sumLaunchLanePointsForAllChapters,
} from "@/services/launch-lane-event-snapshots";
import {
  getLaunchLaneOrgLeaderboardRows,
  getLaunchLaneOrgPointsReadback,
  getLaunchLaneStaffChapterReadback,
} from "@/services/launch-lane-points-readback";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

export type EventLoopPilotChapterProof = {
  chapterId: string;
  chapterName: string;
  calendarLabel: string;
  calendarReady: boolean;
  eventId: string | null;
  eventTitle: string;
  lumaLinkReady: boolean;
  rsvpCount: number;
  attendanceCount: number;
  pointsAwarded: number;
  canStageEvent: boolean;
  canRsvp: boolean;
  canRecordAttendance: boolean;
  leaderboardReady: boolean;
  statusLabel: "ready" | "needs_event" | "needs_luma" | "needs_rsvp" | "needs_attendance" | "needs_points";
  nextStep: string;
};

export type EventLoopPilotSafety = {
  externalWritesEnabled: boolean;
  rawSecretsExposed: boolean;
  liveLumaSendRows: number;
  disabledLumaOutboxRows: number;
  lumaIntegrationRows: number;
  auditRows: number;
  blockedSystems: string[];
};

export type EventLoopPilotFoundation = {
  title: string;
  summary: {
    pilotChapterCount: number;
    chaptersWithEvents: number;
    chaptersWithLumaLinks: number;
    chaptersWithRsvps: number;
    chaptersWithAttendance: number;
    chaptersWithPoints: number;
    organizationPoints: number;
    readyForSmallPilot: boolean;
  };
  chapters: EventLoopPilotChapterProof[];
  organizationLeaderboard: ReturnType<typeof getLaunchLaneOrgLeaderboardRows>;
  orgReadback: ReturnType<typeof getLaunchLaneOrgPointsReadback>;
  safety: EventLoopPilotSafety;
  roleRoutes: {
    member: string;
    leader: string;
    staff: string;
    adminLuma: string;
    adminOutbox: string;
    adminAudit: string;
  };
};

const liveSendStatuses = new Set(["approved_for_live_send", "sent"]);
const blockedSystems = [
  "HubSpot writes",
  "n8n execution",
  "warehouse/Power BI exports",
  "SMS/email sends",
  "AI actions",
  "production Luma sends",
];

export function getEventLoopPilotFoundation(
  data: ReadOnlyAppData,
  pilotChapterLimit = 5,
): EventLoopPilotFoundation {
  const staffRows = getLaunchLaneStaffChapterReadback(data).slice(0, pilotChapterLimit);
  const snapshots = getLaunchLaneEventSnapshots(data, {
    chapterEvents: data.allChapterEventRows,
    lumaEventLinks: data.allLumaEventLinkRows,
  });
  const pointsByChapter = sumLaunchLanePointsForAllChapters(data.allPointsEventRows);
  const chapters = staffRows.map((row) => {
    const event = snapshots.find((snapshot) => snapshot.id === row.chapterEventId) ?? null;
    const pointsAwarded = pointsByChapter.get(row.id) ?? row.points;
    const proof = {
      chapterId: row.id,
      chapterName: row.name,
      calendarLabel: row.calendarLabel,
      calendarReady: row.calendarReady,
      eventId: event?.id ?? row.chapterEventId,
      eventTitle: event?.title ?? row.nextEvent,
      lumaLinkReady: event?.hasLumaLink ?? false,
      rsvpCount: row.rsvps,
      attendanceCount: row.attendance,
      pointsAwarded,
      canStageEvent: row.calendarReady,
      canRsvp: Boolean(event?.hasLumaLink),
      canRecordAttendance: row.rsvps > 0,
      leaderboardReady: pointsAwarded > 0,
    };

    return {
      ...proof,
      statusLabel: getChapterStatusLabel(proof),
      nextStep: getChapterNextStep(proof),
    };
  });
  const safety = getEventLoopPilotSafety(data);

  return {
    title: "Event loop pilot foundation",
    summary: {
      pilotChapterCount: chapters.length,
      chaptersWithEvents: chapters.filter((chapter) => chapter.eventId !== null).length,
      chaptersWithLumaLinks: chapters.filter((chapter) => chapter.lumaLinkReady).length,
      chaptersWithRsvps: chapters.filter((chapter) => chapter.rsvpCount > 0).length,
      chaptersWithAttendance: chapters.filter((chapter) => chapter.attendanceCount > 0).length,
      chaptersWithPoints: chapters.filter((chapter) => chapter.pointsAwarded > 0).length,
      organizationPoints: getLaunchLaneOrgPointsReadback(data).totalPoints,
      readyForSmallPilot:
        chapters.length >= 3 &&
        chapters.length <= pilotChapterLimit &&
        chapters.every((chapter) => chapter.statusLabel === "ready") &&
        !safety.externalWritesEnabled &&
        !safety.rawSecretsExposed,
    },
    chapters,
    organizationLeaderboard: getLaunchLaneOrgLeaderboardRows(data),
    orgReadback: getLaunchLaneOrgPointsReadback(data),
    safety,
    roleRoutes: {
      member: "/app/events",
      leader: "/leader?view=events",
      staff: "/staff?view=events",
      adminLuma: "/admin/integrations/luma",
      adminOutbox: "/admin/integration-outbox",
      adminAudit: "/admin/audit-log",
    },
  };
}

export function getEventLoopPilotSafety(data: ReadOnlyAppData): EventLoopPilotSafety {
  const lumaOutboxRows = data.automationOutboxRows.filter(
    (row) => row.destination === "luma" || row.event_type.includes("luma"),
  );
  const liveLumaSendRows = lumaOutboxRows.filter((row) =>
    liveSendStatuses.has(row.status),
  ).length;
  const lumaIntegrationRows = data.integrationEventRows.filter(
    (row) => row.destination === "luma" || row.event_type.includes("luma"),
  ).length;

  return {
    externalWritesEnabled: liveLumaSendRows > 0,
    rawSecretsExposed: false,
    liveLumaSendRows,
    disabledLumaOutboxRows: lumaOutboxRows.filter((row) => row.status === "disabled").length,
    lumaIntegrationRows,
    auditRows: data.auditLogs.length,
    blockedSystems,
  };
}

function getChapterStatusLabel(
  chapter: Omit<EventLoopPilotChapterProof, "statusLabel" | "nextStep">,
): EventLoopPilotChapterProof["statusLabel"] {
  if (!chapter.eventId) {
    return "needs_event";
  }

  if (!chapter.lumaLinkReady) {
    return "needs_luma";
  }

  if (chapter.rsvpCount === 0) {
    return "needs_rsvp";
  }

  if (chapter.attendanceCount === 0) {
    return "needs_attendance";
  }

  if (chapter.pointsAwarded === 0) {
    return "needs_points";
  }

  return "ready";
}

function getChapterNextStep(
  chapter: Omit<EventLoopPilotChapterProof, "statusLabel" | "nextStep">,
) {
  switch (getChapterStatusLabel(chapter)) {
    case "needs_event":
      return "Stage the first chapter event from the leader Create Event screen.";
    case "needs_luma":
      return "Attach the chapter Luma event link or keep the local fallback clearly labeled.";
    case "needs_rsvp":
      return "Have at least one member RSVP so attendance has a starting point.";
    case "needs_attendance":
      return "Record attendance or import the confirmed attendee count.";
    case "needs_points":
      return "Award local attendance points and verify the leaderboard moves.";
    case "ready":
      return "Ready for the small pilot path; keep external writes disabled until separately approved.";
  }
}
