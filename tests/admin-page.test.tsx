import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
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

describe("admin page", () => {
  it("keeps the backend overview inside the same owned admin route family", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing admin overview page."),
    );

    const { default: AdminPage } = await import("@/app/admin/page");
    const html = renderToStaticMarkup(await AdminPage());

    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin"');
    expect(html).toContain('href="/admin/permissions"');
    expect(html).toContain('href="/admin/committees"');
    expect(html).toContain('href="/admin/workflows"');
    expect(html).toContain('href="/admin/review-path"');
    expect(html).toContain('href="/admin/nick-review"');
    expect(html).toContain('href="/admin/release-readiness"');
    expect(html).toContain('href="/admin/launch-gate"');
    expect(html).toContain('href="/admin/audit-log"');
    expect(html).toContain('href="/admin/operations"');
    expect(html).toContain('href="/admin/sop-library"');
    expect(html).toContain('href="/admin/master-data"');
    expect(html).toContain(">Overview<");
    expect(html).toContain("Staff context is role-aware and read-only.");
    expect(html).toContain("What this admin surface actually owns");
    expect(html).toContain("Permission Registry");
    expect(html).toContain("Committee Registry");
    expect(html).toContain("Workflow Registry");
    expect(html).toContain("Stakeholder Review Path");
    expect(html).toContain("Nick Review Packet");
    expect(html).toContain("Release Readiness");
    expect(html).toContain("Production Launch Gate");
    expect(html).toContain("Audit Log");
    expect(html).toContain("Production Operations");
    expect(html).toContain("SOP Library");
    expect(html).toContain("System health signals");
    expect(html).toContain("4 local checks are visible here.");
    expect(html).not.toContain("System health placeholders");
  });
});
