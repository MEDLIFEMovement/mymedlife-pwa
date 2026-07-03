import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getLaunchLaneMemberEventsHref,
  getLaunchLaneMemberPointsHref,
} from "@/services/events-points-launch-lane";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { buildMemberLaunchLaneEventDetailHref } from "@/services/member-launch-lane-events";
import { getVisibleAssignmentsForActor } from "@/services/role-visibility";
import {
  getSopWorkflowRuntime,
  type WorkflowRuntimeKpi,
} from "@/services/sop-workflow-runtime";
import { getCampaignShellBySlug } from "@/services/campaign-ops-service";
import type { Assignment } from "@/shared/types/domain";
import type { KpiEventRow } from "@/shared/types/persistence";
import type { SopRole } from "@/shared/types/sop-builder";

export type MemberRushMonthCampaignOverview = {
  workflowSource: "builder_definition" | "template_version" | "missing";
  workflowVersionLabel: string;
  workflowCurrentStepId: string | null;
  chapterName: string;
  campaignName: string;
  statusLabel: string;
  weekLabel: string;
  summary: string;
  chapterProgressLabel: string;
  chapterProgressPercent: number;
  currentPhaseLabel: string;
  currentPhaseTitle: string;
  currentPhaseDates: string;
  whyItMattersTitle: string;
  whyItMattersBody: string;
  kpis: Array<{
    label: string;
    value: number;
    goal: number;
    progressLabel: string;
  }>;
  assignedActionsByRole: Array<{
    id: string;
    roleLabel: string;
    progressLabel: string;
    summary: string;
    detail: string;
  }>;
  whatGoodLooksLike: {
    title: string;
    items: string[];
  };
  featuredEvent: {
    title: string;
    sourceLabel: string;
    timing: string;
    momentumLabel: string;
    href: string;
  };
  primaryActions: {
    openEventsHref: string;
    openPointsHref: string;
  };
};

export function getMemberRushMonthCampaignOverview(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): MemberRushMonthCampaignOverview {
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const runtime = getSopWorkflowRuntime("rush-month");
  const campaignShell = getCampaignShellBySlug("rush-month");
  const currentStep = runtime?.currentStep ?? null;
  const currentPhase = runtime?.currentPhase ?? null;
  const progress = getCampaignProgress(visibleAssignments);
  const whyItMattersBody = buildWhyItMattersBody(currentStep, currentPhase);

  return {
    workflowSource: runtime?.sourceKind ?? "missing",
    workflowVersionLabel: runtime?.sourceVersionLabel ?? "unknown",
    workflowCurrentStepId: currentStep?.id ?? null,
    chapterName: data.chapter.name,
    campaignName: runtime?.name ?? data.campaign.name,
    statusLabel: "Active",
    weekLabel: "Week 1 of 4",
    summary:
      campaignShell?.summary ??
      runtime?.summary ??
      "Recruit new members and help them feel welcomed into MEDLIFE.",
    chapterProgressLabel: "Chapter progress",
    chapterProgressPercent: progress.percent,
    currentPhaseLabel: "Current Phase",
    currentPhaseTitle: buildCurrentPhaseTitle(
      runtime?.steps ?? [],
      currentStep?.id,
      currentPhase?.label,
    ),
    currentPhaseDates: buildCurrentPhaseDetail(currentStep, currentPhase),
    whyItMattersTitle: "Why this campaign matters",
    whyItMattersBody,
    kpis: buildCampaignKpis(runtime?.kpis ?? [], data.kpiEventRows),
    assignedActionsByRole: buildAssignedActionsByRole(data.assignments, runtime),
    whatGoodLooksLike: {
      title: "What Good Looks Like",
      items:
        runtime?.whatGoodLooksLike.length
          ? runtime.whatGoodLooksLike.slice(0, 5)
          : [
              "Every member has at least 1 assigned action",
              "Intro GBM event is live on Luma with RSVP link",
              "Chapter tabled at least 2x this week",
              "Follow-up messages sent within 24h of first touch",
              "KPIs reviewed in weekly E-Board meeting",
            ],
    },
    featuredEvent: {
      title: "Intro GBM",
      sourceLabel: "Luma",
      timing: "Thu Nov 15 · 6:00 PM · Ackerman 2100",
      momentumLabel: "23 RSVPs so far",
      href: buildMemberLaunchLaneEventDetailHref("event-rush-med-talk-001", "campaigns"),
    },
    primaryActions: {
      openEventsHref: getLaunchLaneMemberEventsHref("campaigns"),
      openPointsHref: getLaunchLaneMemberPointsHref("campaigns"),
    },
  };
}

function buildCampaignKpis(
  runtimeKpis: readonly WorkflowRuntimeKpi[],
  kpiEventRows: readonly KpiEventRow[],
) {
  const runtimeDrivenKpis = runtimeKpis
    .filter((kpi) => typeof kpi.targetValue === "number" && kpi.targetValue > 0)
    .map((kpi) => {
      const value = Math.round(
        kpiEventRows
          .filter((row) => row.metric_key === kpi.metricKey)
          .reduce((total, row) => total + Number(row.metric_value), 0),
      );
      const goal = kpi.targetValue ?? 0;
      const progressPercent = goal > 0 ? Math.round((value / goal) * 100) : 0;

      return {
        label: kpi.label,
        value,
        goal,
        progressLabel: `${progressPercent}% of goal`,
      };
    });

  if (runtimeDrivenKpis.length > 0) {
    return runtimeDrivenKpis;
  }

  return [
    {
      label: "Leads Captured",
      value: 47,
      goal: 80,
      progressLabel: "59% of goal",
    },
    {
      label: "Intro GBM RSVPs",
      value: 23,
      goal: 50,
      progressLabel: "46% of goal",
    },
    {
      label: "Follow-ups Done",
      value: 18,
      goal: 47,
      progressLabel: "38% of goal",
    },
    {
      label: "New Members",
      value: 9,
      goal: 25,
      progressLabel: "36% of goal",
    },
  ];
}

function getCampaignProgress(assignments: readonly Assignment[]) {
  if (assignments.length === 0) {
    return {
      percent: 0,
    };
  }

  const movingCount = assignments.filter((assignment) => {
    return assignment.status === "approved" ||
      assignment.status === "submitted" ||
      assignment.status === "in_progress";
  }).length;

  return {
    percent: Math.round((movingCount / assignments.length) * 100),
  };
}

function buildCurrentPhaseTitle(
  steps: readonly NonNullable<ReturnType<typeof getSopWorkflowRuntime>>["steps"][number][],
  currentStepId: string | undefined,
  currentPhaseLabel: string | undefined,
) {
  const stepIndex = steps.findIndex((step) => step.id === currentStepId);
  const currentStep = stepIndex >= 0 ? steps[stepIndex] : steps[0];

  if (!currentStep) {
    return "Week 1: Rush Month momentum";
  }

  if (currentPhaseLabel) {
    return `${currentPhaseLabel}: ${currentStep.title}`;
  }

  const weekNumber = Math.min(4, Math.max(1, stepIndex + 1 || 1));

  return `Week ${weekNumber}: ${currentStep.title}`;
}

function buildCurrentPhaseDetail(
  currentStep: NonNullable<ReturnType<typeof getSopWorkflowRuntime>>["currentStep"],
  currentPhase: NonNullable<ReturnType<typeof getSopWorkflowRuntime>>["currentPhase"],
) {
  if (currentPhase?.exitCriteria[0]) {
    return `Exit signal: ${currentPhase.exitCriteria[0]}`;
  }

  return currentStep?.completionSignal ?? "Current campaign window";
}

function buildWhyItMattersBody(
  currentStep: NonNullable<ReturnType<typeof getSopWorkflowRuntime>>["currentStep"],
  currentPhase: NonNullable<ReturnType<typeof getSopWorkflowRuntime>>["currentPhase"],
) {
  const defaultMessage =
    "Rush Month works when every small student action creates visible momentum: a real invite, a real event, a real follow-up, and proof that helps the next student say yes.";
  const whyItMatters = currentStep?.whyItMatters ?? defaultMessage;

  if (!currentPhase?.objective) {
    return whyItMatters;
  }

  return `${whyItMatters} Current phase objective: ${currentPhase.objective}`;
}

type AssignedRoleGroup = {
  id: string;
  roleLabel: string;
  runtimeRoles: readonly SopRole[];
  assignmentOwners: readonly string[];
  fallbackSummary: string;
  fallbackDetail: string;
};

const assignedRoleGroups: readonly AssignedRoleGroup[] = [
  {
    id: "general-members",
    roleLabel: "General Members",
    runtimeRoles: ["student_member", "committee_member"],
    assignmentOwners: ["General Member"],
    fallbackSummary: "Invite friends · Share flyer · Add leads",
    fallbackDetail:
      "General members move Rush Month through visible invites, tabling help, and one clear follow-up after the first chapter touchpoint.",
  },
  {
    id: "action-committee-chairs",
    roleLabel: "Action Committee Chairs",
    runtimeRoles: ["committee_chair"],
    assignmentOwners: ["Action Committee Chair"],
    fallbackSummary: "Coordinate tabling · Track leads · Brief members",
    fallbackDetail:
      "Chairs keep the operating rhythm readable by coordinating volunteer coverage, lead tracking, and what members need to do next.",
  },
  {
    id: "eboard",
    roleLabel: "E-Board",
    runtimeRoles: ["eboard_officer", "vice_president"],
    assignmentOwners: ["E-Board Member"],
    fallbackSummary: "Review KPIs · Manage Luma · Assign tasks",
    fallbackDetail:
      "E-Board owns the weekly campaign picture: KPI review, event posture, assignments, and whether chapter follow-through is actually happening.",
  },
  {
    id: "president-vp",
    roleLabel: "President / VP",
    runtimeRoles: ["president"],
    assignmentOwners: ["Chapter President / Vice President"],
    fallbackSummary: "Coach check-in · Approve evidence · Drive decisions",
    fallbackDetail:
      "The president and VP lane should stay decision-oriented: unblock the chapter, review proof, and keep campaign momentum from stalling.",
  },
];

function buildAssignedActionsByRole(
  assignments: readonly Assignment[],
  runtime: ReturnType<typeof getSopWorkflowRuntime>,
) {
  return assignedRoleGroups.map((group) => {
    const matchingAssignments = assignments.filter((assignment) =>
      group.assignmentOwners.includes(assignment.ownerRole),
    );
    const completedCount = matchingAssignments.filter((assignment) => {
      return assignment.status === "approved" || assignment.status === "submitted";
    }).length;
    const runtimeLanes = runtime?.roleLanes.filter((lane) =>
      group.runtimeRoles.includes(lane.role),
    ) ?? [];
    const runtimeSummary = runtimeLanes[0]?.summary ?? null;
    const guardrails = runtimeLanes.map((lane) => lane.guardrail);

    return {
      id: group.id,
      roleLabel: group.roleLabel,
      progressLabel:
        matchingAssignments.length > 0
          ? `${completedCount}/${matchingAssignments.length} done`
          : "0/0 done",
      summary:
        runtimeSummary ?? group.fallbackSummary,
      detail:
        guardrails.length > 0
          ? `${runtimeSummary ?? group.fallbackDetail} ${guardrails.join(" ")}`
          : group.fallbackDetail,
    };
  });
}
