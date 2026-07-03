import { describe, expect, it } from "vitest";
import {
  formatProductionCoreRouteSmokeResult,
  getProductionCoreRouteSmokeResult,
  type ProductionCoreRouteSnapshot,
} from "@/services/production-core-route-smoke";

describe("production core route smoke", () => {
  it("passes when login serves and the core workspaces redirect to login", () => {
    const result = getProductionCoreRouteSmokeResult(createReadySnapshots());

    expect(result.ready).toBe(true);
    expect(result.checks.every((check) => check.passed)).toBe(true);
    expect(formatProductionCoreRouteSmokeResult(result, "https://example.test")).toContain(
      "Production core route smoke: READY",
    );
  });

  it("fails when a workspace does not preserve its redirect destination", () => {
    const snapshots = createReadySnapshots().map((snapshot) =>
      snapshot.path === "/leader"
        ? {
            ...snapshot,
            location: "/login",
          }
        : snapshot,
    );
    const result = getProductionCoreRouteSmokeResult(snapshots);

    expect(result.ready).toBe(false);
    expect(result.checks).toContainEqual({
      label: "/leader preserves the intended destination",
      passed: false,
      detail: "received location /login",
    });
  });

  it("fails when the login page is missing its product copy", () => {
    const snapshots = createReadySnapshots().map((snapshot) =>
      snapshot.path === "/login"
        ? {
            ...snapshot,
            html: "<main>Sign in</main>",
          }
        : snapshot,
    );
    const result = getProductionCoreRouteSmokeResult(snapshots);

    expect(result.ready).toBe(false);
    expect(result.checks).toContainEqual({
      label: 'Login page contains "myMEDLIFE"',
      passed: false,
      detail: "expected text missing",
    });
  });
});

function createReadySnapshots(): ProductionCoreRouteSnapshot[] {
  return [
    {
      path: "/login",
      status: 200,
      html: "<main>myMEDLIFE Use one account</main>",
    },
    {
      path: "/app",
      status: 307,
      location: "/login?redirectTo=%2Fapp",
    },
    {
      path: "/leader",
      status: 307,
      location: "/login?redirectTo=%2Fleader%3Fview%3Doverview",
    },
    {
      path: "/staff",
      status: 307,
      location: "/login?redirectTo=%2Fstaff%3Fview%3Dchapters",
    },
  ];
}
