import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/rush-month/review",
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

describe("rush month review page", () => {
  it("parks leaders on the leader events workspace instead of the older review lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: ReviewPage } = await import("@/app/rush-month/review/page");

    await expect(ReviewPage()).rejects.toThrow("NEXT_REDIRECT:/leader?view=events");
  });

  it("parks member, staff, and admin review traffic back into the launch lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const { default: ReviewPage } = await import("@/app/rush-month/review/page");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    await expect(ReviewPage()).rejects.toThrow("NEXT_REDIRECT:/app/events");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );
    await expect(ReviewPage()).rejects.toThrow("NEXT_REDIRECT:/staff?view=events");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("super.admin@mymedlife.test"),
    );
    await expect(ReviewPage()).rejects.toThrow("NEXT_REDIRECT:/admin");
  });

  it("sends signed-out reviewers to login before opening the parked review route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: ReviewPage } = await import("@/app/rush-month/review/page");

    await expect(ReviewPage()).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Frush-month%2Freview",
    );
  });
});
