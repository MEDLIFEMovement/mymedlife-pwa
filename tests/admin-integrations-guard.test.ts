import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { requireDsSecretAdmin } from "@/services/admin-integrations-guard";

vi.mock("@/services/admin-integrations-step-up", () => ({
  getDsSecretStepUpState: vi.fn(),
  needsFreshProductionStepUp: vi.fn(),
}));

describe("admin integrations guard", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: false,
      status: "missing",
      method: null,
      sessionId: null,
      verifiedAt: null,
      expiresAt: null,
      failureCount: 0,
      blockedUntil: null,
      message:
        "Step-up authentication is required before entering the integrations security area.",
    });
    vi.mocked(stepUpModule.needsFreshProductionStepUp).mockReturnValue(false);
  });

  it("blocks general staff from the secure integrations area", async () => {
    const result = await requireDsSecretAdmin({
      actor: getMockLocalActorContext("admin@mymedlife.test"),
    });

    expect(result.allowed).toBe(false);
    expect(result.canRenderLockedState).toBe(false);
    expect(result.message).toContain("Only DS Admin and Super Admin");
  });

  it("rejects providers that are outside the DS integrations catalog", async () => {
    const result = await requireDsSecretAdmin({
      actor: getMockLocalActorContext(
        "ds.admin@mymedlife.test",
        "Testing unknown provider validation.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
      providerKey: "unknown-provider" as never,
    });

    expect(result.allowed).toBe(false);
    expect(result.canRenderLockedState).toBe(false);
    expect(result.message).toContain("not part of the DS integrations catalog");
  });

  it("shows a locked state for a signed-in DS admin without step-up", async () => {
    const result = await requireDsSecretAdmin({
      actor: getMockLocalActorContext(
        "ds.admin@mymedlife.test",
        "Testing DS secure lane lock.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    });

    expect(result.allowed).toBe(false);
    expect(result.canRenderLockedState).toBe(true);
    expect(result.requiresStepUp).toBe(true);
    expect(result.title).toBe("Step-up authentication required");
  });

  it("allows a verified super admin into supported provider environments", async () => {
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: true,
      status: "verified",
      method: "local_password_reauth",
      sessionId: "step-up-session",
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      failureCount: 0,
      blockedUntil: null,
      message: "Step-up is active for this DS admin session.",
    });

    const result = await requireDsSecretAdmin({
      actor: getMockLocalActorContext(
        "super.admin@mymedlife.test",
        "Testing super admin integrations access.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
      providerKey: "hubspot",
      environment: "staging",
    });

    expect(result.allowed).toBe(true);
    expect(result.requiresStepUp).toBe(false);
    expect(result.message).toContain("Role, auth session, and step-up are valid");
  });

  it("requires a fresh step-up before production credential actions", async () => {
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: true,
      status: "verified",
      method: "local_password_reauth",
      sessionId: "stale-session",
      verifiedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      failureCount: 0,
      blockedUntil: null,
      message: "Step-up is active for this DS admin session.",
    });
    vi.mocked(stepUpModule.needsFreshProductionStepUp).mockReturnValue(true);

    const result = await requireDsSecretAdmin({
      actor: getMockLocalActorContext(
        "ds.admin@mymedlife.test",
        "Testing production freshness gate.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
      providerKey: "hubspot",
      environment: "production",
    });

    expect(result.allowed).toBe(false);
    expect(result.canRenderLockedState).toBe(true);
    expect(result.title).toBe("Fresh step-up required for production");
    expect(result.stepUpState.status).toBe("expired");
  });
});
