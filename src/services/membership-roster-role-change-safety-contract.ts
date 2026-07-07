import { getFeatureFlagDefinition } from "@/services/admin-rollout-controls-registry";
import { getChapterMembershipWorkspace } from "@/services/chapter-membership-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getMembershipApprovalWriteConfig,
} from "@/services/membership-approval-write-readiness";
import {
  getBlockedProductionSignedInProofSourceMarkers,
} from "@/services/production-signed-in-route-proof-import";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getRoleAccessInvariantsReport } from "@/services/role-access-invariants";
import { getAllowedWorkspaces } from "@/services/workspace-access";

export type MembershipRosterRoleChangeSafetyLane = {
  key:
    | "roster_truth_and_preview_boundary"
    | "chapter_membership_approval_authority"
    | "role_change_and_escalation_authority"
    | "staff_admin_preview_access_boundary"
    | "welcome_contact_and_crm_side_effects"
    | "derived_assignment_points_proof_authority"
    | "production_proof_and_rollout_evidence";
  label: string;
  route: string;
  status: "read_only_preview" | "blocked_pending_future_lane";
  requiredTables: readonly string[];
  requiredFlags: readonly string[];
  allowedActors: readonly string[];
  forbiddenSideEffects: readonly string[];
  plainEnglishRule: string;
  sourceOfTruth: readonly string[];
};

export type MembershipRosterRoleChangeSafetyContract = {
  title: string;
  summary: readonly string[];
  currentWritePath: {
    exists: false;
    reason: string;
    blockedUntil: readonly string[];
  };
  adjacentGuardrails: readonly {
    lane: string;
    route: string;
    currentPosture: string;
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

const membershipApprovalFlagKey = "membership_approval_write" as const;

const lanes = [
  {
    key: "roster_truth_and_preview_boundary",
    label: "Roster truth versus preview, static, and Test-only rosters",
    route: "/chapter/members",
    status: "read_only_preview",
    requiredTables: ["profiles", "memberships", "audit_logs"],
    requiredFlags: [membershipApprovalFlagKey],
    allowedActors: ["chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake roster row creation or removal.",
      "No fake member activation or deactivation from preview-only roster state.",
      "No fake chapter-owned truth from Test/Figma/sandbox/mock/staging/sample roster rows.",
      "No local roster rehearsal artifact counts as production member truth.",
    ],
    plainEnglishRule:
      "Roster surfaces can explain who is visible, pending, thinly covered, or follow-up risk, but preview data must stay separate from real chapter membership truth.",
    sourceOfTruth: [
      "src/services/chapter-membership-workspace.ts",
      "src/services/read-only-app-data.ts",
      "src/services/local-actor-context.ts",
    ],
  },
  {
    key: "chapter_membership_approval_authority",
    label: "Chapter membership approval and rejection authority",
    route: "/chapter/members",
    status: "blocked_pending_future_lane",
    requiredTables: ["memberships", "events", "automation_outbox", "audit_logs"],
    requiredFlags: [membershipApprovalFlagKey],
    allowedActors: ["chapter_leader", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake join approval or rejection from browser preview state.",
      "No fake membership row creation as production truth.",
      "No fake approval readback from local/Test/staging rehearsal alone.",
      "No fake production roster evidence from the membership approval packet.",
    ],
    plainEnglishRule:
      "Membership approval has a reviewed rehearsal path, but it still needs approved authority, signed-in reviewer intent, audit reason, and audited readback before it can count as real roster truth.",
    sourceOfTruth: [
      "src/services/membership-approval-write-readiness.ts",
      "src/services/membership-approval-result-states.ts",
      "src/services/chapter-membership-workspace.ts",
    ],
  },
  {
    key: "role_change_and_escalation_authority",
    label: "Role changes, promotions, demotions, and committee/leader derivation",
    route: "/chapter/members",
    status: "blocked_pending_future_lane",
    requiredTables: ["memberships", "staff_role_assignments", "coach_chapter_assignments", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_leader", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake role grant or revocation.",
      "No fake committee chair, E-Board, or President/VP promotion.",
      "No fake staff/admin escalation or coach assignment from roster preview.",
      "No self-granted workspace access from preview role switching.",
    ],
    plainEnglishRule:
      "Role changes must remain an explicit authority lane with auditable intent. Committee, leader, staff, and admin scope must not be inferred from browser preview toggles or local session tricks.",
    sourceOfTruth: [
      "src/services/role-access-invariants.ts",
      "src/services/workspace-access.ts",
      "src/services/auth-onboarding-workspace.ts",
    ],
  },
  {
    key: "staff_admin_preview_access_boundary",
    label: "Staff/admin roster review versus roster mutation",
    route: "/admin",
    status: "read_only_preview",
    requiredTables: ["profiles", "memberships", "staff_role_assignments", "coach_chapter_assignments", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["coach", "admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake roster mutation from staff/admin preview access.",
      "No fake DS/admin role proof from preview access to member or leader shells.",
      "No fake write authority from coach/staff/admin read-model access.",
      "No hidden membership, role, or coach assignment write from read-only inspection routes.",
    ],
    plainEnglishRule:
      "Staff and admin can inspect roster and role posture, but preview access must stay read-only unless a separate real role and reviewed write lane grants authority.",
    sourceOfTruth: [
      "src/services/role-access-invariants.ts",
      "src/services/workspace-access.ts",
      "src/services/admin-management-data.ts",
    ],
  },
  {
    key: "welcome_contact_and_crm_side_effects",
    label: "Welcome, onboarding, contact, and CRM side effects",
    route: "/chapter/members",
    status: "blocked_pending_future_lane",
    requiredTables: ["memberships", "integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: [membershipApprovalFlagKey, "hubspot_write"],
    allowedActors: ["chapter_leader", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake welcome email or reminder send.",
      "No fake onboarding/contact side effect from roster approval.",
      "No fake HubSpot/contact sync.",
      "No fake provider-ready claim from disabled outbox rows.",
    ],
    plainEnglishRule:
      "Membership and roster review may preview future welcome and CRM posture, but external sends and contact sync remain blocked until separate approved provider lanes exist.",
    sourceOfTruth: [
      "src/services/membership-approval-write-readiness.ts",
      "src/services/notifications-communications-send-safety.ts",
      "src/services/admin-rollout-controls-registry.ts",
    ],
  },
  {
    key: "derived_assignment_points_proof_authority",
    label: "Assignment, points, and proof authority derived from roster changes",
    route: "/leader?view=overview",
    status: "blocked_pending_future_lane",
    requiredTables: ["memberships", "assignments", "points_events", "evidence_items", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake assignment or task authority from roster preview.",
      "No fake points movement from role-change or membership-change rehearsal.",
      "No fake proof ownership or review authority from preview-only role changes.",
      "No fake event, assignment, points, or proof truth derived from mock roster rows.",
    ],
    plainEnglishRule:
      "Roster and role posture can inform who should later own assignments, points, or proof, but membership rehearsal must not silently create downstream authority or operational truth.",
    sourceOfTruth: [
      "src/services/assignment-action-board-safety-contract.ts",
      "src/services/points-leaderboard-award-safety-contract.ts",
      "src/services/proof-ugc-consent-storage-safety-contract.ts",
    ],
  },
  {
    key: "production_proof_and_rollout_evidence",
    label: "Production signed-in proof, live counts, pilot proof, and invite-gate boundary",
    route: "/admin/launch-gate",
    status: "blocked_pending_future_lane",
    requiredTables: ["memberships", "signed_in_route_proof", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No Test/Figma/sandbox/mock/staging/sample roster row counts as production signed-in proof.",
      "No preview-cookie or local role-switching artifact counts as rollout packet evidence or live counts.",
      "No roster or role rehearsal row counts as pilot proof or invite-gate evidence.",
      "No local preview role switching counts as final rollout approval.",
    ],
    plainEnglishRule:
      "Roster and role rehearsal can improve local confidence only. It must stay excluded from production signed-in proof, rollout packet evidence, live counts, pilot proof, and final invite-gate decisions.",
    sourceOfTruth: [
      "src/services/production-signed-in-route-proof-readiness.ts",
      "src/services/production-signed-in-route-proof-import.ts",
      "src/services/local-vs-production-role-proof-separation.ts",
    ],
  },
] as const satisfies readonly MembershipRosterRoleChangeSafetyLane[];

function getMembershipApprovalFlagSummary() {
  const definition = getFeatureFlagDefinition(membershipApprovalFlagKey);

  if (!definition) {
    throw new Error(`Missing ${membershipApprovalFlagKey} rollout control definition.`);
  }

  if (
    definition.approvalPolicy !== "production_confirmation" ||
    definition.defaultEnabledByEnvironment.local ||
    definition.defaultEnabledByEnvironment.staging ||
    definition.defaultEnabledByEnvironment.production
  ) {
    throw new Error(
      `${membershipApprovalFlagKey} rollout control drifted away from the expected disabled-by-default posture.`,
    );
  }

  return {
    key: definition.key,
    label: definition.label,
  };
}

function getHubspotWriteFlagSummary() {
  const definition = getFeatureFlagDefinition("hubspot_write");

  if (!definition) {
    throw new Error("Missing hubspot_write rollout control definition.");
  }

  if (
    definition.approvalPolicy !== "production_blocked" ||
    definition.defaultEnabledByEnvironment.local ||
    definition.defaultEnabledByEnvironment.staging ||
    definition.defaultEnabledByEnvironment.production
  ) {
    throw new Error("hubspot_write rollout control drifted away from the blocked default.");
  }

  return {
    key: definition.key,
    label: definition.label,
  };
}

export function getMembershipRosterRoleChangeSafetyContract(): MembershipRosterRoleChangeSafetyContract {
  const data = getMockReadOnlyAppData(
    "Mock-safe roster safety contract review uses local read-only app data only.",
  );
  const leaderActor = getMockLocalActorContext("leader.a@mymedlife.test");
  const coachActor = getMockLocalActorContext("coach@mymedlife.test");
  const membershipWorkspace = getChapterMembershipWorkspace(leaderActor, data);
  const coachWorkspace = getChapterMembershipWorkspace(coachActor, data);
  const membershipWriteConfig = getMembershipApprovalWriteConfig();
  const roleAccessInvariants = getRoleAccessInvariantsReport();
  const membershipApprovalFlag = getMembershipApprovalFlagSummary();
  const hubspotWriteFlag = getHubspotWriteFlagSummary();
  const blockedSignedInSources = getBlockedProductionSignedInProofSourceMarkers();
  const dsAdminWorkspaces = getAllowedWorkspaces({
    staffRoles: ["DS Admin"],
  });
  const superAdminWorkspaces = getAllowedWorkspaces({
    staffRoles: ["Super Admin"],
  });

  const validationChecks = [
    {
      key: "membership_approval_flag_stays_disabled_by_default",
      passed: membershipApprovalFlag.key === membershipApprovalFlagKey,
      message:
        membershipApprovalFlag.key === membershipApprovalFlagKey
          ? "Membership approval rollout control exists and stays disabled by default."
          : "Membership approval rollout control is missing or renamed.",
    },
    {
      key: "chapter_membership_workspace_stays_read_only",
      passed:
        membershipWorkspace.canReadWorkspace &&
        membershipWorkspace.counts.enabledControls === 0 &&
        membershipWorkspace.membershipApprovalPacket?.writeReadiness.canSubmit === false,
      message:
        membershipWorkspace.canReadWorkspace &&
        membershipWorkspace.counts.enabledControls === 0 &&
        membershipWorkspace.membershipApprovalPacket?.writeReadiness.canSubmit === false
          ? "Chapter membership workspace remains read-only by default and does not auto-open roster writes."
          : "Chapter membership workspace drifted away from read-only default posture.",
    },
    {
      key: "coach_preview_stays_non_approval",
      passed:
        coachWorkspace.canReadWorkspace &&
        coachWorkspace.membershipApprovalPacket === null &&
        coachWorkspace.summary.includes("without owning membership approvals"),
      message:
        coachWorkspace.canReadWorkspace &&
        coachWorkspace.membershipApprovalPacket === null &&
        coachWorkspace.summary.includes("without owning membership approvals")
          ? "Coach roster access stays review-only and does not own membership approvals."
          : "Coach roster access now implies membership approval ownership.",
    },
    {
      key: "membership_write_config_keeps_external_sends_off",
      passed:
        membershipWriteConfig.externalWritesEnabled === false &&
        membershipWriteConfig.sendsWelcome === false &&
        membershipWriteConfig.syncsCrm === false,
      message:
        membershipWriteConfig.externalWritesEnabled === false &&
        membershipWriteConfig.sendsWelcome === false &&
        membershipWriteConfig.syncsCrm === false
          ? "Membership approval readiness still keeps welcome sends and CRM sync disabled."
          : "Membership approval readiness drifted into external send or CRM side effects.",
    },
    {
      key: "role_access_invariants_stay_aligned",
      passed: roleAccessInvariants.validation.ready,
      message:
        roleAccessInvariants.validation.ready
          ? "Role access invariants still separate member, leader, staff/support, and DS/admin proof classes."
          : "Role access invariants no longer cleanly separate the required role boundaries.",
    },
    {
      key: "ds_admin_preview_is_not_owned_member_or_leader_access",
      passed:
        dsAdminWorkspaces.some((workspace) => workspace.key === "admin_backend" && workspace.mode === "owner") &&
        dsAdminWorkspaces.some((workspace) => workspace.key === "student_app" && workspace.mode === "preview") &&
        dsAdminWorkspaces.some((workspace) => workspace.key === "leader_command_center" && workspace.mode === "preview") &&
        !dsAdminWorkspaces.some((workspace) => workspace.key === "staff_command_center" && workspace.mode === "owner"),
      message:
        dsAdminWorkspaces.some((workspace) => workspace.key === "admin_backend" && workspace.mode === "owner") &&
        dsAdminWorkspaces.some((workspace) => workspace.key === "student_app" && workspace.mode === "preview") &&
        dsAdminWorkspaces.some((workspace) => workspace.key === "leader_command_center" && workspace.mode === "preview") &&
        !dsAdminWorkspaces.some((workspace) => workspace.key === "staff_command_center" && workspace.mode === "owner")
          ? "DS/admin preview access stays read-only for student and leader shells and does not become staff proof."
          : "DS/admin preview access drifted away from the expected preview-only boundary.",
    },
    {
      key: "super_admin_access_stays_non_production_proof_substitute",
      passed:
        superAdminWorkspaces.some((workspace) => workspace.key === "admin_backend" && workspace.mode === "owner") &&
        superAdminWorkspaces.some((workspace) => workspace.key === "staff_command_center" && workspace.mode === "owner"),
      message:
        superAdminWorkspaces.some((workspace) => workspace.key === "admin_backend" && workspace.mode === "owner") &&
        superAdminWorkspaces.some((workspace) => workspace.key === "staff_command_center" && workspace.mode === "owner")
          ? "Super Admin keeps owned support/admin workspaces, but still does not replace real member or leader production proof."
          : "Super Admin workspace posture drifted away from the expected support/admin boundary.",
    },
    {
      key: "signed_in_proof_import_blocks_local_and_test_markers",
      passed:
        blockedSignedInSources.includes("local sandbox") &&
        blockedSignedInSources.includes("figma_seed") &&
        blockedSignedInSources.includes("staging.mymedlife.org"),
      message:
        blockedSignedInSources.includes("local sandbox") &&
        blockedSignedInSources.includes("figma_seed") &&
        blockedSignedInSources.includes("staging.mymedlife.org")
          ? "Signed-in proof import still rejects local, figma_seed, and staging markers for roster/role evidence."
          : "Signed-in proof import no longer blocks one or more roster/role rehearsal markers.",
    },
    {
      key: "hubspot_writes_stay_blocked",
      passed: hubspotWriteFlag.key === "hubspot_write",
      message:
        hubspotWriteFlag.key === "hubspot_write"
          ? "HubSpot/contact sync remains production-blocked."
          : "HubSpot/contact sync control is missing or drifted.",
    },
  ];

  return {
    title: "Membership / roster / role-change safety contract: READ-ONLY readiness spec",
    summary: [
      "This contract is read-only. It does not create or remove roster rows, approve membership, change roles, escalate access, create invites or users, sync CRM data, or create production proof.",
      "Current source supports roster review, role-scope inspection, membership approval rehearsal packets, and proof-separation guardrails only.",
      "Membership, roster, and role-looking controls must stay clearly separate from production signed-in proof, rollout evidence, live counts, pilot proof, and invite-gate truth until approved authority, audit, and readback lanes exist.",
    ],
    currentWritePath: {
      exists: false,
      reason:
        "No reviewed production roster or role-change write boundary exists yet for membership approval, role escalation, committee moves, deactivation, or downstream welcome/CRM side effects.",
      blockedUntil: [
        "A dedicated audited membership and role-change server boundary exists with explicit reviewer authority and rollback posture.",
        "Roster creation/removal, role-change, and deactivation rules are covered by local and hosted RLS/readback tests.",
        "Welcome, onboarding, contact, and CRM side effects stay blocked until separate provider lanes are approved.",
        "Production proof collection has real production rows and stays separate from local/Test/Figma/sandbox rehearsal outputs.",
      ],
    },
    adjacentGuardrails: [
      {
        lane: "Membership approval write readiness",
        route: "/chapter/members",
        currentPosture:
          "Future membership approval is modeled and fail-closed, with external sends and CRM sync disabled by default.",
      },
      {
        lane: "Role access invariants",
        route: "/login",
        currentPosture:
          "Member, leader, staff/support, and DS/admin route ownership stays separated, and preview access does not substitute for production proof.",
      },
      {
        lane: "Member profile and identity privacy boundary",
        route: "/profile",
        currentPosture:
          "Profile identity can explain membership scope, but profile surfaces do not own roster truth or role mutation authority.",
      },
    ],
    globalGuards: [
      "Local preview role switching stays rehearsal-only and must not count as production signed-in role proof.",
      "Test/Figma/sandbox/mock/staging/sample roster rows do not count as rollout packet evidence, live counts, pilot proof, or invite-gate evidence.",
      "Staff/admin preview access remains read-only unless a separate real role and reviewed write lane grants authority.",
      "Role changes require approved admin/staff authority plus auditable intent; browser preview toggles and local session tricks do not grant that authority.",
      "This lane does not introduce profile, contact, emergency, traveler, or other personal-data writes.",
    ],
    requiredFoundations: [
      "A dedicated membership and role-change server boundary with approved actor authority and rollback ownership.",
      "Audit/readback proof for membership approval, rejection, promotion, demotion, committee moves, and deactivation.",
      "A separate signed-in proof lane using real production users and rows, not local/Test rehearsal.",
      "Provider boundaries for welcome/contact/CRM side effects that remain off by default until explicitly approved.",
      "Operator evidence that roster rehearsal stays excluded from rollout packet, live-count, pilot-proof, and invite-gate decisions.",
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
    "Current write path:",
    `- exists: ${String(contract.currentWritePath.exists)}`,
    `- reason: ${contract.currentWritePath.reason}`,
    "- blocked until:",
    ...formatNestedList(contract.currentWritePath.blockedUntil),
    "",
    "Adjacent guardrails:",
    ...contract.adjacentGuardrails.flatMap((guardrail) => [
      `- ${guardrail.lane}`,
      `  - route: ${guardrail.route}`,
      `  - posture: ${guardrail.currentPosture}`,
    ]),
    "",
    "Lanes:",
    ...contract.lanes.flatMap((lane) => [
      `- ${lane.label}`,
      `  - status: ${lane.status}`,
      `  - route: ${lane.route}`,
      `  - allowed actors: ${lane.allowedActors.join(", ")}`,
      `  - required flags: ${lane.requiredFlags.length > 0 ? lane.requiredFlags.join(", ") : "none"}`,
      `  - required tables: ${lane.requiredTables.join(", ")}`,
      `  - rule: ${lane.plainEnglishRule}`,
      "  - forbidden side effects:",
      ...formatNestedList(lane.forbiddenSideEffects),
      "  - source of truth:",
      ...formatNestedList(lane.sourceOfTruth),
    ]),
    "",
    "Global guards:",
    ...formatList(contract.globalGuards),
    "",
    "Required foundations:",
    ...formatList(contract.requiredFoundations),
    "",
    "Validation:",
    ...contract.validation.checks.map((check) => {
      return `- ${check.passed ? "PASS" : "FAIL"} ${check.key}: ${check.message}`;
    }),
  ].join("\n");
}

function formatList(items: readonly string[]) {
  return items.map((item) => `- ${item}`);
}

function formatNestedList(items: readonly string[]) {
  return items.map((item) => `    - ${item}`);
}
