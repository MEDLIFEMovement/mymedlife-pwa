import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  SupabaseControlClient,
  SupabaseControlSelectOptions,
} from "@/lib/supabase-control-client";
import {
  defaultMedlifeThemeTokens,
  getPublishedThemeCssVariablesDurable,
  publishThemeDraft,
  resetThemeStoreForTests,
  saveThemeDraft,
} from "@/modules/theme";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("@/lib/supabase-control-client", () => ({
  createSupabaseControlClient: vi.fn(),
}));

const dsAdmin = () => getMockLocalActorContext("ds.admin@mymedlife.test");

describe("published theme durable CSS", () => {
  beforeEach(() => {
    resetThemeStoreForTests();
    vi.clearAllMocks();
  });

  it("reads the published active theme snapshot from Supabase controls for signed-in shells", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");
    const selectRowsCalls = vi.fn();
    const selectRows: SupabaseControlClient["selectRows"] = async <TRow,>(
      tableName: string,
      options?: SupabaseControlSelectOptions,
    ) => {
      selectRowsCalls(tableName, options);
      return [
        {
          id: "theme-active-1",
          environment: "staging",
          status: "active",
          tokens: {
            ...defaultMedlifeThemeTokens,
            primaryButton: {
              ...defaultMedlifeThemeTokens.primaryButton,
              hex: "#004aad",
            },
          },
          created_at: "2026-06-28T20:00:00.000Z",
          updated_at: "2026-06-28T20:05:00.000Z",
          published_at: "2026-06-28T20:05:00.000Z",
          rollback_of_id: null,
        },
      ] as TRow[];
    };

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
        rpc: vi.fn(),
      } satisfies SupabaseControlClient,
    });

    const css = await getPublishedThemeCssVariablesDurable("staging", {
      MYMEDLIFE_CONTROL_LAYER_SOURCE: "supabase",
    });

    expect(selectRowsCalls).toHaveBeenCalledWith("theme_snapshots", {
      select:
        "id,environment,status,tokens,created_at,updated_at,published_at,rollback_of_id",
      query: {
        environment: "eq.staging",
        status: "eq.active",
      },
      order: { column: "updated_at", ascending: false },
      limit: 1,
    });
    expect(css).toContain("--mymedlife-primary-button: #004aad;");
  });

  it("falls back to the in-memory published theme when durable controls are unavailable", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");

    saveThemeDraft({
      actor: dsAdmin(),
      environment: "staging",
      tokenKey: "primaryButton",
      hex: "#1d4ed8",
      reason: "Prepare local published fallback theme.",
    });
    publishThemeDraft({
      actor: dsAdmin(),
      environment: "staging",
      reason: "Publish local fallback theme.",
    });

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "memory",
        status: "fallback",
        reason: "No active Supabase session for durable controls.",
      },
      client: null,
    });

    const css = await getPublishedThemeCssVariablesDurable("staging", {
      MYMEDLIFE_CONTROL_LAYER_SOURCE: "supabase",
    });

    expect(css).toContain("--mymedlife-primary-button: #1d4ed8;");
  });

  it("fails closed to the last published in-memory theme when durable theme readback errors", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");

    saveThemeDraft({
      actor: dsAdmin(),
      environment: "staging",
      tokenKey: "primaryButton",
      hex: "#2563eb",
      reason: "Prepare published theme before control readback failure.",
    });
    publishThemeDraft({
      actor: dsAdmin(),
      environment: "staging",
      reason: "Publish fallback theme before control readback failure.",
    });

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
        selectRows: async () => {
          throw new Error("theme snapshot readback unavailable");
        },
        rpc: vi.fn(),
      } satisfies SupabaseControlClient,
    });

    const css = await getPublishedThemeCssVariablesDurable("staging", {
      MYMEDLIFE_CONTROL_LAYER_SOURCE: "supabase",
    });

    expect(css).toContain("--mymedlife-primary-button: #2563eb;");
  });
});
