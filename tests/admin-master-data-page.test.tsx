import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/master-data",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
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
  it("keeps fake users, mock chapter scope, and campaign shells visibly marked as TEST", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "ds.admin@mymedlife.test",
        "Using DS Admin test actor.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing admin master data TEST labels."),
    );

    const { default: AdminMasterDataPage } = await import(
      "@/app/admin/master-data/page"
    );
    const html = renderToStaticMarkup(await AdminMasterDataPage());

    expect(html).toContain("DS Admin master data safety inventory");
    expect(html).toContain("Fake users");
    expect(html).toContain("Chapters");
    expect(html).toContain("Campaign templates");
    expect(html).toContain("Sofia Alvarez");
    expect(html).toContain("Rush Month");
    expect(html).toContain("UCLA MEDLIFE");
    expect(html.match(/>TEST</g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });
});
