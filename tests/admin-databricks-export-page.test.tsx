import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  getLocalActorContext: vi.fn(),
  getAdminDatabricksExportWorkspace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  usePathname: () => "/admin/integrations/databricks",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/login/actions", () => ({
  signOut: async () => undefined,
}));
vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/services/local-actor-context")
  >();
  return {
    ...actual,
    getLocalActorContext: mocks.getLocalActorContext,
  };
});
vi.mock("@/services/admin-databricks-export-workspace", () => ({
  getAdminDatabricksExportWorkspace:
    mocks.getAdminDatabricksExportWorkspace,
}));

import AdminDatabricksIntegrationPage from "@/app/admin/integrations/databricks/page";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("admin Databricks export page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLocalActorContext.mockResolvedValue(signedIn("ds.admin"));
    mocks.getAdminDatabricksExportWorkspace.mockResolvedValue(workspace());
  });

  it("renders governed export readback and confirmation controls without credentials or member identity", async () => {
    const html = renderToStaticMarkup(
      await AdminDatabricksIntegrationPage({
        searchParams: Promise.resolve({
          databricksResult: "databricks_export_succeeded",
          runId: "run-1",
        }),
      }),
    );

    expect(html).toContain("Databricks event metrics");
    expect(html).toContain("Supabase remains operational truth");
    expect(html).toContain("Aggregate event metrics export is enabled");
    expect(html).toContain("EXPORT DATABRICKS");
    expect(html).toContain("BACKFILL DATABRICKS");
    expect(html).toContain("REPLAY DATABRICKS");
    expect(html).toContain("Databricks export completed");
    expect(html).toContain("databricks_export_partial");
    expect(html).not.toMatch(/DATABRICKS_TOKEN|member@example|server-only-token/i);
  });

  it("renders an explicit restricted state when database readback is unavailable", async () => {
    mocks.getAdminDatabricksExportWorkspace.mockResolvedValue({
      ...workspace(),
      canRead: false,
      message: "Databricks export readback is unavailable.",
    });
    const html = renderToStaticMarkup(
      await AdminDatabricksIntegrationPage({
        searchParams: Promise.resolve({}),
      }),
    );
    expect(html).toContain("Databricks export readback is unavailable");
    expect(html).not.toContain("BACKFILL DATABRICKS");
  });

  it("redirects signed-out and non-admin actors before loading export readback", async () => {
    mocks.getLocalActorContext.mockResolvedValue(getMockLocalActorContext(
      "ds.admin@mymedlife.test",
      "Signed out.",
      "mock_fallback",
      "local_actor_email",
      "signed_out",
    ));
    await expect(AdminDatabricksIntegrationPage({
      searchParams: Promise.resolve({}),
    })).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fadmin%2Fintegrations%2Fdatabricks",
    );
    expect(mocks.getAdminDatabricksExportWorkspace).not.toHaveBeenCalled();

    mocks.getLocalActorContext.mockResolvedValue(signedIn("member.a"));
    await expect(AdminDatabricksIntegrationPage({
      searchParams: Promise.resolve({}),
    })).rejects.toThrow("NEXT_REDIRECT:/app");
  });
});

function signedIn(localPart: string) {
  return getMockLocalActorContext(
    `${localPart}@mymedlife.test`,
    "Signed in.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

function workspace() {
  return {
    canRead: true,
    config: {
      enabled: true,
      environment: "production",
      host: "https://dbc-example.cloud.databricks.com",
      warehouseId: "warehouse-1",
      catalog: "mymedlife",
      schema: "analytics",
      table: "event_metrics",
      targetTable: "mymedlife.analytics.event_metrics",
      reason: "Enabled.",
    },
    counts: {
      totalRuns: 4,
      succeededRuns: 2,
      partialRuns: 1,
      failedRuns: 1,
      openFailures: 1,
    },
    lastRun: {
      id: "run-1",
      mode: "incremental",
      status: "partial",
      triggerSource: "scheduled",
      retryOfRunId: null,
      batchKey: "batch-1",
      checkpointBefore: "2026-07-22T18:00:00.000Z",
      checkpointAfter: null,
      sourceRows: 5,
      exportedRows: 5,
      statementId: "statement-1",
      startedAt: "2026-07-23T18:00:00.000Z",
      completedAt: "2026-07-23T18:05:00.000Z",
      errorSummary: "Audit checkpoint needs replay",
    },
    failures: [{
      id: "failure-1",
      runId: "run-1",
      mode: "incremental",
      code: "databricks_export_partial",
      message: "Audit checkpoint needs replay",
      retryCount: 0,
      createdAt: "2026-07-23T18:05:00.000Z",
    }],
    message: "Aggregate event metrics export is enabled.",
  };
}
