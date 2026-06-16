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

const baseNavigation: NavigationItem[] = [
  { href: "/chapter", label: "My Chapter" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/rush-month", label: "Rush Month" },
  { href: "/rush-month/dashboard", label: "My Week" },
  { href: "/rush-month/events", label: "Events" },
  { href: "/rush-month/loop", label: "Loop" },
  { href: "/rush-month/actions", label: "My Actions" },
];

export function canReadChapterData(actor: LocalActorContext): boolean {
  return actor.audience !== "ds_admin";
}

export function canReadAssignment(
  actor: LocalActorContext,
  assignment: Assignment,
): boolean {
  switch (actor.audience) {
    case "chapter_member":
      return assignment.lane === "Member";
    case "chapter_leader":
      return assignment.lane === "Member" || assignment.lane === "Leader";
    case "coach":
      return assignment.lane === "Coach" || assignment.status !== "approved";
    case "admin":
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
  switch (actor.audience) {
    case "chapter_leader":
      return risk.visibility === "leader_visible";
    case "coach":
    case "admin":
    case "super_admin":
      return true;
    case "chapter_member":
    case "ds_admin":
      return false;
  }
}

export function canReadIntegrationOutbox(actor: LocalActorContext): boolean {
  return actor.audience === "ds_admin" || actor.audience === "super_admin";
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
  switch (actor.audience) {
    case "admin":
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
    case "chapter_leader":
    case "chapter_member":
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

  switch (actor.audience) {
    case "chapter_member":
      return [
        ...baseNavigation,
        { href: "/rush-month/evidence", label: "My Proof" },
        { href: "/proof-library", label: "Proof Library" },
      ];
    case "chapter_leader":
      return [
        { href: "/chapter", label: "Chapter" },
        { href: "/chapter/members", label: "Members" },
        { href: "/campaigns", label: "Campaigns" },
        { href: "/action-committees", label: "Committees" },
        { href: "/rush-month", label: "Rush Month" },
        { href: "/rush-month/dashboard", label: "Dashboard" },
        { href: "/rush-month/events", label: "Events" },
        { href: "/rush-month/loop", label: "MVP Loop" },
        { href: "/rush-month/actions", label: "Team Actions" },
        { href: "/rush-month/evidence", label: "Proof" },
        { href: "/rush-month/review", label: "Follow-Up" },
      ];
    case "coach":
      return [
        { href: "/chapter", label: "Portfolio Chapter" },
        { href: "/chapter/members", label: "Roster" },
        { href: "/campaigns", label: "Campaigns" },
        { href: "/action-committees", label: "Events" },
        { href: "/rush-month", label: "Rush Month" },
        { href: "/rush-month/dashboard", label: "Campaign Health" },
        { href: "/rush-month/events", label: "Events" },
        { href: "/rush-month/loop", label: "MVP Loop" },
        { href: "/rush-month/actions", label: "Open Work" },
        { href: "/proof-library", label: "Proof Library" },
        { href: "/coach", label: "Coach" },
      ];
    case "admin":
      return [
        { href: "/chapter", label: "Chapter Support" },
        { href: "/chapter/members", label: "Members" },
        { href: "/campaigns", label: "Campaign Support" },
        { href: "/proof-library", label: "Proof Library" },
        { href: "/rush-month/dashboard", label: "Rush Dashboard" },
        { href: "/rush-month/events", label: "Events" },
        { href: "/rush-month/loop", label: "Rush Loop" },
        { href: "/coach", label: "Coach Read" },
        { href: "/admin", label: "HQ Admin" },
        { href: "/admin/first-write", label: "First Write" },
        { href: "/admin/write-sequence", label: "Write Sequence" },
        { href: "/admin/pilot-scope", label: "Pilot Scope" },
        { href: "/admin/staff-dry-run", label: "Dry Run" },
      ];
    case "ds_admin":
      return [
        { href: "/admin", label: "Integration Outbox" },
        { href: "/admin/first-write", label: "First Write Safety" },
        { href: "/admin/write-sequence", label: "Write Sequence Safety" },
        { href: "/admin/pilot-scope", label: "Pilot Safety" },
        { href: "/admin/staff-dry-run", label: "Dry Run Safety" },
      ];
    case "super_admin":
      return [
        { href: "/chapter", label: "All Chapters" },
        { href: "/chapter/members", label: "Members" },
        { href: "/rush-month", label: "Campaigns" },
        { href: "/campaigns", label: "Campaign Library" },
        { href: "/rush-month/dashboard", label: "Rush Dashboard" },
        { href: "/rush-month/events", label: "Events" },
        { href: "/rush-month/loop", label: "MVP Loop" },
        { href: "/action-committees", label: "Committees" },
        { href: "/rush-month/actions", label: "Assignments" },
        { href: "/proof-library", label: "Proof Library" },
        { href: "/rush-month/review", label: "Reviews" },
        { href: "/coach", label: "Coach" },
        { href: "/admin", label: "Super Admin" },
        { href: "/admin/first-write", label: "First Write" },
        { href: "/admin/write-sequence", label: "Write Sequence" },
        { href: "/admin/pilot-scope", label: "Pilot Scope" },
        { href: "/admin/staff-dry-run", label: "Dry Run" },
      ];
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

  switch (actor.audience) {
    case "chapter_member":
      return [
        { href: "/rush-month/dashboard", label: "My Week", helper: "Next" },
        { href: "/rush-month/actions", label: "Actions", helper: "Do" },
        { href: "/proof-library", label: "Proof", helper: "Learn" },
        { href: "/chapter", label: "Chapter", helper: "Home" },
      ];
    case "chapter_leader":
      return [
        { href: "/rush-month", label: "Rush", helper: "Plan" },
        { href: "/chapter/members", label: "People", helper: "Roles" },
        { href: "/rush-month/review", label: "Review", helper: "Proof" },
        { href: "/rush-month/loop", label: "Loop", helper: "Demo" },
      ];
    case "coach":
      return [
        { href: "/rush-month/dashboard", label: "Health", helper: "Read" },
        { href: "/chapter/members", label: "Roster", helper: "Roles" },
        { href: "/coach", label: "Coach", helper: "Decide" },
        { href: "/proof-library", label: "Proof", helper: "Belief" },
      ];
    case "admin":
      return [
        { href: "/admin", label: "Admin", helper: "Review" },
        { href: "/admin/first-write", label: "Write", helper: "Drill" },
        { href: "/admin/write-sequence", label: "Sequence", helper: "Order" },
        { href: "/admin/pilot-scope", label: "Pilot", helper: "Scope" },
      ];
    case "ds_admin":
      return [
        { href: "/admin", label: "Outbox", helper: "Safety" },
        { href: "/admin/first-write", label: "Write", helper: "No sends" },
        { href: "/admin/write-sequence", label: "Sequence", helper: "No sends" },
        { href: "/admin/pilot-scope", label: "Pilot", helper: "No sends" },
      ];
    case "super_admin":
      return [
        { href: "/admin", label: "Admin", helper: "Full" },
        { href: "/admin/first-write", label: "Write", helper: "Drill" },
        { href: "/admin/write-sequence", label: "Sequence", helper: "Order" },
        { href: "/admin/pilot-scope", label: "Pilot", helper: "Scope" },
      ];
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
