import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
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

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("admin page", () => {
  it("returns members to their owned student surface when the admin route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
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
      getSignedInActor("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing admin overview page."),
    );

    const { default: AdminPage } = await import("@/app/admin/page");
    const html = renderToStaticMarkup(await AdminPage());

    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin"');
    expect(html).toContain("Event loop");
    expect(html).toContain("Luma event creation, RSVP, attendance, and points stay app-owned.");
    expect(html).toContain('href="/admin/luma-live-pilot"');
    expect(html).toContain('href="/admin/integration-outbox"');
    expect(html).toContain('href="/admin/audit-log"');
    expect(html).toContain('href="/admin/launch-gate"');
    expect(html).toContain('href="/admin/pilot-scope"');
    expect(html).toContain(">Overview<");
    expect(html).toContain("DS and Super Admin context is role-aware and read-only.");
    expect(html).toContain("What this admin surface actually owns");
    expect(html).toContain("Keep this overview narrow while the launch lane is active");
    expect(html).toContain("Review the loop, not the whole platform");
    expect(html).toContain("Review in this order");
    expect(html).toContain("Keep the reviewer path human-sized");
    expect(html).toContain("Hidden on purpose");
    expect(html).toContain("Broader modules stay out of the way for now");
    expect(html).toContain("Luma Pilot");
    expect(html).toContain("Integration Outbox");
    expect(html).toContain("Audit Log");
    expect(html).toContain("Production Launch Gate");
    expect(html).toContain("Pilot Scope");
    expect(html).toContain("Events + Points");
    expect(html).toContain("SOP Builder");
    expect(html).toContain("Feature flags");
    expect(html).toContain("Non-approved integrations");
    expect(html).not.toContain("Role-routed internal context only.");
    expect(html).not.toContain("System health placeholders");
  });
});
