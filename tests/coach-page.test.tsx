import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/coach",
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

describe("coach page", () => {
  it("returns chapter leaders to the leader workspace instead of the legacy coach route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: CoachPage } = await import("@/app/coach/page");

    await expect(CoachPage({})).rejects.toThrow("NEXT_REDIRECT:/leader?view=overview");
  });

  it("returns DS Admin to admin instead of the legacy coach route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: CoachPage } = await import("@/app/coach/page");

    await expect(CoachPage({})).rejects.toThrow("NEXT_REDIRECT:/admin");
  });

  it("rewrites coach-owned legacy urls into the staff workspace and preserves useful filters", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("coach@mymedlife.test"),
    );

    const { default: CoachPage } = await import("@/app/coach/page");

    await expect(
      CoachPage({
        searchParams: Promise.resolve({
          view: "campaigns",
          chapter: "chapter-ucsd",
          risk: "high",
          source: "member_home",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/staff?view=events&chapter=chapter-ucsd&risk=high&source=member_home",
    );
  });

  it("maps support-notes legacy urls back into the staff chapter view", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("coach@mymedlife.test"),
    );

    const { default: CoachPage } = await import("@/app/coach/page");

    await expect(
      CoachPage({
        searchParams: Promise.resolve({
          view: "support_notes",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/staff?view=chapters");
  });

  it("sends signed-out reviewers to login before opening the parked coach route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );

    const { default: CoachPage } = await import("@/app/coach/page");

    await expect(CoachPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fcoach",
    );
  });
});
