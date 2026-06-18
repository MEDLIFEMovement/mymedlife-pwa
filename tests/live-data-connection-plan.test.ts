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
    expect(routeMigrationOrder.slice(0, 14).map((item) => item.route)).toEqual([
      "/login",
      "/profile",
      "/onboarding",
      "/chapter",
      "/chapter/members",
      "/campaigns",
      "/campaigns/[campaignSlug]",
      "/action-committees",
      "/rush-month",
      "/rush-month/dashboard",
      "/rush-month/leaderboard",
      "/rush-month/events",
      "/rush-month/events/[eventId]",
      "/rush-month/actions",
    ]);
    expect(
      routeMigrationOrder.slice(0, 14).every((item) => {
        return item.firstLiveDataMode === "read_only";
      }),
    ).toBe(true);
  });

  it("keeps local sign-in review first and read-only before production auth", () => {
    const loginRoute = routeMigrationOrder.find((item) => {
      return item.route === "/login";
    });

    expect(routeMigrationOrder[0]?.route).toBe("/login");
    expect(loginRoute?.firstLiveDataMode).toBe("read_only");
    expect(loginRoute?.reason).toContain("fake Supabase Auth");
    expect(loginRoute?.reason).toContain("production users");
  });

  it("keeps proof library read-only before uploads or publishing", () => {
    expect(
      routeMigrationOrder.find((item) => {
        return item.route === "/proof-library";
      })?.firstLiveDataMode,
    ).toBe("read_only");
  });

  it("keeps the focused admin master-data route read-only", () => {
    expect(
      routeMigrationOrder.find((item) => {
        return item.route === "/admin/master-data";
      })?.firstLiveDataMode,
    ).toBe("read_only");
  });

  it("keeps the focused admin launch-gate route read-only", () => {
    const launchGateRoute = routeMigrationOrder.find((item) => {
      return item.route === "/admin/launch-gate";
    });

    expect(launchGateRoute?.firstLiveDataMode).toBe("read_only");
    expect(launchGateRoute?.reason).toContain("Production launch gate");
    expect(launchGateRoute?.reason).toContain("live evidence");
  });

  it("keeps the focused admin release-readiness route read-only", () => {
    const releaseReadinessRoute = routeMigrationOrder.find((item) => {
      return item.route === "/admin/release-readiness";
    });

    expect(releaseReadinessRoute?.firstLiveDataMode).toBe("read_only");
    expect(releaseReadinessRoute?.reason).toContain("MVP release-readiness");
    expect(releaseReadinessRoute?.reason).toContain("launch blockers");
  });

  it("keeps the focused admin review-path route read-only", () => {
    const reviewPathRoute = routeMigrationOrder.find((item) => {
      return item.route === "/admin/review-path";
    });

    expect(reviewPathRoute?.firstLiveDataMode).toBe("read_only");
    expect(reviewPathRoute?.reason).toContain("Stakeholder review path");
    expect(reviewPathRoute?.reason).toContain("fake actor");
  });

  it("keeps the focused Nick final review route read-only", () => {
    const nickReviewRoute = routeMigrationOrder.find((item) => {
      return item.route === "/admin/nick-review";
    });

    expect(nickReviewRoute?.firstLiveDataMode).toBe("read_only");
    expect(nickReviewRoute?.reason).toContain("Nick final review");
    expect(nickReviewRoute?.reason).toContain("student invitations");
  });

  it("keeps the focused admin integration-outbox route read-only", () => {
    expect(
      routeMigrationOrder.find((item) => {
        return item.route === "/admin/integration-outbox";
      })?.firstLiveDataMode,
    ).toBe("read_only");
  });

  it("keeps the focused admin audit-log route read-only", () => {
    expect(
      routeMigrationOrder.find((item) => {
        return item.route === "/admin/audit-log";
      })?.firstLiveDataMode,
    ).toBe("read_only");
  });

  it("keeps the focused admin system-health route read-only", () => {
    expect(
      routeMigrationOrder.find((item) => {
        return item.route === "/admin/system-health";
      })?.firstLiveDataMode,
    ).toBe("read_only");
  });

  it("keeps the focused admin database-security route read-only", () => {
    const databaseSecurityRoute = routeMigrationOrder.find((item) => {
      return item.route === "/admin/database-security";
    });

    expect(databaseSecurityRoute?.firstLiveDataMode).toBe("read_only");
    expect(databaseSecurityRoute?.reason).toContain("Database security");
    expect(databaseSecurityRoute?.reason).toContain("PlanetScale");
  });

  it("keeps the focused admin design-QA route read-only", () => {
    const designQaRoute = routeMigrationOrder.find((item) => {
      return item.route === "/admin/design-qa";
    });

    expect(designQaRoute?.firstLiveDataMode).toBe("read_only");
    expect(designQaRoute?.reason).toContain("Design QA");
    expect(designQaRoute?.reason).toContain("launch claims");
  });

  it("keeps the focused admin operations route read-only", () => {
    const operationsRoute = routeMigrationOrder.find((item) => {
      return item.route === "/admin/operations";
    });

    expect(operationsRoute?.firstLiveDataMode).toBe("read_only");
    expect(operationsRoute?.reason).toContain("Production operations");
    expect(operationsRoute?.reason).toContain("launch approval");
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
    expect(getNextRouteForLiveData([])?.route).toBe("/login");
    expect(getNextRouteForLiveData(["/login"])?.route).toBe("/profile");
    expect(getNextRouteForLiveData(["/login", "/profile"])?.route).toBe(
      "/onboarding",
    );
    expect(getNextRouteForLiveData(["/login", "/profile", "/onboarding"])?.route).toBe(
      "/chapter",
    );
    expect(
      getNextRouteForLiveData([
        "/login",
        "/profile",
        "/onboarding",
        "/chapter",
        "/chapter/members",
        "/campaigns",
        "/campaigns/[campaignSlug]",
        "/action-committees",
      ])?.route,
    ).toBe("/rush-month");
    expect(getNextRouteForLiveData(routeMigrationOrder.map((item) => item.route))).toBe(
      null,
    );
  });
});
