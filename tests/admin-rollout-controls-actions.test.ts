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

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: vi.fn(),
}));

vi.mock("@/services/auth-session", () => ({
  getAuthSessionState: vi.fn(),
}));

vi.mock("@/services/admin-integrations-step-up", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/services/admin-integrations-step-up")
  >();

  return {
    ...actual,
    getDsSecretStepUpState: vi.fn(),
    needsFreshProductionStepUp: vi.fn(),
    verifyDsSecretStepUpWithPassword: vi.fn(),
    clearDsSecretStepUpSession: vi.fn(),
  };
});

describe("admin rollout controls actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks a production integration flag before any Supabase write when policy says production stays off", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    const { updateFeatureFlag } = await import("@/app/admin/actions/rollout-controls");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "ds.admin@mymedlife.test",
        "Testing rollout flag block.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: true,
      status: "verified",
      method: "local_password_reauth",
      sessionId: "step-up",
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      failureCount: 0,
      blockedUntil: null,
      message: "Allowed",
    });
    vi.mocked(stepUpModule.needsFreshProductionStepUp).mockReturnValue(false);

    const formData = new FormData();
    formData.set("flagKey", "luma_event_create");
    formData.set("environment", "production");
    formData.set("enabled", "true");
    formData.set("reason", "Attempt to widen production scope too early.");
    formData.set("productionConfirmation", "PRODUCTION");

    const result = await updateFeatureFlag(formData);

    expect(result).toMatchObject({
      success: false,
      code: "production_flag_blocked",
      environment: "production",
      item: "luma_event_create",
    });
  });

  it("requires production confirmation for theme changes before calling Supabase", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    const { updateThemeSetting } = await import("@/app/admin/actions/rollout-controls");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "super.admin@mymedlife.test",
        "Testing theme confirmation.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: true,
      status: "verified",
      method: "local_password_reauth",
      sessionId: "step-up",
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      failureCount: 0,
      blockedUntil: null,
      message: "Allowed",
    });
    vi.mocked(stepUpModule.needsFreshProductionStepUp).mockReturnValue(false);

    const formData = new FormData();
    formData.set("settingKey", "accent");
    formData.set("environment", "production");
    formData.set("value", "#2563eb");
    formData.set("reason", "Update the production accent color.");

    const result = await updateThemeSetting(formData);

    expect(result).toMatchObject({
      success: false,
      code: "production_confirmation_required",
      environment: "production",
      item: "accent",
    });
  });

  it("maps a successful feature-flag RPC into a persisted success state", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const clientModule = await import("@/lib/supabase-server");
    const authModule = await import("@/services/auth-session");
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    const { updateFeatureFlag } = await import("@/app/admin/actions/rollout-controls");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "ds.admin@mymedlife.test",
        "Testing rollout save.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: true,
      status: "verified",
      method: "local_password_reauth",
      sessionId: "step-up",
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      failureCount: 0,
      blockedUntil: null,
      message: "Allowed",
    });
    vi.mocked(stepUpModule.needsFreshProductionStepUp).mockReturnValue(false);
    vi.mocked(clientModule.createLocalSupabaseServerClient).mockResolvedValue({
      config: {
        enabled: true,
        mode: "local_supabase",
        reviewEnvironment: "local",
        url: "http://127.0.0.1:54321",
        anonKey: "anon",
        isLocalOnly: true,
        reason: "Local Supabase Auth is enabled for localhost sign-in testing.",
      },
      client: {
        schema: () => ({
          rpc: vi.fn(async () => ({
            data: [
              {
                flag_id: "flag-1",
                audit_log_id: "audit-1",
                flag_key: "staging_review_auth",
                environment: "staging",
                enabled: true,
                approval_policy: "standard",
                updated_at: new Date().toISOString(),
              },
            ],
            error: null,
          })),
        }),
      } as never,
    });
    vi.mocked(authModule.getAuthSessionState).mockResolvedValue({
      status: "signed_in",
      isLocalOnly: true,
      message: "Local Supabase Auth session is active.",
      user: {
        id: "00000000-0000-4000-8000-000000000005",
        email: "ds.admin@mymedlife.test",
        displayName: "Dee Systems",
      },
    });

    const formData = new FormData();
    formData.set("flagKey", "staging_review_auth");
    formData.set("environment", "staging");
    formData.set("enabled", "true");
    formData.set("reason", "Allow DS staging reviewers through auth.");

    const result = await updateFeatureFlag(formData);

    expect(result).toMatchObject({
      success: true,
      code: "success",
      item: "staging_review_auth",
      environment: "staging",
      auditLogId: "audit-1",
    });
  });
});
