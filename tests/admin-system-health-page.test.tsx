import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/system-health",
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

describe("admin system health page", () => {
  it("keeps the health review surface inside the backend route family", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing system health page."),
    );

    const { default: AdminSystemHealthPage } = await import("@/app/admin/system-health/page");
    const html = renderToStaticMarkup(await AdminSystemHealthPage());

    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin"');
    expect(html).toContain('href="/admin/permissions"');
    expect(html).toContain('href="/admin/committees"');
    expect(html).toContain('href="/admin/workflows"');
    expect(html).toContain('href="/admin/integration-outbox"');
    expect(html).toContain('href="/admin/database-security"');
    expect(html).toContain('href="/admin/system-health"');
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=steps"');
    expect(html).toContain('href="/admin/sop-library"');
    expect(html).toContain('href="/admin/master-data"');
    expect(html).toContain("Admin system health");
    expect(html).toContain("health review");
    expect(html).toContain('href="/admin/operations"');
    expect(html).not.toContain('href="/admin/integrations"');
  });

  it("shows the integrations lane for DS admin reviewers on the same backend route family", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing DS system health page."),
    );

    const { default: AdminSystemHealthPage } = await import("@/app/admin/system-health/page");
    const html = renderToStaticMarkup(await AdminSystemHealthPage());

    expect(html).toContain('href="/admin/integrations"');
    expect(html).toContain('href="/admin/system-health"');
  });
});
