import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/master-data",
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

describe("admin master data page", () => {
  it("keeps master data inside the same owned admin backend route family", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing admin master data page."),
    );

    const { default: AdminMasterDataPage } = await import("@/app/admin/master-data/page");
    const html = renderToStaticMarkup(await AdminMasterDataPage());

    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin/master-data"');
    expect(html).toContain('href="/admin/permissions"');
    expect(html).toContain('href="/admin/committees"');
    expect(html).toContain('href="/admin/workflows"');
    expect(html).toContain('href="/admin/sop-library"');
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=steps"');
    expect(html).toContain("Admin master data");
    expect(html).toContain("Admin master data inventory");
    expect(html).toContain("Fake users");
    expect(html).toContain("Named roles");
    expect(html).toContain("Chapters");
    expect(html).toContain("Campaign templates");
    expect(html).toContain("v2.1");
    expect(html).toContain("source template version");
    expect(html).toContain("Current workflow state");
    expect(html).toContain("SOP tooling");
    expect(html).toContain("Open SOP builder");
    expect(html).toContain("Blocked until approval");
  });
});
