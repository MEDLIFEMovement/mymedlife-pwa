import type { DatabaseRoleKey } from "@/shared/types/persistence";

export type CanonicalRole =
  | "student_member"
  | "traveler"
  | "committee_member"
  | "committee_chair"
  | "eboard_officer"
  | "vice_president"
  | "president"
  | "coach"
  | "department_staff"
  | "sales_coach"
  | "sales_admin"
  | "ds_admin"
  | "super_admin";

export type CanonicalScope =
  | "own"
  | "committee"
  | "chapter"
  | "assigned_coach_portfolio"
  | "department"
  | "all_platform"
  | "breakglass";

export type CanonicalLandingSurface =
  | "student_home_mobile"
  | "student_leadership_command_center"
  | "coach_command_center"
  | "staff_hq_command_center"
  | "admin_backend"
  | "slt_prep";

export type CanonicalRoleAssignmentSource =
  | "actor_audience"
  | "chapter_role_label"
  | "staff_role_label"
  | "database_role_key";

export type CanonicalRoleAssignment = {
  role: CanonicalRole;
  scope: CanonicalScope;
  source: CanonicalRoleAssignmentSource;
  sourceValue: string;
};

type ActorAudienceLike =
  | "chapter_member"
  | "chapter_leader"
  | "coach"
  | "admin"
  | "ds_admin"
  | "super_admin";

type CanonicalRoleMapping = Pick<CanonicalRoleAssignment, "role" | "scope">;

const canonicalRolePrecedence: readonly CanonicalRole[] = [
  "student_member",
  "traveler",
  "committee_member",
  "committee_chair",
  "eboard_officer",
  "vice_president",
  "president",
  "coach",
  "department_staff",
  "sales_coach",
  "sales_admin",
  "ds_admin",
  "super_admin",
];

const audienceDefaults: Record<ActorAudienceLike, CanonicalRoleMapping> = {
  chapter_member: { role: "student_member", scope: "own" },
  chapter_leader: { role: "eboard_officer", scope: "chapter" },
  coach: { role: "coach", scope: "assigned_coach_portfolio" },
  admin: { role: "department_staff", scope: "department" },
  ds_admin: { role: "ds_admin", scope: "all_platform" },
  super_admin: { role: "super_admin", scope: "all_platform" },
};

const databaseRoleMappings: Record<DatabaseRoleKey, CanonicalRoleMapping> = {
  general_member: { role: "student_member", scope: "own" },
  action_committee_member: { role: "committee_member", scope: "committee" },
  action_committee_chair: { role: "committee_chair", scope: "committee" },
  e_board_member: { role: "eboard_officer", scope: "chapter" },
  president_vp: { role: "president", scope: "chapter" },
  coach: { role: "coach", scope: "assigned_coach_portfolio" },
  admin: { role: "department_staff", scope: "department" },
  ds_admin: { role: "ds_admin", scope: "all_platform" },
  super_admin: { role: "super_admin", scope: "all_platform" },
  test: { role: "student_member", scope: "own" },
};

const chapterRoleLabelMappings: Record<string, CanonicalRoleMapping> = {
  "General Member": { role: "student_member", scope: "own" },
  "Action Committee Member": { role: "committee_member", scope: "committee" },
  "Action Committee Chair": { role: "committee_chair", scope: "committee" },
  "E-Board Member": { role: "eboard_officer", scope: "chapter" },
  "Vice President": { role: "vice_president", scope: "chapter" },
  "President / VP": { role: "president", scope: "chapter" },
  "Chapter President / Vice President": { role: "president", scope: "chapter" },
};

const staffRoleLabelMappings: Record<string, CanonicalRoleMapping> = {
  Coach: { role: "coach", scope: "assigned_coach_portfolio" },
  Admin: { role: "department_staff", scope: "department" },
  "General Staff": { role: "department_staff", scope: "department" },
  "DS Admin": { role: "ds_admin", scope: "all_platform" },
  "Super Admin": { role: "super_admin", scope: "all_platform" },
  "Sales Coach": { role: "sales_coach", scope: "assigned_coach_portfolio" },
  "Sales Admin": { role: "sales_admin", scope: "department" },
};

const landingSurfaceByRole: Record<CanonicalRole, CanonicalLandingSurface> = {
  student_member: "student_home_mobile",
  traveler: "slt_prep",
  committee_member: "student_home_mobile",
  committee_chair: "student_leadership_command_center",
  eboard_officer: "student_leadership_command_center",
  vice_president: "student_leadership_command_center",
  president: "student_leadership_command_center",
  coach: "coach_command_center",
  department_staff: "staff_hq_command_center",
  sales_coach: "staff_hq_command_center",
  sales_admin: "staff_hq_command_center",
  ds_admin: "admin_backend",
  super_admin: "admin_backend",
};

export function getCanonicalRoleAssignments(input: {
  audience: ActorAudienceLike;
  chapterRoles?: readonly string[];
  staffRoles?: readonly string[];
  databaseRoleKeys?: readonly DatabaseRoleKey[];
  includeTravelerRole?: boolean;
  includeBreakglassScope?: boolean;
}): CanonicalRoleAssignment[] {
  const hasExplicitLeaderRole =
    input.audience === "chapter_leader" &&
    ((input.chapterRoles ?? []).some((chapterRole) => {
      return chapterRole in chapterRoleLabelMappings;
    }) ||
      (input.databaseRoleKeys ?? []).some((roleKey) => {
        return (
          roleKey === "action_committee_chair" ||
          roleKey === "e_board_member" ||
          roleKey === "president_vp"
        );
      }));
  const assignments: CanonicalRoleAssignment[] = hasExplicitLeaderRole
    ? []
    : [
        toAssignment(
          audienceDefaults[input.audience],
          "actor_audience",
          input.audience,
        ),
      ];

  for (const roleKey of input.databaseRoleKeys ?? []) {
    assignments.push(
      toAssignment(
        databaseRoleMappings[roleKey],
        "database_role_key",
        roleKey,
      ),
    );
  }

  for (const chapterRole of input.chapterRoles ?? []) {
    const mapping = chapterRoleLabelMappings[chapterRole];
    if (!mapping) {
      continue;
    }

    assignments.push(
      toAssignment(mapping, "chapter_role_label", chapterRole),
    );
  }

  for (const staffRole of input.staffRoles ?? []) {
    const mapping = staffRoleLabelMappings[staffRole];
    if (!mapping) {
      continue;
    }

    assignments.push(
      toAssignment(mapping, "staff_role_label", staffRole),
    );
  }

  if (input.includeTravelerRole) {
    assignments.push(
      toAssignment(
        { role: "traveler", scope: "own" },
        "actor_audience",
        "traveler",
      ),
    );
  }

  if (input.includeBreakglassScope) {
    const elevatedRole = [...assignments]
      .reverse()
      .find((assignment) => {
        return assignment.role === "ds_admin" || assignment.role === "super_admin";
      });

    if (elevatedRole) {
      assignments.push({
        ...elevatedRole,
        scope: "breakglass",
      });
    }
  }

  return dedupeAssignments(assignments);
}

export function getCanonicalRoles(
  assignments: readonly CanonicalRoleAssignment[],
): CanonicalRole[] {
  return dedupe(assignments.map((assignment) => assignment.role));
}

export function getCanonicalScopes(
  assignments: readonly CanonicalRoleAssignment[],
): CanonicalScope[] {
  return dedupe(assignments.map((assignment) => assignment.scope));
}

export function getHighestOperationalCanonicalRole(
  assignments: readonly CanonicalRoleAssignment[],
): CanonicalRole {
  const roles = getCanonicalRoles(assignments);

  return canonicalRolePrecedence
    .slice()
    .reverse()
    .find((role) => roles.includes(role)) ?? "student_member";
}

export function getCanonicalLandingSurface(
  role: CanonicalRole,
): CanonicalLandingSurface {
  return landingSurfaceByRole[role];
}

export function getCanonicalRolePrecedence(): readonly CanonicalRole[] {
  return canonicalRolePrecedence;
}

function toAssignment(
  mapping: CanonicalRoleMapping,
  source: CanonicalRoleAssignmentSource,
  sourceValue: string,
): CanonicalRoleAssignment {
  return {
    role: mapping.role,
    scope: mapping.scope,
    source,
    sourceValue,
  };
}

function dedupeAssignments(
  assignments: readonly CanonicalRoleAssignment[],
): CanonicalRoleAssignment[] {
  const seen = new Set<string>();

  return assignments.filter((assignment) => {
    const key = `${assignment.role}:${assignment.scope}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function dedupe<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
