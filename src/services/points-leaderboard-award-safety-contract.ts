import { getFeatureFlagDefinition } from "@/services/admin-rollout-controls-registry";
import {
  getAssignmentActionBoardSafetyContract,
} from "@/services/assignment-action-board-safety-contract";
import {
  getCampaignRushMonthDataSafetyContract,
} from "@/services/campaign-rush-month-data-safety-contract";
import { getLaunchLaneMemberPointsReadback } from "@/services/launch-lane-points-readback";
import {
  buildLaunchLaneAttendancePointsReason,
  getLaunchLaneAttendancePointsValue,
} from "@/services/launch-lane-points-policy";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberLeaderboardWorkspace } from "@/services/member-leaderboard-workspace";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import {
  getNotificationsSendSafetyContract,
} from "@/services/notifications-communications-send-safety";
import {
  getPointsKpiMaterializationPacket,
} from "@/services/points-kpi-materialization-packet";
import {
  getProofUgcConsentStorageSafetyContract,
} from "@/services/proof-ugc-consent-storage-safety-contract";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getRoleAccessInvariantsReport } from "@/services/role-access-invariants";
import {
  getBlockedProductionSignedInProofSourceMarkers,
} from "@/services/production-signed-in-route-proof-import";

export type PointsLeaderboardAwardSafetyLane = {
  key:
    | "member_points_readback"
    | "event_attendance_award_boundary"
    | "assignment_and_follow_up_points_boundary"
    | "proof_review_and_points_materialization"
    | "campaign_and_rush_points_credit"
    | "leaderboard_and_recognition_surface"
    | "rewards_provider_and_notifications"
    | "production_proof_and_rollout_evidence";
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

export type PointsLeaderboardAwardSafetyContract = {
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
  lanes: readonly PointsLeaderboardAwardSafetyLane[];
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
  "luma_attendance_import",
  "n8n_send",
  "warehouse_export",
] as const;

const lanes = [
  {
    key: "member_points_readback",
    label: "Member points readback and event-loop posture",
    route: "/app/points",
    status: "read_only_preview",
    requiredTables: ["points_events", "chapter_events", "event_rsvps", "luma_event_links"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake member points write from opening the page.",
      "No fake leaderboard mutation from readback copy.",
      "No fake award correction from browser-only state.",
      "No production truth claim from Test/Figma/sandbox/mock points rows.",
    ],
    plainEnglishRule:
      "Points and leaderboard pages can explain current readback posture, but they remain read-only and cannot award, retract, or correct points by themselves.",
    sourceOfTruth: [
      "src/services/launch-lane-points-readback.ts",
      "src/services/member-leaderboard-workspace.ts",
      "src/services/member-recognition.ts",
    ],
  },
  {
    key: "event_attendance_award_boundary",
    label: "Event attendance and RSVP award authority",
    route: "/app/events",
    status: "blocked_pending_future_lane",
    requiredTables: ["chapter_events", "event_rsvps", "points_events", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_leader", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake points award from preview attendance counts.",
      "No fake RSVP-to-points conversion.",
      "No fake check-in or attendance import counted as award proof.",
      "No browser-only points mutation from event detail review.",
    ],
    plainEnglishRule:
      "Event attendance can be shown as the future source of points, but the app still needs an approved attendance-backed award path before event counts can create real points movement.",
    sourceOfTruth: [
      "src/services/launch-lane-points-policy.ts",
      "src/services/launch-lane-points-readback.ts",
      "src/services/events-points-launch-lane.ts",
    ],
  },
  {
    key: "assignment_and_follow_up_points_boundary",
    label: "Assignment, follow-up, and task-linked points boundary",
    route: "/rush-month/actions",
    status: "blocked_pending_future_lane",
    requiredTables: ["assignments", "points_events", "kpi_events", "automation_outbox"],
    requiredFlags: [],
    allowedActors: ["chapter_leader", "super_admin"],
    forbiddenSideEffects: [
      "No fake points award on assignment create or follow-up.",
      "No fake task completion counted as leaderboard movement.",
      "No fake coach/staff override of student points truth.",
      "No notification-driven points side effect.",
    ],
    plainEnglishRule:
      "Assignments can name work that may later influence recognition, but task creation, reminder posture, and follow-up review must stay separate from points authority.",
    sourceOfTruth: [
      "src/services/assignment-action-board-safety-contract.ts",
      "src/services/member-recognition.ts",
    ],
  },
  {
    key: "proof_review_and_points_materialization",
    label: "Proof review and points/KPI materialization boundary",
    route: "/rush-month/review",
    status: "read_only_preview",
    requiredTables: ["evidence_items", "points_events", "kpi_events", "audit_logs", "integration_events", "automation_outbox"],
    requiredFlags: [],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake proof approval counted as points authority by itself.",
      "No fake KPI materialization from preview proof states.",
      "No duplicate points-row acceptance without manual review.",
      "No fake production award proof from localhost-only packet review.",
    ],
    plainEnglishRule:
      "The materialization packet can verify whether approved proof produced matching rows, but it is still an HQ safety surface, not a live award-control UI or server write boundary.",
    sourceOfTruth: [
      "src/services/points-kpi-materialization-packet.ts",
      "src/services/proof-ugc-consent-storage-safety-contract.ts",
    ],
  },
  {
    key: "campaign_and_rush_points_credit",
    label: "Campaign, Rush Month, and SLT-linked points credit",
    route: "/campaigns/rush-month",
    status: "blocked_pending_future_lane",
    requiredTables: ["campaigns", "points_events", "kpi_events", "audit_logs"],
    requiredFlags: [],
    allowedActors: ["chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake campaign points award from shell review copy.",
      "No fake Rush Month attendance or proof prompt counted as credit.",
      "No fake SLT or traveler activity counted as points movement.",
      "No fake chapter recognition proof from mock campaign totals.",
    ],
    plainEnglishRule:
      "Campaign and SLT surfaces can describe where recognition may later come from, but they must not become shortcuts to live points credit before the underlying event/proof lanes are approved.",
    sourceOfTruth: [
      "src/services/campaign-rush-month-data-safety-contract.ts",
      "src/services/slt-promotion-campaign.ts",
      "src/services/chapter-engagement-campaign.ts",
    ],
  },
  {
    key: "leaderboard_and_recognition_surface",
    label: "Leaderboard visibility and recognition-role boundary",
    route: "/app/points",
    status: "read_only_preview",
    requiredTables: ["points_events", "kpi_events", "profiles", "memberships"],
    requiredFlags: [],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake member rank mutation from preview recognition.",
      "No fake staff/admin preview counted as member award proof.",
      "No fake DS Admin ownership of student points truth.",
      "No hidden workspace escalation from leaderboard visibility alone.",
    ],
    plainEnglishRule:
      "Recognition can stay visible by role, but only the owned member/leader/staff/admin views may read it; preview access must never stand in for real student award authority.",
    sourceOfTruth: [
      "src/services/member-leaderboard-workspace.ts",
      "src/services/member-recognition.ts",
      "src/services/role-access-invariants.ts",
    ],
  },
  {
    key: "rewards_provider_and_notifications",
    label: "Smile.io, rewards, notifications, and provider/outbox sends",
    route: "/admin/integration-outbox",
    status: "blocked_pending_future_lane",
    requiredTables: ["points_events", "automation_outbox", "integration_events", "audit_logs"],
    requiredFlags: externalWriteFlagKeys,
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake Smile.io reward grant or coupon issuance.",
      "No fake reward-balance sync or redemption.",
      "No fake points reminder or celebration send.",
      "No fake provider/outbox send counted as award completion.",
    ],
    plainEnglishRule:
      "Rewards, redemptions, nudges, and downstream provider sync must stay blocked until points truth is stable and any external reward system is explicitly downstream, audited, and reversible.",
    sourceOfTruth: [
      "src/services/notifications-communications-send-safety.ts",
      "src/services/admin-rollout-controls-registry.ts",
      "docs/integration-readiness-map.md",
    ],
  },
  {
    key: "production_proof_and_rollout_evidence",
    label: "Production award proof and rollout evidence posture",
    route: "/app/points",
    status: "blocked_pending_future_lane",
    requiredTables: ["points_events", "kpi_events", "audit_logs", "signed_in_route_proof"],
    requiredFlags: [],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No Test/Figma/sandbox/mock points row counts as production proof.",
      "No localhost or staging points screenshot counts as rollout evidence.",
      "No fake leaderboard or points badge counts as invite-gate truth.",
      "No local rehearsal artifact counts as real attendance-plus-points completion proof.",
    ],
    plainEnglishRule:
      "Local points and leaderboard rehearsal is useful for QA only. Real production proof still requires actual attendance-backed rows, audit evidence, and approved production data collection.",
    sourceOfTruth: [
      "src/services/production-signed-in-route-proof-readiness.ts",
      "src/services/production-signed-in-route-proof-import.ts",
      "docs/five-chapter-pilot-proof-checklist.md",
    ],
  },
] as const satisfies readonly PointsLeaderboardAwardSafetyLane[];

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

export function getPointsLeaderboardAwardSafetyContract(): PointsLeaderboardAwardSafetyContract {
  const data = getMockReadOnlyAppData("Testing points award safety.");
  const memberActor = getMockLocalActorContext("member.a@mymedlife.test");
  const dsAdminActor = getMockLocalActorContext("ds.admin@mymedlife.test");
  const memberPointsReadback = getLaunchLaneMemberPointsReadback(memberActor, data);
  const memberRecognition = getMemberRecognitionSummary(memberActor, data);
  const memberLeaderboard = getMemberLeaderboardWorkspace(memberActor, memberRecognition);
  const dsAdminLeaderboard = getMemberLeaderboardWorkspace(
    dsAdminActor,
    getMemberRecognitionSummary(dsAdminActor, data),
  );
  const pointsPacket = getPointsKpiMaterializationPacket(
    getMockLocalActorContext("admin@mymedlife.test"),
    data,
  );
  const assignmentContract = getAssignmentActionBoardSafetyContract();
  const campaignContract = getCampaignRushMonthDataSafetyContract();
  const proofContract = getProofUgcConsentStorageSafetyContract();
  const notificationsContract = getNotificationsSendSafetyContract();
  const roleAccessInvariants = getRoleAccessInvariantsReport();
  const blockedSources = getBlockedProductionSignedInProofSourceMarkers();
  const externalWriteFlags = getExternalWriteFlagsSummary();

  const validationChecks = [
    {
      key: "launch_lane_points_policy_static",
      passed:
        getLaunchLaneAttendancePointsValue() === 20 &&
        buildLaunchLaneAttendancePointsReason("Rush Month kickoff social") ===
          "Luma pilot attendance confirmed for Rush Month kickoff social",
      message:
        "Launch-lane attendance points rule remains fixed and readable instead of browser-configurable.",
    },
    {
      key: "member_points_readback_stays_read_only",
      passed:
        memberPointsReadback !== null &&
        memberLeaderboard.browserWritesExpected === 0 &&
        memberLeaderboard.externalWritesExpected === 0,
      message:
        "Member points readback and leaderboard workspace still stay explicitly zero-write.",
    },
    {
      key: "points_ledger_posture_stays_mock_safe",
      passed:
        memberRecognition.pointsLedgerPosture === "mock_read_only" &&
        memberLeaderboard.safetyNotes.some((note) => note.includes("No points write")),
      message:
        "Recognition summary still labels the ledger as mock/read-only and warns that no points write happens from the page.",
    },
    {
      key: "points_packet_stays_hq_read_only",
      passed:
        pointsPacket.status === "blocked_until_local_supabase" &&
        pointsPacket.counts.browserWritesExpected === 0 &&
        pointsPacket.counts.externalWritesExpected === 0,
      message:
        "Points/KPI materialization packet remains an HQ read-only verification surface, not a live award write path.",
    },
    {
      key: "assignment_lane_blocks_points_award_drift",
      passed:
        assignmentContract.lanes.some(
          (lane) =>
            lane.key === "points_awards" &&
            lane.status === "blocked_pending_future_lane",
        ),
      message:
        "Assignment/action-board contract still blocks task-driven points awards and leaderboard movement.",
    },
    {
      key: "campaign_lane_blocks_points_credit_drift",
      passed:
        campaignContract.lanes.some(
          (lane) =>
            lane.key === "points_and_leaderboard_credit" &&
            lane.status === "blocked_pending_future_lane",
        ),
      message:
        "Campaign/Rush safety contract still blocks campaign-linked points credit from shell review alone.",
    },
    {
      key: "proof_lane_keeps_publishing_separate",
      passed:
        proofContract.lanes.some(
          (lane) =>
            lane.key === "hq_proof_review" &&
            lane.status === "read_only_preview",
        ) &&
        proofContract.lanes.some(
          (lane) =>
            lane.key === "campaign_proof_handoff_and_exports" &&
            lane.status === "blocked_pending_future_lane",
        ),
      message:
        "Proof/UGC contract still keeps proof review and exports separate from points authority.",
    },
    {
      key: "notification_provider_sends_stay_blocked",
      passed:
        notificationsContract.rolloutFlagPosture.approvalPolicy === "production_blocked" &&
        externalWriteFlags.length === externalWriteFlagKeys.length,
      message:
        "Reminder/provider execution remains production-blocked, including attendance import, n8n send, and warehouse export controls.",
    },
    {
      key: "role_boundary_keeps_preview_out_of_member_proof",
      passed:
        roleAccessInvariants.validation.ready &&
        dsAdminLeaderboard.canReadLeaderboard === false &&
        roleAccessInvariants.cases.some(
          (report) =>
            report.key === "ds_admin_only" &&
            report.productionProofNote.includes("does not count as member or leader proof"),
        ),
      message:
        "Role invariants still keep DS/admin preview access from counting as member or leader award authority.",
    },
    {
      key: "blocked_sources_visible_for_production_proof",
      passed:
        blockedSources.includes("preview-cookie") &&
        blockedSources.includes("local sandbox") &&
        blockedSources.includes("figma_seed") &&
        blockedSources.includes("staging.mymedlife.org"),
      message:
        "Blocked production-proof source markers still reject preview, sandbox, Figma/Test, and staging points evidence.",
    },
  ];

  return {
    title: "Points / leaderboard award authority safety contract: READ-ONLY readiness spec",
    summary: [
      "This contract is read-only. It does not award points, change leaderboard rank, redeem rewards, trigger reminder sends, or create production proof.",
      "Current source supports points readback, recognition summaries, and HQ materialization verification only. It does not expose a standalone approved points-award write boundary.",
      "Events, assignments, proof review, campaigns, SLT, rewards, and notifications must stay clearly separate from live award authority until audited award rules and provider boundaries are approved.",
    ],
    currentWritePath: {
      exists: false,
      reason:
        "No reviewed general points-award write path exists yet for attendance-backed awards, assignment-driven awards, campaign credit, leaderboard correction, or rewards/redemption.",
      blockedUntil: [
        "A server-only points-award/materialization path exists with role gates, audit rows, and duplicate protection.",
        "Attendance, proof, and campaign sources are approved as award inputs with deterministic rules.",
        "Any downstream rewards or notifications stay explicitly downstream, reversible, and production-blocked by default.",
      ],
    },
    adjacentGuardrails: [
      {
        lane: "Assignments / Action Board",
        route: "/rush-month/actions",
        currentPosture:
          "Task creation/follow-up is separated from points authority, with points awards explicitly blocked in that lane.",
      },
      {
        lane: "Campaigns / Rush Month",
        route: "/campaigns/rush-month",
        currentPosture:
          "Campaign and Rush Month review surfaces can name recognition goals, but campaign-linked points credit is explicitly blocked.",
      },
      {
        lane: "Proof / UGC consent and storage",
        route: "/proof-library",
        currentPosture:
          "Proof review can inform later materialization checks, but it does not itself grant live points authority or public proof credit.",
      },
    ],
    globalGuards: [
      "Preview-cookie, localhost, local sandbox, Test/Figma, SOP/sample, staging, and mock points/leaderboard rows do not count as production award proof, rollout evidence, or invite-gate truth.",
      "Event attendance counts, assignment statuses, proof-review labels, campaign totals, and SLT/traveler surfaces must not imply a real award happened without matching audited row readback.",
      "Disabled or mocked outbox/provider posture is review evidence only; it is not approval to send rewards, reminders, Smile.io actions, warehouse exports, or any external celebration/notification.",
      "Member, leader, staff, and admin shells may read points differently by role, but preview visibility must never stand in for real member award authority or production proof.",
    ],
    requiredFoundations: [
      "A server-only award/materialization boundary with explicit sources, duplicate protection, correction rules, and audit linkage.",
      "Approved source rules for attendance, proof, assignment, campaign, and any later SLT-linked points input.",
      "Role gates proving only the approved reviewer or materialization lane can create or correct points rows.",
      "A downstream-only rewards/redemption contract if Smile.io or any similar provider is ever introduced, with rollback and identity matching rules.",
      "Operator evidence that local/Test/Figma/sandbox/mock points data stays excluded from production signed-in proof and rollout evidence.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatPointsLeaderboardAwardSafetyContract(
  contract: PointsLeaderboardAwardSafetyContract = getPointsLeaderboardAwardSafetyContract(),
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
