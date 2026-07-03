import { getActorPrimaryRoleLabel } from "@/services/actor-role-display";
import {
  getLaunchLaneLeaderAttendanceHref,
  getLaunchLaneLeaderEventsHref,
  getLaunchLaneLeaderPointsHref,
} from "@/services/events-points-launch-lane";
import type { LeaderEvidenceFollowUpBoard } from "@/services/leader-evidence-follow-up";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";

export type LeaderReviewFocusItem = {
  label: string;
  value: string;
  note: string;
};

export type LeaderReviewFocus = {
  canReadFocus: boolean;
  roleLabel: string;
  title: string;
  summary: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  safetyNote: string;
  items: LeaderReviewFocusItem[];
};

export function getLeaderReviewFocus(
  actor: LocalActorContext,
  board: LeaderEvidenceFollowUpBoard,
): LeaderReviewFocus {
  if (getActorSurfaceFamily(actor) !== "leader" || !board.canReadBoard) {
    return {
      canReadFocus: false,
      roleLabel: getActorPrimaryRoleLabel(actor),
      title: "Leader review focus hidden for this role",
      summary:
        "Only chapter-leader preview personas see proof accountability and owner follow-up guidance here.",
      primaryHref: getLaunchLaneLeaderAttendanceHref(),
      primaryLabel: "Check attendance",
      secondaryHref: getLaunchLaneLeaderEventsHref(),
      secondaryLabel: "Open leader events",
      safetyNote:
        "Proof decisions, proof uploads, public sharing, exports, reminders, and AI summaries remain disabled.",
      items: [],
    };
  }

  if (hasChapterRole(actor, "President / VP")) {
    return {
      canReadFocus: true,
      roleLabel: "President / VP",
      title: "Keep follow-through accountable without opening HQ review lanes.",
      summary:
        "Use attendance posture and chapter points to confirm what is actually complete, what still needs owner follow-through, and whether the chapter is ready for the next event push.",
      primaryHref: getLaunchLaneLeaderAttendanceHref(),
      primaryLabel: "Check attendance",
      secondaryHref: getLaunchLaneLeaderPointsHref(),
      secondaryLabel: "See chapter points",
      safetyNote:
        "President / VP can inspect readiness, but leader proof decisions, uploads, publishing, reminders, and AI writes remain disabled or HQ-only.",
      items: [
        {
          label: "Ready to confirm",
          value: `${board.counts.hqReview}`,
          note: "Visible items that look complete enough for the chapter to stop chasing.",
        },
        {
          label: "Needs context",
          value: `${board.counts.memberFollowUp}`,
          note: "Owners still need clearer story detail before the event loop feels complete.",
        },
        {
          label: "HQ review lane",
          value: "Hidden",
          note: "The visible leader shell stays inside attendance and points while HQ review remains parked.",
        },
      ],
    };
  }

  if (hasChapterRole(actor, "E-Board Member")) {
    return {
      canReadFocus: true,
      roleLabel: "E-Board Member",
      title: "Turn follow-up gaps into the next event and attendance cycle.",
      summary:
        "Use the leader event lane to connect owner follow-up back to a real event, then use attendance to see whether the chapter actually closed the loop.",
      primaryHref: getLaunchLaneLeaderEventsHref(),
      primaryLabel: "Open leader events",
      secondaryHref: getLaunchLaneLeaderAttendanceHref(),
      secondaryLabel: "Check attendance",
      safetyNote:
        "E-Board can coordinate owner follow-up, but proof decisions, uploads, publishing, reminders, and AI writes remain disabled or HQ-only.",
      items: [
        {
          label: "Owners to nudge",
          value: `${board.counts.memberFollowUp}`,
          note: "Assignments needing proof or better testimonial context.",
        },
        {
          label: "Ready to close",
          value: `${board.counts.hqReview}`,
          note: "Visible items that look complete enough to stop slowing the event loop.",
        },
        {
          label: "External sends",
          value: "0",
          note: "No Luma, n8n, SMS, email, warehouse, Power BI, or AI write is enabled.",
        },
      ],
    };
  }

  return {
    canReadFocus: true,
    roleLabel: "Chapter Leader",
    title: "Use attendance and points to separate follow-up from noise.",
    summary:
      "This read-only view helps chapter leaders see what still needs owner context without making proof review the center of the visible launch lane.",
    primaryHref: getLaunchLaneLeaderAttendanceHref(),
    primaryLabel: "Check attendance",
    secondaryHref: getLaunchLaneLeaderPointsHref(),
    secondaryLabel: "See chapter points",
    safetyNote:
      "Chapter leader follow-up remains read-only. HQ sharing decisions and external automation remain disabled.",
    items: [
      {
        label: "Follow-up",
        value: `${board.counts.memberFollowUp}`,
        note: "Visible proof items needing a clearer owner next step.",
      },
      {
        label: "Ready to close",
        value: `${board.counts.hqReview}`,
        note: "Visible items that look complete enough to stop slowing the loop.",
      },
      {
        label: "HQ lane",
        value: "parked",
        note: "Only Admin or Super Admin should use the broader HQ review surfaces.",
      },
    ],
  };
}

function hasChapterRole(actor: LocalActorContext, role: string): boolean {
  return actor.chapterRoles.includes(role);
}
