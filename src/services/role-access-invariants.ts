import { getCanonicalRoleAssignments } from "./canonical-role-scope.ts";
import {
  canAccessWorkspace,
  getAllowedWorkspaces,
  getDefaultWorkspace,
  getWorkspaceHref,
  type WorkspaceAccessUser,
  type WorkspaceKey,
} from "./workspace-access.ts";
import {
  getProductionSignedInRouteProofRequirements,
  type ProductionSignedInRouteProofRequirement,
} from "./production-signed-in-route-proof.ts";

type InvariantCaseInput = {
  key: string;
  label: string;
  audience:
    | "chapter_member"
    | "chapter_leader"
    | "coach"
    | "admin"
    | "ds_admin"
    | "super_admin";
  chapterRoles?: string[];
  staffRoles?: string[];
  includeTravelerRole?: boolean;
  productionProofClass?: ProductionSignedInRouteProofRequirement["key"] | null;
  productionProofNote: string;
};

export type RoleAccessInvariantCaseReport = {
  key: string;
  label: string;
  defaultWorkspace: WorkspaceKey;
  defaultHref: string;
  ownerWorkspaces: WorkspaceKey[];
  previewWorkspaces: WorkspaceKey[];
  blockedWorkspaces: WorkspaceKey[];
  previewWritesBlocked: boolean;
  productionProofClass: ProductionSignedInRouteProofRequirement["key"] | null;
  productionProofNote: string;
};

export type RoleAccessInvariantsReport = {
  title: string;
  generatedAt: string;
  productionProofRequirements: ProductionSignedInRouteProofRequirement[];
  cases: RoleAccessInvariantCaseReport[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

const invariantCases: InvariantCaseInput[] = [
  {
    key: "member_only",
    label: "General member",
    audience: "chapter_member",
    chapterRoles: ["General Member"],
    productionProofClass: "student_app",
    productionProofNote:
      "This is the real member proof class for /app. It must not be substituted with staff/admin preview access.",
  },
  {
    key: "leader_only",
    label: "Student leader",
    audience: "chapter_leader",
    chapterRoles: ["President / VP"],
    productionProofClass: "leader_command_center",
    productionProofNote:
      "This is the real leader proof class for /leader?view=overview and should still retain member-owned student access.",
  },
  {
    key: "staff_support_only",
    label: "Staff/support coach",
    audience: "coach",
    staffRoles: ["Coach"],
    productionProofClass: "staff_command_center",
    productionProofNote:
      "This is the real staff/support proof class for /staff?view=chapters. Student and leader surfaces stay preview/read-only only.",
  },
  {
    key: "ds_admin_only",
    label: "DS admin",
    audience: "ds_admin",
    staffRoles: ["DS Admin"],
    productionProofClass: "admin_backend",
    productionProofNote:
      "This is the real DS/admin proof class for /admin. Preview access to student or leader surfaces does not count as member or leader proof.",
  },
  {
    key: "leader_plus_staff",
    label: "Leader plus coach assignment",
    audience: "coach",
    chapterRoles: ["President / VP"],
    staffRoles: ["Coach"],
    productionProofClass: null,
    productionProofNote:
      "Mixed-role actor should keep owned access to student, leader, and staff workspaces. This is not a substitute for distinct production proof classes.",
  },
  {
    key: "coach_plus_ds_admin",
    label: "Coach plus DS admin assignment",
    audience: "ds_admin",
    staffRoles: ["Coach", "DS Admin"],
    productionProofClass: null,
    productionProofNote:
      "Mixed support/admin actor should own staff and admin routes while keeping student and leader access preview-only. It still cannot stand in for member or leader production proof.",
  },
];

export function getRoleAccessInvariantsReport(): RoleAccessInvariantsReport {
  const productionProofRequirements = getProductionSignedInRouteProofRequirements();
  const cases = invariantCases.map(buildCaseReport);
  const report = {
    title: "Role access invariants: READ-ONLY readiness report",
    generatedAt: new Date().toISOString(),
    productionProofRequirements,
    cases,
    validation: {
      ready: false,
      checks: [],
    },
  } satisfies Omit<RoleAccessInvariantsReport, "validation"> & {
    validation: RoleAccessInvariantsReport["validation"];
  };

  return {
    ...report,
    validation: getRoleAccessInvariantsValidation(report),
  };
}

export function getRoleAccessInvariantsValidation(
  report = getRoleAccessInvariantsReport(),
) {
  const member = getCase(report, "member_only");
  const leader = getCase(report, "leader_only");
  const staff = getCase(report, "staff_support_only");
  const admin = getCase(report, "ds_admin_only");
  const leaderPlusStaff = getCase(report, "leader_plus_staff");
  const coachPlusAdmin = getCase(report, "coach_plus_ds_admin");

  const checks = [
    {
      key: "production-proof-classes-aligned",
      passed:
        report.productionProofRequirements.map((item) => item.expectedPath).join("|") ===
        "/app|/leader?view=overview|/staff?view=chapters|/admin",
      message:
        "The four required production proof classes still align to /app, /leader?view=overview, /staff?view=chapters, and /admin.",
    },
    {
      key: "member-boundary",
      passed:
        member.defaultWorkspace === "student_app" &&
        arrayEquals(member.ownerWorkspaces, ["student_app"]) &&
        arrayEquals(member.blockedWorkspaces, [
          "leader_command_center",
          "staff_command_center",
          "admin_backend",
          "slt_prep",
        ]),
      message:
        "General members stay limited to the student app and do not gain leader, staff, or admin access.",
    },
    {
      key: "leader-boundary",
      passed:
        leader.defaultWorkspace === "leader_command_center" &&
        arrayEquals(leader.ownerWorkspaces, [
          "student_app",
          "leader_command_center",
        ]) &&
        leader.blockedWorkspaces.includes("staff_command_center") &&
        leader.blockedWorkspaces.includes("admin_backend"),
      message:
        "Student leaders keep owned student plus leader access and do not gain staff or admin workspaces by default.",
    },
    {
      key: "staff-preview-boundary",
      passed:
        staff.defaultWorkspace === "staff_command_center" &&
        arrayEquals(staff.ownerWorkspaces, ["staff_command_center"]) &&
        arrayEquals(staff.previewWorkspaces, [
          "student_app",
          "leader_command_center",
        ]) &&
        staff.previewWritesBlocked,
      message:
        "Staff/support defaults to the staff command center, and student/leader access remains preview-only with writes blocked.",
    },
    {
      key: "ds-admin-boundary",
      passed:
        admin.defaultWorkspace === "admin_backend" &&
        arrayEquals(admin.ownerWorkspaces, ["admin_backend"]) &&
        arrayEquals(admin.previewWorkspaces, [
          "student_app",
          "leader_command_center",
        ]) &&
        admin.previewWritesBlocked &&
        !admin.ownerWorkspaces.includes("staff_command_center"),
      message:
        "DS/admin defaults to the admin backend, keeps student/leader access preview-only, and does not become staff/support proof by default.",
    },
    {
      key: "leader-plus-staff-mixed-role",
      passed:
        leaderPlusStaff.defaultWorkspace === "staff_command_center" &&
        arrayEquals(leaderPlusStaff.ownerWorkspaces, [
          "student_app",
          "leader_command_center",
          "staff_command_center",
        ]) &&
        !leaderPlusStaff.previewWorkspaces.length,
      message:
        "Leader plus coach assignment keeps owned access to student, leader, and staff workspaces, with staff as the default landing route.",
    },
    {
      key: "coach-plus-admin-mixed-role",
      passed:
        coachPlusAdmin.defaultWorkspace === "admin_backend" &&
        arrayEquals(coachPlusAdmin.ownerWorkspaces, [
          "staff_command_center",
          "admin_backend",
        ]) &&
        arrayEquals(coachPlusAdmin.previewWorkspaces, [
          "student_app",
          "leader_command_center",
        ]) &&
        coachPlusAdmin.previewWritesBlocked,
      message:
        "Coach plus DS/admin assignment owns staff plus admin routes while keeping student and leader access preview-only.",
    },
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

export function formatRoleAccessInvariantsReport(
  report = getRoleAccessInvariantsReport(),
) {
  return [
    report.title,
    "",
    "Production proof classes:",
    ...report.productionProofRequirements.map(
      (item) => `- ${item.label}: ${item.expectedPath} using ${item.roleDetail}`,
    ),
    "",
    "Invariant cases:",
    ...report.cases.flatMap((item) => [
      `- ${item.label}`,
      `  - default route: ${item.defaultHref}`,
      `  - owner workspaces: ${item.ownerWorkspaces.join(", ") || "none"}`,
      `  - preview workspaces: ${item.previewWorkspaces.join(", ") || "none"}`,
      `  - blocked workspaces: ${item.blockedWorkspaces.join(", ") || "none"}`,
      `  - preview writes blocked: ${item.previewWritesBlocked ? "yes" : "no"}`,
      `  - proof note: ${item.productionProofNote}`,
    ]),
    "",
    "Validation:",
    ...report.validation.checks.map(
      (check) => `- ${check.passed ? "PASS" : "FAIL"} ${check.message}`,
    ),
  ].join("\n");
}

function buildCaseReport(input: InvariantCaseInput): RoleAccessInvariantCaseReport {
  const user = createUser(input);
  const allowed = getAllowedWorkspaces(user);
  const ownerWorkspaces = allowed
    .filter((item) => item.mode === "owner")
    .map((item) => item.key);
  const previewWorkspaces = allowed
    .filter((item) => item.mode === "preview")
    .map((item) => item.key);
  const allWorkspaces: WorkspaceKey[] = [
    "student_app",
    "leader_command_center",
    "staff_command_center",
    "admin_backend",
    "slt_prep",
  ];
  const blockedWorkspaces = allWorkspaces.filter(
    (key) => !allowed.some((item) => item.key === key),
  );

  return {
    key: input.key,
    label: input.label,
    defaultWorkspace: getDefaultWorkspace(user),
    defaultHref: getWorkspaceHref(getDefaultWorkspace(user)),
    ownerWorkspaces,
    previewWorkspaces,
    blockedWorkspaces,
    previewWritesBlocked: previewWorkspaces.every((workspace) => {
      return !canAccessWorkspace(user, workspace, { intent: "submit" });
    }),
    productionProofClass: input.productionProofClass ?? null,
    productionProofNote: input.productionProofNote,
  };
}

function createUser(input: InvariantCaseInput): WorkspaceAccessUser {
  const assignments = getCanonicalRoleAssignments({
    audience: input.audience,
    chapterRoles: input.chapterRoles,
    staffRoles: input.staffRoles,
    includeTravelerRole: input.includeTravelerRole,
    includeBreakglassScope: input.audience === "super_admin",
  });

  return {
    canonicalRoleAssignments: assignments,
    chapterRoles: input.chapterRoles,
    staffRoles: input.staffRoles,
    includeTravelerRole: input.includeTravelerRole,
  };
}

function getCase(report: RoleAccessInvariantsReport, key: string) {
  const found = report.cases.find((item) => item.key === key);

  if (!found) {
    throw new Error(`Missing invariant case ${key}.`);
  }

  return found;
}

function arrayEquals(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
