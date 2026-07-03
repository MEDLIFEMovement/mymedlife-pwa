import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/rush-month/dashboard",
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

describe("rush month dashboard page", () => {
  it("parks members on the simple member home instead of the older dashboard route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: RushMonthDashboardPage } = await import(
      "@/app/rush-month/dashboard/page"
    );

    await expect(RushMonthDashboardPage()).rejects.toThrow("NEXT_REDIRECT:/app");
  });

  it("parks leaders and staff on their owned home surfaces", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const { default: RushMonthDashboardPage } = await import(
      "@/app/rush-month/dashboard/page"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    await expect(RushMonthDashboardPage()).rejects.toThrow(
      "NEXT_REDIRECT:/leader?view=overview",
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("general.staff@mymedlife.test"),
    );
    await expect(RushMonthDashboardPage()).rejects.toThrow(
      "NEXT_REDIRECT:/staff?view=chapters",
    );
  });
});
