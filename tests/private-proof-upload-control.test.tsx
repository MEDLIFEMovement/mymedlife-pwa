// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  createClient: vi.fn(),
  uploadToSignedUrl: vi.fn(),
  preparePrivateProofUploadForSupabase: vi.fn(),
  discardPreparedPrivateProofUploadForSupabase: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
vi.mock("@/app/proof-library/upload/actions", () => ({
  preparePrivateProofUploadForSupabase:
    mocks.preparePrivateProofUploadForSupabase,
  discardPreparedPrivateProofUploadForSupabase:
    mocks.discardPreparedPrivateProofUploadForSupabase,
}));

import { PrivateProofUploadControl } from "@/components/private-proof-upload-control";

const evidenceItemId = "60000000-0000-4000-8000-000000000004";
const storagePath =
  "chapters/50000000-0000-4000-8000-000000000001/evidence/60000000-0000-4000-8000-000000000004/TEST-proof.png";
const prepared = {
  success: true,
  evidenceItemId,
  bucket: "proof-submissions-private",
  storagePath,
  uploadToken: "signed-token",
  input: {
    evidenceItemId,
    fileName: "TEST-proof.png",
    mimeType: "image/png",
    byteSize: 24,
    consentToMedlifeReview: true,
    consentToFutureSharing: false,
  },
};

describe("PrivateProofUploadControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installFormDataFileBridge();
    mocks.createClient.mockReturnValue({
      storage: {
        from: vi.fn(() => ({ uploadToSignedUrl: mocks.uploadToSignedUrl })),
      },
    });
    mocks.preparePrivateProofUploadForSupabase.mockResolvedValue(prepared);
    mocks.uploadToSignedUrl.mockResolvedValue({ error: null });
    mocks.discardPreparedPrivateProofUploadForSupabase.mockResolvedValue({
      success: true,
      plainEnglishMessage: "Interrupted upload removed.",
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the locked state without interactive controls", () => {
    renderControl(false);

    expect(
      (screen.getByRole("button", { name: "Upload locked" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect((screen.getByLabelText("Raw proof file") as HTMLInputElement).disabled).toBe(
      true,
    );
    expect(
      (screen.getByLabelText("Future sharing consent") as HTMLSelectElement)
        .disabled,
    ).toBe(true);
  });

  it("requires a selected file before preparing an upload", async () => {
    renderControl();
    fireEvent.submit(screen.getByRole("button", { name: "Upload private proof" }).closest("form")!);

    expect((await screen.findByRole("status")).textContent).toContain(
      "Choose one private proof file before uploading.",
    );
    expect(mocks.preparePrivateProofUploadForSupabase).not.toHaveBeenCalled();
  });

  it("uploads, finalizes, resets, and navigates to success readback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          code: "proof_uploaded",
          evidenceItemId,
          eventId: "event-1",
          integrationEventId: "integration-1",
          outboxId: "outbox-1",
          auditLogId: "audit-1",
          plainEnglishMessage: "Uploaded.",
        }),
      }),
    );
    renderControl();
    selectFileAndConsent();
    fireEvent.submit(screen.getByRole("button", { name: "Upload private proof" }).closest("form")!);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(
        "/proof-library/upload?proofUploadResult=proof_uploaded",
      );
    });
    expect(mocks.refresh).toHaveBeenCalled();
    expect(mocks.uploadToSignedUrl).toHaveBeenCalledWith(
      storagePath,
      "signed-token",
      expect.any(File),
      { contentType: "image/png", upsert: false },
    );
  });

  it("shows preparation refusal without uploading", async () => {
    mocks.preparePrivateProofUploadForSupabase.mockResolvedValue({
      success: false,
      code: "permission_denied",
      plainEnglishMessage: "This proof row is not upload eligible.",
    });
    renderControl();
    selectFileAndConsent();
    fireEvent.submit(screen.getByRole("button", { name: "Upload private proof" }).closest("form")!);

    expect((await screen.findByRole("status")).textContent).toContain(
      "This proof row is not upload eligible.",
    );
    expect(mocks.uploadToSignedUrl).not.toHaveBeenCalled();
  });

  it("shows a direct Storage error without calling finalization", async () => {
    mocks.uploadToSignedUrl.mockResolvedValue({ error: { message: "Storage refused." } });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderControl();
    selectFileAndConsent();
    fireEvent.submit(screen.getByRole("button", { name: "Upload private proof" }).closest("form")!);

    expect((await screen.findByRole("status")).textContent).toContain(
      "The private file could not be uploaded: Storage refused.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("removes the uncommitted object after controlled finalization failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          code: "permission_denied",
          evidenceItemId,
          plainEnglishMessage: "Finalization refused.",
        }),
      }),
    );
    renderControl();
    selectFileAndConsent();
    fireEvent.submit(screen.getByRole("button", { name: "Upload private proof" }).closest("form")!);

    expect((await screen.findByRole("status")).textContent).toContain(
      "Finalization refused. The uncommitted private object was removed.",
    );
    expect(mocks.discardPreparedPrivateProofUploadForSupabase).toHaveBeenCalled();
  });

  it("reports cleanup posture after an interrupted finalization request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network interrupted")));
    renderControl();
    selectFileAndConsent();
    fireEvent.submit(screen.getByRole("button", { name: "Upload private proof" }).closest("form")!);

    expect((await screen.findByRole("status")).textContent).toContain(
      "The upload was interrupted and its private storage object was removed.",
    );
    expect(mocks.discardPreparedPrivateProofUploadForSupabase).toHaveBeenCalled();
  });
});

function renderControl(canUpload = true) {
  return render(
    <PrivateProofUploadControl
      evidenceItemId={evidenceItemId}
      canUpload={canUpload}
      allowedMimeTypes={["image/png"]}
      supabaseUrl="https://project.supabase.co"
      supabasePublishableKey="publishable-key"
    />,
  );
}

function selectFileAndConsent() {
  const file = new File(["TEST private proof bytes"], "TEST-proof.png", {
    type: "image/png",
  });
  fireEvent.change(screen.getByLabelText("Raw proof file"), {
    target: { files: [file] },
  });
  fireEvent.change(screen.getByLabelText("Future sharing consent"), {
    target: { value: "declined" },
  });
  fireEvent.click(
    screen.getByLabelText(
      "I confirm this file may be stored privately for MEDLIFE review only.",
    ),
  );
}

function installFormDataFileBridge() {
  const NativeFormData = FormData;

  class FormDataWithSelectedFiles extends NativeFormData {
    constructor(form?: HTMLFormElement) {
      super();
      if (!form) {
        return;
      }

      for (const field of Array.from(form.elements)) {
        if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) {
          continue;
        }
        if (!field.name || field.disabled) {
          continue;
        }
        if (field instanceof HTMLInputElement && field.type === "file") {
          const file = field.files?.[0];
          if (file) {
            this.append(field.name, file);
          }
          continue;
        }
        if (
          field instanceof HTMLInputElement &&
          (field.type === "checkbox" || field.type === "radio") &&
          !field.checked
        ) {
          continue;
        }
        this.append(field.name, field.value);
      }
    }
  }

  vi.stubGlobal("FormData", FormDataWithSelectedFiles);
}
