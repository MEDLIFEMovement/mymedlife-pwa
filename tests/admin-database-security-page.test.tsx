import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/database-security",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

describe("admin database security page", () => {
  it("keeps the database decision surface inside the backend route family", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );

    const { default: AdminDatabaseSecurityPage } = await import("@/app/admin/database-security/page");
    const html = renderToStaticMarkup(await AdminDatabaseSecurityPage());

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
    expect(html).toContain("Database security");
    expect(html).toContain("Supabase Postgres");
  });
});
