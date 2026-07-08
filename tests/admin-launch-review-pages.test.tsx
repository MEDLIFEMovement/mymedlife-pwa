import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/pilot-scope",
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

describe("admin launch review pages", () => {
  it("keeps the pilot scope route explicitly review-only", async () => {
    await primeActor("admin@mymedlife.test", "Testing pilot scope review surface.");

    const { default: PilotScopePage } = await import("@/app/admin/pilot-scope/page");
    const html = renderToStaticMarkup(await PilotScopePage());

    expect(html).toContain("Read-only preview");
    expect(html).toContain("Blocked production writes");
    expect(html).toContain("Blocked external sends");
    expect(html).toContain("Source-backed review routes");
    expect(html).toContain("Open staff dry run review");
    expect(html).toContain("Open Rush Month loop review");
    expect(html).toContain("Open first-write drill review");
  });

  it("keeps the launch gate next step framed as review", async () => {
    await primeActor("admin@mymedlife.test", "Testing launch gate review surface.");

    const { default: AdminLaunchGatePage } = await import("@/app/admin/launch-gate/page");
    const html = renderToStaticMarkup(await AdminLaunchGatePage());

    expect(html).toContain("Read-only preview");
    expect(html).toContain("Blocked production writes");
    expect(html).toContain("Blocked external sends");
    expect(html).toContain("Source-backed review routes");
    expect(html).toContain("Open system health review");
    expect(html).not.toContain("Open system health</a>");
  });

  it("keeps the DS Admin launch gate handoff pointed at outbox review", async () => {
    await primeActor("ds.admin@mymedlife.test", "Testing DS Admin launch review.");

    const { default: AdminLaunchGatePage } = await import("@/app/admin/launch-gate/page");
    const html = renderToStaticMarkup(await AdminLaunchGatePage());

    expect(html).toContain("DS Admin production launch and integration gate");
    expect(html).toContain("Open integration outbox review");
  });
});
