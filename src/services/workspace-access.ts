import type {
  CanonicalRole,
  CanonicalRoleAssignment,
} from "@/services/canonical-role-scope";

export type WorkspaceKey =
  | "student_app"
  | "leader_command_center"
  | "staff_command_center"
  | "admin_backend"
  | "slt_prep";

export type WorkspaceAccessMode = "owner" | "preview";

export type WorkspaceActionIntent =
  | "read"
  | "switch"
  | "write"
  | "submit"
  | "approve"
  | "reject"
  | "message"
  | "integration_trigger"
  | "check_in"
  | "points_change"
  | "delete";

export type WorkspaceAccessContext = {
  intent?: WorkspaceActionIntent;
};

export type WorkspaceOption = {
  key: WorkspaceKey;
  label: string;
  href: string;
  mode: WorkspaceAccessMode;
  readOnly: boolean;
  reason: string;
};

export type WorkspaceAccessUser = {
  primaryCanonicalRole?: CanonicalRole;
  canonicalRoles?: readonly CanonicalRole[];
  canonicalRoleAssignments?: readonly Pick<CanonicalRoleAssignment, "role">[];
  chapterRoles?: readonly string[];
  staffRoles?: readonly string[];
  roleKeys?: readonly string[];
  databaseRoleKeys?: readonly string[];
  includeTravelerRole?: boolean;
};

const workspaceOrder: readonly WorkspaceKey[] = [
  "student_app",
  "leader_command_center",
  "staff_command_center",
  "admin_backend",
  "slt_prep",
];

const workspaceLabels: Record<WorkspaceKey, string> = {
  student_app: "General Student App",
  leader_command_center: "Student Command Center",
  staff_command_center: "Staff Command Center",
  admin_backend: "Admin Backend",
  slt_prep: "SLT Prep",
};

const workspaceHrefs: Record<WorkspaceKey, string> = {
  student_app: "/app",
  leader_command_center: "/leader?view=overview",
  staff_command_center: "/staff?view=chapters",
  admin_backend: "/admin",
  slt_prep: "/app/slt-prep",
};

const studentRoles: readonly CanonicalRole[] = [
  "student_member",
  "traveler",
  "committee_member",
];

const studentLeaderRoles: readonly CanonicalRole[] = [
  "committee_chair",
  "eboard_officer",
  "vice_president",
  "president",
];

const staffRoles: readonly CanonicalRole[] = [
  "coach",
  "department_staff",
  "sales_coach",
  "sales_admin",
  "ds_admin",
  "super_admin",
];

const staffCommandCenterRoles: readonly CanonicalRole[] = [
  "coach",
  "department_staff",
  "sales_coach",
  "sales_admin",
  "super_admin",
];

const adminRoles: readonly CanonicalRole[] = ["ds_admin", "super_admin"];

const writeIntents: readonly WorkspaceActionIntent[] = [
  "write",
  "submit",
  "approve",
  "reject",
  "message",
  "integration_trigger",
  "check_in",
  "points_change",
  "delete",
];

const rawRoleMap: Record<string, CanonicalRole> = {
  general_member: "student_member",
  student_member: "student_member",
  action_committee_member: "committee_member",
  committee_member: "committee_member",
  traveler: "traveler",
  active_traveler: "traveler",
  action_committee_chair: "committee_chair",
  committee_chair: "committee_chair",
  e_board_member: "eboard_officer",
  eboard_member: "eboard_officer",
  eboard_officer: "eboard_officer",
  chapter_president: "president",
  president: "president",
  president_vp: "president",
  chapter_president_vice_president: "president",
  chapter_vice_president: "vice_president",
  vice_president: "vice_president",
  chapter_director_events_action_committees: "eboard_officer",
  chapter_membership_leadership_development: "eboard_officer",
  chapter_marketing_proof_director: "eboard_officer",
  chapter_slt_director: "eboard_officer",
  chapter_moving_mountains_director: "eboard_officer",
  chapter_grow_the_movement_director: "eboard_officer",
  coach: "coach",
  sales_coach: "sales_coach",
  admin: "department_staff",
  staff: "department_staff",
  general_staff: "department_staff",
  department_staff: "department_staff",
  sales_admin: "sales_admin",
  ds_admin: "ds_admin",
  super_admin: "super_admin",
};

export function getAllowedWorkspaces(user: WorkspaceAccessUser): WorkspaceOption[] {
  const roles = getWorkspaceCanonicalRoles(user);
  const options = new Map<WorkspaceKey, WorkspaceOption>();

  if (hasAnyRole(roles, [...studentRoles, ...studentLeaderRoles])) {
    options.set("student_app", buildWorkspaceOption("student_app", "owner"));
  }

  if (hasAnyRole(roles, studentLeaderRoles)) {
    options.set(
      "leader_command_center",
      buildWorkspaceOption("leader_command_center", "owner"),
    );
  }

  if (hasAnyRole(roles, staffRoles)) {
    if (!options.has("student_app")) {
      options.set("student_app", buildWorkspaceOption("student_app", "preview"));
    }

    if (!options.has("leader_command_center")) {
      options.set(
        "leader_command_center",
        buildWorkspaceOption("leader_command_center", "preview"),
      );
    }
  }

  if (hasAnyRole(roles, staffCommandCenterRoles)) {
    options.set(
      "staff_command_center",
      buildWorkspaceOption("staff_command_center", "owner"),
    );
  }

  if (hasAnyRole(roles, adminRoles)) {
    options.set("admin_backend", buildWorkspaceOption("admin_backend", "owner"));
  }

  if (roles.includes("traveler")) {
    options.set("slt_prep", buildWorkspaceOption("slt_prep", "owner"));
  }

  return workspaceOrder
    .map((key) => options.get(key))
    .filter((option): option is WorkspaceOption => Boolean(option));
}

export function getDefaultWorkspace(user: WorkspaceAccessUser): WorkspaceKey {
  const roles = getWorkspaceCanonicalRoles(user);

  if (roles.includes("super_admin") || roles.includes("ds_admin")) {
    return "admin_backend";
  }

  if (hasAnyRole(roles, staffCommandCenterRoles)) {
    return "staff_command_center";
  }

  if (isStudentLeader(user)) {
    return "leader_command_center";
  }

  if (hasAnyRole(roles, ["student_member", "committee_member"])) {
    return "student_app";
  }

  if (roles.includes("traveler")) {
    return "slt_prep";
  }

  return getAllowedWorkspaces(user)[0]?.key ?? "student_app";
}

export function canAccessWorkspace(
  user: WorkspaceAccessUser,
  workspace: WorkspaceKey,
  context: WorkspaceAccessContext = {},
): boolean {
  const option = getAllowedWorkspaces(user).find((item) => item.key === workspace);

  if (!option) {
    return false;
  }

  const intent = context.intent ?? "read";

  if (option.mode === "preview" && writeIntents.includes(intent)) {
    return false;
  }

  return true;
}

export function isStudentLeader(user: WorkspaceAccessUser): boolean {
  return hasAnyRole(getWorkspaceCanonicalRoles(user), studentLeaderRoles);
}

export function isStaffUser(user: WorkspaceAccessUser): boolean {
  return hasAnyRole(getWorkspaceCanonicalRoles(user), staffRoles);
}

export function isPreviewWorkspaceAccess(
  user: WorkspaceAccessUser,
  workspace: WorkspaceKey,
): boolean {
  return getAllowedWorkspaces(user).some((item) => {
    return item.key === workspace && item.mode === "preview";
  });
}

export function getWorkspaceHref(key: WorkspaceKey): string {
  return workspaceHrefs[key];
}

export function getWorkspaceLabel(key: WorkspaceKey): string {
  return workspaceLabels[key];
}

export function getWorkspaceCanonicalRoles(
  user: WorkspaceAccessUser,
): CanonicalRole[] {
  const roles = new Set<CanonicalRole>();

  if (user.primaryCanonicalRole) {
    roles.add(user.primaryCanonicalRole);
  }

  for (const role of user.canonicalRoles ?? []) {
    roles.add(role);
  }

  for (const assignment of user.canonicalRoleAssignments ?? []) {
    roles.add(assignment.role);
  }

  for (const rawRole of [
    ...(user.roleKeys ?? []),
    ...(user.databaseRoleKeys ?? []),
    ...(user.chapterRoles ?? []),
    ...(user.staffRoles ?? []),
  ]) {
    const mappedRole = rawRoleMap[toRoleLookupKey(rawRole)];

    if (mappedRole) {
      roles.add(mappedRole);
    }
  }

  if (user.includeTravelerRole) {
    roles.add("traveler");
  }

  return [...roles];
}

function buildWorkspaceOption(
  key: WorkspaceKey,
  mode: WorkspaceAccessMode,
): WorkspaceOption {
  return {
    key,
    label: workspaceLabels[key],
    href: workspaceHrefs[key],
    mode,
    readOnly: mode === "preview",
    reason:
      mode === "preview"
        ? "Staff preview access is read-only."
        : "Workspace is available from assigned role access.",
  };
}

function hasAnyRole(
  roles: readonly CanonicalRole[],
  expected: readonly CanonicalRole[],
): boolean {
  return expected.some((role) => roles.includes(role));
}

function toRoleLookupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
