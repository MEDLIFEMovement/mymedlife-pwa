import {
  getActionStartWriteConfig,
  getActionStartWriteReadiness,
  isUuid,
} from "@/services/action-start-write";
import { getMockLocalActorContext, type LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { Assignment } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type FirstWriteDrillStatus =
  | "ready_for_local_action_start"
  | "blocked_until_local_supabase"
  | "blocked_until_flags"
  | "blocked_until_auth"
  | "hidden";

export type FirstWriteDrillCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type FirstWriteDrillStep = {
  key: string;
  label: string;
  route: string;
  localActorEmail: string;
  plainEnglish: string;
  expectedResult: string;
  structuredEvents: string[];
  safetyBoundary: string;
};

export type FirstWriteReadbackEvidenceStatus =
  | "observed"
  | "missing"
  | "safe_zero"
  | "manual_check_needed"
  | "blocked";

export type FirstWriteReadbackEvidenceItem = {
  key: string;
  label: string;
  status: FirstWriteReadbackEvidenceStatus;
  detail: string;
};

export type FirstWriteVerificationPacketStatus =
  | "blocked"
  | "ready_to_run_locally"
  | "needs_manual_audit_check"
  | "evidence_observed";

export type FirstWriteVerificationPacket = {
  status: FirstWriteVerificationPacketStatus;
  title: string;
  plainEnglishDecision: string;
  canPromoteToStagingReview: boolean;
  envSettings: Array<{
    key: string;
    value: string;
    reason: string;
  }>;
  fakeMemberCredential: {
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

export type FirstWriteActivationDrill = {
  canReadDrill: boolean;
  title: string;
  status: FirstWriteDrillStatus;
  plainEnglishSummary: string;
  candidateAssignment:
    | {
        id: string;
        title: string;
        status: Assignment["status"];
        route: string;
        usesSupabaseUuid: boolean;
      }
    | null;
  checks: FirstWriteDrillCheck[];
  steps: FirstWriteDrillStep[];
  readbackEvidence: FirstWriteReadbackEvidenceItem[];
  verificationPacket: FirstWriteVerificationPacket;
  proofToCollect: string[];
  counts: {
    checks: number;
    passedChecks: number;
    observedReadbackItems: number;
    browserWritesExpected: 0 | 1;
    externalWritesExpected: 0;
  };
};

export function getFirstWriteActivationDrill(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  env: EnvSource = process.env,
): FirstWriteActivationDrill {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadDrill: false,
      title: "First-write drill hidden for this role",
      status: "hidden",
      plainEnglishSummary:
        "First-write activation is an HQ safety surface, not a student or chapter operating view.",
      candidateAssignment: null,
      checks: [],
      steps: [],
      readbackEvidence: [],
      verificationPacket: buildHiddenVerificationPacket(),
      proofToCollect: [],
      counts: emptyCounts(),
    };
  }

  const candidateAssignment = findCandidateAssignment(data.assignments);
  const targetActor = getMockLocalActorContext(
    "member.a@mymedlife.test",
    "Target pilot member for the first action-start write drill.",
    data.source.status,
    "local_auth_session",
    env.MYMEDLIFE_AUTH_MODE === "local_supabase" ? "signed_in" : "signed_out",
  );
  const writeConfig = getActionStartWriteConfig(env);
  const readiness = candidateAssignment
    ? getActionStartWriteReadiness(targetActor, candidateAssignment, env)
    : null;
  const candidate = candidateAssignment ? toCandidate(candidateAssignment) : null;
  const checks = buildChecks(data, candidateAssignment, readiness, env);
  const status = getStatus(checks, writeConfig.enabled);
  const browserWritesExpected: 0 | 1 =
    status === "ready_for_local_action_start" ? 1 : 0;
  const readbackEvidence = buildReadbackEvidence(data, candidate);
  const verificationPacket = buildVerificationPacket(
    status,
    candidate,
    checks,
    readbackEvidence,
  );

  return {
    canReadDrill: true,
    title: getTitle(actor),
    status,
    plainEnglishSummary:
      "This drill turns the first possible MVP save into a controlled local test: one member starts one Rush Month assignment, then staff confirm assignment status, event, integration event, and audit log readback. It does not approve production writes.",
    candidateAssignment: candidate,
    checks,
    steps: buildSteps(candidate),
    readbackEvidence,
    verificationPacket,
    proofToCollect: [
      "Screenshot of `/admin/first-write` before the test showing every required check green.",
      "Screenshot of the selected action detail route before clicking Start this action.",
      "Screenshot after redirect showing the `started` result state.",
      "Readback proof that assignment status is `in_progress`.",
      "Evidence that an internal event, integration event, and audit log row were created.",
      "Evidence that automation outbox sends and external writes stayed at zero.",
    ],
    counts: {
      checks: checks.length,
      passedChecks: checks.filter((check) => check.passed).length,
      observedReadbackItems: readbackEvidence.filter((item) => {
        return item.status === "observed" || item.status === "safe_zero";
      }).length,
      browserWritesExpected,
      externalWritesExpected: 0,
    },
  };
}

function findCandidateAssignment(assignments: Assignment[]): Assignment | null {
  return (
    assignments.find((assignment) => {
      return (
        assignment.lane === "Member" &&
        isStartableAssignment(assignment)
      );
    }) ??
    assignments.find((assignment) => assignment.lane === "Member") ??
    assignments.find((assignment) => {
      return isStartableAssignment(assignment);
    }) ??
    assignments[0] ??
    null
  );
}

function isStartableAssignment(assignment: Assignment): boolean {
  return (
    assignment.status === "not_started" ||
    assignment.status === "changes_requested"
  );
}

function toCandidate(assignment: Assignment) {
  return {
    id: assignment.id,
    title: assignment.title,
    status: assignment.status,
    route: `/rush-month/actions/${assignment.id}`,
    usesSupabaseUuid: isUuid(assignment.id),
  };
}

function buildChecks(
  data: ReadOnlyAppData,
  assignment: Assignment | null,
  readiness: ReturnType<typeof getActionStartWriteReadiness> | null,
  env: EnvSource,
): FirstWriteDrillCheck[] {
  const localWritesRequested = env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const actionStartEnabled = env.MYMEDLIFE_ENABLE_ACTION_START_WRITE === "true";
  const localAuthMode = env.MYMEDLIFE_AUTH_MODE === "local_supabase";

  return [
    {
      key: "local_supabase_reads",
      label: "Local Supabase read model is active",
      passed: data.source.mode === "supabase",
      detail:
        data.source.mode === "supabase"
          ? "The app is reading local Supabase data instead of mock fallback data."
          : "The app is using mock fallback data, so the first write drill cannot target a real assignment UUID.",
    },
    {
      key: "candidate_assignment",
      label: "A startable assignment exists",
      passed: Boolean(assignment),
      detail: assignment
        ? `Candidate action: ${assignment.title}.`
        : "No assignment is available for action-start testing.",
    },
    {
      key: "candidate_assignment_uuid",
      label: "Candidate assignment uses a Supabase UUID",
      passed: Boolean(assignment && isUuid(assignment.id)),
      detail:
        assignment && isUuid(assignment.id)
          ? "The candidate action can be passed to app.start_assignment_action."
          : "Mock assignment IDs are intentionally blocked before any Supabase write is attempted.",
    },
    {
      key: "local_auth_mode",
      label: "Local Supabase Auth mode is selected",
      passed: localAuthMode,
      detail: localAuthMode
        ? "MYMEDLIFE_AUTH_MODE=local_supabase is set."
        : "Set MYMEDLIFE_AUTH_MODE=local_supabase and sign in with a fake seed user.",
    },
    {
      key: "local_write_flag",
      label: "Local write master switch is on",
      passed: localWritesRequested,
      detail: localWritesRequested
        ? "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true is set for local testing."
        : "Keep this off until staff deliberately runs the first-write drill.",
    },
    {
      key: "action_start_flag",
      label: "Action-start write switch is on",
      passed: actionStartEnabled,
      detail: actionStartEnabled
        ? "MYMEDLIFE_ENABLE_ACTION_START_WRITE=true is set for this narrow write."
        : "This write remains locked until the action-start switch is explicitly enabled.",
    },
    {
      key: "readiness_can_submit",
      label: "Action-start readiness allows submit",
      passed: readiness?.canSubmit ?? false,
      detail:
        readiness?.reason ??
        "Readiness cannot be calculated until an assignment is selected.",
    },
    {
      key: "external_writes_disabled",
      label: "External sends stay disabled",
      passed: true,
      detail:
        "Action start creates internal event, integration event, and audit log rows only. It should not create an automation outbox send.",
    },
  ];
}

function getStatus(
  checks: FirstWriteDrillCheck[],
  writeConfigEnabled: boolean,
): FirstWriteDrillStatus {
  const missingSupabase = checks.some((check) => {
    return (
      (check.key === "local_supabase_reads" ||
        check.key === "candidate_assignment_uuid") &&
      !check.passed
    );
  });

  if (missingSupabase) {
    return "blocked_until_local_supabase";
  }

  const missingFlags = checks.some((check) => {
    return (
      (check.key === "local_write_flag" || check.key === "action_start_flag") &&
      !check.passed
    );
  });

  if (missingFlags || !writeConfigEnabled) {
    return "blocked_until_flags";
  }

  const missingAuth = checks.some((check) => {
    return (
      (check.key === "local_auth_mode" || check.key === "readiness_can_submit") &&
      !check.passed
    );
  });

  if (missingAuth) {
    return "blocked_until_auth";
  }

  return "ready_for_local_action_start";
}

function buildSteps(
  candidate: FirstWriteActivationDrill["candidateAssignment"],
): FirstWriteDrillStep[] {
  const actionRoute = candidate?.route ?? "/rush-month/actions/member-push";

  return [
    {
      key: "setup_local_stack",
      label: "Start local Supabase and seed fake data",
      route: "/admin",
      localActorEmail: "admin@mymedlife.test",
      plainEnglish:
        "Staff should confirm the app is reading local Supabase data, not mock fallback data.",
      expectedResult:
        "The drill check for local Supabase reads and candidate UUID is green.",
      structuredEvents: [],
      safetyBoundary: "Use fake seed data only. Do not connect production Supabase.",
    },
    {
      key: "sign_in_member",
      label: "Sign in as the fake member",
      route: "/login",
      localActorEmail: "member.a@mymedlife.test",
      plainEnglish:
        "The first write must use server-derived local auth identity, not the role switcher alone.",
      expectedResult:
        "The local auth session shows `member.a@mymedlife.test` as signed in.",
      structuredEvents: ["user_signed_in"],
      safetyBoundary: "Production auth remains disabled.",
    },
    {
      key: "enable_narrow_flags",
      label: "Enable only the action-start write flags",
      route: "/admin/first-write",
      localActorEmail: "admin@mymedlife.test",
      plainEnglish:
        "Staff turns on the local write master switch and the action-start switch only for this localhost drill.",
      expectedResult:
        "The drill still shows zero external sends and only one expected browser write.",
      structuredEvents: [],
      safetyBoundary:
        "Do not enable proof, assignment creation, HQ decision, coach decision, admin mutation, or external integration writes.",
    },
    {
      key: "start_assignment",
      label: "Open the candidate action and click Start this action",
      route: actionRoute,
      localActorEmail: "member.a@mymedlife.test",
      plainEnglish:
        "The member starts one assigned Rush Month action through the existing server action.",
      expectedResult:
        "The page redirects back with `actionStartResult=started` and the assignment reads back as in progress.",
      structuredEvents: ["action_started", "kpi_event_recorded"],
      safetyBoundary:
        "This should create no reminder send, no n8n run, no HubSpot sync, and no Luma write.",
    },
    {
      key: "verify_audit",
      label: "Verify event, integration event, and audit rows",
      route: "/admin",
      localActorEmail: "admin@mymedlife.test",
      plainEnglish:
        "Staff confirms the write created the internal records required for future automation readiness.",
      expectedResult:
        "Assignment status, event row, integration event row, and audit log row are visible in local evidence.",
      structuredEvents: [
        "action_started",
        "integration_event_recorded",
        "audit_log_recorded",
      ],
      safetyBoundary:
        "AutomationOutbox remains disabled and external sends remain zero.",
    },
  ];
}

function buildReadbackEvidence(
  data: ReadOnlyAppData,
  candidate: FirstWriteActivationDrill["candidateAssignment"],
): FirstWriteReadbackEvidenceItem[] {
  if (!candidate) {
    return [
      {
        key: "candidate_missing",
        label: "Candidate action",
        status: "blocked",
        detail: "No assignment is available, so readback evidence cannot be checked.",
      },
    ];
  }

  const internalEvent = data.eventRows.find((event) => {
    return event.event_type === "action_started" &&
      event.assignment_id === candidate.id;
  });
  const integrationEvent = data.integrationEventRows.find((event) => {
    return (
      event.event_type === "action_started" &&
      (event.external_object_id === candidate.id ||
        (internalEvent?.id && event.source_event_id === internalEvent.id))
    );
  });
  const auditLog = data.auditLogs.find((log) => {
    return log.action === "action_started" &&
      log.target_table === "assignments" &&
      log.target_id === candidate.id;
  });
  const outboxRows = data.automationOutboxRows.filter((item) => {
    return (
      item.event_type === "action_started" ||
      (internalEvent?.id && item.source_event_id === internalEvent.id) ||
      (integrationEvent?.id && item.integration_event_id === integrationEvent.id)
    );
  });

  return [
    {
      key: "assignment_status",
      label: "Assignment status readback",
      status: candidate.status === "in_progress" ? "observed" : "missing",
      detail:
        candidate.status === "in_progress"
          ? "The candidate assignment is already reading back as in progress."
          : `The candidate assignment is currently ${candidate.status}; after the drill it should read back as in_progress.`,
    },
    {
      key: "internal_event",
      label: "Internal event row",
      status: internalEvent ? "observed" : "missing",
      detail: internalEvent
        ? `Found event ${internalEvent.id} for action_started.`
        : "After the drill, local Supabase should contain one action_started event row for this assignment.",
    },
    {
      key: "integration_event",
      label: "Integration event row",
      status: integrationEvent ? "observed" : "missing",
      detail: integrationEvent
        ? `Found integration event ${integrationEvent.id} with status ${integrationEvent.status}.`
        : "After the drill, local Supabase should contain one recorded internal integration event row.",
    },
    {
      key: "audit_log",
      label: "Audit log row",
      status: auditLog ? "observed" : "manual_check_needed",
      detail: auditLog
        ? `Found audit log ${auditLog.id} for assignments/${candidate.id}.`
        : "If audit logs are not visible in the app, staff must verify app.audit_logs directly after the drill.",
    },
    {
      key: "automation_outbox",
      label: "Automation outbox sends",
      status: outboxRows.length === 0 ? "safe_zero" : "blocked",
      detail:
        outboxRows.length === 0
          ? "No action_started automation outbox row is visible, which is expected for this first write."
          : `${outboxRows.length} action_started outbox row(s) exist; staff must confirm no external send was approved.`,
    },
  ];
}

function buildVerificationPacket(
  status: FirstWriteDrillStatus,
  candidate: FirstWriteActivationDrill["candidateAssignment"],
  checks: FirstWriteDrillCheck[],
  readbackEvidence: FirstWriteReadbackEvidenceItem[],
): FirstWriteVerificationPacket {
  const evidenceStatuses = Object.fromEntries(
    readbackEvidence.map((item) => [item.key, item.status]),
  );
  const hasAssignmentReadback = evidenceStatuses.assignment_status === "observed";
  const hasInternalEvent = evidenceStatuses.internal_event === "observed";
  const hasIntegrationEvent = evidenceStatuses.integration_event === "observed";
  const hasAuditLog = evidenceStatuses.audit_log === "observed";
  const hasSafeZeroOutbox = evidenceStatuses.automation_outbox === "safe_zero";
  const allEvidenceObserved =
    hasAssignmentReadback &&
    hasInternalEvent &&
    hasIntegrationEvent &&
    hasAuditLog &&
    hasSafeZeroOutbox;
  const coreEvidenceObserved =
    hasAssignmentReadback &&
    hasInternalEvent &&
    hasIntegrationEvent &&
    hasSafeZeroOutbox;
  const packetStatus: FirstWriteVerificationPacketStatus = allEvidenceObserved
    ? "evidence_observed"
    : coreEvidenceObserved
      ? "needs_manual_audit_check"
      : status === "ready_for_local_action_start"
        ? "ready_to_run_locally"
        : "blocked";

  return {
    status: packetStatus,
    title: "First-write verification packet",
    plainEnglishDecision: getVerificationDecision(packetStatus, checks),
    canPromoteToStagingReview: packetStatus === "evidence_observed",
    envSettings: [
      {
        key: "MYMEDLIFE_DATA_SOURCE",
        value: "supabase",
        reason: "The drill must target local UUID-backed seed data, not mock fallback rows.",
      },
      {
        key: "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS",
        value: "true",
        reason: "The app must read local assignment, event, integration, outbox, and audit evidence.",
      },
      {
        key: "MYMEDLIFE_AUTH_MODE",
        value: "local_supabase",
        reason: "The write must use a server-derived local auth session.",
      },
      {
        key: "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES",
        value: "true",
        reason: "The local write master switch must be deliberate for this drill.",
      },
      {
        key: "MYMEDLIFE_ENABLE_ACTION_START_WRITE",
        value: "true",
        reason: "Only the action-start write is enabled for the first drill.",
      },
      {
        key: "MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE",
        value: "false",
        reason: "Proof saves stay locked during the first action-start drill.",
      },
      {
        key: "MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE",
        value: "false",
        reason: "Leader assignment creation stays locked during the first action-start drill.",
      },
      {
        key: "MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE",
        value: "false",
        reason: "HQ proof decisions stay locked during the first action-start drill.",
      },
      {
        key: "MYMEDLIFE_ENABLE_COACH_DECISION_WRITE",
        value: "false",
        reason: "Coach decisions stay locked during the first action-start drill.",
      },
    ],
    fakeMemberCredential: {
      email: "member.a@mymedlife.test",
      passwordLabel: "password",
      route: "/login",
    },
    operatorSequence: [
      {
        label: "Confirm the packet is not blocked",
        route: "/admin/first-write",
        expectedProof:
          "The packet status is ready to run locally or readback evidence is already observed.",
      },
      {
        label: "Sign in as the fake member",
        route: "/login",
        expectedProof:
          "The app actor context uses local_auth_session for member.a@mymedlife.test.",
      },
      {
        label: "Start the candidate action",
        route: candidate?.route ?? "/rush-month/actions/[assignmentId]",
        expectedProof:
          "The action detail page redirects with actionStartResult=started.",
      },
      {
        label: "Return to the verification packet",
        route: "/admin/first-write",
        expectedProof:
          "Assignment, internal event, integration event, audit log, and zero-send evidence are observed.",
      },
    ],
    safetyStops: [
      "Stop if the app is reading mock fallback data.",
      "Stop if the candidate action does not use a Supabase UUID.",
      "Stop if the signed-in user is not a fake local seed member.",
      "Stop if any non-action-start write flag is enabled.",
      "Stop if any HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, AI, upload, or public proof control is live.",
    ],
  };
}

function getVerificationDecision(
  status: FirstWriteVerificationPacketStatus,
  checks: FirstWriteDrillCheck[],
): string {
  if (status === "evidence_observed") {
    return "Local evidence is strong enough for staff to discuss promoting this exact action-start pattern to staging review. This still does not approve production writes.";
  }

  if (status === "needs_manual_audit_check") {
    return "Core readback evidence is visible, but staff must manually confirm the audit log before staging review.";
  }

  if (status === "ready_to_run_locally") {
    return "The local drill is ready to run. Staff should execute one fake member action-start write and then return here to confirm readback evidence.";
  }

  const firstBlockedCheck = checks.find((check) => !check.passed);

  return firstBlockedCheck
    ? `Do not run the drill yet. First blocker: ${firstBlockedCheck.label}.`
    : "Do not run the drill yet. Local readiness has not been proven.";
}

function buildHiddenVerificationPacket(): FirstWriteVerificationPacket {
  return {
    status: "blocked",
    title: "First-write verification packet hidden",
    plainEnglishDecision:
      "This packet is available only to HQ, DS Admin, and Super Admin review contexts.",
    canPromoteToStagingReview: false,
    envSettings: [],
    fakeMemberCredential: {
      email: "member.a@mymedlife.test",
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
      return "Admin first-write activation drill";
    case "ds_admin":
      return "DS Admin first-write safety drill";
    case "super_admin":
      return "Full first-write activation drill";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "First-write drill hidden for this role";
  }
}

function emptyCounts(): FirstWriteActivationDrill["counts"] {
  return {
    checks: 0,
    passedChecks: 0,
    observedReadbackItems: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
