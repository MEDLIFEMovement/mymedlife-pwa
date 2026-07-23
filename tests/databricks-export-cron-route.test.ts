import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDatabricksEventMetricsExport: vi.fn(),
}));

vi.mock("@/services/databricks-event-metrics-export", () => ({
  runDatabricksEventMetricsExport: mocks.runDatabricksEventMetricsExport,
}));

import { GET } from "@/app/api/cron/databricks-event-metrics/route";

describe("Databricks scheduled export route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
  });

  it("fails closed without the exact bearer secret", async () => {
    const response = await GET(new Request(
      "https://mymedlife.org/api/cron/databricks-event-metrics",
      { headers: { authorization: "Bearer wrong" } },
    ));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      code: "unauthorized",
    });
    expect(mocks.runDatabricksEventMetricsExport).not.toHaveBeenCalled();
  });

  it("runs incrementally without impersonating an administrator", async () => {
    mocks.runDatabricksEventMetricsExport.mockResolvedValue({
      success: true,
      code: "databricks_export_succeeded",
      runId: "run-1",
      plainEnglishMessage: "private detail",
    });
    const response = await GET(new Request(
      "https://mymedlife.org/api/cron/databricks-event-metrics",
      { headers: { authorization: "Bearer cron-secret" } },
    ));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      code: "databricks_export_succeeded",
      runId: "run-1",
    });
    expect(mocks.runDatabricksEventMetricsExport).toHaveBeenCalledWith(
      null,
      "incremental",
      { triggerSource: "scheduled" },
    );
  });

  it("maps lock and disabled outcomes to honest HTTP responses", async () => {
    mocks.runDatabricksEventMetricsExport.mockResolvedValueOnce({
      success: false,
      code: "export_already_running",
      runId: null,
    });
    const locked = await GET(authorizedRequest());
    expect(locked.status).toBe(409);

    mocks.runDatabricksEventMetricsExport.mockResolvedValueOnce({
      success: false,
      code: "export_disabled",
      runId: null,
    });
    const disabled = await GET(authorizedRequest());
    expect(disabled.status).toBe(503);
  });
});

function authorizedRequest() {
  return new Request(
    "https://mymedlife.org/api/cron/databricks-event-metrics",
    { headers: { authorization: "Bearer cron-secret" } },
  );
}
