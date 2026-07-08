import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/system-health",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("@/app/login/actions", () => ({
  signOut: async () => undefined,
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

async function primeActor(email: string, sourceNote: string) {
  const actorModule = await import("@/services/local-actor-context");
  const dataModule = await import("@/services/read-only-app-data");

  vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(getSignedInActor(email));
  vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
    getMockReadOnlyAppData(sourceNote),
  );
}

describe("admin review route pages", () => {
  it("keeps system health inside the visible DS Admin shell family", async () => {
    await primeActor("ds.admin@mymedlife.test", "Testing system health shell continuity.");

    const { default: AdminSystemHealthPage } = await import(
      "@/app/admin/system-health/page"
    );
    const html = renderToStaticMarkup(await AdminSystemHealthPage());

    expect(html).toContain("myMEDLIFE DS Admin shell");
    expect(html).toContain("Command Center review route");
    expect(html).toContain("Return to Command Center");
    expect(html).toContain(">Overview<");
    expect(html).toContain(">Users<");
    expect(html).toContain(">Chapters<");
    expect(html).toContain(">Modules<");
    expect(html).toContain(">Luma Events<");
    expect(html).toContain(">Points<");
    expect(html).toContain(">Integrations<");
    expect(html).toContain(">Audit Logs<");
    expect(html).toContain(">System Health<");
    expect(html).toContain(">API Keys<");
    expect(html).toContain(">MCP Connections<");
    expect(html).toContain(">Settings<");
  });

  it("keeps audit log review inside the visible DS Admin shell family", async () => {
    await primeActor("admin@mymedlife.test", "Testing audit log shell continuity.");

    const { default: AdminAuditLogPage } = await import("@/app/admin/audit-log/page");
    const html = renderToStaticMarkup(await AdminAuditLogPage());

    expect(html).toContain("myMEDLIFE DS Admin shell");
    expect(html).toContain("Command Center review route");
    expect(html).toContain("Return to Command Center");
    expect(html).toContain(">Overview<");
    expect(html).toContain(">Users<");
    expect(html).toContain(">Chapters<");
    expect(html).toContain(">Modules<");
    expect(html).toContain(">Luma Events<");
    expect(html).toContain(">Points<");
    expect(html).toContain(">Integrations<");
    expect(html).toContain(">Audit Logs<");
    expect(html).toContain(">System Health<");
    expect(html).toContain(">API Keys<");
    expect(html).toContain(">MCP Connections<");
    expect(html).toContain(">Settings<");
  });
});
