import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/first-write",
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

describe("hosted reviewer sign-in admin pages", () => {
  it("routes hosted preview fallbacks back through login for the first-write packet", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "leader.a@mymedlife.test",
        "Using MYMEDLIFE_LOCAL_ACTOR_EMAIL because no signed-in hosted staging reviewer session is active.",
        "mock_fallback",
        "local_actor_email",
        "signed_out",
        false,
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData(
        "Using mock data because no signed-in hosted staging reviewer session is active.",
      ),
    );

    const { default: FirstWritePage } = await import("@/app/admin/first-write/page");
    const html = renderToStaticMarkup(await FirstWritePage());

    expect(html).toContain("Hosted reviewer sign-in required");
    expect(html).toContain("Sign in to review the first hosted write.");
    expect(html).toContain("Use a seeded Admin, DS Admin, or Super Admin review account");
    expect(html).toContain("/login?redirectTo=%2Fadmin%2Ffirst-write");
    expect(html).toContain("Admin navigation");
    expect(html).not.toContain("Leader navigation");
    expect(html).not.toContain("First-write activation is hidden for this role.");
  });

  it("routes hosted preview fallbacks back through login for the proof packet", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "leader.a@mymedlife.test",
        "Using MYMEDLIFE_LOCAL_ACTOR_EMAIL because no signed-in hosted staging reviewer session is active.",
        "mock_fallback",
        "local_actor_email",
        "signed_out",
        false,
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData(
        "Using mock data because no signed-in hosted staging reviewer session is active.",
      ),
    );

    const { default: ProofWritePage } = await import("@/app/admin/proof-write/page");
    const html = renderToStaticMarkup(await ProofWritePage());

    expect(html).toContain("Hosted reviewer sign-in required");
    expect(html).toContain("Sign in to review the hosted proof loop.");
    expect(html).toContain("Use a seeded Admin, DS Admin, or Super Admin review account");
    expect(html).toContain("/login?redirectTo=%2Fadmin%2Fproof-write");
    expect(html).toContain("Admin navigation");
    expect(html).not.toContain("Leader navigation");
    expect(html).not.toContain("Proof metadata activation is hidden for this role.");
  });
});
