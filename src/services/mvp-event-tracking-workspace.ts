import { getActorPrimaryRoleLabel } from "@/services/actor-role-display";
import { getPilotEventLoopReadModel } from "@/services/event-loop";
import {
  getLaunchLaneChapterLeaderboardReadback,
  getLaunchLaneLeaderAttendanceReadback,
  getLaunchLaneLeaderEventReadback,
  getLaunchLaneMemberHistory,
  getLaunchLaneMemberPointsReadback,
  getLaunchLaneOrgLeaderboardRows,
  getLaunchLaneStaffChapterReadback,
} from "@/services/launch-lane-points-readback";
import { shouldShowTravelerPrepEntry } from "@/services/launch-lane-product-focus";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  buildMemberLaunchLaneEventDetailHref,
  getMemberLaunchLaneEventRows,
} from "@/services/member-launch-lane-events";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { hasTravelerAccess } from "@/services/role-visibility";

export type MvpMemberHome = {
  greeting: string;
  chapterName: string;
  chapterMeta: string;
  primaryEvent: {
    title: string;
    timing: string;
    location: string;
    rsvpLabel: string;
    actionLabel: string;
    href: string;
  } | null;
  pointsBalance: string;
  pointsDetail: string;
  pointsRankLabel: string;
  pointsTotal: number;
  attendanceStatusLabel: string;
  recognition: string;
  recentHistory: Array<{
    label: string;
    detail: string;
  }>;
  chapterCard: {
    title: string;
    detail: string;
    profileHref: string;
  };
  travelerHref: string | null;
};

export type MvpLeaderView = "overview" | "events" | "attendance" | "points";

export type MvpLeaderWorkspace = {
  title: string;
  chapterName: string;
  selectedView: MvpLeaderView;
  summaryStats: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  events: ReturnType<typeof getLaunchLaneLeaderEventReadback>;
  attendanceList: ReturnType<typeof getLaunchLaneLeaderAttendanceReadback>;
  chapterLeaderboard: ReturnType<typeof getLaunchLaneChapterLeaderboardReadback>;
  pointsNote: string;
};

export type MvpStaffView = "chapters" | "events" | "points";

export type MvpStaffWorkspace = {
  title: string;
  selectedView: MvpStaffView;
  summaryStats: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  chapters: ReturnType<typeof getLaunchLaneStaffChapterReadback>;
  organizationLeaderboard: ReturnType<typeof getLaunchLaneOrgLeaderboardRows>;
  chapterSummary: string;
};

export function getMvpMemberHome(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): MvpMemberHome {
  const recognition = getMemberRecognitionSummary(actor, data);
  const liveEventRows = getMemberLaunchLaneEventRows(actor, data);
  const livePointsReadback = getLaunchLaneMemberPointsReadback(actor, data);
  const primaryEvent = liveEventRows[0] ?? null;
  const recentHistory = getLaunchLaneMemberHistory(actor, data);
  const selectedMember = recognition.selectedMember;
  const attendanceStatusLabel =
    livePointsReadback?.memberStatusLabel ??
    (primaryEvent ? "Attendance still pending" : "No attendance yet");

  return {
    greeting: `Hi, ${getFirstName(actor.user.displayName)}`,
    chapterName: data.chapter.name,
    chapterMeta: `${getActorPrimaryRoleLabel(actor)} • ${data.chapter.campus} • Events and points`,
    primaryEvent: primaryEvent
      ? {
          title: primaryEvent.title,
          timing: primaryEvent.memberDateTimeLabel,
          location: primaryEvent.memberLocationLabel,
          rsvpLabel: primaryEvent.memberRsvpLabel,
          actionLabel:
            primaryEvent.memberRsvpState === "registered"
              ? "View event"
              : "RSVP / View event",
          href: buildMemberLaunchLaneEventDetailHref(primaryEvent.id, "home"),
        }
      : null,
    pointsBalance: `${selectedMember?.points ?? data.pointsSummary.earned} pts`,
    pointsDetail: selectedMember
      ? `Chapter rank #${selectedMember.rank}`
      : "Chapter rank updates stay local",
    pointsRankLabel: selectedMember ? `#${selectedMember.rank}` : "Chapter board",
    pointsTotal: selectedMember?.points ?? data.pointsSummary.earned,
    attendanceStatusLabel,
    recognition:
      selectedMember?.recognition ??
      "Your approved actions will show up here as recognition grows.",
    recentHistory,
    chapterCard: {
      title: data.chapter.name,
      detail: "Profile, chapter info, and your role stay one tap away.",
      profileHref: "/profile",
    },
    travelerHref:
      hasTravelerAccess(actor) && shouldShowTravelerPrepEntry()
        ? "/app/slt-prep?source=home"
        : null,
  };
}

export function getMvpLeaderWorkspace(
  _actor: LocalActorContext,
  data: ReadOnlyAppData,
  requestedView?: string,
): MvpLeaderWorkspace {
  const readModel = getPilotEventLoopReadModel({
    mode: "staging",
    data,
  });
  const events = getLaunchLaneLeaderEventReadback(data);
  const selectedView = normalizeLeaderView(requestedView);
  const totalRsvps = events.reduce((total, event) => total + event.rsvpCount, 0);
  const totalAttendance = events.reduce((total, event) => total + event.attendanceCount, 0);
  const totalPoints = events.reduce((total, event) => total + event.pointsAwarded, 0);

  return {
    title: "Leader event tracking",
    chapterName: data.chapter.name,
    selectedView,
    summaryStats: [
      { label: "Upcoming events", value: `${events.length}`, note: "Keep event setup simple." },
      { label: "RSVPs", value: `${totalRsvps}`, note: "Intent before the event." },
      { label: "Attendance", value: `${totalAttendance}`, note: "Who actually showed up." },
      { label: "Leaderboard points", value: `${totalPoints}`, note: "Award once per person per event." },
    ],
    events,
    attendanceList: getLaunchLaneLeaderAttendanceReadback(data),
    chapterLeaderboard: getLaunchLaneChapterLeaderboardReadback(data),
    pointsNote:
      readModel.summary.duplicatePointsPrevented
        ? "Points stay deduped when attendance is confirmed more than once."
        : "Review duplicate-point protection before launch.",
  };
}

export function getMvpStaffWorkspace(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  requestedView?: string,
): MvpStaffWorkspace {
  const selectedView = normalizeStaffView(requestedView);
  const chapterRows = getLaunchLaneStaffChapterReadback(data);
  const chapters =
    actor.primaryCanonicalRole === "coach" || actor.primaryCanonicalRole === "sales_coach"
      ? chapterRows.slice(0, 2)
      : chapterRows;
  const totalRsvps = chapters.reduce((total, chapter) => total + chapter.rsvps, 0);
  const totalAttendance = chapters.reduce((total, chapter) => total + chapter.attendance, 0);
  const totalPoints = chapters.reduce((total, chapter) => total + chapter.points, 0);

  return {
    title:
      actor.primaryCanonicalRole === "coach" || actor.primaryCanonicalRole === "sales_coach"
        ? "Coach event tracking"
        : "Staff event tracking",
    selectedView,
    summaryStats: [
      { label: "Chapters", value: `${chapters.length}`, note: "Keep the pilot narrow." },
      { label: "RSVPs", value: `${totalRsvps}`, note: "Signal before attendance." },
      { label: "Attendance", value: `${totalAttendance}`, note: "Check for drop-off." },
      { label: "Leaderboard points", value: `${totalPoints}`, note: "Chapter momentum." },
    ],
    chapters,
    organizationLeaderboard: getLaunchLaneOrgLeaderboardRows(data),
    chapterSummary:
      "Staff should only need the chapter list, next event, RSVP count, attendance count, points, and simple risk flags.",
  };
}

export function normalizeLeaderView(view?: string): MvpLeaderView {
  switch (view) {
    case "events":
      return "events";
    case "attendance":
    case "members":
      return "attendance";
    case "leaderboard":
      return "points";
    default:
      return "overview";
  }
}

export function normalizeStaffView(view?: string): MvpStaffView {
  switch (view) {
    case "events":
      return "events";
    case "campaigns":
      return "events";
    case "leaderboard":
    case "points":
      return "points";
    case "risks":
    case "chapters":
      return "chapters";
    default:
      return "chapters";
  }
}

function getFirstName(displayName: string) {
  return displayName.split(" ")[0] ?? displayName;
}
