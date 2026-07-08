import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/design-qa",
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

describe("admin review handoff pages", () => {
  it("keeps environment setup explicitly review-only", async () => {
    await primeActor("admin@mymedlife.test", "Testing environment setup review.");

    const { default: AdminEnvironmentSetupPage } = await import(
      "@/app/admin/environment-setup/page"
    );
    const html = renderToStaticMarkup(await AdminEnvironmentSetupPage());

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
    expect(html).toContain("Read-only preview");
    expect(html).toContain("Blocked production writes");
    expect(html).toContain("Blocked external sends");
    expect(html).toContain("Source-backed setup review");
  });

  it("keeps design QA pointed at system health review", async () => {
    await primeActor("admin@mymedlife.test", "Testing design QA review surface.");

    const { default: AdminDesignQaPage } = await import("@/app/admin/design-qa/page");
    const html = renderToStaticMarkup(await AdminDesignQaPage());

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
    expect(html).toContain("Read-only preview");
    expect(html).toContain("Blocked production writes");
    expect(html).toContain("Blocked external sends");
    expect(html).toContain("Source-backed QA routes");
    expect(html).toContain("Open system health review");
    expect(html).not.toContain("Open system health</a>");
  });

  it("keeps release readiness next steps framed as review handoffs", async () => {
    await primeActor("admin@mymedlife.test", "Testing release readiness review.");

    const { default: AdminReleaseReadinessPage } = await import(
      "@/app/admin/release-readiness/page"
    );
    const html = renderToStaticMarkup(await AdminReleaseReadinessPage());

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
    expect(html).toContain("Read-only preview");
    expect(html).toContain("Blocked production writes");
    expect(html).toContain("Blocked external sends");
    expect(html).toContain("Source-backed review routes");
    expect(html).toContain("Open Nick review packet");
    expect(html).not.toContain("Open Nick review</a>");
  });

  it("routes DS Admin release readiness into database security review", async () => {
    await primeActor("ds.admin@mymedlife.test", "Testing DS Admin release handoff.");

    const { default: AdminReleaseReadinessPage } = await import(
      "@/app/admin/release-readiness/page"
    );
    const html = renderToStaticMarkup(await AdminReleaseReadinessPage());

    expect(html).toContain("Open database security review");
    expect(html).not.toContain("Open database security</a>");
  });

  it("keeps pilot scope inside the visible DS Admin shell family", async () => {
    await primeActor("ds.admin@mymedlife.test", "Testing pilot scope shell continuity.");

    const { default: PilotScopePage } = await import("@/app/admin/pilot-scope/page");
    const html = renderToStaticMarkup(await PilotScopePage());

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
    expect(html).toContain("DS Admin pilot safety planner");
    expect(html).toContain("Open staff dry run");
  });

  it("keeps staff dry run inside the visible DS Admin shell family", async () => {
    await primeActor("admin@mymedlife.test", "Testing staff dry run shell continuity.");

    const { default: StaffDryRunPage } = await import("@/app/admin/staff-dry-run/page");
    const html = renderToStaticMarkup(await StaffDryRunPage());

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
    expect(html).toContain("Admin staff dry-run guide");
    expect(html).toContain("Local write rehearsal");
  });
});
