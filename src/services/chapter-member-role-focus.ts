import { getActorPrimaryRoleLabel } from "@/services/actor-role-display";
import type { ChapterMembershipWorkspace } from "@/services/chapter-membership-workspace";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";

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
      roleLabel: getActorPrimaryRoleLabel(actor),
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
      title: "Keep chapter coverage clear before the next growth push.",
      summary:
        "Use this roster to check pending joins, thin leadership coverage, and chapter access decisions before the chapter takes on more Rush Month work.",
      primaryHref: "/chapter/members",
      primaryLabel: "Review role coverage",
      secondaryHref: "/rush-month/review",
      secondaryLabel: "Check proof accountability",
      safetyNote:
        "President / VP can inspect join readiness, but roster approvals, role changes, committee moves, member deactivation, reminders, and external sends remain paused.",
      items: [
        {
          label: "Join requests",
          value: `${workspace.counts.pendingRequests}`,
          note: "Visible for planning only while chapter access changes stay gated.",
        },
        {
          label: "Thin roles",
          value: `${thinCoverageCount}`,
          note: "Roles below the recommended chapter coverage target.",
        },
        {
          label: "Open approvals",
          value: `${workspace.counts.enabledControls}`,
          note: "No roster-changing approval is active yet.",
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
    title: "Use the roster to separate coverage needs from held approvals.",
    summary:
      "This read-only workspace helps chapter leaders inspect role coverage, member follow-up, and held roster actions without changing access.",
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

  return getActorSurfaceFamily(actor) === "leader";
}

function hasChapterRole(actor: LocalActorContext, role: string): boolean {
  return actor.chapterRoles.includes(role);
}
