import {
  getMockLocalActorContext,
  localActorOptions,
  type LocalActorContext,
} from "@/services/local-actor-context";
import { getAppRouteRegistry, isKnownAppRouteHref } from "@/services/app-route-registry";
import {
  getMobileQuickNavigationForActor,
  getNavigationForActor,
} from "@/services/role-visibility";
import { getRouteSmokeManifest } from "@/services/route-smoke-manifest";

export type RouteCoverageSummary = {
  canReadSummary: boolean;
  title: string;
  summary: string;
  unknownNavigationHrefs: string[];
  unknownSmokeRoutes: string[];
  counts: {
    knownRoutes: number;
    exactRoutes: number;
    prefixRoutes: number;
    primaryNavigationHrefs: number;
    mobileNavigationHrefs: number;
    smokeRoutes: number;
    unknownNavigationHrefs: number;
    unknownSmokeRoutes: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export function getRouteCoverageSummary(
  actor: LocalActorContext,
): RouteCoverageSummary {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadSummary: false,
      title: "Route coverage hidden for this role",
      summary: "Route coverage is an admin review aid.",
      unknownNavigationHrefs: [],
      unknownSmokeRoutes: [],
      counts: emptyCounts(),
    };
  }

  const registry = getAppRouteRegistry();
  const primaryNavigationHrefs = unique(
    getNavigationActors().flatMap((localActor) =>
      getNavigationForActor(localActor).map((item) => item.href),
    ),
  );
  const mobileNavigationHrefs = unique(
    getNavigationActors().flatMap((localActor) =>
      getMobileQuickNavigationForActor(localActor).map((item) => item.href),
    ),
  );
  const navigationHrefs = unique([...primaryNavigationHrefs, ...mobileNavigationHrefs]);
  const unknownNavigationHrefs = navigationHrefs.filter(
    (href) => !isKnownAppRouteHref(href),
  );
  const routeSmokeManifest = getRouteSmokeManifest(actor);
  const smokeRoutes = routeSmokeManifest.routes.map((route) => route.path);
  const unknownSmokeRoutes = smokeRoutes.filter((href) => !isKnownAppRouteHref(href));

  return {
    canReadSummary: true,
    title: getTitle(actor),
    summary:
      "Checks that current role navigation and the manual smoke manifest point at known local app routes before review.",
    unknownNavigationHrefs,
    unknownSmokeRoutes,
    counts: {
      knownRoutes: registry.length,
      exactRoutes: registry.filter((route) => route.routeType === "exact").length,
      prefixRoutes: registry.filter((route) => route.routeType === "prefix").length,
      primaryNavigationHrefs: primaryNavigationHrefs.length,
      mobileNavigationHrefs: mobileNavigationHrefs.length,
      smokeRoutes: smokeRoutes.length,
      unknownNavigationHrefs: unknownNavigationHrefs.length,
      unknownSmokeRoutes: unknownSmokeRoutes.length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function getNavigationActors(): Array<LocalActorContext | undefined> {
  return [
    undefined,
    ...localActorOptions.map((option) => getMockLocalActorContext(option.email)),
  ];
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin route coverage summary";
    case "ds_admin":
      return "DS Admin route coverage summary";
    case "super_admin":
      return "Full local route coverage summary";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Route coverage hidden for this role";
  }
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

function emptyCounts(): RouteCoverageSummary["counts"] {
  return {
    knownRoutes: 0,
    exactRoutes: 0,
    prefixRoutes: 0,
    primaryNavigationHrefs: 0,
    mobileNavigationHrefs: 0,
    smokeRoutes: 0,
    unknownNavigationHrefs: 0,
    unknownSmokeRoutes: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
