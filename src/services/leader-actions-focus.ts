import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
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
  if (actor.audience !== "chapter_leader") {
    return {
      canReadFocus: false,
      roleLabel: actor.audienceLabel,
      title: "Leader action focus hidden for this role",
      summary:
        "Only chapter-leader review personas see assignment guardrail and owner follow-up guidance.",
      primaryHref: "/rush-month/actions",
      primaryLabel: "Open actions",
      secondaryHref: "/rush-month/dashboard",
      secondaryLabel: "Open dashboard",
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
      title: "Approve the next assignment only after the guardrails are clear.",
      summary:
        "Use this actions view to check proof decisions, owner accountability, role coverage, points, and KPI fit before allowing more work to be assigned.",
      primaryHref: "/rush-month/review",
      primaryLabel: "Review proof decisions",
      secondaryHref: "/chapter/members",
      secondaryLabel: "Check member roles",
      assignmentCreateTitle: "Assignment creation is an approval checkpoint",
      assignmentCreateSummary:
        "The disabled assignment form is useful for reviewing title, owner role, proof requirement, points, KPI, audit, and outbox posture before any real save is approved.",
      safetyNote:
        "President / VP review remains read-only. Assignment saves, membership approvals, proof decisions, reminders, and role changes remain disabled.",
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
      title: "Follow up with owners before creating more work.",
      summary:
        "Use this actions view to move not-started and in-progress owners, connect them to events, and make proof reminders concrete.",
      primaryHref: "/rush-month/actions",
      primaryLabel: "Review owner list",
      secondaryHref: "/rush-month/events",
      secondaryLabel: "Check events",
      assignmentCreateTitle: "Assignment creation is execution planning",
      assignmentCreateSummary:
        "The disabled assignment form previews the next owner handoff, but the immediate E-Board job is to clear stuck owners and event proof plans.",
      safetyNote:
        "E-Board execution remains read-only. Assignment saves, reminders, Luma writes, proof uploads, and external automation remain disabled.",
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
    title: "Use actions to balance owner follow-up and assignment planning.",
    summary:
      "This read-only view helps leaders inspect owner movement, proof posture, and disabled assignment creation before any browser save is approved.",
    primaryHref: "/rush-month/review",
    primaryLabel: "Open follow-up",
    secondaryHref: "/rush-month/actions",
    secondaryLabel: "Open actions",
    assignmentCreateTitle: "Assignment creation stays gated",
    assignmentCreateSummary:
      "Review owner role, proof requirement, points, KPI, audit, and outbox posture without saving.",
    safetyNote:
      "Leader assignment saves, reminders, proof uploads, and external automation remain disabled.",
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
