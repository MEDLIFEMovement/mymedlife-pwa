import type { LocalActorContext } from "@/services/local-actor-context";
import { buildMemberActionRouteHref } from "@/services/member-action-route-href";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { getVisibleAssignmentsForActor } from "@/services/role-visibility";

export type MemberRushMonthCampaignOverview = {
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
  primaryActions: {
    viewActionsHref: string;
    submitEvidenceHref: string;
  };
};

export function getMemberRushMonthCampaignOverview(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): MemberRushMonthCampaignOverview {
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const proofReadyAssignment = pickProofReadyAssignment(visibleAssignments);

  return {
    chapterName: data.chapter.name,
    campaignName: data.campaign.name,
    statusLabel: "Active",
    weekLabel: "Week 1 of 4",
    summary: "Recruit new members and help them feel welcomed into MEDLIFE.",
    chapterProgressLabel: "Chapter progress",
    chapterProgressPercent: 67,
    currentPhaseLabel: "Current Phase",
    currentPhaseTitle: "Week 1: Visibility + Lead Capture",
    currentPhaseDates: "Nov 11 – Nov 17",
    whyItMattersTitle: "Why this campaign matters",
    whyItMattersBody:
      "Rush Month works when every small student action creates visible momentum: a real invite, a real event, a real follow-up, and proof that helps the next student say yes.",
    kpis: [
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
    ],
    assignedActionsByRole: [
      {
        id: "general-members",
        roleLabel: "General Members",
        progressLabel: "1/3 done",
        summary: "Invite friends · Share flyer · Add leads",
        detail:
          "General members move Rush Month through visible invites, tabling help, and one clear follow-up after the first chapter touchpoint.",
      },
      {
        id: "action-committee-chairs",
        roleLabel: "Action Committee Chairs",
        progressLabel: "3/5 done",
        summary: "Coordinate tabling · Track leads · Brief members",
        detail:
          "Chairs keep the operating rhythm readable by coordinating volunteer coverage, lead tracking, and what members need to do next.",
      },
      {
        id: "eboard",
        roleLabel: "E-Board",
        progressLabel: "4/6 done",
        summary: "Review KPIs · Manage Luma · Assign tasks",
        detail:
          "E-Board owns the weekly campaign picture: KPI review, event posture, assignments, and whether chapter follow-through is actually happening.",
      },
      {
        id: "president-vp",
        roleLabel: "President / VP",
        progressLabel: "4/4 done",
        summary: "Coach check-in · Approve evidence · Drive decisions",
        detail:
          "The president and VP lane should stay decision-oriented: unblock the chapter, review proof, and keep campaign momentum from stalling.",
      },
    ],
    primaryActions: {
      viewActionsHref: "/rush-month/actions?source=campaigns",
      submitEvidenceHref: proofReadyAssignment
        ? buildMemberActionRouteHref(proofReadyAssignment.id, {
            source: "campaigns",
            step: "submit",
          })
        : "/rush-month/evidence?source=campaigns",
    },
  };
}

function pickProofReadyAssignment(
  assignments: ReadOnlyAppData["assignments"],
) {
  return (
    assignments.find((assignment) => assignment.status === "changes_requested") ??
    assignments.find((assignment) => assignment.status === "in_progress") ??
    null
  );
}
