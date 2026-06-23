import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/committees",
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

describe("admin committees page", () => {
  it("keeps committee section and selected item state on the same route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing committee registry page."),
    );

    const { default: AdminCommitteesPage } = await import("@/app/admin/committees/page");
    const html = renderToStaticMarkup(
      await AdminCommitteesPage({
        searchParams: Promise.resolve({
          section: "campaigns",
          focus: "rush-month",
        }),
      }),
    );

    expect(html).toContain("Registry controls");
    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin/permissions"');
    expect(html).toContain('href="/admin/workflows"');
    expect(html).toContain('href="/admin/sop-library"');
    expect(html).toContain("Campaign lane coverage");
    expect(html).toContain("Selected in registry");
    expect(html).toContain("Rush Month");
    expect(html).toContain('href="/admin/committees"');
    expect(html).toContain('href="/admin/committees?section=campaigns&amp;focus=rush-month"');
    expect(html).toContain("Selected</a>");
    expect(html).toContain("Open campaign");
    expect(html).toContain("Open SOP builder");
  });
});
