import { getFeatureFlagDefinition } from "@/services/admin-rollout-controls-registry";
import { getAdminIntegrationOutboxWorkspace } from "@/services/admin-integration-outbox-workspace";
import { getAppRouteRegistry } from "@/services/app-route-registry";
import {
  getAssignmentActionBoardSafetyContract,
} from "@/services/assignment-action-board-safety-contract";
import {
  getCampaignRushMonthDataSafetyContract,
} from "@/services/campaign-rush-month-data-safety-contract";
import { getLeaderFollowUpBoard } from "@/services/leader-follow-up-board";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberProofStatusWorkspace } from "@/services/member-proof-status";
import {
  getNotificationsSendSafetyContract,
} from "@/services/notifications-communications-send-safety";
import {
  getPointsLeaderboardAwardSafetyContract,
} from "@/services/points-leaderboard-award-safety-contract";
import {
  getProofUgcConsentStorageSafetyContract,
} from "@/services/proof-ugc-consent-storage-safety-contract";
import {
  getBlockedProductionSignedInProofSourceMarkers,
} from "@/services/production-signed-in-route-proof-import";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getSopWorkflowDraftLiveSafetyContract,
} from "@/services/sop-workflow-draft-live-safety-contract";

export type NotificationsAnalyticsReadModelSafetyLane = {
  key:
    | "member_and_leader_readback_context"
    | "staff_and_coach_support_context"
    | "admin_outbox_and_contract_review"
    | "send_retry_and_dead_letter_mutation"
    | "provider_sync_and_identity_side_effects"
    | "analytics_warehouse_and_reporting_truth"
    | "points_proof_and_invite_side_effects"
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

export type NotificationsAnalyticsReadModelSafetyContract = {
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
  lanes: readonly NotificationsAnalyticsReadModelSafetyLane[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

const externalWriteFlagKeys = [
  "n8n_send",
  "warehouse_export",
  "hubspot_write",
  "ai_actions",
  "luma_attendance_import",
] as const;

const lanes = [
  {
    key: "member_and_leader_readback_context",
    label: "Member and leader readback context boundary",
    route: "/leader?view=overview",
    status: "read_only_preview",
    requiredTables: ["assignments", "integration_events", "automation_outbox", "evidence_items"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader"],
    forbiddenSideEffects: [
      "No fake reminder, notification, or follow-up send from member or leader readback.",
      "No fake outbox approval from leader queue review.",
      "No fake provider sync, points award, or invite side effect from contextual status copy.",
      "No production truth claim from preview-only readback notes or disabled outbox posture.",
    ],
    plainEnglishRule:
      "Member and leader surfaces may explain follow-up, proof, and next-step context, but they remain read-model views only and must not become send authority or provider truth.",
    sourceOfTruth: [
      "src/services/leader-follow-up-board.ts",
      "src/services/member-proof-status.ts",
      "src/services/notifications-communications-send-safety.ts",
    ],
  },
  {
    key: "staff_and_coach_support_context",
    label: "Staff and coach support-review boundary",
    route: "/staff?view=admin",
    status: "read_only_preview",
    requiredTables: ["integration_events", "automation_outbox", "audit_logs", "campaigns"],
    requiredFlags: [],
    allowedActors: ["coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake staff reminder delivery.",
      "No fake coach escalation packet or ownership transfer from support review.",
      "No fake analytics-driven chapter intervention write.",
      "No fake warehouse or provider export from support dashboards.",
    ],
    plainEnglishRule:
      "Staff and coach surfaces can review support posture and downstream analytics context, but they stay separate from live send, retry, export, or intervention authority.",
    sourceOfTruth: [
      "src/services/staff-launch-lane.ts",
      "src/services/notifications-communications-send-safety.ts",
      "src/services/campaign-rush-month-data-safety-contract.ts",
    ],
  },
  {
    key: "admin_outbox_and_contract_review",
    label: "Admin outbox and contract-inspection boundary",
    route: "/admin/integration-outbox",
    status: "read_only_preview",
    requiredTables: ["integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake live-send approval from review workspace.",
      "No fake payload editing, queue unlock, or secret access.",
      "No fake warehouse export or AI summary execution from admin review.",
      "No fake provider-readback row treated as operational authority by itself.",
    ],
    plainEnglishRule:
      "Admin and DS can inspect integration contracts, disabled outbox rows, and analytics/export posture, but review visibility must stay separate from execution or mutation authority.",
    sourceOfTruth: [
      "src/services/admin-integration-outbox-workspace.ts",
      "src/services/integration-contract-review.ts",
      "docs/integration-readiness-map.md",
    ],
  },
  {
    key: "send_retry_and_dead_letter_mutation",
    label: "Send, retry, replay, and dead-letter mutation boundary",
    route: "/admin/integration-outbox",
    status: "blocked_pending_future_lane",
    requiredTables: ["automation_outbox", "integration_events", "audit_logs"],
    requiredFlags: externalWriteFlagKeys,
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake send execution.",
      "No fake retry, replay, or dead-letter mutation.",
      "No fake n8n workflow start, resume, or rerun.",
      "No fake provider delivery confirmation from disabled queue rows.",
    ],
    plainEnglishRule:
      "Outbox review can show what a future worker would need, but send, retry, replay, and dead-letter mutation stay blocked until a separate approved server/outbox lane exists.",
    sourceOfTruth: [
      "src/services/notifications-communications-send-safety.ts",
      "src/services/admin-integration-outbox-workspace.ts",
      "docs/later-lane-integration-readiness-template.md",
    ],
  },
  {
    key: "provider_sync_and_identity_side_effects",
    label: "Provider sync and identity side-effect boundary",
    route: "/admin/workflows",
    status: "blocked_pending_future_lane",
    requiredTables: ["integration_events", "automation_outbox", "profiles", "memberships", "points_events"],
    requiredFlags: externalWriteFlagKeys,
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake HubSpot, Luma, Hootsuite, n8n, or warehouse sync treated as app truth.",
      "No fake user, invite, membership, proof, or points creation from provider-fed rows.",
      "No fake contact or role identity propagation from read-model data.",
      "No fake rollout or pilot readiness claim from provider mirrors or dashboards.",
    ],
    plainEnglishRule:
      "Provider-fed rows may later help with reporting or downstream operations, but they must not create people, roles, points, proof, or launch truth inside the app.",
    sourceOfTruth: [
      "docs/integration-readiness-map.md",
      "docs/warehouse-analytics-read-model-request-template.md",
      "src/services/integration-contract-review.ts",
    ],
  },
  {
    key: "analytics_warehouse_and_reporting_truth",
    label: "Analytics, warehouse, and reporting truth boundary",
    route: "/admin/integration-outbox",
    status: "read_only_preview",
    requiredTables: ["integration_events", "automation_outbox", "audit_logs", "points_events"],
    requiredFlags: ["warehouse_export"],
    allowedActors: ["staff", "coach", "admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake analytics row becomes operational truth.",
      "No fake warehouse aggregate approves invites, memberships, points, or proof.",
      "No fake report freshness implies live send or app-write approval.",
      "No fake Power BI, warehouse, or AI export counts as production evidence.",
    ],
    plainEnglishRule:
      "Analytics and warehouse outputs can support downstream reporting only; they remain governed read models and must never replace app truth, audit truth, or rollout proof.",
    sourceOfTruth: [
      "docs/warehouse-analytics-read-model-request-template.md",
      "docs/integration-readiness-map.md",
      "src/services/admin-integration-outbox-workspace.ts",
    ],
  },
  {
    key: "points_proof_and_invite_side_effects",
    label: "Points, proof, and invite side-effect boundary",
    route: "/admin/workflows",
    status: "blocked_pending_future_lane",
    requiredTables: ["points_events", "evidence_items", "integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: externalWriteFlagKeys,
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake points movement from comms or analytics rows.",
      "No fake proof completion or public-sharing truth from reporting outputs.",
      "No fake invite eligibility or batch approval from downstream provider signals.",
      "No fake ownership transfer or action completion from notification/read-model status alone.",
    ],
    plainEnglishRule:
      "Communications, outbox review, and analytics reporting can observe launch posture, but they must stay separate from points, proof, and invite-gate decisions.",
    sourceOfTruth: [
      "src/services/points-leaderboard-award-safety-contract.ts",
      "src/services/proof-ugc-consent-storage-safety-contract.ts",
      "src/services/assignment-action-board-safety-contract.ts",
    ],
  },
  {
    key: "production_proof_and_rollout_evidence",
    label: "Production proof and rollout-evidence posture",
    route: "/admin/integration-outbox",
    status: "blocked_pending_future_lane",
    requiredTables: ["signed_in_route_proof", "integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No Test/Figma/sandbox/mock/provider/read-model row counts as production proof.",
      "No preview-cookie, localhost, or staging outbox review counts as rollout evidence.",
      "No downstream analytics snapshot counts as invite-gate truth.",
      "No provider-fed dashboard or export can replace app, audit, or signed-in proof evidence.",
    ],
    plainEnglishRule:
      "Notifications/comms and analytics rehearsal is useful for readiness only. It must remain separate from real production proof, rollout packet evidence, and final invite-gate truth.",
    sourceOfTruth: [
      "src/services/production-signed-in-route-proof-import.ts",
      "src/services/production-live-data-readiness.ts",
      "docs/integration-readiness-map.md",
    ],
  },
] as const satisfies readonly NotificationsAnalyticsReadModelSafetyLane[];

function getExternalWriteFlagsSummary() {
  return externalWriteFlagKeys.map((key) => {
    const definition = getFeatureFlagDefinition(key);

    if (!definition) {
      throw new Error(`Missing ${key} rollout control definition.`);
    }

    if (
      definition.approvalPolicy !== "production_blocked" ||
      definition.defaultEnabledByEnvironment.local ||
      definition.defaultEnabledByEnvironment.staging ||
      definition.defaultEnabledByEnvironment.production
    ) {
      throw new Error(`${key} rollout control drifted away from the blocked default.`);
    }

    return definition;
  });
}

export function getNotificationsAnalyticsReadModelSafetyContract(): NotificationsAnalyticsReadModelSafetyContract {
  const data = getMockReadOnlyAppData("Testing notifications/analytics boundary.");
  const memberActor = getMockLocalActorContext("member.a@mymedlife.test");
  const leaderActor = getMockLocalActorContext("leader.a@mymedlife.test");
  const adminActor = getMockLocalActorContext("admin@mymedlife.test");
  const dsAdminActor = getMockLocalActorContext("ds.admin@mymedlife.test");
  const notificationsContract = getNotificationsSendSafetyContract();
  const adminOutboxWorkspace = getAdminIntegrationOutboxWorkspace(adminActor, data);
  const dsAdminOutboxWorkspace = getAdminIntegrationOutboxWorkspace(dsAdminActor, data);
  const leaderFollowUpBoard = getLeaderFollowUpBoard(leaderActor, data);
  const dsAdminFollowUpBoard = getLeaderFollowUpBoard(dsAdminActor, data);
  const memberProofStatus = getMemberProofStatusWorkspace(memberActor);
  const assignmentContract = getAssignmentActionBoardSafetyContract();
  const pointsContract = getPointsLeaderboardAwardSafetyContract();
  const proofContract = getProofUgcConsentStorageSafetyContract();
  const campaignContract = getCampaignRushMonthDataSafetyContract();
  const sopContract = getSopWorkflowDraftLiveSafetyContract();
  const blockedSources = getBlockedProductionSignedInProofSourceMarkers();
  const externalWriteFlags = getExternalWriteFlagsSummary();
  const routeRegistry = new Set(getAppRouteRegistry().map((route) => route.href));

  const validationChecks = [
    {
      key: "notification_surfaces_stay_zero_send",
      passed:
        notificationsContract.surfaces.every(
          (surface) =>
            surface.browserWritesExpected === 0 &&
            surface.externalWritesExpected === 0 &&
            surface.countsAsProductionProof === false,
        ) &&
        notificationsContract.rolloutFlagPosture.approvalPolicy === "production_blocked",
      message:
        "Notification and communications surfaces remain zero-write, zero-send, and blocked from production proof.",
    },
    {
      key: "leader_readback_stays_context_only",
      passed:
        leaderFollowUpBoard.canReadBoard &&
        leaderFollowUpBoard.counts.remindersEnabled === 0 &&
        dsAdminFollowUpBoard.canReadBoard === false,
      message:
        "Leader follow-up stays contextual only, with reminders disabled and DS Admin kept out of chapter-owned follow-up truth.",
    },
    {
      key: "member_proof_status_stays_provider_free",
      passed:
        memberProofStatus.counts.publicPublishesEnabled === 0 &&
        memberProofStatus.counts.externalExportsEnabled === 0 &&
        memberProofStatus.disabledOutboxDestinations.includes(
          "warehouse proof export disabled",
        ) &&
        memberProofStatus.safetyNotes.some((note) => note.includes("No HubSpot")),
      message:
        "Member-facing readback still labels provider/export posture as disabled instead of implying live delivery or analytics authority.",
    },
    {
      key: "admin_outbox_review_stays_read_only",
      passed:
        adminOutboxWorkspace.canReadWorkspace &&
        adminOutboxWorkspace.counts.browserWritesEnabled === 0 &&
        adminOutboxWorkspace.counts.externalWritesEnabled === 0 &&
        adminOutboxWorkspace.blockedControls.includes("approve live sends") &&
        adminOutboxWorkspace.blockedControls.includes("retry failed sends") &&
        adminOutboxWorkspace.blockedControls.includes("export warehouse or Power BI rows") &&
        dsAdminOutboxWorkspace.canReadAuditRows === false,
      message:
        "Admin/DS can inspect outbox posture, but send, retry, export, and audit-detail mutation remain blocked.",
    },
    {
      key: "integration_contract_keeps_warehouse_downstream",
      passed:
        adminOutboxWorkspace.contractReview.items.some(
          (item) =>
            item.key === "warehouse_power_bi" &&
            item.browserWritesExpected === 0 &&
            item.externalWritesExpected === 0 &&
            item.sourceOfTruth.includes("governed read models"),
        ),
      message:
        "Warehouse and Power BI remain downstream governed read models, not app-write or invite authority.",
    },
    {
      key: "adjacent_lanes_block_side_effect_drift",
      passed:
        assignmentContract.lanes.some(
          (lane) =>
            lane.key === "notification_delivery" &&
            lane.status === "blocked_pending_future_lane",
        ) &&
        pointsContract.lanes.some(
          (lane) =>
            lane.key === "rewards_provider_and_notifications" &&
            lane.status === "blocked_pending_future_lane",
        ) &&
        proofContract.lanes.some(
          (lane) =>
            lane.key === "campaign_proof_handoff_and_exports" &&
            lane.status === "blocked_pending_future_lane",
        ) &&
        campaignContract.lanes.some(
          (lane) =>
            lane.key === "provider_sync_and_funnel_exports" &&
            lane.status === "blocked_pending_future_lane",
        ) &&
        sopContract.lanes.some(
          (lane) =>
            lane.key === "provider_outbox_and_workflow_execution" &&
            lane.status === "blocked_pending_future_lane",
        ),
      message:
        "Assignments, points, proof, campaigns, and SOP workflows all continue to block send/export/provider drift.",
    },
    {
      key: "provider_flags_stay_production_blocked",
      passed: externalWriteFlags.length === externalWriteFlagKeys.length,
      message:
        "n8n, warehouse, HubSpot, AI actions, and Luma attendance import all stay production-blocked by default.",
    },
    {
      key: "review_routes_stay_registered",
      passed:
        routeRegistry.has("/leader") &&
        routeRegistry.has("/staff") &&
        routeRegistry.has("/admin/integration-outbox") &&
        routeRegistry.has("/admin/workflows") &&
        routeRegistry.has("/app/points"),
      message:
        "The leader, staff, admin outbox, admin workflows, and member points routes still exist for review-first posture.",
    },
    {
      key: "blocked_sources_still_reject_local_and_sample_evidence",
      passed:
        blockedSources.includes("preview-cookie") &&
        blockedSources.includes("local sandbox") &&
        blockedSources.includes("figma_seed") &&
        blockedSources.includes("localhost") &&
        blockedSources.includes("staging.mymedlife.org") &&
        blockedSources.includes("sop sample"),
      message:
        "Production proof import still rejects preview, sandbox, Figma/Test, localhost, staging, and SOP sample evidence.",
    },
  ];

  return {
    title: "Notifications/comms + analytics read-model safety contract: READ-ONLY readiness spec",
    summary: [
      "This contract is read-only. It does not send reminders, execute n8n workflows, retry outbox rows, export analytics, create users, create invites, move points, publish proof, or create production evidence.",
      "Current source supports preview/read-model context plus admin inspection of disabled outbox and provider posture only. There is no approved live send, retry, dead-letter, or analytics-authority path.",
      "Provider-fed rows and downstream reports may support later reporting and safety review, but they must stay separate from operational truth, launch decisions, and production proof.",
    ],
    currentWritePath: {
      exists: false,
      reason:
        "No dedicated live notifications/comms execution path or analytics/read-model authority path exists today.",
      blockedUntil: [
        "A reviewed server-only send/execution boundary exists.",
        "Retry, dead-letter, replay, and rollback rules are approved.",
        "Warehouse/reporting freshness and downstream-only posture are explicit.",
        "Provider-fed data stays unable to create users, invites, memberships, points, or rollout evidence.",
      ],
    },
    adjacentGuardrails: [
      {
        lane: "Notifications / communications",
        route: "/admin/integration-outbox",
        currentPosture:
          "Reminder/comms surfaces are preview-only and n8n/provider execution remains production-blocked.",
      },
      {
        lane: "Assignments / action board",
        route: "/rush-month/actions",
        currentPosture:
          "Assignments still block reminder delivery, ownership transfer, and task-linked side effects.",
      },
      {
        lane: "Points / leaderboards",
        route: "/app/points",
        currentPosture:
          "Notifications, rewards, and provider sends remain blocked from creating points authority.",
      },
      {
        lane: "Proof / Evidence / UGC",
        route: "/proof-library",
        currentPosture:
          "Proof review and exports remain separate from reporting/read-model authority and external execution.",
      },
      {
        lane: "SOP / workflows",
        route: "/admin/workflows",
        currentPosture:
          "Workflow maps can stay visible, but outbox/provider execution remains a separate blocked lane.",
      },
    ],
    globalGuards: [
      "Keep notifications/reminders/comms preview separate from real send authority.",
      "Keep n8n/workflow execution blocked unless a separate approved server/outbox lane exists.",
      "Keep outbox review separate from send, retry, replay, dead-letter, and payload mutation authority.",
      "Keep analytics/read-model/warehouse reporting separate from operational truth.",
      "Provider-fed rows must not create users, invites, memberships, points, proof, or rollout evidence.",
      "Test/Figma/sandbox/mock/provider/read-model data must never count as production evidence or final invite-gate proof.",
    ],
    requiredFoundations: [
      "A dedicated server-only send/execution boundary with explicit local/dev and hosted gates.",
      "Retry, replay, dead-letter, rollback, and human-owner rules for outbox execution.",
      "A downstream-only analytics contract with freshness SLA, batch identity, and bad-batch recovery posture.",
      "Role gates proving member/leader only read their context, staff/coach only review support posture, and admin/DS only inspect readiness before execution is approved.",
      "Operator proof that local/Test/Figma/sandbox/provider/read-model artifacts remain excluded from signed-in proof, rollout packet evidence, and invite-gate truth.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatNotificationsAnalyticsReadModelSafetyContract(
  contract: NotificationsAnalyticsReadModelSafetyContract = getNotificationsAnalyticsReadModelSafetyContract(),
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
    ...contract.adjacentGuardrails.flatMap((item) => [
      `- ${item.lane}`,
      `  - route: ${item.route}`,
      `  - posture: ${item.currentPosture}`,
    ]),
    "",
    "Global guards:",
    ...formatList(contract.globalGuards),
    "",
    "Required foundations:",
    ...formatList(contract.requiredFoundations),
    "",
    "Lanes:",
    ...contract.lanes.flatMap((lane) => [
      `- ${lane.label}`,
      `  - key: ${lane.key}`,
      `  - route: ${lane.route}`,
      `  - status: ${lane.status}`,
      `  - allowed actors: ${lane.allowedActors.join(", ")}`,
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
    ...contract.validation.checks.map(
      (check) => `- ${check.passed ? "PASS" : "BLOCK"} ${check.key}: ${check.message}`,
    ),
  ].join("\n");
}

function formatList(items: readonly string[]) {
  return items.map((item) => `- ${item}`);
}

function formatNestedList(items: readonly string[]) {
  return items.map((item) => `  - ${item}`);
}
