import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadChapterData,
  getActorSurfaceFamily,
  getVisibleAssignmentsForActor,
} from "@/services/role-visibility";
import type { Assignment } from "@/shared/types/domain";

export type RoleNextActionSignal = {
  label: string;
  value: string;
  note: string;
};

export type RoleNextActionBrief = {
  eyebrow: string;
  title: string;
  summary: string;
  ownerLabel: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  safetyNote: string;
  signals: RoleNextActionSignal[];
};

export function getRoleNextActionBrief(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): RoleNextActionBrief {
  if (!canReadChapterData(actor)) {
    return getDsAdminBrief(data);
  }

  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const surfaceFamily = getActorSurfaceFamily(actor);

  switch (surfaceFamily) {
    case "member":
      return getMemberBrief(visibleAssignments, data);
    case "leader":
      return getLeaderBrief(actor, visibleAssignments, data);
    case "coach":
      return getCoachBrief(visibleAssignments, data);
    case "staff":
      return getAdminBrief(data);
    case "ds_admin":
      return getDsAdminBrief(data);
    case "super_admin":
      return getSuperAdminBrief(data);
  }
}

function getMemberBrief(
  assignments: Assignment[],
  data: ReadOnlyAppData,
): RoleNextActionBrief {
  const nextAssignment =
    assignments.find((assignment) => assignment.status !== "approved") ?? assignments[0];

  return {
    eyebrow: "Your next move",
    title: nextAssignment ? `Finish: ${nextAssignment.title}` : "Check your Rush Month work",
    summary:
      nextAssignment?.evidenceRequired ??
      "Open your visible actions and confirm what proof or testimonial is needed.",
    ownerLabel: "General Member",
    primaryHref: nextAssignment
      ? `/rush-month/actions/${nextAssignment.id}`
      : "/rush-month/actions",
    primaryLabel: "Open my action",
    secondaryHref: "/rush-month/leaderboard",
    secondaryLabel: "See my points",
    safetyNote:
      "This is still read-only guidance. Submitting or saving proof remains disabled until approved.",
    signals: [
      {
        label: "Visible actions",
        value: `${assignments.length}`,
        note: "Only member-readable work is shown here.",
      },
      {
        label: "Points earned",
        value: `${data.pointsSummary.earned}`,
        note: "Friendly recognition from the local mock points summary.",
      },
      {
        label: "Proof prompt",
        value: nextAssignment?.status.replaceAll("_", " ") ?? "none",
        note: nextAssignment?.dueLabel ?? "No due date in this local view.",
      },
    ],
  };
}

function getLeaderBrief(
  actor: LocalActorContext,
  assignments: Assignment[],
  data: ReadOnlyAppData,
): RoleNextActionBrief {
  const pendingFollowUp = countFollowUpAssignments(assignments);
  const activeOwners = assignments.filter(
    (assignment) =>
      assignment.status === "not_started" || assignment.status === "in_progress",
  ).length;
  const shouldReview = pendingFollowUp > 0;

  if (hasChapterRole(actor, "President / VP")) {
    return {
      eyebrow: "President / VP priority",
      title: shouldReview
        ? "Approve the next proof and role decisions"
        : "Check role coverage before opening more work",
      summary: shouldReview
        ? "Submitted or changes-requested proof needs a decision posture before points, KPIs, and coach readiness can move."
        : "Use member and role coverage before approving the next Rush Month owner push.",
      ownerLabel: "President / VP",
      primaryHref: shouldReview ? "/rush-month/review" : "/chapter/members",
      primaryLabel: shouldReview ? "Open approval queue" : "Check role coverage",
      secondaryHref: "/rush-month/dashboard",
      secondaryLabel: "Open leader dashboard",
      safetyNote:
        "President / VP approval posture is read-only here. Membership approvals, proof decisions, assignment saves, and role changes remain disabled.",
      signals: [
        {
          label: "Needs decision",
          value: `${pendingFollowUp}`,
          note: "Submitted or changes-requested items visible to President / VP.",
        },
        {
          label: "Active owners",
          value: `${activeOwners}`,
          note: "Use this before approving new assignments.",
        },
        {
          label: "Chapter KPI",
          value: data.kpiSummary.coachDecision,
          note: "Local read-only campaign posture.",
        },
      ],
    };
  }

  if (hasChapterRole(actor, "E-Board Member")) {
    return {
      eyebrow: "E-Board priority",
      title: activeOwners > 0
        ? "Move the owners who are still stuck"
        : "Prepare the next action committee push",
      summary: activeOwners > 0
        ? "Not-started and in-progress actions need concrete owner follow-up before the next event."
        : "Keep action committees moving by naming the event goal, owner, due date, and proof reminder.",
      ownerLabel: "E-Board Member",
      primaryHref: "/rush-month/actions",
      primaryLabel: "Open owner follow-up",
      secondaryHref: "/rush-month/events",
      secondaryLabel: "Check events",
      safetyNote:
        "E-Board execution posture is read-only here. Assignment saves, reminders, Luma writes, proof uploads, and external sends remain disabled.",
      signals: [
        {
          label: "Active owners",
          value: `${activeOwners}`,
          note: "Owners who need follow-up from E-Board.",
        },
        {
          label: "Proof follow-up",
          value: `${pendingFollowUp}`,
          note: "Items that need clearer proof, testimonial context, or HQ review.",
        },
        {
          label: "Events linked",
          value: `${data.kpiSummary.eventsLinked}`,
          note: "Mock Luma posture only.",
        },
      ],
    };
  }

  return {
    eyebrow: "Leader operating priority",
    title: shouldReview
      ? "Clear proof follow-up before assigning more work"
      : "Assign the next concrete Rush Month owner",
    summary: shouldReview
      ? "Submitted or changes-requested proof needs a plain decision so points, KPIs, and coach posture can move."
      : "Keep action committees moving by naming the owner, event goal, due date, and proof requirement.",
    ownerLabel: "Chapter Leader / E-Board",
    primaryHref: shouldReview ? "/rush-month/review" : "/rush-month/actions",
    primaryLabel: shouldReview ? "Open follow-up queue" : "Open team actions",
    secondaryHref: "/rush-month/loop",
    secondaryLabel: "Run local MVP loop",
    safetyNote:
      "Leader saves and reminders are still disabled. This panel only shows the next safe operating step.",
    signals: [
      {
        label: "Needs follow-up",
        value: `${pendingFollowUp}`,
        note: "Submitted or changes-requested items visible to leaders.",
      },
      {
        label: "Active owners",
        value: `${activeOwners}`,
        note: "Visible owners still moving work forward.",
      },
      {
        label: "Events linked",
        value: `${data.kpiSummary.eventsLinked}`,
        note: "Mock Luma posture only.",
      },
    ],
  };
}

function hasChapterRole(actor: LocalActorContext, role: string): boolean {
  return actor.chapterRoles.includes(role);
}

function getCoachBrief(
  assignments: Assignment[],
  data: ReadOnlyAppData,
): RoleNextActionBrief {
  const incompleteAssignments = assignments.filter(
    (assignment) => assignment.status !== "approved",
  ).length;

  return {
    eyebrow: "Coach portfolio priority",
    title: `Review whether this chapter should ${data.kpiSummary.coachDecision}`,
    summary:
      "Use assignment movement, proof flow, risk flags, and KPI direction before logging advance, hold, or intervene later.",
    ownerLabel: "Coach",
    primaryHref: "/coach",
    primaryLabel: "Open coach readout",
    secondaryHref: "/rush-month/dashboard",
    secondaryLabel: "Open campaign health",
    safetyNote:
      "Coach decisions and escalation packets remain disabled until live auth and write activation are approved.",
    signals: [
      {
        label: "Open work",
        value: `${incompleteAssignments}`,
        note: "Visible non-approved assignments in the coach read scope.",
      },
      {
        label: "Proof pending",
        value: `${data.kpiSummary.proofPending}`,
        note: "Testimonials/proof that may shape the coach decision.",
      },
      {
        label: "Decision state",
        value: data.kpiSummary.coachDecision,
        note: "Local read-only decision posture.",
      },
    ],
  };
}

function getAdminBrief(data: ReadOnlyAppData): RoleNextActionBrief {
  return {
    eyebrow: "HQ support priority",
    title: "Review proof-sharing posture without publishing anything",
    summary:
      "HQ decides whether submitted testimonials or bridge videos should be shared broadly later. The MVP still keeps publishing and external syncs off.",
    ownerLabel: "Staff",
    primaryHref: "/rush-month/review",
    primaryLabel: "Open HQ review",
    secondaryHref: "/admin",
    secondaryLabel: "Open admin center",
    safetyNote:
      "Admin mutation controls, public proof sharing, and real HubSpot/Luma/n8n writes remain disabled.",
    signals: [
      {
        label: "Proof pending",
        value: `${data.kpiSummary.proofPending}`,
        note: "Local proof posture for future HQ review.",
      },
      {
        label: "Outbox sends",
        value: "0",
        note: "No real external automation is enabled.",
      },
      {
        label: "Campaign",
        value: data.campaign.status,
        note: data.campaign.weekLabel,
      },
    ],
  };
}

function getDsAdminBrief(data: ReadOnlyAppData): RoleNextActionBrief {
  return {
    eyebrow: "Integration safety priority",
    title: "Inspect disabled outbox rows only",
    summary:
      "DS Admin can verify event and outbox readiness, but student truth, proof content, points, and KPIs stay owned by the app and chapter roles.",
    ownerLabel: "DS Admin",
    primaryHref: "/admin",
    primaryLabel: "Open integration posture",
    safetyNote:
      "This role must not own permissions, assignments, proof decisions, points, KPIs, or campaign truth.",
    signals: [
      {
        label: "External sends",
        value: "0",
        note: "HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes stay off.",
      },
      {
        label: "Outbox rows",
        value: `${data.outboxItems.length}`,
        note: "Inspectable disabled/mock rows.",
      },
      {
        label: "Student truth",
        value: "hidden",
        note: "No member assignments, proof, points, or KPIs.",
      },
    ],
  };
}

function getSuperAdminBrief(data: ReadOnlyAppData): RoleNextActionBrief {
  return {
    eyebrow: "Full local oversight priority",
    title: "Review the MVP surface before approving real writes",
    summary:
      "Use the local app to inspect role boundaries, the Rush Month loop, result states, admin posture, and disabled integration safety before Goal-level write activation.",
    ownerLabel: "Super Admin",
    primaryHref: "/admin",
    primaryLabel: "Open super admin",
    secondaryHref: "/rush-month/loop",
    secondaryLabel: "Run MVP loop",
    safetyNote:
      "Full local visibility is not approval to enable production auth, browser writes, uploads, or external automation.",
    signals: [
      {
        label: "Assignments",
        value: `${data.assignments.length}`,
        note: "Visible in full local oversight.",
      },
      {
        label: "Outbox sends",
        value: "0",
        note: "Automation remains disabled.",
      },
      {
        label: "Campaign",
        value: data.campaign.status,
        note: data.campaign.name,
      },
    ],
  };
}

function countFollowUpAssignments(assignments: Assignment[]): number {
  return assignments.filter(
    (assignment) =>
      assignment.status === "submitted" || assignment.status === "changes_requested",
  ).length;
}
