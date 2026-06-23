import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

describe("rush month page", () => {
  it("keeps the top-level Rush Month route handing members into the owned dashboard entry", async () => {
    const { default: RushMonthPage } = await import("@/app/rush-month/page");

    expect(() => RushMonthPage()).toThrow("NEXT_REDIRECT:/rush-month/dashboard");
  });
});
