import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/proof-library/upload",
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

describe("proof upload page", () => {
  it("returns members to the points loop instead of the proof-upload prep route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: ProofUploadPage } = await import("@/app/proof-library/upload/page");

    await expect(ProofUploadPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/app/points?source=points",
    );
  });

  it("returns leaders to the leader points workspace instead of the proof-upload prep route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: ProofUploadPage } = await import("@/app/proof-library/upload/page");

    await expect(
      ProofUploadPage({
        searchParams: Promise.resolve({
          source: "chapter_bridge_video",
          returnTo: "/leader?view=bridge_videos",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/leader?view=leaderboard");
  });
});
