import { assignments, evidenceItems } from "@/data/mock-rush-month";
import type { LocalActorContext } from "@/services/local-actor-context";
import { canMakeHqSharingDecision } from "@/services/local-action-contracts";
import {
  canReadAssignment,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";

export type LeaderEvidenceFollowUpLane =
  | "member_follow_up"
  | "hq_review"
  | "not_ready"
  | "closed_internal";

export type LeaderEvidenceFollowUpTone = "blocked" | "info" | "ready" | "warning";

export type LeaderEvidenceFollowUpRow = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  ownerLabel: string;
  dueLabel: string;
  evidenceId: string | null;
  evidenceSummary: string;
  proofTypeLabel: string;
  lane: LeaderEvidenceFollowUpLane;
  tone: LeaderEvidenceFollowUpTone;
  statusLabel: string;
  plainEnglishStatus: string;
  leaderNextStep: string;
  hqBoundary: string;
  canLeaderNudge: boolean;
  canHqDecide: boolean;
  externalPosture: "disabled";
};

export type LeaderEvidenceFollowUpBoard = {
  canReadBoard: boolean;
  canHqDecide: boolean;
  title: string;
  summary: string;
  rows: LeaderEvidenceFollowUpRow[];
  counts: {
    total: number;
    memberFollowUp: number;
    hqReview: number;
    notReady: number;
    closedInternal: number;
    leaderActionsEnabled: 0;
    hqSharingWritesEnabled: 0;
    externalExportsEnabled: 0;
  };
  futureStructuredEvents: string[];
  disabledOutboxDestinations: string[];
  safetyNotes: string[];
};

export function getLeaderEvidenceFollowUpBoard(
  actor: LocalActorContext,
  allAssignments: Assignment[] = assignments,
  allEvidence: EvidenceItem[] = evidenceItems,
): LeaderEvidenceFollowUpBoard {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "member" || surfaceFamily === "ds_admin") {
    return hiddenLeaderEvidenceFollowUpBoard(surfaceFamily);
  }

  const rows = allAssignments
    .filter((assignment) => canReadAssignment(actor, assignment))
    .map((assignment) =>
      toFollowUpRow(
        actor,
        surfaceFamily,
        assignment,
        allEvidence.find((item) => item.assignmentId === assignment.id),
      ),
    );

  return {
    canReadBoard: true,
    canHqDecide: canMakeHqSharingDecision(actor),
    title: getBoardTitle(surfaceFamily),
    summary:
      "This separates chapter follow-up from HQ sharing decisions. Leaders can see who needs a nudge or clearer story context, but broad proof-sharing remains HQ-controlled.",
    rows,
    counts: {
      total: rows.length,
      memberFollowUp: rows.filter((row) => row.lane === "member_follow_up").length,
      hqReview: rows.filter((row) => row.lane === "hq_review").length,
      notReady: rows.filter((row) => row.lane === "not_ready").length,
      closedInternal: rows.filter((row) => row.lane === "closed_internal").length,
      leaderActionsEnabled: 0,
      hqSharingWritesEnabled: 0,
      externalExportsEnabled: 0,
    },
    futureStructuredEvents: [
      "leader_evidence_follow_up_viewed",
      "evidence_submitted",
      "evidence_changes_requested",
      "hq_proof_review_requested",
      "evidence_approved_for_internal_learning",
      "automation_outbox_recorded",
      "audit_log_recorded",
    ],
    disabledOutboxDestinations: [
      "n8n member nudge disabled",
      "HQ proof sharing write disabled",
      "warehouse proof export disabled",
      "Power BI proof refresh disabled",
      "AI proof summary disabled",
    ],
    safetyNotes: [
      "Leaders can coach evidence follow-up, but HQ owns broad sharing decisions.",
      "This board does not send nudges, publish proof, or export proof.",
      "No HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI write runs from this board.",
    ],
  };
}

function toFollowUpRow(
  actor: LocalActorContext,
  surfaceFamily: ActorSurfaceFamily,
  assignment: Assignment,
  evidence: EvidenceItem | undefined,
): LeaderEvidenceFollowUpRow {
  const lane = getFollowUpLane(assignment, evidence);
  const statusCopy = getLaneCopy(lane, assignment, evidence);

  return {
    id: evidence?.id ?? `leader-proof-follow-up-${assignment.id}`,
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    ownerLabel: assignment.ownerRole,
    dueLabel: assignment.dueLabel,
    evidenceId: evidence?.id ?? null,
    evidenceSummary: evidence?.summary ?? "No proof or testimonial has been submitted yet.",
    proofTypeLabel: evidence?.evidenceType.replaceAll("_", " ") ?? assignment.evidenceRequired,
    lane,
    ...statusCopy,
    canLeaderNudge: surfaceFamily === "leader" && lane === "member_follow_up",
    canHqDecide: canMakeHqSharingDecision(actor) && lane === "hq_review",
    externalPosture: "disabled",
  };
}

function getFollowUpLane(
  assignment: Assignment,
  evidence: EvidenceItem | undefined,
): LeaderEvidenceFollowUpLane {
  if (evidence?.status === "approved" || assignment.status === "approved") {
    return "closed_internal";
  }

  if (evidence?.status === "changes_requested" || assignment.status === "changes_requested") {
    return "member_follow_up";
  }

  if (evidence?.status === "pending_review" || assignment.status === "submitted") {
    return "hq_review";
  }

  if (assignment.status === "not_started") {
    return "not_ready";
  }

  return "member_follow_up";
}

function getLaneCopy(
  lane: LeaderEvidenceFollowUpLane,
  assignment: Assignment,
  evidence: EvidenceItem | undefined,
): Pick<
  LeaderEvidenceFollowUpRow,
  "hqBoundary" | "leaderNextStep" | "plainEnglishStatus" | "statusLabel" | "tone"
> {
  switch (lane) {
    case "member_follow_up":
      return {
        statusLabel: evidence ? "Needs clearer proof" : "Proof needed",
        tone: evidence ? "warning" : "ready",
        plainEnglishStatus: evidence
          ? "Proof exists, but the story needs more context before HQ can learn from it."
          : "The action is active, but no proof or testimonial has been submitted yet.",
        leaderNextStep: evidence
          ? "Ask the owner to add what happened, who it helped, and what concern the proof answers."
          : `Nudge the owner to submit: ${assignment.evidenceRequired}`,
        hqBoundary:
          "Leader follow-up can improve the submission; HQ still decides whether it should be shared broadly.",
      };
    case "hq_review":
      return {
        statusLabel: "Waiting for HQ review",
        tone: "info",
        plainEnglishStatus:
          "Proof has been submitted locally and is ready for HQ posture review.",
        leaderNextStep:
          "No leader approval is needed. Add context only if HQ asks for it.",
        hqBoundary:
          "Admin or Super Admin owns the broad sharing decision; chapter leaders should not publish it.",
      };
    case "not_ready":
      return {
        statusLabel: "Action not ready",
        tone: "blocked",
        plainEnglishStatus:
          "This action has not started, so proof should not be requested yet.",
        leaderNextStep:
          "Help the owner start the action before asking for a testimonial or proof.",
        hqBoundary:
          "There is no HQ proof-sharing decision until action happens and proof is submitted.",
      };
    case "closed_internal":
      return {
        statusLabel: "Closed for now",
        tone: "info",
        plainEnglishStatus:
          "This item is complete for local learning. It is not automatically public.",
        leaderNextStep:
          "Use this as chapter learning unless HQ asks for a broader proof-sharing packet.",
        hqBoundary:
          "Approved/internal learning is separate from public publishing or cross-chapter sharing.",
      };
  }
}

function getBoardTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "leader":
      return "Leader evidence follow-up";
    case "coach":
      return "Evidence follow-up as a coaching signal";
    case "staff":
      return "HQ evidence follow-up view";
    case "super_admin":
      return "Full local evidence follow-up view";
    case "member":
    case "ds_admin":
      return "Evidence follow-up hidden";
  }
}

function hiddenLeaderEvidenceFollowUpBoard(
  surfaceFamily: ActorSurfaceFamily,
): LeaderEvidenceFollowUpBoard {
  const isDsAdmin = surfaceFamily === "ds_admin";

  return {
    canReadBoard: false,
    canHqDecide: false,
    title: "Evidence follow-up hidden",
    summary: isDsAdmin
      ? "DS Admin can inspect disabled integration posture, but should not read student proof follow-up."
      : "Members see their own proof status, not the leader follow-up board.",
    rows: [],
    counts: {
      total: 0,
      memberFollowUp: 0,
      hqReview: 0,
      notReady: 0,
      closedInternal: 0,
      leaderActionsEnabled: 0,
      hqSharingWritesEnabled: 0,
      externalExportsEnabled: 0,
    },
    futureStructuredEvents: [],
    disabledOutboxDestinations: [],
    safetyNotes: [],
  };
}
