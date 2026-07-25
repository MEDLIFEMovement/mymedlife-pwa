import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/launch-gate",
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

describe("admin launch gate page", () => {
  it("keeps DS Admin launch-gate handoffs framed as review routes", async () => {
    await primeActor("ds.admin@mymedlife.test", "Testing DS Admin launch gate review.");

    const { default: AdminLaunchGatePage } = await import("@/app/admin/launch-gate/page");
    const html = renderToStaticMarkup(await AdminLaunchGatePage());

    expect(html).toContain("Open integration outbox review");
    expect(html).not.toContain("Open integration outbox</a>");
  });

  it("keeps admin launch-gate handoffs framed as review routes", async () => {
    await primeActor("admin@mymedlife.test", "Testing admin launch gate review.");

    const { default: AdminLaunchGatePage } = await import("@/app/admin/launch-gate/page");
    const html = renderToStaticMarkup(await AdminLaunchGatePage());

    expect(html).toContain("Open system health review");
    expect(html).not.toContain("Open system health</a>");
  });

  it("keeps the launch gate restricted for non-admin readers", async () => {
    await primeActor("member.a@mymedlife.test", "Testing restricted launch gate.");

    const { default: AdminLaunchGatePage } = await import("@/app/admin/launch-gate/page");
    const html = renderToStaticMarkup(await AdminLaunchGatePage());

    expect(html).toContain("Back to Rush Month");
  });
});
