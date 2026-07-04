import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

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

describe("Figma missing route placeholders", () => {
  afterEach(() => {
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
    expect(html).toContain("Launch Mode Active");
    expect(html).not.toContain("Chapter Dashboard · Jun 2025");
    expect(html).not.toContain("Figma page missing - implementation blocked");
  });

  it("renders SLT Prep through /slt-prep with an explicit missing-Figma notice", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SLT missing-Figma placeholder."),
    );

    const { default: SltPrepPage } = await import("@/app/slt-prep/page");
    const html = renderToStaticMarkup(await SltPrepPage());

    expect(html).toContain("Figma page missing - implementation blocked");
    expect(html).toContain("/app/slt-prep and /slt-prep");
    expect(html).toContain("Existing traveler readiness workflow, not Chapter content");
    expect(html).toContain("Sofia Alvarez");
    expect(html).not.toContain("Chapter Dashboard · Jun 2025");
  });

  it("renders the same SLT Prep surface through the /app/slt-prep app route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing /app/slt-prep route alias."),
    );

    const { default: AppSltPrepPage } = await import("@/app/app/slt-prep/page");
    const html = renderToStaticMarkup(await AppSltPrepPage());

    expect(html).toContain("Figma page missing - implementation blocked");
    expect(html).toContain("Trip Prep");
    expect(html).toContain("Existing traveler readiness workflow, not Chapter content");
  });
});
