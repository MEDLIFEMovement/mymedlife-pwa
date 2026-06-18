export type DataConnectionPhaseKey =
  | "mock_default"
  | "local_read_only"
  | "local_audited_writes"
  | "auth_gated_local"
  | "production_readiness_review"
  | "controlled_pilot";

export type AppRouteKey =
  | "/login"
  | "/profile"
  | "/onboarding"
  | "/chapter"
  | "/chapter/members"
  | "/campaigns"
  | "/campaigns/[campaignSlug]"
  | "/action-committees"
  | "/rush-month"
  | "/rush-month/dashboard"
  | "/rush-month/leaderboard"
  | "/rush-month/events"
  | "/rush-month/events/[eventId]"
  | "/rush-month/actions"
  | "/rush-month/actions/[assignmentId]"
  | "/rush-month/evidence"
  | "/rush-month/review"
  | "/proof-library"
  | "/proof-library/upload"
  | "/coach"
  | "/admin"
  | "/admin/review-path"
  | "/admin/nick-review"
  | "/admin/release-readiness"
  | "/admin/launch-gate"
  | "/admin/audit-log"
  | "/admin/integration-outbox"
  | "/admin/master-data"
  | "/admin/database-security"
  | "/admin/system-health"
  | "/admin/design-qa"
  | "/admin/operations";

export type DataConnectionPhase = {
  key: DataConnectionPhaseKey;
  label: string;
  productionEnabled: false;
  externalWritesEnabled: false;
  goal: string;
};

export type RouteMigrationPlan = {
  route: AppRouteKey;
  firstLiveDataMode: "read_only" | "local_function_write";
  reason: string;
};

export type LiveDataConnectionPlan = {
  productionSupabaseEnabled: false;
  browserWritesEnabled: false;
  externalWritesEnabled: false;
  phases: readonly DataConnectionPhase[];
  routeOrder: readonly RouteMigrationPlan[];
};

export const liveDataConnectionPhases = [
  {
    key: "mock_default",
    label: "Mock data remains default",
    productionEnabled: false,
    externalWritesEnabled: false,
    goal: "Keep every route usable without Supabase while product flow changes quickly.",
  },
  {
    key: "local_read_only",
    label: "Local read-only Supabase previews",
    productionEnabled: false,
    externalWritesEnabled: false,
    goal: "Let developers compare fake local database rows to the mock app shell.",
  },
  {
    key: "local_audited_writes",
    label: "Local audited database functions",
    productionEnabled: false,
    externalWritesEnabled: false,
    goal: "Add narrow local functions with RLS tests before browser controls.",
  },
  {
    key: "auth_gated_local",
    label: "Auth-gated local browser flows",
    productionEnabled: false,
    externalWritesEnabled: false,
    goal: "Connect browser controls only after auth/onboarding policies are approved.",
  },
  {
    key: "production_readiness_review",
    label: "Production readiness review",
    productionEnabled: false,
    externalWritesEnabled: false,
    goal: "Review secrets, RLS, audit logs, rollback, monitoring, and pilot scope.",
  },
  {
    key: "controlled_pilot",
    label: "Controlled pilot",
    productionEnabled: false,
    externalWritesEnabled: false,
    goal: "Move only approved pilot chapters after a written launch decision.",
  },
] as const satisfies readonly DataConnectionPhase[];

export const routeMigrationOrder = [
  {
    route: "/login",
    firstLiveDataMode: "read_only",
    reason:
      "Local sign-in should prove fake Supabase Auth session readiness without production users, profile writes, membership writes, or browser writes.",
  },
  {
    route: "/profile",
    firstLiveDataMode: "read_only",
    reason:
      "Profile identity, role, and scope should prove Supabase Auth and membership reads before profile or role writes exist.",
  },
  {
    route: "/onboarding",
    firstLiveDataMode: "read_only",
    reason:
      "Auth, profile, join-request, membership, role, coach, and staff assignment sequencing should be reviewed before any onboarding write exists.",
  },
  {
    route: "/chapter",
    firstLiveDataMode: "read_only",
    reason: "Chapter overview is low-risk and helps validate membership/chapter joins.",
  },
  {
    route: "/chapter/members",
    firstLiveDataMode: "read_only",
    reason:
      "Roster, join-request, and role-coverage visibility should prove membership reads before approval writes exist.",
  },
  {
    route: "/campaigns",
    firstLiveDataMode: "read_only",
    reason: "Campaign catalog shells should stay read-only while templates mature.",
  },
  {
    route: "/campaigns/[campaignSlug]",
    firstLiveDataMode: "read_only",
    reason: "Campaign detail pages can validate template shape before campaign writes exist.",
  },
  {
    route: "/action-committees",
    firstLiveDataMode: "read_only",
    reason: "Committee/event operating examples should validate event shape before Luma syncs.",
  },
  {
    route: "/rush-month",
    firstLiveDataMode: "read_only",
    reason: "Campaign status can be validated before student writes are enabled.",
  },
  {
    route: "/rush-month/dashboard",
    firstLiveDataMode: "read_only",
    reason: "Role-aware dashboard should read from trusted local data before any controls save.",
  },
  {
    route: "/rush-month/leaderboard",
    firstLiveDataMode: "read_only",
    reason:
      "Member points, rank, and recognition should read from trusted local data before any points ledger writes are enabled.",
  },
  {
    route: "/rush-month/events",
    firstLiveDataMode: "read_only",
    reason:
      "Rush Month event, NPS, proof, and Luma posture should be reviewed before Luma syncs or attendance imports exist.",
  },
  {
    route: "/rush-month/events/[eventId]",
    firstLiveDataMode: "read_only",
    reason:
      "Event detail pages should validate owner, NPS, proof, and outbox posture before event writes or Luma syncs exist.",
  },
  {
    route: "/rush-month/actions",
    firstLiveDataMode: "read_only",
    reason: "Assignment lists should prove role filtering before creation controls.",
  },
  {
    route: "/rush-month/actions/[assignmentId]",
    firstLiveDataMode: "local_function_write",
    reason: "Action start should use audited functions after read filters are proven.",
  },
  {
    route: "/rush-month/evidence",
    firstLiveDataMode: "local_function_write",
    reason: "Proof metadata submission must stay function-only and upload-disabled.",
  },
  {
    route: "/rush-month/review",
    firstLiveDataMode: "local_function_write",
    reason: "HQ decisions should use audited functions and disabled outbox rows.",
  },
  {
    route: "/proof-library",
    firstLiveDataMode: "read_only",
    reason: "Proof library should stay read-only until upload, consent, and sharing rules are approved.",
  },
  {
    route: "/proof-library/upload",
    firstLiveDataMode: "read_only",
    reason:
      "Proof upload requirements should stay read-only until storage buckets, consent, and upload RLS are approved.",
  },
  {
    route: "/coach",
    firstLiveDataMode: "read_only",
    reason: "Coach portfolio data should remain read-only until auth and handoff are stable.",
  },
  {
    route: "/admin",
    firstLiveDataMode: "read_only",
    reason: "Admin/integration visibility should be read-only before DS controls exist.",
  },
  {
    route: "/admin/review-path",
    firstLiveDataMode: "read_only",
    reason:
      "Stakeholder review path should stay read-only while fake actor walkthroughs, route safety, auth, writes, uploads, and integrations remain review-only.",
  },
  {
    route: "/admin/nick-review",
    firstLiveDataMode: "read_only",
    reason:
      "Nick final review should stay read-only while owner lanes, pass signals, launch boundaries, auth, writes, uploads, external sends, and student invitations remain review-only.",
  },
  {
    route: "/admin/release-readiness",
    firstLiveDataMode: "read_only",
    reason:
      "MVP release-readiness summary should stay read-only while launch blockers, next approvals, auth, writes, uploads, and integrations remain unapproved.",
  },
  {
    route: "/admin/launch-gate",
    firstLiveDataMode: "read_only",
    reason:
      "Production launch gate review should stay read-only while live evidence, owner sign-off, rollback, auth, proof, integration, and pilot approval remain blocked.",
  },
  {
    route: "/admin/audit-log",
    firstLiveDataMode: "read_only",
    reason:
      "Audit-log readback should be inspected read-only before any audit-producing write path is promoted.",
  },
  {
    route: "/admin/integration-outbox",
    firstLiveDataMode: "read_only",
    reason:
      "Integration event, automation outbox, and audit posture should prove read safety before queue controls or live-send approvals exist.",
  },
  {
    route: "/admin/master-data",
    firstLiveDataMode: "read_only",
    reason:
      "Focused admin inventory for users, roles, chapters, and templates should prove read safety before admin mutations exist.",
  },
  {
    route: "/admin/database-security",
    firstLiveDataMode: "read_only",
    reason:
      "Database security decision review should stay read-only while DS/security confirms Supabase RLS, service-key handling, proof storage, compliance, and PlanetScale tradeoffs before production setup.",
  },
  {
    route: "/admin/system-health",
    firstLiveDataMode: "read_only",
    reason:
      "System health should aggregate read-only route, data, env, audit, outbox, auth, storage, integration, monitoring, backup, and incident posture before launch approvals exist.",
  },
  {
    route: "/admin/design-qa",
    firstLiveDataMode: "read_only",
    reason:
      "Design QA should remain a read-only Figma, mobile, accessibility, offline, and staging review surface before launch claims or production writes exist.",
  },
  {
    route: "/admin/operations",
    firstLiveDataMode: "read_only",
    reason:
      "Production operations should stay read-only while incident, rollback, backup, integration recovery, mobile support, and day-one support owners are reviewed before launch approval.",
  },
] as const satisfies readonly RouteMigrationPlan[];

export function getLiveDataConnectionPlan(): LiveDataConnectionPlan {
  return {
    productionSupabaseEnabled: false,
    browserWritesEnabled: false,
    externalWritesEnabled: false,
    phases: liveDataConnectionPhases,
    routeOrder: routeMigrationOrder,
  };
}

export function getNextRouteForLiveData(
  completedRoutes: readonly AppRouteKey[],
): RouteMigrationPlan | null {
  return (
    routeMigrationOrder.find((item) => {
      return !completedRoutes.includes(item.route);
    }) ?? null
  );
}
