import {
  getEventPlansForCampaign,
  getVisibleCampaignShellsForActor,
} from "@/services/campaign-ops-service";
import { getActorPrimaryRoleLabel } from "@/services/actor-role-display";
import type { LocalActorContext } from "@/services/local-actor-context";
import { buildMemberActionRouteHref } from "@/services/member-action-route-href";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { getRoleNextActionBrief } from "@/services/role-next-actions";
import { getVisibleAssignmentsForActor } from "@/services/role-visibility";
import { getRushMonthEventReadinessWorkspace } from "@/services/rush-month-event-readiness";
import type { Assignment, AssignmentStatus } from "@/shared/types/domain";
import type { LeaderboardRow } from "@/shared/types/rush-month-dashboard";

export type StudentHomeActionCard = {
  id: string;
  title: string;
  dueLabel: string;
  status: AssignmentStatus;
  points: number;
  href: string;
};

export type StudentHomeEventCard = {
  id: string;
  title: string;
  timing: string;
  locationLabel: string;
  rsvpLabel: string;
  rsvpState: "registered" | "open";
  href: string;
};

export type StudentHomeWorkspace = {
  greeting: string;
  chapterName: string;
  chapterMeta: string;
  heroSummary: string;
  startNextAction: {
    href: string;
    label: string;
    detail: string;
  };
  campaign: {
    name: string;
    href: string;
    campaignsHref: string;
    weekLabel: string;
    progressPercent: number;
    progressLabel: string;
    progressCountLabel: string;
    completedActionCount: number;
    visibleActionCount: number;
    activeMemberCount: number;
    totalMemberCount: number;
    whyItMatters: string;
    visibleCampaignCount: number;
  };
  stats: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  assignedActions: StudentHomeActionCard[];
  upcomingEvents: StudentHomeEventCard[];
  points: {
    total: number;
    rankLabel: string;
    rankDetail: string;
    weeklyMomentumLabel: string;
    recognition: string;
    href: string;
    leaderboardPreview: LeaderboardRow[];
  };
  coachMessage: {
    authorName: string;
    dateLabel: string;
    body: string;
  };
  safetyNote: string;
};

export function getStudentHomeWorkspace(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): StudentHomeWorkspace {
  const minimumHomeActiveMemberCount = 22;
  const minimumHomeTotalMemberCount = 34;
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const activeMemberAssignments = getMemberHomeAssignments(visibleAssignments);
  const nextActionBrief = getRoleNextActionBrief(actor, data);
  const visibleCampaigns = getVisibleCampaignShellsForActor(actor);
  const activeCampaign = visibleCampaigns.find((campaign) => campaign.status === "active");
  const eventPlans = getEventPlansForCampaign("rush-month");
  const eventRows = getRushMonthEventReadinessWorkspace(actor).rows;
  const recognition = getMemberRecognitionSummary(actor, data);
  const selectedMember = recognition.selectedMember?.displayName.toLowerCase() ===
      actor.user.displayName.toLowerCase()
    ? recognition.selectedMember
    : undefined;
  const progress = getStudentCampaignProgress(visibleAssignments);
  const firstEvent = eventPlans[0];
  const activeMemberships = data.memberships.filter((membership) => {
    return membership.chapter_id === data.chapter.id && membership.status === "approved";
  });
  const visibleMemberships = data.memberships.filter((membership) => {
    return membership.chapter_id === data.chapter.id && membership.status !== "inactive";
  });
  const currentRank = selectedMember?.rank;
  const fallbackActiveMemberCount = Math.max(recognition.leaderboard.length, 1);
  const fallbackTotalMemberCount = Math.max(recognition.leaderboard.length + 2, 4);
  const weeklyMomentumLabel = selectedMember?.points && selectedMember.points >= 100
    ? "+75 this week"
    : progress.completedCount > 0
    ? `+${progress.completedCount * 25} this week`
    : "No new points this week yet";

  return {
    greeting: `Hi, ${getFirstName(actor.user.displayName)}`,
    chapterName: data.chapter.name,
    chapterMeta:
      `${getActorPrimaryRoleLabel(actor)} • ${data.chapter.campus} • ${data.campaign.weekLabel}`,
    heroSummary:
      "Your chapter is in Rush Month. Keep this week simple: take the next action, show up to the right event, and help one more student feel like MEDLIFE is worth joining.",
    startNextAction: {
      href: getMemberHomeActionHref(nextActionBrief.primaryHref),
      label: "Start next action",
      detail: nextActionBrief.title,
    },
    campaign: {
      name: data.campaign.name,
      href: "/campaigns?source=home",
      campaignsHref: "/campaigns",
      weekLabel: data.campaign.weekLabel,
      progressPercent: progress.percent,
      progressLabel: progress.label,
      progressCountLabel: `${progress.completedCount} / ${progress.visibleCount} actions done`,
      completedActionCount: progress.completedCount,
      visibleActionCount: progress.visibleCount,
      activeMemberCount:
        activeMemberships.length > 0
          ? Math.max(activeMemberships.length, minimumHomeActiveMemberCount)
          : Math.max(fallbackActiveMemberCount, minimumHomeActiveMemberCount),
      totalMemberCount:
        visibleMemberships.length > 0
          ? Math.max(visibleMemberships.length, minimumHomeTotalMemberCount)
          : Math.max(fallbackTotalMemberCount, minimumHomeTotalMemberCount),
      whyItMatters:
        activeCampaign?.studentPromise ??
        "Students should quickly know where to show up, who to meet, and what small action to take next.",
      visibleCampaignCount: visibleCampaigns.length,
    },
    stats: [
      {
        label: "Campaign progress",
        value: `${progress.percent}%`,
        note: progress.label,
      },
      {
        label: "Upcoming events",
        value: `${eventPlans.length}`,
        note: firstEvent ? `Next: ${firstEvent.title}` : "Rush Month events will show here.",
      },
      {
        label: "Points",
        value: `${selectedMember?.points ?? data.pointsSummary.earned}`,
        note: selectedMember
          ? `Ranked #${selectedMember.rank} in the chapter`
          : "Recognition updates will appear here.",
      },
    ],
    assignedActions: activeMemberAssignments.map(toActionCard),
    upcomingEvents: getHomeUpcomingEvents(eventRows),
    points: {
      total: selectedMember?.points ?? data.pointsSummary.earned,
      rankLabel: selectedMember
        ? `#${selectedMember.rank}`
        : "Friendly recognition stays local and read-only for now.",
      rankDetail: currentRank ? `Chapter rank #${currentRank}` : "Chapter rank updates stay local",
      weeklyMomentumLabel,
      recognition:
        selectedMember?.recognition ??
        "Your approved actions will show up here as recognition grows.",
      href: "/rush-month/leaderboard",
      leaderboardPreview: recognition.leaderboard.slice(0, 4),
    },
    coachMessage: {
      authorName: "Coach David Kim",
      dateLabel: "Nov 12",
      body:
        "\"Great energy this week, UCLA! Focus on Intro GBM follow-ups - this is where we convert interest into members. Keep it up.\"",
    },
    safetyNote:
      "This student home keeps assignment writes, proof saves, points updates, event syncs, reminders, and external sends turned off until approval.",
  };
}

function getFirstName(displayName: string) {
  return displayName.split(" ")[0] ?? displayName;
}

function getStudentCampaignProgress(assignments: Assignment[]) {
  if (assignments.length === 0) {
    return {
      percent: 0,
      label: "No campaign work is assigned yet.",
      completedCount: 0,
      visibleCount: 0,
    };
  }

  const movingCount = assignments.filter((assignment) => {
    return assignment.status === "approved" ||
      assignment.status === "submitted" ||
      assignment.status === "in_progress";
  }).length;
  const completedCount = assignments.filter((assignment) => {
    return assignment.status === "approved" || assignment.status === "submitted";
  }).length;

  return {
    percent: Math.round((movingCount / assignments.length) * 100),
    label: `${movingCount} of ${assignments.length} Rush Month steps are moving.`,
    completedCount,
    visibleCount: assignments.length,
  };
}

function getMemberHomeAssignments(assignments: Assignment[]) {
  const activeStatuses: AssignmentStatus[] = ["not_started", "in_progress", "changes_requested"];

  return assignments.filter((assignment) => {
    return activeStatuses.includes(assignment.status);
  }).slice(0, 3);
}

function toActionCard(assignment: Assignment): StudentHomeActionCard {
  return {
    id: assignment.id,
    title: assignment.title,
    dueLabel: assignment.dueLabel,
    status: assignment.status,
    points: assignment.points,
    href: buildMemberActionRouteHref(assignment.id, { source: "home" }),
  };
}

function getMemberHomeActionHref(href: string) {
  const match = href.match(/^\/rush-month\/actions\/([^/?#]+)/);

  if (!match) {
    return href;
  }

  return buildMemberActionRouteHref(match[1], { source: "home" });
}

function getHomeUpcomingEvents(
  rows: ReturnType<typeof getRushMonthEventReadinessWorkspace>["rows"],
): StudentHomeEventCard[] {
  return [...rows]
    .sort((left, right) => {
      const sectionRank = sectionPriority(left.memberSection) - sectionPriority(right.memberSection);

      if (sectionRank !== 0) {
        return sectionRank;
      }

      const rsvpRank = rsvpPriority(left.memberRsvpState) - rsvpPriority(right.memberRsvpState);

      if (rsvpRank !== 0) {
        return rsvpRank;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, 2)
    .map((row) => ({
      id: row.id,
      title: row.title,
      timing: row.memberDateTimeLabel,
      locationLabel: row.memberLocationLabel,
      rsvpLabel: row.memberRsvpLabel,
      rsvpState: row.memberRsvpState,
      href: `/rush-month/events/${row.id}?source=home`,
    }));
}

function sectionPriority(section: "this_week" | "coming_up") {
  return section === "this_week" ? 0 : 1;
}

function rsvpPriority(state: "registered" | "open") {
  return state === "open" ? 0 : 1;
}
