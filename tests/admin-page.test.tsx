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
  it("returns members to their owned student surface when the admin route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member-blocked admin page."),
    );

    const { default: AdminPage } = await import("@/app/admin/page");
    const html = renderToStaticMarkup(await AdminPage());

    expect(html).toContain("This admin backend is not visible to this role.");
    expect(html).toContain('href="/app"');
    expect(html).toContain(">Go to your app<");
    expect(html).not.toContain("Backend route family");
    expect(html).not.toContain("Admin permission proof");
  });

  it("keeps the backend overview inside the same owned admin route family", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing admin overview page."),
    );

    const { default: AdminPage } = await import("@/app/admin/page");
    const html = renderToStaticMarkup(await AdminPage());

    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin"');
    expect(html).toContain('href="/admin/phase-2"');
    expect(html).toContain("Event loop");
    expect(html).toContain("Luma event creation, RSVP, attendance, and points stay app-owned.");
    expect(html).toContain("Staging-safe link attached");
    expect(html).toContain("feed sharing, member RSVP, attendance, and one points award");
    expect(html).toContain('href="/admin/permissions"');
    expect(html).toContain('href="/admin/committees"');
    expect(html).toContain('href="/admin/workflows"');
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=steps"');
    expect(html).toContain('href="/admin/review-path"');
    expect(html).toContain('href="/admin/nick-review"');
    expect(html).toContain('href="/admin/release-readiness"');
    expect(html).toContain('href="/admin/launch-gate"');
    expect(html).toContain('href="/admin/audit-log"');
    expect(html).toContain('href="/admin/operations"');
    expect(html).toContain('href="/admin/design-qa"');
    expect(html).toContain('href="/admin/staff-dry-run"');
    expect(html).toContain('href="/admin/pilot-scope"');
    expect(html).toContain('href="/admin/first-write"');
    expect(html).toContain('href="/admin/write-sequence"');
    expect(html).toContain('href="/admin/proof-write"');
    expect(html).toContain('href="/admin/hq-proof-write"');
    expect(html).toContain('href="/admin/assignment-write"');
    expect(html).toContain('href="/admin/coach-write"');
    expect(html).toContain('href="/admin/sop-library"');
    expect(html).toContain('href="/admin/master-data"');
    expect(html).toContain(">Overview<");
    expect(html).toContain("DS and Super Admin context is role-aware and read-only.");
    expect(html).toContain("What this admin surface actually owns");
    expect(html).toContain("Permission Registry");
    expect(html).toContain("Workflow Registry");
    expect(html).toContain("SOP Builder");
    expect(html).toContain("Integrations &amp; API Keys");
    expect(html).toContain("Integration Outbox");
    expect(html).toContain("Database Security");
    expect(html).toContain("System Health");
    expect(html).toContain("Master Data");
    expect(html).toContain("First Write Drill");
    expect(html).toContain("Write Sequence");
    expect(html).toContain("Proof Packet");
    expect(html).toContain("HQ Proof Packet");
    expect(html).toContain("Assignment Packet");
    expect(html).toContain("Coach Decision Packet");
    expect(html).toContain("Stakeholder Review Path");
    expect(html).toContain("Live MVP Closeout");
    expect(html).toContain("Nick Review Packet");
    expect(html).toContain("Release Readiness");
    expect(html).toContain("Production Launch Gate");
    expect(html).toContain("Audit Log");
    expect(html).toContain("Production Operations");
    expect(html).toContain("Design QA");
    expect(html).toContain("Staff Dry Run");
    expect(html).toContain("Pilot Scope");
    expect(html).toContain("Write Sequence");
    expect(html).toContain("Coach Decision");
    expect(html).toContain("SOP Library");
    expect(html).toContain("System health signals");
    expect(html).toContain("4 local checks are visible here.");
    expect(html).not.toContain("System health placeholders");
    expect(html).not.toContain("Committee Registry");
  });
});
