import { isUuid } from "@/services/action-start-write";
import {
  getCoachDecisionWriteConfig,
  getCoachDecisionWriteReadiness,
} from "@/services/coach-decision-write";
import { getMockLocalActorContext, type LocalActorContext } from "@/services/local-actor-context";
import type { CoachDecisionInput } from "@/services/local-action-contracts";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

type EnvSource = Record<string, string | undefined>;

export type CoachDecisionPacketStatus =
  | "hidden"
  | "blocked_until_local_supabase"
  | "blocked_until_assignment"
  | "blocked_until_phase"
  | "blocked_until_flags"
  | "blocked_until_auth"
  | "ready_for_local_coach_decision"
  | "needs_manual_audit_check"
  | "evidence_observed";

export type CoachDecisionPacketCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type CoachDecisionReadbackStatus =
  | "observed"
  | "missing"
  | "manual_check_needed"
  | "disabled_outbox_observed"
  | "blocked";

export type CoachDecisionReadbackItem = {
  key: string;
  label: string;
  status: CoachDecisionReadbackStatus;
  detail: string;
};

export type CoachDecisionVerificationPacket = {
  status: CoachDecisionPacketStatus;
  canPromoteToStagingReview: boolean;
  title: string;
  plainEnglishDecision: string;
  envSettings: Array<{
    key: string;
    value: string;
    reason: string;
  }>;
  fakeCoachCredential: {
    email: string;
    passwordLabel: string;
    route: string;
  };
  operatorSequence: Array<{
    label: string;
    route: string;
    expectedProof: string;
  }>;
  safetyStops: string[];
};

export type CoachDecisionPacket = {
  canReadPacket: boolean;
  title: string;
  status: CoachDecisionPacketStatus;
  plainEnglishSummary: string;
  chapterId: string;
  campaignId: string;
  phaseId: string;
  defaultInput: CoachDecisionInput;
  checks: CoachDecisionPacketCheck[];
  readbackEvidence: CoachDecisionReadbackItem[];
  verificationPacket: CoachDecisionVerificationPacket;
  proofToCollect: string[];
  counts: {
    checks: number;
    passedChecks: number;
    observedReadbackItems: number;
    browserWritesExpected: 0 | 1;
    escalationPacketsExpected: 0;
    externalWritesExpected: 0;
  };
};

export const defaultCoachDecisionInput = {
  decision: "intervene",
  note:
    "Local coach review: chapter needs support before advancing Rush Month.",
  blockerSummary: "Rush Month proof and owner follow-up need coach support.",
} as const satisfies CoachDecisionInput;

export function getCoachDecisionPacket(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  env: EnvSource = process.env,
): CoachDecisionPacket {
  const activePhase = data.phases[0];

  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadPacket: false,
      title: "Coach decision packet hidden for this role",
      status: "hidden",
      plainEnglishSummary:
        "Coach decision activation is an HQ safety surface, not a student, chapter leader, or coach operating view.",
      chapterId: data.chapter.id,
      campaignId: data.campaign.id,
      phaseId: activePhase?.id ?? "missing-phase",
      defaultInput: defaultCoachDecisionInput,
      checks: [],
      readbackEvidence: [],
      verificationPacket: buildHiddenVerificationPacket(),
      proofToCollect: [],
      counts: emptyCounts(),
    };
  }

  const targetActor = getMockLocalActorContext(
    "coach@mymedlife.test",
    "Target coach for local coach decision testing.",
    data.source.status,
    "local_auth_session",
    env.MYMEDLIFE_AUTH_MODE === "local_supabase" ? "signed_in" : "signed_out",
  );
  const context = {
    chapterId: data.chapter.id,
    campaignId: data.campaign.id,
    phaseId: activePhase?.id ?? "missing-phase",
  };
  const writeConfig = getCoachDecisionWriteConfig(env);
  const readiness = getCoachDecisionWriteReadiness(
    targetActor,
    defaultCoachDecisionInput,
    context,
    env,
  );
  const assignmentReadbackObserved = hasLeaderAssignmentReadback(data);
  const readbackEvidence = buildReadbackEvidence(data, activePhase?.id);
  const checks = buildChecks(data, readiness, assignmentReadbackObserved, env);
  const status = getStatus(checks, writeConfig.enabled, readbackEvidence);
  const browserWritesExpected: 0 | 1 =
    status === "ready_for_local_coach_decision" ? 1 : 0;
  const verificationPacket = buildVerificationPacket(status, readbackEvidence);

  return {
    canReadPacket: true,
    title: getTitle(actor),
    status,
    plainEnglishSummary:
      "This packet prepares the fifth local Rush Month write: a fake coach records advance, hold, or intervene after assignment, proof metadata, HQ decision, and leader assignment readback have been proven. It must create readiness review, structured event, disabled escalation outbox, and audit evidence without sending any escalation packet.",
    chapterId: data.chapter.id,
    campaignId: data.campaign.id,
    phaseId: activePhase?.id ?? "missing-phase",
    defaultInput: defaultCoachDecisionInput,
    checks,
    readbackEvidence,
    verificationPacket,
    proofToCollect: [
      "Screenshot of `/admin/coach-write` before the test showing the packet is ready.",
      "Screenshot of `/coach` with the coach decision form enabled for a fake coach.",
      "Screenshot after submit showing the intervention_recorded result state.",
      "Readback proof that the phase readiness review exists.",
      "Evidence that coach_decision_logged internal event, integration event, disabled outbox row, and audit log were created.",
      "Evidence that n8n escalation packets, email, SMS, HubSpot notes, warehouse exports, Power BI, and AI summaries stayed at zero.",
    ],
    counts: {
      checks: checks.length,
      passedChecks: checks.filter((check) => check.passed).length,
      observedReadbackItems: readbackEvidence.filter((item) => {
        return item.status === "observed" || item.status === "disabled_outbox_observed";
      }).length,
      browserWritesExpected,
      escalationPacketsExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function buildChecks(
  data: ReadOnlyAppData,
  readiness: ReturnType<typeof getCoachDecisionWriteReadiness>,
  assignmentReadbackObserved: boolean,
  env: EnvSource,
): CoachDecisionPacketCheck[] {
  const localWritesRequested = env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const coachDecisionEnabled =
    env.MYMEDLIFE_ENABLE_COACH_DECISION_WRITE === "true";
  const localAuthMode = env.MYMEDLIFE_AUTH_MODE === "local_supabase";
  const activePhase = data.phases[0];

  return [
    {
      key: "local_supabase_reads",
      label: "Local Supabase read model is active",
      passed: data.source.mode === "supabase",
      detail:
        data.source.mode === "supabase"
          ? "The app is reading local Supabase data instead of mock fallback data."
          : "The app is using mock fallback data, so coach decisions cannot target real chapter/campaign/phase UUIDs.",
    },
    {
      key: "chapter_uuid",
      label: "Chapter uses a Supabase UUID",
      passed: isUuid(data.chapter.id),
      detail: isUuid(data.chapter.id)
        ? "The current chapter can be passed to app.log_coach_decision."
        : "Mock chapter IDs are intentionally blocked before coach decisions are saved.",
    },
    {
      key: "campaign_uuid",
      label: "Campaign uses a Supabase UUID",
      passed: isUuid(data.campaign.id),
      detail: isUuid(data.campaign.id)
        ? "The current campaign can be passed to app.log_coach_decision."
        : "Mock campaign IDs are intentionally blocked before coach decisions are saved.",
    },
    {
      key: "phase_uuid",
      label: "Phase uses a Supabase UUID",
      passed: Boolean(activePhase && isUuid(activePhase.id)),
      detail:
        activePhase && isUuid(activePhase.id)
          ? "The active phase can be passed to app.log_coach_decision."
          : "A real local phase UUID is required before coach decisions can be tested.",
    },
    {
      key: "assignment_readback",
      label: "Leader assignment readback has been proven",
      passed: assignmentReadbackObserved,
      detail: assignmentReadbackObserved
        ? "A prior action_assigned event, integration event, disabled outbox row, and audit log are visible."
        : "Run `/admin/assignment-write` before trying the coach decision packet.",
    },
    {
      key: "auth_mode",
      label: "Local Supabase Auth mode is selected",
      passed: localAuthMode,
      detail: localAuthMode
        ? "Local sign-in can create a fake coach seed user session."
        : "Set MYMEDLIFE_AUTH_MODE=local_supabase for the local coach decision test.",
    },
    {
      key: "local_write_flag",
      label: "Local write switch is on",
      passed: localWritesRequested,
      detail: localWritesRequested
        ? "Local Supabase writes are explicitly allowed for localhost testing."
        : "Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true only for local testing.",
    },
    {
      key: "coach_decision_flag",
      label: "Coach decision write switch is on",
      passed: coachDecisionEnabled,
      detail: coachDecisionEnabled
        ? "Only the coach decision write gate is allowed to open."
        : "Set MYMEDLIFE_ENABLE_COACH_DECISION_WRITE=true only after leader assignment readback is proven.",
    },
    toCheck(readiness, "local_auth_session", "Fake coach is signed in locally"),
    toCheck(readiness, "actor_can_log_coach_decision", "Fake actor can log coach decisions"),
    toCheck(readiness, "actor_allowed_by_write_plan", "Write plan allows coach decisions"),
    toCheck(readiness, "coach_portfolio_or_staff", "Fake coach has portfolio access"),
    toCheck(readiness, "note_long_enough", "Default coach note has context"),
    toCheck(readiness, "blocker_summary_present", "Default intervention blocker is present"),
    toCheck(readiness, "escalation_packets_disabled", "Escalation packets stay disabled"),
    toCheck(readiness, "external_writes_disabled", "External sends stay disabled"),
  ];
}

function toCheck(
  readiness: ReturnType<typeof getCoachDecisionWriteReadiness>,
  key: ReturnType<typeof getCoachDecisionWriteReadiness>["checks"][number]["key"],
  label: string,
): CoachDecisionPacketCheck {
  const check = readiness.checks.find((item) => item.key === key);

  return {
    key,
    label,
    passed: check?.passed === true,
    detail: check?.passed
      ? `${check.label} is ready.`
      : `${check?.label ?? label} is not ready.`,
  };
}

function getStatus(
  checks: CoachDecisionPacketCheck[],
  writeEnabled: boolean,
  readbackEvidence: CoachDecisionReadbackItem[],
): CoachDecisionPacketStatus {
  if (isCoachDecisionReadbackObserved(readbackEvidence)) {
    return "evidence_observed";
  }

  if (isCoachDecisionCoreObservedWithoutAudit(readbackEvidence)) {
    return "needs_manual_audit_check";
  }

  if (!isCheckPassed(checks, "local_supabase_reads")) {
    return "blocked_until_local_supabase";
  }

  if (
    !isCheckPassed(checks, "chapter_uuid") ||
    !isCheckPassed(checks, "campaign_uuid") ||
    !isCheckPassed(checks, "phase_uuid")
  ) {
    return "blocked_until_phase";
  }

  if (!isCheckPassed(checks, "assignment_readback")) {
    return "blocked_until_assignment";
  }

  if (
    !writeEnabled ||
    !isCheckPassed(checks, "local_write_flag") ||
    !isCheckPassed(checks, "coach_decision_flag") ||
    !isCheckPassed(checks, "escalation_packets_disabled")
  ) {
    return "blocked_until_flags";
  }

  if (
    !isCheckPassed(checks, "auth_mode") ||
    !isCheckPassed(checks, "local_auth_session")
  ) {
    return "blocked_until_auth";
  }

  if (checks.some((check) => !check.passed)) {
    return "blocked_until_flags";
  }

  return "ready_for_local_coach_decision";
}

function buildReadbackEvidence(
  data: ReadOnlyAppData,
  phaseId: string | undefined,
): CoachDecisionReadbackItem[] {
  const review = data.readinessReviews.find((item) => {
    return item.phase_id === phaseId &&
      item.decision_note.trim().toLowerCase() ===
        defaultCoachDecisionInput.note.trim().toLowerCase();
  });
  const event = data.eventRows.find((item) => {
    return item.event_type === "coach_decision_logged" &&
      item.campaign_id === data.campaign.id &&
      item.chapter_id === data.chapter.id;
  });
  const integrationEvent = data.integrationEventRows.find((item) => {
    return item.event_type === "coach_decision_logged" &&
      item.external_object_type === "phase_readiness_review" &&
      (review ? item.external_object_id === review.id : true);
  });
  const outbox = data.automationOutboxRows.find((item) => {
    return item.event_type === "coach_decision_logged" &&
      item.status === "disabled" &&
      (integrationEvent ? item.integration_event_id === integrationEvent.id : true);
  });
  const auditLog = data.auditLogs.find((item) => {
    return item.action === "coach_decision_logged" &&
      item.target_table === "phases" &&
      (phaseId ? item.target_id === phaseId : true);
  });

  return [
    {
      key: "readiness_review",
      label: "Phase readiness review",
      status: review ? "observed" : "missing",
      detail: review
        ? `Local readback shows coach review: ${review.readiness_status}.`
        : "No matching local coach readiness review is visible yet.",
    },
    {
      key: "internal_event",
      label: "Internal event",
      status: event ? "observed" : "missing",
      detail: event
        ? "Internal event row records coach_decision_logged."
        : "No coach_decision_logged internal event is visible yet.",
    },
    {
      key: "integration_event",
      label: "Integration event",
      status: integrationEvent ? "observed" : "missing",
      detail: integrationEvent
        ? "Integration event records future escalation packet intent without sending."
        : "No coach_decision_logged integration event is visible yet.",
    },
    {
      key: "disabled_outbox",
      label: "Disabled outbox row",
      status: outbox ? "disabled_outbox_observed" : "missing",
      detail: outbox
        ? "Automation outbox row exists with disabled status for future n8n pickup."
        : "No disabled coach decision outbox row is visible yet.",
    },
    {
      key: "audit_log",
      label: "Audit log",
      status: auditLog
        ? "observed"
        : review && event && integrationEvent && outbox
          ? "manual_check_needed"
          : "missing",
      detail: auditLog
        ? "Audit log records the guarded coach decision."
        : "Audit log proof is still missing or needs manual inspection.",
    },
  ];
}

function hasLeaderAssignmentReadback(data: ReadOnlyAppData): boolean {
  const event = data.eventRows.find((item) => {
    return item.event_type === "action_assigned";
  });
  const integrationEvent = data.integrationEventRows.find((item) => {
    return item.event_type === "action_assigned" &&
      item.external_object_type === "assignment";
  });
  const outbox = data.automationOutboxRows.find((item) => {
    return item.event_type === "action_assigned" &&
      item.status === "disabled";
  });
  const auditLog = data.auditLogs.find((item) => {
    return item.action === "action_assigned" &&
      item.target_table === "assignments";
  });

  return Boolean(event && integrationEvent && outbox && auditLog);
}

function buildVerificationPacket(
  status: CoachDecisionPacketStatus,
  readbackEvidence: CoachDecisionReadbackItem[],
): CoachDecisionVerificationPacket {
  const evidenceObserved = isCoachDecisionReadbackObserved(readbackEvidence);
  const auditNeedsManualCheck =
    isCoachDecisionCoreObservedWithoutAudit(readbackEvidence);

  return {
    status,
    canPromoteToStagingReview: evidenceObserved,
    title: "Coach decision operator packet",
    plainEnglishDecision: getPlainEnglishDecision(
      status,
      evidenceObserved,
      auditNeedsManualCheck,
    ),
    envSettings: [
      {
        key: "MYMEDLIFE_AUTH_MODE",
        value: "local_supabase",
        reason: "Use local fake seed users only.",
      },
      {
        key: "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES",
        value: "true",
        reason: "Allow localhost Supabase writes for this controlled test only.",
      },
      {
        key: "MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE",
        value: "false",
        reason: "Leader assignment readback should already be proven before coach decisions.",
      },
      {
        key: "MYMEDLIFE_ENABLE_COACH_DECISION_WRITE",
        value: "true",
        reason: "Open only the coach decision write gate.",
      },
      {
        key: "MYMEDLIFE_ENABLE_ESCALATION_SENDS",
        value: "false",
        reason: "Coach intervention must not send n8n escalation packets, email, SMS, or HubSpot notes.",
      },
    ],
    fakeCoachCredential: {
      email: "coach@mymedlife.test",
      passwordLabel: "password",
      route: "/login",
    },
    operatorSequence: [
      {
        label: "Confirm leader assignment evidence",
        route: "/admin/assignment-write",
        expectedProof:
          "Leader assignment readback is observed before coach decision testing begins.",
      },
      {
        label: "Sign in as the fake coach",
        route: "/login",
        expectedProof:
          "The app shows a local Supabase Auth session for coach@mymedlife.test.",
      },
      {
        label: "Open the coach dashboard",
        route: "/coach",
        expectedProof:
          "The coach decision form is enabled only locally for the fake coach.",
      },
      {
        label: "Record one intervention decision",
        route: "/coach",
        expectedProof:
          "The result state is intervention_recorded and no escalation packet or external automation sends.",
      },
      {
        label: "Verify readback",
        route: "/admin/coach-write",
        expectedProof:
          "Readiness review, event, integration event, disabled outbox, and audit readback are visible.",
      },
    ],
    safetyStops: [
      "Stop if the app is not reading local Supabase data.",
      "Stop if `/admin/assignment-write` has not shown leader assignment readback evidence.",
      "Stop if the chapter, campaign, or phase ID is not a Supabase UUID.",
      "Stop if n8n escalation packets, SMS, email, HubSpot, warehouse, Power BI, AI, or Luma sends appear enabled.",
      "Stop if the operator is not using a fake coach, Admin, or Super Admin local seed user.",
    ],
  };
}

function getPlainEnglishDecision(
  status: CoachDecisionPacketStatus,
  evidenceObserved: boolean,
  auditNeedsManualCheck: boolean,
): string {
  if (evidenceObserved) {
    return "Coach decision evidence is observed. Staff can review this packet for staging only after confirming no escalation packet or external send happened.";
  }

  if (auditNeedsManualCheck) {
    return "Core coach decision readback is visible, but audit proof needs manual confirmation before staging review.";
  }

  switch (status) {
    case "ready_for_local_coach_decision":
      return "Ready to run locally. Record one coach decision and collect readback evidence before any staging discussion.";
    case "blocked_until_local_supabase":
      return "Do not run. Local Supabase readback is required before coach decisions can be tested.";
    case "blocked_until_assignment":
      return "Do not run. Prove leader assignment readback before logging coach decisions.";
    case "blocked_until_phase":
      return "Do not run. A real local chapter, campaign, and phase UUID are required first.";
    case "blocked_until_flags":
      return "Do not run. Required local flags are missing or escalation automation is not safely disabled.";
    case "blocked_until_auth":
      return "Do not run. Sign in as the fake local coach before attempting a coach decision.";
    case "needs_manual_audit_check":
    case "evidence_observed":
      return "Review readback evidence before continuing.";
    case "hidden":
      return "This packet is hidden for the selected role.";
  }
}

function isCoachDecisionReadbackObserved(
  items: CoachDecisionReadbackItem[],
): boolean {
  const statuses = Object.fromEntries(items.map((item) => [item.key, item.status]));

  return statuses.readiness_review === "observed" &&
    statuses.internal_event === "observed" &&
    statuses.integration_event === "observed" &&
    statuses.disabled_outbox === "disabled_outbox_observed" &&
    statuses.audit_log === "observed";
}

function isCoachDecisionCoreObservedWithoutAudit(
  items: CoachDecisionReadbackItem[],
): boolean {
  const statuses = Object.fromEntries(items.map((item) => [item.key, item.status]));

  return statuses.readiness_review === "observed" &&
    statuses.internal_event === "observed" &&
    statuses.integration_event === "observed" &&
    statuses.disabled_outbox === "disabled_outbox_observed" &&
    statuses.audit_log === "manual_check_needed";
}

function isCheckPassed(checks: CoachDecisionPacketCheck[], key: string): boolean {
  return checks.find((check) => check.key === key)?.passed === true;
}

function buildHiddenVerificationPacket(): CoachDecisionVerificationPacket {
  return {
    status: "hidden",
    canPromoteToStagingReview: false,
    title: "Coach decision packet hidden",
    plainEnglishDecision:
      "This packet is hidden for chapter operating roles and visible only to HQ safety reviewers.",
    envSettings: [],
    fakeCoachCredential: {
      email: "coach@mymedlife.test",
      passwordLabel: "password",
      route: "/login",
    },
    operatorSequence: [],
    safetyStops: [],
  };
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin coach decision packet";
    case "ds_admin":
      return "DS Admin coach decision safety packet";
    case "super_admin":
      return "Full local coach decision packet";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Coach decision packet hidden for this role";
  }
}

function emptyCounts(): CoachDecisionPacket["counts"] {
  return {
    checks: 0,
    passedChecks: 0,
    observedReadbackItems: 0,
    browserWritesExpected: 0,
    escalationPacketsExpected: 0,
    externalWritesExpected: 0,
  };
}
