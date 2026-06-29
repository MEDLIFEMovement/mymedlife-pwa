import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  SupabaseControlClient,
  SupabaseControlSelectOptions,
} from "@/lib/supabase-control-client";
import { getFeatureFlagAdminState } from "@/modules/feature-flags";
import { defaultMedlifeThemeTokens, getThemeAdminState } from "@/modules/theme";

vi.mock("@/lib/supabase-control-client", () => ({
  createSupabaseControlClient: vi.fn(),
}));

describe("production control approval readback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters production approval rows to feature-flag approvals in the feature flag admin state", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");
    const selectRows: SupabaseControlClient["selectRows"] = async <TRow,>(
      tableName: string,
      _options?: SupabaseControlSelectOptions,
    ) => {
      if (tableName === "production_control_approvals") {
        return [
          {
            id: "approval-feature-1",
            environment: "production",
            scope: "feature_flag",
            target_key: "integration_luma",
            approval_reference: "NICK-APPROVED",
            reason: "Enable production Luma only for the approved pilot event loop.",
            approved_by: "user-1",
            expires_at: null,
            created_at: "2026-06-29T12:00:00.000Z",
          },
          {
            id: "approval-theme-1",
            environment: "production",
            scope: "theme_publish",
            target_key: "theme:production",
            approval_reference: "THEME-APPROVED",
            reason: "Publish production theme for the approved pilot workspace.",
            approved_by: "user-2",
            expires_at: null,
            created_at: "2026-06-29T11:00:00.000Z",
          },
        ] as TRow[];
      }

      return [] as TRow[];
    };

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "supabase",
        status: "ready",
        reason: "Durable control readback available.",
      },
      client: {
        persistence: {
          mode: "supabase",
          status: "ready",
          reason: "Durable control readback available.",
        },
        selectRows,
        rpc: vi.fn(),
      } satisfies SupabaseControlClient,
    });

    const state = await getFeatureFlagAdminState({ environment: "production" });

    expect(state.productionApprovalRecords).toEqual([
      {
        id: "approval-feature-1",
        environment: "production",
        scope: "feature_flag",
        targetKey: "integration_luma",
        approvalReference: "NICK-APPROVED",
        reason: "Enable production Luma only for the approved pilot event loop.",
        approvedBy: "user-1",
        expiresAt: null,
        createdAt: "2026-06-29T12:00:00.000Z",
      },
    ]);
  });

  it("filters production approval rows to theme publish and rollback scopes in the theme admin state", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");
    const selectRows: SupabaseControlClient["selectRows"] = async <TRow,>(
      tableName: string,
      options?: SupabaseControlSelectOptions,
    ) => {
      if (tableName === "theme_snapshots") {
        return [
          {
            id: "theme-active-1",
            environment: "production",
            status: "active",
            tokens: defaultMedlifeThemeTokens,
            created_at: "2026-06-29T12:00:00.000Z",
            updated_at: "2026-06-29T12:05:00.000Z",
            published_at: "2026-06-29T12:05:00.000Z",
            rollback_of_id: null,
          },
        ] as TRow[];
      }

      if (tableName === "production_control_approvals") {
        return [
          {
            id: "approval-feature-1",
            environment: "production",
            scope: "feature_flag",
            target_key: "integration_luma",
            approval_reference: "NICK-APPROVED",
            reason: "Enable production Luma only for the approved pilot event loop.",
            approved_by: "user-1",
            expires_at: null,
            created_at: "2026-06-29T12:00:00.000Z",
          },
          {
            id: "approval-theme-1",
            environment: "production",
            scope: "theme_publish",
            target_key: "theme:production",
            approval_reference: "THEME-APPROVED",
            reason: "Publish production theme for the approved pilot workspace.",
            approved_by: "user-2",
            expires_at: null,
            created_at: "2026-06-29T11:00:00.000Z",
          },
          {
            id: "approval-rollback-1",
            environment: "production",
            scope: "rollback",
            target_key: "theme:production",
            approval_reference: "ROLLBACK-APPROVED",
            reason: "Rollback the production theme after approved pilot review feedback.",
            approved_by: "user-3",
            expires_at: null,
            created_at: "2026-06-29T10:00:00.000Z",
          },
        ] as TRow[];
      }

      if (options?.limit === 10) {
        return [] as TRow[];
      }

      return [] as TRow[];
    };

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "supabase",
        status: "ready",
        reason: "Durable control readback available.",
      },
      client: {
        persistence: {
          mode: "supabase",
          status: "ready",
          reason: "Durable control readback available.",
        },
        selectRows,
        rpc: vi.fn(),
      } satisfies SupabaseControlClient,
    });

    const state = await getThemeAdminState({ environment: "production" });

    expect(state.productionApprovalRecords).toEqual([
      {
        id: "approval-theme-1",
        environment: "production",
        scope: "theme_publish",
        targetKey: "theme:production",
        approvalReference: "THEME-APPROVED",
        reason: "Publish production theme for the approved pilot workspace.",
        approvedBy: "user-2",
        expiresAt: null,
        createdAt: "2026-06-29T11:00:00.000Z",
      },
      {
        id: "approval-rollback-1",
        environment: "production",
        scope: "rollback",
        targetKey: "theme:production",
        approvalReference: "ROLLBACK-APPROVED",
        reason: "Rollback the production theme after approved pilot review feedback.",
        approvedBy: "user-3",
        expiresAt: null,
        createdAt: "2026-06-29T10:00:00.000Z",
      },
    ]);
  });
});
