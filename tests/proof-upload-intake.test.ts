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
    expect(workspace.storagePacket).toEqual(
      expect.objectContaining({
        title: "Goal 159 proof storage intake packet",
        targetRoute: "/proof-library/upload",
        futureFunction: "app.prepare_proof_upload_intake",
        privateBucket: "proof-submissions-private",
        publicBucket: "proof-library-public",
        currentResultCode: "upload_disabled",
        futureResultCode: "proof_upload_intake_recorded",
      }),
    );
    expect(workspace.storagePacket?.storagePathPreview).toBe(
      "chapters/chapter-a/evidence/local-proof-upload-preview/rush-social-bridge-video.mov",
    );
    expect(workspace.storagePacket?.rawUploadReaders).toEqual([
      "submitter",
      "admin",
      "super_admin",
    ]);
    expect(workspace.storagePacket?.requiredMetadata).toContain("storagePath");
    expect(workspace.storagePacket?.futureRecords).toEqual(
      expect.arrayContaining([
        {
          label: "Structured event",
          value: "proof_upload_requested",
        },
        {
          label: "Audit action",
          value: "proof_upload_intake_prepared",
        },
      ]),
    );
    expect(workspace.storagePacket?.blockedControls).toEqual(
      expect.arrayContaining([
        "Create signed upload URL",
        "Write storage object",
        "Publish public proof URL",
        "Export raw proof to automation",
      ]),
    );
  });

  it("treats committee members as part of the member-owned proof upload surface", () => {
    const actor = getMockLocalActorContext("committee.member@mymedlife.test");
    const workspace = getProofUploadIntakeWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Prepare your proof upload");
    expect(workspace.uploadsEnabled).toBe(false);
  });

  it("keeps DS Admin out of student proof content", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getProofUploadIntakeWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(false);
    expect(workspace.summary).toContain("should not read or own student proof content");
    expect(workspace.checks).toEqual([]);
    expect(workspace.storagePacket).toBeNull();
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
        "proof_upload_validated",
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

  it("builds the storage packet from the same checks without enabling upload", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const workspace = getProofUploadIntakeWorkspace(actor, {
      evidenceItemId: "evidence-bridge-video",
      fileName: "Leader Recap.MP4",
      mimeType: "video/mp4",
      byteSize: 20_000_000,
      consentToMedlifeReview: true,
      consentToFutureSharing: true,
      purpose: "bridge_video",
      hesitationAddressed: "I am worried joining a chapter will feel awkward.",
      contextSummary:
        "The action committee chair explains how a small social moment made the chapter feel approachable.",
    });

    expect(workspace.storagePacket?.storagePathPreview).toBe(
      "chapters/chapter-a/evidence/evidence-bridge-video/leader-recap.mp4",
    );
    expect(
      workspace.storagePacket?.readinessChecks.find(
        (check) => check.key === "private_bucket_previewed",
      ),
    ).toEqual(
      expect.objectContaining({
        passed: true,
      }),
    );
    expect(
      workspace.storagePacket?.readinessChecks.find(
        (check) => check.key === "raw_readers_restricted",
      ),
    ).toEqual(
      expect.objectContaining({
        passed: true,
      }),
    );
    expect(
      workspace.storagePacket?.futureRecords.find(
        (record) => record.label === "Disabled outbox",
      )?.value,
    ).toContain("AI summary");
    expect(workspace.uploadsEnabled).toBe(false);
  });

  it("treats committee chairs as part of the leader-owned proof upload surface", () => {
    const actor = getMockLocalActorContext("committee.chair@mymedlife.test");
    const workspace = getProofUploadIntakeWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Leader proof upload readiness");
    expect(workspace.uploadsEnabled).toBe(false);
  });
});
