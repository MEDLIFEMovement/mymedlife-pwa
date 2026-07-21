import type { MemberMobileIdentityContext } from "@/components/figma-member-mobile-home";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { MemberRecognitionSummary } from "@/services/member-recognition";
import type { MvpMemberHome } from "@/services/mvp-event-tracking-workspace";

export function ensureVisibleTestLabel(value: string) {
  const normalized = value.trim().replace(/^(?:test\b[\s:.-]*)+/iu, "").trim();
  return normalized ? `TEST ${normalized}` : "TEST";
}

export function getVisibleMemberGreetingName(
  displayName: string,
  testPreview = true,
) {
  const trimmedDisplayName = displayName.trim();

  if (!trimmedDisplayName) {
    return testPreview ? "TEST Member" : "Member";
  }

  const hasTestLabel = /^test\b/iu.test(trimmedDisplayName);
  const hasTitleCaseTestPrefix = /^Test\b/u.test(trimmedDisplayName);
  const labelStrippedName = trimmedDisplayName
    .replace(/^(?:test\b[\s:.-]*)+/iu, "")
    .trim();
  const nameForGreeting = hasTitleCaseTestPrefix
    ? labelStrippedName
    : getFirstName(labelStrippedName);

  return testPreview || hasTestLabel
    ? ensureVisibleTestLabel(nameForGreeting)
    : nameForGreeting;
}

export function buildMemberIdentityContext(
  actor: LocalActorContext,
  studentHome: MvpMemberHome,
  recognition: MemberRecognitionSummary,
  campusName: string,
  options: { testPreview: boolean },
): MemberMobileIdentityContext {
  const getVisibleIdentityLabel = (value: string, fallback: string) => {
    const normalized = value.trim() || fallback;
    return options.testPreview || /^test\b/iu.test(normalized)
      ? ensureVisibleTestLabel(normalized)
      : normalized;
  };
  const selectedMember = recognition.selectedMember;
  const selectedName = selectedMember?.displayName ?? actor.user.displayName;
  const weeklyStat = recognition.topStats.find((stat) => stat.label === "This Week");
  const rows = recognition.leaderboard.map((row, index) => ({
    rank: index + 1,
    name: getVisibleIdentityLabel(row.displayName, "Member"),
    role: row.roleLabel,
    pts: row.points,
    me: row.displayName.toLowerCase() === selectedName.toLowerCase(),
  }));

  if (!rows.some((row) => row.me)) {
    rows.push({
      rank: selectedMember?.rank ?? rows.length + 1,
      name: getVisibleIdentityLabel(selectedName, "Member"),
      role: actor.chapterRoles[0] ?? "General Member",
      pts: selectedMember?.points ?? studentHome.pointsTotal,
      me: true,
    });
  }

  return {
    displayName: getVisibleIdentityLabel(actor.user.displayName, "Member"),
    firstName: getVisibleMemberGreetingName(actor.user.displayName, options.testPreview),
    chapterName: getVisibleIdentityLabel(studentHome.chapterName, "Chapter"),
    campusName: getVisibleIdentityLabel(campusName, "Campus"),
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
