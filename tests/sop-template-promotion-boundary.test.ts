import { describe, expect, it } from "vitest";

import {
  formatSopTemplatePromotionBoundaryResult,
  getSopTemplatePromotionBoundaryResult,
} from "@/services/sop-template-promotion-boundary";

describe("sop template promotion boundary", () => {
  it("keeps draft manifests in a local-only posture", () => {
    const result = getSopTemplatePromotionBoundaryResult({
      name: "Campus SOP Draft",
      state: "draft",
      approvals: {},
      guards: {
        rolloutEvidenceExcluded: true,
        signedInProofExcluded: true,
        inviteGateExcluded: true,
        launchBehaviorUnchanged: true,
      },
    });

    expect(result.status).toBe("draft_only");
    expect(result.eligibleForManualReview).toBe(false);
  });

  it("requires review evidence before a reviewed manifest can move forward", () => {
    const result = getSopTemplatePromotionBoundaryResult({
      name: "Chapter Follow-up SOP",
      state: "reviewed",
      guards: {
        rolloutEvidenceExcluded: true,
        signedInProofExcluded: true,
        inviteGateExcluded: true,
        launchBehaviorUnchanged: true,
      },
    });

    expect(result.status).toBe("needs_review");
    expect(result.blockers).toEqual([]);
  });

  it("requires ds approval and guard confirmations before manual promotion review", () => {
    const result = getSopTemplatePromotionBoundaryResult({
      name: "Chapter Follow-up SOP",
      state: "scheduled",
      approvals: {
        reviewedBy: "content-owner@medlifemovement.org",
        reviewedAt: "2026-07-06T12:00:00Z",
      },
      guards: {
        rolloutEvidenceExcluded: true,
        signedInProofExcluded: true,
        inviteGateExcluded: true,
        launchBehaviorUnchanged: true,
      },
    });

    expect(result.status).toBe("needs_ds_approval");
    expect(result.eligibleForManualReview).toBe(false);
  });

  it("marks a fully approved manifest as ready for manual review only", () => {
    const result = getSopTemplatePromotionBoundaryResult({
      name: "Chapter Follow-up SOP",
      state: "live",
      approvals: {
        reviewedBy: "content-owner@medlifemovement.org",
        reviewedAt: "2026-07-06T12:00:00Z",
        dsApprovedBy: "ds-admin@medlifemovement.org",
        dsApprovedAt: "2026-07-06T13:00:00Z",
        promotionOwner: "launch-owner@medlifemovement.org",
      },
      guards: {
        rolloutEvidenceExcluded: true,
        signedInProofExcluded: true,
        inviteGateExcluded: true,
        launchBehaviorUnchanged: true,
      },
    });

    expect(result.status).toBe("ready_for_manual_review");
    expect(result.eligibleForManualReview).toBe(true);

    expect(formatSopTemplatePromotionBoundaryResult(result)).toContain(
      "The checker does not enable live behavior, rollout evidence, or provider side effects.",
    );
  });

  it("blocks manifests that still carry sample content markers", () => {
    const result = getSopTemplatePromotionBoundaryResult({
      name: "SOP sample for chapter follow-up",
      state: "reviewed",
      approvals: {
        reviewedBy: "content-owner@medlifemovement.org",
        reviewedAt: "2026-07-06T12:00:00Z",
        dsApprovedBy: "ds-admin@medlifemovement.org",
        dsApprovedAt: "2026-07-06T13:00:00Z",
        promotionOwner: "launch-owner@medlifemovement.org",
      },
      guards: {
        rolloutEvidenceExcluded: true,
        signedInProofExcluded: true,
        inviteGateExcluded: true,
        launchBehaviorUnchanged: true,
      },
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers[0]).toContain(
      "Manifest still contains draft/template/SOP sample material",
    );
  });
});
