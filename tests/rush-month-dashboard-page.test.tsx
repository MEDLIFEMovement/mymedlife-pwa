import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/rush-month/dashboard",
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

describe("rush month dashboard page", () => {
  it("lets the member dashboard route open with the member campaign surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing dashboard page."),
    );

    const { default: RushMonthDashboardPage } = await import(
      "@/app/rush-month/dashboard/page"
    );
    const html = renderToStaticMarkup(await RushMonthDashboardPage());

    expect(html).toContain("Rush Month");
    expect(html).toContain("Current Phase");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("Invite KPIs");
    expect(html).not.toContain("Why it matters");
  });

  it("treats committee members as part of the member-owned dashboard surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("committee.member@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing committee-member dashboard page."),
    );

    const { default: RushMonthDashboardPage } = await import(
      "@/app/rush-month/dashboard/page"
    );
    const html = renderToStaticMarkup(await RushMonthDashboardPage());

    expect(html).toContain("Rush Month");
    expect(html).toContain("Current Phase");
    expect(html).not.toContain("Invite KPIs");
    expect(html).not.toContain("Why it matters");
  });

  it("routes leader-visible assignment cards back into the broader actions lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader dashboard assignment links."),
    );

    const { default: RushMonthDashboardPage } = await import(
      "@/app/rush-month/dashboard/page"
    );
    const html = renderToStaticMarkup(await RushMonthDashboardPage());

    expect(html).toContain("Visible assignments");
    expect(html).toContain(
      'href="/rush-month/actions?assignmentId=member-push&amp;source=dashboard_assignment_card"',
    );
    expect(html).not.toContain('href="/rush-month/actions/member-push"');
  });
});
