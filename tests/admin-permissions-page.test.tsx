import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/permissions",
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

describe("admin permissions page", () => {
  it("keeps section and selected persona state on the same route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing permission registry page."),
    );

    const { default: AdminPermissionsPage } = await import("@/app/admin/permissions/page");
    const html = renderToStaticMarkup(
      await AdminPermissionsPage({
        searchParams: Promise.resolve({
          section: "personas",
          focus: "leader.a@mymedlife.test",
        }),
      }),
    );

    expect(html).toContain("Registry controls");
    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin/committees"');
    expect(html).toContain('href="/admin/workflows"');
    expect(html).toContain('href="/admin/sop-library"');
    expect(html).toContain("Local actor registry");
    expect(html).toContain("Selected in registry");
    expect(html).toContain("Priya President");
    expect(html).toContain("Workflow permission inventory");
    expect(html).toContain("planning-goal-setting");
    expect(html).toContain("publish approve");
    expect(html).toContain("permissions matrix missing local copy");
    expect(html).toContain('href="/admin/permissions"');
    expect(html).toContain('href="/admin/permissions?section=personas&amp;focus=leader.a%40mymedlife.test"');
    expect(html).toContain("Review config");
    expect(html).toContain("Selected</a>");
    expect(html).toContain("Open default route");
  });

  it("keeps workflow permission config review on the same route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing workflow permission config state."),
    );

    const { default: AdminPermissionsPage } = await import("@/app/admin/permissions/page");
    const html = renderToStaticMarkup(
      await AdminPermissionsPage({
        searchParams: Promise.resolve({
          section: "routes",
          focus: "admin_backend",
          permission: "planning-goal-setting-publish_approve",
        }),
      }),
    );

    expect(html).toContain("Mock-safe configuration");
    expect(html).toContain("Mock-safe workflow permission config");
    expect(html).toContain("Allowed roles");
    expect(html).toContain("Allowed scopes");
    expect(html).toContain("Return to registry");
    expect(html).toContain(
      'href="/admin/permissions?section=routes&amp;focus=admin_backend"',
    );
    expect(html).toContain(
      'href="/admin/sop-builder/planning-goal-setting?tab=role-matrix"',
    );
    expect(html).toContain(
      'href="/admin/sop-builder/planning-goal-setting?tab=version&amp;focus=proposal-permission-planning-goal-setting-publish_approve"',
    );
    expect(html).toContain("Open proposal in builder");
  });
});
