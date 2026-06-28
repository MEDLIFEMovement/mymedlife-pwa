import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";

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

vi.mock("@/services/admin-integrations-step-up", () => ({
  getDsSecretStepUpState: vi.fn(),
  needsFreshProductionStepUp: vi.fn((state: { isVerified: boolean }) => !state.isVerified),
}));

vi.mock("@/modules/feature-flags", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/feature-flags")>();

  return {
    ...actual,
    updateFeatureFlagStatusDurable: vi.fn(),
  };
});

vi.mock("@/modules/theme", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/theme")>();

  return {
    ...actual,
    publishThemeDraftDurable: vi.fn(),
    restoreDefaultThemeDurable: vi.fn(),
    rollbackThemeDurable: vi.fn(),
  };
});

describe("admin control server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks production-sensitive feature flag changes before durable writes when confirmation is missing", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const featureFlagModule = await import("@/modules/feature-flags");
    const navigationModule = await import("next/navigation");
    const { updateFeatureFlagAction } = await import("@/app/admin/feature-flags/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );

    await expect(
      updateFeatureFlagAction(
        formDataFor({
          returnTo: "/admin/feature-flags?env=production",
          environment: "production",
          flagKey: "integration_luma",
          nextStatus: "enabled",
          reason: "Enable production Luma for the approved pilot event loop.",
          approvalReference: "NICK-APPROVED",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/feature-flags?");

    expect(
      vi.mocked(featureFlagModule.updateFeatureFlagStatusDurable),
    ).not.toHaveBeenCalled();
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("Production-sensitive+provider+flags+require+explicit+confirmation"),
    );
  });

  it("passes approval reference and fresh step-up session into production-sensitive feature flag durable writes", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    const featureFlagModule = await import("@/modules/feature-flags");
    const navigationModule = await import("next/navigation");
    const { updateFeatureFlagAction } = await import("@/app/admin/feature-flags/actions");

    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(actor);
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: true,
      status: "verified",
      method: "local_password_reauth",
      sessionId: "step-up-session-123",
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      failureCount: 0,
      blockedUntil: null,
      message: "Verified",
    });

    await expect(
      updateFeatureFlagAction(
        formDataFor({
          returnTo: "/admin/feature-flags?env=production",
          environment: "production",
          flagKey: "integration_luma",
          nextStatus: "enabled",
          reason: "Enable production Luma for the approved pilot event loop.",
          approvalReference: "NICK-APPROVED",
          confirmProduction: "on",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/feature-flags?");

    expect(featureFlagModule.updateFeatureFlagStatusDurable).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        environment: "production",
        key: "integration_luma",
        nextStatus: "enabled",
        approvalReference: "NICK-APPROVED",
        stepUpSessionId: "step-up-session-123",
      }),
    );
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("featureFlagResult=success"),
    );
  });

  it("blocks production theme publishing before durable writes when fresh step-up is missing", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    const themeModule = await import("@/modules/theme");
    const navigationModule = await import("next/navigation");
    const { publishThemeAction } = await import("@/app/admin/theme/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("super.admin@mymedlife.test"),
    );
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: false,
      status: "missing",
      method: null,
      sessionId: null,
      verifiedAt: null,
      expiresAt: null,
      failureCount: 0,
      blockedUntil: null,
      message: "Missing",
    });

    await expect(
      publishThemeAction(
        formDataFor({
          returnTo: "/admin/theme?env=production",
          environment: "production",
          reason: "Publish production theme for pilot review.",
          approvalReference: "NICK-APPROVED",
          confirmProduction: "on",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/theme?");

    expect(vi.mocked(themeModule.publishThemeDraftDurable)).not.toHaveBeenCalled();
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("Production+theme+changes+require+a+fresh+DS%2FAdmin+step-up+session"),
    );
  });

  it("passes approval reference and fresh step-up session into production theme durable publishing", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    const themeModule = await import("@/modules/theme");
    const navigationModule = await import("next/navigation");
    const { publishThemeAction } = await import("@/app/admin/theme/actions");

    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(actor);
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: true,
      status: "verified",
      method: "local_password_reauth",
      sessionId: "theme-step-up-session",
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      failureCount: 0,
      blockedUntil: null,
      message: "Verified",
    });

    await expect(
      publishThemeAction(
        formDataFor({
          returnTo: "/admin/theme?env=production",
          environment: "production",
          reason: "Publish production theme for pilot review.",
          approvalReference: "NICK-APPROVED",
          confirmProduction: "on",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/theme?");

    expect(themeModule.publishThemeDraftDurable).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        environment: "production",
        reason: "Publish production theme for pilot review.",
        approvalReference: "NICK-APPROVED",
        stepUpSessionId: "theme-step-up-session",
      }),
    );
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("themeResult=success"),
    );
  });

  it("passes approval reference and fresh step-up session into production theme rollback and restore", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    const themeModule = await import("@/modules/theme");
    const { rollbackThemeAction, restoreDefaultThemeAction } = await import(
      "@/app/admin/theme/actions"
    );

    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(actor);
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: true,
      status: "verified",
      method: "local_password_reauth",
      sessionId: "theme-control-step-up",
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      failureCount: 0,
      blockedUntil: null,
      message: "Verified",
    });

    await expect(
      rollbackThemeAction(
        formDataFor({
          returnTo: "/admin/theme?env=production",
          environment: "production",
          reason: "Rollback production theme after approved pilot review.",
          approvalReference: "NICK-APPROVED",
          confirmProduction: "on",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/theme?");

    await expect(
      restoreDefaultThemeAction(
        formDataFor({
          returnTo: "/admin/theme?env=production",
          environment: "production",
          reason: "Restore production theme after approved pilot review.",
          approvalReference: "NICK-APPROVED",
          confirmProduction: "on",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/theme?");

    expect(themeModule.rollbackThemeDurable).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        environment: "production",
        approvalReference: "NICK-APPROVED",
        stepUpSessionId: "theme-control-step-up",
      }),
    );
    expect(themeModule.restoreDefaultThemeDurable).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        environment: "production",
        approvalReference: "NICK-APPROVED",
        stepUpSessionId: "theme-control-step-up",
      }),
    );
  });
});

function formDataFor(values: Record<string, string>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}
