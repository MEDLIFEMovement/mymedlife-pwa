import type { LeaderEvidenceFollowUpBoard } from "@/services/leader-evidence-follow-up";
import type { LocalActorContext } from "@/services/local-actor-context";

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
  if (actor.audience !== "chapter_leader" || !board.canReadBoard) {
    return {
      canReadFocus: false,
      roleLabel: actor.audienceLabel,
      title: "Leader review focus hidden for this role",
      summary:
        "Only chapter-leader preview personas see proof accountability and owner follow-up guidance here.",
      primaryHref: "/rush-month/review",
      primaryLabel: "Open proof review",
      secondaryHref: "/rush-month/dashboard",
      secondaryLabel: "Open dashboard",
      safetyNote:
        "Proof decisions, proof uploads, public sharing, exports, reminders, and AI summaries remain disabled.",
      items: [],
    };
  }

  if (hasChapterRole(actor, "President / VP")) {
    return {
      canReadFocus: true,
      roleLabel: "President / VP",
      title: "Keep proof accountable without taking over HQ sharing.",
      summary:
        "Use this queue to confirm what is ready for HQ, what still needs owner context, and whether the chapter is accountable before more proof is requested.",
      primaryHref: "/rush-month/review",
      primaryLabel: "Review proof posture",
      secondaryHref: "/chapter/members",
      secondaryLabel: "Check owner coverage",
      safetyNote:
        "President / VP can inspect readiness, but approve, reject, request-changes, upload, publish, export, reminder, and AI writes remain disabled or HQ-only.",
      items: [
        {
          label: "HQ-ready",
          value: `${board.counts.hqReview}`,
          note: "Submitted proof waiting on HQ posture, not chapter publishing.",
        },
        {
          label: "Needs context",
          value: `${board.counts.memberFollowUp}`,
          note: "Owners need clearer story detail before HQ can learn from it.",
        },
        {
          label: "Decision authority",
          value: "HQ only",
          note: "Chapter leaders do not approve broad sharing from this MVP route.",
        },
      ],
    };
  }

  if (hasChapterRole(actor, "E-Board Member")) {
    return {
      canReadFocus: true,
      roleLabel: "E-Board Member",
      title: "Turn proof gaps into owner follow-up before review stalls.",
      summary:
        "Use this queue to find owners who need a concrete proof reminder, connect the ask back to events, and keep HQ review from waiting on missing context.",
      primaryHref: "/rush-month/actions",
      primaryLabel: "Follow up with owners",
      secondaryHref: "/rush-month/events",
      secondaryLabel: "Check event proof",
      safetyNote:
        "E-Board can coordinate owner follow-up, but approve, reject, request-changes, upload, publish, export, reminder, and AI writes remain disabled or HQ-only.",
      items: [
        {
          label: "Owners to nudge",
          value: `${board.counts.memberFollowUp}`,
          note: "Assignments needing proof or better testimonial context.",
        },
        {
          label: "Ready for HQ",
          value: `${board.counts.hqReview}`,
          note: "Submitted proof that should not be changed by chapter operators.",
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
    title: "Use proof review to separate follow-up from HQ decisions.",
    summary:
      "This queue helps chapter leaders see what needs owner context and what is ready for HQ review without granting sharing authority.",
    primaryHref: "/rush-month/review",
    primaryLabel: "Review proof queue",
    secondaryHref: "/rush-month/actions",
    secondaryLabel: "Open actions",
    safetyNote:
      "Chapter leader proof follow-up remains read-only. HQ sharing decisions and external automation remain disabled.",
    items: [
      {
        label: "Follow-up",
        value: `${board.counts.memberFollowUp}`,
        note: "Visible proof items needing a clearer owner next step.",
      },
      {
        label: "HQ review",
        value: `${board.counts.hqReview}`,
        note: "Submitted proof waiting for HQ posture.",
      },
      {
        label: "Decision authority",
        value: "restricted",
        note: "Only Admin or Super Admin can preview HQ sharing decisions.",
      },
    ],
  };
}

function hasChapterRole(actor: LocalActorContext, role: string): boolean {
  return actor.chapterRoles.includes(role);
}
