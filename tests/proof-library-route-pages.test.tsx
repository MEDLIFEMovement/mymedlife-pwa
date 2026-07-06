import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("proof library routes", () => {
  it("renders the upload-readiness route with blocked storage and publishing controls", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: ProofLibraryUploadPage } = await import("@/app/proof-library/upload/page");
    const html = renderToStaticMarkup(await ProofLibraryUploadPage());

    expect(html).toContain("Proof upload readiness");
    expect(html).toContain("Prepare your proof upload");
    expect(html).toContain("Uploads stay disabled");
    expect(html).toContain("Upload file");
    expect(html).toContain("Publish proof");
    expect(html).toContain("Export raw proof");
    expect(html).toContain("Goal 159 proof storage intake packet");
  });

  it("renders HQ proof posture for admin reviewers without enabling sharing", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("admin@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");
    const html = renderToStaticMarkup(await ProofLibraryPage());

    expect(html).toContain("HQ proof-sharing review");
    expect(html).toContain("Open HQ review posture");
    expect(html).toContain("Publish now: no");
    expect(html).toContain("No public proof page, warehouse export, n8n workflow, HubSpot, or Luma write happens.");
  });

  it("keeps DS Admin out of student proof routes", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");
    const { default: ProofLibraryUploadPage } = await import("@/app/proof-library/upload/page");

    await expect(ProofLibraryPage()).rejects.toThrow("NEXT_REDIRECT:/admin");
    await expect(ProofLibraryUploadPage()).rejects.toThrow("NEXT_REDIRECT:/admin");
  });
});
