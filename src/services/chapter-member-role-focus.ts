import { getActorPrimaryRoleLabel } from "@/services/actor-role-display";
import {
  getLaunchLaneLeaderAttendanceHref,
  getLaunchLaneLeaderEventsHref,
  getLaunchLaneLeaderPointsHref,
} from "@/services/events-points-launch-lane";
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
      primaryHref: getLaunchLaneLeaderAttendanceHref(),
      primaryLabel: "Check attendance",
      secondaryHref: getLaunchLaneLeaderEventsHref(),
      secondaryLabel: "Open leader events",
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
      title: "Keep chapter coverage visible through attendance and follow-through.",
      summary:
        "Use attendance posture, open work, and thin leadership signals before the chapter takes on more Rush Month activity.",
      primaryHref: getLaunchLaneLeaderAttendanceHref(),
      primaryLabel: "Check attendance",
      secondaryHref: getLaunchLaneLeaderPointsHref(),
      secondaryLabel: "Check chapter points",
      safetyNote:
        "President / VP can inspect chapter coverage, but roster approvals, role changes, committee moves, member deactivation, reminders, and external sends remain paused.",
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
      primaryHref: getLaunchLaneLeaderEventsHref(),
      primaryLabel: "Open chapter events",
      secondaryHref: getLaunchLaneLeaderAttendanceHref(),
      secondaryLabel: "Check attendance",
      safetyNote:
        "E-Board can coordinate follow-up, but the visible route should stay focused on events, attendance, and points while approvals and external writes remain disabled.",
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
    title: "Use attendance and follow-through to separate coverage needs from held approvals.",
    summary:
      "This read-only workspace helps chapter leaders inspect member follow-up and coverage signals without turning roster changes into the main visible lane.",
    primaryHref: getLaunchLaneLeaderAttendanceHref(),
    primaryLabel: "Check attendance",
    secondaryHref: getLaunchLaneLeaderPointsHref(),
    secondaryLabel: "Check chapter points",
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
