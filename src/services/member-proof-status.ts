import { assignments, evidenceItems } from "@/data/mock-rush-month";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  canReadAssignment,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";

export type MemberProofStatusKey =
  | "action_not_ready"
  | "proof_needed"
  | "waiting_hq_review"
  | "changes_requested"
  | "approved_internal";

export type MemberProofStatusTone = "blocked" | "info" | "ready" | "warning";

export type MemberProofStatusRow = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  proofTypeLabel: string;
  status: MemberProofStatusKey;
  statusLabel: string;
  tone: MemberProofStatusTone;
  plainEnglishStatus: string;
  nextStep: string;
  ownerLabel: string;
  canOpenAction: boolean;
  externalPosture: "disabled";
};

export type MemberProofStatusWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  rows: MemberProofStatusRow[];
  counts: {
    total: number;
    actionNotReady: number;
    proofNeeded: number;
    waitingHqReview: number;
    changesRequested: number;
    approvedInternal: number;
    publicPublishesEnabled: 0;
    externalExportsEnabled: 0;
  };
  futureStructuredEvents: string[];
  disabledOutboxDestinations: string[];
  safetyNotes: string[];
};

export function getMemberProofStatusWorkspace(
  actor: LocalActorContext,
  allAssignments: Assignment[] = assignments,
  allEvidence: EvidenceItem[] = evidenceItems,
): MemberProofStatusWorkspace {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "ds_admin") {
    return hiddenProofStatusWorkspace();
  }

  const visibleAssignments = allAssignments.filter((assignment) =>
    canReadAssignment(actor, assignment),
  );
  const rows = visibleAssignments.map((assignment) =>
    toProofStatusRow(assignment, allEvidence.find((item) => item.assignmentId === assignment.id)),
  );

  return {
    canReadWorkspace: true,
    title: getWorkspaceTitle(surfaceFamily),
    summary:
      "This summarizes what happens after proof is submitted. It shows whether something is ready, needs more context, or is being kept for internal learning.",
    rows,
    counts: {
      total: rows.length,
      actionNotReady: rows.filter((row) => row.status === "action_not_ready").length,
      proofNeeded: rows.filter((row) => row.status === "proof_needed").length,
      waitingHqReview: rows.filter((row) => row.status === "waiting_hq_review").length,
      changesRequested: rows.filter((row) => row.status === "changes_requested").length,
      approvedInternal: rows.filter((row) => row.status === "approved_internal").length,
      publicPublishesEnabled: 0,
      externalExportsEnabled: 0,
    },
    futureStructuredEvents: [
      "evidence_submitted",
      "proof_status_viewed",
      "hq_proof_review_requested",
      "evidence_changes_requested",
      "evidence_approved_for_internal_learning",
      "automation_outbox_recorded",
      "audit_log_recorded",
    ],
    disabledOutboxDestinations: [
      "n8n proof reminder disabled",
      "public proof publishing disabled",
      "warehouse proof export disabled",
      "Power BI proof refresh disabled",
      "AI proof summary disabled",
    ],
    safetyNotes: [
      "This page does not publish proof publicly.",
      "HQ decides whether proof stays internal, needs changes, or becomes a future sharing candidate.",
      "No HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI write runs from this status summary.",
    ],
  };
}

function toProofStatusRow(
  assignment: Assignment,
  evidence: EvidenceItem | undefined,
): MemberProofStatusRow {
  const status = getStatus(assignment, evidence);

  return {
    id: evidence?.id ?? `proof-status-${assignment.id}`,
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    proofTypeLabel: evidence?.evidenceType.replaceAll("_", " ") ?? assignment.evidenceRequired,
    status,
    ...getStatusCopy(status, assignment),
    ownerLabel: assignment.ownerRole,
    canOpenAction: true,
    externalPosture: "disabled",
  };
}

function getStatus(
  assignment: Assignment,
  evidence: EvidenceItem | undefined,
): MemberProofStatusKey {
  if (evidence?.status === "approved") {
    return "approved_internal";
  }

  if (evidence?.status === "changes_requested" || assignment.status === "changes_requested") {
    return "changes_requested";
  }

  if (evidence?.status === "pending_review" || assignment.status === "submitted") {
    return "waiting_hq_review";
  }

  if (assignment.status === "not_started") {
    return "action_not_ready";
  }

  return "proof_needed";
}

function getStatusCopy(
  status: MemberProofStatusKey,
  assignment: Assignment,
): Pick<
  MemberProofStatusRow,
  "nextStep" | "plainEnglishStatus" | "statusLabel" | "tone"
> {
  switch (status) {
    case "action_not_ready":
      return {
        statusLabel: "Start action first",
        tone: "blocked",
        plainEnglishStatus:
          "Proof should come after real action. This assignment has not started yet.",
        nextStep: "Open the action, understand the task, and start it before preparing proof.",
      };
    case "proof_needed":
      return {
        statusLabel: "Proof needed",
        tone: "ready",
        plainEnglishStatus:
          "The action is active. The useful next step is a testimonial, link, note, or bridge-video context.",
        nextStep: `Prepare proof for: ${assignment.evidenceRequired}`,
      };
    case "waiting_hq_review":
      return {
        statusLabel: "Waiting for HQ review",
        tone: "info",
        plainEnglishStatus:
          "Proof has been submitted locally. MEDLIFE HQ still decides what, if anything, should be shared broadly.",
        nextStep: "Wait for HQ review or add context only if HQ asks for it.",
      };
    case "changes_requested":
      return {
        statusLabel: "Needs more context",
        tone: "warning",
        plainEnglishStatus:
          "The proof idea is useful, but it needs a clearer story, consent, or hesitation addressed before HQ can use it.",
        nextStep:
          "Add plain-English context: what happened, who it helped, and what concern this proof answers.",
      };
    case "approved_internal":
      return {
        statusLabel: "Approved for internal learning",
        tone: "info",
        plainEnglishStatus:
          "This proof can help MEDLIFE learn internally. It is not automatically public.",
        nextStep:
          "Use it for chapter learning or coaching until a separate HQ publishing workflow exists.",
      };
  }
}

function getWorkspaceTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "member":
      return "What is happening with my proof?";
    case "leader":
      return "Proof follow-up status";
    case "coach":
      return "Proof status as a chapter-health signal";
    case "staff":
      return "HQ proof status summary";
    case "super_admin":
      return "Full local proof status summary";
    case "ds_admin":
      return "Proof status hidden for DS Admin";
  }
}

function hiddenProofStatusWorkspace(): MemberProofStatusWorkspace {
  return {
    canReadWorkspace: false,
    title: "Proof status hidden for DS Admin",
    summary:
      "DS Admin can inspect disabled integration posture, but should not read student proof status or testimonial truth.",
    rows: [],
    counts: {
      total: 0,
      actionNotReady: 0,
      proofNeeded: 0,
      waitingHqReview: 0,
      changesRequested: 0,
      approvedInternal: 0,
      publicPublishesEnabled: 0,
      externalExportsEnabled: 0,
    },
    futureStructuredEvents: [],
    disabledOutboxDestinations: [],
    safetyNotes: [],
  };
}
