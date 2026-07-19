import type { MemberMobileIdentityContext } from "@/components/figma-member-mobile-home";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { MemberRecognitionSummary } from "@/services/member-recognition";
import type { MvpMemberHome } from "@/services/mvp-event-tracking-workspace";

export function ensureVisibleTestLabel(value: string) {
  return /\bTEST\b/.test(value) ? value : `TEST ${value}`;
}

export function getVisibleMemberGreetingName(displayName: string) {
  const trimmedDisplayName = displayName.trim();

  if (!trimmedDisplayName) {
    return "TEST Member";
  }

  const labelStrippedName = trimmedDisplayName.replace(/^TEST\b\s*/u, "").trim();
  const nameForGreeting = /^Test\b/u.test(labelStrippedName)
    ? labelStrippedName
    : getFirstName(labelStrippedName);

  return ensureVisibleTestLabel(nameForGreeting);
}

export function buildMemberIdentityContext(
  actor: LocalActorContext,
  studentHome: MvpMemberHome,
  recognition: MemberRecognitionSummary,
  campusName: string,
): MemberMobileIdentityContext {
  const selectedMember = recognition.selectedMember;
  const selectedName = selectedMember?.displayName ?? actor.user.displayName;
  const weeklyStat = recognition.topStats.find((stat) => stat.label === "This Week");
  const rows = recognition.leaderboard.map((row, index) => ({
    rank: index + 1,
    name: ensureVisibleTestLabel(row.displayName),
    role: row.roleLabel,
    pts: row.points,
    me: row.displayName.toLowerCase() === selectedName.toLowerCase(),
  }));

  if (!rows.some((row) => row.me)) {
    rows.push({
      rank: selectedMember?.rank ?? rows.length + 1,
      name: ensureVisibleTestLabel(selectedName),
      role: actor.chapterRoles[0] ?? "General Member",
      pts: selectedMember?.points ?? studentHome.pointsTotal,
      me: true,
    });
  }

  return {
    displayName: ensureVisibleTestLabel(actor.user.displayName),
    firstName: getVisibleMemberGreetingName(actor.user.displayName),
    chapterName: ensureVisibleTestLabel(studentHome.chapterName),
    campusName: ensureVisibleTestLabel(campusName),
    pointsTotal: studentHome.pointsTotal,
    pointsWeeklyLabel: weeklyStat?.value ?? "+0",
    pointsRankLabel: studentHome.pointsRankLabel,
    completedActions: selectedMember?.completedActions ?? recognition.recentApprovedActions.length,
    leaderboardRows: rows,
  };
}

export function getVisibleMemberLeaderboardRows(
  memberContext: MemberMobileIdentityContext,
  limit: number,
) {
  const rows = memberContext.leaderboardRows;
  const selfRow =
    rows.find((row) => row.me) ??
    {
      rank: rows.length + 1,
      name: memberContext.displayName,
      role: "General Member",
      pts: memberContext.pointsTotal,
      me: true,
    };
  const visibleRows = rows.slice(0, limit);

  if (visibleRows.some((row) => row.me)) {
    return visibleRows;
  }

  return [...visibleRows.slice(0, Math.max(limit - 1, 0)), selfRow];
}

function getFirstName(displayName: string) {
  return displayName.split(" ")[0] ?? displayName;
}
