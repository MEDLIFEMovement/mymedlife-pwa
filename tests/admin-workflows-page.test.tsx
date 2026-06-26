import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/workflows",
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

describe("admin workflows page", () => {
  it("keeps workflow section and selected item state on the same route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing workflow registry page."),
    );

    const { default: AdminWorkflowsPage } = await import("@/app/admin/workflows/page");
    const html = renderToStaticMarkup(
      await AdminWorkflowsPage({
        searchParams: Promise.resolve({
          section: "writes",
          focus: "evidence_submitted",
        }),
      }),
    );

    expect(html).toContain("Registry controls");
    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin/permissions"');
    expect(html).toContain('href="/admin/committees"');
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=steps"');
    expect(html).toContain("Write sequence");
    expect(html).toContain("Selected in registry");
    expect(html).toContain("Member submits proof/testimonial metadata");
    expect(html).toContain("Workflow inventory");
    expect(html).toContain("planning-goal-setting");
    expect(html).toContain("needs permissions resolution");
    expect(html).toContain("needs source clarification");
    expect(html).toContain('href="/admin/workflows"');
    expect(html).toContain('href="/admin/workflows?section=writes&amp;focus=evidence_submitted"');
    expect(html).toContain("Selected</a>");
    expect(html).toContain("Open in registry");
    expect(html).toContain("Open SOP builder");
  });
});
