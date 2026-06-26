import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/proof-library",
  useSearchParams: () => new URLSearchParams(),
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

describe("proof library page", () => {
  it("lets chapter leaders open a product-facing proof library surface", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");
    const html = renderToStaticMarkup(await ProofLibraryPage());

    expect(html).toContain("Proof library");
    expect(html).toContain("Proof exists to break self-limiting beliefs.");
    expect(html).toContain("Open proof requirements");
    expect(html).toContain("Sharing review");
    expect(html).toContain("Chapter proof board");
    expect(html).toContain("Ready for review");
    expect(html).toContain("Internal examples");
    expect(html).toContain("Future stories");
    expect(html).not.toContain("This page is read-only and does not publish anything.");
    expect(html).not.toContain("Preview proof upload requirements");
    expect(html).not.toContain("HQ sharing posture");
  });

  it("routes coaches into the coach-owned proof review state", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");

    await expect(ProofLibraryPage()).rejects.toThrow(
      "NEXT_REDIRECT:/staff?view=support_notes#support-notes",
    );
  });

  it("routes staff reviewers into the staff-owned proof review state", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");

    await expect(ProofLibraryPage()).rejects.toThrow("NEXT_REDIRECT:/staff?view=proof_ugc");
  });
});
