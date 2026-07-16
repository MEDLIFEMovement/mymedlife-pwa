import { rushMonthLeaderboard } from "@/data/mock-leaderboard";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getLaunchLaneMemberEventsHref,
  getLaunchLaneMemberPointsHref,
} from "@/services/events-points-launch-lane";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getActorSurfaceFamily,
  getVisibleAssignmentsForActor,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import type { LeaderboardRow } from "@/shared/types/rush-month-dashboard";

export type MemberRecognitionImpact = {
  label: string;
  value: string;
  note: string;
};

export type MemberRecognitionTopStat = {
  label: string;
  value: string;
  note: string;
};

export type MemberRecognitionCampaignPoints = {
  id: string;
  label: string;
  earned: number;
  available: number;
  detail: string;
};

export type MemberRecognitionBadge = {
  label: string;
  tone: "gold" | "blue" | "green" | "slate";
};

export type MemberRecognitionRecentAction = {
  title: string;
  detail: string;
  pointsLabel: string;
  href: string;
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
    source?: "leaderboard" | "signed_in_actor";
  };
  leaderboard: LeaderboardRow[];
  impacts: MemberRecognitionImpact[];
  topStats: MemberRecognitionTopStat[];
  campaignPoints: MemberRecognitionCampaignPoints[];
  badges: MemberRecognitionBadge[];
  recentApprovedActions: MemberRecognitionRecentAction[];
  explainer: {
    title: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
  };
  pointsLedgerPosture: "mock_read_only";
};

export function getMemberRecognitionSummary(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  leaderboard: LeaderboardRow[] = rushMonthLeaderboard,
): MemberRecognitionSummary {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "ds_admin") {
    return {
      canReadRecognition: false,
      title: "Recognition hidden for DS Admin",
      summary:
        "DS Admin can inspect integration posture, but student points and recognition remain app-owned.",
      leaderboard: [],
      impacts: [],
      topStats: [],
      campaignPoints: [],
      badges: [],
      recentApprovedActions: [],
      explainer: {
        title: "How points work",
        body: "Student recognition stays hidden for this role.",
        ctaLabel: "Return to admin",
        ctaHref: "/admin",
      },
      pointsLedgerPosture: "mock_read_only",
    };
  }

  const sortedLeaderboard = sortLeaderboard(leaderboard);
  const selectedRow = findSelectedMember(actor, sortedLeaderboard);
  const selectedMember = selectedRow
    ? {
        displayName: selectedRow.displayName,
        rank: sortedLeaderboard.findIndex((row) => row.id === selectedRow.id) + 1,
        points: selectedRow.points,
        recognition: selectedRow.recognition,
        completedActions: selectedRow.completedActions,
        source: "leaderboard" as const,
      }
    : buildActorFallbackMember(actor, sortedLeaderboard.length);

  return {
    canReadRecognition: true,
    title: getTitle(surfaceFamily),
    summary:
      "Friendly recognition helps students see that the chapter rewards action, not passive meeting attendance.",
    selectedMember,
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
    topStats: buildTopStats(selectedMember),
    campaignPoints: [
      {
        id: "event-loop",
        label: "Event loop",
        earned: selectedMember?.points ?? 0,
        available: 150,
        detail:
          "Recognition in the launch lane should reward the real event, RSVP, attendance, and follow-through that moves chapter momentum.",
      },
    ],
    badges: [
      { label: "Event Starter", tone: "gold" },
      { label: "Connector", tone: "blue" },
      { label: "Evidence Pro", tone: "blue" },
      { label: "Chapter MVP", tone: "slate" },
    ],
    recentApprovedActions: buildRecentApprovedActions(actor, data, Boolean(selectedRow)),
    explainer: {
      title: "How points work",
      body:
        "Points come from meaningful action, approved follow-through, and evidence that helps the chapter learn what worked.",
      ctaLabel: "See how to earn more points",
      ctaHref: getLaunchLaneMemberEventsHref("points"),
    },
    pointsLedgerPosture: "mock_read_only",
  };
}

function buildTopStats(
  selectedRow: MemberRecognitionSummary["selectedMember"],
): MemberRecognitionTopStat[] {
  const weeklyMomentum = Math.max((selectedRow?.completedActions ?? 0) * 25, 0);

  return [
    {
      label: "Total Points",
      value: `${selectedRow?.points ?? 0}`,
      note: "Earned in the live event loop",
    },
    {
      label: "This Week",
      value: `+${weeklyMomentum}`,
      note: "Momentum from approved work",
    },
    {
      label: "Chapter Rank",
      value: selectedRow ? `#${selectedRow.rank}` : "Unranked",
      note: "Friendly chapter-only visibility",
    },
  ];
}

function buildRecentApprovedActions(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  hasMatchedLeaderboardMember: boolean,
): MemberRecognitionRecentAction[] {
  const approvedAssignments = getVisibleAssignmentsForActor(actor, data.assignments).filter(
    (assignment) => assignment.status === "approved",
  );

  if (approvedAssignments.length > 0) {
    return approvedAssignments.slice(0, 3).map((assignment) => ({
      title: assignment.title,
      detail: `${assignment.kpi} · Due ${assignment.dueLabel}`,
      pointsLabel: `+${assignment.points} pts`,
      href: getLaunchLaneMemberPointsHref("points"),
    }));
  }

  if (!hasMatchedLeaderboardMember) {
    return [];
  }

  return [
    {
      title: "Welcome one new student at tabling",
      detail: "Tabling welcome completed · Due Nov 14",
      pointsLabel: "+10 pts",
      href: getLaunchLaneMemberPointsHref("points"),
    },
  ];
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

function buildActorFallbackMember(
  actor: LocalActorContext,
  leaderboardLength: number,
): NonNullable<MemberRecognitionSummary["selectedMember"]> {
  return {
    displayName: actor.user.displayName,
    rank: leaderboardLength + 1,
    points: 0,
    recognition: "Signed-in member readback",
    completedActions: 0,
    source: "signed_in_actor",
  };
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "member":
      return "Your recognition";
    case "leader":
      return "Member recognition";
    case "coach":
      return "Portfolio chapter recognition";
    case "staff":
      return "HQ recognition readout";
    case "super_admin":
      return "Full local recognition readout";
    case "ds_admin":
      return "Recognition hidden for DS Admin";
  }
}
