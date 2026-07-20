import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  createLocalSupabaseServerClient: vi.fn(),
  getAuthSessionState: vi.fn(),
  runHubSpotReadSync: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: mocks.createLocalSupabaseServerClient,
}));

vi.mock("@/services/auth-session", () => ({
  getAuthSessionState: mocks.getAuthSessionState,
}));

vi.mock("@/services/hubspot-read-sync", () => ({
  runHubSpotReadSync: mocks.runHubSpotReadSync,
}));

import { submitHubSpotReadSyncAction, submitHubSpotReplayAction } from "@/app/admin/integrations/hubspot/actions";

describe("HubSpot read-sync server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires the exact confirmation before touching auth or HubSpot", async () => {
    const formData = new FormData();
    formData.set("mode", "incremental");
    formData.set("confirmation", "sync hubspot");

    await expect(submitHubSpotReadSyncAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/hubspot?hubspotSyncResult=confirmation_required&mode=incremental",
    );
    expect(mocks.createLocalSupabaseServerClient).not.toHaveBeenCalled();
    expect(mocks.runHubSpotReadSync).not.toHaveBeenCalled();
  });

  it("runs an authenticated incremental sync and returns its safe result and run id", async () => {
    const client = { auth: "client" };
    mocks.createLocalSupabaseServerClient.mockResolvedValue({ client, config: { reason: "Enabled." } });
    mocks.getAuthSessionState.mockResolvedValue({ status: "signed_in", user: { id: "actor-1" } });
    mocks.runHubSpotReadSync.mockResolvedValue({
      success: true,
      code: "hubspot_sync_succeeded",
      runId: "run id/1",
    });
    const formData = new FormData();
    formData.set("mode", "incremental");
    formData.set("confirmation", "SYNC HUBSPOT");

    await expect(submitHubSpotReadSyncAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/hubspot?hubspotSyncResult=hubspot_sync_succeeded&runId=run%20id%2F1",
    );
    expect(mocks.getAuthSessionState).toHaveBeenCalledWith(client);
    expect(mocks.runHubSpotReadSync).toHaveBeenCalledWith("actor-1", "incremental");
  });

  it("defaults to backfill and fails closed when no session client is available", async () => {
    mocks.createLocalSupabaseServerClient.mockResolvedValue({ client: null, config: { reason: "Unavailable." } });
    mocks.runHubSpotReadSync.mockResolvedValue({ success: false, code: "missing_auth" });
    const formData = new FormData();
    formData.set("confirmation", "BACKFILL HUBSPOT");

    await expect(submitHubSpotReadSyncAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/hubspot?hubspotSyncResult=missing_auth",
    );
    expect(mocks.getAuthSessionState).not.toHaveBeenCalled();
    expect(mocks.runHubSpotReadSync).toHaveBeenCalledWith(null, "backfill");
  });

  it("replays a named failed run only after exact confirmation", async () => {
    const client = { auth: "client" };
    mocks.createLocalSupabaseServerClient.mockResolvedValue({ client, config: { reason: "Enabled." } });
    mocks.getAuthSessionState.mockResolvedValue({ status: "signed_in", user: { id: "actor-1" } });
    mocks.runHubSpotReadSync.mockResolvedValue({ success: true, code: "hubspot_sync_succeeded", runId: "replay-1" });
    const formData = new FormData();
    formData.set("mode", "incremental");
    formData.set("retryOfRunId", "failed-1");
    formData.set("confirmation", "REPLAY HUBSPOT");

    await expect(submitHubSpotReplayAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/hubspot?hubspotSyncResult=hubspot_sync_succeeded&runId=replay-1",
    );
    expect(mocks.runHubSpotReadSync).toHaveBeenCalledWith("actor-1", "incremental", {
      triggerSource: "replay",
      retryOfRunId: "failed-1",
    });
  });
});
