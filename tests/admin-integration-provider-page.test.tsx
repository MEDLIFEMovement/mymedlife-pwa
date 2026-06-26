import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/integrations/hubspot",
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

describe("admin integration provider page", () => {
  it("keeps provider detail behind the DS step-up lock", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "super.admin@mymedlife.test",
        "Testing provider step-up lock.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing provider detail page."),
    );

    const { default: AdminIntegrationProviderPage } = await import(
      "@/app/admin/integrations/[provider]/page"
    );
    const html = renderToStaticMarkup(
      await AdminIntegrationProviderPage({
        params: Promise.resolve({ provider: "hubspot" }),
      }),
    );

    expect(html).toContain("Secure access lock");
    expect(html).toContain("Unlock secure area");
    expect(html).toContain('href="/admin/integrations"');
  });

  it("renders the provider console chrome when secure access is granted", async () => {
    const workspaceModule = await import("@/services/admin-integrations-workspace");

    vi.spyOn(workspaceModule, "getAdminIntegrationProviderWorkspace").mockResolvedValue({
      canReadWorkspace: true,
      title: "HubSpot configuration",
      summary: "Credentials stay write-only.",
      provider: {
        key: "hubspot",
        displayName: "HubSpot",
        description: "CRM sync",
        ownerTeam: "Data Solutions",
        supportedEnvironments: ["local", "staging", "production"],
        safeTestDescription: "Read metadata only.",
        risks: ["CRM scope"],
        metadataFields: [],
      },
      providerKey: "hubspot",
      nextStep: {
        href: "/admin/integrations",
        label: "Back to integrations",
      },
      guard: {
        allowed: true,
        canRenderLockedState: false,
        requiresStepUp: false,
        title: "Access granted",
        message: "Allowed",
        stepUpState: {
          isVerified: true,
          status: "verified",
          method: "local_password_reauth",
          sessionId: "step-up",
          verifiedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          failureCount: 0,
          blockedUntil: null,
          message: "Allowed",
        },
      },
      environments: [
        {
          environment: "staging",
          status: "configured",
          connectionId: "conn-1",
          displayName: "HubSpot",
          ownerTeam: "Data Solutions",
          maskedHint: "**********key",
          secretVersion: "v2",
          lastTestedAt: "Today",
          lastTestStatus: "success",
          lastTestMessage: "Safe test passed.",
          scopes: ["crm.objects.read"],
          metadataRows: [{ label: "app label", value: "HubSpot" }],
        },
      ],
      auditRows: [],
      resultBanner: null,
    });

    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "super.admin@mymedlife.test",
        "Testing unlocked provider console.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing provider detail page."),
    );

    const { default: AdminIntegrationProviderPage } = await import(
      "@/app/admin/integrations/[provider]/page"
    );
    const html = renderToStaticMarkup(
      await AdminIntegrationProviderPage({
        params: Promise.resolve({ provider: "hubspot" }),
      }),
    );

    expect(html).toContain("Provider detail");
    expect(html).toContain("Write-only secrets, masked hints, audited changes");
    expect(html).toContain("Environments");
    expect(html).toContain("Configured");
    expect(html).toContain("Audit rows");
    expect(html).toContain("Overview");
    expect(html).toContain("Raw secrets");
    expect(html).toContain("Credentials");
    expect(html).toContain("Health check");
    expect(html).toContain("Disable path");
  });
});
