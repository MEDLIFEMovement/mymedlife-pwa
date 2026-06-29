import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  SupabaseControlClient,
  SupabaseControlSelectOptions,
} from "@/lib/supabase-control-client";
import {
  defaultMedlifeThemeTokens,
  publishThemeDraftDurable,
  restoreDefaultThemeDurable,
  rollbackThemeDurable,
} from "@/modules/theme";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("@/lib/supabase-control-client", () => ({
  createSupabaseControlClient: vi.fn(),
}));

const superAdmin = () => getMockLocalActorContext("super.admin@mymedlife.test");

describe("theme durable updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records a production approval before publishing a production theme snapshot", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");
    const selectRows: SupabaseControlClient["selectRows"] = async <TRow,>(
      tableName: string,
      _options?: SupabaseControlSelectOptions,
    ) => {
      if (tableName === "theme_snapshots") {
        return [
          {
            id: "theme-draft-1",
            environment: "production",
            status: "draft",
            tokens: {
              ...defaultMedlifeThemeTokens,
              primaryButton: {
                ...defaultMedlifeThemeTokens.primaryButton,
                hex: "#004aad",
              },
            },
            created_at: "2026-06-29T12:00:00.000Z",
            updated_at: "2026-06-29T12:05:00.000Z",
            published_at: null,
            rollback_of_id: null,
          },
        ] as TRow[];
      }

      return [] as TRow[];
    };
    const rpc = vi
      .fn()
      .mockResolvedValueOnce("approval-1")
      .mockResolvedValueOnce([{ theme_id: "theme-active-1", audit_log_id: "audit-1" }]);

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "supabase",
        status: "ready",
        reason: "Durable theme control available.",
      },
      client: {
        persistence: {
          mode: "supabase",
          status: "ready",
          reason: "Durable theme control available.",
        },
        selectRows,
        rpc,
      } satisfies SupabaseControlClient,
    });

    await publishThemeDraftDurable({
      actor: superAdmin(),
      environment: "production",
      reason: "Publish the approved production theme for the pilot workspace.",
      approvalReference: "NICK-APPROVED",
      stepUpSessionId: "theme-step-up-session",
    });

    expect(rpc).toHaveBeenNthCalledWith(1, "record_production_control_approval", {
      approval_environment: "production",
      approval_scope: "theme_publish",
      target_key: "theme:production",
      approval_reference: "NICK-APPROVED",
      reason: "Publish the approved production theme for the pilot workspace.",
      expires_at: null,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "save_theme_control_snapshot", {
      theme_environment: "production",
      theme_status: "active",
      tokens: expect.any(Object),
      reason: "Publish the approved production theme for the pilot workspace.",
      contrast_override: false,
      approval_reference: "NICK-APPROVED",
      step_up_session_uuid: "theme-step-up-session",
      rollback_of_uuid: null,
    });
  });

  it("records rollback approvals before rollback and restore operations", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");
    const selectRows: SupabaseControlClient["selectRows"] = async <TRow,>(
      tableName: string,
      options?: SupabaseControlSelectOptions,
    ) => {
      if (
        tableName === "theme_snapshots" &&
        options?.query?.status === "eq.archived"
      ) {
        return [
          {
            id: "theme-archived-1",
            environment: "production",
            status: "archived",
            tokens: {
              ...defaultMedlifeThemeTokens,
              primaryButton: {
                ...defaultMedlifeThemeTokens.primaryButton,
                hex: "#004aad",
              },
            },
            created_at: "2026-06-29T11:00:00.000Z",
            updated_at: "2026-06-29T11:05:00.000Z",
            published_at: "2026-06-29T11:05:00.000Z",
            rollback_of_id: null,
          },
        ] as TRow[];
      }

      if (tableName === "theme_snapshots") {
        return [
          {
            id: "theme-active-2",
            environment: "production",
            status: "active",
            tokens: {
              ...defaultMedlifeThemeTokens,
              primaryButton: {
                ...defaultMedlifeThemeTokens.primaryButton,
                hex: "#1d4ed8",
              },
            },
            created_at: "2026-06-29T12:00:00.000Z",
            updated_at: "2026-06-29T12:05:00.000Z",
            published_at: "2026-06-29T12:05:00.000Z",
            rollback_of_id: null,
          },
        ] as TRow[];
      }

      return [] as TRow[];
    };
    const rpc = vi
      .fn()
      .mockResolvedValueOnce("approval-rollback")
      .mockResolvedValueOnce([{ theme_id: "theme-rollback-1", audit_log_id: "audit-rollback-1" }])
      .mockResolvedValueOnce("approval-restore")
      .mockResolvedValueOnce([{ theme_id: "theme-default-1", audit_log_id: "audit-default-1" }]);

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "supabase",
        status: "ready",
        reason: "Durable theme control available.",
      },
      client: {
        persistence: {
          mode: "supabase",
          status: "ready",
          reason: "Durable theme control available.",
        },
        selectRows,
        rpc,
      } satisfies SupabaseControlClient,
    });

    await rollbackThemeDurable({
      actor: superAdmin(),
      environment: "production",
      reason: "Rollback the production theme after approved pilot review feedback.",
      approvalReference: "NICK-APPROVED",
      stepUpSessionId: "theme-rollback-session",
    });

    await restoreDefaultThemeDurable({
      actor: superAdmin(),
      environment: "production",
      reason: "Restore the default production theme after approved rollback review.",
      approvalReference: "NICK-APPROVED",
      stepUpSessionId: "theme-default-session",
    });

    expect(rpc).toHaveBeenNthCalledWith(1, "record_production_control_approval", {
      approval_environment: "production",
      approval_scope: "rollback",
      target_key: "theme:production",
      approval_reference: "NICK-APPROVED",
      reason: "Rollback the production theme after approved pilot review feedback.",
      expires_at: null,
    });
    expect(rpc).toHaveBeenNthCalledWith(3, "record_production_control_approval", {
      approval_environment: "production",
      approval_scope: "rollback",
      target_key: "theme:production:default",
      approval_reference: "NICK-APPROVED",
      reason: "Restore the default production theme after approved rollback review.",
      expires_at: null,
    });
  });
});
