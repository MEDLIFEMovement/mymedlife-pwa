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
  usePathname: () => "/rush-month/actions/member-push",
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

describe("member action detail page", () => {
  it("returns members to the member events lane by default", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing default action-detail redirect."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );

    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app/events");
  });

  it("preserves event context by returning members to the specific event detail route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing event-context action-detail redirect."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );

    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          event: "event-rush-social-001",
          source: "home",
          step: "submit",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/app/events/event-rush-social-001?source=home",
    );
  });

  it("returns proof and points handoffs to the leaderboard lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("committee.member@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing points handoff redirect."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );

    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          source: "points",
          step: "submit",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app/points?source=points");

    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          source: "evidence",
          step: "submitted",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app/points?source=points");
  });

  it("returns profile-origin requests to the member profile route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing profile-origin redirect."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );

    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          source: "profile",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/profile");
  });

  it("returns leader and staff roles to their owned event workspaces", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing non-member action-detail redirect."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/leader?view=events");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/staff?view=events&campaign=rush-month");
  });
});
