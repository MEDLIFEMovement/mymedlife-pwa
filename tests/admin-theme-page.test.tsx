import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/theme",
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

describe("admin theme page", () => {
  it("shows sign-in guidance when the rollout workspace needs a real DS/Admin auth session", async () => {
    const workspaceModule = await import("@/services/admin-rollout-controls-workspace");
    vi.spyOn(workspaceModule, "getAdminThemeWorkspace").mockResolvedValue({
      canReadWorkspace: false,
      title: "Theme settings",
      summary: "Persisted theme controls.",
      persistenceWarning: null,
      nextStep: {
        href: "/admin/feature-flags",
        label: "Open feature flags",
      },
      guard: {
        state: "sign_in_required",
        title: "A signed-in DS/Admin session is required",
        message: "No hosted staging Supabase Auth session is active.",
      },
      cards: [],
      recentAuditRows: [],
      resultBanner: null,
    });

    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("super.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing theme sign-in gate."),
    );

    const { default: AdminThemePage } = await import("@/app/admin/theme/page");
    const html = renderToStaticMarkup(await AdminThemePage({}));

    expect(html).toContain("A signed-in DS/Admin session is required");
    expect(html).toContain('href="/login?next=/admin/theme"');
  });

  it("renders the theme console chrome when the workspace is ready", async () => {
    const workspaceModule = await import("@/services/admin-rollout-controls-workspace");
    vi.spyOn(workspaceModule, "getAdminThemeWorkspace").mockResolvedValue({
      canReadWorkspace: true,
      title: "Theme settings",
      summary: "Persisted theme controls.",
      persistenceWarning: null,
      nextStep: {
        href: "/admin/feature-flags",
        label: "Open feature flags",
      },
      guard: {
        state: "ready",
        title: "Super Admin rollout controls",
        message: "Viewing is open.",
        stepUpFreshForProduction: false,
        stepUpMessage: "Refresh step-up before any production change.",
        stepUpStatus: "needs_refresh",
      },
      cards: [
        {
          definition: {
            key: "accent",
            label: "Accent",
            description: "Primary action color token.",
            inputType: "color",
            group: "core",
            defaultValueByEnvironment: {
              local: "#5d8ff6",
              staging: "#5d8ff6",
              production: "#5d8ff6",
            },
          },
          environments: [
            {
              environment: "production",
              value: "#2563eb",
              source: "persisted",
              updatedAt: "Today",
              updatedBy: "user-1",
            },
          ],
        },
      ],
      recentAuditRows: [
        {
          id: "audit-2",
          action: "theme_setting_updated",
          reason: "Move to the approved blue token.",
          createdAt: "Today",
          targetId: "theme-1",
        },
      ],
      resultBanner: null,
    });

    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "super.admin@mymedlife.test",
        "Testing theme page.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing theme page."),
    );

    const { default: AdminThemePage } = await import("@/app/admin/theme/page");
    const html = renderToStaticMarkup(await AdminThemePage({}));

    expect(html).toContain("The app shell stays white-blue on purpose.");
    expect(html).toContain("Accent");
    expect(html).toContain("Move to the approved blue token.");
    expect(html).toContain('href="/admin/feature-flags"');
  });

  it("shows a truthful pending-proof badge when theme persistence is not readable yet", async () => {
    const workspaceModule = await import("@/services/admin-rollout-controls-workspace");
    vi.spyOn(workspaceModule, "getAdminThemeWorkspace").mockResolvedValue({
      canReadWorkspace: true,
      title: "Theme settings",
      summary: "Persisted theme controls.",
      persistenceWarning:
        "Supabase rollout-control tables are not readable in this environment yet.",
      nextStep: {
        href: "/admin/feature-flags",
        label: "Open feature flags",
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
        "Testing theme warning badge.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing theme warning badge."),
    );

    const { default: AdminThemePage } = await import("@/app/admin/theme/page");
    const html = renderToStaticMarkup(await AdminThemePage({}));

    expect(html).toContain("Persistence not available yet");
    expect(html).toContain("Awaiting persistence proof");
    expect(html).not.toContain(">Supabase-backed<");
  });
});
