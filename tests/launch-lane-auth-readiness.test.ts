import { describe, expect, it } from "vitest";

import { isKnownAppRouteHref } from "@/services/app-route-registry";
import {
  getActiveLaunchLaneAuthReadiness,
  getBlockedLaunchLaneAuthReadiness,
  getLaunchLaneAuthReadiness,
  getLaunchLaneAuthReadinessByHref,
} from "@/services/launch-lane-auth-readiness";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getRouteSmokeManifest } from "@/services/route-smoke-manifest";

describe("launch lane auth readiness", () => {
  it("classifies the current launch-lane routes by auth posture and evidence policy", () => {
    const routes = getLaunchLaneAuthReadiness();

    expect(routes.map((route) => route.canonicalHref)).toEqual([
      "/login",
      "/app",
      "/app/events",
      "/app/events/chapter-event-ucla-kickoff",
      "/app/points",
      "/app/stories",
      "/leader?view=overview",
      "/staff?view=chapters",
      "/admin",
      "/admin/users",
      "/admin/chapters",
      "/admin/access",
      "/admin/launch-gate",
      "/admin/audit-log",
      "/admin/integration-outbox",
      "/admin/integrations/luma",
      "/admin/pilot-scope",
    ]);

    expect(
      routes.every(
        (route) =>
          route.status === "active" &&
          route.readOnly &&
          route.rolloutEvidence === "exclude_test_and_preview" &&
          route.notes.length > 0,
      ),
    ).toBe(true);
  });

  it("keeps active routes known to the app registry and only maps explicit smoke targets into the launch-lane smoke manifest", () => {
    const activeRoutes = getActiveLaunchLaneAuthReadiness();
    const manifestPaths = new Set(
      getRouteSmokeManifest(getMockLocalActorContext("admin@mymedlife.test")).routes.map(
        (route) => route.path,
      ),
    );

    expect(
      activeRoutes.every((route) => isKnownAppRouteHref(route.canonicalHref)),
    ).toBe(true);
    expect(
      activeRoutes
        .flatMap((route) => route.smokePath ?? [])
        .every((path) => manifestPaths.has(path)),
    ).toBe(true);
  });

  it("marks signed-in launch-lane routes as local sandbox review only until real production proof exists", () => {
    const signedInRoutes = getActiveLaunchLaneAuthReadiness().filter(
      (route) => route.authRequirement === "signed_in",
    );

    expect(
      signedInRoutes.every(
        (route) =>
          route.sandboxReview === "supported" &&
          route.productionProof === "required",
      ),
    ).toBe(true);

    expect(getLaunchLaneAuthReadinessByHref("/staff?view=chapters")).toMatchObject({
      workspace: "staff",
      access: "owner_only",
      productionProof: "required",
    });
    expect(getLaunchLaneAuthReadinessByHref("/admin")).toMatchObject({
      workspace: "admin",
      access: "owner_only",
      productionProof: "required",
    });
  });

  it("treats /app/stories as a live member route while keeping sandbox proof out of rollout evidence", () => {
    const blockedRoutes = getBlockedLaunchLaneAuthReadiness();
    const storiesRoute = getLaunchLaneAuthReadinessByHref("/app/stories");
    const manifestPaths = getRouteSmokeManifest(
      getMockLocalActorContext("admin@mymedlife.test"),
    ).routes.map((route) => route.path);

    expect(blockedRoutes).toHaveLength(0);
    expect(storiesRoute).toMatchObject({
      status: "active",
      access: "owner_or_preview",
      sandboxReview: "supported",
      productionProof: "required",
      rolloutEvidence: "exclude_test_and_preview",
    });
    expect(isKnownAppRouteHref("/app/stories")).toBe(true);
    expect(manifestPaths).not.toContain("/app/stories");
  });
});
