import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  usePathname: () => "/rush-month/actions",
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

describe("actions page", () => {
  it("returns members to the event-first launch lane instead of opening a separate actions product", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member actions redirect."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");

    await expect(ActionsPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/app/events",
    );
  });

  it("keeps member campaign and home handoffs inside the member events lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member-source actions redirect."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");

    await expect(
      ActionsPage({
        searchParams: Promise.resolve({ source: "campaigns" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app/events?source=campaigns");

    await expect(
      ActionsPage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app/events?source=home");
  });

  it("returns proof-origin member requests to the points lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("committee.member@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing proof-source actions redirect."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");

    await expect(
      ActionsPage({
        searchParams: Promise.resolve({ source: "evidence" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app/points?source=points");
  });

  it("returns leaders to the leader events workspace instead of the shared actions route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader actions redirect."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");

    await expect(
      ActionsPage({
        searchParams: Promise.resolve({
          assignmentId: "member-push",
          source: "leader_follow_up",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/leader?view=events");
  });

  it("returns staff reviewers to the staff events workspace", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff actions redirect."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");

    await expect(
      ActionsPage({
        searchParams: Promise.resolve({
          assignmentId: "member-push",
          source: "first_write_packet",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/staff?view=events&campaign=rush-month");
  });

  it("parks DS admin on the admin backend instead of opening the old actions surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing DS admin actions page."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");
    await expect(
      ActionsPage({
        searchParams: Promise.resolve({
          assignmentId: "member-push",
          source: "proof_metadata_packet",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin");
  });
});
