import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseControlClient } from "@/lib/supabase-control-client";
import { updateFeatureFlagStatusDurable } from "@/modules/feature-flags";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("@/lib/supabase-control-client", () => ({
  createSupabaseControlClient: vi.fn(),
}));

const dsAdmin = () => getMockLocalActorContext("ds.admin@mymedlife.test");

describe("feature flag durable updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the Supabase RPC with the target_flag_key payload expected by the control-layer function", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");
    const rpc = vi.fn().mockResolvedValue([
      {
        override_id: "override-1",
        old_status: "enabled",
        new_status: "disabled",
        audit_log_id: "audit-1",
      },
    ]);

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "supabase",
        status: "ready",
        reason: "Durable feature flag control available.",
      },
      client: {
        persistence: {
          mode: "supabase",
          status: "ready",
          reason: "Durable feature flag control available.",
        },
        selectRows: vi.fn(),
        rpc,
      } satisfies SupabaseControlClient,
    });

    await updateFeatureFlagStatusDurable({
      actor: dsAdmin(),
      environment: "staging",
      key: "events_luma_points",
      nextStatus: "disabled",
      reason: "Pause the event loop during hosted review.",
    });

    expect(rpc).toHaveBeenCalledWith("upsert_feature_flag_override", {
      flag_environment: "staging",
      target_flag_key: "events_luma_points",
      flag_kind: "module",
      next_status: "disabled",
      reason: "Pause the event loop during hosted review.",
      approval_reference: null,
      step_up_session_uuid: null,
    });
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty("flag_key");
  });
});
