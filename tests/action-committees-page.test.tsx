import { describe, expect, it, vi } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/action-committees",
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

describe("action committees page", () => {
  it("parks leaders back into the leader events lane", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: ActionCommitteesPage } = await import("@/app/action-committees/page");

    await expect(ActionCommitteesPage()).rejects.toThrow(
      "NEXT_REDIRECT:/leader?view=events",
    );
  });

  it("parks members back into the member events lane", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: ActionCommitteesPage } = await import("@/app/action-committees/page");

    await expect(ActionCommitteesPage()).rejects.toThrow(
      "NEXT_REDIRECT:/app/events",
    );
  });

  it("sends signed-out reviewers to login before opening the parked action-committees route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: ActionCommitteesPage } = await import("@/app/action-committees/page");

    await expect(ActionCommitteesPage()).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Faction-committees",
    );
  });
});
