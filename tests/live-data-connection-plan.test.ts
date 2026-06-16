import { describe, expect, it } from "vitest";
import {
  getLiveDataConnectionPlan,
  getNextRouteForLiveData,
  liveDataConnectionPhases,
  routeMigrationOrder,
} from "@/services/live-data-connection-plan";

describe("live data connection plan", () => {
  it("keeps production Supabase, browser writes, and external writes disabled", () => {
    expect(getLiveDataConnectionPlan()).toEqual(
      expect.objectContaining({
        productionSupabaseEnabled: false,
        browserWritesEnabled: false,
        externalWritesEnabled: false,
      }),
    );
  });

  it("keeps every phase production-safe", () => {
    expect(
      liveDataConnectionPhases.every((phase) => {
        return !phase.productionEnabled && !phase.externalWritesEnabled;
      }),
    ).toBe(true);
  });

  it("starts route migration with low-risk read-only routes", () => {
    expect(routeMigrationOrder.slice(0, 3).map((item) => item.route)).toEqual([
      "/chapter",
      "/rush-month",
      "/rush-month/actions",
    ]);
    expect(
      routeMigrationOrder.slice(0, 3).every((item) => {
        return item.firstLiveDataMode === "read_only";
      }),
    ).toBe(true);
  });

  it("keeps action, evidence, and HQ decisions on function-only write paths", () => {
    expect(
      routeMigrationOrder
        .filter((item) => {
          return [
            "/rush-month/actions/[assignmentId]",
            "/rush-month/evidence",
            "/rush-month/review",
          ].includes(item.route);
        })
        .map((item) => item.firstLiveDataMode),
    ).toEqual([
      "local_function_write",
      "local_function_write",
      "local_function_write",
    ]);
  });

  it("returns the next uncompleted route in order", () => {
    expect(getNextRouteForLiveData([])?.route).toBe("/chapter");
    expect(getNextRouteForLiveData(["/chapter"])?.route).toBe("/rush-month");
    expect(getNextRouteForLiveData(routeMigrationOrder.map((item) => item.route))).toBe(
      null,
    );
  });
});
