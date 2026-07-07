import { getAdminIntegrationOutboxWorkspace } from "@/services/admin-integration-outbox-workspace";
import { getAppRouteRegistry } from "@/services/app-route-registry";
import {
  getAssignmentActionBoardSafetyContract,
} from "@/services/assignment-action-board-safety-contract";
import {
  getCoachDecisionWriteConfig,
} from "@/services/coach-decision-write";
import { getCoachPortfolioReadiness } from "@/services/coach-portfolio-readiness";
import { getCoachStaffPortfolioAssignmentSafetyContract } from "@/services/coach-staff-portfolio-assignment-safety-contract";
import { getCoachSupportNotesWorkspace } from "@/services/coach-support-notes";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getNotificationsAnalyticsReadModelSafetyContract,
} from "@/services/notifications-analytics-read-model-safety-contract";
import {
  getNotificationsSendSafetyContract,
} from "@/services/notifications-communications-send-safety";
import {
  getPointsLeaderboardAwardSafetyContract,
} from "@/services/points-leaderboard-award-safety-contract";
import {
  getProofUgcConsentStorageSafetyContract,
} from "@/services/proof-ugc-consent-storage-safety-contract";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getRoleAccessInvariantsReport,
} from "@/services/role-access-invariants";
import {
  getBlockedProductionSignedInProofSourceMarkers,
} from "@/services/production-signed-in-route-proof-import";

export type CoachStaffPortfolioInterventionLane = {
  key:
    | "coach_portfolio_read_model"
    | "staff_support_review_context"
    | "coach_support_notes_and_checklist"
    | "localhost_only_coach_decision_packet"
    | "intervention_status_notes_and_recommendations"
    | "follow_up_tasks_alerts_and_exports"
    | "provider_sync_and_analytics_truth"
    | "production_proof_and_rollout_evidence";
  label: string;
  route: string;
  status:
    | "read_only_preview"
    | "implemented_local_only"
    | "blocked_pending_future_lane";
  allowedActors: readonly string[];
  requiredTables: readonly string[];
  requiredFlags: readonly string[];
  forbiddenSideEffects: readonly string[];
  plainEnglishRule: string;
  sourceOfTruth: readonly string[];
};

export type CoachStaffPortfolioInterventionSafetyContract = {
  title: string;
  summary: readonly string[];
  currentLocalWritePaths: readonly {
    route: string;
    localFunction: string;
    requiredFlags: readonly string[];
    allowedActors: readonly string[];
    blockedInHostedByCurrentGuards: boolean;
    localOnlyReason: string;
  }[];
  globalGuards: readonly string[];
  requiredFoundations: readonly string[];
  lanes: readonly CoachStaffPortfolioInterventionLane[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

const coachDecisionFlags = [
  "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_COACH_DECISION_WRITE=true",
] as const;

const lanes = [
  {
    key: "coach_portfolio_read_model",
    label: "Coach portfolio read-model boundary",
    route: "/coach",
    status: "read_only_preview",
    allowedActors: ["coach", "admin", "super_admin"],
    requiredTables: ["chapters", "coach_assignments", "campaigns", "risk_flags", "evidence_items"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No chapter intervention status save from portfolio cards.",
      "No coach assignment mutation from read-model rows.",
      "No fake chapter health export or risk persistence from visible portfolio state.",
      "No production truth claim from Test/Figma/sandbox/mock portfolio rows.",
    ],
    plainEnglishRule:
      "Coach portfolio rows can compare chapter posture and highlight risk, but they remain read-only and must not silently become intervention or ownership truth.",
    sourceOfTruth: [
      "src/services/coach-portfolio-readiness.ts",
      "src/services/staff-command-center.ts",
    ],
  },
  {
    key: "staff_support_review_context",
    label: "Staff support review-context boundary",
    route: "/staff",
    status: "read_only_preview",
    allowedActors: ["coach", "admin", "super_admin"],
    requiredTables: ["chapters", "risk_flags", "assignments", "points_events", "integration_events"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No staff-side intervention mutation from chapter review context.",
      "No fake follow-up owner assignment or alert save from support review.",
      "No fake recommendation acceptance or export from visible staff cards.",
      "No fake warehouse/reporting signal treated as operational chapter truth.",
    ],
    plainEnglishRule:
      "Staff chapter review can surface support posture, but it stays review-only unless a separate write lane is explicitly approved.",
    sourceOfTruth: [
      "src/services/staff-command-center.ts",
      "src/services/staff-launch-lane.ts",
      "src/services/coach-staff-portfolio-assignment-safety-contract.ts",
    ],
  },
  {
    key: "coach_support_notes_and_checklist",
    label: "Coach support notes and intervention-checklist boundary",
    route: "/coach",
    status: "read_only_preview",
    allowedActors: ["coach", "admin", "super_admin"],
    requiredTables: ["risk_flags", "evidence_items", "assignments", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No coach note save.",
      "No escalation packet persistence from checklist review.",
      "No fake chapter hold, advance, or intervene mutation from support notes alone.",
      "No fake support-proof evidence from checklist status.",
    ],
    plainEnglishRule:
      "Support notes and intervention checklist items can rehearse decision logic, but they remain planning context until an audited write boundary and rollback posture are approved.",
    sourceOfTruth: [
      "src/services/coach-support-notes.ts",
      "src/services/coach-decision-write.ts",
    ],
  },
  {
    key: "localhost_only_coach_decision_packet",
    label: "Localhost-only coach decision packet",
    route: "/admin/coach-write",
    status: "implemented_local_only",
    allowedActors: ["coach", "admin", "super_admin"],
    requiredTables: ["phase_reviews", "events", "integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: coachDecisionFlags,
    forbiddenSideEffects: [
      "No hosted staging or hosted production intervention write approval.",
      "No fake escalation send, reminder delivery, or provider handoff.",
      "No fake production support proof from localhost packet results.",
      "No browser UI wiring implied by this contract.",
    ],
    plainEnglishRule:
      "The local coach decision packet is useful for localhost rehearsal only. It does not authorize hosted or production intervention behavior.",
    sourceOfTruth: [
      "src/services/coach-decision-write.ts",
      "src/services/coach-decision-verification-packet.ts",
      "src/services/coach-staff-portfolio-assignment-safety-contract.ts",
    ],
  },
  {
    key: "intervention_status_notes_and_recommendations",
    label: "Intervention status, notes, and recommendation persistence boundary",
    route: "/coach",
    status: "blocked_pending_future_lane",
    allowedActors: ["coach", "admin", "super_admin"],
    requiredTables: ["phase_reviews", "support_notes", "risk_flags", "best_practice_selections", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No intervention status change save from preview state.",
      "No durable coach/support note persistence.",
      "No recommendation acceptance save.",
      "No silent chapter-risk or readiness mutation from advice-only surfaces.",
    ],
    plainEnglishRule:
      "Intervention state, notes, and best-practice recommendations remain advisory until a dedicated audited persistence model exists.",
    sourceOfTruth: [
      "src/services/coach-support-notes.ts",
      "src/services/coach-portfolio-readiness.ts",
      "src/services/coach-staff-portfolio-assignment-safety-contract.ts",
    ],
  },
  {
    key: "follow_up_tasks_alerts_and_exports",
    label: "Follow-up tasks, alerts, notifications, and export boundary",
    route: "/admin/integration-outbox",
    status: "blocked_pending_future_lane",
    allowedActors: ["coach", "admin", "ds_admin", "super_admin"],
    requiredTables: ["assignments", "automation_outbox", "integration_events", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No follow-up task creation from support review context.",
      "No alert, reminder, or coach escalation delivery.",
      "No outbox send, retry, replay, or export mutation.",
      "No fake intervention-complete proof from notification or export posture.",
    ],
    plainEnglishRule:
      "Support workflows may describe future follow-up and exports, but task creation, alerts, reminders, and outbox execution stay blocked until a separate approved lane exists.",
    sourceOfTruth: [
      "src/services/assignment-action-board-safety-contract.ts",
      "src/services/notifications-communications-send-safety.ts",
      "src/services/notifications-analytics-read-model-safety-contract.ts",
    ],
  },
  {
    key: "provider_sync_and_analytics_truth",
    label: "Provider sync and analytics/read-model truth boundary",
    route: "/admin/integration-outbox",
    status: "blocked_pending_future_lane",
    allowedActors: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["integration_events", "automation_outbox", "audit_logs", "points_events", "evidence_items"],
    requiredFlags: ["n8n_send", "warehouse_export", "hubspot_write", "luma_attendance_import", "ai_actions"],
    forbiddenSideEffects: [
      "No HubSpot, Luma, Hootsuite, n8n, or warehouse row becomes operational truth for chapter support.",
      "No fake user, invite, membership, points, or proof creation from provider/read-model rows.",
      "No fake coach assignment or intervention success proof from downstream analytics.",
      "No fake export, report, or AI summary treated as launch-ready support authority.",
    ],
    plainEnglishRule:
      "Provider-fed data and downstream analytics can support later reporting and recovery only; they must not replace app, audit, or owner truth for interventions.",
    sourceOfTruth: [
      "src/services/notifications-analytics-read-model-safety-contract.ts",
      "docs/integration-readiness-map.md",
      "docs/warehouse-analytics-read-model-request-template.md",
    ],
  },
  {
    key: "production_proof_and_rollout_evidence",
    label: "Production proof and rollout-evidence posture",
    route: "/admin/coach-write",
    status: "blocked_pending_future_lane",
    allowedActors: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["profiles", "memberships", "coach_assignments", "signed_in_route_proof", "audit_logs"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No Test/Figma/sandbox/mock/provider/read-model row counts as production support proof.",
      "No localhost packet screenshot or preview readback counts as rollout evidence.",
      "No coach/staff portfolio preview counts as real owner assignment or support ownership proof.",
      "No downstream analytics or provider export counts as final invite-gate truth.",
    ],
    plainEnglishRule:
      "Local coach/staff intervention rehearsal is useful for readiness only. It cannot substitute for real production owner data, signed-in proof, or rollout evidence.",
    sourceOfTruth: [
      "src/services/production-signed-in-route-proof-import.ts",
      "src/services/production-live-data-readiness.ts",
      "src/services/local-vs-production-role-proof-separation.ts",
    ],
  },
] as const satisfies readonly CoachStaffPortfolioInterventionLane[];

export function getCoachStaffPortfolioInterventionSafetyContract(): CoachStaffPortfolioInterventionSafetyContract {
  const data = getMockReadOnlyAppData("Coach/staff portfolio intervention safety.");
  const memberActor = getMockLocalActorContext("member.a@mymedlife.test");
  const leaderActor = getMockLocalActorContext("leader.a@mymedlife.test");
  const coachActor = getMockLocalActorContext("coach@mymedlife.test");
  const adminActor = getMockLocalActorContext("admin@mymedlife.test");
  const dsAdminActor = getMockLocalActorContext("ds.admin@mymedlife.test");

  const coachPortfolio = getCoachPortfolioReadiness(coachActor, data);
  const adminPortfolio = getCoachPortfolioReadiness(adminActor, data);
  const memberPortfolio = getCoachPortfolioReadiness(memberActor, data);
  const leaderPortfolio = getCoachPortfolioReadiness(leaderActor, data);
  const dsAdminPortfolio = getCoachPortfolioReadiness(dsAdminActor, data);
  const supportNotes = getCoachSupportNotesWorkspace(coachActor, data);
  const notificationsContract = getNotificationsSendSafetyContract();
  const notificationsAnalyticsContract = getNotificationsAnalyticsReadModelSafetyContract();
  const assignmentContract = getAssignmentActionBoardSafetyContract();
  const pointsContract = getPointsLeaderboardAwardSafetyContract();
  const proofContract = getProofUgcConsentStorageSafetyContract();
  const portfolioAssignmentContract = getCoachStaffPortfolioAssignmentSafetyContract();
  const outboxWorkspace = getAdminIntegrationOutboxWorkspace(adminActor, data);
  const roleInvariants = getRoleAccessInvariantsReport();
  const blockedSources = getBlockedProductionSignedInProofSourceMarkers();
  const routeRegistry = new Set(getAppRouteRegistry().map((route) => route.href));

  const localCoachDecisionConfig = getCoachDecisionWriteConfig({
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
  });

  const localCoachDecisionPath = portfolioAssignmentContract.currentLocalWritePaths.find(
    (path) => path.route === "/admin/coach-write",
  );

  const validationChecks = [
    {
      key: "coach_portfolio_stays_read_only_and_role_scoped",
      passed:
        coachPortfolio.canReadPortfolio &&
        coachPortfolio.counts.coachChangesEnabled === 0 &&
        coachPortfolio.rows.every((row) => row.coachChangePosture === "read_only") &&
        adminPortfolio.canReadPortfolio &&
        !memberPortfolio.canReadPortfolio &&
        !leaderPortfolio.canReadPortfolio &&
        !dsAdminPortfolio.canReadPortfolio,
      message:
        "Coach portfolio remains read-only, visible to coach/admin support roles, and hidden from member, leader, and DS Admin audiences.",
    },
    {
      key: "support_notes_and_checklist_stay_zero_write",
      passed:
        supportNotes.browserWritesEnabled === 0 &&
        supportNotes.externalWritesEnabled === 0 &&
        supportNotes.interventionChecklist.counts.browserWritesEnabled === 0 &&
        supportNotes.interventionChecklist.counts.externalWritesEnabled === 0 &&
        supportNotes.interventionChecklist.blockedControls.includes("coach note save") &&
        supportNotes.interventionChecklist.blockedControls.includes("coach decision save") &&
        supportNotes.interventionChecklist.blockedControls.includes("external automation"),
      message:
        "Coach support notes and intervention checklist still rehearse decisions without enabling note saves, decision saves, or external automation.",
    },
    {
      key: "localhost_packet_remains_local_only",
      passed:
        localCoachDecisionConfig.enabled &&
        localCoachDecisionConfig.isLocalOnly &&
        localCoachDecisionConfig.externalWritesEnabled === false &&
        localCoachDecisionConfig.escalationPacketsEnabled === false &&
        localCoachDecisionPath?.blockedInHostedByCurrentGuards === true,
      message:
        "The coach decision packet remains localhost-only, with hosted guards still blocking it from being mistaken for live intervention authority.",
    },
    {
      key: "assignment_notifications_and_outbox_side_effects_stay_blocked",
      passed:
        assignmentContract.lanes.some(
          (lane) =>
            lane.key === "member_action_board" &&
            lane.status === "read_only_preview",
        ) &&
        assignmentContract.lanes.some(
          (lane) =>
            lane.key === "notification_delivery" &&
            lane.status === "blocked_pending_future_lane",
        ) &&
        notificationsContract.surfaces.some(
          (surface) =>
            surface.key === "admin_outbox_review" &&
            surface.status === "review_only",
        ) &&
        outboxWorkspace.counts.browserWritesEnabled === 0 &&
        outboxWorkspace.counts.externalWritesEnabled === 0 &&
        outboxWorkspace.blockedControls.includes("approve live sends") &&
        outboxWorkspace.blockedControls.includes("retry failed sends"),
      message:
        "Assignments, notifications, and admin outbox review all stay separate from live intervention tasks, sends, retries, or exports.",
    },
    {
      key: "provider_and_read_model_truth_stay_downstream_only",
      passed:
        notificationsAnalyticsContract.validation.ready &&
        notificationsAnalyticsContract.lanes.some(
          (lane) =>
            lane.key === "analytics_warehouse_and_reporting_truth" &&
            lane.status === "read_only_preview",
        ) &&
        notificationsAnalyticsContract.lanes.some(
          (lane) =>
            lane.key === "provider_sync_and_identity_side_effects" &&
            lane.status === "blocked_pending_future_lane",
        ),
      message:
        "Provider-fed rows and downstream analytics remain read-model or blocked lanes, not operational truth for coach interventions.",
    },
    {
      key: "points_and_proof_side_effects_stay_blocked",
      passed:
        pointsContract.lanes.some(
          (lane) =>
            lane.key === "assignment_and_follow_up_points_boundary" &&
            lane.status === "blocked_pending_future_lane",
        ) &&
        proofContract.lanes.some(
          (lane) =>
            lane.key === "campaign_proof_handoff_and_exports" &&
            lane.status === "blocked_pending_future_lane",
        ),
      message:
        "Portfolio and intervention review still cannot create points movement, proof publishing, or export-driven readiness claims.",
    },
    {
      key: "role_invariants_keep_staff_preview_out_of_member_proof",
      passed:
        roleInvariants.validation.ready &&
        roleInvariants.cases.some(
          (report) =>
            report.key === "staff_support_only" &&
            report.productionProofNote.includes("real staff/support proof class"),
        ) &&
        roleInvariants.cases.some(
          (report) =>
            report.key === "ds_admin_only" &&
            report.productionProofNote.includes("does not count as member or leader proof"),
        ),
      message:
        "Staff/support and DS/admin readiness views still stay distinct from member or leader production proof classes.",
    },
    {
      key: "blocked_sources_reject_preview_and_sample_evidence",
      passed:
        blockedSources.includes("preview-cookie") &&
        blockedSources.includes("local sandbox") &&
        blockedSources.includes("figma_seed") &&
        blockedSources.includes("localhost") &&
        blockedSources.includes("staging.mymedlife.org"),
      message:
        "Production proof import still rejects preview, sandbox, localhost, Figma/Test, and staging evidence for this lane.",
    },
    {
      key: "routes_stay_registered",
      passed: ["/coach", "/staff", "/admin/coach-write", "/admin/integration-outbox"].every(
        (route) => routeRegistry.has(route),
      ),
      message:
        "Coach, staff, coach-write packet, and integration-outbox routes still exist for review-first posture.",
    },
  ];

  return {
    title: "Coach / staff portfolio intervention-boundary safety contract: READ-ONLY readiness spec",
    summary: [
      "This contract is read-only. It does not create production interventions, mutate coach assignments, persist support notes, create follow-up tasks, send reminders, trigger providers, or create production proof.",
      "Current source supports read-only portfolio and intervention review plus one localhost-only coach decision packet. No dedicated hosted/live staff or coach intervention write path exists.",
      "Visible portfolio health, risk labels, support notes, recommendations, alerts, exports, and provider/read-model rows must stay clearly separate from operational truth and rollout evidence.",
    ],
    currentLocalWritePaths: [
      {
        route: "/admin/coach-write",
        localFunction: "app.log_coach_decision",
        requiredFlags: coachDecisionFlags,
        allowedActors: ["coach", "admin", "super_admin"],
        blockedInHostedByCurrentGuards:
          localCoachDecisionPath?.blockedInHostedByCurrentGuards ?? false,
        localOnlyReason:
          localCoachDecisionPath?.localOnlyReason ?? localCoachDecisionConfig.reason,
      },
    ],
    globalGuards: [
      "Member and leader roles must not mutate staff or coach portfolio state from visible readback surfaces.",
      "Staff and coach roles can inspect support context only unless a separate approved write lane exists.",
      "Admin and DS can inspect safety/readiness only; preview, local, provider-fed, or read-model data cannot count as production proof.",
      "Do not let notes, recommendations, alerts, exports, provider sync, or analytics rows silently become intervention truth.",
      "Test/Figma/sandbox/mock/provider/read-model data must never count as rollout evidence or invite-gate truth.",
    ],
    requiredFoundations: [
      "A dedicated hosted-disable and server-boundary review for any future intervention writes beyond localhost rehearsal.",
      "An audited persistence model for support notes, intervention status, recommendation saves, and follow-up ownership.",
      "A separate approved lane for alert delivery, outbox retries/replays, provider sync, and export execution.",
      "Role and ownership evidence showing real coach assignments and support owners before any rollout proof cites staff/coach intervention truth.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatCoachStaffPortfolioInterventionSafetyContract(
  contract: CoachStaffPortfolioInterventionSafetyContract = getCoachStaffPortfolioInterventionSafetyContract(),
): string {
  return [
    contract.title,
    "",
    "Summary:",
    ...formatList(contract.summary),
    "",
    "Current local write paths:",
    ...contract.currentLocalWritePaths.flatMap((path) => [
      `- ${path.route}`,
      `  - local function: ${path.localFunction}`,
      `  - hosted-blocked now: ${path.blockedInHostedByCurrentGuards ? "yes" : "no"}`,
      `  - local-only reason: ${path.localOnlyReason}`,
      "  - required flags:",
      ...formatNestedList(path.requiredFlags),
    ]),
    "",
    "Lanes:",
    ...contract.lanes.flatMap((lane) => [
      `- ${lane.label}`,
      `  - route: ${lane.route}`,
      `  - status: ${lane.status}`,
      `  - allowed actors: ${lane.allowedActors.join(", ")}`,
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
