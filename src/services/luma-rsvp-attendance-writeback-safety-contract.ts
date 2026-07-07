import { getFeatureFlagDefinition } from "@/services/admin-rollout-controls-registry";
import { getAdminLumaIntegrationStatus } from "@/services/admin-luma-integration-status";
import { getChapterLumaRolloutReadiness } from "@/services/chapter-luma-calendars";
import { getEventLoopPilotFoundation } from "@/services/event-loop-pilot-foundation";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getBlockedProductionPilotProofSourceMarkers } from "@/services/production-pilot-event-proof-import";
import { getBlockedProductionSignedInProofSourceMarkers } from "@/services/production-signed-in-route-proof-import";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

export type LumaRsvpAttendanceWritebackSafetyLane = {
  key:
    | "luma_event_authority"
    | "luma_reminders_and_webhooks"
    | "rsvp_writeback_authority"
    | "attendance_import_authority"
    | "points_and_leaderboard_authority"
    | "provider_replay_retry_rollback"
    | "production_evidence_and_rollout_boundary";
  label: string;
  route: string;
  status: "read_only_preview" | "blocked_pending_future_lane";
  requiredFlags: readonly string[];
  requiredTables: readonly string[];
  allowedActors: readonly string[];
  forbiddenSideEffects: readonly string[];
  plainEnglishRule: string;
  sourceOfTruth: readonly string[];
};

export type LumaRsvpAttendanceWritebackSafetyContract = {
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
  lanes: readonly LumaRsvpAttendanceWritebackSafetyLane[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

const blockedLumaFlags = [
  "luma_event_create",
  "luma_event_update",
  "luma_rsvp_writeback",
  "luma_attendance_import",
] as const;

const lanes = [
  {
    key: "luma_event_authority",
    label: "Luma event create, update, and delete authority",
    route: "/admin/integrations/luma",
    status: "blocked_pending_future_lane",
    requiredFlags: ["luma_event_create", "luma_event_update"],
    requiredTables: ["chapter_events", "luma_event_links", "integration_events", "audit_logs"],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake Luma event create.",
      "No fake Luma event update or delete.",
      "No browser review path may imply provider-side event truth changed.",
      "No provider/Test/Figma/sandbox/mock/staging/sample event row counts as pilot or rollout evidence.",
    ],
    plainEnglishRule:
      "Luma-linked event posture may be reviewed from admin and launch-lane event surfaces, but myMEDLIFE does not yet have approved authority to create, update, or delete provider events.",
    sourceOfTruth: [
      "src/services/admin-rollout-controls-registry.ts",
      "src/services/admin-luma-integration-status.ts",
      "src/services/chapter-luma-calendars.ts",
    ],
  },
  {
    key: "luma_reminders_and_webhooks",
    label: "Luma reminders, broadcasts, and webhook activation",
    route: "/admin/integration-outbox",
    status: "blocked_pending_future_lane",
    requiredFlags: ["luma_event_create", "luma_event_update"],
    requiredTables: ["integration_events", "automation_outbox", "audit_logs"],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake reminder delivery.",
      "No fake webhook activation or execution.",
      "No fake provider broadcast readback from disabled or mocked rows.",
      "No provider replay, retry, rollback, or zero-send claim from preview-only outbox posture.",
    ],
    plainEnglishRule:
      "Admin can inspect disabled outbox and Luma integration posture, but reminders, broadcasts, and webhook execution stay fully blocked until a separate approved provider lane exists.",
    sourceOfTruth: [
      "src/services/admin-luma-integration-status.ts",
      "src/services/integration-contract-review.ts",
      "src/services/event-loop-pilot-foundation.ts",
    ],
  },
  {
    key: "rsvp_writeback_authority",
    label: "RSVP writeback from myMEDLIFE into Luma",
    route: "/app/events",
    status: "blocked_pending_future_lane",
    requiredFlags: ["luma_rsvp_writeback"],
    requiredTables: ["event_rsvps", "luma_event_links", "integration_events", "audit_logs"],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake RSVP writeback from member or leader browser flows.",
      "No fake RSVP sync as operational truth for attendance or staffing decisions.",
      "No fake reminders or follow-up delivery triggered by RSVP preview state.",
      "No local/Test RSVP row counts as provider proof or pilot proof.",
    ],
    plainEnglishRule:
      "Launch-lane events can show RSVP posture and local rehearsal state, but RSVP intent must not be written back into Luma or treated as provider-authoritative truth.",
    sourceOfTruth: [
      "src/services/event-loop-pilot-foundation.ts",
      "src/services/event-loop-data-auth-readiness.ts",
      "src/services/admin-rollout-controls-registry.ts",
    ],
  },
  {
    key: "attendance_import_authority",
    label: "Attendance and check-in import authority",
    route: "/leader?view=events",
    status: "blocked_pending_future_lane",
    requiredFlags: ["luma_attendance_import"],
    requiredTables: ["event_attendance", "luma_event_links", "integration_events", "audit_logs"],
    allowedActors: ["chapter_leader", "coach", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake attendance or check-in import.",
      "No fake attendance truth from provider rows without reconciled audit readback.",
      "No fake chapter-event fallback counts treated as production attendance proof.",
      "No browser-visible check-in posture may claim approved provider import authority.",
    ],
    plainEnglishRule:
      "Attendance and check-in may be rehearsed locally, but imported provider attendance cannot become operational truth until duplicate handling, reconciliation, and audit coverage are separately approved.",
    sourceOfTruth: [
      "src/services/production-pilot-event-proof.ts",
      "src/services/production-pilot-event-proof-import.ts",
      "src/services/event-loop-pilot-foundation.ts",
    ],
  },
  {
    key: "points_and_leaderboard_authority",
    label: "Points and leaderboard movement from provider rows",
    route: "/app/points",
    status: "blocked_pending_future_lane",
    requiredFlags: ["luma_attendance_import"],
    requiredTables: ["points_events", "event_attendance", "luma_event_links", "audit_logs"],
    allowedActors: ["chapter_leader", "admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake points awards from Luma RSVP or attendance rows.",
      "No fake leaderboard movement from provider-import preview posture.",
      "No fake automation or outbox side effects from points materialization.",
      "No local/Test/Figma points movement counts as production pilot evidence.",
    ],
    plainEnglishRule:
      "Provider attendance may eventually feed points, but no Luma-linked RSVP or attendance row may move points or leaderboards until a separate audited materialization lane is approved.",
    sourceOfTruth: [
      "src/services/points-leaderboard-award-safety-contract.ts",
      "src/services/launch-lane-points-policy.ts",
      "src/services/production-pilot-event-proof.ts",
    ],
  },
  {
    key: "provider_replay_retry_rollback",
    label: "Provider replay, retry, rollback, and zero-send claims",
    route: "/admin/integration-outbox",
    status: "blocked_pending_future_lane",
    requiredFlags: ["luma_event_create", "luma_event_update", "luma_rsvp_writeback", "luma_attendance_import"],
    requiredTables: ["integration_events", "automation_outbox", "audit_logs"],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No fake retry or replay approval.",
      "No fake rollback claim after provider-side drift.",
      "No fake zero-send posture treated as send authority.",
      "No preview-only outbox row counts as hosted provider proof.",
    ],
    plainEnglishRule:
      "Outbox and provider rows can be inspected for readiness, but replay, retry, rollback, dead-letter mutation, and zero-send claims remain blocked until a separately reviewed hosted provider lane exists.",
    sourceOfTruth: [
      "src/services/admin-luma-integration-status.ts",
      "src/services/integration-contract-review.ts",
      "src/services/notifications-communications-send-safety.ts",
    ],
  },
  {
    key: "production_evidence_and_rollout_boundary",
    label: "Production proof, rollout packet, live counts, and invite-gate boundary",
    route: "/admin/launch-gate",
    status: "blocked_pending_future_lane",
    requiredFlags: [],
    requiredTables: ["pilot_event_proof", "signed_in_route_proof", "audit_logs", "automation_outbox"],
    allowedActors: ["admin", "ds_admin", "super_admin"],
    forbiddenSideEffects: [
      "No provider/Test/Figma/sandbox/mock/staging/sample data counts as pilot proof.",
      "No provider-linked local rehearsal row counts as production signed-in proof.",
      "No provider screenshot or localhost proof counts as rollout packet evidence, live counts, or invite-gate truth.",
      "No provider-side zero-send or disabled rows count as final production approval evidence.",
    ],
    plainEnglishRule:
      "Luma-linked rehearsal and admin review are useful local safety signals only. They must stay excluded from pilot proof, production signed-in role proof, rollout packet evidence, live counts, and final invite-gate decisions.",
    sourceOfTruth: [
      "src/services/production-pilot-event-proof-import.ts",
      "src/services/production-signed-in-route-proof-import.ts",
      "src/services/local-vs-production-role-proof-separation.ts",
    ],
  },
] as const satisfies readonly LumaRsvpAttendanceWritebackSafetyLane[];

function getBlockedLumaFlagSummary() {
  return blockedLumaFlags.map((key) => {
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

export function getLumaRsvpAttendanceWritebackSafetyContract(): LumaRsvpAttendanceWritebackSafetyContract {
  const adminActor = getMockLocalActorContext("ds.admin@mymedlife.test");
  const mockData = getMockReadOnlyAppData(
    "Mock-safe Luma writeback safety contract review uses local read-only app data only.",
  );
  const lumaStatus = getAdminLumaIntegrationStatus(adminActor, mockData);
  const pilotFoundation = getEventLoopPilotFoundation(mockData);
  const lumaRolloutReadiness = getChapterLumaRolloutReadiness();
  const blockedFlagSummary = getBlockedLumaFlagSummary();
  const blockedPilotSourceMarkers = getBlockedProductionPilotProofSourceMarkers();
  const blockedSignedInSourceMarkers = getBlockedProductionSignedInProofSourceMarkers();

  const validationChecks = [
    {
      key: "blocked_luma_flags_stay_blocked",
      passed: blockedFlagSummary.length === blockedLumaFlags.length,
      message:
        blockedFlagSummary.length === blockedLumaFlags.length
          ? `Blocked Luma rollout controls confirmed: ${blockedFlagSummary.map((flag) => flag.key).join(", ")}.`
          : "One or more blocked Luma rollout controls are missing.",
    },
    {
      key: "admin_luma_surface_stays_zero_write",
      passed:
        lumaStatus.canReadWorkspace &&
        lumaStatus.counts.externalWritesEnabled === 0 &&
        lumaStatus.counts.browserSecretsShown === 0,
      message:
        lumaStatus.canReadWorkspace &&
        lumaStatus.counts.externalWritesEnabled === 0 &&
        lumaStatus.counts.browserSecretsShown === 0
          ? "Admin Luma status remains readable without secrets exposure or external writes."
          : "Admin Luma status drifted away from zero-write, zero-secret posture.",
    },
    {
      key: "pilot_foundation_stays_zero_send",
      passed:
        pilotFoundation.safety.externalWritesEnabled === false &&
        pilotFoundation.safety.liveLumaSendRows === 0,
      message:
        pilotFoundation.safety.externalWritesEnabled === false &&
        pilotFoundation.safety.liveLumaSendRows === 0
          ? "Event-loop pilot foundation still keeps Luma sends disabled."
          : "Pilot foundation now implies live Luma sends are enabled.",
    },
    {
      key: "luma_mapping_readiness_stays_read_only",
      passed:
        lumaRolloutReadiness.length >= 4 &&
        lumaRolloutReadiness.every((stage) => typeof stage.detail === "string"),
      message:
        lumaRolloutReadiness.length >= 4 &&
        lumaRolloutReadiness.every((stage) => typeof stage.detail === "string")
          ? "Chapter Luma rollout readiness remains mapping-only and descriptive, not a provider writeback switch."
          : "Chapter Luma rollout readiness no longer provides the expected mapping-only posture.",
    },
    {
      key: "pilot_proof_sources_block_local_and_mock_markers",
      passed:
        blockedPilotSourceMarkers.includes("local sandbox") &&
        blockedPilotSourceMarkers.includes("figma_seed") &&
        blockedPilotSourceMarkers.includes("staging.mymedlife.org"),
      message:
        blockedPilotSourceMarkers.includes("local sandbox") &&
        blockedPilotSourceMarkers.includes("figma_seed") &&
        blockedPilotSourceMarkers.includes("staging.mymedlife.org")
          ? "Pilot proof import still rejects local, figma_seed, and staging markers."
          : "Pilot proof import no longer blocks one or more local/mock/staging markers.",
    },
    {
      key: "signed_in_proof_sources_block_local_and_mock_markers",
      passed:
        blockedSignedInSourceMarkers.includes("local sandbox") &&
        blockedSignedInSourceMarkers.includes("figma_seed") &&
        blockedSignedInSourceMarkers.includes("staging.mymedlife.org"),
      message:
        blockedSignedInSourceMarkers.includes("local sandbox") &&
        blockedSignedInSourceMarkers.includes("figma_seed") &&
        blockedSignedInSourceMarkers.includes("staging.mymedlife.org")
          ? "Signed-in proof import still rejects local, figma_seed, and staging markers."
          : "Signed-in proof import no longer blocks one or more local/mock/staging markers.",
    },
  ];

  return {
    title: "Luma RSVP / attendance-import / event-writeback safety contract: READ-ONLY readiness spec",
    summary: [
      "This contract is read-only. It does not call Luma, create or update provider events, activate reminders or webhooks, write RSVP intent back to Luma, import attendance, award points, or claim provider proof.",
      "Current source supports source-backed event review, Luma mapping visibility, disabled outbox posture, and local pilot/readiness evidence only.",
      "Provider-looking RSVP, attendance, points, retry, and proof language must stay clearly separate from operational truth until a future approved server boundary, audit model, and hosted rollback posture exist.",
    ],
    currentWritePath: {
      exists: false,
      reason:
        "No reviewed Luma provider write boundary exists yet for event create/update/delete, RSVP writeback, attendance import, reminder/webhook activation, or points materialization from provider rows.",
      blockedUntil: [
        "A dedicated server-only Luma write boundary exists with explicit local/dev and hosted-production gates.",
        "RSVP, attendance import, duplicate handling, and rollback behavior are audited and covered by local DB and hosted acceptance tests.",
        "Points materialization from provider attendance is approved as a separate audited lane.",
        "Provider replay, retry, dead-letter, and zero-send semantics are reviewed with human-owned recovery.",
      ],
    },
    adjacentGuardrails: [
      {
        lane: "Admin Luma status",
        route: "/admin/integrations/luma",
        currentPosture:
          "Admin can inspect mapping, test posture, outbox safety, and blocked controls without provider calls or secret exposure.",
      },
      {
        lane: "Event-loop pilot foundation",
        route: "/app/events",
        currentPosture:
          "Local pilot/readback paths can show event, RSVP, attendance, and points posture while live Luma sends remain disabled.",
      },
      {
        lane: "Production Luma mapping readiness",
        route: "/admin/launch-gate",
        currentPosture:
          "Chapter-to-Luma rollout readiness names mapping foundations and widening stages only; it does not enable create, RSVP writeback, or attendance import authority.",
      },
    ],
    globalGuards: [
      "Luma event create/update/delete remain blocked by production-blocked rollout controls.",
      "Luma reminders, broadcasts, and webhook execution remain blocked even when provider-looking surfaces are visible.",
      "RSVP writeback and attendance import remain separate future audited lanes; local or preview event-loop posture cannot silently become provider truth.",
      "Points and leaderboard movement cannot be materialized from Luma/provider rows in this contract.",
      "Provider replay, retry, rollback, dead-letter mutation, and zero-send claims remain blocked from preview, local, staging, and admin review surfaces.",
      "Provider/Test/Figma/sandbox/mock/staging/sample evidence does not count as pilot proof, signed-in production proof, rollout packet evidence, live counts, or invite-gate truth.",
    ],
    requiredFoundations: [
      "A reviewed server-only Luma write boundary with explicit localhost-only and hosted-production-disabled defaults.",
      "An RSVP writeback model with actor ownership, reconciliation rules, audit rows, and failure handling.",
      "An attendance import model with duplicate/walk-in reconciliation, chapter scope, audit rows, and rollback posture.",
      "A separate audited points materialization lane proving provider attendance cannot directly move leaderboards without approval.",
      "Hosted provider/outbox controls for reminder/webhook execution, replay/retry, and zero-send proof that stay off by default.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatLumaRsvpAttendanceWritebackSafetyContract(
  contract: LumaRsvpAttendanceWritebackSafetyContract = getLumaRsvpAttendanceWritebackSafetyContract(),
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
