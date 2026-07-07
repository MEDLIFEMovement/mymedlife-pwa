import { getFeatureFlagDefinition } from "@/services/admin-rollout-controls-registry";
import { getAppRouteRegistry } from "@/services/app-route-registry";
import {
  getAssignmentActionBoardSafetyContract,
} from "@/services/assignment-action-board-safety-contract";
import {
  getCampaignRushMonthDataSafetyContract,
} from "@/services/campaign-rush-month-data-safety-contract";
import {
  getDraftLiveContentObjectEvidenceReason,
} from "@/services/draft-live-content-safety";
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
import {
  getSopTemplateApprovalReadinessReport,
} from "@/services/sop-template-approval-readiness";
import {
  getSopTemplatePromotionBoundaryResult,
} from "@/services/sop-template-promotion-boundary";

export type SopWorkflowDraftLiveSafetyLane = {
  key:
    | "template_and_sample_truth"
    | "campaign_sop_and_workflow_registry"
    | "approval_publish_and_rollback_boundary"
    | "task_generation_and_assignment_side_effects"
    | "points_kpi_and_scoreboard_effects"
    | "proof_evidence_and_closeout_requirements"
    | "provider_outbox_and_workflow_execution"
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

export type SopWorkflowDraftLiveSafetyContract = {
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
  lanes: readonly SopWorkflowDraftLiveSafetyLane[];
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
  "ai_actions",
  "hubspot_write",
] as const;

const routes = {
  staffSops: "/staff?view=sops",
  adminWorkflows: "/admin/workflows",
  adminSopLibrary: "/admin/sop-library",
  adminSopBuilder: "/admin/sop-builder/rush-month?tab=steps",
  adminIntegrationOutbox: "/admin/integration-outbox",
  proofLibrary: "/proof-library",
  memberPoints: "/app/points",
} as const;

const lanes = [
  {
    key: "template_and_sample_truth",
    label: "Template, sample, and planning-content truth boundary",
    route: routes.adminSopLibrary,
    status: "read_only_preview",
    requiredTables: ["campaign_templates", "campaign_phase_templates", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["staff", "admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake SOP template save.",
      "No imported SOP sample, Test/Figma content, or planning copy becomes live workflow truth.",
      "No fake workflow state promotion from builder review tabs.",
      "No browser-only mutation from SOP library or builder review.",
    ],
    plainEnglishRule:
      "SOP and workflow surfaces can stay visible for source-backed review, but draft, template, sample, and planning content must remain read-only until a dedicated publish path, approval record, and rollback posture exist.",
    sourceOfTruth: [
      "src/services/draft-live-content-safety.ts",
      "src/services/sop-template-approval-readiness.ts",
      "src/services/sop-template-promotion-boundary.ts",
      "src/services/route-smoke-manifest.ts",
    ],
  },
  {
    key: "campaign_sop_and_workflow_registry",
    label: "Campaign SOP registry and workflow-map boundary",
    route: routes.adminWorkflows,
    status: "read_only_preview",
    requiredTables: ["campaign_templates", "campaign_instances", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["staff", "admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake campaign SOP publish.",
      "No fake workflow-runtime activation from admin workflow registry review.",
      "No fake chapter operating truth from route-backed SOP map copy.",
      "No fake provider-ready workflow status from review-only metadata.",
    ],
    plainEnglishRule:
      "Workflow and SOP registry pages may explain how campaigns could later operate, but they remain review-first maps of future behavior rather than an approved campaign-ops control plane.",
    sourceOfTruth: [
      "src/services/campaign-rush-month-data-safety-contract.ts",
      "src/services/route-smoke-manifest.ts",
      "src/services/app-route-registry.ts",
    ],
  },
  {
    key: "approval_publish_and_rollback_boundary",
    label: "Approval, publish, archive, and rollback boundary",
    route: routes.adminSopBuilder,
    status: "blocked_pending_future_lane",
    requiredTables: ["audit_logs", "integration_events"],
    requiredFlags: [],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake DS/admin approval write.",
      "No fake publish or rollback execution.",
      "No fake archived-to-live transition from template review state.",
      "No fake live-behavior claim from manual-review eligibility alone.",
    ],
    plainEnglishRule:
      "Approval readiness and promotion checks can summarize what would be required, but they do not create a live publish button, a rollback path, or permission to change production behavior.",
    sourceOfTruth: [
      "src/services/sop-template-approval-readiness.ts",
      "src/services/sop-template-promotion-boundary.ts",
      "docs/production-rollout-data-collection.md",
    ],
  },
  {
    key: "task_generation_and_assignment_side_effects",
    label: "Task generation, follow-up, and workflow-side assignment boundary",
    route: routes.staffSops,
    status: "blocked_pending_future_lane",
    requiredTables: ["assignments", "automation_outbox", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake task generation from SOP steps.",
      "No fake assignment creation, reminder send, or ownership transfer from workflow copy.",
      "No fake workflow-complete state from preview task checklists.",
      "No fake chapter support action created by SOP planning surfaces.",
    ],
    plainEnglishRule:
      "SOPs may describe tasks and ownership, but assignment creation, follow-up, and reminders remain a separate audited lane and must not be inferred from workflow previews.",
    sourceOfTruth: [
      "src/services/assignment-action-board-safety-contract.ts",
      "src/services/notifications-communications-send-safety.ts",
      "src/services/staff-launch-lane.ts",
    ],
  },
  {
    key: "points_kpi_and_scoreboard_effects",
    label: "Points, KPI, and leaderboard effects boundary",
    route: routes.memberPoints,
    status: "blocked_pending_future_lane",
    requiredTables: ["points_events", "kpi_events", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_leader", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake points award from SOP completion or checklist state.",
      "No fake KPI materialization from draft workflow progress.",
      "No fake leaderboard movement from campaign SOP review.",
      "No fake recognition proof from sample workflow outcomes.",
    ],
    plainEnglishRule:
      "Workflow definitions can describe future KPI and points links, but they must stay separate from live award authority until the underlying event, proof, and materialization lanes are approved.",
    sourceOfTruth: [
      "src/services/points-leaderboard-award-safety-contract.ts",
      "src/services/campaign-rush-month-data-safety-contract.ts",
      "src/services/draft-live-content-safety.ts",
    ],
  },
  {
    key: "proof_evidence_and_closeout_requirements",
    label: "Proof, evidence, and closeout requirements boundary",
    route: routes.proofLibrary,
    status: "blocked_pending_future_lane",
    requiredTables: ["evidence_items", "automation_outbox", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake proof requirement completion from SOP notes alone.",
      "No fake consent approval or story publishing from workflow review.",
      "No fake campaign closeout evidence from template checklists.",
      "No fake pilot or production proof from local/sample SOP artifacts.",
    ],
    plainEnglishRule:
      "SOPs can require proof or closeout review, but proof upload, moderation, consent, and campaign evidence remain separate lanes and cannot be satisfied by workflow copy alone.",
    sourceOfTruth: [
      "src/services/proof-ugc-consent-storage-safety-contract.ts",
      "src/services/campaign-rush-month-data-safety-contract.ts",
      "src/services/draft-live-content-safety.ts",
    ],
  },
  {
    key: "provider_outbox_and_workflow_execution",
    label: "Provider/outbox sends and workflow execution boundary",
    route: routes.adminIntegrationOutbox,
    status: "blocked_pending_future_lane",
    requiredTables: ["automation_outbox", "integration_events", "audit_logs"],
    requiredFlags: externalWriteFlagKeys,
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake n8n or workflow execution.",
      "No fake provider/outbox send, retry, or approval from SOP publish review.",
      "No fake HubSpot, warehouse, or AI action trigger from campaign workflow content.",
      "No fake reminder, notification, or automation success proof from disabled outbox rows.",
    ],
    plainEnglishRule:
      "Workflow planning may reference future automation, but execution, provider sends, retries, and exports remain hard-blocked until explicit hosted gates, audited readback, and stop conditions are approved.",
    sourceOfTruth: [
      "src/services/notifications-communications-send-safety.ts",
      "src/services/admin-rollout-controls-registry.ts",
      "src/services/admin-integration-outbox-workspace.ts",
    ],
  },
  {
    key: "production_proof_and_rollout_evidence",
    label: "Production proof and rollout-evidence posture",
    route: routes.adminSopLibrary,
    status: "blocked_pending_future_lane",
    requiredTables: ["signed_in_route_proof", "audit_logs", "integration_events"],
    requiredFlags: [],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No Test/Figma/SOP/sample/planning row counts as production proof.",
      "No preview-cookie, localhost, sandbox, or staging SOP review counts as rollout evidence.",
      "No imported SOP sample or workflow screenshot counts as invite-gate truth.",
      "No local workflow artifact counts as production launch approval.",
    ],
    plainEnglishRule:
      "Workflow and SOP rehearsal is useful for readiness review only. It must remain separate from signed-in route proof, rollout packet evidence, and invite-gate truth until real production data exists.",
    sourceOfTruth: [
      "src/services/local-vs-production-role-proof-separation.ts",
      "src/services/production-signed-in-route-proof-import.ts",
      "src/services/production-rollout-bootstrap.ts",
      "src/services/production-rollout-packet-builder.ts",
    ],
  },
] as const satisfies readonly SopWorkflowDraftLiveSafetyLane[];

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

export function getSopWorkflowDraftLiveSafetyContract(): SopWorkflowDraftLiveSafetyContract {
  const approvalReadiness = getSopTemplateApprovalReadinessReport();
  const promotionBoundary = getSopTemplatePromotionBoundaryResult({
    name: "Chapter Follow-up SOP",
    state: "live",
    approvals: {
      reviewedBy: "content-owner@medlifemovement.org",
      reviewedAt: "2026-07-06T12:00:00Z",
      dsApprovedBy: "ds-admin@medlifemovement.org",
      dsApprovedAt: "2026-07-06T13:00:00Z",
      promotionOwner: "launch-owner@medlifemovement.org",
    },
    guards: {
      rolloutEvidenceExcluded: true,
      signedInProofExcluded: true,
      inviteGateExcluded: true,
      launchBehaviorUnchanged: true,
    },
  });
  const sampleReason = getDraftLiveContentObjectEvidenceReason({
    workflowSnapshot: {
      sourceKind: "template_version",
    },
    notes: "SOP sample content only",
  });
  const routeRegistry = new Set(getAppRouteRegistry().map((route) => route.href));
  const campaignContract = getCampaignRushMonthDataSafetyContract();
  const assignmentContract = getAssignmentActionBoardSafetyContract();
  const pointsContract = getPointsLeaderboardAwardSafetyContract();
  const proofContract = getProofUgcConsentStorageSafetyContract();
  const notificationsContract = getNotificationsSendSafetyContract();
  const blockedSources = getBlockedProductionSignedInProofSourceMarkers();
  const externalWriteFlags = getExternalWriteFlagsSummary();

  const liveState = approvalReadiness.states.find((state) => state.state === "live");

  const validationChecks = [
    {
      key: "draft_live_states_present",
      passed:
        approvalReadiness.states.map((state) => state.state).join(",") ===
        "draft,reviewed,scheduled,live,archived",
      message:
        "SOP/template readiness still uses the expected draft, reviewed, scheduled, live, archived state vocabulary.",
    },
    {
      key: "live_state_stays_non_evidence",
      passed:
        liveState?.canAffectLiveBehavior === true &&
        liveState.countsAsRolloutEvidence === false,
      message:
        "Even the live SOP state remains excluded from rollout evidence until separate production proof lanes are satisfied.",
    },
    {
      key: "promotion_boundary_stays_manual_review_only",
      passed:
        promotionBoundary.status === "ready_for_manual_review" &&
        promotionBoundary.eligibleForManualReview &&
        promotionBoundary.blockers.length === 0,
      message:
        "A fully approved manifest reaches manual-review-only posture, not live publish, provider execution, or rollout-evidence status.",
    },
    {
      key: "sample_content_rejection_stays_active",
      passed:
        sampleReason === "packet.workflowSnapshot.sourceKind is marked template_version",
      message:
        "Draft/template/SOP sample content is still rejected before it can look like production rollout material.",
    },
    {
      key: "sop_routes_stay_registered",
      passed:
        routeRegistry.has("/admin/workflows") &&
        routeRegistry.has("/admin/sop-library") &&
        routeRegistry.has("/admin/sop-builder/"),
      message:
        "The admin workflow registry, SOP library, and SOP builder routes still exist in the route registry for review-first posture.",
    },
    {
      key: "campaign_and_assignment_side_effects_stay_blocked",
      passed:
        campaignContract.lanes.some(
          (lane) =>
            lane.key === "campaign_template_and_instance_truth" &&
            lane.status === "read_only_preview",
        ) &&
        assignmentContract.lanes.some(
          (lane) =>
            lane.key === "notification_delivery" &&
            lane.status === "blocked_pending_future_lane",
        ) &&
        assignmentContract.lanes.some(
          (lane) =>
            lane.key === "points_awards" &&
            lane.status === "blocked_pending_future_lane",
        ),
      message:
        "Campaign SOP copy still stays review-first, and workflow-linked assignments, reminder delivery, and task-driven points awards remain blocked.",
    },
    {
      key: "proof_and_points_drift_stays_blocked",
      passed:
        proofContract.lanes.some(
          (lane) =>
            lane.key === "campaign_proof_handoff_and_exports" &&
            lane.status === "blocked_pending_future_lane",
        ) &&
        pointsContract.lanes.some(
          (lane) =>
            lane.key === "proof_review_and_points_materialization" &&
            lane.status === "read_only_preview",
        ) &&
        pointsContract.lanes.some(
          (lane) =>
            lane.key === "campaign_and_rush_points_credit" &&
            lane.status === "blocked_pending_future_lane",
        ),
      message:
        "Workflow definitions still cannot turn proof review or campaign completion into live points or KPI movement.",
    },
    {
      key: "provider_execution_stays_production_blocked",
      passed:
        notificationsContract.rolloutFlagPosture.approvalPolicy === "production_blocked" &&
        externalWriteFlags.length === externalWriteFlagKeys.length,
      message:
        "Workflow execution and provider sends remain production-blocked across n8n, warehouse, HubSpot, and AI-action controls.",
    },
    {
      key: "blocked_sources_still_reject_sop_sample_proof",
      passed:
        blockedSources.includes("sop sample") &&
        blockedSources.includes("figma_seed") &&
        blockedSources.includes("localhost") &&
        blockedSources.includes("staging.mymedlife.org"),
      message:
        "Production proof import still rejects SOP sample, sandbox, localhost, Figma/Test, and staging source markers.",
    },
  ];

  return {
    title: "SOP / workflow draft-live safety contract: READ-ONLY readiness spec",
    summary: [
      "This contract is read-only. It does not publish SOPs, approve workflow state, create assignments, award points, upload proof, execute providers, or create production proof.",
      "Current source provides approval-readiness and promotion-boundary review helpers only. There is no approved live SOP publish or rollback write path.",
      "Campaign SOPs, imported samples, workflow maps, and planning copy may stay visible for review, but they must remain separate from task generation, points/KPI effects, proof requirements, outbox execution, and rollout evidence.",
    ],
    currentWritePath: {
      exists: false,
      reason:
        "No dedicated audited server-side SOP publish, rollback, or workflow-execution write path exists today.",
      blockedUntil: [
        "A dedicated SOP/workflow schema and audited server boundary exist.",
        "DS/admin approval records and rollback ownership are explicit.",
        "Task-generation, points, proof, and outbox side effects stay separated behind their own approved lanes.",
        "Hosted production continues to block workflow/provider execution by default.",
      ],
    },
    adjacentGuardrails: [
      {
        lane: "Campaigns / Rush Month",
        route: "/campaigns/rush-month",
        currentPosture:
          "Campaign templates and instances stay review-first; no fake campaign activation or provider sync from SOP copy.",
      },
      {
        lane: "Assignments / Action Board",
        route: "/rush-month/actions",
        currentPosture:
          "Task creation, reminders, ownership transfer, and points side effects remain separately gated and must not be implied by workflow steps.",
      },
      {
        lane: "Points / leaderboards",
        route: "/app/points",
        currentPosture:
          "Points readback and verification stay read-only; SOP completion cannot become award authority.",
      },
      {
        lane: "Proof / Evidence / UGC",
        route: "/proof-library",
        currentPosture:
          "Proof upload, consent, publishing, and exports remain separate approved lanes and cannot be satisfied by workflow review copy.",
      },
      {
        lane: "Notifications / Communications",
        route: "/admin/integration-outbox",
        currentPosture:
          "n8n/provider sends remain hard-blocked and cannot be activated from workflow registry or SOP builder review.",
      },
    ],
    globalGuards: [
      "Do not treat draft/template/sample/planning/SOP content as live workflow authority.",
      "Do not create fake tasks, fake approvals, fake rollback execution, fake points/KPI movement, fake proof completion, or fake provider/outbox sends from workflow review surfaces.",
      "Do not treat Test/Figma/sandbox/localhost/staging SOP artifacts as production signed-in proof, rollout evidence, or invite-gate truth.",
      "Keep workflow review, publish authority, and external execution as separate approvals rather than one blended browser flow.",
    ],
    requiredFoundations: [
      "A dedicated audited server-side SOP/workflow publish boundary with explicit local/dev and hosted gates.",
      "Schema support for workflow versions, approvals, rollback ownership, and audit readback.",
      "A reviewed split between narrative workflow content and any authoritative task, points, proof, or provider side effects.",
      "Operator proof that imported SOP samples, planning docs, and template content remain excluded from production rollout evidence.",
      "A rollback and stop-rule runbook for any future hosted workflow execution or provider send posture.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatSopWorkflowDraftLiveSafetyContract(
  contract: SopWorkflowDraftLiveSafetyContract = getSopWorkflowDraftLiveSafetyContract(),
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
