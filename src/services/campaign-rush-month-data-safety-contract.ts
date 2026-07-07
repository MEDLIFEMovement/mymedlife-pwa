import { getFeatureFlagDefinition } from "@/services/admin-rollout-controls-registry";
import {
  getAssignmentActionBoardSafetyContract,
} from "@/services/assignment-action-board-safety-contract";
import {
  getCampaignIntegrationPosture,
  getCampaignShellBySlug,
} from "@/services/campaign-ops-service";
import {
  getChapterEngagementCampaignPlan,
} from "@/services/chapter-engagement-campaign";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getNotificationsSendSafetyContract,
} from "@/services/notifications-communications-send-safety";
import {
  getProofUgcConsentStorageSafetyContract,
} from "@/services/proof-ugc-consent-storage-safety-contract";
import {
  getRushMonthEventReadinessWorkspace,
} from "@/services/rush-month-event-readiness";

export type CampaignRushMonthSafetyLane = {
  key:
    | "campaign_template_and_instance_truth"
    | "rush_month_event_review"
    | "lead_and_qr_contact_capture"
    | "assignment_and_follow_up_authority"
    | "proof_and_closeout_handoff"
    | "points_and_leaderboard_credit"
    | "provider_sync_and_funnel_exports"
    | "production_rollout_evidence";
  label: string;
  route: string;
  status:
    | "read_only_preview"
    | "blocked_pending_future_lane";
  requiredTables: readonly string[];
  requiredFlags: readonly string[];
  allowedActors: readonly string[];
  forbiddenSideEffects: readonly string[];
  plainEnglishRule: string;
  sourceOfTruth: readonly string[];
};

export type CampaignRushMonthDataSafetyContract = {
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
  lanes: readonly CampaignRushMonthSafetyLane[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

const blockedExternalWriteFlags = [
  "luma_event_create",
  "luma_event_update",
  "luma_rsvp_writeback",
  "luma_attendance_import",
  "hubspot_write",
  "n8n_send",
  "warehouse_export",
] as const;

const lanes = [
  {
    key: "campaign_template_and_instance_truth",
    label: "Campaign template and live-instance boundary",
    route: "/campaigns/rush-month",
    status: "read_only_preview",
    requiredTables: ["campaign_templates", "campaign_instances", "campaign_leads", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake campaign template save.",
      "No fake campaign launch or closeout write.",
      "No fake chapter campaign activation from shell review.",
      "No production truth claim from Test/Figma/mock campaign rows.",
    ],
    plainEnglishRule:
      "Rush Month and the starter campaigns can stay visible as source-backed planning and read-model surfaces, but template copy must not silently become a live campaign instance or chapter-owned write path.",
    sourceOfTruth: [
      "src/data/mock-campaigns.ts",
      "src/services/campaign-ops-service.ts",
      "src/services/campaign-starter-shell-readiness.ts",
      "src/services/chapter-engagement-campaign.ts",
    ],
  },
  {
    key: "rush_month_event_review",
    label: "Rush Month event, RSVP, proof, and feedback review loop",
    route: "/app/events",
    status: "read_only_preview",
    requiredTables: ["chapter_events", "luma_event_links", "event_rsvps", "event_feedback", "evidence_items"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake RSVP persistence.",
      "No fake attendance/check-in import.",
      "No fake event feedback write.",
      "No fake Luma event or attendance sync from route review.",
    ],
    plainEnglishRule:
      "The event loop can explain RSVP, attendance, NPS, and proof posture, but it remains review-only until separate write, audit, and provider gates are approved.",
    sourceOfTruth: [
      "src/services/rush-month-event-readiness.ts",
      "src/services/rush-month-event-proof-bridge.ts",
      "src/services/rush-month-operating-path.ts",
    ],
  },
  {
    key: "lead_and_qr_contact_capture",
    label: "Lead capture, QR scans, and contact intake",
    route: "/campaigns/rush-month",
    status: "blocked_pending_future_lane",
    requiredTables: ["campaign_leads", "lead_contact_methods", "qr_scans", "profiles", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake QR/contact persistence.",
      "No fake lead import or dedupe.",
      "No fake HubSpot handoff.",
      "No fake funnel analytics event from mock scans or forms.",
    ],
    plainEnglishRule:
      "Campaign lead and QR intake need a real schema, consent rules, assignment ownership, and audit trail before any contact-looking control can write or claim funnel truth.",
    sourceOfTruth: [
      "src/services/chapter-engagement-campaign.ts",
      "src/services/production-live-data-proof-request.ts",
      "docs/social-lead-source-readiness-template.md",
    ],
  },
  {
    key: "assignment_and_follow_up_authority",
    label: "Campaign follow-up ownership and assignment authority",
    route: "/rush-month/actions",
    status: "read_only_preview",
    requiredTables: ["assignments", "audit_logs", "automation_outbox"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake ownership transfer.",
      "No fake follow-up reminder send.",
      "No fake staff or leader takeover of student task truth.",
      "No fake campaign completion from preview action boards.",
    ],
    plainEnglishRule:
      "Campaign ownership can be reviewed through the action-board surfaces, but assignment creation, reminder delivery, and ownership transfer remain separately gated lanes.",
    sourceOfTruth: [
      "src/services/assignment-action-board-safety-contract.ts",
      "src/services/leader-follow-up-board.ts",
      "src/services/rush-month-operating-path.ts",
    ],
  },
  {
    key: "proof_and_closeout_handoff",
    label: "Campaign proof, consent, and closeout handoff",
    route: "/proof-library",
    status: "read_only_preview",
    requiredTables: ["evidence_items", "audit_logs", "integration_events", "automation_outbox"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake proof completion.",
      "No fake consent approval.",
      "No fake public publish or social reuse.",
      "No fake campaign closeout proof from localhost or mock review state.",
    ],
    plainEnglishRule:
      "Campaign proof can flow into review-first queues and closeout planning, but proof upload, publishing, moderation, and campaign closeout evidence remain separate approved lanes.",
    sourceOfTruth: [
      "src/services/proof-ugc-consent-storage-safety-contract.ts",
      "src/services/campaign-closeout-readiness.ts",
      "src/services/proof-sharing-review.ts",
    ],
  },
  {
    key: "points_and_leaderboard_credit",
    label: "Campaign-linked points and leaderboard credit",
    route: "/app/points",
    status: "blocked_pending_future_lane",
    requiredTables: ["points_events", "kpi_events", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_leader", "super_admin"],
    forbiddenSideEffects: [
      "No fake points awards from campaign review copy.",
      "No fake leaderboard movement from preview-only attendance or proof prompts.",
      "No fake KPI materialization from campaign templates.",
      "No browser-only points mutation from chapter event or assignment previews.",
    ],
    plainEnglishRule:
      "Campaign read models can describe how actions may later connect to points, but points and leaderboard movement still require approved attendance, proof, and audit-backed materialization.",
    sourceOfTruth: [
      "src/services/launch-lane-points-policy.ts",
      "src/services/assignment-action-board-safety-contract.ts",
      "src/services/points-kpi-materialization-packet.ts",
    ],
  },
  {
    key: "provider_sync_and_funnel_exports",
    label: "Provider sync, reminders, and funnel exports",
    route: "/admin/integration-outbox",
    status: "blocked_pending_future_lane",
    requiredTables: ["integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: blockedExternalWriteFlags,
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake HubSpot, Luma, Hootsuite, n8n, or warehouse send.",
      "No fake QR lead or campaign analytics export.",
      "No fake reminder delivery.",
      "No fake provider-linked campaign success proof.",
    ],
    plainEnglishRule:
      "Campaigns may preview future integration posture, but external delivery and analytics exports stay hard-blocked until real schemas, send/readback models, and approved hosted gates exist.",
    sourceOfTruth: [
      "src/services/notifications-communications-send-safety.ts",
      "src/services/admin-rollout-controls-registry.ts",
      "src/services/admin-integration-outbox-workspace.ts",
    ],
  },
  {
    key: "production_rollout_evidence",
    label: "Production rollout and signed-in proof posture",
    route: "/campaigns/rush-month",
    status: "blocked_pending_future_lane",
    requiredTables: ["pilot_event_proof", "points_events", "audit_logs", "automation_outbox"],
    requiredFlags: [],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No Test/Figma/sandbox/mock campaign row counts as rollout evidence.",
      "No localhost or preview-cookie campaign screenshot counts as production proof.",
      "No fake campaign closeout or funnel screenshot counts as invite-gate truth.",
      "No local rehearsal artifact counts as production signed-in role proof.",
    ],
    plainEnglishRule:
      "Campaign and Rush Month rehearsal is useful for local QA only. It must stay excluded from production signed-in proof, rollout packets, pilot evidence, and invite-gate decisions.",
    sourceOfTruth: [
      "src/services/local-vs-production-role-proof-separation.ts",
      "src/services/production-signed-in-route-proof-readiness.ts",
      "src/services/production-pilot-event-proof.ts",
    ],
  },
] as const satisfies readonly CampaignRushMonthSafetyLane[];

function getBlockedExternalWriteFlagSummary() {
  return blockedExternalWriteFlags.map((key) => {
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

    return {
      key: definition.key,
      label: definition.label,
    };
  });
}

export function getCampaignRushMonthDataSafetyContract(): CampaignRushMonthDataSafetyContract {
  const leaderActor = getMockLocalActorContext("leader.a@mymedlife.test");
  const rushMonthShell = getCampaignShellBySlug("rush-month");
  const chapterEngagementShell = getCampaignShellBySlug("chapter-engagement");
  const rushMonthIntegrationPosture = getCampaignIntegrationPosture("rush-month");
  const chapterEngagementPlan = getChapterEngagementCampaignPlan(leaderActor);
  const rushMonthEventReadiness = getRushMonthEventReadinessWorkspace(leaderActor);
  const assignmentContract = getAssignmentActionBoardSafetyContract();
  const proofContract = getProofUgcConsentStorageSafetyContract();
  const notificationsContract = getNotificationsSendSafetyContract();
  const blockedFlagSummary = getBlockedExternalWriteFlagSummary();

  const validationChecks = [
    {
      key: "rush_month_shell_active",
      passed: rushMonthShell?.status === "active",
      message:
        rushMonthShell?.status === "active"
          ? "Rush Month remains the active campaign shell, not a hidden or template-only route."
          : "Rush Month shell is missing or no longer active.",
    },
    {
      key: "starter_template_boundary_kept",
      passed: chapterEngagementShell?.status === "template",
      message:
        chapterEngagementShell?.status === "template"
          ? "Chapter Engagement still reads as a template shell rather than a live campaign instance."
          : "Chapter Engagement no longer preserves the template-vs-instance boundary.",
    },
    {
      key: "chapter_engagement_plan_stays_zero_write",
      passed:
        chapterEngagementPlan.canReadPlan &&
        chapterEngagementPlan.browserWritesExpected === 0 &&
        chapterEngagementPlan.externalWritesExpected === 0,
      message:
        chapterEngagementPlan.canReadPlan &&
        chapterEngagementPlan.browserWritesExpected === 0 &&
        chapterEngagementPlan.externalWritesExpected === 0
          ? "Campaign plans remain readable without browser or external writes."
          : "Campaign planning surface drifted into a non-read-only posture.",
    },
    {
      key: "rush_month_event_review_stays_zero_write",
      passed:
        rushMonthEventReadiness.canReadWorkspace &&
        rushMonthEventReadiness.counts.externalWritesExpected === 0,
      message:
        rushMonthEventReadiness.canReadWorkspace &&
        rushMonthEventReadiness.counts.externalWritesExpected === 0
          ? "Rush Month event review still names future loop steps without enabling writes."
          : "Rush Month event review drifted away from zero-write readiness posture.",
    },
    {
      key: "campaign_integration_posture_stays_non_sending",
      passed:
        rushMonthIntegrationPosture.safeToSendExternally === false &&
        rushMonthIntegrationPosture.events.every(
          (event) => event.status === "mocked" || event.status === "disabled",
        ),
      message:
        rushMonthIntegrationPosture.safeToSendExternally === false &&
        rushMonthIntegrationPosture.events.every(
          (event) => event.status === "mocked" || event.status === "disabled",
        )
          ? "Campaign integration posture remains mocked or disabled only."
          : "Campaign integration posture now implies a real external send path.",
    },
    {
      key: "assignment_lane_stays_non_proof",
      passed:
        assignmentContract.lanes.some(
          (lane) =>
            lane.key === "production_proof" &&
            lane.status === "blocked_pending_future_lane",
        ),
      message:
        assignmentContract.lanes.some(
          (lane) =>
            lane.key === "production_proof" &&
            lane.status === "blocked_pending_future_lane",
        )
          ? "Assignment/action-board rehearsal still cannot count as production proof."
          : "Assignment/action-board contract no longer blocks production-proof drift.",
    },
    {
      key: "proof_lane_stays_non_production",
      passed:
        proofContract.lanes.some(
          (lane) =>
            lane.key === "production_proof" &&
            lane.status === "blocked_pending_future_lane",
        ),
      message:
        proofContract.lanes.some(
          (lane) =>
            lane.key === "production_proof" &&
            lane.status === "blocked_pending_future_lane",
        )
          ? "Proof/UGC review still keeps campaign proof separate from production evidence."
          : "Proof/UGC contract no longer blocks campaign proof drift.",
    },
    {
      key: "notification_providers_stay_blocked",
      passed: notificationsContract.rolloutFlagPosture.approvalPolicy === "production_blocked",
      message:
        notificationsContract.rolloutFlagPosture.approvalPolicy === "production_blocked"
          ? "Notification/provider sends remain production-blocked."
          : "Notification/provider contract drifted away from production-blocked posture.",
    },
    {
      key: "external_write_flags_stay_blocked",
      passed: blockedFlagSummary.length === blockedExternalWriteFlags.length,
      message:
        blockedFlagSummary.length === blockedExternalWriteFlags.length
          ? `Blocked external-write controls confirmed: ${blockedFlagSummary.map((flag) => flag.key).join(", ")}.`
          : "One or more external-write rollout controls are missing.",
    },
  ];

  return {
    title: "Campaigns / Rush Month data safety contract: READ-ONLY readiness spec",
    summary: [
      "This contract is read-only. It does not create campaign templates or instances, persist QR/contact leads, launch campaigns, award points, send reminders, sync providers, or create production proof.",
      "Current source supports source-backed campaign shells, Rush Month read models, review-first proof posture, and disabled integration/outbox posture only.",
      "Campaign, Rush Month, and funnel-looking controls must stay clearly separate from real production evidence until schemas, role gates, audit trails, server boundaries, and hosted approval gates are reviewed.",
    ],
    currentWritePath: {
      exists: false,
      reason:
        "No reviewed campaign or Rush Month write schema/server boundary exists yet for template persistence, campaign launch/closeout, lead capture, QR contact intake, or provider sync.",
      blockedUntil: [
        "A real campaign template/instance schema exists with chapter ownership and audit coverage.",
        "Lead/QR/contact intake has consent, dedupe, and assignment ownership rules.",
        "Provider and outbox boundaries are reviewed with explicit hosted production-disable posture.",
      ],
    },
    adjacentGuardrails: [
      {
        lane: "Assignments / Action Board",
        route: "/rush-month/actions",
        currentPosture:
          "Preview/read-only for campaign follow-up, with localhost-only assignment creation separated into its own guarded lane.",
      },
      {
        lane: "Proof / UGC consent and storage",
        route: "/proof-library",
        currentPosture:
          "Review-first proof posture, with localhost-only private upload separated from publishing and rollout evidence.",
      },
      {
        lane: "Notifications / Communications",
        route: "/admin/integration-outbox",
        currentPosture:
          "Send posture remains production-blocked and cannot turn campaign reminder copy into delivery proof.",
      },
    ],
    globalGuards: [
      "Preview-cookie, localhost, local sandbox, Test/Figma, SOP/sample, staging, and mock campaign rows do not count as production campaign proof, rollout evidence, or invite-gate truth.",
      "Campaign template labels, QR affordances, proof prompts, points copy, and funnel metrics must not imply a live write happened without matching audited server readback.",
      "Disabled or mocked integration/outbox rows are review evidence only; they are not approval to write Luma, HubSpot, n8n, warehouse, Hootsuite, Power BI, SMS, email, or social providers.",
      "No current lane may claim real campaign launch, closeout, lead capture, reminder delivery, assignment ownership transfer, proof completion, or points movement from this contract.",
    ],
    requiredFoundations: [
      "A campaign template and instance schema with explicit chapter ownership, audit rows, and rollback posture.",
      "A lead/QR/contact intake model with consent rules, dedupe strategy, reviewer ownership, and provider handoff boundaries.",
      "Separate server-only write boundaries for campaign launch/closeout, lead intake, provider sync, and analytics export.",
      "Role gates proving members, leaders, coaches, staff, and admins only gain the campaign authority their lane actually owns.",
      "Operator evidence that local/Test/Figma/sandbox/mock campaign data stays excluded from production signed-in proof, rollout packets, pilot proof, and invite-gate decisions.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatCampaignRushMonthDataSafetyContract(
  contract: CampaignRushMonthDataSafetyContract = getCampaignRushMonthDataSafetyContract(),
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
    ...formatList(contract.currentWritePath.blockedUntil),
    "",
    "Adjacent guardrails:",
    ...contract.adjacentGuardrails.flatMap((guardrail) => [
      `- ${guardrail.lane} (${guardrail.route})`,
      `  - ${guardrail.currentPosture}`,
    ]),
    "",
    "Lanes:",
    ...contract.lanes.flatMap((lane) => [
      `- ${lane.label}`,
      `  - key: ${lane.key}`,
      `  - route: ${lane.route}`,
      `  - status: ${lane.status}`,
      `  - allowed actors: ${lane.allowedActors.join(", ")}`,
      `  - required tables: ${lane.requiredTables.join(", ")}`,
      `  - required flags: ${lane.requiredFlags.length > 0 ? lane.requiredFlags.join(", ") : "none"}`,
      `  - rule: ${lane.plainEnglishRule}`,
      ...lane.forbiddenSideEffects.map((effect) => `  - blocked: ${effect}`),
      `  - source of truth: ${lane.sourceOfTruth.join(", ")}`,
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
      (check) => `- ${check.passed ? "PASS" : "FAIL"} ${check.key}: ${check.message}`,
    ),
  ].join("\n");
}

function formatList(items: readonly string[]): string[] {
  return items.map((item) => `- ${item}`);
}
