import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/rush-month/loop",
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

describe("rush month loop page", () => {
  it("parks members on the event list instead of the older operating-loop surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: RushMonthLoopPage } = await import("@/app/rush-month/loop/page");

    await expect(RushMonthLoopPage()).rejects.toThrow(
      "NEXT_REDIRECT:/app/events",
    );
  });

  it("parks leaders and admins back in their owned launch-lane surfaces", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const { default: RushMonthLoopPage } = await import("@/app/rush-month/loop/page");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    await expect(RushMonthLoopPage()).rejects.toThrow("NEXT_REDIRECT:/leader?view=events");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    await expect(RushMonthLoopPage()).rejects.toThrow("NEXT_REDIRECT:/admin");
  });
});
