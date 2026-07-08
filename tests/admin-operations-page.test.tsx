import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/operations",
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

describe("admin operations page", () => {
  it("keeps DS Admin operations handoffs review-only", async () => {
    await primeActor("ds.admin@mymedlife.test", "Testing DS Admin operations review.");

    const { default: AdminOperationsPage } = await import("@/app/admin/operations/page");
    const html = renderToStaticMarkup(await AdminOperationsPage());

    expect(html).toContain("Open integration outbox review");
    expect(html).toContain("Read-only preview");
    expect(html).toContain("Blocked production writes");
    expect(html).toContain("Blocked external sends");
    expect(html).toContain("Source-backed review routes");
    expect(html).toContain("Source-backed owner handoffs");
    expect(html).toContain("Open staff dry run review");
    expect(html).toContain("Open pilot scope review");
    expect(html).toContain("Open launch gate review");
  });

  it("routes admin reviewers into the pilot scope review handoff", async () => {
    await primeActor("admin@mymedlife.test", "Testing admin pilot support review.");

    const { default: AdminOperationsPage } = await import("@/app/admin/operations/page");
    const html = renderToStaticMarkup(await AdminOperationsPage());

    expect(html).toContain("Admin production operations runbook");
    expect(html).toContain("Open pilot scope review");
    expect(html).not.toContain("Choose pilot scope");
  });

  it("keeps the route restricted for non-admin readers", async () => {
    await primeActor("member.a@mymedlife.test", "Testing restricted admin operations.");

    const { default: AdminOperationsPage } = await import("@/app/admin/operations/page");
    const html = renderToStaticMarkup(await AdminOperationsPage());

    expect(html).toContain("Production operations runbook hidden for this role");
    expect(html).toContain("Back to Rush Month");
  });
});
