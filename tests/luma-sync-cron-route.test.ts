import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ runLumaEventSync: vi.fn() }));

vi.mock("@/services/luma-event-sync", () => ({ runLumaEventSync: mocks.runLumaEventSync }));

import { GET } from "@/app/api/cron/luma-event-sync/route";

describe("Luma scheduled sync route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
  });

  it("fails closed without the exact bearer secret", async () => {
    const response = await GET(new Request("https://mymedlife.org/api/cron/luma-event-sync", {
      headers: { authorization: "Bearer wrong" },
    }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, code: "unauthorized" });
    expect(mocks.runLumaEventSync).not.toHaveBeenCalled();
  });

  it("runs the scheduler without impersonating an admin and returns safe metadata", async () => {
    mocks.runLumaEventSync.mockResolvedValue({
      success: true,
      code: "luma_sync_succeeded",
      runId: "run-1",
      counts: {},
      plainEnglishMessage: "private detail",
    });
    const response = await GET(new Request("https://mymedlife.org/api/cron/luma-event-sync", {
      headers: { authorization: "Bearer cron-secret" },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, code: "luma_sync_succeeded", runId: "run-1" });
    expect(mocks.runLumaEventSync).toHaveBeenCalledWith(null, "reconcile", { triggerSource: "scheduled" });
  });

  it("maps lock and disabled states to honest HTTP responses", async () => {
    mocks.runLumaEventSync.mockResolvedValueOnce({ success: false, code: "sync_already_running", runId: null });
    const locked = await GET(new Request("https://mymedlife.org/api/cron/luma-event-sync", {
      headers: { authorization: "Bearer cron-secret" },
    }));
    expect(locked.status).toBe(409);

    mocks.runLumaEventSync.mockResolvedValueOnce({ success: false, code: "sync_disabled", runId: null });
    const disabled = await GET(new Request("https://mymedlife.org/api/cron/luma-event-sync", {
      headers: { authorization: "Bearer cron-secret" },
    }));
    expect(disabled.status).toBe(503);
  });
});
