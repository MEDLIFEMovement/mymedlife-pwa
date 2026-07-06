import { describe, expect, it } from "vitest";
import {
  getMockLocalActorContext,
  localActorOptions,
} from "@/services/local-actor-context";
import {
  getMobileQuickNavigationForActor,
  getNavigationForActor,
} from "@/services/role-visibility";
import { getRouteSmokeManifest } from "@/services/route-smoke-manifest";
import {
  getAppRouteRegistry,
  isKnownAppRouteHref,
} from "@/services/app-route-registry";

describe("app route registry", () => {
  it("contains unique route entries", () => {
    const routes = getAppRouteRegistry();
    const routeKeys = routes.map((route) => `${route.routeType}:${route.href}`);

    expect(new Set(routeKeys).size).toBe(routeKeys.length);
  });

  it("covers every role-aware primary and mobile navigation href", () => {
    const actors = [
      undefined,
      ...localActorOptions.map((option) => getMockLocalActorContext(option.email)),
    ];

    const navigationHrefs = actors.flatMap((actor) => [
      ...getNavigationForActor(actor).map((item) => item.href),
      ...getMobileQuickNavigationForActor(actor).map((item) => item.href),
    ]);

    expect(navigationHrefs.every(isKnownAppRouteHref)).toBe(true);
  });

  it("covers every admin route smoke manifest href", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const manifest = getRouteSmokeManifest(actor);

    expect(manifest.routes.map((route) => route.path).every(isKnownAppRouteHref)).toBe(
      true,
    );
  });

  it("treats known dynamic route families as prefixes", () => {
    expect(isKnownAppRouteHref("/login")).toBe(true);
    expect(isKnownAppRouteHref("/offline")).toBe(true);
    expect(isKnownAppRouteHref("/profile")).toBe(true);
    expect(isKnownAppRouteHref("/app/stories")).toBe(true);
    expect(isKnownAppRouteHref("/app/events")).toBe(true);
    expect(isKnownAppRouteHref("/app/events/chapter-event-ucla-kickoff")).toBe(true);
    expect(isKnownAppRouteHref("/app/points")).toBe(true);
    expect(isKnownAppRouteHref("/leader?view=attendance")).toBe(true);
    expect(isKnownAppRouteHref("/staff")).toBe(true);
    expect(isKnownAppRouteHref("/admin/launch-gate")).toBe(true);
    expect(isKnownAppRouteHref("/admin/audit-log")).toBe(true);
    expect(isKnownAppRouteHref("/admin/integrations/luma")).toBe(true);
    expect(isKnownAppRouteHref("/admin/integration-outbox")).toBe(true);
    expect(isKnownAppRouteHref("/admin/pilot-scope")).toBe(true);
    expect(isKnownAppRouteHref("/rush-month/leaderboard")).toBe(true);
    expect(isKnownAppRouteHref("/campaigns/rush-month")).toBe(true);
    expect(isKnownAppRouteHref("/chapter?view=members")).toBe(true);
    expect(isKnownAppRouteHref("/app/slt-prep")).toBe(true);
    expect(isKnownAppRouteHref("/slt-prep")).toBe(true);
    expect(isKnownAppRouteHref("/admin/phase-2")).toBe(true);
    expect(isKnownAppRouteHref("/admin/sop-library")).toBe(true);
    expect(isKnownAppRouteHref("/unknown")).toBe(false);
  });

  it("keeps non-gate module families known but outside the invite smoke target", () => {
    const routes = getAppRouteRegistry();
    const routeHrefs = routes.map((route) => route.href);
    const nonGatePrefixes = [
      "/action-committees",
      "/campaigns",
      "/proof-library",
      "/rush-month",
      "/slt-prep",
      "/admin/committees",
      "/admin/feature-flags",
      "/admin/permissions",
      "/admin/sop-builder/",
      "/admin/sop-library",
      "/admin/theme",
      "/admin/workflows",
    ];
    const smokePaths = getRouteSmokeManifest(
      getMockLocalActorContext("admin@mymedlife.test"),
    ).routes.map((route) => route.path);

    for (const nonGatePrefix of nonGatePrefixes) {
      expect(routeHrefs.some((href) => href.startsWith(nonGatePrefix))).toBe(true);
      expect(smokePaths.some((href) => href.startsWith(nonGatePrefix))).toBe(false);
    }
  });
});
