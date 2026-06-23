import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/integration-outbox",
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

describe("admin integration outbox page", () => {
  it("keeps the outbox review surface inside the backend route family", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing integration outbox page."),
    );

    const { default: AdminIntegrationOutboxPage } = await import("@/app/admin/integration-outbox/page");
    const html = renderToStaticMarkup(await AdminIntegrationOutboxPage());

    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin"');
    expect(html).toContain('href="/admin/permissions"');
    expect(html).toContain('href="/admin/committees"');
    expect(html).toContain('href="/admin/workflows"');
    expect(html).toContain('href="/admin/integration-outbox"');
    expect(html).toContain('href="/admin/database-security"');
    expect(html).toContain('href="/admin/system-health"');
    expect(html).toContain('href="/admin/sop-library"');
    expect(html).toContain('href="/admin/master-data"');
    expect(html).toContain("Admin integration outbox");
    expect(html).toContain("outbox review");
  });
});
