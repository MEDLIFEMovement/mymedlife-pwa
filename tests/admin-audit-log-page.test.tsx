import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/audit-log",
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

describe("admin audit log page", () => {
  it("can focus the page on staging Luma pilot audit evidence", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("super.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue({
      ...dataModule.getMockReadOnlyAppData("Testing focused audit page."),
      auditLogs: [
        {
          id: "luma-audit",
          actor_user_id: "pilot-user",
          chapter_id: "chapter-1",
          action: "luma_attendance_import_recorded",
          target_table: "chapter_events",
          target_id: "chapter-event-1",
          before_value: null,
          after_value: { attendanceCount: 1 },
          reason: "Recorded the staging Luma attendance proof in app tables.",
          created_at: "2026-06-29T11:09:00.000Z",
        },
        {
          id: "generic-audit",
          actor_user_id: "admin-user",
          chapter_id: "chapter-1",
          action: "proof_submitted",
          target_table: "evidence_items",
          target_id: "evidence-1",
          before_value: null,
          after_value: { status: "pending_review" },
          reason: "Generic proof review.",
          created_at: "2026-06-17T00:00:00.000Z",
        },
      ],
    });

    const { default: AdminAuditLogPage } = await import("@/app/admin/audit-log/page");
    const html = renderToStaticMarkup(
      await AdminAuditLogPage({
        searchParams: Promise.resolve({ source: "luma-live-pilot" }),
      }),
    );

    expect(html).toContain("Current focus");
    expect(html).toContain("Staging Luma pilot");
    expect(html).toContain("blocked-send evidence tied to the pilot loop");
    expect(html).toContain('href="/admin/integration-outbox?source=luma-live-pilot"');
    expect(html).toContain("Open matching outbox rows");
    expect(html).toContain("Visible rows");
    expect(html).toContain("luma attendance import recorded");
    expect(html).not.toContain("proof_submitted");
  });
});
