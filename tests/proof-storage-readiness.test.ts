import { describe, expect, it } from "vitest";
import {
  getProofStoragePlan,
  getProofStorageReadinessConfig,
  isAllowedProofMimeType,
  prepareDisabledProofFileUpload,
} from "@/services/proof-storage-readiness";

describe("proof storage readiness", () => {
  it("keeps proof uploads disabled by default", () => {
    expect(getProofStorageReadinessConfig({})).toEqual(
      expect.objectContaining({
        uploadsEnabled: false,
        publicPublishingEnabled: false,
        reason: expect.stringContaining("disabled"),
      }),
    );
  });

  it("keeps proof uploads disabled even when the env flag is requested", () => {
    expect(
      getProofStorageReadinessConfig({
        MYMEDLIFE_ALLOW_PROOF_UPLOADS: "true",
      }),
    ).toEqual(
      expect.objectContaining({
        uploadsEnabled: false,
        publicPublishingEnabled: false,
        reason: expect.stringContaining("Goal 17 keeps upload"),
      }),
    );
  });

  it("separates private submissions from future public proof-library assets", () => {
    const plan = getProofStoragePlan();

    expect(plan.privateSubmissionBucket).toBe("proof-submissions-private");
    expect(plan.publicLibraryBucket).toBe("proof-library-public");
    expect(plan.rawUploadReaders).toEqual(["submitter", "admin", "super_admin"]);
    expect(plan.publicAssetReaders).toContain("chapter_leader");
    expect(plan.blockedUntilApproved).toContain("public proof URLs");
  });

  it("allows expected bridge video and testimonial asset mime types", () => {
    expect(isAllowedProofMimeType("video/mp4")).toBe(true);
    expect(isAllowedProofMimeType("video/quicktime")).toBe(true);
    expect(isAllowedProofMimeType("image/jpeg")).toBe(true);
    expect(isAllowedProofMimeType("application/x-msdownload")).toBe(false);
  });

  it("prepares a disabled upload attempt without saving files", () => {
    const attempt = prepareDisabledProofFileUpload({
      evidenceItemId: "evidence-1",
      fileName: "Rush Social Bridge Video.MOV",
      mimeType: "video/quicktime",
      byteSize: 12_000_000,
      consentToMedlifeReview: true,
      consentToFutureSharing: false,
    });

    expect(attempt.success).toBe(false);
    expect(attempt.wouldUseBucket).toBe("proof-submissions-private");
    expect(attempt.wouldWriteTables).toEqual([
      "storage.objects",
      "evidence_items",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ]);
    expect(attempt.normalizedFileName).toBe("rush-social-bridge-video.mov");
    expect(attempt.requiresConsentFollowUp).toBe(true);
  });
});
