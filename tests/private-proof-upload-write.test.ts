import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  buildPrivateProofUploadRow,
  getPreparedPrivateProofStoragePath,
  getPrivateProofUploadWriteConfig,
  mapPrivateProofUploadRemovalRpcSuccess,
  mapPrivateProofUploadRpcError,
  mapPrivateProofUploadRpcSuccess,
  parseFutureSharingConsent,
  validatePrivateProofUploadMetadata,
} from "@/services/private-proof-upload-write";

describe("private proof upload write", () => {
  it("keeps the private upload lane disabled by default", () => {
    expect(getPrivateProofUploadWriteConfig({})).toMatchObject({
      enabled: false,
      uploadsEnabled: false,
      publicPublishingEnabled: false,
    });
  });

  it("enables the local private upload lane only with the dedicated write flag", () => {
    expect(
      getPrivateProofUploadWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      uploadsEnabled: true,
      publicPublishingEnabled: false,
    });
  });

  it("requires both dedicated flags before enabling production private upload", () => {
    expect(
      getPrivateProofUploadWriteConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: false,
      environment: "production",
      uploadsEnabled: false,
    });

    expect(
      getPrivateProofUploadWriteConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_PRIVATE_PROOF_UPLOAD_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      environment: "production",
      isLocalOnly: false,
      uploadsEnabled: true,
      publicPublishingEnabled: false,
      externalWritesEnabled: false,
    });
  });

  it("keeps hosted staging uploads disabled even when the generic flag is set", () => {
    expect(
      getPrivateProofUploadWriteConfig({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: false,
      environment: "staging",
    });
  });

  it("validates upload metadata before minting a signed storage ticket", () => {
    const config = getPrivateProofUploadWriteConfig({
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE: "true",
      MYMEDLIFE_ALLOW_PRODUCTION_PRIVATE_PROOF_UPLOAD_WRITE: "true",
    });
    const base = {
      evidenceItemId: "60000000-0000-4000-8000-000000000001",
      fileName: "TEST-event-photo.png",
      mimeType: "image/png",
      byteSize: 2048,
      consentToMedlifeReview: true,
      config,
    };

    expect(validatePrivateProofUploadMetadata(base)).toBeNull();
    expect(
      validatePrivateProofUploadMetadata({
        ...base,
        consentToMedlifeReview: false,
      }),
    ).toBe("review_consent_required");
    expect(
      validatePrivateProofUploadMetadata({
        ...base,
        mimeType: "text/html",
      }),
    ).toBe("file_type_blocked");
    expect(
      validatePrivateProofUploadMetadata({
        ...base,
        byteSize: 500 * 1024 * 1024 + 1,
      }),
    ).toBe("file_too_large");
  });

  it("parses the future sharing choice explicitly", () => {
    expect(parseFutureSharingConsent("granted")).toBe(true);
    expect(parseFutureSharingConsent("declined")).toBe(false);
    expect(parseFutureSharingConsent("maybe")).toBeNull();
  });

  it("builds the private storage path from chapter and evidence ids", () => {
    expect(
      getPreparedPrivateProofStoragePath(
        "10000000-0000-4000-8000-000000000001",
        "60000000-0000-4000-8000-000000000001",
        "Rush Social Bridge Video.MOV",
      ),
    ).toBe(
      "chapters/10000000-0000-4000-8000-000000000001/evidence/60000000-0000-4000-8000-000000000001/rush-social-bridge-video.mov",
    );
  });

  it("only lets the signed-in submitter upload the raw file", () => {
    const actor = getMockLocalActorContext(
      "member.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    actor.user.id = "00000000-0000-4000-8000-000000000001";

    const row = buildPrivateProofUploadRow({
      actor,
      assignmentId: "assignment-1",
      assignmentStatus: "submitted",
      assignmentTitle: "Rush social follow-up",
      chapterName: "UCLA MEDLIFE",
      evidenceItemId: "evidence-1",
      submittedBy: "Sofia Alvarez",
      submittedByUserId: "00000000-0000-4000-8000-000000000001",
      evidenceType: "bridge_video",
      summary: "Bridge video metadata only.",
      status: "pending_review",
      sharingStatus: "submitted",
      storagePath: null,
    });

    expect(row.canUpload).toBe(true);
    expect(row.canRemove).toBe(false);
  });

  it("lets HQ cleanup roles remove an attached file without letting them upload it", () => {
    const actor = getMockLocalActorContext(
      "admin@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    actor.user.id = "00000000-0000-4000-8000-000000000004";

    const row = buildPrivateProofUploadRow({
      actor,
      assignmentId: "assignment-1",
      assignmentStatus: "submitted",
      assignmentTitle: "Rush social follow-up",
      chapterName: "UCLA MEDLIFE",
      evidenceItemId: "evidence-1",
      submittedBy: "Sofia Alvarez",
      submittedByUserId: "00000000-0000-4000-8000-000000000001",
      evidenceType: "bridge_video",
      summary: "Bridge video metadata only.",
      status: "pending_review",
      sharingStatus: "in_hq_review",
      storagePath:
        "chapters/100/evidence/evidence-1/rush-social-bridge-video.mov",
    });

    expect(row.canUpload).toBe(false);
    expect(row.canRemove).toBe(true);
  });

  it("does not advertise upload before the related assignment is submitted", () => {
    const actor = getMockLocalActorContext(
      "member.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    actor.user.id = "00000000-0000-4000-8000-000000000001";

    const row = buildPrivateProofUploadRow({
      actor,
      assignmentId: "assignment-1",
      assignmentStatus: "in_progress",
      assignmentTitle: "Rush social follow-up",
      chapterName: "UCLA MEDLIFE",
      evidenceItemId: "evidence-1",
      submittedBy: "Sofia Alvarez",
      submittedByUserId: actor.user.id,
      evidenceType: "bridge_video",
      summary: "Bridge video metadata only.",
      status: "pending_review",
      sharingStatus: "submitted",
      storagePath: null,
    });

    expect(row.canUpload).toBe(false);
    expect(row.helperText).toContain("Finish or resubmit");
  });

  it("maps upload success and removal success into stable result codes", () => {
    expect(
      mapPrivateProofUploadRpcSuccess("evidence-1", {
        evidence_item_id: "evidence-1",
        event_id: "event-1",
        integration_event_id: "integration-1",
        outbox_id: "outbox-1",
        audit_log_id: "audit-1",
        storage_path: "chapters/100/evidence/evidence-1/file.mov",
      }),
    ).toMatchObject({
      success: true,
      code: "proof_uploaded",
      storagePath: "chapters/100/evidence/evidence-1/file.mov",
    });

    expect(
      mapPrivateProofUploadRemovalRpcSuccess("evidence-1", {
        evidence_item_id: "evidence-1",
        event_id: "event-2",
        integration_event_id: "integration-2",
        outbox_id: "outbox-2",
        audit_log_id: "audit-2",
        removed_storage_path: "chapters/100/evidence/evidence-1/file.mov",
      }),
    ).toMatchObject({
      success: true,
      code: "upload_removed",
    });
  });

  it("maps key RPC errors into reviewer-friendly result codes", () => {
    expect(
      mapPrivateProofUploadRpcError("evidence-1", {
        code: "P0002",
        message: "evidence item not found",
      }),
    ).toMatchObject({
      success: false,
      code: "evidence_not_found",
    });

    expect(
      mapPrivateProofUploadRpcError("evidence-1", {
        code: "22023",
        message: "proof already has private upload",
      }),
    ).toMatchObject({
      success: false,
      code: "duplicate_upload",
    });
  });
});
