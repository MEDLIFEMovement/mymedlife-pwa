import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  createLocalSupabaseServerClient: vi.fn(),
  getAuthSessionState: vi.fn(),
  runDatabricksEventMetricsExport: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: mocks.createLocalSupabaseServerClient,
}));
vi.mock("@/services/auth-session", () => ({
  getAuthSessionState: mocks.getAuthSessionState,
}));
vi.mock("@/services/databricks-event-metrics-export", () => ({
  runDatabricksEventMetricsExport: mocks.runDatabricksEventMetricsExport,
}));

import {
  submitDatabricksExportAction,
  submitDatabricksReplayAction,
} from "@/app/admin/integrations/databricks/actions";

describe("Databricks export server actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires exact confirmation before reading auth or starting an export", async () => {
    const formData = new FormData();
    formData.set("mode", "incremental");
    formData.set("confirmation", "export databricks");

    await expect(submitDatabricksExportAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/databricks?databricksResult=confirmation_required&mode=incremental",
    );
    expect(mocks.createLocalSupabaseServerClient).not.toHaveBeenCalled();
    expect(mocks.runDatabricksEventMetricsExport).not.toHaveBeenCalled();
  });

  it("runs an authenticated incremental export and returns safe metadata", async () => {
    const client = { auth: "client" };
    mocks.createLocalSupabaseServerClient.mockResolvedValue({ client });
    mocks.getAuthSessionState.mockResolvedValue({ user: { id: "actor-1" } });
    mocks.runDatabricksEventMetricsExport.mockResolvedValue({
      success: true,
      code: "databricks_export_succeeded",
      runId: "run id/1",
    });
    const formData = new FormData();
    formData.set("mode", "incremental");
    formData.set("confirmation", "EXPORT DATABRICKS");

    await expect(submitDatabricksExportAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/databricks?databricksResult=databricks_export_succeeded&runId=run%20id%2F1",
    );
    expect(mocks.getAuthSessionState).toHaveBeenCalledWith(client);
    expect(mocks.runDatabricksEventMetricsExport).toHaveBeenCalledWith(
      "actor-1",
      "incremental",
    );
  });

  it("fails closed when the server session client is unavailable", async () => {
    mocks.createLocalSupabaseServerClient.mockResolvedValue({ client: null });
    mocks.runDatabricksEventMetricsExport.mockResolvedValue({
      success: false,
      code: "missing_auth",
      runId: null,
    });
    const formData = new FormData();
    formData.set("confirmation", "BACKFILL DATABRICKS");

    await expect(submitDatabricksExportAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/databricks?databricksResult=missing_auth",
    );
    expect(mocks.getAuthSessionState).not.toHaveBeenCalled();
    expect(mocks.runDatabricksEventMetricsExport).toHaveBeenCalledWith(
      null,
      "backfill",
    );
  });

  it("replays only a named run with exact confirmation", async () => {
    const client = { auth: "client" };
    mocks.createLocalSupabaseServerClient.mockResolvedValue({ client });
    mocks.getAuthSessionState.mockResolvedValue({ user: { id: "actor-1" } });
    mocks.runDatabricksEventMetricsExport.mockResolvedValue({
      success: true,
      code: "databricks_export_succeeded",
      runId: "replay-1",
    });
    const formData = new FormData();
    formData.set("mode", "backfill");
    formData.set("retryOfRunId", "failed-1");
    formData.set("confirmation", "REPLAY DATABRICKS");

    await expect(submitDatabricksReplayAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/databricks?databricksResult=databricks_export_succeeded&runId=replay-1",
    );
    expect(mocks.runDatabricksEventMetricsExport).toHaveBeenCalledWith(
      "actor-1",
      "backfill",
      { triggerSource: "replay", retryOfRunId: "failed-1" },
    );
  });
});
