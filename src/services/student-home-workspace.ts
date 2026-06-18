import {
  getEventPlansForCampaign,
  getVisibleCampaignShellsForActor,
} from "@/services/campaign-ops-service";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { getRoleNextActionBrief } from "@/services/role-next-actions";
import { getVisibleAssignmentsForActor } from "@/services/role-visibility";
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
  statusLabel: string;
  expectedStudentAction: string;
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
    recognition: string;
    href: string;
    leaderboardPreview: LeaderboardRow[];
  };
  leaderMessage: {
    authorName: string;
    authorRole: string;
    body: string;
  };
  safetyNote: string;
};

export function getStudentHomeWorkspace(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): StudentHomeWorkspace {
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const nextActionBrief = getRoleNextActionBrief(actor, data);
  const visibleCampaigns = getVisibleCampaignShellsForActor(actor);
  const activeCampaign = visibleCampaigns.find((campaign) => campaign.status === "active");
  const eventPlans = getEventPlansForCampaign("rush-month");
  const recognition = getMemberRecognitionSummary(actor, data);
  const selectedMember = recognition.selectedMember?.displayName.toLowerCase() ===
      actor.user.displayName.toLowerCase()
    ? recognition.selectedMember
    : undefined;
  const progress = getStudentCampaignProgress(data.assignments);
  const firstEvent = eventPlans[0];

  return {
    greeting: `Hi, ${getFirstName(actor.user.displayName)}`,
    chapterName: data.chapter.name,
    chapterMeta: `${actor.audienceLabel} • ${data.chapter.campus} • ${data.campaign.weekLabel}`,
    heroSummary:
      "Your chapter is in Rush Month. Keep this week simple: take the next action, show up to the right event, and help one more student feel like MEDLIFE is worth joining.",
    startNextAction: {
      href: nextActionBrief.primaryHref,
      label: "Start next action",
      detail: nextActionBrief.title,
    },
    campaign: {
      name: data.campaign.name,
      href: "/rush-month",
      campaignsHref: "/campaigns",
      weekLabel: data.campaign.weekLabel,
      progressPercent: progress.percent,
      progressLabel: progress.label,
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
    assignedActions: visibleAssignments.map(toActionCard),
    upcomingEvents: eventPlans.slice(0, 2).map((eventPlan) => ({
      id: eventPlan.id,
      title: eventPlan.title,
      timing: eventPlan.timing,
      statusLabel: eventPlan.lumaStatus.replaceAll("_", " "),
      expectedStudentAction: eventPlan.expectedStudentAction,
      href: `/rush-month/events/${eventPlan.id}`,
    })),
    points: {
      total: selectedMember?.points ?? data.pointsSummary.earned,
      rankLabel: selectedMember
        ? `#${selectedMember.rank} on the chapter leaderboard`
        : "Friendly recognition stays local and read-only for now.",
      recognition:
        selectedMember?.recognition ??
        "Your approved actions will show up here as recognition grows.",
      href: "/rush-month/leaderboard",
      leaderboardPreview: recognition.leaderboard.slice(0, 3),
    },
    leaderMessage: {
      authorName: "Priya President",
      authorRole: "President / VP",
      body: firstEvent
        ? `This week is about making ${firstEvent.title.toLowerCase()} feel easy to say yes to. Bring one student, take one real follow-up step, and submit proof that would help the next person join.`
        : "This week is about one concrete action, one follow-up, and one story that shows MEDLIFE feels real on campus.",
    },
    safetyNote:
      "This student home is mock-safe. Assignment writes, proof saves, points updates, event syncs, reminders, and external sends remain blocked until approval.",
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
    };
  }

  const movingCount = assignments.filter((assignment) => {
    return assignment.status === "approved" ||
      assignment.status === "submitted" ||
      assignment.status === "in_progress";
  }).length;

  return {
    percent: Math.round((movingCount / assignments.length) * 100),
    label: `${movingCount} of ${assignments.length} Rush Month steps are moving.`,
  };
}

function toActionCard(assignment: Assignment): StudentHomeActionCard {
  return {
    id: assignment.id,
    title: assignment.title,
    dueLabel: assignment.dueLabel,
    status: assignment.status,
    points: assignment.points,
    href: `/rush-month/actions/${assignment.id}`,
  };
}
