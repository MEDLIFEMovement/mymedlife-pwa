import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  createLocalSupabaseServerClient: vi.fn(),
  getAuthSessionState: vi.fn(),
  getLocalActorContext: vi.fn(),
  getPrivateProofUploadWriteConfig: vi.fn(),
  validatePrivateProofUploadMetadata: vi.fn(),
  mapPrivateProofUploadRpcError: vi.fn(),
  mapPrivateProofUploadRpcSuccess: vi.fn(),
  mapPrivateProofUploadRemovalRpcSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: mocks.createLocalSupabaseServerClient,
}));
vi.mock("@/services/auth-session", () => ({
  getAuthSessionState: mocks.getAuthSessionState,
}));
vi.mock("@/services/local-actor-context", () => ({
  getLocalActorContext: mocks.getLocalActorContext,
}));
vi.mock("@/services/private-proof-upload-write", () => ({
  getPrivateProofUploadWriteConfig: mocks.getPrivateProofUploadWriteConfig,
  validatePrivateProofUploadMetadata: mocks.validatePrivateProofUploadMetadata,
  mapPrivateProofUploadRpcError: mocks.mapPrivateProofUploadRpcError,
  mapPrivateProofUploadRpcSuccess: mocks.mapPrivateProofUploadRpcSuccess,
  mapPrivateProofUploadRemovalRpcSuccess:
    mocks.mapPrivateProofUploadRemovalRpcSuccess,
}));

import {
  discardPreparedPrivateProofUploadForSupabase,
  preparePrivateProofUploadForSupabase,
  recordPrivateProofUploadForSupabase,
  removePrivateProofUploadAction,
  removePrivateProofUploadForSupabase,
} from "@/app/proof-library/upload/actions";

const evidenceItemId = "60000000-0000-4000-8000-000000000004";
const storagePath =
  "chapters/50000000-0000-4000-8000-000000000001/evidence/60000000-0000-4000-8000-000000000004/TEST-proof.png";
const input = {
  evidenceItemId,
  fileName: "TEST-proof.png",
  mimeType: "image/png",
  byteSize: 24,
  consentToMedlifeReview: true,
  consentToFutureSharing: false,
};
const ticket = {
  evidenceItemId,
  bucket: "proof-submissions-private",
  storagePath,
  input,
};

describe("private proof upload server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPrivateProofUploadWriteConfig.mockReturnValue({
      enabled: true,
      environment: "local",
      isLocalOnly: true,
      uploadsEnabled: true,
      publicPublishingEnabled: false,
      externalWritesEnabled: false,
      reason: "Private upload enabled.",
      bucket: "proof-submissions-private",
    });
    mocks.validatePrivateProofUploadMetadata.mockReturnValue(null);
    mocks.getAuthSessionState.mockResolvedValue({
      status: "signed_in",
      user: { id: "submitter-1", email: "member@mymedlife.test" },
    });
    mocks.getLocalActorContext.mockResolvedValue({ audience: "member" });
    mocks.mapPrivateProofUploadRpcError.mockImplementation(
      (id: string, error: { code?: string }) => ({
        success: false,
        code: error.code === "42501" ? "permission_denied" : "server_error",
        evidenceItemId: id,
        plainEnglishMessage: "Mapped RPC error.",
      }),
    );
    mocks.mapPrivateProofUploadRpcSuccess.mockImplementation((id: string) => ({
      success: true,
      code: "proof_uploaded",
      evidenceItemId: id,
      storagePath,
      eventId: "event-1",
      integrationEventId: "integration-event-1",
      outboxId: "outbox-1",
      auditLogId: "audit-1",
      plainEnglishMessage: "Uploaded.",
    }));
    mocks.mapPrivateProofUploadRemovalRpcSuccess.mockImplementation(
      (id: string) => ({
        success: true,
        code: "upload_removed",
        evidenceItemId: id,
        storagePath,
        eventId: "event-2",
        integrationEventId: "integration-event-2",
        outboxId: "outbox-2",
        auditLogId: "audit-2",
        plainEnglishMessage: "Removed.",
      }),
    );
  });

  it.each([
    ["write_disabled", "Private upload enabled."],
    ["evidence_not_found", "could not be recognized"],
    ["file_required", "Choose one"],
    ["file_type_blocked", "approved image"],
    ["file_too_large", "500 MB"],
    ["review_consent_required", "review consent"],
  ])("returns the %s preparation validation state", async (code, message) => {
    mocks.validatePrivateProofUploadMetadata.mockReturnValue(code);

    await expect(preparePrivateProofUploadForSupabase(input)).resolves.toMatchObject({
      success: false,
      code,
      plainEnglishMessage: expect.stringContaining(message),
    });
    expect(mocks.createLocalSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("fails preparation when auth is unavailable or signed out", async () => {
    mocks.createLocalSupabaseServerClient.mockResolvedValueOnce({
      client: null,
      config: { reason: "Auth unavailable." },
    });
    await expect(preparePrivateProofUploadForSupabase(input)).resolves.toMatchObject({
      code: "write_disabled",
      plainEnglishMessage: "Auth unavailable.",
    });

    const harness = createClientHarness();
    mocks.createLocalSupabaseServerClient.mockResolvedValueOnce({
      client: harness.client,
      config: { reason: "Auth ready." },
    });
    mocks.getAuthSessionState.mockResolvedValueOnce({ status: "signed_out", user: null });
    await expect(preparePrivateProofUploadForSupabase(input)).resolves.toMatchObject({
      code: "missing_auth",
    });
  });

  it("maps preparation RPC errors and missing rows", async () => {
    const harness = createClientHarness();
    enableClient(harness.client);
    harness.rpc.mockResolvedValueOnce({ data: null, error: { code: "42501" } });

    await expect(preparePrivateProofUploadForSupabase(input)).resolves.toMatchObject({
      code: "permission_denied",
    });

    harness.rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(preparePrivateProofUploadForSupabase(input)).resolves.toMatchObject({
      code: "server_error",
    });
  });

  it("returns a signed private upload ticket and fails closed without its token", async () => {
    const preparedRow = {
      private_bucket: "proof-submissions-private",
      storage_path: storagePath,
    };
    const harness = createClientHarness();
    enableClient(harness.client);
    harness.rpc.mockResolvedValue({ data: [preparedRow], error: null });
    harness.createSignedUploadUrl.mockResolvedValueOnce({
      data: null,
      error: { message: "ticket failed" },
    });
    await expect(preparePrivateProofUploadForSupabase(input)).resolves.toMatchObject({
      code: "server_error",
    });

    harness.createSignedUploadUrl.mockResolvedValueOnce({
      data: { token: "signed-token" },
      error: null,
    });
    await expect(preparePrivateProofUploadForSupabase(input)).resolves.toEqual({
      success: true,
      evidenceItemId,
      bucket: "proof-submissions-private",
      storagePath,
      uploadToken: "signed-token",
      input,
    });
  });

  it("rejects a mismatched finalization bucket before auth", async () => {
    await expect(
      recordPrivateProofUploadForSupabase({ ...ticket, bucket: "wrong-bucket" }),
    ).resolves.toMatchObject({ success: false, code: "permission_denied" });
    expect(mocks.createLocalSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("rejects a finalization ticket whose nested proof record does not match", async () => {
    await expect(
      recordPrivateProofUploadForSupabase({
        ...ticket,
        input: { ...input, evidenceItemId: "70000000-0000-4000-8000-000000000007" },
      }),
    ).resolves.toMatchObject({ success: false, code: "permission_denied" });
    expect(mocks.createLocalSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("refuses to finalize when the exact Storage object is missing or unverifiable", async () => {
    const harness = createClientHarness();
    enableClient(harness.client);

    harness.list.mockResolvedValueOnce({ data: [], error: null });
    await expect(recordPrivateProofUploadForSupabase(ticket)).resolves.toMatchObject({
      success: false,
      code: "upload_not_present",
      plainEnglishMessage: expect.stringContaining("not found"),
    });
    expect(harness.rpc).not.toHaveBeenCalled();

    harness.list.mockResolvedValueOnce({
      data: null,
      error: { message: "storage unavailable" },
    });
    await expect(recordPrivateProofUploadForSupabase(ticket)).resolves.toMatchObject({
      success: false,
      code: "server_error",
      plainEnglishMessage: expect.stringContaining("could not verify"),
    });
    expect(harness.rpc).not.toHaveBeenCalled();
  });

  it("refuses to finalize when Storage metadata disagrees with the upload ticket", async () => {
    const harness = createClientHarness();
    enableClient(harness.client);

    harness.list.mockResolvedValueOnce({
      data: [{ id: "object-1", name: "TEST-proof.png", metadata: null }],
      error: null,
    });
    await expect(recordPrivateProofUploadForSupabase(ticket)).resolves.toMatchObject({
      success: false,
      code: "server_error",
      plainEnglishMessage: expect.stringContaining("size"),
    });

    harness.list.mockResolvedValueOnce({
      data: [{ id: "object-1", name: "TEST-proof.png", metadata: { size: 99 } }],
      error: null,
    });
    await expect(recordPrivateProofUploadForSupabase(ticket)).resolves.toMatchObject({
      success: false,
      code: "server_error",
      plainEnglishMessage: expect.stringContaining("size"),
    });

    harness.list.mockResolvedValueOnce({
      data: [
        {
          id: "object-1",
          name: "TEST-proof.png",
          metadata: { size: input.byteSize, mimetype: "application/pdf" },
        },
      ],
      error: null,
    });
    await expect(recordPrivateProofUploadForSupabase(ticket)).resolves.toMatchObject({
      success: false,
      code: "server_error",
      plainEnglishMessage: expect.stringContaining("type"),
    });
    expect(harness.rpc).not.toHaveBeenCalled();
  });

  it("cleans Storage when finalization RPC fails or returns no row", async () => {
    const harness = createClientHarness();
    enableClient(harness.client);
    harness.list.mockResolvedValue({
      data: [
        {
          id: "object-1",
          name: "TEST-proof.png",
          metadata: { size: input.byteSize, mimetype: input.mimeType },
        },
      ],
      error: null,
    });
    harness.rpc.mockResolvedValueOnce({ data: null, error: { code: "42501" } });
    await expect(recordPrivateProofUploadForSupabase(ticket)).resolves.toMatchObject({
      code: "permission_denied",
    });
    expect(harness.remove).toHaveBeenCalledWith([storagePath]);

    harness.rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(recordPrivateProofUploadForSupabase(ticket)).resolves.toMatchObject({
      code: "server_error",
    });
    expect(harness.remove).toHaveBeenCalledTimes(2);
  });

  it("returns the audited finalization result", async () => {
    const harness = createClientHarness();
    enableClient(harness.client);
    harness.list.mockResolvedValue({
      data: [
        {
          id: "object-1",
          name: "TEST-proof.png",
          metadata: { size: String(input.byteSize), contentType: input.mimeType },
        },
      ],
      error: null,
    });
    harness.rpc.mockResolvedValue({ data: [{ storage_path: storagePath }], error: null });

    await expect(recordPrivateProofUploadForSupabase(ticket)).resolves.toMatchObject({
      success: true,
      code: "proof_uploaded",
    });
    expect(harness.rpc).toHaveBeenCalledWith(
      "record_verified_private_proof_upload",
      expect.objectContaining({ evidence_uuid: evidenceItemId }),
    );
  });

  it("verifies the canonical path before orphan cleanup", async () => {
    const harness = createClientHarness();
    enableClient(harness.client);
    harness.rpc.mockResolvedValueOnce({
      data: [{ storage_path: "another/path.png" }],
      error: null,
    });
    await expect(discardPreparedPrivateProofUploadForSupabase(ticket)).resolves.toMatchObject({
      success: false,
      plainEnglishMessage: expect.stringContaining("canonical upload path"),
    });
    expect(harness.remove).not.toHaveBeenCalled();
  });

  it("reports orphan cleanup failure and success", async () => {
    const harness = createClientHarness();
    enableClient(harness.client);
    harness.rpc.mockResolvedValue({ data: [{ storage_path: storagePath }], error: null });
    harness.remove.mockResolvedValueOnce({ error: { message: "remove failed" } });
    await expect(discardPreparedPrivateProofUploadForSupabase(ticket)).resolves.toMatchObject({
      success: false,
    });

    harness.remove.mockResolvedValueOnce({ error: null });
    await expect(discardPreparedPrivateProofUploadForSupabase(ticket)).resolves.toMatchObject({
      success: true,
    });
  });

  it("validates the removal gate, reason, session, row, and permissions", async () => {
    mocks.getPrivateProofUploadWriteConfig.mockReturnValueOnce({
      enabled: false,
      reason: "Removal disabled.",
      bucket: "proof-submissions-private",
    });
    await expect(removePrivateProofUploadForSupabase(removalForm())).resolves.toMatchObject({
      code: "write_disabled",
    });
    await expect(removePrivateProofUploadForSupabase(removalForm("short"))).resolves.toMatchObject({
      code: "removal_reason_required",
    });

    const harness = createClientHarness();
    enableClient(harness.client);
    harness.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "read failed" } });
    await expect(removePrivateProofUploadForSupabase(removalForm())).resolves.toMatchObject({
      code: "server_error",
    });

    harness.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(removePrivateProofUploadForSupabase(removalForm())).resolves.toMatchObject({
      code: "evidence_not_found",
    });

    harness.maybeSingle.mockResolvedValueOnce({
      data: { submitted_by_user_id: "someone-else", storage_path: storagePath },
      error: null,
    });
    await expect(removePrivateProofUploadForSupabase(removalForm())).resolves.toMatchObject({
      code: "permission_denied",
    });
  });

  it("handles metadata-only rows, Storage errors, RPC errors, and audited removal", async () => {
    const harness = createClientHarness();
    enableClient(harness.client);
    harness.maybeSingle.mockResolvedValueOnce({
      data: { submitted_by_user_id: "submitter-1", storage_path: null },
      error: null,
    });
    await expect(removePrivateProofUploadForSupabase(removalForm())).resolves.toMatchObject({
      code: "upload_not_present",
    });

    harness.maybeSingle.mockResolvedValue({
      data: { submitted_by_user_id: "submitter-1", storage_path: storagePath },
      error: null,
    });
    harness.remove.mockResolvedValueOnce({ error: { message: "remove failed" } });
    await expect(removePrivateProofUploadForSupabase(removalForm())).resolves.toMatchObject({
      code: "server_error",
    });

    harness.remove.mockResolvedValue({ error: null });
    harness.rpc.mockResolvedValueOnce({ data: null, error: { code: "42501" } });
    await expect(removePrivateProofUploadForSupabase(removalForm())).resolves.toMatchObject({
      code: "permission_denied",
    });

    harness.rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(removePrivateProofUploadForSupabase(removalForm())).resolves.toMatchObject({
      code: "server_error",
    });

    harness.rpc.mockResolvedValueOnce({ data: [{ removed_storage_path: storagePath }], error: null });
    await expect(removePrivateProofUploadForSupabase(removalForm())).resolves.toMatchObject({
      success: true,
      code: "upload_removed",
    });
  });

  it("redirects removal actions with the safe result code", async () => {
    const harness = createClientHarness();
    enableClient(harness.client);
    harness.maybeSingle.mockResolvedValue({
      data: { submitted_by_user_id: "submitter-1", storage_path: storagePath },
      error: null,
    });
    harness.remove.mockResolvedValue({ error: null });
    harness.rpc.mockResolvedValue({ data: [{ removed_storage_path: storagePath }], error: null });

    await expect(removePrivateProofUploadAction(removalForm())).rejects.toThrow(
      "NEXT_REDIRECT:/proof-library/upload?proofUploadResult=upload_removed",
    );
  });
});

function enableClient(client: object) {
  mocks.createLocalSupabaseServerClient.mockResolvedValue({
    client,
    config: { reason: "Auth ready." },
  });
}

function removalForm(reason = "Remove this TEST private proof file.") {
  const formData = new FormData();
  formData.set("evidenceItemId", evidenceItemId);
  formData.set("removalReason", reason);
  return formData;
}

function createClientHarness() {
  const rpc = vi.fn();
  const createSignedUploadUrl = vi.fn();
  const remove = vi.fn();
  const list = vi.fn();
  const maybeSingle = vi.fn();
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle,
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  const schema = vi.fn(() => ({
    rpc,
    from: vi.fn(() => query),
  }));
  const storageFrom = vi.fn(() => ({ createSignedUploadUrl, remove, list }));

  return {
    client: { schema, storage: { from: storageFrom } },
    rpc,
    createSignedUploadUrl,
    remove,
    list,
    maybeSingle,
  };
}
