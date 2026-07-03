import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getLaunchLaneHomeHref,
  getLaunchLaneLeaderAttendanceHref,
  getLaunchLaneLeaderEventsHref,
  getLaunchLaneLeaderPointsHref,
  getLaunchLaneMemberEventsHref,
  getLaunchLaneMemberPointsHref,
  getLaunchLaneStaffPointsHref,
} from "@/services/events-points-launch-lane";
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
  const upcomingEventCount = data.chapterEventRows.length;

  return {
    eyebrow: "Your next move",
    title:
      upcomingEventCount > 0
        ? "Open the next chapter event"
        : "Check your chapter events",
    summary:
      "Events are the front door right now. RSVP, show up, and let confirmed attendance move your points.",
    ownerLabel: "General Member",
    primaryHref: getLaunchLaneMemberEventsHref("home"),
    primaryLabel: "Open events",
    secondaryHref: getLaunchLaneMemberPointsHref("points"),
    secondaryLabel: "See my points",
    safetyNote:
      "This stays read-only here. RSVP, attendance, and points can stay visible without opening broader proof or assignment modules.",
    signals: [
      {
        label: "Upcoming events",
        value: `${upcomingEventCount}`,
        note: "Chapter events visible in the current launch lane.",
      },
      {
        label: "Points earned",
        value: `${data.pointsSummary.earned}`,
        note: "Friendly recognition from the local mock points summary.",
      },
      {
        label: "Loop focus",
        value: "RSVP -> Attend",
        note: "Points move from confirmed attendance, not from browsing alone.",
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
        ? "Check attendance and chapter follow-through"
        : "Check event readiness before opening more work",
      summary: shouldReview
        ? "Use attendance, member follow-through, and chapter visibility before points or chapter momentum move."
        : "Use event readiness, role coverage, and attendance posture before widening the next chapter push.",
      ownerLabel: "President / VP",
      primaryHref: shouldReview
        ? getLaunchLaneLeaderAttendanceHref()
        : getLaunchLaneLeaderEventsHref(),
      primaryLabel: shouldReview ? "Check attendance" : "Open leader events",
      secondaryHref: getLaunchLaneLeaderPointsHref(),
      secondaryLabel: "See chapter points",
      safetyNote:
        "President / VP review remains read-only. Attendance, points, and chapter event posture stay visible without opening broader assignment or proof modules.",
      signals: [
        {
          label: "Needs follow-through",
          value: `${pendingFollowUp}`,
          note: "Submitted or changes-requested items still need chapter attention.",
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
        ? "Move the next chapter event forward"
        : "Prepare the next chapter event push",
      summary: activeOwners > 0
        ? "Use the event lane to see who is showing up, what still needs follow-up, and where points can move next."
        : "Keep the chapter moving by tightening the next event, attendance plan, and points story.",
      ownerLabel: "E-Board Member",
      primaryHref: getLaunchLaneLeaderEventsHref(),
      primaryLabel: "Open leader events",
      secondaryHref: getLaunchLaneLeaderAttendanceHref(),
      secondaryLabel: "Check attendance",
      safetyNote:
        "E-Board execution stays read-only here. Event, attendance, and points posture stay visible while broader assignment and proof modules remain tucked away.",
      signals: [
        {
          label: "Events linked",
          value: `${data.kpiSummary.eventsLinked}`,
          note: "Mock Luma posture only.",
        },
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
      ],
    };
  }

  return {
    eyebrow: "Leader operating priority",
    title: shouldReview
      ? "Check attendance and chapter follow-through"
      : "Keep the next chapter event moving",
    summary: shouldReview
      ? "Use attendance and event follow-through to confirm the chapter can trust the next points move."
      : "Keep the chapter rhythm simple: events, attendance, and points should tell the same story.",
    ownerLabel: "Chapter Leader / E-Board",
    primaryHref: getLaunchLaneLeaderEventsHref(),
    primaryLabel: "Open leader events",
    secondaryHref: getLaunchLaneLeaderPointsHref(),
    secondaryLabel: "See chapter points",
    safetyNote:
      "Leader saves and reminders are still disabled. Keep the visible story centered on event readiness, attendance, and points.",
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
      "Use chapter event health, attendance movement, risk flags, and points direction before logging advance, hold, or intervene later.",
    ownerLabel: "Coach",
    primaryHref: getLaunchLaneHomeHref("coach"),
    primaryLabel: "Open portfolio chapters",
    secondaryHref: getLaunchLaneStaffPointsHref(),
    secondaryLabel: "See org points",
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
    title: "Review chapter event health before widening the pilot",
    summary:
      "Staff should be able to see chapter events, attendance movement, and points clearly before the pilot widens. Broader proof sharing and external syncs stay off.",
    ownerLabel: "Staff",
    primaryHref: getLaunchLaneHomeHref("staff"),
    primaryLabel: "Open chapter view",
    secondaryHref: "/admin",
    secondaryLabel: "Open admin center",
    safetyNote:
      "Public proof sharing and real HubSpot/Luma/n8n writes remain disabled while the visible staff lane stays focused on events and points.",
    signals: [
      {
        label: "Visible events",
        value: `${data.chapterEventRows.length}`,
        note: "Chapter event rows visible in the current pilot lane.",
      },
      {
        label: "Points earned",
        value: `${data.pointsSummary.earned}`,
        note: "Local readback only; broader org sync stays off.",
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
