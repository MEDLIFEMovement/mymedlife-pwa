import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getLocalActorContext: vi.fn(),
  getReadOnlyAppData: vi.fn(),
  getAdminLumaIntegrationStatus: vi.fn(),
  getAdminLumaSyncWorkspace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  usePathname: () => "/admin/integrations/luma",
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
vi.mock("@/services/read-only-app-data", () => ({
  getReadOnlyAppData: mocks.getReadOnlyAppData,
}));
vi.mock("@/services/admin-luma-integration-status", () => ({
  getAdminLumaIntegrationStatus: mocks.getAdminLumaIntegrationStatus,
}));
vi.mock("@/services/admin-luma-sync-workspace", () => ({
  getAdminLumaSyncWorkspace: mocks.getAdminLumaSyncWorkspace,
}));

import AdminLumaIntegrationPage from "@/app/admin/integrations/luma/page";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("admin Luma sync page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLocalActorContext.mockResolvedValue(getMockLocalActorContext(
      "ds.admin@mymedlife.test",
      "Signed in.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    ));
    mocks.getReadOnlyAppData.mockResolvedValue({
      source: {
        mode: "supabase",
        status: "connected",
        message: "Connected.",
      },
    });
    mocks.getAdminLumaIntegrationStatus.mockReturnValue({
      canReadWorkspace: true,
      title: "Luma integration status",
      summary: "Read-only TEST provider status.",
      environmentLabel: "Production read sync enabled",
      environment: "live_ready_not_enabled",
      providerStatus: "live_read_enabled",
      readSyncEnabled: true,
      testConnection: {
        label: "Provider read sync active",
        status: "pass",
        detail: "Read-only provider sync is active.",
      },
      lastTestTime: "Not recorded",
      lastSync: "2026-07-24T12:01:00.000Z",
      outboxStatus: "No live sends enabled",
      counts: {
        calendars: 1,
        linkedEvents: 67,
        lumaIntegrationEvents: 0,
        lumaOutboxRows: 0,
        liveSendRows: 0,
        browserSecretsShown: 0,
        externalReadsEnabled: 1,
        externalWritesEnabled: 0,
      },
      setupChecks: [],
      errorLog: [],
      safetyNotes: [],
      blockedControls: [],
    });
    mocks.getAdminLumaSyncWorkspace.mockResolvedValue(workspace());
  });

  it("replays the run and mode attached to each unresolved failure", async () => {
    const html = renderToStaticMarkup(await AdminLumaIntegrationPage());

    expect(html).toContain('name="retryOfRunId" value="failed-run-42"');
    expect(html).toContain('name="mode" value="backfill"');
    expect(html).not.toContain('name="retryOfRunId" value="latest-success"');
  });
});

function workspace() {
  return {
    canRead: true,
    config: {
      enabled: true,
      environment: "production",
      chapterId: "chapter-1",
      calendarId: "cal-1",
      calendarLabel: "TEST calendar",
      reason: "Enabled.",
    },
    lastRun: {
      id: "latest-success",
      mode: "reconcile",
      status: "succeeded",
      triggerSource: "manual",
      retryOfRunId: null,
      calendarId: "cal-1",
      chapterId: "chapter-1",
      startedAt: "2026-07-24T12:00:00.000Z",
      completedAt: "2026-07-24T12:01:00.000Z",
      heartbeatAt: "2026-07-24T12:01:00.000Z",
      sourceEvents: 67,
      materializedEvents: 0,
      updatedEvents: 67,
      conflicts: 0,
      failures: 0,
    },
    counts: {
      calendars: 1,
      importedEvents: 67,
      materializedEvents: 67,
      conflicts: 0,
      openFailures: 1,
    },
    failures: [{
      id: "failure-42",
      runId: "failed-run-42",
      mode: "backfill",
      objectType: "run",
      externalId: null,
      code: "luma_read_failed",
      message: "TEST provider read failed.",
      retryCount: 0,
      createdAt: "2026-07-24T11:59:00.000Z",
    }],
    health: {
      status: "degraded",
      label: "Needs attention",
      detail: "1 unresolved sync failure requires review.",
      expectedCadenceMinutes: 60,
      staleAfterMinutes: 120,
      lastObservedAt: "2026-07-24T12:01:00.000Z",
    },
    message: "Luma reads are enabled. Provider writes remain disabled.",
  };
}
