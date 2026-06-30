import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/review-path",
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

describe("admin backend review pages", () => {
  it("keeps the broader review and write-decision routes inside the backend family", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing backend review pages."),
    );

    const pages = [
      ["@/app/admin/phase-2/page", "Phase 2 closeout"],
      ["@/app/admin/review-path/page", "Stakeholder review path"],
      ["@/app/admin/release-readiness/page", "Release readiness"],
      ["@/app/admin/launch-gate/page", "Production launch gate"],
      ["@/app/admin/operations/page", "Production operations"],
      ["@/app/admin/master-data/page", "Admin master data"],
      ["@/app/admin/staff-dry-run/page", "Staff dry run"],
      ["@/app/admin/write-sequence/page", "Write sequence"],
    ] as const;

    for (const [modulePath, heading] of pages) {
      const pageModule = await import(modulePath);
      const html = renderToStaticMarkup(await pageModule.default({}));

      expect(html).toContain("Backend route family");
      expect(html).toContain('href="/admin"');
      expect(html).toContain('href="/admin/phase-2"');
      expect(html).toContain('href="/admin/permissions"');
      expect(html).toContain('href="/admin/committees"');
      expect(html).toContain('href="/admin/workflows"');
      expect(html).toContain('href="/admin/integration-outbox"');
      expect(html).toContain('href="/admin/database-security"');
      expect(html).toContain('href="/admin/system-health"');
      expect(html).toContain('href="/admin/sop-library"');
      expect(html).toContain('href="/admin/master-data"');
      expect(html).toContain('href="/admin/review-path"');
      expect(html).toContain('href="/admin/nick-review"');
      expect(html).toContain('href="/admin/release-readiness"');
      expect(html).toContain('href="/admin/launch-gate"');
      expect(html).toContain('href="/admin/audit-log"');
      expect(html).toContain('href="/admin/operations"');
      expect(html).toContain('href="/admin/design-qa"');
      expect(html).toContain('href="/admin/master-data"');
      expect(html).toContain('href="/admin/staff-dry-run"');
      expect(html).toContain('href="/admin/pilot-scope"');
      expect(html).toContain('href="/admin/first-write"');
      expect(html).toContain('href="/admin/write-sequence"');
      expect(html).toContain('href="/admin/proof-write"');
      expect(html).toContain('href="/admin/hq-proof-write"');
      expect(html).toContain('href="/admin/assignment-write"');
      expect(html).toContain('href="/admin/coach-write"');
      expect(html).toContain('href="/admin/sop-builder/rush-month?tab=steps"');
      expect(html).toContain(heading);

      if (modulePath === "@/app/admin/launch-gate/page") {
        expect(html).toContain("Packet source:");
        expect(html).toContain("Record names-only packet values");
        expect(html).toContain("Recent production packet updates");
        expect(html).toContain("Save packet value");
      }
    }
  });
});
