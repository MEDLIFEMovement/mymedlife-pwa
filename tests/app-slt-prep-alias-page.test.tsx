import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

describe("app slt-prep alias page", () => {
  it("parks the member-side slt-prep alias during the events and points launch lane", async () => {
    const { default: AppSltPrepAliasPage } = await import("@/app/app/slt-prep/page");

    await expect(
      AppSltPrepAliasPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app");
  });
});
