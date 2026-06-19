import { rushMonthLeaderboard } from "@/data/mock-leaderboard";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { LeaderboardRow } from "@/shared/types/rush-month-dashboard";

export type MemberRecognitionImpact = {
  label: string;
  value: string;
  note: string;
};

export type MemberRecognitionSummary = {
  canReadRecognition: boolean;
  title: string;
  summary: string;
  selectedMember?: {
    displayName: string;
    rank: number;
    points: number;
    recognition: string;
    completedActions: number;
  };
  leaderboard: LeaderboardRow[];
  impacts: MemberRecognitionImpact[];
  pointsLedgerPosture: "mock_read_only";
};

export function getMemberRecognitionSummary(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  leaderboard: LeaderboardRow[] = rushMonthLeaderboard,
): MemberRecognitionSummary {
  if (actor.audience === "ds_admin") {
    return {
      canReadRecognition: false,
      title: "Recognition hidden for DS Admin",
      summary:
        "DS Admin can inspect integration posture, but student points and recognition remain app-owned.",
      leaderboard: [],
      impacts: [],
      pointsLedgerPosture: "mock_read_only",
    };
  }

  const sortedLeaderboard = sortLeaderboard(leaderboard);
  const selectedRow = findSelectedMember(actor, sortedLeaderboard) ?? sortedLeaderboard[0];

  return {
    canReadRecognition: true,
    title: getTitle(actor),
    summary:
      "Friendly recognition helps students see that the chapter rewards action, not passive meeting attendance.",
    selectedMember: selectedRow
      ? {
          displayName: selectedRow.displayName,
          rank: sortedLeaderboard.findIndex((row) => row.id === selectedRow.id) + 1,
          points: selectedRow.points,
          recognition: selectedRow.recognition,
          completedActions: selectedRow.completedActions,
        }
      : undefined,
    leaderboard: sortedLeaderboard.slice(0, 5),
    impacts: [
      {
        label: "Chapter points",
        value:
          data.metricsPosture.points === "unknown"
            ? "Unknown"
            : `${data.pointsSummary.earned}`,
        note: getPointsImpactNote(data),
      },
      {
        label: "Invite pushes",
        value:
          data.metricsPosture.kpis === "unknown"
            ? "Unknown"
            : `${data.kpiSummary.invitePushes}`,
        note: getInviteImpactNote(data),
      },
      {
        label: "Events linked",
        value:
          data.integrationEvents.length === 0
            ? "Unknown"
            : `${data.kpiSummary.eventsLinked}`,
        note:
          data.integrationEvents.length === 0
            ? "No Luma or event-link signal is visible yet."
            : "Mock Luma/event posture only.",
      },
    ],
    pointsLedgerPosture: "mock_read_only",
  };
}

function getPointsImpactNote(data: ReadOnlyAppData) {
  switch (data.metricsPosture.points) {
    case "points_events":
      return "Backed by read-only points event rows.";
    case "assignment_preview":
      return "Previewed from approved actions until live points rows are promoted.";
    case "unknown":
      return "No approved points event or preview is visible yet.";
    case "kpi_events":
      return "Points are still waiting for points event rows.";
  }
}

function getInviteImpactNote(data: ReadOnlyAppData) {
  switch (data.metricsPosture.kpis) {
    case "kpi_events":
      return "Backed by read-only KPI event rows.";
    case "assignment_preview":
      return "Previewed from assignment and integration posture until live KPI rows are promoted.";
    case "unknown":
      return "No KPI event or preview signal is visible yet.";
    case "points_events":
      return "KPI movement is still waiting for KPI event rows.";
  }
}

function sortLeaderboard(leaderboard: LeaderboardRow[]): LeaderboardRow[] {
  return [...leaderboard].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    return right.completedActions - left.completedActions;
  });
}

function findSelectedMember(
  actor: LocalActorContext,
  leaderboard: LeaderboardRow[],
): LeaderboardRow | undefined {
  return leaderboard.find(
    (row) => row.displayName.toLowerCase() === actor.user.displayName.toLowerCase(),
  );
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "Your recognition";
    case "chapter_leader":
      return "Member recognition";
    case "coach":
      return "Portfolio chapter recognition";
    case "admin":
      return "HQ recognition readout";
    case "super_admin":
      return "Full local recognition readout";
    case "ds_admin":
      return "Recognition hidden for DS Admin";
  }
}
