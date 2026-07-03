import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/launch-gate",
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

describe("admin launch gate page", () => {
  it("sends DS reviewers straight to the Luma proof route while hosted points proof is still missing", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing launch-gate Luma next step."),
    );

    const { default: AdminLaunchGatePage } = await import(
      "@/app/admin/launch-gate/page"
    );
    const html = renderToStaticMarkup(await AdminLaunchGatePage());

    expect(html).toContain("Production launch gate");
    expect(html).toContain("Open Luma live pilot");
    expect(html).toContain('href="/admin/luma-live-pilot"');
    expect(html.match(/href="\/admin\/luma-live-pilot"/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("keeps non-DS reviewers on the broader admin readiness path", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing launch-gate staff next step."),
    );

    const { default: AdminLaunchGatePage } = await import(
      "@/app/admin/launch-gate/page"
    );
    const html = renderToStaticMarkup(await AdminLaunchGatePage());

    expect(html).toContain('href="/admin/system-health"');
    expect(html.match(/href="\/admin\/system-health"/g)).toHaveLength(2);
    expect(html.match(/href="\/admin\/luma-live-pilot"/g)).toHaveLength(1);
  });
});
