import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseReadonlyAccess: vi.fn(),
  createSupabaseReadonlyClient: vi.fn(),
  createLocalSupabaseServerClient: vi.fn(),
  getAuthSessionState: vi.fn(),
  getHostedSessionReadonlyClient: vi.fn(),
  getSupabaseReadConfig: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: mocks.createLocalSupabaseServerClient,
}));

vi.mock("@/services/auth-session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/auth-session")>()),
  getAuthSessionState: mocks.getAuthSessionState,
}));

vi.mock("@/lib/supabase-readonly", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/supabase-readonly")>()),
  createSupabaseReadonlyAccess: mocks.createSupabaseReadonlyAccess,
  createSupabaseReadonlyClient: mocks.createSupabaseReadonlyClient,
  getHostedSessionReadonlyClient: mocks.getHostedSessionReadonlyClient,
  getSupabaseReadConfig: mocks.getSupabaseReadConfig,
}));

import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";

const hostedConfig = {
  enabled: true,
  mode: "production_supabase",
  environment: "production",
  url: "https://example.supabase.co",
  anonKey: "browser-key",
  isLocalOnly: false,
  isHostedStaging: false,
  reason: "Hosted production auth is configured.",
};

describe("production operational data fail-closed integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSupabaseReadConfig.mockReturnValue({
      enabled: false,
      reason: "Local service-role reads are disabled.",
    });
    mocks.createLocalSupabaseServerClient.mockResolvedValue({
      client: { auth: "session-client" },
      config: hostedConfig,
    });
    mocks.getAuthSessionState.mockResolvedValue({
      status: "signed_in",
      isLocalOnly: false,
      isHostedStaging: false,
      environment: "production",
      message: "Signed in.",
      user: {
        id: "real-member-id",
        email: "real.member@example.org",
        displayName: "Real Member",
      },
    });
  });

  it("preserves the signed-in identity when the hosted actor data read throws", async () => {
    mocks.getHostedSessionReadonlyClient.mockResolvedValue({
      enabled: true,
      reason: "Reading hosted production data.",
      client: {
        selectRows: async () => {
          throw new Error("database unavailable");
        },
      },
    });

    const actor = await getLocalActorContext();

    expect(actor.source.status).toBe("auth_profile_missing");
    expect(actor.user.email).toBe("real.member@example.org");
    expect(actor.user.displayName).toBe("Real Member");
    expect(actor.source.message).toContain("database unavailable");
  });

  it("preserves the signed-in identity when hosted operational reads are unavailable", async () => {
    mocks.getHostedSessionReadonlyClient.mockResolvedValue({
      enabled: false,
      reason: "Hosted operational reads are unavailable.",
    });

    const actor = await getLocalActorContext();

    expect(actor.source.status).toBe("auth_profile_missing");
    expect(actor.user.email).toBe("real.member@example.org");
    expect(actor.source.message).toContain("Hosted operational reads are unavailable");
  });

  it("fails closed when hosted actor data rejects with a malformed error value", async () => {
    mocks.getHostedSessionReadonlyClient.mockResolvedValue({
      enabled: true,
      reason: "Reading hosted production data.",
      client: {
        selectRows: async () => Promise.reject("malformed hosted failure"),
      },
    });

    const actor = await getLocalActorContext();

    expect(actor.source.status).toBe("auth_profile_missing");
    expect(actor.user.email).toBe("real.member@example.org");
    expect(actor.source.message).toContain("Hosted actor read failed.");
  });

  it("fails closed when an enabled operational client rejects with a malformed error value", async () => {
    mocks.getSupabaseReadConfig.mockReturnValue({
      enabled: true,
      url: "http://127.0.0.1:54321",
      key: "local-key",
      reason: "Reading local operational data.",
    });
    mocks.createSupabaseReadonlyClient.mockReturnValue({
      selectRows: async () => Promise.reject("malformed operational failure"),
    });

    const actor = await getLocalActorContext();

    expect(actor.source.status).toBe("auth_profile_missing");
    expect(actor.user.email).toBe("real.member@example.org");
    expect(actor.source.message).toContain("Operational actor read failed.");
  });

  it("returns an empty operational model instead of TEST data when hosted access is disabled", async () => {
    mocks.createSupabaseReadonlyAccess.mockResolvedValue({
      enabled: false,
      reason: "Hosted session read is unavailable.",
      isLocalOnly: false,
      mode: "mock_fallback",
    });

    const data = await getReadOnlyAppData({ actorUserId: "real-member-id" });

    expect(data.source.status).toBe("chapter_access_missing");
    expect(data.source.mode).toBe("supabase");
    expect(data.chapterRows).toEqual([]);
    expect(data.chapter.name).not.toContain("TEST");
  });

  it("returns an empty operational model when a hosted read throws", async () => {
    mocks.createSupabaseReadonlyAccess.mockResolvedValue({
      enabled: true,
      reason: "Reading hosted production data.",
      isLocalOnly: false,
      mode: "auth_session",
      client: {
        selectRows: async () => {
          throw new Error("query failed");
        },
      },
    });

    const data = await getReadOnlyAppData({ actorUserId: "real-member-id" });

    expect(data.source.status).toBe("chapter_access_missing");
    expect(data.source.message).toContain("query failed");
    expect(data.profiles).toEqual([]);
  });
});
