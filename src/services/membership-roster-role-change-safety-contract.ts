import {
  buildFigmaSandboxSignedInRoleProofReport,
} from "@/services/figma-sandbox-signed-in-role-proof";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getMembershipApprovalWriteConfig,
} from "@/services/membership-approval-write-readiness";
import { buildProductionRolloutRosterImport } from "@/services/production-rollout-roster-import";
import {
  getBlockedProductionSignedInProofSourceMarkers,
} from "@/services/production-signed-in-route-proof-import";
import {
  canAccessWorkspace,
  isPreviewWorkspaceAccess,
} from "@/services/workspace-access";

export type MembershipRosterRoleChangeSafetyLane = {
  key:
    | "local_preview_role_switching"
    | "roster_import_evidence_boundary"
    | "staff_admin_preview_access"
    | "membership_approval_write_boundary"
    | "role_change_audit_intent"
    | "personal_data_write_boundary"
    | "production_rollout_evidence";
  label: string;
  route: string;
  status:
    | "read_only_preview"
    | "implemented_guardrail"
    | "implemented_local_or_staging_only"
    | "blocked_pending_future_lane";
  allowedActors: readonly string[];
  requiredTables: readonly string[];
  requiredFlags: readonly string[];
  forbiddenSideEffects: readonly string[];
  plainEnglishRule: string;
  sourceOfTruth: readonly string[];
};

export type MembershipRosterRoleChangeSafetyContract = {
  title: string;
  summary: readonly string[];
  currentReviewedWritePaths: readonly {
    route: string;
    localFunction: string;
    enabledModes: readonly string[];
    requiredFlags: readonly string[];
    blockedSideEffects: readonly string[];
    reason: string;
  }[];
  globalGuards: readonly string[];
  requiredFoundations: readonly string[];
  lanes: readonly MembershipRosterRoleChangeSafetyLane[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

type EnvSource = Record<string, string | undefined>;

const membershipApprovalLocalFlags = [
  "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE=true",
] as const;

const membershipApprovalHostedFlags = [
  "MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE=true",
] as const;

const lanes = [
  {
    key: "local_preview_role_switching",
    label: "Local preview role switching and route rehearsal",
    route: "/login",
    status: "read_only_preview",
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "ds_admin", "super_admin"],
    requiredTables: ["profiles", "memberships", "staff_role_assignments"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No preview cookie counts as production signed-in route proof.",
      "No local sandbox session counts as production roster authority.",
      "No Test/Figma login row counts as owner-packet or invite-gate evidence.",
      "No route rehearsal creates a production proof row.",
    ],
    plainEnglishRule:
      "Local role switching is useful for route rehearsal only; it must stay visibly separate from real production accounts, real role rows, and rollout proof.",
    sourceOfTruth: [
      "src/services/workspace-access.ts",
      "src/services/figma-sandbox-signed-in-role-proof.ts",
      "src/services/production-signed-in-route-proof-import.ts",
    ],
  },
  {
    key: "roster_import_evidence_boundary",
    label: "Roster import evidence boundary",
    route: "/admin/users",
    status: "implemented_guardrail",
    allowedActors: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["profiles", "memberships"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No Test-prefixed display name enters rollout users CSV.",
      "No figma_seed marker enters rollout users or memberships CSV.",
      "No fake, placeholder, .test, or example email enters rollout users CSV.",
      "No roster import creates production users or memberships by itself.",
    ],
    plainEnglishRule:
      "Roster import can shape owner-reviewed rows into users and memberships CSVs, but Test/Figma/sandbox values are rejected before they can become rollout packet inputs.",
    sourceOfTruth: [
      "src/services/production-rollout-roster-import.ts",
      "src/services/production-rollout-packet-builder.ts",
    ],
  },
  {
    key: "staff_admin_preview_access",
    label: "Staff/admin preview access remains read-only",
    route: "/staff",
    status: "read_only_preview",
    allowedActors: ["coach", "admin", "ds_admin", "super_admin"],
    requiredTables: ["memberships", "staff_role_assignments", "coach_chapter_assignments"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No preview access grants member submit authority.",
      "No preview access grants leader approval authority.",
      "No admin review session silently becomes member or chapter owner truth.",
      "No preview-only route access authorizes roster mutation.",
    ],
    plainEnglishRule:
      "Staff and admin users may inspect student and leader surfaces where allowed, but preview access stays read-only unless a real assigned role owns that workspace.",
    sourceOfTruth: [
      "src/services/workspace-access.ts",
      "src/services/role-access-invariants.ts",
    ],
  },
  {
    key: "membership_approval_write_boundary",
    label: "Membership approval write boundary",
    route: "/chapter/members",
    status: "implemented_local_or_staging_only",
    allowedActors: ["chapter_leader", "admin", "super_admin"],
    requiredTables: ["memberships", "events", "integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: membershipApprovalHostedFlags,
    forbiddenSideEffects: [
      "No hosted production membership approval write.",
      "No welcome send.",
      "No CRM sync.",
      "No provider or n8n automation trigger.",
    ],
    plainEnglishRule:
      "Membership approval is the reviewed access-write lane, currently guarded for localhost or hosted staging rehearsals only, with outbound effects off.",
    sourceOfTruth: [
      "src/services/membership-approval-write-readiness.ts",
      "supabase/tests/database/rls_goal_*.test.sql",
    ],
  },
  {
    key: "role_change_audit_intent",
    label: "Role changes require approved authority and auditable intent",
    route: "/admin/users",
    status: "blocked_pending_future_lane",
    allowedActors: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["memberships", "staff_role_assignments", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No fake role grant or revocation.",
      "No committee chair or president promotion from preview controls.",
      "No hidden workspace expansion without audited readback.",
      "No owner-packet truth claim from local actor fixtures.",
    ],
    plainEnglishRule:
      "Role changes need a dedicated audited authority path with reviewer, timestamp, reason, rollback posture, and readback before they can become live.",
    sourceOfTruth: [
      "src/services/action-committee-leadership-role-safety-contract.ts",
      "src/services/workspace-access.ts",
      "docs/production-signed-in-proof-preflight.md",
    ],
  },
  {
    key: "personal_data_write_boundary",
    label: "Profile/contact/emergency/traveler data write boundary",
    route: "/profile",
    status: "blocked_pending_future_lane",
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    requiredTables: ["profiles", "traveler_profiles", "emergency_contacts", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No profile save.",
      "No contact preference save.",
      "No emergency-contact save.",
      "No traveler detail or SLT readiness mutation.",
    ],
    plainEnglishRule:
      "Roster and role safety must not widen into personal-data editing; profile, contact, emergency, and traveler writes need separate privacy review.",
    sourceOfTruth: [
      "src/services/member-profile-privacy-safety-contract.ts",
      "src/services/slt-prep-write-safety-contract.ts",
    ],
  },
  {
    key: "production_rollout_evidence",
    label: "Production rollout evidence posture",
    route: "/admin",
    status: "blocked_pending_future_lane",
    allowedActors: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["profiles", "memberships", "staff_role_assignments", "signed_in_route_proof", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No Test/Figma/sandbox/mock/staging roster row counts as rollout packet evidence.",
      "No local preview role switch counts as signed-in proof.",
      "No localhost or staging membership approval screenshot counts as invite-gate truth.",
      "No live-count, pilot-proof, or owner-packet row is created by this contract.",
    ],
    plainEnglishRule:
      "Real rollout evidence still requires approved production rows, signed-in account walkthroughs, owner data, live counts, pilot proof, audit/outbox proof, and final invite-gate approval.",
    sourceOfTruth: [
      "src/services/production-rollout-packet-builder.ts",
      "src/services/production-signed-in-route-proof.ts",
      "src/services/production-invite-gate.ts",
    ],
  },
] as const satisfies readonly MembershipRosterRoleChangeSafetyLane[];

export function getMembershipRosterRoleChangeSafetyContract(
  env: EnvSource = process.env,
): MembershipRosterRoleChangeSafetyContract {
  const staffActor = getMockLocalActorContext("general.staff@mymedlife.test");
  const dsAdminActor = getMockLocalActorContext("ds.admin@mymedlife.test");
  const superAdminActor = getMockLocalActorContext("super.admin@mymedlife.test");
  const sandboxProof = buildFigmaSandboxSignedInRoleProofReport();
  const blockedProofSources = getBlockedProductionSignedInProofSourceMarkers();
  const localMembershipConfig = getMembershipApprovalWriteConfig({
    MYMEDLIFE_AUTH_MODE: "local_supabase",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE: "true",
    ...env,
  });
  const stagingMembershipConfig = getMembershipApprovalWriteConfig({
    MYMEDLIFE_AUTH_MODE: "staging_supabase",
    NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "staging-publishable-key",
    NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
    MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE: "true",
    ...env,
  });

  const validationChecks = [
    {
      key: "preview_write_intents_blocked",
      passed:
        isPreviewWorkspaceAccess(staffActor, "student_app") &&
        isPreviewWorkspaceAccess(staffActor, "leader_command_center") &&
        canAccessWorkspace(staffActor, "student_app", { intent: "read" }) &&
        !canAccessWorkspace(staffActor, "student_app", { intent: "submit" }) &&
        !canAccessWorkspace(staffActor, "leader_command_center", { intent: "approve" }) &&
        isPreviewWorkspaceAccess(dsAdminActor, "leader_command_center") &&
        !canAccessWorkspace(dsAdminActor, "leader_command_center", { intent: "message" }) &&
        !canAccessWorkspace(superAdminActor, "leader_command_center", { intent: "message" }),
      message:
        "Staff and admin preview access can read student/leader surfaces but cannot submit, approve, message, or mutate through preview mode.",
    },
    {
      key: "sandbox_signed_in_rows_excluded",
      passed:
        sandboxProof.notProductionEvidence &&
        sandboxProof.rows.length > 0 &&
        sandboxProof.rows.every((row) => row.excludedFromProductionEvidence),
      message:
        "Figma/Test signed-in route proof rows stay marked as sandbox-only and excluded from production rollout evidence.",
    },
    {
      key: "blocked_proof_markers_cover_preview_test_and_staging",
      passed:
        blockedProofSources.includes("preview-cookie") &&
        blockedProofSources.includes("local sandbox") &&
        blockedProofSources.includes("figma_seed") &&
        blockedProofSources.includes("staging.mymedlife.org"),
      message:
        "Production signed-in proof import markers still block preview, local sandbox, Figma/Test, and staging evidence.",
    },
    {
      key: "roster_import_rejects_test_seed_labels",
      passed: rosterImportRejectsTestSeedLabels(),
      message:
        "Roster import rejects Test/Figma/sandbox visible values before generating users or memberships CSVs.",
    },
    {
      key: "membership_write_modes_keep_outbound_effects_off",
      passed:
        localMembershipConfig.enabled &&
        localMembershipConfig.isLocalOnly &&
        stagingMembershipConfig.enabled &&
        stagingMembershipConfig.isHostedStaging &&
        !localMembershipConfig.externalWritesEnabled &&
        !stagingMembershipConfig.externalWritesEnabled &&
        !localMembershipConfig.sendsWelcome &&
        !stagingMembershipConfig.sendsWelcome &&
        !localMembershipConfig.syncsCrm &&
        !stagingMembershipConfig.syncsCrm,
      message:
        "The reviewed membership approval lane remains limited to localhost/hosted staging with welcome sends, CRM sync, and external writes off.",
    },
    {
      key: "contract_does_not_create_production_artifacts",
      passed: true,
      message:
        "This contract only reads local safety posture; it does not create production users, invites, owner CSVs, packets, live counts, signed-in proof rows, or pilot proof rows.",
    },
  ];

  return {
    title: "Membership / roster / role-change safety contract: READ-ONLY readiness spec",
    summary: [
      "This contract is read-only. It does not create production users, send invites, apply owner CSVs, write live roster rows, change roles, or create rollout evidence.",
      "Local preview role switching and Figma/Test signed-in route checks are allowed for rehearsal only and must stay excluded from production proof.",
      "Roster and role changes require approved authority, audit intent, rollback posture, and production readback before they can become live.",
    ],
    currentReviewedWritePaths: [
      {
        route: "/chapter/members",
        localFunction: "app.approve_chapter_membership",
        enabledModes: ["localhost", "hosted staging"],
        requiredFlags: membershipApprovalLocalFlags,
        blockedSideEffects: ["welcome sends disabled", "CRM sync disabled", "external writes disabled"],
        reason: stagingMembershipConfig.reason,
      },
    ],
    globalGuards: [
      "Test/Figma/sandbox/mock/staging roster rows, local preview role switches, and sandbox proof reports do not count as production rollout packet, signed-in proof, live-count, pilot-proof, or invite-gate evidence.",
      "Staff/admin preview access remains read-only unless a real role assignment owns the workspace and the route has an approved audited write path.",
      "Role changes require approved authority, auditable intent, server-side enforcement, rollback posture, and readback before rollout claims can be made.",
      "Profile, contact, emergency, traveler, provider, invite, live-count, owner-packet, signed-in proof, and pilot-proof writes are outside this lane.",
    ],
    requiredFoundations: [
      "Approved production profile, membership, and staff-role rows for every account class used as signed-in proof.",
      "A dedicated audited role-change write path if admins need to grant, revoke, or transfer roles in production.",
      "Owner-reviewed production roster data, live count readback, pilot proof, audit/outbox proof, and final invite-gate approval before rollout.",
      "Privacy review before profile, contact, emergency, traveler, or external-provider identity writes are enabled.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatMembershipRosterRoleChangeSafetyContract(
  contract: MembershipRosterRoleChangeSafetyContract = getMembershipRosterRoleChangeSafetyContract(),
): string {
  return [
    contract.title,
    "",
    "Summary:",
    ...formatList(contract.summary),
    "",
    "Current reviewed write paths:",
    ...contract.currentReviewedWritePaths.flatMap((path) => [
      `- ${path.route}`,
      `  - local function: ${path.localFunction}`,
      `  - enabled modes: ${path.enabledModes.join(", ")}`,
      `  - reason: ${path.reason}`,
      "  - required flags:",
      ...formatNestedList(path.requiredFlags),
      "  - blocked side effects:",
      ...formatNestedList(path.blockedSideEffects),
    ]),
    "",
    "Lanes:",
    ...contract.lanes.flatMap((lane) => [
      `- ${lane.label}`,
      `  - route: ${lane.route}`,
      `  - status: ${lane.status}`,
      `  - allowed actors: ${lane.allowedActors.join(", ")}`,
      `  - rule: ${lane.plainEnglishRule}`,
      "  - forbidden side effects:",
      ...formatNestedList(lane.forbiddenSideEffects),
    ]),
    "",
    "Global guards:",
    ...formatList(contract.globalGuards),
    "",
    "Required foundations:",
    ...formatList(contract.requiredFoundations),
    "",
    "Validation:",
    ...contract.validation.checks.map(
      (check) => `- [${check.passed ? "x" : " "}] ${check.key}: ${check.message}`,
    ),
  ].join("\n");
}

function rosterImportRejectsTestSeedLabels(): boolean {
  try {
    buildProductionRolloutRosterImport(
      [
        "email,displayName,chapterId,roleKey,status",
        "sofia@medlifemovement.org,Test Sofia Alvarez,chapter-ucla,general_member,approved",
      ].join("\n"),
    );
  } catch (error) {
    return error instanceof Error && error.message.includes("Test/Figma sandbox data");
  }

  return false;
}

function formatList(items: readonly string[]): string[] {
  return items.map((item) => `- ${item}`);
}

function formatNestedList(items: readonly string[]): string[] {
  return items.map((item) => `  - ${item}`);
}
