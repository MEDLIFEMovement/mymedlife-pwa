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

  it("records an explicit production approval before enabling a production-sensitive provider flag", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");
    const rpc = vi
      .fn()
      .mockResolvedValueOnce("approval-1")
      .mockResolvedValueOnce([
        {
          override_id: "override-production-1",
          old_status: "disabled",
          new_status: "enabled",
          audit_log_id: "audit-production-1",
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
      environment: "production",
      key: "integration_luma",
      nextStatus: "enabled",
      reason: "Enable production Luma only for the approved pilot event loop.",
      approvalReference: "NICK-APPROVED",
      stepUpSessionId: "step-up-session-123",
    });

    expect(rpc).toHaveBeenNthCalledWith(1, "record_production_control_approval", {
      approval_environment: "production",
      approval_scope: "feature_flag",
      target_key: "integration_luma",
      approval_reference: "NICK-APPROVED",
      reason: "Enable production Luma only for the approved pilot event loop.",
      expires_at: null,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "upsert_feature_flag_override", {
      flag_environment: "production",
      target_flag_key: "integration_luma",
      flag_kind: "provider",
      next_status: "enabled",
      reason: "Enable production Luma only for the approved pilot event loop.",
      approval_reference: "NICK-APPROVED",
      step_up_session_uuid: "step-up-session-123",
    });
  });
});
