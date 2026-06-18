import type { ChapterMembershipWorkspace } from "@/services/chapter-membership-workspace";
import type { LocalActorContext } from "@/services/local-actor-context";

export type ChapterMemberRoleFocusItem = {
  label: string;
  value: string;
  note: string;
};

export type ChapterMemberRoleFocus = {
  canReadFocus: boolean;
  roleLabel: string;
  title: string;
  summary: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  safetyNote: string;
  items: ChapterMemberRoleFocusItem[];
};

export function getChapterMemberRoleFocus(
  actor: LocalActorContext,
  workspace: ChapterMembershipWorkspace,
): ChapterMemberRoleFocus {
  if (!canReadRoleFocus(actor, workspace)) {
    return {
      canReadFocus: false,
      roleLabel: actor.audienceLabel,
      title: "Member role focus hidden for this role",
      summary:
        "Only chapter-leader preview personas see role coverage and execution guidance here.",
      primaryHref: "/chapter/members",
      primaryLabel: "Open members",
      secondaryHref: "/rush-month/dashboard",
      secondaryLabel: "Open dashboard",
      safetyNote:
        "Join approvals, role changes, committee moves, member deactivation, reminders, and external writes remain disabled.",
      items: [],
    };
  }

  const thinCoverageCount = workspace.roleCoverage.filter((item) => {
    return item.status === "thin" || item.status === "missing";
  }).length;

  if (hasChapterRole(actor, "President / VP")) {
    return {
      canReadFocus: true,
      roleLabel: "President / VP",
      title: "Keep role coverage clear before membership approvals move.",
      summary:
        "Use this roster to check pending joins, thin leadership coverage, and permission-changing controls before the chapter takes on more Rush Month work.",
      primaryHref: "/chapter/members",
      primaryLabel: "Review role coverage",
      secondaryHref: "/rush-month/review",
      secondaryLabel: "Check proof accountability",
      safetyNote:
        "President / VP can inspect membership readiness, but join approvals, role changes, committee moves, member deactivation, reminders, and external writes remain disabled.",
      items: [
        {
          label: "Join requests",
          value: `${workspace.counts.pendingRequests}`,
          note: "Visible for readiness review only; approval writes are still locked.",
        },
        {
          label: "Thin roles",
          value: `${thinCoverageCount}`,
          note: "Roles below the recommended local review minimum.",
        },
        {
          label: "Enabled controls",
          value: `${workspace.counts.enabledControls}`,
          note: "No membership or role mutation control is active.",
        },
      ],
    };
  }

  if (hasChapterRole(actor, "E-Board Member")) {
    return {
      canReadFocus: true,
      roleLabel: "E-Board Member",
      title: "Turn roster gaps into committee and owner follow-up.",
      summary:
        "Use this roster to see who has open work, who needs proof follow-up, and which committee lanes need a real owner before the next event push.",
      primaryHref: "/rush-month/actions",
      primaryLabel: "Move open work",
      secondaryHref: "/action-committees",
      secondaryLabel: "Check committee lanes",
      safetyNote:
        "E-Board can coordinate follow-up, but join approvals, role changes, committee moves, member deactivation, reminders, and external writes remain disabled.",
      items: [
        {
          label: "Open actions",
          value: `${workspace.counts.openAssignments}`,
          note: "Member-level work that needs owner follow-up.",
        },
        {
          label: "Proof follow-ups",
          value: `${workspace.counts.proofFollowUps}`,
          note: "Members needing proof or clearer testimonial context.",
        },
        {
          label: "Committee members",
          value: `${workspace.counts.committeeMembers}`,
          note: "Action committee capacity visible for execution planning.",
        },
      ],
    };
  }

  return {
    canReadFocus: true,
    roleLabel: "Chapter Leader",
    title: "Use the roster to separate coverage needs from locked permissions.",
    summary:
      "This read-only workspace helps chapter leaders inspect role coverage, member follow-up, and disabled membership controls without changing access.",
    primaryHref: "/chapter/members",
    primaryLabel: "Review roster",
    secondaryHref: "/rush-month/actions",
    secondaryLabel: "Open actions",
    safetyNote:
      "Chapter leader membership work remains read-only. Permission-changing controls and external automation stay disabled.",
    items: [
      {
        label: "Join requests",
        value: `${workspace.counts.pendingRequests}`,
        note: "Requests visible for planning only.",
      },
      {
        label: "Open actions",
        value: `${workspace.counts.openAssignments}`,
        note: "Chapter work that still needs follow-up.",
      },
      {
        label: "Enabled controls",
        value: `${workspace.counts.enabledControls}`,
        note: "No membership mutation is enabled.",
      },
    ],
  };
}

function canReadRoleFocus(
  actor: LocalActorContext,
  workspace: ChapterMembershipWorkspace,
) {
  if (!workspace.canReadWorkspace) {
    return false;
  }

  if (actor.audience === "chapter_leader") {
    return true;
  }

  return actor.chapterRoles.includes("E-Board Member");
}
function hasChapterRole(actor: LocalActorContext, role: string): boolean {
  return actor.chapterRoles.includes(role);
}
