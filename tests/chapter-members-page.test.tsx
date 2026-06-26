import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/chapter/members",
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

describe("chapter members page", () => {
  it("returns members to student home when the membership route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing blocked chapter membership page."),
    );

    const { default: ChapterMembersPage } = await import("@/app/chapter/members/page");
    const html = renderToStaticMarkup(await ChapterMembersPage({}));

    expect(html).toContain('href="/app"');
    expect(html).toContain(">Open student home<");
  });

  it("keeps DS Admin on admin safety when the membership route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing DS-blocked chapter membership page."),
    );

    const { default: ChapterMembersPage } = await import("@/app/chapter/members/page");
    const html = renderToStaticMarkup(await ChapterMembersPage({}));

    expect(html).toContain('href="/admin"');
    expect(html).toContain(">Open integration safety<");
  });

  it("opens the membership handoff route with roster follow-up, approval packet, and local review posture", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter membership page."),
    );

    const { default: ChapterMembersPage } = await import("@/app/chapter/members/page");
    const html = renderToStaticMarkup(await ChapterMembersPage({}));

    expect(html).toContain("Keep chapter coverage clear before the next growth push.");
    expect(html).toContain("Join approval preview");
    expect(html).toContain("First join approval preview");
    expect(html).toContain("Decision outcomes");
    expect(html).toContain("Roster follow-up");
    expect(html).toContain("Join requests");
    expect(html).toContain("Preview data");
    expect(html).not.toContain("Local membership approval");
    expect(html).not.toContain("Goal 160 membership approval packet");
    expect(html).not.toContain("Goal 161 membership approval result states");
    expect(html).not.toContain("localhost preview only");
  });
});
