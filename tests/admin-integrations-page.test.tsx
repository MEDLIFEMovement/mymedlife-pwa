import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/integrations",
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

describe("admin integrations page", () => {
  it("shows the step-up lock for a signed-in DS admin before secure content opens", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "ds.admin@mymedlife.test",
        "Testing DS integrations lock.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing integrations page."),
    );

    const { default: AdminIntegrationsPage } = await import("@/app/admin/integrations/page");
    const html = renderToStaticMarkup(await AdminIntegrationsPage());

    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin/integrations"');
    expect(html).toContain("Secure access lock");
    expect(html).toContain("Unlock secure area");
    expect(html).not.toContain("Integrations &amp; API Keys</h1>");
  });

  it("blocks general staff from the integrations security area", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing integrations restriction."),
    );

    const { default: AdminIntegrationsPage } = await import("@/app/admin/integrations/page");
    const html = renderToStaticMarkup(await AdminIntegrationsPage());

    expect(html).toContain("Integrations security area is restricted");
    expect(html).toContain("Only DS Admin and Super Admin can open the integrations security area.");
    expect(html).not.toContain("Unlock secure area");
  });
});
