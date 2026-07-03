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

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("root page", () => {
  it("sends signed-out reviewers to the single login page", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: RootPage } = await import("@/app/page");

    await expect(RootPage()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("routes signed-in members to /app", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: RootPage } = await import("@/app/page");

    await expect(RootPage()).rejects.toThrow("NEXT_REDIRECT:/app");
  });

  it("routes signed-in leaders and staff to their owned workspaces", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const { default: RootPage } = await import("@/app/page");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    await expect(RootPage()).rejects.toThrow("NEXT_REDIRECT:/leader?view=overview");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );
    await expect(RootPage()).rejects.toThrow("NEXT_REDIRECT:/staff?view=chapters");
  });
});
