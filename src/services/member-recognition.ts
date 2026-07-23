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
import type { DatabaseRoleKey, PointsEventRow } from "@/shared/types/persistence";
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
  available: number | null;
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
  pointsLedgerPosture: "mock_read_only" | "app_owned_readback";
};

export function getMemberRecognitionSummary(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  leaderboard?: LeaderboardRow[],
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

  const usesAppOwnedLedger = data.source.mode === "supabase";
  const resolvedLeaderboard =
    leaderboard ??
    (usesAppOwnedLedger ? buildAppOwnedLeaderboard(data) : rushMonthLeaderboard);
  const sortedLeaderboard = sortLeaderboard(resolvedLeaderboard);
  const selectedRow = findSelectedMember(actor, sortedLeaderboard);
  const selectedProfileId = findProfileIdForActor(actor, data);
  const selectedPointRows = selectedProfileId
    ? getMemberPointRows(data, selectedProfileId)
    : [];
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
    topStats: buildTopStats(selectedMember, selectedPointRows, usesAppOwnedLedger),
    campaignPoints: usesAppOwnedLedger
      ? buildAppOwnedCampaignPoints(data, selectedPointRows)
      : [
          {
            id: "event-loop",
            label: "Event loop",
            earned: selectedMember?.points ?? 0,
            available: 150,
            detail:
              "Recognition in the launch lane should reward the real event, RSVP, attendance, and follow-through that moves chapter momentum.",
          },
        ],
    badges: usesAppOwnedLedger
      ? []
      : [
          { label: "Event Starter", tone: "gold" },
          { label: "Connector", tone: "blue" },
          { label: "Evidence Pro", tone: "blue" },
          { label: "Chapter MVP", tone: "slate" },
        ],
    recentApprovedActions: usesAppOwnedLedger
      ? buildAppOwnedRecentActions(selectedPointRows)
      : buildRecentApprovedActions(actor, data, Boolean(selectedRow)),
    explainer: {
      title: "How points work",
      body:
        "Points come from meaningful action, approved follow-through, and evidence that helps the chapter learn what worked.",
      ctaLabel: "See how to earn more points",
      ctaHref: getLaunchLaneMemberEventsHref("points"),
    },
    pointsLedgerPosture: usesAppOwnedLedger
      ? "app_owned_readback"
      : "mock_read_only",
  };
}

function buildTopStats(
  selectedRow: MemberRecognitionSummary["selectedMember"],
  selectedPointRows: PointsEventRow[],
  usesAppOwnedLedger: boolean,
): MemberRecognitionTopStat[] {
  const weeklyMomentum = usesAppOwnedLedger
    ? sumCurrentWeekPoints(selectedPointRows)
    : Math.max((selectedRow?.completedActions ?? 0) * 25, 0);

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

function buildAppOwnedLeaderboard(data: ReadOnlyAppData): LeaderboardRow[] {
  const membershipByUser = new Map<
    string,
    (typeof data.memberships)[number]
  >();

  for (const membership of data.memberships) {
    if (
      membership.chapter_id !== data.chapter.id ||
      membership.status !== "approved"
    ) {
      continue;
    }

    const current = membershipByUser.get(membership.user_id);
    if (
      !current ||
      getRolePriority(membership.role_key) > getRolePriority(current.role_key)
    ) {
      membershipByUser.set(membership.user_id, membership);
    }
  }

  const pointsByUser = new Map<string, { points: number; actions: number }>();

  for (const row of data.allPointsEventRows) {
    if (row.chapter_id !== data.chapter.id) continue;

    const current = pointsByUser.get(row.awarded_to_user_id) ?? {
      points: 0,
      actions: 0,
    };
    current.points += row.points_delta;
    if (row.points_delta > 0) current.actions += 1;
    pointsByUser.set(row.awarded_to_user_id, current);
  }

  return Array.from(membershipByUser.values()).flatMap((membership) => {
    const profile = data.profiles.find(
      (candidate) =>
        candidate.id === membership.user_id && candidate.status === "active",
    );
    if (!profile) return [];

    const totals = pointsByUser.get(profile.id) ?? { points: 0, actions: 0 };
    return [
      {
        id: profile.id,
        displayName: profile.display_name,
        roleLabel: getRoleLabel(membership.role_key),
        points: totals.points,
        completedActions: totals.actions,
        recognition:
          totals.actions > 0
            ? `${totals.actions} recorded point ${totals.actions === 1 ? "award" : "awards"}`
            : "No recorded points yet",
      },
    ];
  });
}

function getRolePriority(roleKey: DatabaseRoleKey) {
  switch (roleKey) {
    case "president_vp":
      return 5;
    case "action_committee_chair":
      return 4;
    case "e_board_member":
      return 3;
    case "action_committee_member":
      return 2;
    case "general_member":
      return 1;
    default:
      return 0;
  }
}

function buildAppOwnedCampaignPoints(
  data: ReadOnlyAppData,
  selectedPointRows: PointsEventRow[],
): MemberRecognitionCampaignPoints[] {
  const campaignNames = new Map(
    data.campaignRows.map((campaign) => [campaign.id, campaign.name]),
  );
  const totals = new Map<string, number>();

  for (const row of selectedPointRows) {
    const campaignId = row.campaign_id ?? "event-activity";
    totals.set(campaignId, (totals.get(campaignId) ?? 0) + row.points_delta);
  }

  return Array.from(totals.entries())
    .map(([campaignId, earned]) => ({
      id: campaignId,
      label:
        campaignId === "event-activity"
          ? "Event activity"
          : campaignNames.get(campaignId) ?? "Campaign activity",
      earned,
      available: null,
      detail: "Total recorded in the app-owned points ledger.",
    }))
    .sort((left, right) => right.earned - left.earned);
}

function buildAppOwnedRecentActions(
  rows: PointsEventRow[],
): MemberRecognitionRecentAction[] {
  return rows
    .slice()
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, 5)
    .map((row) => ({
      title: row.reason,
      detail: `Recorded ${formatPointsDate(row.created_at)}`,
      pointsLabel: `${row.points_delta > 0 ? "+" : ""}${row.points_delta} pts`,
      href: getLaunchLaneMemberPointsHref("points"),
    }));
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
    (row) =>
      row.id === actor.user.id ||
      row.displayName.toLowerCase() === actor.user.displayName.toLowerCase(),
  );
}

function findProfileIdForActor(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
) {
  return (
    data.profiles.find((profile) => profile.id === actor.user.id)?.id ??
    data.profiles.find(
      (profile) =>
        profile.email.trim().toLowerCase() ===
        actor.user.email.trim().toLowerCase(),
    )?.id ??
    null
  );
}

function getMemberPointRows(data: ReadOnlyAppData, userId: string) {
  return data.allPointsEventRows.filter(
    (row) =>
      row.chapter_id === data.chapter.id &&
      row.awarded_to_user_id === userId,
  );
}

function sumCurrentWeekPoints(rows: PointsEventRow[], now = new Date()) {
  const weekStart = new Date(now);
  const daysSinceMonday = (weekStart.getUTCDay() + 6) % 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  return rows.reduce((total, row) => {
    const createdAt = new Date(row.created_at);
    if (
      Number.isNaN(createdAt.getTime()) ||
      createdAt < weekStart ||
      createdAt > now
    ) {
      return total;
    }

    return total + row.points_delta;
  }, 0);
}

function formatPointsDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "in myMEDLIFE";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getRoleLabel(roleKey: DatabaseRoleKey) {
  switch (roleKey) {
    case "general_member":
      return "General Member";
    case "action_committee_member":
      return "Action Committee Member";
    case "action_committee_chair":
      return "Action Committee Chair";
    case "e_board_member":
      return "E-Board Member";
    case "president_vp":
      return "President / VP";
    case "coach":
      return "Coach";
    case "admin":
      return "Staff";
    case "ds_admin":
      return "DS Admin";
    case "super_admin":
      return "Super Admin";
    case "test":
      return "Test Role";
  }
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
