import { describe, expect, it } from "vitest";
import {
  getProofUploadIntakeChecks,
  getProofUploadIntakeWorkspace,
} from "@/services/proof-upload-intake";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("proof upload intake", () => {
  it("shows members a proof upload readiness workspace with uploads disabled", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getProofUploadIntakeWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Prepare your proof upload");
    expect(workspace.uploadsEnabled).toBe(false);
    expect(workspace.publicPublishingEnabled).toBe(false);
    expect(workspace.externalExportsEnabled).toBe(false);
    expect(workspace.blockedControls.map((control) => control.label)).toEqual([
      "Upload file",
      "Publish proof",
      "Export raw proof",
    ]);
  });

  it("keeps DS Admin out of student proof content", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getProofUploadIntakeWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(false);
    expect(workspace.summary).toContain("should not read or own student proof content");
    expect(workspace.checks).toEqual([]);
    expect(workspace.uploadsEnabled).toBe(false);
  });

  it("validates future file and consent readiness without enabling upload", () => {
    const checks = getProofUploadIntakeChecks({
      evidenceItemId: "evidence-1",
      fileName: "Proof.mov",
      mimeType: "video/quicktime",
      byteSize: 12_000_000,
      consentToMedlifeReview: true,
      consentToFutureSharing: false,
      purpose: "bridge_video",
      hesitationAddressed: "I am worried I will not know anyone.",
      contextSummary: "A first-year student explains why the social event mattered.",
    });

    expect(checks.every((check) => check.passed)).toBe(true);
    expect(checks.find((check) => check.key === "uploads_disabled")?.passed).toBe(
      true,
    );
  });

  it("flags unsafe files and missing proof context", () => {
    const checks = getProofUploadIntakeChecks({
      evidenceItemId: "evidence-1",
      fileName: "malware.exe",
      mimeType: "application/x-msdownload",
      byteSize: 900 * 1024 * 1024,
      consentToMedlifeReview: false,
      consentToFutureSharing: false,
      purpose: "bridge_video",
      hesitationAddressed: "Friends",
      contextSummary: "Too short",
    });
    const failedKeys = checks
      .filter((check) => !check.passed)
      .map((check) => check.key);

    expect(failedKeys).toEqual([
      "mime_type_allowed",
      "file_size_allowed",
      "review_consent_present",
      "hesitation_addressed",
      "context_summary_present",
    ]);
  });

  it("names the future structured events without enabling external destinations", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getProofUploadIntakeWorkspace(actor);

    expect(workspace.futureStructuredEvents).toEqual(
      expect.arrayContaining([
        "proof_upload_requested",
        "proof_consent_recorded",
        "evidence_submitted",
        "automation_outbox_recorded",
        "audit_log_recorded",
      ]),
    );
    expect(
      workspace.futureOutboxDestinations.every((destination) =>
        destination.includes("disabled"),
      ),
    ).toBe(true);
  });
});
