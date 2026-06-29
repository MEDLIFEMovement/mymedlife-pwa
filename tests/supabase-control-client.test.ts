import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: vi.fn(),
}));

describe("supabase control client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stays in disabled memory mode when the control layer is not requested", async () => {
    const { createSupabaseControlClient } = await import("@/lib/supabase-control-client");
    const supabaseServer = await import("@/lib/supabase-server");

    const result = await createSupabaseControlClient({});

    expect(result.client).toBeNull();
    expect(result.persistence).toMatchObject({
      mode: "memory",
      status: "fallback",
      requested: false,
      availability: "disabled",
    });
    expect(result.persistence.reason).toContain(
      "MYMEDLIFE_CONTROL_LAYER_SOURCE is not set to supabase",
    );
    expect(supabaseServer.createLocalSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("reports the control layer as unavailable when Supabase auth is not enabled in the environment", async () => {
    const { createSupabaseControlClient } = await import("@/lib/supabase-control-client");
    const supabaseServer = await import("@/lib/supabase-server");

    vi.mocked(supabaseServer.createLocalSupabaseServerClient).mockResolvedValue({
      client: null,
      config: {
        enabled: false,
        reason:
          "Hosted staging Supabase Auth is disabled until MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH=true is set for an approved staging review.",
      },
    } as never);

    const result = await createSupabaseControlClient({
      MYMEDLIFE_CONTROL_LAYER_SOURCE: "supabase",
    });

    expect(result.client).toBeNull();
    expect(result.persistence).toMatchObject({
      mode: "memory",
      status: "fallback",
      requested: true,
      availability: "unavailable",
    });
    expect(result.persistence.reason).toContain("Supabase Auth is disabled");
  });

  it("reports a missing reviewer session when Supabase is enabled but no session token is active", async () => {
    const { createSupabaseControlClient } = await import("@/lib/supabase-control-client");
    const supabaseServer = await import("@/lib/supabase-server");

    vi.mocked(supabaseServer.createLocalSupabaseServerClient).mockResolvedValue({
      config: {
        enabled: true,
        url: "https://example.supabase.co",
        anonKey: "anon-key",
      },
      client: {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: null,
            },
            error: null,
          }),
        },
      },
    } as never);

    const result = await createSupabaseControlClient({
      MYMEDLIFE_CONTROL_LAYER_SOURCE: "supabase",
    });

    expect(result.client).toBeNull();
    expect(result.persistence).toMatchObject({
      mode: "memory",
      status: "fallback",
      requested: true,
      availability: "missing_session",
    });
    expect(result.persistence.reason).toContain("no Supabase session token is active");
  });
});
