import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  SupabaseControlClient,
  SupabaseControlSelectOptions,
} from "@/lib/supabase-control-client";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/feature-flags",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

vi.mock("@/services/admin-integrations-step-up", () => ({
  getDsSecretStepUpState: vi.fn(),
  needsFreshProductionStepUp: vi.fn(
    (state: { isVerified: boolean }) => !state.isVerified,
  ),
}));

vi.mock("@/lib/supabase-control-client", () => ({
  createSupabaseControlClient: vi.fn(async () => ({
    persistence: {
      mode: "memory",
      status: "fallback",
      requested: false,
      availability: "disabled",
      reason:
        "Using in-memory admin controls because MYMEDLIFE_CONTROL_LAYER_SOURCE is not set to supabase.",
    },
    client: null,
  })),
  isSupabaseControlLayerRequested: vi.fn(
    (env?: Record<string, string | undefined>) =>
      (env ?? process.env).MYMEDLIFE_CONTROL_LAYER_SOURCE === "supabase",
  ),
}));

describe("feature flags and theme admin pages", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const supabaseControl = await import("@/lib/supabase-control-client");
    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "memory",
        status: "fallback",
        requested: false,
        availability: "disabled",
        reason:
          "Using in-memory admin controls because MYMEDLIFE_CONTROL_LAYER_SOURCE is not set to supabase.",
      },
      client: null,
    });
  });

  it("uses source-aware audit empty states for memory and Supabase mode", async () => {
    const { getFeatureFlagAuditEmptyStateCopy, getThemeAuditEmptyStateCopy } =
      await import("@/modules/admin/control-audit-empty-state");

    expect(getFeatureFlagAuditEmptyStateCopy("memory", "staging")).toContain(
      "No in-memory feature flag changes have been made for staging",
    );
    expect(getFeatureFlagAuditEmptyStateCopy("supabase", "staging")).toContain(
      "No durable feature flag audit rows exist yet for staging",
    );
    expect(
      getFeatureFlagAuditEmptyStateCopy(
        {
          mode: "memory",
          status: "fallback",
          requested: true,
          availability: "missing_session",
        },
        "staging",
      ),
    ).toContain("not signed in to the Supabase control layer yet");
    expect(
      getFeatureFlagAuditEmptyStateCopy(
        {
          mode: "memory",
          status: "fallback",
          requested: true,
          availability: "unavailable",
        },
        "staging",
      ),
    ).toContain("requested but not available in this environment yet");
    expect(getThemeAuditEmptyStateCopy("memory", "staging")).toContain(
      "No in-memory theme changes have been made for staging",
    );
    expect(getThemeAuditEmptyStateCopy("supabase", "staging")).toContain(
      "No durable theme audit rows exist yet for staging",
    );
    expect(
      getThemeAuditEmptyStateCopy(
        {
          mode: "memory",
          status: "fallback",
          requested: true,
          availability: "missing_session",
        },
        "staging",
      ),
    ).toContain("not signed in to the Supabase control layer yet");
    expect(
      getThemeAuditEmptyStateCopy(
        {
          mode: "memory",
          status: "fallback",
          requested: true,
          availability: "unavailable",
        },
        "staging",
      ),
    ).toContain("requested but not available in this environment yet");
  });

  it("blocks non-DS users from feature flag controls", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: FeatureFlagsPage } = await import("@/app/admin/feature-flags/page");
    const html = renderToStaticMarkup(await FeatureFlagsPage({}));

    expect(html).toContain("Feature flags are restricted.");
    expect(html).toContain("Only DS Admin and Super Admin can manage module and provider feature flags.");
    expect(html).not.toContain("Module Flags");
  });

  it("sends hosted preview fallbacks back through staging sign-in for feature flags", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "leader.a@mymedlife.test",
        "Using MYMEDLIFE_LOCAL_ACTOR_EMAIL because no signed-in hosted staging reviewer session is active.",
        "mock_fallback",
        "local_actor_email",
        "signed_out",
        false,
      ),
    );

    const { default: FeatureFlagsPage } = await import("@/app/admin/feature-flags/page");
    const html = renderToStaticMarkup(
      await FeatureFlagsPage({
        searchParams: Promise.resolve({ env: "staging" }),
      }),
    );

    expect(html).toContain("Hosted reviewer sign-in required");
    expect(html).toContain("Sign in to review durable feature flags.");
    expect(html).toContain("Use a seeded DS Admin or Super Admin account");
    expect(html).toContain("/login?redirectTo=%2Fadmin%2Ffeature-flags%3Fenv%3Dstaging");
    expect(html).toContain("Admin navigation");
    expect(html).not.toContain("Leader navigation");
    expect(html).not.toContain("Feature flags are restricted.");
  });

  it("renders the feature flag registry for DS Admin", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
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

    const { default: FeatureFlagsPage } = await import("@/app/admin/feature-flags/page");
    const html = renderToStaticMarkup(await FeatureFlagsPage({}));

    expect(html).toContain("Feature flag registry");
    expect(html).toContain("Module Flags");
    expect(html).toContain("Provider Flags");
    expect(html).toContain("Events, Luma, and Points");
    expect(html).toContain("SOP Workflows and Next Action");
    expect(html).toContain("Luma");
    expect(html).toContain("Recent feature flag changes");
    expect(html).toContain("Recent production provider approvals");
    expect(html).toContain("Override rows");
    expect(html).toContain("Audit rows");
    expect(html).toContain("Step-up rows");
    expect(html).toContain("Prod approvals");
    expect(html).toContain("Step-up");
    expect(html).toContain("Prod gate");
    expect(html).toContain("Production safety gate:");
    expect(html).toContain("Step-up status:");
    expect(html).toContain("Control review snapshot");
    expect(html).toContain("Recorded now");
    expect(html).toContain("Still blocked");
    expect(html).toContain("Local review posture is still active");
    expect(html).toContain("Visible durable control rows");
    expect(html).toContain("Durable control storage is not active yet");
    expect(html).toContain(
      "Durable hosted feature flag readback is not active for local yet, so override rows, audit rows, step-up rows, and approval rows are still zero in this review lane.",
    );
    expect(html).toContain(
      "No in-memory feature flag changes have been made for local in this local review session.",
    );
    expect(html).toContain(
      "Production provider flags stay blocked until Supabase-backed control storage and approval rows are available.",
    );
    expect(html).toContain(
      "Step-up authentication is required before entering the integrations security area.",
    );
    expect(html).toContain(
      "Production approval rows will appear here once Supabase-backed control storage is active.",
    );
    expect(html).not.toContain("server session");
  });

  it("renders Supabase-backed feature flag readback for a signed-in DS Admin reviewer", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    const supabaseControl = await import("@/lib/supabase-control-client");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: true,
      status: "verified",
      method: "local_password_reauth",
      sessionId: "step-up-feature-flags",
      verifiedAt: "2026-06-29T20:00:00.000Z",
      expiresAt: "2026-06-29T20:10:00.000Z",
      failureCount: 0,
      blockedUntil: null,
      message: "Fresh DS/Admin step-up is active for production-sensitive provider changes.",
    });

    const selectRows: SupabaseControlClient["selectRows"] = async <TRow,>(
      tableName: string,
      options?: SupabaseControlSelectOptions,
    ) => {
      if (tableName === "feature_flag_overrides") {
        return [
          { environment: "staging", flag_key: "events_luma_points", status: "enabled" },
          { environment: "staging", flag_key: "integration_luma", status: "scheduled" },
        ] as TRow[];
      }

      if (
        tableName === "feature_flag_audit_records" &&
        options?.select?.includes("actor_user_id")
      ) {
        return [
          {
            id: "audit-flag-1",
            actor_user_id: "ds-admin-1",
            actor_email: "ds.admin@mymedlife.test",
            actor_role: "ds_admin",
            environment: "staging",
            flag_key: "integration_luma",
            old_status: "disabled",
            new_status: "scheduled",
            reason: "Keep hosted Luma review visible without opening production traffic.",
            created_at: "2026-06-29T20:02:00.000Z",
          },
        ] as TRow[];
      }

      if (tableName === "feature_flag_audit_records") {
        return [{ id: "audit-flag-1" }] as TRow[];
      }

      if (tableName === "admin_step_up_sessions") {
        return [{ id: "step-up-feature-flags" }] as TRow[];
      }

      if (tableName === "production_control_approvals") {
        return [
          {
            id: "approval-flag-1",
            environment: "production",
            scope: "feature_flag",
            target_key: "integration_luma",
            approval_reference: "KIOMI-APPROVED",
            reason: "Hold production Luma in scheduled posture until pilot launch.",
            approved_by: "ds.admin@mymedlife.test",
            expires_at: null,
            created_at: "2026-06-29T20:03:00.000Z",
          },
        ] as TRow[];
      }

      return [] as TRow[];
    };

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "supabase",
        status: "ready",
        requested: true,
        availability: "ready",
        reason:
          "Reading and writing feature flags, theme snapshots, approvals, step-up sessions, and audit rows from Supabase.",
      },
      client: {
        persistence: {
          mode: "supabase",
          status: "ready",
          requested: true,
          availability: "ready",
          reason:
            "Reading and writing feature flags, theme snapshots, approvals, step-up sessions, and audit rows from Supabase.",
        },
        selectRows,
        rpc: vi.fn(),
      } satisfies SupabaseControlClient,
    });

    const { default: FeatureFlagsPage } = await import("@/app/admin/feature-flags/page");
    const html = renderToStaticMarkup(
      await FeatureFlagsPage({
        searchParams: Promise.resolve({ env: "staging" }),
      }),
    );

    expect(html).toContain("Feature flag registry");
    expect(html).toContain("Persistence");
    expect(html).toContain("supabase");
    expect(html).toContain(
      "Reading and writing feature flags, theme snapshots, approvals, step-up sessions, and audit rows from Supabase.",
    );
    expect(html).toContain("Supabase-backed control storage is active");
    expect(html).toContain("Feature flag controls for staging are reading durable rows");
    expect(html).toContain("1 durable feature flag audit row(s) are visible for reviewer readback.");
    expect(html).toContain("1 recent durable production provider approval row(s) are visible in this review lane.");
    expect(html).toContain("Fresh admin step-up is active");
    expect(html).toContain("Keep hosted Luma review visible without opening production traffic.");
    expect(html).toContain("KIOMI-APPROVED");
    expect(html).toContain("integration_luma");
    expect(html).not.toContain("Local review posture is still active");
    expect(html).not.toContain("Durable control storage is not active yet");
    expect(html).not.toContain(
      "Production approval rows will appear here once Supabase-backed control storage is active.",
    );
  });

  it("blocks non-DS users from theme controls", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );

    const { default: ThemePage } = await import("@/app/admin/theme/page");
    const html = renderToStaticMarkup(await ThemePage({}));

    expect(html).toContain("Theme admin is restricted.");
    expect(html).toContain("Only DS Admin and Super Admin can edit, publish, rollback, or restore theme tokens.");
    expect(html).not.toContain("Theme tokens");
  });

  it("sends hosted preview fallbacks back through staging sign-in for theme controls", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "leader.a@mymedlife.test",
        "Using MYMEDLIFE_LOCAL_ACTOR_EMAIL because no signed-in hosted staging reviewer session is active.",
        "mock_fallback",
        "local_actor_email",
        "signed_out",
        false,
      ),
    );

    const { default: ThemePage } = await import("@/app/admin/theme/page");
    const html = renderToStaticMarkup(
      await ThemePage({
        searchParams: Promise.resolve({ env: "staging" }),
      }),
    );

    expect(html).toContain("Hosted reviewer sign-in required");
    expect(html).toContain("Sign in to review durable theme controls.");
    expect(html).toContain("Use a seeded DS Admin or Super Admin account");
    expect(html).toContain("/login?redirectTo=%2Fadmin%2Ftheme%3Fenv%3Dstaging");
    expect(html).toContain("Admin navigation");
    expect(html).not.toContain("Leader navigation");
    expect(html).not.toContain("Theme admin is restricted.");
  });

  it("renders audited theme controls for Super Admin", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("super.admin@mymedlife.test"),
    );
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: false,
      status: "expired",
      method: "local_password_reauth",
      sessionId: "theme-step-up",
      verifiedAt: "2026-06-29T18:30:00.000Z",
      expiresAt: "2026-06-29T18:35:00.000Z",
      failureCount: 0,
      blockedUntil: null,
      message: "The step-up session expired. Re-authenticate to continue with secure actions.",
    });

    const { default: ThemePage } = await import("@/app/admin/theme/page");
    const html = renderToStaticMarkup(await ThemePage({}));

    expect(html).toContain("Manage myMEDLIFE colors as audited design tokens.");
    expect(html).toContain("Theme tokens");
    expect(html).toContain("Preview");
    expect(html).toContain("Publish theme");
    expect(html).toContain("Rollback theme");
    expect(html).toContain("Restore MEDLIFE default");
    expect(html).toContain("Contrast checks");
    expect(html).toContain("Recent production theme approvals");
    expect(html).toContain("Snapshot rows");
    expect(html).toContain("Audit rows");
    expect(html).toContain("Step-up rows");
    expect(html).toContain("Prod approvals");
    expect(html).toContain("Step-up");
    expect(html).toContain("Prod gate");
    expect(html).toContain("Production safety gate:");
    expect(html).toContain("Step-up status:");
    expect(html).toContain("Control review snapshot");
    expect(html).toContain("Recorded now");
    expect(html).toContain("Still blocked");
    expect(html).toContain("Local theme review posture is still active");
    expect(html).toContain("Visible durable control rows");
    expect(html).toContain("Production theme actions remain step-up locked");
    expect(html).toContain(
      "Durable hosted theme readback is not active for local yet, so snapshot rows, audit rows, step-up rows, and approval rows are still zero in this review lane.",
    );
    expect(html).toContain(
      "No in-memory theme changes have been made for local in this local review session.",
    );
    expect(html).toContain(
      "Production theme changes stay blocked until Supabase-backed control storage and approval rows are available.",
    );
    expect(html).toContain(
      "The step-up session expired. Re-authenticate to continue with secure actions.",
    );
    expect(html).toContain("Verified at 2026-06-29T18:30:00.000Z and expires at 2026-06-29T18:35:00.000Z.");
    expect(html).toContain(
      "Production approval rows will appear here once Supabase-backed control storage is active.",
    );
    expect(html).not.toContain("server session");
  });

  it("renders Supabase-backed theme readback for a signed-in Super Admin reviewer", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const stepUpModule = await import("@/services/admin-integrations-step-up");
    const supabaseControl = await import("@/lib/supabase-control-client");
    const { defaultMedlifeThemeTokens } = await import("@/modules/theme");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("super.admin@mymedlife.test"),
    );
    vi.mocked(stepUpModule.getDsSecretStepUpState).mockResolvedValue({
      isVerified: true,
      status: "verified",
      method: "local_password_reauth",
      sessionId: "step-up-theme",
      verifiedAt: "2026-06-29T20:05:00.000Z",
      expiresAt: "2026-06-29T20:15:00.000Z",
      failureCount: 0,
      blockedUntil: null,
      message: "Fresh DS/Admin step-up is active for production theme actions.",
    });

    const selectRows: SupabaseControlClient["selectRows"] = async <TRow,>(
      tableName: string,
      options?: SupabaseControlSelectOptions,
    ) => {
      if (
        tableName === "theme_snapshots" &&
        options?.select?.includes("id,environment,status,tokens")
      ) {
        return [
          {
            id: "theme-staging-1",
            environment: "staging",
            status: "active",
            tokens: {
              ...defaultMedlifeThemeTokens,
              background: {
                ...defaultMedlifeThemeTokens.background,
                hex: "#f5fbff",
              },
              primaryButton: {
                ...defaultMedlifeThemeTokens.primaryButton,
                hex: "#0057b8",
              },
            },
            created_at: "2026-06-29T20:00:00.000Z",
            updated_at: "2026-06-29T20:04:00.000Z",
            published_at: "2026-06-29T20:04:00.000Z",
            rollback_of_id: null,
          },
        ] as TRow[];
      }

      if (tableName === "theme_snapshots") {
        return [
          { id: "theme-staging-1" },
          { id: "theme-staging-2" },
          { id: "theme-staging-3" },
        ] as TRow[];
      }

      if (
        tableName === "theme_audit_records" &&
        options?.select?.includes("actor_user_id")
      ) {
        return [
          {
            id: "theme-audit-1",
            actor_user_id: "super-admin-1",
            actor_email: "super.admin@mymedlife.test",
            actor_role: "super_admin",
            environment: "staging",
            action: "theme_published",
            theme_id: "theme-staging-1",
            reason: "Publish the staging palette for review parity.",
            contrast_override: false,
            created_at: "2026-06-29T20:06:00.000Z",
          },
        ] as TRow[];
      }

      if (tableName === "theme_audit_records") {
        return [{ id: "theme-audit-1" }] as TRow[];
      }

      if (tableName === "admin_step_up_sessions") {
        return [{ id: "step-up-theme" }] as TRow[];
      }

      if (tableName === "production_control_approvals") {
        return [
          {
            id: "approval-theme-1",
            environment: "production",
            scope: "theme_publish",
            target_key: "theme:staging",
            approval_reference: "NICK-APPROVED",
            reason: "Hold the approved theme snapshot for production launch prep.",
            approved_by: "super.admin@mymedlife.test",
            expires_at: null,
            created_at: "2026-06-29T20:07:00.000Z",
          },
        ] as TRow[];
      }

      return [] as TRow[];
    };

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "supabase",
        status: "ready",
        requested: true,
        availability: "ready",
        reason:
          "Reading and writing feature flags, theme snapshots, approvals, step-up sessions, and audit rows from Supabase.",
      },
      client: {
        persistence: {
          mode: "supabase",
          status: "ready",
          requested: true,
          availability: "ready",
          reason:
            "Reading and writing feature flags, theme snapshots, approvals, step-up sessions, and audit rows from Supabase.",
        },
        selectRows,
        rpc: vi.fn(),
      } satisfies SupabaseControlClient,
    });

    const { default: ThemePage } = await import("@/app/admin/theme/page");
    const html = renderToStaticMarkup(
      await ThemePage({
        searchParams: Promise.resolve({ env: "staging" }),
      }),
    );

    expect(html).toContain("Theme admin");
    expect(html).toContain("Persistence");
    expect(html).toContain("supabase");
    expect(html).toContain("Supabase-backed theme storage is active");
    expect(html).toContain("Theme controls for staging are reading durable theme snapshots");
    expect(html).toContain("1 durable theme audit row(s) are visible for reviewer readback.");
    expect(html).toContain("1 recent durable production theme approval row(s) are visible in this review lane.");
    expect(html).toContain("Fresh admin step-up is active");
    expect(html).toContain("Publish the staging palette for review parity.");
    expect(html).toContain("NICK-APPROVED");
    expect(html).toContain("theme_publish");
    expect(html).not.toContain("Local theme review posture is still active");
    expect(html).not.toContain("Durable theme storage is not active yet");
    expect(html).not.toContain(
      "Production approval rows will appear here once Supabase-backed control storage is active.",
    );
  });
});
