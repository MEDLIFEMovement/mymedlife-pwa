export type AppRouteRegistryItem = {
  href: string;
  label: string;
  routeType: "exact" | "prefix";
};

const appRouteRegistry: AppRouteRegistryItem[] = [
  { href: "/", label: "Home", routeType: "exact" },
  { href: "/login", label: "Local sign in", routeType: "exact" },
  { href: "/chapter", label: "Chapter", routeType: "exact" },
  { href: "/chapter/members", label: "Chapter members", routeType: "exact" },
  { href: "/campaigns", label: "Campaigns", routeType: "exact" },
  { href: "/campaigns/", label: "Campaign detail", routeType: "prefix" },
  { href: "/action-committees", label: "Action committees", routeType: "exact" },
  { href: "/rush-month", label: "Rush Month", routeType: "exact" },
  { href: "/rush-month/dashboard", label: "Rush Month dashboard", routeType: "exact" },
  { href: "/rush-month/loop", label: "Rush Month loop", routeType: "exact" },
  { href: "/rush-month/events", label: "Rush Month events", routeType: "exact" },
  { href: "/rush-month/actions", label: "Rush Month actions", routeType: "exact" },
  { href: "/rush-month/actions/", label: "Rush Month action detail", routeType: "prefix" },
  { href: "/rush-month/evidence", label: "Rush Month proof", routeType: "exact" },
  { href: "/rush-month/review", label: "HQ proof review", routeType: "exact" },
  { href: "/proof-library", label: "Proof library", routeType: "exact" },
  { href: "/proof-library/upload", label: "Proof upload readiness", routeType: "exact" },
  { href: "/coach", label: "Coach", routeType: "exact" },
  { href: "/admin", label: "Admin", routeType: "exact" },
  { href: "/admin/first-write", label: "First write drill", routeType: "exact" },
  { href: "/admin/pilot-scope", label: "Pilot scope", routeType: "exact" },
  { href: "/admin/staff-dry-run", label: "Staff dry run", routeType: "exact" },
];

export function getAppRouteRegistry(): AppRouteRegistryItem[] {
  return appRouteRegistry;
}

export function isKnownAppRouteHref(href: string): boolean {
  return appRouteRegistry.some((route) => {
    if (route.routeType === "exact") {
      return href === route.href;
    }

    return href.startsWith(route.href);
  });
}
