import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runHubSpotReadSync: vi.fn(),
}));

vi.mock("@/services/hubspot-read-sync", () => ({
  runHubSpotReadSync: mocks.runHubSpotReadSync,
}));

import { GET, HUBSPOT_BACKFILL_CRON_SCHEDULE } from "@/app/api/cron/hubspot-sync/route";

describe("HubSpot scheduled sync route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
  });

  it("fails closed without the exact bearer secret", async () => {
    const response = await GET(new Request("https://mymedlife.org/api/cron/hubspot-sync", {
      headers: { authorization: "Bearer wrong" },
    }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, code: "unauthorized" });
    expect(mocks.runHubSpotReadSync).not.toHaveBeenCalled();
  });

  it("runs the system incremental path and returns only safe metadata", async () => {
    mocks.runHubSpotReadSync.mockResolvedValue({
      success: true,
      code: "hubspot_sync_succeeded",
      runId: "run-1",
      counts: {},
      plainEnglishMessage: "private detail",
    });
    const response = await GET(new Request("https://mymedlife.org/api/cron/hubspot-sync", {
      headers: { authorization: "Bearer cron-secret" },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, code: "hubspot_sync_succeeded", runId: "run-1" });
    expect(mocks.runHubSpotReadSync).toHaveBeenCalledWith(null, "incremental", {
      triggerSource: "scheduled",
    });
  });

  it("runs a complete daily backfill so removed associations are reconciled", async () => {
    mocks.runHubSpotReadSync.mockResolvedValue({
      success: true,
      code: "hubspot_sync_succeeded",
      runId: "run-backfill",
      counts: {},
      plainEnglishMessage: "private detail",
    });
    const response = await GET(new Request("https://mymedlife.org/api/cron/hubspot-sync", {
      headers: {
        authorization: "Bearer cron-secret",
        "x-vercel-cron-schedule": HUBSPOT_BACKFILL_CRON_SCHEDULE,
      },
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      code: "hubspot_sync_succeeded",
      runId: "run-backfill",
    });
    expect(mocks.runHubSpotReadSync).toHaveBeenCalledWith(null, "backfill", {
      triggerSource: "scheduled",
    });
  });

  it("returns a conflict when another run owns the database lock", async () => {
    mocks.runHubSpotReadSync.mockResolvedValue({
      success: false,
      code: "sync_already_running",
      runId: null,
      plainEnglishMessage: "Already running.",
    });
    const response = await GET(new Request("https://mymedlife.org/api/cron/hubspot-sync", {
      headers: { authorization: "Bearer cron-secret" },
    }));
    expect(response.status).toBe(409);
  });
});
