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
    expect(isKnownAppRouteHref("/app/events")).toBe(true);
    expect(isKnownAppRouteHref("/app/events/chapter-event-ucla-kickoff")).toBe(true);
    expect(isKnownAppRouteHref("/app/points")).toBe(true);
    expect(isKnownAppRouteHref("/app/slt-prep")).toBe(true);
    expect(isKnownAppRouteHref("/leader?view=attendance")).toBe(true);
    expect(isKnownAppRouteHref("/staff")).toBe(true);
    expect(isKnownAppRouteHref("/admin/launch-gate")).toBe(true);
    expect(isKnownAppRouteHref("/admin/audit-log")).toBe(true);
    expect(isKnownAppRouteHref("/admin/integration-outbox")).toBe(true);
    expect(isKnownAppRouteHref("/admin/pilot-scope")).toBe(true);
    expect(isKnownAppRouteHref("/rush-month/leaderboard")).toBe(false);
    expect(isKnownAppRouteHref("/campaigns/rush-month")).toBe(false);
    expect(isKnownAppRouteHref("/chapter?view=members")).toBe(false);
    expect(isKnownAppRouteHref("/slt-prep")).toBe(false);
    expect(isKnownAppRouteHref("/admin/phase-2")).toBe(false);
    expect(isKnownAppRouteHref("/admin/sop-library")).toBe(false);
    expect(isKnownAppRouteHref("/unknown")).toBe(false);
  });
});
