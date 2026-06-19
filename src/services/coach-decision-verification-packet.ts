import { isUuid } from "@/services/action-start-write";
import {
  getCoachDecisionWriteConfig,
  getCoachDecisionWriteReadiness,
} from "@/services/coach-decision-write";
import { getCoachSupportNotesWorkspace } from "@/services/coach-support-notes";
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
  roleCoverage: CoachDecisionRoleCoverage[];
  coverageChecklist: CoachDecisionCoverageItem[];
  supportNotesSummary: CoachSupportNotesSummary;
  rollbackPlan: string[];
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

export type CoachDecisionRoleCoverage = {
  role: string;
  packetAccess: string;
  noteVisibility: string;
  decisionAccess: string;
  truthOwnership: string;
  auditExpectation: string;
};

export type CoachDecisionCoverageStatus = "covered" | "locked";

export type CoachDecisionCoverageItem = {
  key: string;
  label: string;
  status: CoachDecisionCoverageStatus;
  detail: string;
  route: string;
};

export type CoachSupportNotesSummary = {
  title: string;
  summary: string;
  canReadNotes: boolean;
  visibleNotes: number;
  coachPrivate: number;
  hqSupport: number;
  chapterFollowUp: number;
  blockedControls: string[];
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
  const supportNotesSummary = buildSupportNotesSummary(actor, data);
  const verificationPacket = buildVerificationPacket(
    status,
    readbackEvidence,
    supportNotesSummary,
  );

  return {
    canReadPacket: true,
    title: getTitle(actor),
    status,
    plainEnglishSummary:
      "This packet prepares the staff chapter decision and coach note path: a fake coach records advance, hold, or intervene after the earlier Rush Month and SLT review lanes are proven. It must keep coach-private notes scoped, create readiness review plus event and audit evidence together, and leave every nudge, escalation packet, and external send at zero.",
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
      "Evidence that coach note visibility stayed scoped and DS Admin remained safety-only.",
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
  supportNotesSummary: CoachSupportNotesSummary,
): CoachDecisionVerificationPacket {
  const evidenceObserved = isCoachDecisionReadbackObserved(readbackEvidence);
  const auditNeedsManualCheck =
    isCoachDecisionCoreObservedWithoutAudit(readbackEvidence);

  return {
    status,
    canPromoteToStagingReview: evidenceObserved,
    title: "Staff chapter decision and coach note packet",
    plainEnglishDecision: getPlainEnglishDecision(
      status,
      evidenceObserved,
      auditNeedsManualCheck,
    ),
    roleCoverage: buildRoleCoverage(),
    coverageChecklist: buildCoverageChecklist(supportNotesSummary),
    supportNotesSummary,
    rollbackPlan: [
      "If the wrong decision is logged, record a new correction event with a plain-English reason instead of silently overwriting the earlier chapter decision.",
      "If a note should move from coach-private to chapter follow-up, rewrite it as a new scoped follow-up note rather than exposing the original coach-private text broadly.",
      "If escalation is truly needed, stop at the packet boundary and get separate approval before any n8n send, HubSpot write, email, SMS, or downstream automation is enabled.",
    ],
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
    roleCoverage: [],
    coverageChecklist: [],
    supportNotesSummary: emptySupportNotesSummary(),
    rollbackPlan: [],
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

function buildRoleCoverage(): CoachDecisionRoleCoverage[] {
  return [
    {
      role: "Coach",
      packetAccess: "Operating route only",
      noteVisibility: "Coach-private and chapter follow-up notes on /coach",
      decisionAccess: "Can log one local decision for assigned portfolio chapters",
      truthOwnership:
        "Owns the support recommendation only inside assigned chapter scope.",
      auditExpectation:
        "Decision, readiness review, integration event, disabled outbox, and audit rows must all tie back to the coach and phase.",
    },
    {
      role: "Admin / Super Admin",
      packetAccess: "Full review packet",
      noteVisibility: "HQ support notes plus visibility policy review",
      decisionAccess: "Can rehearse the guarded local path for review",
      truthOwnership:
        "Can inspect and rehearse the path, but corrections still require a new audited event instead of silent history edits.",
      auditExpectation:
        "Admin review must stay chapter-scoped, explicit, and fully auditable.",
    },
    {
      role: "DS Admin",
      packetAccess: "Safety-only packet",
      noteVisibility: "No raw coach-private notes",
      decisionAccess: "Blocked from owning chapter truth",
      truthOwnership:
        "Can inspect the safety packet and audit posture only.",
      auditExpectation:
        "DS review stops at packet evidence; no decision ownership, note ownership, or student/chapter truth mutation is allowed here.",
    },
    {
      role: "Chapter Leader / Member",
      packetAccess: "Hidden",
      noteVisibility: "No coach note access through this path",
      decisionAccess: "Blocked",
      truthOwnership:
        "Should stay on member and chapter operating routes instead of the HQ safety packet.",
      auditExpectation:
        "No chapter-role shortcut should bypass the coach/staff decision guardrails.",
    },
  ];
}

function buildCoverageChecklist(
  supportNotesSummary: CoachSupportNotesSummary,
): CoachDecisionCoverageItem[] {
  return [
    {
      key: "decision_categories",
      label: "Decision categories and escalation posture",
      status: "covered",
      detail:
        "The path explicitly rehearses advance, hold, and intervene. Intervene still requires a blocker summary, and escalation packets stay disabled even when intervention is chosen.",
      route: "/coach",
    },
    {
      key: "portfolio_scope",
      label: "Portfolio scope and staff ownership",
      status: "covered",
      detail:
        "Only a coach with assigned portfolio access, Admin, or Super Admin can pass the local write checks. DS Admin can inspect the packet but cannot own the decision path.",
      route: "/admin/coach-write",
    },
    {
      key: "private_notes",
      label: "Private note visibility",
      status: "covered",
      detail: supportNotesSummary.canReadNotes
        ? `${supportNotesSummary.visibleNotes} visible note(s) stay scoped across coach-private, HQ support, and chapter follow-up lanes without opening raw coach-private text to DS Admin.`
        : "This role can inspect the safety packet only. Raw coach-private notes remain hidden by design.",
      route: "/coach",
    },
    {
      key: "duplicate_and_correction",
      label: "Duplicate and correction handling",
      status: "covered",
      detail:
        "Duplicate or final-state follow-up should stop in review. Any correction must create a fresh readiness review, event, integration row, disabled outbox row, and audit entry instead of mutating history in place.",
      route: "/admin/coach-write",
    },
    {
      key: "downstream_locks",
      label: "Nudges and downstream automation stay locked",
      status: "locked",
      detail:
        "Member nudges, escalation packets, HubSpot updates, n8n sends, warehouse exports, Power BI updates, AI summaries, and other downstream automation remain disabled for this path.",
      route: "/admin/integration-outbox",
    },
  ];
}

function buildSupportNotesSummary(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): CoachSupportNotesSummary {
  const workspace = getCoachSupportNotesWorkspace(actor, data);

  if (!workspace.canReadWorkspace) {
    return {
      title: "Coach notes remain hidden for this role",
      summary:
        actor.audience === "ds_admin"
          ? "DS Admin can inspect the safety packet, but coach-private notes and chapter-truth ownership stay locked."
          : "Use the coach or HQ support route to inspect note visibility and follow-up posture.",
      canReadNotes: false,
      visibleNotes: 0,
      coachPrivate: 0,
      hqSupport: 0,
      chapterFollowUp: 0,
      blockedControls: [
        "coach note save",
        "coach decision save",
        "member nudge",
        "escalation packet send",
        "external automation",
      ],
    };
  }

  return {
    title: workspace.title,
    summary: workspace.summary,
    canReadNotes: true,
    visibleNotes: workspace.notes.length,
    coachPrivate: workspace.notes.filter((note) => note.visibility === "coach_private")
      .length,
    hqSupport: workspace.notes.filter((note) => note.visibility === "hq_support")
      .length,
    chapterFollowUp: workspace.notes.filter(
      (note) => note.visibility === "chapter_follow_up",
    ).length,
    blockedControls: workspace.interventionChecklist.blockedControls,
  };
}

function emptySupportNotesSummary(): CoachSupportNotesSummary {
  return {
    title: "Coach notes summary unavailable",
    summary: "",
    canReadNotes: false,
    visibleNotes: 0,
    coachPrivate: 0,
    hqSupport: 0,
    chapterFollowUp: 0,
    blockedControls: [],
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
