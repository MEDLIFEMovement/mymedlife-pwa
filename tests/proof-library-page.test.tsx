import { describe, expect, it, vi } from "vitest";

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
  it("returns members to the points loop instead of opening a proof library side module", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");

    await expect(ProofLibraryPage()).rejects.toThrow(
      "NEXT_REDIRECT:/app/points?source=points",
    );
  });

  it("returns leaders to the leader points workspace", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");

    await expect(ProofLibraryPage()).rejects.toThrow(
      "NEXT_REDIRECT:/leader?view=leaderboard",
    );
  });

  it("returns staff reviewers to the staff points workspace", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");

    await expect(ProofLibraryPage()).rejects.toThrow(
      "NEXT_REDIRECT:/staff?view=leaderboard",
    );
  });
});
