import type { LocalActorContext } from "@/services/local-actor-context";
import type { CanonicalRole } from "@/services/canonical-role-scope";
import {
  isEventsPointsLaunchLaneEnabled,
  shouldShowTravelerPrepEntry,
} from "@/services/launch-lane-product-focus";
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

const chapterLeaderNavigation: NavigationItem[] = [
  { href: "/leader?view=overview", label: "Overview" },
  { href: "/leader?view=events", label: "Events" },
  { href: "/leader?view=attendance", label: "Attendance" },
  { href: "/leader?view=leaderboard", label: "Leaderboard" },
];

const coachNavigation: NavigationItem[] = [
  { href: "/staff?view=chapters", label: "Portfolio" },
  { href: "/staff?view=events", label: "Events" },
  { href: "/staff?view=leaderboard", label: "Leaderboard" },
];

const staffNavigation: NavigationItem[] = [
  { href: "/staff?view=chapters", label: "Chapters" },
  { href: "/staff?view=events", label: "Events" },
  { href: "/staff?view=leaderboard", label: "Leaderboard" },
];

const fullAdminBackendNavigation: NavigationItem[] = [
  { href: "/admin", label: "Admin Home" },
  { href: "/admin/phase-2", label: "Phase 2" },
  { href: "/admin/permissions", label: "Permissions" },
  { href: "/admin/committees", label: "Committees" },
  { href: "/admin/workflows", label: "Workflows" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/feature-flags", label: "Feature Flags" },
  { href: "/admin/theme", label: "Theme" },
  { href: "/admin/review-path", label: "Review Path" },
  { href: "/admin/nick-review", label: "Nick Review" },
  { href: "/admin/release-readiness", label: "Release Readiness" },
  { href: "/admin/launch-gate", label: "Launch Gate" },
  { href: "/admin/audit-log", label: "Audit Log" },
  { href: "/admin/operations", label: "Operations" },
  { href: "/admin/design-qa", label: "Design QA" },
  { href: "/admin/staff-dry-run", label: "Staff Dry Run" },
  { href: "/admin/integration-outbox", label: "Outbox" },
  { href: "/admin/database-security", label: "Database Security" },
  { href: "/admin/system-health", label: "System Health" },
  { href: "/admin/pilot-scope", label: "Pilot Scope" },
  { href: "/admin/sop-library", label: "SOP Library" },
  { href: "/admin/master-data", label: "Master Data" },
  { href: "/profile", label: "Profile" },
];

const focusedAdminBackendNavigation: NavigationItem[] = [
  { href: "/admin", label: "Admin Home" },
  { href: "/admin/integration-outbox", label: "Outbox" },
  { href: "/admin/audit-log", label: "Audit Log" },
  { href: "/admin/launch-gate", label: "Launch Gate" },
  { href: "/admin/pilot-scope", label: "Pilot Scope" },
  { href: "/profile", label: "Profile" },
];

const fullDsAdminNavigation: NavigationItem[] = [
  { href: "/admin", label: "Admin Home" },
  { href: "/admin/phase-2", label: "Phase 2" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/feature-flags", label: "Feature Flags" },
  { href: "/admin/theme", label: "Theme" },
  { href: "/admin/permissions", label: "Permissions" },
  { href: "/admin/workflows", label: "Workflows" },
  { href: "/admin/staff-dry-run", label: "Staff Dry Run" },
  { href: "/admin/integration-outbox", label: "Outbox" },
  { href: "/admin/database-security", label: "Database Security" },
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

export function canReadAdminIntegrationsSecurity(
  actor: LocalActorContext,
): boolean {
  const family = getActorSurfaceFamily(actor);

  return family === "ds_admin" || family === "super_admin";
}

export function canManageLaunchLaneEvents(actor: LocalActorContext): boolean {
  const family = getActorSurfaceFamily(actor);

  return family === "leader" || family === "ds_admin" || family === "super_admin";
}

export function canImportLaunchLaneAttendance(actor: LocalActorContext): boolean {
  const family = getActorSurfaceFamily(actor);

  return family === "leader" || family === "staff" || family === "ds_admin" || family === "super_admin";
}

export function canWriteLaunchLaneMemberRsvp(actor: LocalActorContext): boolean {
  return getActorSurfaceFamily(actor) === "member";
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
    case "ds_admin":
      return [integrationOutboxPanel];
    case "super_admin":
      return [
        supportContextPanel,
        proofSharingPanel,
        integrationOutboxPanel,
        fullOversightPanel,
      ];
    case "staff":
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
      { href: "/app/events", label: "Events" },
      { href: "/app/points", label: "Points" },
      { href: "/staff?view=chapters", label: "Staff" },
      { href: "/admin", label: "Admin" },
    ];
  }

  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return [
        { href: "/app", label: "Home" },
        { href: "/app/events", label: "Events" },
        { href: "/app/points", label: "Points" },
        ...(hasTravelerAccess(actor) && shouldShowTravelerPrepEntry()
          ? [{ href: "/app/slt-prep", label: "SLT Prep" }]
          : []),
        { href: "/profile", label: "Profile" },
      ];
    case "leader":
      return chapterLeaderNavigation;
    case "coach":
      return coachNavigation;
    case "staff":
      return staffNavigation;
    case "ds_admin":
      return isEventsPointsLaunchLaneEnabled()
        ? focusedAdminBackendNavigation
        : fullDsAdminNavigation;
    case "super_admin":
      return isEventsPointsLaunchLaneEnabled()
        ? focusedAdminBackendNavigation
        : fullAdminBackendNavigation;
  }
}

export function getMobileQuickNavigationForActor(
  actor?: LocalActorContext,
): MobileNavigationItem[] {
  if (!actor) {
    return [
      { href: "/login", label: "Sign In", helper: "Auth" },
      { href: "/app/events", label: "Events", helper: "Meet" },
      { href: "/app/points", label: "Points", helper: "Rank" },
      { href: "/admin", label: "Admin", helper: "Review" },
    ];
  }

  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return [
        { href: "/app", label: "Home", helper: "Today" },
        { href: "/app/events", label: "Events", helper: "Meet" },
        { href: "/app/points", label: "Points", helper: "Rank" },
        ...(hasTravelerAccess(actor) && shouldShowTravelerPrepEntry()
          ? [{ href: "/app/slt-prep", label: "SLT Prep", helper: "Trip" }]
          : []),
        { href: "/profile", label: "Profile", helper: "Me" },
      ];
    case "leader":
      return [
        { href: "/leader?view=overview", label: "Home", helper: "Events" },
        { href: "/leader?view=events", label: "Events", helper: "Plan" },
        { href: "/leader?view=attendance", label: "Attendance", helper: "Check-in" },
        { href: "/leader?view=leaderboard", label: "Leaderboard", helper: "Rank" },
      ];
    case "coach":
      return [
        { href: "/staff?view=chapters", label: "Portfolio", helper: "Chapters" },
        { href: "/staff?view=events", label: "Events", helper: "Health" },
        { href: "/staff?view=leaderboard", label: "Leaderboard", helper: "Rank" },
      ];
    case "staff":
      return [
        { href: "/staff?view=chapters", label: "Chapters", helper: "List" },
        { href: "/staff?view=events", label: "Events", helper: "Watch" },
        { href: "/staff?view=leaderboard", label: "Leaderboard", helper: "Rank" },
      ];
    case "ds_admin":
      if (isEventsPointsLaunchLaneEnabled()) {
        return [
          { href: "/admin", label: "Admin", helper: "Home" },
          { href: "/admin/integration-outbox", label: "Queue", helper: "Off" },
          { href: "/admin/audit-log", label: "Audit", helper: "Proof" },
          { href: "/admin/launch-gate", label: "Gate", helper: "Ready" },
          { href: "/admin/pilot-scope", label: "Scope", helper: "Pilot" },
        ];
      }
      return [
        { href: "/admin/integrations", label: "Keys", helper: "Lock" },
        { href: "/admin/feature-flags", label: "Flags", helper: "Pilot" },
        { href: "/admin/theme", label: "Theme", helper: "Shell" },
        { href: "/admin/permissions", label: "Roles", helper: "Scope" },
        { href: "/admin/workflows", label: "Flows", helper: "Map" },
        { href: "/admin/integration-outbox", label: "Queue", helper: "Off" },
      ];
    case "super_admin":
      if (isEventsPointsLaunchLaneEnabled()) {
        return [
          { href: "/admin", label: "Admin", helper: "Home" },
          { href: "/admin/integration-outbox", label: "Queue", helper: "Off" },
          { href: "/admin/audit-log", label: "Audit", helper: "Proof" },
          { href: "/admin/launch-gate", label: "Gate", helper: "Ready" },
          { href: "/admin/pilot-scope", label: "Scope", helper: "Pilot" },
        ];
      }
      return [
        { href: "/admin", label: "Admin", helper: "Home" },
        { href: "/admin/feature-flags", label: "Flags", helper: "Pilot" },
        { href: "/admin/theme", label: "Theme", helper: "Shell" },
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

export function canAccessMemberWorkspace(actor: LocalActorContext): boolean {
  return hasAnyCanonicalRole(actor, [
    "student_member",
    "traveler",
    "committee_member",
    "committee_chair",
    "eboard_officer",
    "vice_president",
    "president",
  ]);
}

export function canAccessLeaderWorkspace(actor: LocalActorContext): boolean {
  return hasAnyCanonicalRole(actor, [
    "committee_chair",
    "eboard_officer",
    "vice_president",
    "president",
  ]);
}

export function canAccessStaffWorkspace(actor: LocalActorContext): boolean {
  return hasAnyCanonicalRole(actor, [
    "coach",
    "department_staff",
    "sales_coach",
    "sales_admin",
    "super_admin",
  ]);
}

export function canAccessAdminWorkspace(actor: LocalActorContext): boolean {
  return hasAnyCanonicalRole(actor, ["ds_admin", "super_admin"]);
}

export function hasTravelerAccess(actor: LocalActorContext): boolean {
  return actor.canonicalRoles.includes("traveler");
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

function hasAnyCanonicalRole(
  actor: LocalActorContext,
  roles: readonly CanonicalRole[],
): boolean {
  return roles.some((role) => actor.canonicalRoles.includes(role));
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
