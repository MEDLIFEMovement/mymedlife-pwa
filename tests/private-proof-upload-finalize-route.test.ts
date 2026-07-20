import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  recordPrivateProofUploadForSupabase: vi.fn(),
}));

vi.mock("@/app/proof-library/upload/actions", () => ({
  recordPrivateProofUploadForSupabase: mocks.recordPrivateProofUploadForSupabase,
}));

import { POST } from "@/app/api/proof-library/upload/finalize/route";

const ticket = {
  evidenceItemId: "60000000-0000-4000-8000-000000000004",
  bucket: "proof-submissions-private",
  storagePath:
    "50000000-0000-4000-8000-000000000001/60000000-0000-4000-8000-000000000004/TEST-proof.png",
  input: {
    evidenceItemId: "60000000-0000-4000-8000-000000000004",
    fileName: "TEST-proof.png",
    mimeType: "image/png",
    byteSize: 24,
    consentToMedlifeReview: true,
    consentToFutureSharing: false,
  },
};

describe("private proof upload finalization route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails closed when the browser origin is missing", async () => {
    const response = await POST(
      new Request("https://www.mymedlife.org/api/proof-library/upload/finalize", {
        method: "POST",
        body: JSON.stringify(ticket),
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.recordPrivateProofUploadForSupabase).not.toHaveBeenCalled();
  });

  it("accepts the matching forwarded production host and returns JSON success", async () => {
    mocks.recordPrivateProofUploadForSupabase.mockResolvedValue({
      success: true,
      code: "proof_uploaded",
      evidenceItemId: ticket.evidenceItemId,
      storagePath: ticket.storagePath,
      eventId: "event-1",
      integrationEventId: "integration-event-1",
      outboxId: "outbox-1",
      auditLogId: "audit-1",
      plainEnglishMessage: "Private proof uploaded.",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/proof-library/upload/finalize", {
        method: "POST",
        headers: {
          origin: "https://www.mymedlife.org",
          host: "localhost:3000",
          "x-forwarded-host": "www.mymedlife.org",
          "content-type": "application/json",
        },
        body: JSON.stringify(ticket),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      code: "proof_uploaded",
    });
    expect(mocks.recordPrivateProofUploadForSupabase).toHaveBeenCalledWith(ticket);
  });

  it("rejects malformed JSON before calling the write boundary", async () => {
    const response = await POST(
      new Request("http://127.0.0.1:3010/api/proof-library/upload/finalize", {
        method: "POST",
        headers: {
          origin: "http://127.0.0.1:3010",
          host: "127.0.0.1:3010",
          "content-type": "application/json",
        },
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.recordPrivateProofUploadForSupabase).not.toHaveBeenCalled();
  });

  it("rejects incomplete parsed JSON before calling the write boundary", async () => {
    const response = await POST(
      new Request("http://127.0.0.1:3010/api/proof-library/upload/finalize", {
        method: "POST",
        headers: {
          origin: "http://127.0.0.1:3010",
          host: "127.0.0.1:3010",
          "content-type": "application/json",
        },
        body: JSON.stringify({ evidenceItemId: ticket.evidenceItemId }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.recordPrivateProofUploadForSupabase).not.toHaveBeenCalled();
  });

  it.each([
    ["missing_auth", 401],
    ["permission_denied", 403],
    ["server_error", 500],
    ["duplicate_upload", 400],
  ])("maps %s to HTTP %i", async (code, status) => {
    mocks.recordPrivateProofUploadForSupabase.mockResolvedValue({
      success: false,
      code,
      evidenceItemId: ticket.evidenceItemId,
      plainEnglishMessage: "The finalization was refused.",
    });

    const response = await POST(
      new Request("http://127.0.0.1:3010/api/proof-library/upload/finalize", {
        method: "POST",
        headers: {
          origin: "http://127.0.0.1:3010",
          host: "127.0.0.1:3010",
          "content-type": "application/json",
        },
        body: JSON.stringify(ticket),
      }),
    );

    expect(response.status).toBe(status);
  });
});
