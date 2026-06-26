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
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=steps"');
    expect(html).toContain("Campaign lane coverage");
    expect(html).toContain("Selected in registry");
    expect(html).toContain("Rush Month");
    expect(html).toContain('href="/admin/committees"');
    expect(html).toContain('href="/admin/committees?section=campaigns&amp;focus=rush-month"');
    expect(html).toContain("Selected</a>");
    expect(html).toContain("Open campaign");
    expect(html).toContain("Open SOP builder");
    expect(html).toContain("Review template link");
    expect(html).toContain("Current workflow state");
    expect(html).toContain("v2.1");
    expect(html).toContain("source template version");
  });

  it("keeps committee configuration review on the same route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing committee config state."),
    );

    const { default: AdminCommitteesPage } = await import("@/app/admin/committees/page");
    const html = renderToStaticMarkup(
      await AdminCommitteesPage({
        searchParams: Promise.resolve({
          section: "campaigns",
          focus: "rush-month",
          mode: "template_link",
        }),
      }),
    );

    expect(html).toContain("Mock-safe configuration");
    expect(html).toContain("Mock-safe campaign link config");
    expect(html).toContain("Workflow source");
    expect(html).toContain("v2.1 · template version");
    expect(html).toContain("Return to registry");
    expect(html).toContain(
      'href="/admin/committees?section=campaigns&amp;focus=rush-month"',
    );
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=steps"');
    expect(html).toContain('href="/campaigns/rush-month"');
    expect(html).toContain(
      'href="/admin/sop-builder/rush-month?tab=version&amp;focus=proposal-campaign-link-rush-month"',
    );
    expect(html).toContain("Open proposal in builder");
  });
});
