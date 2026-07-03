import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/campaigns/rush-month",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
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

describe("campaign detail page", () => {
  it("returns members to the member events loop instead of opening campaign detail", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: CampaignDetailPage } = await import("@/app/campaigns/[campaignSlug]/page");

    await expect(
      CampaignDetailPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app/events?source=campaigns");
  });

  it("returns leaders to the leader events workspace instead of opening campaign detail", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: CampaignDetailPage } = await import("@/app/campaigns/[campaignSlug]/page");

    await expect(
      CampaignDetailPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/leader?view=events");
  });

  it("preserves the selected campaign when staff enters through a legacy campaign detail url", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("admin@mymedlife.test"),
    );

    const { default: CampaignDetailPage } = await import("@/app/campaigns/[campaignSlug]/page");

    await expect(
      CampaignDetailPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/staff?view=events&campaign=rush-month");
  });

  it("sends signed-out reviewers to login before opening parked campaign detail", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: CampaignDetailPage } = await import("@/app/campaigns/[campaignSlug]/page");

    await expect(
      CampaignDetailPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/login?redirectTo=%2Fcampaigns%2Frush-month");
  });
});
