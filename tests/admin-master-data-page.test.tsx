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

  it("hides the workspace for member-facing actors", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "member.a@mymedlife.test",
        "Using member test actor.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing hidden admin master data route."),
    );

    const { default: AdminMasterDataPage } = await import(
      "@/app/admin/master-data/page"
    );
    const html = renderToStaticMarkup(await AdminMasterDataPage());

    expect(html).toContain("Master data hidden for this role");
    expect(html).toContain("Back to Rush Month");
    expect(html).not.toContain("Fake users");
  });

  it("drops the chapter TEST badge when the chapter inventory is read-only live-shaped data", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "super.admin@mymedlife.test",
        "Using Super Admin test actor.",
        "supabase_ready",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue({
      ...getMockReadOnlyAppData("Testing read-only chapter inventory."),
      source: {
        mode: "supabase",
        status: "supabase_ready",
        message: "Local Supabase read-only data.",
      },
    });

    const { default: AdminMasterDataPage } = await import(
      "@/app/admin/master-data/page"
    );
    const html = renderToStaticMarkup(await AdminMasterDataPage());

    expect(html).toContain("Full master data inventory");
    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Rush Month");
    expect(html).toContain("Sofia Alvarez");
    expect(html).toContain(">ready readonly<");
  });
});
