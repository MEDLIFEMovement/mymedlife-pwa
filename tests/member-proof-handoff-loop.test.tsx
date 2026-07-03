import { describe, expect, it, vi } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound should not be called in this test");
  }),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  usePathname: () => "/rush-month/evidence",
  useSearchParams: () => new URLSearchParams(),
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

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("member proof handoff loop", () => {
  it("parks both the old proof queue and the old member proof-submit route back into the points lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member proof handoff."),
    );

    const { default: EvidencePage } = await import("@/app/rush-month/evidence/page");
    await expect(EvidencePage()).rejects.toThrow("NEXT_REDIRECT:/app/events");

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "share-rush-flyer" }),
        searchParams: Promise.resolve({
          source: "evidence",
          step: "submit",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app/points?source=points");

    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "share-rush-flyer" }),
        searchParams: Promise.resolve({
          source: "evidence",
          step: "submitted",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app/points?source=points");
  });
});
