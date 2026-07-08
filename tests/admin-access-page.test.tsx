import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/access",
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

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("admin access page", () => {
  it("keeps access management inside the visible DS Admin shell family", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: AdminAccessPage } = await import("@/app/admin/access/page");
    const html = renderToStaticMarkup(await AdminAccessPage());

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
    expect(html).toContain("Access Matrix");
    expect(html).toContain("TEST Sofia Alvarez");
    expect(html).toContain("TEST Dee Systems");
    expect(html).toContain("General Student App");
  });
});
