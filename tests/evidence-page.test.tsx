import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/rush-month/evidence",
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

describe("evidence page", () => {
  it("parks members on the event list instead of opening the separate proof product", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: EvidencePage } = await import("@/app/rush-month/evidence/page");

    await expect(EvidencePage()).rejects.toThrow("NEXT_REDIRECT:/app/events");
  });

  it("parks leaders and staff on their owned event surfaces", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const { default: EvidencePage } = await import("@/app/rush-month/evidence/page");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    await expect(EvidencePage()).rejects.toThrow("NEXT_REDIRECT:/leader?view=events");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("coach@mymedlife.test"),
    );
    await expect(EvidencePage()).rejects.toThrow("NEXT_REDIRECT:/staff?view=events&campaign=rush-month");
  });

  it("sends signed-out reviewers to login before opening the parked evidence route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: EvidencePage } = await import("@/app/rush-month/evidence/page");

    await expect(EvidencePage()).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Frush-month%2Fevidence",
    );
  });
});
