import {
  getDraftLiveContentStringEvidenceReason,
  normalizeDraftLiveContentStatus,
  type DraftLiveContentStatus,
} from "./draft-live-content-safety.ts";

export type SopTemplatePromotionBoundaryStatus =
  | "blocked"
  | "draft_only"
  | "needs_review"
  | "needs_ds_approval"
  | "ready_for_manual_review";

export type SopTemplatePromotionBoundaryManifest = {
  id?: string;
  name?: string;
  state?: string | null;
  sourceKind?: string | null;
  isTemplate?: boolean;
  content?: {
    summary?: string | null;
    notes?: string | null;
    body?: string | null;
  };
  approvals?: {
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    dsApprovedBy?: string | null;
    dsApprovedAt?: string | null;
    promotionOwner?: string | null;
  };
  guards?: {
    rolloutEvidenceExcluded?: boolean;
    signedInProofExcluded?: boolean;
    inviteGateExcluded?: boolean;
    launchBehaviorUnchanged?: boolean;
  };
};

export type SopTemplatePromotionBoundaryCheck = {
  key: string;
  passed: boolean;
  detail: string;
};

export type SopTemplatePromotionBoundaryResult = {
  status: SopTemplatePromotionBoundaryStatus;
  state: DraftLiveContentStatus | null;
  eligibleForManualReview: boolean;
  summary: string;
  blockers: string[];
  checks: SopTemplatePromotionBoundaryCheck[];
};

const nonArchivedReviewStates = new Set<DraftLiveContentStatus>([
  "reviewed",
  "scheduled",
  "live",
]);

export function getSopTemplatePromotionBoundaryResult(
  manifest: SopTemplatePromotionBoundaryManifest,
): SopTemplatePromotionBoundaryResult {
  const normalizedState = normalizeDraftLiveContentStatus(manifest.state);
  const unsafeContentReason = getUnsafeManifestContentReason(manifest);
  const hasReviewEvidence = Boolean(
    manifest.approvals?.reviewedBy?.trim() &&
      manifest.approvals?.reviewedAt?.trim(),
  );
  const hasDsApprovalEvidence = Boolean(
    manifest.approvals?.dsApprovedBy?.trim() &&
      manifest.approvals?.dsApprovedAt?.trim(),
  );
  const hasPromotionOwner = Boolean(
    manifest.approvals?.promotionOwner?.trim(),
  );
  const guardChecks = [
    {
      key: "rollout_evidence_excluded",
      label: "Rollout packet evidence exclusion",
      passed: manifest.guards?.rolloutEvidenceExcluded === true,
      detail:
        manifest.guards?.rolloutEvidenceExcluded === true
          ? "confirmed"
          : "must confirm this manifest cannot count as rollout evidence",
    },
    {
      key: "signed_in_proof_excluded",
      label: "Signed-in proof exclusion",
      passed: manifest.guards?.signedInProofExcluded === true,
      detail:
        manifest.guards?.signedInProofExcluded === true
          ? "confirmed"
          : "must confirm this manifest cannot count as signed-in proof evidence",
    },
    {
      key: "invite_gate_excluded",
      label: "Invite-gate exclusion",
      passed: manifest.guards?.inviteGateExcluded === true,
      detail:
        manifest.guards?.inviteGateExcluded === true
          ? "confirmed"
          : "must confirm this manifest cannot satisfy invite-gate evidence",
    },
    {
      key: "launch_behavior_unchanged",
      label: "Launch behavior remains unchanged",
      passed: manifest.guards?.launchBehaviorUnchanged === true,
      detail:
        manifest.guards?.launchBehaviorUnchanged === true
          ? "confirmed"
          : "must confirm member/leader/staff/admin live behavior is still unchanged",
    },
  ];

  const checks: SopTemplatePromotionBoundaryCheck[] = [
    {
      key: "state",
      passed: normalizedState !== null,
      detail:
        normalizedState === null
          ? "manifest state must be one of draft, reviewed, scheduled, live, or archived"
          : `state is ${normalizedState}`,
    },
    {
      key: "unsafe_content",
      passed: unsafeContentReason === null,
      detail:
        unsafeContentReason === null
          ? "no SOP/sample placeholder markers found"
          : unsafeContentReason,
    },
    {
      key: "review_evidence",
      passed: hasReviewEvidence,
      detail: hasReviewEvidence
        ? "content review evidence is present"
        : "reviewedBy and reviewedAt are still required",
    },
    {
      key: "ds_approval",
      passed: hasDsApprovalEvidence,
      detail: hasDsApprovalEvidence
        ? "DS/admin approval evidence is present"
        : "dsApprovedBy and dsApprovedAt are still required",
    },
    {
      key: "promotion_owner",
      passed: hasPromotionOwner,
      detail: hasPromotionOwner
        ? "promotion owner is named"
        : "promotionOwner is still required before manual live review",
    },
    ...guardChecks,
  ];

  const blockers: string[] = [];

  if (!normalizedState) {
    blockers.push(
      "Manifest state is missing or unsupported for promotion boundary review.",
    );
  }

  if (unsafeContentReason) {
    blockers.push(
      `Manifest still contains draft/template/SOP sample material (${unsafeContentReason}).`,
    );
  }

  if (normalizedState === "archived") {
    blockers.push(
      "Archived manifests are not eligible for promotion and need a fresh reactivation review before any reuse.",
    );
  }

  for (const guardCheck of guardChecks) {
    if (!guardCheck.passed) {
      blockers.push(guardCheck.detail);
    }
  }

  let status: SopTemplatePromotionBoundaryStatus;

  if (normalizedState === "draft") {
    status = "draft_only";
  } else if (normalizedState === null || normalizedState === "archived") {
    status = "blocked";
  } else if (blockers.length > 0) {
    status = "blocked";
  } else if (!hasReviewEvidence) {
    status = "needs_review";
  } else if (!hasDsApprovalEvidence || !hasPromotionOwner) {
    status = "needs_ds_approval";
  } else if (nonArchivedReviewStates.has(normalizedState)) {
    status = "ready_for_manual_review";
  } else {
    status = "blocked";
  }

  const eligibleForManualReview = status === "ready_for_manual_review";

  return {
    status,
    state: normalizedState,
    eligibleForManualReview,
    summary: getSummary(status, normalizedState),
    blockers: [...new Set(blockers)],
    checks,
  };
}

export function formatSopTemplatePromotionBoundaryResult(
  result: SopTemplatePromotionBoundaryResult,
): string {
  return [
    `SOP/template promotion boundary: ${result.status.toUpperCase()}`,
    `State: ${result.state ?? "unknown"}`,
    `Eligible for manual review: ${result.eligibleForManualReview ? "yes" : "no"}`,
    "",
    result.summary,
    "",
    "Checks:",
    ...result.checks.map(
      (check) => `- ${check.passed ? "PASS" : "FAIL"} ${check.key}: ${check.detail}`,
    ),
    "",
    "Blockers:",
    ...formatList(result.blockers, "None"),
  ].join("\n");
}

function getUnsafeManifestContentReason(
  manifest: SopTemplatePromotionBoundaryManifest,
) {
  return (
    getDraftLiveContentStringEvidenceReason(manifest.name, "manifest.name") ??
    getDraftLiveContentStringEvidenceReason(
      manifest.content?.summary,
      "manifest.content.summary",
    ) ??
    getDraftLiveContentStringEvidenceReason(
      manifest.content?.notes,
      "manifest.content.notes",
    ) ??
    getDraftLiveContentStringEvidenceReason(
      manifest.content?.body,
      "manifest.content.body",
    )
  );
}

function getSummary(
  status: SopTemplatePromotionBoundaryStatus,
  state: DraftLiveContentStatus | null,
) {
  switch (status) {
    case "draft_only":
      return "Draft manifests stay local or sandbox-only and are not eligible for live promotion review.";
    case "needs_review":
      return "This manifest still needs content review evidence before DS/admin can consider promotion.";
    case "needs_ds_approval":
      return "This manifest has enough structure for review, but DS/admin approval evidence is still missing.";
    case "ready_for_manual_review":
      return `This ${state ?? "manifest"} record is eligible for manual promotion review only. The checker does not enable live behavior, rollout evidence, or provider side effects.`;
    case "blocked":
    default:
      return "This manifest crosses a safety boundary or lacks required guards, so promotion review should stop here.";
  }
}

function formatList(items: string[], emptyLabel: string) {
  if (items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}
