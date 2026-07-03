import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/campaigns",
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

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("campaigns page", () => {
  it("returns members to the member events loop instead of opening a separate campaigns product", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");

    await expect(CampaignsPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/app/events?source=campaigns",
    );
  });

  it("returns leaders to the leader events workspace instead of the shared campaigns route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");

    await expect(CampaignsPage({})).rejects.toThrow("NEXT_REDIRECT:/leader?view=events");
  });

  it("returns coach and staff reviewers to the staff events workspace", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("coach@mymedlife.test"),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");

    await expect(CampaignsPage({})).rejects.toThrow("NEXT_REDIRECT:/staff?view=events");
  });

  it("keeps DS reviewers inside admin instead of opening the chapter-facing campaign route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");

    await expect(CampaignsPage({})).rejects.toThrow("NEXT_REDIRECT:/admin");
  });

  it("sends signed-out reviewers to login before opening the parked campaigns route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");

    await expect(CampaignsPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fcampaigns",
    );
  });
});
