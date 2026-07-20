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
  it("renders the private upload route with explicit publishing and export guards", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: ProofLibraryUploadPage } = await import("@/app/proof-library/upload/page");
    const html = renderToStaticMarkup(await ProofLibraryUploadPage({}));

    expect(html).toContain("Private proof upload");
    expect(html).toContain("Attach source media for private MEDLIFE review");
    expect(html).toContain("Uploads locked");
    expect(html).toContain("No public publishing");
    expect(html).toContain("No external exports");
    expect(html).toContain("MEDLIFE review consent is mandatory");
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

  it("labels the production private upload lane as live without widening publishing claims", async () => {
    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "production_supabase");
    vi.stubEnv("MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE", "true");
    vi.stubEnv("MYMEDLIFE_ALLOW_PRODUCTION_PRIVATE_PROOF_UPLOAD_WRITE", "true");

    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("admin@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");
    const html = renderToStaticMarkup(await ProofLibraryPage());

    expect(html).toContain("Mixed live / preview");
    expect(html).toContain("Manage private proof uploads");
    expect(html).toContain("Public publishing and external exports stay off.");
    expect(html).toContain("No publish");

    vi.unstubAllEnvs();
  });

  it("keeps DS Admin out of student proof routes", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");
    const { default: ProofLibraryUploadPage } = await import("@/app/proof-library/upload/page");

    await expect(ProofLibraryPage()).rejects.toThrow("NEXT_REDIRECT:/admin");
    await expect(ProofLibraryUploadPage({})).rejects.toThrow("NEXT_REDIRECT:/admin");
  });
});
