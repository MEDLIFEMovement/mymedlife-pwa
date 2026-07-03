import { getActorPrimaryRoleLabel } from "@/services/actor-role-display";
import {
  getLaunchLaneLeaderAttendanceHref,
  getLaunchLaneLeaderEventsHref,
  getLaunchLaneLeaderPointsHref,
} from "@/services/events-points-launch-lane";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import type { Assignment } from "@/shared/types/domain";

export type LeaderActionsFocusItem = {
  label: string;
  value: string;
  note: string;
};

export type LeaderActionsFocus = {
  canReadFocus: boolean;
  roleLabel: string;
  title: string;
  summary: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  assignmentCreateTitle: string;
  assignmentCreateSummary: string;
  safetyNote: string;
  items: LeaderActionsFocusItem[];
};

export function getLeaderActionsFocus(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  visibleAssignments: Assignment[],
): LeaderActionsFocus {
  if (getActorSurfaceFamily(actor) !== "leader") {
    return {
      canReadFocus: false,
      roleLabel: getActorPrimaryRoleLabel(actor),
      title: "Leader action focus hidden for this role",
      summary:
        "Only chapter-leader review personas see chapter-event and attendance guidance here.",
      primaryHref: getLaunchLaneLeaderEventsHref(),
      primaryLabel: "Open leader events",
      secondaryHref: getLaunchLaneLeaderPointsHref(),
      secondaryLabel: "See chapter points",
      assignmentCreateTitle: "Assignment creation hidden",
      assignmentCreateSummary:
        "This role should use its own operating route instead of chapter-leader assignment guidance.",
      safetyNote:
        "No assignment save, reminder, Luma write, proof upload, or external automation is enabled.",
      items: [],
    };
  }

  const counts = getActionCounts(visibleAssignments);
  const pendingFollowUp = counts.submitted + counts.changesRequested;
  const activeOwners = counts.inProgress + counts.notStarted;

  if (hasChapterRole(actor, "President / VP")) {
    return {
      canReadFocus: true,
      roleLabel: "President / VP",
      title: "Check attendance and chapter follow-through before points move.",
      summary:
        "Use the leader shell to check attendance posture, owner accountability, role coverage, and points before widening the next chapter push.",
      primaryHref: getLaunchLaneLeaderAttendanceHref(),
      primaryLabel: "Check attendance",
      secondaryHref: getLaunchLaneLeaderPointsHref(),
      secondaryLabel: "See chapter points",
      assignmentCreateTitle: "Assignment creation is an approval checkpoint",
      assignmentCreateSummary:
        "The hidden assignment form stays useful for internal review, but the visible leader lane should stay centered on events, attendance, and points.",
      safetyNote:
        "President / VP review remains read-only. Visible leader work stays in the event-and-points loop while broader assignment and proof modules remain disabled.",
      items: [
        {
          label: "Needs decision",
          value: `${pendingFollowUp}`,
          note: "Submitted or changes-requested actions to resolve before assigning more work.",
        },
        {
          label: "Active owners",
          value: `${activeOwners}`,
          note: "Owners already moving; avoid over-assigning before they are clear.",
        },
        {
          label: "Write posture",
          value: "Locked",
          note: "No browser assignment save is enabled without explicit approval.",
        },
      ],
    };
  }

  if (hasChapterRole(actor, "E-Board Member")) {
    return {
      canReadFocus: true,
      roleLabel: "E-Board Member",
      title: "Use the chapter event lane before opening more work.",
      summary:
        "Use the leader shell to connect owners to real events, check attendance posture, and keep points tied to what actually happened.",
      primaryHref: getLaunchLaneLeaderEventsHref(),
      primaryLabel: "Open leader events",
      secondaryHref: getLaunchLaneLeaderAttendanceHref(),
      secondaryLabel: "Check attendance",
      assignmentCreateTitle: "Assignment creation is execution planning",
      assignmentCreateSummary:
        "The internal assignment form can stay available for review, but the visible E-Board job is to keep events and attendance moving.",
      safetyNote:
        "E-Board execution remains read-only. Visible work stays in the event-and-points lane while broader assignment and proof modules remain disabled.",
      items: [
        {
          label: "Owners to move",
          value: `${activeOwners}`,
          note: "Not-started or in-progress assignments needing direct follow-up.",
        },
        {
          label: "Proof follow-up",
          value: `${pendingFollowUp}`,
          note: "Actions needing clearer proof, testimonial context, or HQ review.",
        },
        {
          label: "Events linked",
          value: `${data.kpiSummary.eventsLinked}`,
          note: "Mock Luma posture only; no Luma write is triggered.",
        },
      ],
    };
  }

  return {
    canReadFocus: true,
    roleLabel: "Chapter Leader",
    title: "Use the leader shell to balance events, attendance, and points.",
    summary:
      "This read-only view helps leaders inspect chapter rhythm without surfacing non-core assignment or proof modules as the main path.",
    primaryHref: getLaunchLaneLeaderEventsHref(),
    primaryLabel: "Open leader events",
    secondaryHref: getLaunchLaneLeaderPointsHref(),
    secondaryLabel: "See chapter points",
    assignmentCreateTitle: "Assignment creation stays gated",
    assignmentCreateSummary:
      "Review owner role, proof requirement, points, KPI, audit, and outbox posture internally without making it the main leader path.",
    safetyNote:
      "Leader assignment saves, reminders, proof uploads, and external automation remain disabled while the visible shell stays simpler.",
    items: [
      {
        label: "Needs follow-up",
        value: `${pendingFollowUp}`,
        note: "Visible actions waiting for a clearer next step.",
      },
      {
        label: "Active owners",
        value: `${activeOwners}`,
        note: "Owners still moving work forward.",
      },
      {
        label: "Write posture",
        value: "Locked",
        note: "No browser assignment save is enabled.",
      },
    ],
  };
}

function getActionCounts(assignments: Assignment[]) {
  return {
    submitted: assignments.filter((assignment) => assignment.status === "submitted")
      .length,
    changesRequested: assignments.filter(
      (assignment) => assignment.status === "changes_requested",
    ).length,
    inProgress: assignments.filter((assignment) => assignment.status === "in_progress")
      .length,
    notStarted: assignments.filter((assignment) => assignment.status === "not_started")
      .length,
  };
}

function hasChapterRole(actor: LocalActorContext, role: string): boolean {
  return actor.chapterRoles.includes(role);
}
