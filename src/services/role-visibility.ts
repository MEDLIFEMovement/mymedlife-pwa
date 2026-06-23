import type { LocalActorContext } from "@/services/local-actor-context";
import type { Assignment } from "@/shared/types/domain";
import type { RiskFlagRow } from "@/shared/types/persistence";

export type AdminPanelKey =
  | "support_context"
  | "proof_sharing"
  | "integration_outbox"
  | "full_oversight";

export type AdminPanel = {
  key: AdminPanelKey;
  title: string;
  summary: string;
};

export type NavigationItem = {
  href: string;
  label: string;
};

export type MobileNavigationItem = NavigationItem & {
  helper: string;
};

export type ActorSurfaceFamily =
  | "member"
  | "leader"
  | "coach"
  | "staff"
  | "ds_admin"
  | "super_admin";

const baseNavigation: NavigationItem[] = [
  { href: "/", label: "Home" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/rush-month", label: "Rush Month" },
  { href: "/rush-month/dashboard", label: "My Week" },
  { href: "/rush-month/leaderboard", label: "Leaderboard" },
  { href: "/rush-month/events", label: "Events" },
  { href: "/rush-month/loop", label: "Loop" },
  { href: "/rush-month/actions", label: "My Actions" },
  { href: "/profile", label: "Profile" },
];

const chapterLeaderNavigation: NavigationItem[] = [
  { href: "/chapter?view=overview", label: "Chapter Home" },
  { href: "/chapter?view=leaderboard", label: "Leaderboard" },
  { href: "/chapter?view=members", label: "Member Pipeline" },
  { href: "/chapter?view=member_profile", label: "Member Profile" },
  { href: "/chapter?view=committees", label: "Committees" },
  { href: "/chapter?view=events", label: "Events" },
  { href: "/chapter?view=impact", label: "Impact" },
  { href: "/chapter?view=bridge_videos", label: "Bridge Videos" },
  { href: "/chapter?view=succession", label: "Succession" },
  { href: "/chapter?view=feed_analytics", label: "Feed Analytics" },
];

const coachNavigation: NavigationItem[] = [
  { href: "/coach?view=chapters", label: "Portfolio" },
  { href: "/coach?view=chapter_detail", label: "Chapter Detail" },
  { href: "/coach?view=campaigns", label: "Campaigns" },
  { href: "/coach?view=support_notes#support-notes", label: "Support Notes" },
  { href: "/slt-prep/staff", label: "Trip Prep" },
  { href: "/profile", label: "Profile" },
];

const staffNavigation: NavigationItem[] = [
  { href: "/staff?view=chapters", label: "Chapters" },
  { href: "/staff?view=campaigns", label: "Campaigns" },
  { href: "/staff?view=proof_ugc", label: "Proof / UGC" },
  { href: "/staff?view=feed_studio", label: "Feed Studio" },
  { href: "/staff?view=feed_analytics", label: "Feed Analytics" },
  { href: "/staff?view=hubspot", label: "HubSpot" },
  { href: "/staff?view=best_practices", label: "Best Practices" },
  { href: "/staff?view=admin", label: "Admin" },
  { href: "/profile", label: "Profile" },
];

const adminBackendNavigation: NavigationItem[] = [
  { href: "/admin", label: "Admin Home" },
  { href: "/admin/permissions", label: "Permissions" },
  { href: "/admin/committees", label: "Committees" },
  { href: "/admin/workflows", label: "Workflows" },
  { href: "/admin/sop-library", label: "SOP Library" },
  { href: "/admin/master-data", label: "Master Data" },
  { href: "/profile", label: "Profile" },
];

const dsAdminNavigation: NavigationItem[] = [
  { href: "/admin", label: "Admin Home" },
  { href: "/admin/permissions", label: "Permissions" },
  { href: "/admin/workflows", label: "Workflows" },
  { href: "/admin/integration-outbox", label: "Outbox" },
  { href: "/admin/system-health", label: "System Health" },
  { href: "/profile", label: "Profile" },
];

export function canReadChapterData(actor: LocalActorContext): boolean {
  return getActorSurfaceFamily(actor) !== "ds_admin";
}

export function canReadAssignment(
  actor: LocalActorContext,
  assignment: Assignment,
): boolean {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return assignment.lane === "Member";
    case "leader":
      return assignment.lane === "Member" || assignment.lane === "Leader";
    case "coach":
      return assignment.lane === "Coach" || assignment.status !== "approved";
    case "staff":
    case "super_admin":
      return true;
    case "ds_admin":
      return false;
  }
}

export function canReadCoachRisk(
  actor: LocalActorContext,
  risk: RiskFlagRow,
): boolean {
  switch (getActorSurfaceFamily(actor)) {
    case "leader":
      return risk.visibility === "leader_visible";
    case "coach":
    case "staff":
    case "super_admin":
      return true;
    case "member":
    case "ds_admin":
      return false;
  }
}

export function canReadIntegrationOutbox(actor: LocalActorContext): boolean {
  const family = getActorSurfaceFamily(actor);

  return family === "ds_admin" || family === "super_admin";
}

export function canReadAdminReviewSurface(actor: LocalActorContext): boolean {
  const family = getActorSurfaceFamily(actor);

  return family === "staff" || family === "ds_admin" || family === "super_admin";
}

export function getVisibleAssignmentsForActor(
  actor: LocalActorContext,
  assignments: Assignment[],
): Assignment[] {
  return assignments.filter((assignment) => canReadAssignment(actor, assignment));
}

export function getVisibleRiskFlagsForActor(
  actor: LocalActorContext,
  riskFlags: RiskFlagRow[],
): RiskFlagRow[] {
  return riskFlags.filter((risk) => canReadCoachRisk(actor, risk));
}

export function getVisibleAdminPanelsForActor(actor: LocalActorContext): AdminPanel[] {
  switch (getActorSurfaceFamily(actor)) {
    case "staff":
      return [supportContextPanel, proofSharingPanel];
    case "ds_admin":
      return [integrationOutboxPanel];
    case "super_admin":
      return [
        supportContextPanel,
        proofSharingPanel,
        integrationOutboxPanel,
        fullOversightPanel,
      ];
    case "coach":
    case "leader":
    case "member":
      return [];
  }
}

export function getNavigationForActor(actor?: LocalActorContext): NavigationItem[] {
  if (!actor) {
    return [
      { href: "/login", label: "Sign In" },
      ...baseNavigation,
      { href: "/rush-month/evidence", label: "Proof" },
      { href: "/rush-month/review", label: "Review" },
      { href: "/coach", label: "Coach" },
      { href: "/admin", label: "Admin" },
    ];
  }

  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return [
        { href: "/", label: "Home" },
        { href: "/campaigns", label: "Campaigns" },
        { href: "/rush-month/events", label: "Events" },
        { href: "/rush-month/leaderboard", label: "Points" },
        { href: "/profile", label: "Profile" },
      ];
    case "leader":
      return chapterLeaderNavigation;
    case "coach":
      return coachNavigation;
    case "staff":
      return staffNavigation;
    case "ds_admin":
      return dsAdminNavigation;
    case "super_admin":
      return adminBackendNavigation;
  }
}

export function getMobileQuickNavigationForActor(
  actor?: LocalActorContext,
): MobileNavigationItem[] {
  if (!actor) {
    return [
      { href: "/login", label: "Sign In", helper: "Auth" },
      { href: "/rush-month", label: "Rush", helper: "Campaign" },
      { href: "/rush-month/actions", label: "Actions", helper: "Work" },
      { href: "/admin", label: "Admin", helper: "Review" },
    ];
  }

  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return [
        { href: "/", label: "Home", helper: "Today" },
        { href: "/campaigns", label: "Campaigns", helper: "Goals" },
        { href: "/rush-month/events", label: "Events", helper: "Meet" },
        { href: "/rush-month/leaderboard", label: "Points", helper: "Rank" },
        { href: "/profile", label: "Profile", helper: "Me" },
      ];
    case "leader":
      return [
        { href: "/chapter?view=overview", label: "Home", helper: "Health" },
        { href: "/chapter?view=members", label: "Pipeline", helper: "People" },
        { href: "/chapter?view=events", label: "Events", helper: "Plan" },
        { href: "/chapter?view=succession", label: "Succession", helper: "Leaders" },
      ];
    case "coach":
      return [
        { href: "/coach?view=chapters", label: "Portfolio", helper: "Overview" },
        { href: "/coach?view=chapter_detail", label: "Chapter", helper: "Focus" },
        { href: "/coach?view=campaigns", label: "Campaigns", helper: "Support" },
        { href: "/coach?view=support_notes#support-notes", label: "Notes", helper: "Coach" },
      ];
    case "staff":
      return [
        { href: "/admin", label: "Admin", helper: "Review" },
        { href: "/admin/workflows", label: "Flows", helper: "Map" },
        { href: "/admin/proof-write", label: "Proof", helper: "Packet" },
        { href: "/admin/hq-proof-write", label: "HQ", helper: "Review" },
        { href: "/admin/assignment-write", label: "Assign", helper: "No sends" },
        { href: "/admin/coach-write", label: "Coach", helper: "No sends" },
        { href: "/admin/pilot-scope", label: "Pilot", helper: "Scope" },
      ];
    case "ds_admin":
      return [
        { href: "/admin", label: "Outbox", helper: "Safety" },
        { href: "/admin/permissions", label: "Roles", helper: "Scope" },
        { href: "/admin/workflows", label: "Flows", helper: "Map" },
        { href: "/admin/integration-outbox", label: "Queue", helper: "Off" },
      ];
    case "super_admin":
      return [
        { href: "/admin", label: "Admin", helper: "Home" },
        { href: "/admin/permissions", label: "Roles", helper: "Scope" },
        { href: "/admin/committees", label: "Committees", helper: "Owners" },
        { href: "/admin/workflows", label: "Flows", helper: "Map" },
        { href: "/admin/sop-library", label: "SOP", helper: "Builder" },
        { href: "/admin/master-data", label: "Data", helper: "Catalog" },
      ];
  }
}

export function isMemberSurfaceFamily(actor: LocalActorContext): boolean {
  return getActorSurfaceFamily(actor) === "member";
}

export function getActorSurfaceFamily(
  actor: LocalActorContext,
): ActorSurfaceFamily {
  switch (actor.primaryCanonicalRole) {
    case "committee_member":
    case "student_member":
    case "traveler":
      return "member";
    case "committee_chair":
    case "eboard_officer":
    case "vice_president":
    case "president":
      return "leader";
    case "coach":
    case "sales_coach":
      return "coach";
    case "department_staff":
    case "sales_admin":
      return "staff";
    case "ds_admin":
      return "ds_admin";
    case "super_admin":
      return "super_admin";
  }
}

const supportContextPanel: AdminPanel = {
  key: "support_context",
  title: "Support-wide read context",
  summary: "HQ staff can read chapter support posture without owning student truth.",
};

const proofSharingPanel: AdminPanel = {
  key: "proof_sharing",
  title: "HQ proof-sharing posture",
  summary:
    "MEDLIFE headquarters decides whether submitted testimonials or bridge videos should be shared broadly.",
};

const integrationOutboxPanel: AdminPanel = {
  key: "integration_outbox",
  title: "Integration and outbox posture",
  summary:
    "DS Admins can inspect disabled/mock automation records. Real external sends stay off.",
};

const fullOversightPanel: AdminPanel = {
  key: "full_oversight",
  title: "Full local oversight",
  summary: "Super Admin can inspect all local read-only panels for permission testing.",
};
