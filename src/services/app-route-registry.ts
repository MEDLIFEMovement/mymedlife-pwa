import {
  isEventsPointsLaunchLaneEnabled,
  isEventsPointsLaunchLaneVisibleRouteHref,
} from "@/services/launch-lane-product-focus";

export type AppRouteRegistryItem = {
  href: string;
  label: string;
  routeType: "exact" | "prefix";
};

const appRouteRegistry: AppRouteRegistryItem[] = [
  { href: "/", label: "Home", routeType: "exact" },
  { href: "/app", label: "Member app", routeType: "exact" },
  { href: "/app/events", label: "Member events", routeType: "exact" },
  { href: "/app/events/", label: "Member event detail", routeType: "prefix" },
  { href: "/app/points", label: "Member points", routeType: "exact" },
  { href: "/app/slt-prep", label: "Member SLT prep", routeType: "exact" },
  { href: "/leader", label: "Leader app", routeType: "exact" },
  { href: "/profile", label: "Profile", routeType: "exact" },
  { href: "/onboarding", label: "Onboarding", routeType: "exact" },
  { href: "/offline", label: "Offline fallback", routeType: "exact" },
  { href: "/login", label: "Local sign in", routeType: "exact" },
  { href: "/chapter", label: "Chapter", routeType: "exact" },
  { href: "/chapter/members", label: "Chapter members", routeType: "exact" },
  { href: "/campaigns", label: "Campaigns", routeType: "exact" },
  { href: "/campaigns/", label: "Campaign detail", routeType: "prefix" },
  { href: "/action-committees", label: "Action committees", routeType: "exact" },
  { href: "/slt-prep", label: "SLT prep", routeType: "exact" },
  { href: "/slt-prep/checklist", label: "SLT prep checklist", routeType: "exact" },
  { href: "/slt-prep/checklist/", label: "SLT prep checklist detail", routeType: "prefix" },
  { href: "/slt-prep/forms", label: "SLT prep forms", routeType: "exact" },
  { href: "/slt-prep/payments", label: "SLT prep payments", routeType: "exact" },
  { href: "/slt-prep/flights", label: "SLT prep flights", routeType: "exact" },
  { href: "/slt-prep/meetings", label: "SLT prep meetings", routeType: "exact" },
  { href: "/slt-prep/extensions", label: "SLT prep extensions", routeType: "exact" },
  { href: "/slt-prep/timeline", label: "SLT prep timeline", routeType: "exact" },
  { href: "/slt-prep/notifications", label: "SLT prep notifications", routeType: "exact" },
  { href: "/slt-prep/profile", label: "SLT prep profile", routeType: "exact" },
  { href: "/slt-prep/staff", label: "SLT prep staff dashboard", routeType: "exact" },
  { href: "/rush-month", label: "Rush Month", routeType: "exact" },
  { href: "/rush-month/dashboard", label: "Rush Month dashboard", routeType: "exact" },
  { href: "/rush-month/leaderboard", label: "Rush Month leaderboard", routeType: "exact" },
  { href: "/rush-month/loop", label: "Rush Month loop", routeType: "exact" },
  { href: "/rush-month/events", label: "Rush Month events", routeType: "exact" },
  { href: "/rush-month/events/", label: "Rush Month event detail", routeType: "prefix" },
  { href: "/rush-month/actions", label: "Rush Month actions", routeType: "exact" },
  { href: "/rush-month/actions/", label: "Rush Month action detail", routeType: "prefix" },
  { href: "/rush-month/evidence", label: "Rush Month proof", routeType: "exact" },
  { href: "/rush-month/review", label: "HQ proof review", routeType: "exact" },
  { href: "/proof-library", label: "Proof library", routeType: "exact" },
  { href: "/proof-library/upload", label: "Proof upload readiness", routeType: "exact" },
  { href: "/coach", label: "Coach", routeType: "exact" },
  { href: "/staff", label: "Staff command center", routeType: "exact" },
  { href: "/admin", label: "Admin", routeType: "exact" },
  { href: "/admin/phase-2", label: "Admin phase 2", routeType: "exact" },
  { href: "/admin/review-path", label: "Admin review path", routeType: "exact" },
  { href: "/admin/nick-review", label: "Nick final review", routeType: "exact" },
  { href: "/admin/release-readiness", label: "Admin release readiness", routeType: "exact" },
  { href: "/admin/launch-gate", label: "Admin launch gate", routeType: "exact" },
  { href: "/admin/audit-log", label: "Admin audit log", routeType: "exact" },
  { href: "/admin/integrations", label: "Admin integrations", routeType: "exact" },
  { href: "/admin/feature-flags", label: "Admin feature flags", routeType: "exact" },
  { href: "/admin/theme", label: "Admin theme settings", routeType: "exact" },
  { href: "/admin/integration-outbox", label: "Admin integration outbox", routeType: "exact" },
  { href: "/admin/luma-live-pilot", label: "Admin Luma live pilot", routeType: "exact" },
  { href: "/admin/master-data", label: "Admin master data", routeType: "exact" },
  { href: "/admin/permissions", label: "Admin permissions", routeType: "exact" },
  { href: "/admin/committees", label: "Admin committees", routeType: "exact" },
  { href: "/admin/workflows", label: "Admin workflows", routeType: "exact" },
  { href: "/admin/sop-library", label: "Admin SOP library", routeType: "exact" },
  { href: "/admin/sop-builder/", label: "Admin SOP builder", routeType: "prefix" },
  { href: "/admin/database-security", label: "Admin database security", routeType: "exact" },
  { href: "/admin/system-health", label: "Admin system health", routeType: "exact" },
  { href: "/admin/phase-2", label: "Admin phase 2 review", routeType: "exact" },
  { href: "/admin/environment-setup", label: "Admin environment setup", routeType: "exact" },
  { href: "/admin/auth-onboarding", label: "Admin auth onboarding", routeType: "exact" },
  { href: "/admin/security-gate", label: "Admin security gate", routeType: "exact" },
  { href: "/admin/design-qa", label: "Admin design QA", routeType: "exact" },
  { href: "/admin/operations", label: "Admin operations", routeType: "exact" },
  { href: "/admin/first-write", label: "First write drill", routeType: "exact" },
  { href: "/admin/write-sequence", label: "Write sequence", routeType: "exact" },
  { href: "/admin/proof-write", label: "Proof metadata packet", routeType: "exact" },
  { href: "/admin/hq-proof-write", label: "HQ proof decision packet", routeType: "exact" },
  { href: "/admin/points-write", label: "Points and KPI packet", routeType: "exact" },
  { href: "/admin/slt-checklist-write", label: "SLT checklist packet", routeType: "exact" },
  { href: "/admin/assignment-write", label: "Leader assignment packet", routeType: "exact" },
  { href: "/admin/coach-write", label: "Coach decision packet", routeType: "exact" },
  { href: "/admin/pilot-scope", label: "Pilot scope", routeType: "exact" },
  { href: "/admin/staff-dry-run", label: "Staff dry run", routeType: "exact" },
];

export function getAppRouteRegistry(): AppRouteRegistryItem[] {
  if (!isEventsPointsLaunchLaneEnabled()) {
    return appRouteRegistry;
  }

  return appRouteRegistry.filter((route) =>
    isEventsPointsLaunchLaneVisibleRouteHref(route.href),
  );
}

export function isKnownAppRouteHref(href: string): boolean {
  const normalizedHref = normalizeHref(href);
  const visibleRoutes = getAppRouteRegistry();

  return visibleRoutes.some((route) => {
    if (route.routeType === "exact") {
      return normalizedHref === route.href;
    }

    return normalizedHref.startsWith(route.href);
  });
}

function normalizeHref(href: string): string {
  const queryIndex = href.indexOf("?");
  const hashIndex = href.indexOf("#");
  const cutoff =
    queryIndex === -1
      ? hashIndex
      : hashIndex === -1
        ? queryIndex
        : Math.min(queryIndex, hashIndex);

  return cutoff === -1 ? href : href.slice(0, cutoff);
}
