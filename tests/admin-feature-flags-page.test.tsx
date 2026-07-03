import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

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

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/read-only-app-data")>();

  return {
    ...actual,
    getReadOnlyAppData: vi.fn(),
  };
});

describe("admin feature flags page", () => {
  it("blocks general staff from the rollout controls lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing feature flags restriction."),
    );

    const { default: AdminFeatureFlagsPage } = await import(
      "@/app/admin/feature-flags/page"
    );
    const html = renderToStaticMarkup(await AdminFeatureFlagsPage({}));

    expect(html).toContain("Rollout controls are restricted");
    expect(html).toContain("Only DS Admin and Super Admin can open feature flags and theme settings.");
  });

  it("renders the feature-flag console when the workspace is ready", async () => {
    const workspaceModule = await import("@/services/admin-rollout-controls-workspace");
    vi.spyOn(workspaceModule, "getAdminFeatureFlagsWorkspace").mockResolvedValue({
      canReadWorkspace: true,
      title: "Feature flags",
      summary: "Persisted rollout controls.",
      persistenceWarning: null,
      nextStep: {
        href: "/admin/theme",
        label: "Open theme settings",
      },
      guard: {
        state: "ready",
        title: "DS Admin rollout controls",
        message: "Viewing is open.",
        stepUpFreshForProduction: true,
        stepUpMessage: "Production controls are unlocked for this session.",
        stepUpStatus: "verified",
      },
      cards: [
        {
          definition: {
            key: "staging_review_auth",
            label: "Staging review auth",
            description: "Allows staging sign-in.",
            category: "review",
            controlsExternalWrite: false,
            approvalPolicy: "standard",
            defaultEnabledByEnvironment: {
              local: true,
              staging: false,
              production: false,
            },
          },
          environments: [
            {
              environment: "staging",
              enabled: true,
              source: "persisted",
              approvalPolicy: "standard",
              updatedAt: "Today",
              updatedBy: "user-1",
              canAttemptEnable: true,
              warning: null,
            },
          ],
        },
      ],
      recentAuditRows: [
        {
          id: "audit-1",
          action: "feature_flag_updated",
          reason: "Allow reviewer sign-in.",
          createdAt: "Today",
          targetId: "flag-1",
        },
      ],
      resultBanner: null,
    });

    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "ds.admin@mymedlife.test",
        "Testing feature flags page.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing feature flags page."),
    );

    const { default: AdminFeatureFlagsPage } = await import(
      "@/app/admin/feature-flags/page"
    );
    const html = renderToStaticMarkup(await AdminFeatureFlagsPage({}));

    expect(html).toContain("Supabase-backed");
    expect(html).toContain("Dangerous flags stay narrow on purpose.");
    expect(html).toContain("Staging review auth");
    expect(html).toContain("Allow reviewer sign-in.");
    expect(html).toContain('href="/admin/theme"');
  });

  it("shows a persistence warning instead of crashing when rollout-control tables are not readable yet", async () => {
    const workspaceModule = await import("@/services/admin-rollout-controls-workspace");
    vi.spyOn(workspaceModule, "getAdminFeatureFlagsWorkspace").mockResolvedValue({
      canReadWorkspace: true,
      title: "Feature flags",
      summary: "Persisted rollout controls.",
      persistenceWarning:
        "Supabase rollout-control tables are not readable in this environment yet.",
      nextStep: {
        href: "/admin/theme",
        label: "Open theme settings",
      },
      guard: {
        state: "ready",
        title: "DS Admin rollout controls",
        message: "Viewing is open.",
        stepUpFreshForProduction: false,
        stepUpMessage: "Refresh step-up before any production change.",
        stepUpStatus: "needs_refresh",
      },
      cards: [],
      recentAuditRows: [],
      resultBanner: null,
    });

    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "ds.admin@mymedlife.test",
        "Testing feature flag warning.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing feature flag warning."),
    );

    const { default: AdminFeatureFlagsPage } = await import(
      "@/app/admin/feature-flags/page"
    );
    const html = renderToStaticMarkup(await AdminFeatureFlagsPage({}));

    expect(html).toContain("Persistence not available yet");
    expect(html).toContain("Supabase rollout-control tables are not readable");
    expect(html).toContain("Awaiting persistence proof");
    expect(html).not.toContain(">Supabase-backed<");
  });
});
