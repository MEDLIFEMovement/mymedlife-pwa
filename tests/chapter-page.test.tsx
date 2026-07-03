import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/chapter",
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

describe("chapter page", () => {
  it("parks members back to the owned member shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    await expect(ChapterPage({})).rejects.toThrow("NEXT_REDIRECT:/app");
  });

  it("parks coaches back to the owned staff shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("coach@mymedlife.test"),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    await expect(ChapterPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/staff?view=chapters",
    );
  });

  it("parks DS Admin back to admin", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    await expect(ChapterPage({})).rejects.toThrow("NEXT_REDIRECT:/admin");
  });

  it("parks the default leader chapter route into the leader overview shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    await expect(ChapterPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/leader?view=overview",
    );
  });

  it("preserves useful leader query context when parking old chapter views", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    await expect(
      ChapterPage({
        searchParams: Promise.resolve({
          view: "member_profile",
          member: "member-ivy",
          pipeline: "follow_up",
          q: "Ivy",
          quickAction: "assign_action",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/leader?view=member_profile&member=member-ivy&pipeline=follow_up&q=Ivy&quickAction=assign_action",
    );
  });

  it("keeps parked story and bridge views pointed at the leader shell instead of the legacy chapter shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");
    await expect(
      ChapterPage({
        searchParams: Promise.resolve({
          view: "bridge_videos",
          bridge: "comms",
          bridgeVideo: "bridge-social-strategy",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/leader?view=bridge_videos&bridge=comms&bridgeVideo=bridge-social-strategy",
    );
  });

  it("sends signed-out reviewers to login before opening the parked chapter route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: ChapterPage } = await import("@/app/chapter/page");

    await expect(ChapterPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fchapter",
    );
  });
});
