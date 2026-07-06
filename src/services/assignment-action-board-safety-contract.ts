import { getAssignmentCreateWriteConfig } from "@/services/assignment-create-write";
import { getWritePlanOperation } from "@/services/write-plan-matrix";

type EnvSource = Record<string, string | undefined>;

export type AssignmentActionBoardContractLane = {
  key:
    | "member_action_board"
    | "leader_follow_up_board"
    | "local_assignment_create"
    | "notification_delivery"
    | "ownership_transfer"
    | "points_awards"
    | "production_proof";
  label: string;
  route: string;
  status:
    | "read_only_preview"
    | "implemented_local_only"
    | "blocked_pending_future_lane";
  requiredTables: readonly string[];
  allowedActors: readonly string[];
  blockedActors: readonly string[];
  requiredFlags: readonly string[];
  forbiddenSideEffects: readonly string[];
  plainEnglishRule: string;
};

export type AssignmentActionBoardSafetyContract = {
  title: string;
  summary: readonly string[];
  currentLocalWritePath: {
    route: "/admin/assignment-write";
    localFunction: "app.create_chapter_assignment";
    localServerAction: "createLeaderAssignmentAction";
    requiredFlags: readonly string[];
    futureTables: readonly string[];
  };
  globalGuards: readonly string[];
  lanes: readonly AssignmentActionBoardContractLane[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

const localRequiredFlags = [
  "MYMEDLIFE_AUTH_MODE=local_supabase",
  "NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key",
  "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE=true",
] as const;

const actionAssignedWritePlan = getWritePlanOperation("action_assigned");

const lanes = [
  {
    key: "member_action_board",
    label: "Member assigned-actions board",
    route: "/rush-month/actions",
    status: "read_only_preview",
    requiredTables: ["assignments"],
    allowedActors: ["chapter_member", "chapter_leader"],
    blockedActors: ["coach", "admin", "ds_admin"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No assignment row create from the member board.",
      "No reminder or notification delivery.",
      "No points or KPI write from board navigation alone.",
      "No automation_outbox or provider send from opening the route.",
    ],
    plainEnglishRule:
      "Members can read assigned action truth and open detail routes, but the board itself must not create tasks, transfer ownership, or imply production proof.",
  },
  {
    key: "leader_follow_up_board",
    label: "Leader/staff follow-up board",
    route: "/rush-month/actions",
    status: "read_only_preview",
    requiredTables: ["assignments"],
    allowedActors: ["chapter_leader", "coach", "admin", "super_admin"],
    blockedActors: ["chapter_member", "ds_admin"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No reminder send.",
      "No notification center delivery.",
      "No reassignment or owner transfer.",
      "No browser write from follow-up review alone.",
    ],
    plainEnglishRule:
      "Leader and HQ follow-up can stay visible as read-only task posture, but nudges, reminders, and ownership changes remain blocked until a future approved write lane exists.",
  },
  {
    key: "local_assignment_create",
    label: "Local leader assignment creation",
    route: "/admin/assignment-write",
    status: "implemented_local_only",
    requiredTables: actionAssignedWritePlan.futureTables,
    allowedActors: actionAssignedWritePlan.allowedActors,
    blockedActors: actionAssignedWritePlan.blockedActors,
    requiredFlags: localRequiredFlags,
    forbiddenSideEffects: [
      "No live reminder delivery.",
      "No provider send, email, SMS, HubSpot, or n8n send.",
      "No production or staging browser write.",
      "No points award from assignment creation alone.",
    ],
    plainEnglishRule:
      "The only reviewed task-create write path is the localhost-only leader assignment packet and server action. It stays gated behind local auth plus explicit local write flags.",
  },
  {
    key: "notification_delivery",
    label: "Task reminders and notifications",
    route: "/leader",
    status: "blocked_pending_future_lane",
    requiredTables: ["automation_outbox"],
    allowedActors: [],
    blockedActors: ["chapter_member", "chapter_leader", "coach", "admin", "ds_admin", "super_admin"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No reminder email.",
      "No SMS or push notification.",
      "No HubSpot task or note send.",
      "No n8n workflow send.",
    ],
    plainEnglishRule:
      "Task reminder and notification delivery remains blocked even when local assignment creation is approved; disabled outbox posture is evidence of a stop, not permission to send.",
  },
  {
    key: "ownership_transfer",
    label: "Staff/leader ownership transfer",
    route: "/staff",
    status: "blocked_pending_future_lane",
    requiredTables: ["assignments"],
    allowedActors: [],
    blockedActors: ["chapter_member", "chapter_leader", "coach", "admin", "ds_admin", "super_admin"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No reassignment write.",
      "No owner-role transfer.",
      "No coach/staff takeover of student truth.",
      "No hidden browser mutation from preview controls.",
    ],
    plainEnglishRule:
      "Visible assignment or action-board controls must not imply that staff, coach, or leader ownership transfer is live until a separate reviewed schema, server boundary, and audit path exist.",
  },
  {
    key: "points_awards",
    label: "Task-linked points movement",
    route: "/app/points",
    status: "blocked_pending_future_lane",
    requiredTables: ["points_events", "kpi_events"],
    allowedActors: ["chapter_leader", "super_admin"],
    blockedActors: ["chapter_member", "coach", "admin", "ds_admin"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No points award on assignment creation.",
      "No KPI materialization from preview-only boards.",
      "No leaderboard movement from fake task controls.",
    ],
    plainEnglishRule:
      "Task creation and follow-up must stay separate from points and KPI movement until the later proof-decision lane is explicitly approved and evidenced.",
  },
  {
    key: "production_proof",
    label: "Production proof posture",
    route: "/admin/assignment-write",
    status: "blocked_pending_future_lane",
    requiredTables: ["assignments", "events", "integration_events", "automation_outbox", "audit_logs"],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    blockedActors: ["chapter_member", "chapter_leader", "coach"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No Test/Figma/sandbox row counts as production proof.",
      "No localhost packet screenshot counts as rollout evidence.",
      "No local assignment create evidence counts as invite-gate proof.",
    ],
    plainEnglishRule:
      "Local assignment and action-board rehearsal stays useful for QA only. It must not be copied into production proof, rollout packet evidence, or invite-gate truth.",
  },
] as const satisfies readonly AssignmentActionBoardContractLane[];

export function getAssignmentActionBoardSafetyContract(
  env: EnvSource = process.env,
): AssignmentActionBoardSafetyContract {
  const localConfig = getAssignmentCreateWriteConfig({
    MYMEDLIFE_AUTH_MODE: "local_supabase",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
    ...env,
  });
  const stagedConfig = getAssignmentCreateWriteConfig({
    MYMEDLIFE_AUTH_MODE: "staging_supabase",
    NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "staging-publishable-key",
    NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
    ...env,
  });
  const productionConfig = getAssignmentCreateWriteConfig({
    MYMEDLIFE_AUTH_MODE: "production_supabase",
    NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
    NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
    ...env,
  });

  const validationChecks = [
    {
      key: "local_assignment_create_exists",
      passed: localConfig.enabled,
      message:
        "Localhost-only assignment creation can open only when local auth plus explicit write flags are present.",
    },
    {
      key: "hosted_staging_assignment_create_blocked",
      passed:
        !stagedConfig.enabled &&
        stagedConfig.reason.includes("Hosted staging"),
      message:
        "Hosted staging stays blocked even when assignment-create flags are flipped.",
    },
    {
      key: "hosted_production_assignment_create_blocked",
      passed:
        !productionConfig.enabled &&
        productionConfig.reason.includes("Hosted production"),
      message:
        "Hosted production stays blocked even when assignment-create flags are flipped.",
    },
    {
      key: "outbox_stays_disabled",
      passed:
        localConfig.enabled &&
        localConfig.remindersEnabled === false &&
        localConfig.externalWritesEnabled === false,
      message:
        "The reviewed local create lane still keeps reminders and external sends disabled.",
    },
    {
      key: "assignment_write_plan_limits_routine_roles",
      passed:
        actionAssignedWritePlan.allowedActors.includes("chapter_leader") &&
        actionAssignedWritePlan.allowedActors.includes("super_admin") &&
        actionAssignedWritePlan.blockedActors.includes("admin") &&
        actionAssignedWritePlan.blockedActors.includes("ds_admin") &&
        actionAssignedWritePlan.blockedActors.includes("coach"),
      message:
        "Assignment-create authority stays limited to chapter leaders and Super Admin in the current write plan.",
    },
  ];

  return {
    title: "Assignment / Action Board safety contract: READ-ONLY readiness spec",
    summary: [
      "Leader, staff, and admin shells already show task-like controls, but fake-live assignment behavior must stay blocked until each write lane is explicitly approved.",
      "The only reviewed task-create path today is the localhost-only leader assignment packet and server action backed by app.create_chapter_assignment.",
      "Member action boards and leader follow-up boards are allowed as read-only operating truth, not as live task mutation surfaces.",
      "Reminder delivery, notification sends, staff/coach ownership transfer, and task-linked points movement remain separate future lanes.",
      "No Test/Figma/sandbox/local assignment evidence counts as production proof, rollout evidence, or invite-gate proof.",
    ],
    currentLocalWritePath: {
      route: "/admin/assignment-write",
      localFunction: "app.create_chapter_assignment",
      localServerAction: "createLeaderAssignmentAction",
      requiredFlags: localRequiredFlags,
      futureTables: actionAssignedWritePlan.futureTables,
    },
    globalGuards: [
      "Do not create fake task rows outside the reviewed localhost-only assignment-create lane.",
      "Do not send fake reminders, notifications, HubSpot tasks, n8n packets, SMS, email, or push notices.",
      "Do not imply fake staff/leader ownership transfer, reassignment, or chapter takeover from preview controls.",
      "Do not award fake points, KPI movement, or leaderboard credit from task creation or action-board browsing.",
      "Do not treat local/Test/Figma/sandbox action-board evidence as production proof.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatAssignmentActionBoardSafetyContract(
  contract: AssignmentActionBoardSafetyContract = getAssignmentActionBoardSafetyContract(),
): string {
  return [
    contract.title,
    "",
    "Summary:",
    ...contract.summary.map((item) => `- ${item}`),
    "",
    "Current local write path:",
    `- Route: ${contract.currentLocalWritePath.route}`,
    `- Local function: ${contract.currentLocalWritePath.localFunction}`,
    `- Local server action: ${contract.currentLocalWritePath.localServerAction}`,
    "- Required flags:",
    ...contract.currentLocalWritePath.requiredFlags.map((item) => `  - ${item}`),
    "- Future tables:",
    ...contract.currentLocalWritePath.futureTables.map((item) => `  - ${item}`),
    "",
    "Global guards:",
    ...contract.globalGuards.map((item) => `- ${item}`),
    "",
    "Lanes:",
    ...contract.lanes.flatMap((lane) => [
      `- ${lane.label} (${lane.key})`,
      `  - route: ${lane.route}`,
      `  - status: ${lane.status}`,
      `  - allowed actors: ${lane.allowedActors.join(", ") || "none"}`,
      `  - blocked actors: ${lane.blockedActors.join(", ") || "none"}`,
      "  - required flags:",
      ...(lane.requiredFlags.length > 0
        ? lane.requiredFlags.map((item) => `    - ${item}`)
        : ["    - none"]),
      "  - required tables:",
      ...lane.requiredTables.map((item) => `    - ${item}`),
      "  - forbidden side effects:",
      ...lane.forbiddenSideEffects.map((item) => `    - ${item}`),
      `  - rule: ${lane.plainEnglishRule}`,
    ]),
    "",
    "Validation:",
    ...contract.validation.checks.map((check) => {
      return `- ${check.passed ? "PASS" : "BLOCK"} ${check.key}: ${check.message}`;
    }),
  ].join("\n");
}
