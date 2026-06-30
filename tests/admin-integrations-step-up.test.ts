import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseControlClient } from "@/lib/supabase-control-client";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import {
  getStepUpFailureState,
  recordStepUpFailure,
  resetIntegrationStoreForTests,
} from "@/services/admin-integrations-store";
import {
  getDsSecretStepUpState,
  needsFreshProductionStepUp,
  verifyDsSecretStepUpWithPassword,
} from "@/services/admin-integrations-step-up";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import type { DsSecretStepUpPayload } from "@/shared/types/admin-integrations";

let stepUpCookieValue: string | null = null;

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "mymedlife_ds_secret_step_up" && stepUpCookieValue
        ? { value: stepUpCookieValue }
        : undefined,
    set: (name: string, value: string) => {
      if (name === "mymedlife_ds_secret_step_up") {
        stepUpCookieValue = value;
      }
    },
    delete: (name: string) => {
      if (name === "mymedlife_ds_secret_step_up") {
        stepUpCookieValue = null;
      }
    },
  })),
}));

vi.mock("@/lib/supabase-control-client", () => ({
  createSupabaseControlClient: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: vi.fn(),
}));

vi.mock("@/services/auth-session", () => ({
  getAuthSessionState: vi.fn(),
}));

describe("admin integrations step-up state", () => {
  beforeEach(() => {
    stepUpCookieValue = null;
    resetIntegrationStoreForTests();
    vi.clearAllMocks();
    vi.mocked(createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "memory",
        status: "fallback",
        requested: false,
        availability: "disabled",
        reason:
          "Using in-memory admin controls because MYMEDLIFE_CONTROL_LAYER_SOURCE is not set to supabase.",
      },
      client: null,
    } as never);
    vi.mocked(createLocalSupabaseServerClient).mockResolvedValue({
      client: null,
      config: {
        enabled: false,
        reason: "Hosted staging Supabase Auth is disabled for this test.",
      },
    } as never);
    vi.mocked(getAuthSessionState).mockResolvedValue({
      status: "signed_out",
      isLocalOnly: true,
      message: "No local Supabase Auth session is active.",
      user: null,
    });
  });

  it("blocks the session after repeated failed step-up attempts", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordStepUpFailure("ds-admin-user");
    }

    const state = getStepUpFailureState("ds-admin-user");

    expect(state.count).toBe(5);
    expect(state.blockedUntil).not.toBeNull();
  });

  it("clears the cooldown after the block window passes", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordStepUpFailure("ds-admin-user");
    }

    const blockedState = getStepUpFailureState("ds-admin-user");
    const releasedState = getStepUpFailureState(
      "ds-admin-user",
      new Date(new Date(blockedState.blockedUntil ?? 0).getTime() + 1_000),
    );

    expect(releasedState.count).toBe(0);
    expect(releasedState.blockedUntil).toBeNull();
  });

  it("treats missing or stale verification as not fresh enough for production", () => {
    expect(
      needsFreshProductionStepUp({
        isVerified: false,
        status: "missing",
        method: null,
        sessionId: null,
        verifiedAt: null,
        expiresAt: null,
        failureCount: 0,
        blockedUntil: null,
        message: "Missing verification.",
      }),
    ).toBe(true);

    expect(
      needsFreshProductionStepUp(
        {
          isVerified: true,
          status: "verified",
          method: "local_password_reauth",
          sessionId: "stale",
          verifiedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
          failureCount: 0,
          blockedUntil: null,
          message: "Verified earlier.",
        },
        new Date(),
      ),
    ).toBe(true);

    expect(
      needsFreshProductionStepUp(
        {
          isVerified: true,
          status: "verified",
          method: "local_password_reauth",
          sessionId: "fresh",
          verifiedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
          failureCount: 0,
          blockedUntil: null,
          message: "Verified recently.",
        },
        new Date(),
      ),
    ).toBe(false);
  });

  it("marks a signed cookie invalid when the durable step-up session row is missing", async () => {
    const actor = getMockLocalActorContext(
      "ds.admin@mymedlife.test",
      "Testing missing durable session.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    stepUpCookieValue = signStepUpCookie({
      userId: actor.user.id,
      email: actor.selectedEmail,
      method: "local_password_reauth",
      sessionId: "missing-session",
      verifiedAt: "2026-06-29T19:00:00.000Z",
      expiresAt: "2099-06-29T19:10:00.000Z",
    });
    vi.mocked(createSupabaseControlClient).mockResolvedValue({
      persistence: readyPersistence(),
      client: {
        persistence: readyPersistence(),
        selectRows: vi.fn().mockResolvedValue([]),
        rpc: vi.fn(),
      },
    } as never);

    const state = await getDsSecretStepUpState(actor);

    expect(state.isVerified).toBe(false);
    expect(state.status).toBe("invalid");
    expect(state.message).toContain("no longer exists");
  });

  it("uses the durable Supabase session row as the source of truth when it exists", async () => {
    const actor = getMockLocalActorContext(
      "ds.admin@mymedlife.test",
      "Testing durable step-up validation.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    stepUpCookieValue = signStepUpCookie({
      userId: actor.user.id,
      email: actor.selectedEmail,
      method: "local_password_reauth",
      sessionId: "durable-session",
      verifiedAt: "2026-06-29T19:00:00.000Z",
      expiresAt: "2099-06-29T19:10:00.000Z",
    });
    vi.mocked(createSupabaseControlClient).mockResolvedValue({
      persistence: readyPersistence(),
      client: {
        persistence: readyPersistence(),
        selectRows: vi.fn().mockResolvedValue([
          {
            id: "durable-session",
            user_id: actor.user.id,
            method: "local_password_reauth",
            verified_at: "2026-06-29T19:01:00.000Z",
            expires_at: "2099-06-29T19:11:00.000Z",
            revoked_at: null,
          },
        ]),
        rpc: vi.fn(),
      },
    } as never);

    const state = await getDsSecretStepUpState(actor);

    expect(state.isVerified).toBe(true);
    expect(state.status).toBe("verified");
    expect(state.sessionId).toBe("durable-session");
    expect(state.verifiedAt).toBe("2026-06-29T19:01:00.000Z");
    expect(state.expiresAt).toBe("2099-06-29T19:11:00.000Z");
  });

  it("does not grant step-up if Supabase cannot record a durable session", async () => {
    const actor = getMockLocalActorContext(
      "ds.admin@mymedlife.test",
      "Testing durable session recording failure.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: null,
    });
    vi.mocked(createLocalSupabaseServerClient).mockResolvedValue({
      client: {
        auth: {
          signInWithPassword,
        },
      },
      config: {
        enabled: true,
        url: "https://example.supabase.co",
        anonKey: "anon-key",
      },
    } as never);
    vi.mocked(getAuthSessionState).mockResolvedValue({
      status: "signed_in",
      isLocalOnly: true,
      message: "Local Supabase Auth session is active.",
      user: {
        id: actor.user.id,
        email: actor.selectedEmail,
        displayName: actor.user.displayName,
      },
    });
    vi.mocked(createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "memory",
        status: "fallback",
        requested: true,
        availability: "unavailable",
        reason:
          "Hosted staging Supabase Auth is disabled until MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH=true is set for an approved staging review.",
      },
      client: null,
    } as never);

    const result = await verifyDsSecretStepUpWithPassword({
      actor,
      password: "correct-password",
    });

    expect(result.ok).toBe(false);
    expect(result.state.isVerified).toBe(false);
    expect(result.state.status).toBe("invalid");
    expect(result.message).toContain("Supabase control layer");
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: actor.selectedEmail,
      password: "correct-password",
    });
    expect(stepUpCookieValue).toBeNull();
  });
});

function signStepUpCookie(payload: DsSecretStepUpPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const signature = createHmac("sha256", "mymedlife-local-step-up-secret")
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function readyPersistence() {
  return {
    mode: "supabase" as const,
    status: "ready" as const,
    requested: true as const,
    availability: "ready" as const,
    reason:
      "Reading and writing feature flags, theme snapshots, approvals, step-up sessions, and audit rows from Supabase.",
  };
}
