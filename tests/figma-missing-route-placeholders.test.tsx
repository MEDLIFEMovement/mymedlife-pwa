import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

let mockPathname = "/admin";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
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

describe("Figma missing route placeholders", () => {
  afterEach(() => {
    mockPathname = "/admin";
    mockSearchParams = new URLSearchParams();
    vi.clearAllMocks();
  });

  it("renders the Figma admin backend shell with its vertical DS Admin menu", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("super.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing admin missing-Figma placeholder."),
    );

    const { default: AdminPage } = await import("@/app/admin/page");
    const html = renderToStaticMarkup(await AdminPage());

    expect(html).toContain("DS Admin · v2.4");
    expect(html).toContain("Overview");
    expect(html).toContain("Users");
    expect(html).toContain("Chapters");
    expect(html).toContain("Modules");
    expect(html).toContain("Luma Events");
    expect(html).toContain("Points");
    expect(html).toContain("Integrations");
    expect(html).toContain("Audit Logs");
    expect(html).toContain("System Health");
    expect(html).toContain("API Keys");
    expect(html).toContain("MCP Connections");
    expect(html).toContain("Settings");
    expect(html).toContain("MCP Analytics");
    expect(html).toContain("Launch Mode Active");
    expect(html).not.toContain("Chapter Dashboard · Jun 2025");
    expect(html).not.toContain("Figma page missing - implementation blocked");
  });

  it("keeps admin integrations, API-key, and MCP controls visibly blocked instead of simulating live mutations", async () => {
    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const source = readFileSync("src/components/figma-admin-panel.tsx", "utf8");

    const modulesHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="modules" />);
    expect(modulesHtml).toContain("This module surface is preview-only.");
    expect(source).toContain("Module changes are blocked in this static admin shell; use the audited admin workflow after approval");

    const integrationsHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="integrations" />);
    expect(integrationsHtml).toContain("this integrations surface is preview-only");
    expect(integrationsHtml).toContain("Smile.io provider enablement is blocked until DS approval is complete");
    expect(integrationsHtml).toContain("Meta App Review and OAuth scope setup stay visible for DS review");
    expect(source).toContain("Publishing remains blocked in this preview");

    const apiKeysHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="apikeys" />);
    expect(apiKeysHtml).toContain("API keys stay masked in this preview");
    expect(apiKeysHtml).toContain("Key material stays masked in this preview until the audited secrets workflow is approved.");
    expect(source).toContain("Key rotation is blocked in this preview");
    expect(source).toContain("Key revocation is blocked in this preview");

    const mcpHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="mcp" />);
    expect(mcpHtml).toContain("MCP Access Policy");
    expect(source).toContain("MCP write access is blocked in this preview");
    expect(source).toContain("MCP provider connections stay visible for policy review, but connection changes are blocked in this preview");
  });

  it("honors DS Admin route-backed view params for direct deep-link review", async () => {
    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");

    mockPathname = "/admin";
    mockSearchParams = new URLSearchParams("view=mcp");
    const mcpHtml = renderToStaticMarkup(<FigmaAdminPanel />);
    expect(mcpHtml).toContain(">MCP Connections</h1>");
    expect(mcpHtml).toContain("MCP Access Policy");

    mockSearchParams = new URLSearchParams("view=apikeys");
    const keysHtml = renderToStaticMarkup(<FigmaAdminPanel />);
    expect(keysHtml).toContain(">API Keys</h1>");
    expect(keysHtml).toContain("API keys stay masked in this preview");
  });

  it("keeps admin points policy controls visibly blocked instead of acting like a live editor", async () => {
    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const source = readFileSync("src/components/figma-admin-panel.tsx", "utf8");

    const pointsHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="points" />);

    expect(pointsHtml).toContain("Points policy editing is blocked in this preview.");
    expect(pointsHtml).toContain("Points System");
    expect(source).toContain("Points policy edits are blocked in this preview until the audited workflow is approved");
    expect(source).toContain("Global point defaults require the workflow-admin save path");
    expect(source).toContain("Tier notifications, perks, and downstream sync stay preview-only until the audited loyalty workflow is approved.");
    expect(source).toContain("Blocked — no in-app or push notification is sent from tier changes");
    expect(source).toContain("Blocked — no lifecycle sync runs from tier changes");
  });

  it("keeps system health and settings visible without presenting them as live production ops controls", async () => {
    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const source = readFileSync("src/components/figma-admin-panel.tsx", "utf8");

    const healthHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="health" />);
    expect(healthHtml).toContain("This system-health panel is preview-only.");
    expect(healthHtml).toContain("System-health refresh is blocked in this static shell");

    const settingsHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="settings" />);
    expect(settingsHtml).toContain("Preview Configuration Only");
    expect(settingsHtml).toContain("Configured (preview only)");
    expect(source).toContain("Use the audited admin workflow after approval for real environment or alert changes.");
  });

  it("keeps audit logs visible without treating the panel as live production evidence", async () => {
    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const source = readFileSync("src/components/figma-admin-panel.tsx", "utf8");

    const auditHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="audit" />);

    expect(auditHtml).toContain("This audit log is preview-only.");
    expect(auditHtml).toContain("use the audited evidence surfaces for live production proof or incident review");
    expect(source).toContain("Review seeded admin and system readback here");
  });

  it("marks seeded DS Admin people, chapters, and social placeholders with a visible TEST prefix while keeping product labels clean", async () => {
    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const source = readFileSync("src/components/figma-admin-panel.tsx", "utf8");

    const usersHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="users" />);
    expect(usersHtml).toContain("TEST Aaliyah Johnson");
    expect(usersHtml).toContain("TEST Howard University");

    const chaptersHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="chapters" />);
    expect(chaptersHtml).toContain("TEST UCLA MEDLIFE");
    expect(chaptersHtml).toContain("TEST Dr. R. Patel");

    const auditHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="audit" />);
    expect(auditHtml).toContain("TEST Soledad Vega");
    expect(auditHtml).toContain("TEST Community Health Fair");

    const integrationsHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="integrations" />);
    expect(source).toContain("TEST MEDLIFE Stanford");
    expect(source).toContain("@TEST_medlife_stanford");
    expect(integrationsHtml).toContain("Luma");
    expect(integrationsHtml).toContain("HubSpot");
    expect(integrationsHtml).toContain("Smile.io");
    expect(integrationsHtml).toContain("MCP Connections");
    expect(integrationsHtml).not.toContain("TEST Luma");
    expect(integrationsHtml).not.toContain("TEST HubSpot");
    expect(integrationsHtml).not.toContain("TEST Smile.io");
  });

  it("keeps admin users and chapters detail surfaces visible without implying live mutation paths", async () => {
    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const source = readFileSync("src/components/figma-admin-panel.tsx", "utf8");

    const usersHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="users" />);
    expect(usersHtml).toContain("This user directory is preview-only.");
    expect(source).toContain("Directory details, module access, and activity history shown here are preview/readback data.");
    expect(source).toContain("Invite emails are blocked until external-send approval is complete");

    const chaptersHtml = renderToStaticMarkup(<FigmaAdminPanel initialActive="chapters" />);
    expect(chaptersHtml).toContain("This chapter directory is preview-only.");
    expect(source).toContain("Chapter metrics, module access, and risk posture shown here are preview/readback data.");
    expect(source).toContain("Chapter event drill-in is handled by the staff events view");
  });

  it("keeps /slt-prep visible as a source-backed traveler readiness preview", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SLT Prep source-confidence preview."),
    );

    const { default: SltPrepPage } = await import("@/app/slt-prep/page");
    const html = renderToStaticMarkup(await SltPrepPage());

    expect(html).not.toContain("Figma page missing - implementation blocked");
    expect(html).toContain("Peru SLT");
    expect(html).toContain("What is complete, missing, or due soon?");
  });

  it("keeps the /app/slt-prep alias on the same source-backed preview surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("traveler.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SLT Prep alias preview."),
    );

    const { default: AppSltPrepPage } = await import("@/app/app/slt-prep/page");
    const html = renderToStaticMarkup(await AppSltPrepPage());

    expect(html).not.toContain("Figma page missing - implementation blocked");
    expect(html).toContain("Complete next step");
    expect(html).toContain("Next deadline");
  });
});
