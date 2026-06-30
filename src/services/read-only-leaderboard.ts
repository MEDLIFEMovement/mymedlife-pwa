import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { LeaderboardRow } from "@/shared/types/rush-month-dashboard";
import type { DatabaseRoleKey, MembershipRow, ProfileRow } from "@/shared/types/persistence";

export function getPreferredLeaderboardRows(
  data: ReadOnlyAppData,
  fallback: LeaderboardRow[],
): LeaderboardRow[] {
  if (data.source.mode !== "supabase" || data.metricsPosture.points !== "points_events") {
    return fallback;
  }

  const derived = buildLeaderboardRowsFromPoints(data);
  return derived.length > 0 ? derived : fallback;
}

export function buildLeaderboardRowsFromPoints(data: Pick<
  ReadOnlyAppData,
  "chapter" | "memberships" | "pointsEventRows" | "profiles"
>): LeaderboardRow[] {
  const activeProfiles = new Map<string, ProfileRow>(
    data.profiles
      .filter((profile) => profile.status === "active")
      .map((profile) => [profile.id, profile]),
  );
  const approvedMemberships = new Map<string, MembershipRow>(
    data.memberships
      .filter((membership) => {
        return membership.chapter_id === data.chapter.id && membership.status === "approved";
      })
      .map((membership) => [membership.user_id, membership]),
  );
  const rowsByUser = new Map<string, {
    id: string;
    displayName: string;
    roleLabel: string;
    points: number;
    actionKeys: Set<string>;
  }>();

  for (const row of data.pointsEventRows) {
    const profile = activeProfiles.get(row.awarded_to_user_id);

    if (!profile) {
      continue;
    }

    const membership = approvedMemberships.get(profile.id);

    if (!membership) {
      continue;
    }

    const current = rowsByUser.get(profile.id) ?? {
      id: `leaderboard-${profile.id}`,
      displayName: profile.display_name,
      roleLabel: roleKeyToLeaderboardLabel(membership.role_key),
      points: 0,
      actionKeys: new Set<string>(),
    };

    current.points += row.points_delta;
    current.actionKeys.add(
      row.assignment_id ?? row.chapter_event_id ?? row.evidence_item_id ?? row.id,
    );
    rowsByUser.set(profile.id, current);
  }

  return Array.from(rowsByUser.values())
    .map((row) => ({
      id: row.id,
      displayName: row.displayName,
      roleLabel: row.roleLabel,
      points: row.points,
      completedActions: row.actionKeys.size,
      recognition: getRecognitionLabel(row.points, row.actionKeys.size),
    }))
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      if (right.completedActions !== left.completedActions) {
        return right.completedActions - left.completedActions;
      }

      return left.displayName.localeCompare(right.displayName);
    });
}

function roleKeyToLeaderboardLabel(roleKey: DatabaseRoleKey): string {
  switch (roleKey) {
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
      return "Admin";
    case "ds_admin":
      return "DS Admin";
    case "super_admin":
      return "Super Admin";
    case "general_member":
    default:
      return "General Member";
  }
}

function getRecognitionLabel(points: number, completedActions: number): string {
  if (points >= 60) {
    return "Rush Month closer";
  }

  if (points >= 40) {
    return "Follow-up engine";
  }

  if (points >= 20) {
    return completedActions >= 2 ? "Event follow-through" : "Invite push starter";
  }

  if (points > 0) {
    return "Momentum building";
  }

  return "Getting started";
}
