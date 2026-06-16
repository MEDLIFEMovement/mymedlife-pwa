import { canSubmitProofForAssignment } from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { canReadAssignment } from "@/services/role-visibility";
import type { Assignment } from "@/shared/types/domain";

export type ActionProofHandoffPhase =
  | "start_first"
  | "prepare_story"
  | "revise_context"
  | "hq_review"
  | "complete";

export type ActionProofHandoffWorkspace = {
  canReadHandoff: boolean;
  canSubmitProof: boolean;
  phase: ActionProofHandoffPhase;
  title: string;
  summary: string;
  roleNote: string;
  storyPrompt: string;
  nextBestAction: {
    href: string;
    label: string;
  };
  checklist: string[];
  futureStructuredEvents: string[];
  disabledOutboxDestinations: string[];
  safetyNotes: string[];
};

export function getActionProofHandoffWorkspace(
  actor: LocalActorContext,
  assignment: Assignment,
): ActionProofHandoffWorkspace {
  if (!canReadAssignment(actor, assignment)) {
    return hiddenHandoffWorkspace();
  }

  const phase = getActionProofHandoffPhase(assignment);
  const canSubmitProof = canSubmitProofForAssignment(actor, assignment);

  return {
    canReadHandoff: true,
    canSubmitProof,
    phase,
    ...getPhaseCopy(phase, assignment),
    roleNote: getRoleNote(actor, canSubmitProof),
    nextBestAction: getNextBestAction(phase, assignment, canSubmitProof),
    checklist: getChecklist(assignment),
    futureStructuredEvents: [
      "proof_handoff_opened",
      "evidence_submitted",
      "proof_consent_recorded",
      "hq_proof_review_requested",
      "automation_outbox_recorded",
      "audit_log_recorded",
    ],
    disabledOutboxDestinations: [
      "n8n proof reminder disabled",
      "warehouse proof export disabled",
      "Power BI proof refresh disabled",
      "AI proof summary disabled",
      "public proof publishing disabled",
    ],
    safetyNotes: [
      "This handoff explains the proof step; it does not save proof by itself.",
      "Bridge videos, testimonials, links, and notes still need approved storage and HQ review before broad sharing.",
      "No HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI write runs from this panel.",
    ],
  };
}

function getActionProofHandoffPhase(assignment: Assignment): ActionProofHandoffPhase {
  switch (assignment.status) {
    case "not_started":
      return "start_first";
    case "changes_requested":
      return "revise_context";
    case "submitted":
      return "hq_review";
    case "approved":
      return "complete";
    case "in_progress":
      return "prepare_story";
  }
}

function getPhaseCopy(
  phase: ActionProofHandoffPhase,
  assignment: Assignment,
): Pick<ActionProofHandoffWorkspace, "summary" | "storyPrompt" | "title"> {
  switch (phase) {
    case "start_first":
      return {
        title: "Start the action, then capture what happened.",
        summary:
          "Proof should come after real action. First complete or support the assigned work, then come back with a testimonial, link, or note.",
        storyPrompt: `After this action starts, explain what happened during "${assignment.title}" and why another student should care.`,
      };
    case "revise_context":
      return {
        title: "Tighten the story before HQ reviews it.",
        summary:
          "This action needs clearer proof context. The useful next step is not more automation; it is a better testimonial or bridge-video summary.",
        storyPrompt: `Clarify what happened, who was affected, and what hesitation this proof answers for "${assignment.title}".`,
      };
    case "hq_review":
      return {
        title: "Proof is in the HQ review lane.",
        summary:
          "The student-facing work is submitted. MEDLIFE HQ still decides whether this proof should stay internal, needs changes, or can be shared later.",
        storyPrompt:
          "If HQ asks for more context, add the missing story detail instead of creating a duplicate proof item.",
      };
    case "complete":
      return {
        title: "Use the approved action as learning, not a public publish button.",
        summary:
          "The action is complete locally. Broad proof sharing still requires HQ posture, consent, and a separate publishing workflow.",
        storyPrompt:
          "Capture what made this action repeatable so another chapter can learn from it later.",
      };
    case "prepare_story":
    default:
      return {
        title: "Turn this action into a useful testimonial.",
        summary:
          "The next useful step is to describe what happened, what hesitation it answers, and why it could help another student take action.",
        storyPrompt: `Use the proof requirement as the base: ${assignment.evidenceRequired}`,
      };
  }
}

function getRoleNote(actor: LocalActorContext, canSubmitProof: boolean): string {
  if (canSubmitProof) {
    if (actor.chapterRoles.includes("Action Committee Chair")) {
      return "As an Action Committee Chair, make sure the proof explains the event result and the student story behind it.";
    }

    if (actor.chapterRoles.includes("Action Committee Member")) {
      return "As an Action Committee Member, help capture the story while it is still fresh.";
    }

    return "You can prepare the proof/testimonial context for this action in the local preview.";
  }

  switch (actor.audience) {
    case "coach":
      return "Coaches can read this handoff as a chapter-health signal, but they should not submit student proof.";
    case "admin":
      return "Admins can inspect proof posture and HQ review needs, but this panel does not publish proof.";
    case "super_admin":
      return "Super Admin can inspect the full local handoff while keeping writes and external sends disabled.";
    case "ds_admin":
      return "DS Admin should inspect integration safety only, not student proof truth.";
    case "chapter_leader":
    case "chapter_member":
      return "This role can read the handoff, but cannot submit proof for this specific assignment.";
  }
}

function getNextBestAction(
  phase: ActionProofHandoffPhase,
  assignment: Assignment,
  canSubmitProof: boolean,
): { href: string; label: string } {
  if (phase === "start_first") {
    return {
      href: `/rush-month/actions/${assignment.id}`,
      label: "Start action first",
    };
  }

  if (phase === "hq_review") {
    return {
      href: "/rush-month/review",
      label: "Open HQ review posture",
    };
  }

  if (phase === "complete") {
    return {
      href: "/proof-library",
      label: "Open proof library",
    };
  }

  if (canSubmitProof) {
    return {
      href: "/proof-library/upload",
      label: "Preview proof intake",
    };
  }

  return {
    href: "/proof-library",
    label: "Read proof posture",
  };
}

function getChecklist(assignment: Assignment): string[] {
  return [
    "What happened, in plain English?",
    "Which student hesitation or concern does this proof answer?",
    `What evidence backs it up? ${assignment.evidenceRequired}`,
    "Does the student agree MEDLIFE HQ can review it?",
    "Should this stay internal, need changes, or be considered for broader sharing later?",
  ];
}

function hiddenHandoffWorkspace(): ActionProofHandoffWorkspace {
  return {
    canReadHandoff: false,
    canSubmitProof: false,
    phase: "start_first",
    title: "Proof handoff hidden for this role",
    summary:
      "This actor cannot read the assignment, so the proof handoff should stay hidden.",
    roleNote: "Use the correct chapter-scoped role to inspect student proof context.",
    storyPrompt: "",
    nextBestAction: {
      href: "/rush-month/actions",
      label: "Back to visible actions",
    },
    checklist: [],
    futureStructuredEvents: [],
    disabledOutboxDestinations: [],
    safetyNotes: [],
  };
}
