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

function getSignedInMember() {
  return getMockLocalActorContext(
    "member.a@mymedlife.test",
    "Using signed-in member actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("member Figma route pages", () => {
  it("parks the old campaigns route inside the member events launch lane", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(getSignedInMember());

    const { default: CampaignsPage } = await import("@/app/campaigns/page");

    await expect(CampaignsPage()).rejects.toThrow(
      "NEXT_REDIRECT:/app/events?source=campaigns",
    );
  });

  it("parks the old proof library route inside the member points launch lane", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(getSignedInMember());

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");

    await expect(ProofLibraryPage()).rejects.toThrow(
      "NEXT_REDIRECT:/app/points?source=points",
    );
  });
});
