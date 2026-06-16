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
        value: `${data.pointsSummary.earned}`,
        note: "Mock read-only points earned from approved actions.",
      },
      {
        label: "Invite pushes",
        value: `${data.kpiSummary.invitePushes}`,
        note: "Chapter-level impact members can understand.",
      },
      {
        label: "Events linked",
        value: `${data.kpiSummary.eventsLinked}`,
        note: "Mock Luma/event posture only.",
      },
    ],
    pointsLedgerPosture: "mock_read_only",
  };
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
