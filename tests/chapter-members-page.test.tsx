import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/chapter/members",
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

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/read-only-app-data")>();

  return {
    ...actual,
    getReadOnlyAppData: vi.fn(),
  };
});

describe("chapter members page", () => {
  it("parks members back to student home from the old membership route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: ChapterMembersPage } = await import("@/app/chapter/members/page");
    await expect(ChapterMembersPage({})).rejects.toThrow("NEXT_REDIRECT:/app");
  });

  it("parks DS Admin back to admin from the old membership route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );

    const { default: ChapterMembersPage } = await import("@/app/chapter/members/page");
    await expect(ChapterMembersPage({})).rejects.toThrow("NEXT_REDIRECT:/admin");
  });

  it("parks leaders into the leader member pipeline from the old membership route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: ChapterMembersPage } = await import("@/app/chapter/members/page");
    await expect(ChapterMembersPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/leader?view=members",
    );
  });

  it("parks coach traffic into the staff chapters lane from the old membership route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );

    const { default: ChapterMembersPage } = await import("@/app/chapter/members/page");
    await expect(ChapterMembersPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/staff?view=chapters",
    );
  });
});
