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

describe("rush month page", () => {
  it("parks members on the member home instead of opening a separate Rush Month shell", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: RushMonthPage } = await import("@/app/rush-month/page");

    await expect(RushMonthPage()).rejects.toThrow("NEXT_REDIRECT:/app");
  });

  it("parks leaders and staff on their owned home surfaces", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const { default: RushMonthPage } = await import("@/app/rush-month/page");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    await expect(RushMonthPage()).rejects.toThrow("NEXT_REDIRECT:/leader?view=overview");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    await expect(RushMonthPage()).rejects.toThrow("NEXT_REDIRECT:/staff?view=chapters");
  });
});
