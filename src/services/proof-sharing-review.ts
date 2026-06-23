import { getProofLibraryItemsForActor } from "@/services/campaign-ops-service";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import type { ProofLibraryItem } from "@/shared/types/campaigns";

export type ProofSharingReviewState =
  | "ready_for_hq_review"
  | "needs_consent_or_context"
  | "internal_learning"
  | "future_public_candidate"
  | "private_not_shared";

export type ProofSharingReviewRow = {
  id: string;
  sourceLabel: string;
  campaignSlug: string;
  proofType: ProofLibraryItem["proofType"];
  hesitationAddressed: string;
  sharingStatus: ProofLibraryItem["sharingStatus"];
  reviewState: ProofSharingReviewState;
  actionNeeded: string;
  canBePublishedNow: false;
  externalExportPosture: "disabled";
};

export type ProofSharingReviewBoard = {
  canReadBoard: boolean;
  canDecideSharing: boolean;
  title: string;
  summary: string;
  rows: ProofSharingReviewRow[];
  counts: {
    total: number;
    readyForHqReview: number;
    needsConsentOrContext: number;
    internalLearning: number;
    futurePublicCandidates: number;
    publishActionsEnabled: 0;
    externalExportsEnabled: 0;
  };
};

export function getProofSharingReviewBoard(
  actor: LocalActorContext,
  items?: ProofLibraryItem[],
): ProofSharingReviewBoard {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "member" || surfaceFamily === "ds_admin") {
    return {
      canReadBoard: false,
      canDecideSharing: false,
      title: "HQ proof-sharing review hidden for this role",
      summary:
        "Members should see approved learning/proof experiences later, and DS Admin should only inspect integration posture.",
      rows: [],
      counts: emptyCounts(),
    };
  }

  const visibleItems = items ?? getProofLibraryItemsForActor(actor);
  const rows = visibleItems.map(toReviewRow);

  return {
    canReadBoard: true,
    canDecideSharing: surfaceFamily === "staff" || surfaceFamily === "super_admin",
    title: getTitle(surfaceFamily),
    summary:
      "Proof is belief-building evidence that can help chapters coach, recruit, and tell stronger stories. Broader sharing stays curated while this MVP keeps public publishing and exports paused.",
    rows: sortRows(rows),
    counts: {
      total: rows.length,
      readyForHqReview: rows.filter((row) => row.reviewState === "ready_for_hq_review")
        .length,
      needsConsentOrContext: rows.filter(
        (row) => row.reviewState === "needs_consent_or_context",
      ).length,
      internalLearning: rows.filter((row) => row.reviewState === "internal_learning")
        .length,
      futurePublicCandidates: rows.filter(
        (row) => row.reviewState === "future_public_candidate",
      ).length,
      publishActionsEnabled: 0,
      externalExportsEnabled: 0,
    },
  };
}

function toReviewRow(item: ProofLibraryItem): ProofSharingReviewRow {
  const reviewState = getReviewState(item);

  return {
    id: item.id,
    sourceLabel: item.sourceLabel,
    campaignSlug: item.campaignSlug,
    proofType: item.proofType,
    hesitationAddressed: item.hesitationAddressed,
    sharingStatus: item.sharingStatus,
    reviewState,
    actionNeeded: getActionNeeded(item, reviewState),
    canBePublishedNow: false,
    externalExportPosture: "disabled",
  };
}

function getReviewState(item: ProofLibraryItem): ProofSharingReviewState {
  if (item.sharingStatus === "approved_for_internal_learning") {
    return "internal_learning";
  }

  if (item.sharingStatus === "future_public_candidate") {
    return "future_public_candidate";
  }

  if (item.sharingStatus === "not_shared") {
    return "private_not_shared";
  }

  if (item.proofType === "bridge_video" || item.proofType === "alumni_ugc") {
    return "needs_consent_or_context";
  }

  return "ready_for_hq_review";
}

function getActionNeeded(
  item: ProofLibraryItem,
  reviewState: ProofSharingReviewState,
): string {
  switch (reviewState) {
    case "needs_consent_or_context":
      return "Confirm consent, context, and the hesitation this proof addresses before it moves into broader storytelling.";
    case "ready_for_hq_review":
      return "This proof is ready for a decision about whether it should stay private, support internal learning, or become a future story candidate.";
    case "internal_learning":
      return "Use this internally for playbooks, SOP examples, and coaching while broader sharing remains curated.";
    case "future_public_candidate":
      return "Keep this queued as a future story candidate once approval, consent, and publishing controls are in place.";
    case "private_not_shared":
      return `Keep ${item.sourceLabel} private unless the chapter and HQ decide to revisit it later.`;
  }
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "leader":
      return "Chapter proof board";
    case "coach":
      return "Coach proof board";
    case "staff":
      return "Proof sharing desk";
    case "super_admin":
      return "Proof sharing operations";
    case "member":
    case "ds_admin":
      return "HQ proof-sharing review hidden for this role";
  }
}

function sortRows(rows: ProofSharingReviewRow[]): ProofSharingReviewRow[] {
  const priority: Record<ProofSharingReviewState, number> = {
    needs_consent_or_context: 0,
    ready_for_hq_review: 1,
    future_public_candidate: 2,
    internal_learning: 3,
    private_not_shared: 4,
  };

  return [...rows].sort((left, right) => {
    const stateSort = priority[left.reviewState] - priority[right.reviewState];

    if (stateSort !== 0) {
      return stateSort;
    }

    return left.sourceLabel.localeCompare(right.sourceLabel);
  });
}

function emptyCounts(): ProofSharingReviewBoard["counts"] {
  return {
    total: 0,
    readyForHqReview: 0,
    needsConsentOrContext: 0,
    internalLearning: 0,
    futurePublicCandidates: 0,
    publishActionsEnabled: 0,
    externalExportsEnabled: 0,
  };
}
