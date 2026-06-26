import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/sop-library",
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

describe("admin SOP library page", () => {
  it("renders route-owned search and filter controls for the library", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP library page."),
    );

    const { default: AdminSopLibraryPage } = await import("@/app/admin/sop-library/page");
    const html = renderToStaticMarkup(
      await AdminSopLibraryPage({
        searchParams: Promise.resolve({
          focus: "rush-month",
          query: "rush",
          status: "draft",
        }),
      }),
    );

    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin/permissions"');
    expect(html).toContain('href="/admin/committees"');
    expect(html).toContain('href="/admin/workflows"');
    expect(html).toContain('href="/admin/sop-library"');
    expect(html).toContain("Campaign SOP Library");
    expect(html).toContain("New Campaign SOP");
    expect(html).toContain("Current library focus");
    expect(html).toContain("Total SOPs");
    expect(html).toContain("In Draft / Scheduled");
    expect(html).toContain("modeled rules");
    expect(html).toContain("Search and filter campaign definitions");
    expect(html).toContain("Apply search");
    expect(html).toContain("Active result set");
    expect(html).toContain("Showing 1 of");
    expect(html).toContain("Search query: rush");
    expect(html).toContain("Status filters");
    expect(html).toContain(">Draft<");
    expect(html).toContain("Rush Month");
    expect(html).toContain("Selected in library");
    expect(html).toContain('href="/admin/sop-library?focus=rush-month&amp;query=rush&amp;status=draft"');
    expect(html).toContain("Selected</a>");
    expect(html).toContain("Builder entry points");
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=steps"');
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=role-matrix"');
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=preview"');
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=version"');
    expect(html).not.toContain("Leadership Transition");
    expect(html).toContain("Last Edited By");
    expect(html).toContain("Last Published");
    expect(html).toContain('/admin/sop-library?focus=rush-month&amp;query=rush&amp;status=draft');
  });

  it("renders structured import review details for Planning / Goal Setting", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP library structured import review."),
    );

    const { default: AdminSopLibraryPage } = await import("@/app/admin/sop-library/page");
    const html = renderToStaticMarkup(
      await AdminSopLibraryPage({
        searchParams: Promise.resolve({
          focus: "planning-goal-setting",
        }),
      }),
    );

    expect(html).toContain("Structured Drafts");
    expect(html).toContain("Review Warnings");
    expect(html).toContain("Structured import review");
    expect(html).toContain("Planning / Goal Setting");
    expect(html).toContain("v0 reviewed");
    expect(html).toContain("draft reviewed");
    expect(html).toContain("package-backed structured draft");
    expect(html).toContain("0 source gaps");
    expect(html).toContain("sources");
    expect(html).toContain("Engine bindings");
    expect(html).toContain("Import traces");
  });

  it("shows repo-defined provenance when a structured draft lacks rollout-package campaign coverage", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP library repo-defined draft review."),
    );

    const { default: AdminSopLibraryPage } = await import("@/app/admin/sop-library/page");
    const html = renderToStaticMarkup(
      await AdminSopLibraryPage({
        searchParams: Promise.resolve({
          focus: "grow-the-movement",
        }),
      }),
    );

    expect(html).toContain("Grow the Movement");
    expect(html).toContain("repo-defined structured draft");
    expect(html).toContain("source gaps");
    expect(html).toContain(
      "still depends on repo-defined campaign artifacts where the rollout package has source gaps",
    );
  });
});
