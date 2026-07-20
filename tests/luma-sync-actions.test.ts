import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  createLocalSupabaseServerClient: vi.fn(),
  getAuthSessionState: vi.fn(),
  runLumaEventSync: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: mocks.createLocalSupabaseServerClient,
}));
vi.mock("@/services/auth-session", () => ({ getAuthSessionState: mocks.getAuthSessionState }));
vi.mock("@/services/luma-event-sync", () => ({ runLumaEventSync: mocks.runLumaEventSync }));

import {
  submitLumaEventSyncAction,
  submitLumaReplayAction,
} from "@/app/admin/integrations/luma/actions";

describe("Luma event-sync server actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires exact confirmation before touching auth or Luma", async () => {
    const formData = new FormData();
    formData.set("mode", "reconcile");
    formData.set("confirmation", "sync luma");

    await expect(submitLumaEventSyncAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/luma?lumaSyncResult=confirmation_required&mode=reconcile",
    );
    expect(mocks.createLocalSupabaseServerClient).not.toHaveBeenCalled();
    expect(mocks.runLumaEventSync).not.toHaveBeenCalled();
  });

  it("runs an authenticated reconciliation and returns only safe result metadata", async () => {
    const client = { auth: "client" };
    mocks.createLocalSupabaseServerClient.mockResolvedValue({ client });
    mocks.getAuthSessionState.mockResolvedValue({ user: { id: "actor-1" } });
    mocks.runLumaEventSync.mockResolvedValue({
      success: true,
      code: "luma_sync_succeeded",
      runId: "run id/1",
    });
    const formData = new FormData();
    formData.set("mode", "reconcile");
    formData.set("confirmation", "SYNC LUMA");

    await expect(submitLumaEventSyncAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/luma?lumaSyncResult=luma_sync_succeeded&runId=run%20id%2F1",
    );
    expect(mocks.getAuthSessionState).toHaveBeenCalledWith(client);
    expect(mocks.runLumaEventSync).toHaveBeenCalledWith("actor-1", "reconcile");
  });

  it("defaults to backfill and fails closed when no session client is available", async () => {
    mocks.createLocalSupabaseServerClient.mockResolvedValue({ client: null });
    mocks.runLumaEventSync.mockResolvedValue({ success: false, code: "missing_auth", runId: null });
    const formData = new FormData();
    formData.set("confirmation", "BACKFILL LUMA");

    await expect(submitLumaEventSyncAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/luma?lumaSyncResult=missing_auth",
    );
    expect(mocks.getAuthSessionState).not.toHaveBeenCalled();
    expect(mocks.runLumaEventSync).toHaveBeenCalledWith(null, "backfill");
  });

  it("replays a named run only after exact confirmation", async () => {
    const client = { auth: "client" };
    mocks.createLocalSupabaseServerClient.mockResolvedValue({ client });
    mocks.getAuthSessionState.mockResolvedValue({ user: { id: "actor-1" } });
    mocks.runLumaEventSync.mockResolvedValue({
      success: true,
      code: "luma_sync_succeeded",
      runId: "replay-1",
    });
    const formData = new FormData();
    formData.set("mode", "backfill");
    formData.set("retryOfRunId", "failed-1");
    formData.set("confirmation", "REPLAY LUMA");

    await expect(submitLumaReplayAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/luma?lumaSyncResult=luma_sync_succeeded&runId=replay-1",
    );
    expect(mocks.runLumaEventSync).toHaveBeenCalledWith("actor-1", "backfill", {
      triggerSource: "replay",
      retryOfRunId: "failed-1",
    });
  });

  it("rejects replay without both lineage and confirmation", async () => {
    const formData = new FormData();
    formData.set("confirmation", "REPLAY LUMA");

    await expect(submitLumaReplayAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/integrations/luma?lumaSyncResult=replay_confirmation_required",
    );
    expect(mocks.runLumaEventSync).not.toHaveBeenCalled();
  });
});
