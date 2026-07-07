import { getAppRouteRegistry } from "@/services/app-route-registry";
import {
  getAssignmentActionBoardSafetyContract,
} from "@/services/assignment-action-board-safety-contract";
import {
  getCanonicalRoleAssignments,
  getCanonicalScopes,
} from "@/services/canonical-role-scope";
import {
  getChapterMemberRoleFocus,
} from "@/services/chapter-member-role-focus";
import {
  getChapterMembershipWorkspace,
} from "@/services/chapter-membership-workspace";
import {
  getLeadershipTransitionCampaignPlan,
} from "@/services/leadership-transition-campaign";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getMembershipApprovalWriteConfig,
} from "@/services/membership-approval-write-readiness";
import {
  getLaunchLaneAttendancePointsValue,
} from "@/services/launch-lane-points-policy";
import {
  getRoleAccessInvariantsReport,
} from "@/services/role-access-invariants";

type EnvSource = Record<string, string | undefined>;

export type ActionCommitteeLeadershipSafetyLane = {
  key:
    | "chapter_membership_review"
    | "committee_role_focus"
    | "assignment_task_authority"
    | "points_authority"
    | "membership_approval_write"
    | "promotion_and_succession"
    | "chapter_leadership_transfer"
    | "provider_outbox_and_notifications"
    | "production_rollout_evidence";
  label: string;
  route: string;
  status:
    | "read_only_preview"
    | "implemented_local_only"
    | "implemented_hosted_staging_only"
    | "blocked_pending_future_lane";
  roleScope: readonly string[];
  requiredTables: readonly string[];
  requiredFlags: readonly string[];
  forbiddenSideEffects: readonly string[];
  plainEnglishRule: string;
  sourceOfTruth: readonly string[];
};

export type ActionCommitteeLeadershipRoleSafetyContract = {
  title: string;
  summary: readonly string[];
  currentReviewedWritePaths: readonly {
    route: string;
    localFunction: string;
    requiredFlags: readonly string[];
    enabledModes: readonly string[];
    blockedSideEffects: readonly string[];
    reason: string;
  }[];
  globalGuards: readonly string[];
  requiredFoundations: readonly string[];
  lanes: readonly ActionCommitteeLeadershipSafetyLane[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

const membershipApprovalLocalFlags = [
  "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE=true",
] as const;

const membershipApprovalHostedFlags = [
  "MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE=true",
] as const;

const assignmentCreateFlags = [
  "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE=true",
] as const;

const lanes = [
  {
    key: "chapter_membership_review",
    label: "Chapter roster, committee lane, and role coverage review",
    route: "/chapter/members",
    status: "read_only_preview",
    roleScope: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    requiredTables: ["memberships", "profiles", "assignments", "evidence_items"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No fake committee move write.",
      "No fake role assignment write.",
      "No fake member deactivation.",
      "No production roster truth claim from mock committee rows.",
    ],
    plainEnglishRule:
      "Roster and committee-lane review can stay visible for chapter planning, but it must not change membership, role, or committee truth without the approved write path.",
    sourceOfTruth: [
      "src/services/chapter-membership-workspace.ts",
      "src/services/chapter-member-role-focus.ts",
    ],
  },
  {
    key: "committee_role_focus",
    label: "Action committee and leader role focus guidance",
    route: "/action-committees",
    status: "read_only_preview",
    roleScope: ["chapter_leader", "coach", "admin", "super_admin"],
    requiredTables: ["memberships", "assignments", "evidence_items"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No fake chair promotion.",
      "No fake committee capacity save.",
      "No fake succession acceptance.",
      "No hidden permission expansion from role guidance copy.",
    ],
    plainEnglishRule:
      "Committee and chapter-leadership guidance can point reviewers to coverage gaps and owner lanes, but it is still guidance, not a live promotion or scope-change tool.",
    sourceOfTruth: [
      "src/services/chapter-member-role-focus.ts",
      "src/services/role-next-actions.ts",
      "src/services/canonical-role-scope.ts",
    ],
  },
  {
    key: "assignment_task_authority",
    label: "Action-board task authority",
    route: "/rush-month/actions",
    status: "read_only_preview",
    roleScope: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    requiredTables: ["assignments", "audit_logs", "automation_outbox"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No fake task authority expansion from committee labels alone.",
      "No fake ownership transfer.",
      "No fake reminder delivery.",
      "No fake production proof from preview action boards.",
    ],
    plainEnglishRule:
      "Committee and leader roles can see assigned work according to current read boundaries, but task ownership and follow-up remain read-only until the approved write path is explicitly used.",
    sourceOfTruth: [
      "src/services/assignment-action-board-safety-contract.ts",
      "src/services/role-visibility.ts",
    ],
  },
  {
    key: "points_authority",
    label: "Committee and leadership points authority",
    route: "/app/points",
    status: "blocked_pending_future_lane",
    roleScope: ["chapter_member", "chapter_leader", "super_admin"],
    requiredTables: ["points_events", "kpi_events", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No fake points award from committee membership.",
      "No fake leaderboard movement from chair or president labels.",
      "No browser-only points mutation.",
      "No fake chapter recognition proof from mock points rows.",
    ],
    plainEnglishRule:
      "The launch-lane points model can stay visible, but committee or chapter role labels must not become a shortcut to real points authority.",
    sourceOfTruth: [
      "src/services/launch-lane-points-policy.ts",
      "src/services/assignment-action-board-safety-contract.ts",
    ],
  },
  {
    key: "membership_approval_write",
    label: "Membership approval write boundary",
    route: "/chapter/members",
    status: "implemented_hosted_staging_only",
    roleScope: ["chapter_leader", "admin", "super_admin"],
    requiredTables: ["memberships", "events", "integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: membershipApprovalHostedFlags,
    forbiddenSideEffects: [
      "No welcome send.",
      "No CRM sync.",
      "No committee promotion beyond requested chapter role.",
      "No fake production proof from staging rehearsal.",
    ],
    plainEnglishRule:
      "Membership approval is the reviewed write lane for chapter access, but it still keeps outbound effects off and does not imply chair promotion, succession persistence, or production launch truth.",
    sourceOfTruth: [
      "src/services/membership-approval-write-readiness.ts",
      "src/services/chapter-membership-workspace.ts",
    ],
  },
  {
    key: "promotion_and_succession",
    label: "Chair, president, and succession planning",
    route: "/campaigns/leadership-transition",
    status: "blocked_pending_future_lane",
    roleScope: ["chapter_leader", "coach", "admin", "super_admin"],
    requiredTables: ["leadership_transitions", "memberships", "audit_logs", "automation_outbox"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No fake chair promotion write.",
      "No fake president/VP succession save.",
      "No fake role-note persistence.",
      "No fake transition notification or approval send.",
    ],
    plainEnglishRule:
      "Leadership Transition is currently a planning surface. It can structure successor review, but it must not mutate chapter leadership or committee ownership.",
    sourceOfTruth: [
      "src/services/leadership-transition-campaign.ts",
      "src/services/canonical-role-scope.ts",
    ],
  },
  {
    key: "chapter_leadership_transfer",
    label: "Chapter leadership transfer and scope changes",
    route: "/admin/users",
    status: "blocked_pending_future_lane",
    roleScope: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["profiles", "memberships", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No fake chapter leadership transfer.",
      "No fake committee chair reassignment by admin review alone.",
      "No hidden workspace expansion without audited readback.",
      "No owner-packet truth claim from local actor fixtures.",
    ],
    plainEnglishRule:
      "Role scope changes that would alter chapter leadership need a dedicated audited path; current review surfaces can describe the need without performing the transfer.",
    sourceOfTruth: [
      "src/services/role-access-invariants.ts",
      "src/services/canonical-role-scope.ts",
      "src/services/workspace-access.ts",
    ],
  },
  {
    key: "provider_outbox_and_notifications",
    label: "Provider, outbox, and committee follow-up delivery",
    route: "/leader?view=overview",
    status: "blocked_pending_future_lane",
    roleScope: ["chapter_leader", "coach", "admin", "super_admin"],
    requiredTables: ["automation_outbox", "integration_events", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No reminder email or SMS.",
      "No provider or HubSpot send.",
      "No n8n execution.",
      "No fake succession or committee follow-up proof from preview copy.",
    ],
    plainEnglishRule:
      "Follow-up language can stay visible, but no committee or leadership role can trigger delivery or external automation from this lane.",
    sourceOfTruth: [
      "src/services/assignment-action-board-safety-contract.ts",
      "src/services/role-next-actions.ts",
    ],
  },
  {
    key: "production_rollout_evidence",
    label: "Production proof and rollout evidence posture",
    route: "/chapter/members",
    status: "blocked_pending_future_lane",
    roleScope: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["profiles", "memberships", "staff_role_assignments", "coach_assignments", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No Test/Figma/sandbox/mock committee row counts as production proof.",
      "No localhost or staging membership-approval screenshot counts as rollout evidence.",
      "No mock chair or president coverage counts as owner-packet truth.",
    ],
    plainEnglishRule:
      "Local and staging committee/leadership review is useful for readiness, but it cannot substitute for real production role rows, owner approvals, or rollout evidence.",
    sourceOfTruth: [
      "src/services/role-access-invariants.ts",
      "src/services/local-vs-production-role-proof-separation.ts",
    ],
  },
] as const satisfies readonly ActionCommitteeLeadershipSafetyLane[];

export function getActionCommitteeLeadershipRoleSafetyContract(
  env: EnvSource = process.env,
): ActionCommitteeLeadershipRoleSafetyContract {
  const leaderActor = getMockLocalActorContext("leader.a@mymedlife.test");
  const adminActor = getMockLocalActorContext("admin@mymedlife.test");
  const data = getMockReadOnlyAppData(
    "Action committee leadership safety contract.",
  );

  const membershipWorkspace = getChapterMembershipWorkspace(leaderActor, data);
  const roleFocus = getChapterMemberRoleFocus(leaderActor, membershipWorkspace);
  const roleReport = getRoleAccessInvariantsReport();
  const assignmentContract = getAssignmentActionBoardSafetyContract(env);
  const transitionPlan = getLeadershipTransitionCampaignPlan(leaderActor);
  const registry = new Set(getAppRouteRegistry().map((route) => route.href));

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

  const canonicalCommitteeAssignments = getCanonicalRoleAssignments({
    audience: "chapter_leader",
    chapterRoles: ["Action Committee Chair", "President / VP"],
  });
  const actionCommitteeMemberAssignments = getCanonicalRoleAssignments({
    audience: "chapter_member",
    chapterRoles: ["Action Committee Member"],
  });

  const validationChecks = [
    {
      key: "canonical_committee_scope_split",
      passed:
        getCanonicalScopes(canonicalCommitteeAssignments).includes("committee") &&
        getCanonicalScopes(canonicalCommitteeAssignments).includes("chapter") &&
        getCanonicalScopes(actionCommitteeMemberAssignments).includes("committee"),
      message:
        "Canonical role mapping still separates committee-scoped and chapter-scoped leadership authority.",
    },
    {
      key: "membership_workspace_stays_read_only",
      passed:
        membershipWorkspace.counts.enabledControls === 0 &&
        membershipWorkspace.disabledControls.some((control) => control.key === "move_committee_lane") &&
        membershipWorkspace.disabledControls.some((control) => control.key === "assign_chapter_role"),
      message:
        "The roster workspace still exposes committee and role review while keeping mutation controls disabled.",
    },
    {
      key: "leader_role_focus_names_locked_controls",
      passed:
        roleFocus.canReadFocus &&
        roleFocus.safetyNote.includes("disabled") &&
        roleFocus.safetyNote.includes("committee moves"),
      message:
        "Leader role focus still reminds reviewers that committee moves and permission-changing controls remain disabled.",
    },
    {
      key: "assignment_authority_contract_ready",
      passed:
        assignmentContract.validation.ready &&
        assignmentContract.lanes.find((lane) => lane.key === "local_assignment_create")
          ?.status === "implemented_local_only" &&
        assignmentContract.lanes.find((lane) => lane.key === "points_awards")
          ?.status === "blocked_pending_future_lane",
      message:
        "Assignment authority remains narrow: local-only create exists, while task-linked points authority stays blocked.",
    },
    {
      key: "membership_approval_has_guarded_local_and_staging_modes",
      passed:
        localMembershipConfig.enabled &&
        localMembershipConfig.isLocalOnly &&
        stagingMembershipConfig.enabled &&
        stagingMembershipConfig.isHostedStaging &&
        !localMembershipConfig.externalWritesEnabled &&
        !stagingMembershipConfig.externalWritesEnabled &&
        !stagingMembershipConfig.sendsWelcome &&
        !stagingMembershipConfig.syncsCrm,
      message:
        "Membership approval remains the reviewed access-write lane, with localhost and hosted staging modes guarded and outbound side effects disabled.",
    },
    {
      key: "role_access_invariants_hold",
      passed: roleReport.validation.ready,
      message:
        "Workspace ownership and preview boundaries still protect members, leaders, staff, and admins from accidental role-scope drift.",
    },
    {
      key: "leadership_transition_stays_planning_only",
      passed:
        transitionPlan.canReadPlan &&
        transitionPlan.browserWritesExpected === 0 &&
        transitionPlan.externalWritesExpected === 0 &&
        transitionPlan.safetyReminders.some((item) => item.includes("does not change roles")),
      message:
        "Leadership Transition remains a planning surface and not a role-mutation or notification workflow.",
    },
    {
      key: "core_routes_present",
      passed: ["/chapter/members", "/action-committees", "/rush-month/actions", "/app/points"].every(
        (route) => registry.has(route),
      ),
      message:
        "The core committee, roster, action-board, and points routes referenced by this contract still exist in the route registry.",
    },
    {
      key: "admin_actor_can_review_without_owning_member_truth",
      passed:
        getRoleAccessInvariantsReport().cases.some(
          (item) =>
            item.key === "ds_admin_only" &&
            item.previewWritesBlocked &&
            item.ownerWorkspaces.includes("admin_backend"),
        ) &&
        adminActor.audience === "admin",
      message:
        "Admin review remains distinct from member/leader production proof and does not silently inherit committee ownership truth.",
    },
    {
      key: "attendance_points_value_stays_policy_only",
      passed: getLaunchLaneAttendancePointsValue() === 20,
      message:
        "The current attendance points value remains policy/readback only; committee or leadership roles do not gain direct points-award authority from this contract.",
    },
  ];

  return {
    title: "Action committee / chapter leadership role-scope safety contract: READ-ONLY readiness spec",
    summary: [
      "This contract is read-only. It does not create production users, change committee membership, promote chairs or presidents, persist succession plans, or award points.",
      "Current source supports strong read-only role modeling, one reviewed membership-approval write lane, and one narrow localhost-only assignment-create lane.",
      "Everything that looks like committee promotion, succession, leadership transfer, expanded task authority, points authority, or rollout proof must stay clearly separate from Test/Figma/mock review data.",
    ],
    currentReviewedWritePaths: [
      {
        route: "/chapter/members",
        localFunction: "app.approve_chapter_membership",
        requiredFlags: membershipApprovalLocalFlags,
        enabledModes: ["localhost", "hosted staging"],
        blockedSideEffects: ["welcome sends disabled", "CRM sync disabled", "external writes disabled"],
        reason: stagingMembershipConfig.reason,
      },
      {
        route: "/admin/assignment-write",
        localFunction: "app.create_chapter_assignment",
        requiredFlags: assignmentCreateFlags,
        enabledModes: ["localhost"],
        blockedSideEffects: ["provider sends disabled", "reminders disabled", "points awards disabled"],
        reason: assignmentContract.currentLocalWritePath.localFunction,
      },
    ],
    globalGuards: [
      "Test/Figma/sandbox/mock committee rows, localhost packets, and staging rehearsals do not count as production proof or rollout evidence.",
      "Committee labels, chair titles, and chapter-leadership planning copy must not silently grant task authority, points authority, or ownership-transfer power.",
      "Promotion, succession, committee moves, and leadership transfer remain separate from membership approval unless a later audited path is explicitly approved.",
      "Provider sends, outbox writes, and external automation remain blocked from this lane.",
    ],
    requiredFoundations: [
      "A dedicated audited write path for committee-lane moves, chair promotion, and chapter-leadership succession if product wants them to become live.",
      "A reviewed authority model that distinguishes member, committee chair, E-Board, and President / VP powers over tasks, points, and roster truth.",
      "A durable audit and rollback model for any future succession-plan persistence or chapter-leadership transfer.",
      "Real production role rows, approved owner data, and explicit rollout evidence before any committee or leadership state can count toward production proof.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatActionCommitteeLeadershipRoleSafetyContract(
  contract: ActionCommitteeLeadershipRoleSafetyContract = getActionCommitteeLeadershipRoleSafetyContract(),
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
      `  - role scope: ${lane.roleScope.join(", ")}`,
      "  - forbidden side effects:",
      ...formatNestedList(lane.forbiddenSideEffects),
      `  - rule: ${lane.plainEnglishRule}`,
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

function formatList(items: readonly string[]): string[] {
  return items.map((item) => `- ${item}`);
}

function formatNestedList(items: readonly string[]): string[] {
  return items.map((item) => `  - ${item}`);
}
