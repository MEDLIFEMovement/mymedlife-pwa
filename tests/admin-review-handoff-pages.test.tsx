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

    expect(html).toContain("Read-only preview");
    expect(html).toContain("Blocked production writes");
    expect(html).toContain("Blocked external sends");
    expect(html).toContain("Source-backed setup review");
  });

  it("keeps design QA pointed at system health review", async () => {
    await primeActor("admin@mymedlife.test", "Testing design QA review surface.");

    const { default: AdminDesignQaPage } = await import("@/app/admin/design-qa/page");
    const html = renderToStaticMarkup(await AdminDesignQaPage());

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

    expect(html).toContain("Read-only preview");
    expect(html).toContain("Blocked production writes");
    expect(html).toContain("Blocked external sends");
    expect(html).toContain("Source-backed review routes");
    expect(html).toContain("Open Nick review packet");
    expect(html).not.toContain("Open Nick review</a>");
  });

  it("keeps the review path button aligned with the Nick review packet wording", async () => {
    await primeActor("admin@mymedlife.test", "Testing stakeholder review path.");

    const { default: AdminReviewPathPage } = await import("@/app/admin/review-path/page");
    const html = renderToStaticMarkup(await AdminReviewPathPage());

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

  it("keeps database security next steps framed as review-only follow-through", async () => {
    await primeActor("admin@mymedlife.test", "Testing database security review.");

    const { default: AdminDatabaseSecurityPage } = await import(
      "@/app/admin/database-security/page"
    );
    const html = renderToStaticMarkup(await AdminDatabaseSecurityPage());

    expect(html).toContain("Open system health review");
    expect(html).not.toContain("Open system health</a>");
  });

  it("keeps system health and audit next steps in review language for admin and DS", async () => {
    await primeActor("admin@mymedlife.test", "Testing admin review next steps.");

    const { default: AdminSystemHealthPage } = await import("@/app/admin/system-health/page");
    const { default: AdminAuditLogPage } = await import("@/app/admin/audit-log/page");

    const systemHealthHtml = renderToStaticMarkup(await AdminSystemHealthPage());
    const auditLogHtml = renderToStaticMarkup(await AdminAuditLogPage());

    expect(systemHealthHtml).toContain("Open operations runbook review");
    expect(systemHealthHtml).not.toContain("Open operations runbook</a>");
    expect(auditLogHtml).toContain("Open write sequence review");
    expect(auditLogHtml).not.toContain("Review write sequence</a>");

    await primeActor("ds.admin@mymedlife.test", "Testing DS Admin review next steps.");

    const dsSystemHealthHtml = renderToStaticMarkup(await AdminSystemHealthPage());
    const dsAuditLogHtml = renderToStaticMarkup(await AdminAuditLogPage());

    expect(dsSystemHealthHtml).toContain("Open integration outbox review");
    expect(dsSystemHealthHtml).not.toContain("Open integration outbox</a>");
    expect(dsAuditLogHtml).toContain("Open integration outbox review");
    expect(dsAuditLogHtml).not.toContain("Open integration outbox</a>");
  });
});
