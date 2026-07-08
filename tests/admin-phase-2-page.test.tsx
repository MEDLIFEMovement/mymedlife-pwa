import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/phase-2",
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

describe("admin phase 2 page", () => {
  it("keeps the phase 2 review route visible for DS Admin with source-backed review copy", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing phase 2 review surface."),
    );

    const { default: AdminPhase2Page } = await import("@/app/admin/phase-2/page");
    const html = renderToStaticMarkup(await AdminPhase2Page());

    expect(html).toContain("Phase 2 review surface");
    expect(html).toContain("Read the next lane before we build it.");
    expect(html).toContain("Launch gate");
    expect(html).toContain("Database security");
  });

  it("returns unauthorized roles to the Command Center instead of a generic admin back path", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing phase 2 restricted surface."),
    );

    const { default: AdminPhase2Page } = await import("@/app/admin/phase-2/page");
    const html = renderToStaticMarkup(await AdminPhase2Page());

    expect(html).toContain("Phase 2 review is hidden for this role.");
    expect(html).toContain("Return to Command Center");
    expect(html).not.toContain(">Back to Admin<");
  });
});
