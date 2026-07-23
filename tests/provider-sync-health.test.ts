import { describe, expect, it } from "vitest";

import { getProviderSyncHealth } from "@/services/provider-sync-health";

const now = new Date("2026-07-23T12:00:00.000Z");

describe("provider sync health", () => {
  it("reports disabled and never-run states without implying freshness", () => {
    expect(getProviderSyncHealth({
      enabled: false,
      lastRun: null,
      openFailures: 0,
      now,
    })).toMatchObject({ status: "disabled", label: "Disabled", lastObservedAt: null });

    expect(getProviderSyncHealth({
      enabled: true,
      lastRun: null,
      openFailures: 0,
      now,
    })).toMatchObject({
      status: "never_run",
      label: "Never run",
      expectedCadenceMinutes: 60,
      staleAfterMinutes: 120,
    });
  });

  it("separates current, stale, degraded, and failed completed runs", () => {
    expect(healthFor("succeeded", "2026-07-23T11:30:00.000Z", 0)).toMatchObject({
      status: "healthy",
      label: "Current",
    });
    expect(healthFor("succeeded", "2026-07-23T09:00:00.000Z", 0)).toMatchObject({
      status: "stale",
      label: "Stale",
    });
    expect(healthFor("succeeded", "2026-07-23T11:30:00.000Z", 2)).toMatchObject({
      status: "degraded",
      label: "Needs attention",
    });
    expect(healthFor("failed", "2026-07-23T11:30:00.000Z", 1)).toMatchObject({
      status: "failed",
      label: "Failed",
    });
  });

  it("detects a stale running heartbeat and invalid timestamps", () => {
    expect(healthFor("running", "2026-07-23T09:30:00.000Z", 0)).toMatchObject({
      status: "stale",
      label: "Run heartbeat stale",
    });
    expect(healthFor("running", "2026-07-23T11:55:00.000Z", 0)).toMatchObject({
      status: "running",
      label: "Running",
    });
    expect(healthFor("succeeded", "not-a-date", 0)).toMatchObject({
      status: "degraded",
      label: "Timestamp unavailable",
    });
    expect(healthFor("succeeded", "", 0)).toMatchObject({
      status: "degraded",
      label: "Timestamp unavailable",
      lastObservedAt: null,
    });
  });
});

function healthFor(status: string, observedAt: string, openFailures: number) {
  return getProviderSyncHealth({
    enabled: true,
    lastRun: {
      status,
      startedAt: observedAt,
      completedAt: observedAt,
      heartbeatAt: observedAt,
    },
    openFailures,
    now,
  });
}
