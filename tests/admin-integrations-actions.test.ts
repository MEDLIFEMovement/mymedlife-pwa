import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () =>
    new Headers([
      ["x-forwarded-for", "127.0.0.1"],
      ["user-agent", "vitest"],
    ])),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

vi.mock("@/services/admin-integrations-guard", () => ({
  requireDsSecretAdmin: vi.fn(),
}));

vi.mock("@/services/admin-integrations-registry", () => ({
  getIntegrationProvider: vi.fn(),
}));

vi.mock("@/services/admin-integrations-store", () => ({
  disableIntegrationConnection: vi.fn(),
  recordIntegrationAuditEvent: vi.fn(),
  runMockConnectionTest: vi.fn(),
  upsertIntegrationCredential: vi.fn(),
}));

describe("admin integrations server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks credential submission before any write when the guard denies access", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const guardModule = await import("@/services/admin-integrations-guard");
    const storeModule = await import("@/services/admin-integrations-store");
    const navigationModule = await import("next/navigation");
    const { submitIntegrationCredentialAction } = await import(
      "@/app/admin/integrations/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(guardModule.requireDsSecretAdmin).mockResolvedValue({
      allowed: false,
      canRenderLockedState: false,
      requiresStepUp: false,
      title: "Restricted",
      message: "Only DS Admin and Super Admin can open the integrations security area.",
      stepUpState: {
        isVerified: false,
        status: "missing",
        method: null,
        sessionId: null,
        verifiedAt: null,
        expiresAt: null,
        failureCount: 0,
        blockedUntil: null,
        message: "Restricted",
      },
    });

    const formData = new FormData();
    formData.set("providerKey", "hubspot");
    formData.set("environment", "staging");
    formData.set("returnTo", "/admin/integrations/hubspot");

    await expect(submitIntegrationCredentialAction(formData)).rejects.toThrow(
      "REDIRECT:/admin/integrations/hubspot?",
    );
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("integrationResult=error"),
    );
    expect(vi.mocked(storeModule.upsertIntegrationCredential)).not.toHaveBeenCalled();
  });

  it("requires explicit production confirmation before recording a production credential change", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const guardModule = await import("@/services/admin-integrations-guard");
    const registryModule = await import("@/services/admin-integrations-registry");
    const storeModule = await import("@/services/admin-integrations-store");
    const navigationModule = await import("next/navigation");
    const { submitIntegrationCredentialAction } = await import(
      "@/app/admin/integrations/actions"
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "ds.admin@mymedlife.test",
        "Testing production confirmation gate.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(guardModule.requireDsSecretAdmin).mockResolvedValue({
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
    });
    vi.mocked(registryModule.getIntegrationProvider).mockReturnValue({
      key: "hubspot",
      displayName: "HubSpot",
      description: "CRM sync",
      ownerTeam: "Data Solutions",
      supportedEnvironments: ["local", "staging", "production"],
      safeTestDescription: "Mock-safe only",
      risks: [],
      metadataFields: [],
    });

    const formData = new FormData();
    formData.set("providerKey", "hubspot");
    formData.set("environment", "production");
    formData.set("returnTo", "/admin/integrations/hubspot");
    formData.set("secretValue", "super-secret-production-key");
    formData.set("reason", "Rotate production credential for launch prep.");

    await expect(submitIntegrationCredentialAction(formData)).rejects.toThrow(
      "REDIRECT:/admin/integrations/hubspot?",
    );
    expect(vi.mocked(storeModule.recordIntegrationAuditEvent)).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "production_change_attempted",
        result: "blocked",
      }),
    );
    expect(vi.mocked(storeModule.upsertIntegrationCredential)).not.toHaveBeenCalled();
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("integrationResult=error"),
    );
  });
});
