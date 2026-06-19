import { isUuid } from "@/services/action-start-write";
import {
  getAssignmentCreateWriteConfig,
  getAssignmentCreateWriteReadiness,
} from "@/services/assignment-create-write";
import { getMockLocalActorContext, type LocalActorContext } from "@/services/local-actor-context";
import type { ChapterAssignmentInput } from "@/services/local-action-contracts";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

type EnvSource = Record<string, string | undefined>;

export type LeaderAssignmentPacketStatus =
  | "hidden"
  | "blocked_until_local_supabase"
  | "blocked_until_hq_decision"
  | "blocked_until_flags"
  | "blocked_until_auth"
  | "ready_for_local_assignment_create"
  | "needs_manual_audit_check"
  | "evidence_observed";

export type LeaderAssignmentPacketCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type LeaderAssignmentReadbackStatus =
  | "observed"
  | "missing"
  | "manual_check_needed"
  | "disabled_outbox_observed"
  | "blocked";

export type LeaderAssignmentReadbackItem = {
  key: string;
  label: string;
  status: LeaderAssignmentReadbackStatus;
  detail: string;
};

export type LeaderAssignmentVerificationPacket = {
  status: LeaderAssignmentPacketStatus;
  canPromoteToStagingReview: boolean;
  title: string;
  plainEnglishDecision: string;
  envSettings: Array<{
    key: string;
    value: string;
    reason: string;
  }>;
  fakeLeaderCredential: {
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

export type LeaderAssignmentRoleResponsibility = {
  roleLabel: string;
  responsibility: string;
  route: string;
  reviewPrompt: string;
  safetyBoundary: string;
};

export type LeaderAssignmentPacket = {
  canReadPacket: boolean;
  title: string;
  status: LeaderAssignmentPacketStatus;
  plainEnglishSummary: string;
  chapterId: string;
  campaignId: string;
  defaultInput: ChapterAssignmentInput;
  checks: LeaderAssignmentPacketCheck[];
  readbackEvidence: LeaderAssignmentReadbackItem[];
  roleResponsibilities: LeaderAssignmentRoleResponsibility[];
  verificationPacket: LeaderAssignmentVerificationPacket;
  proofToCollect: string[];
  counts: {
    checks: number;
    passedChecks: number;
    observedReadbackItems: number;
    browserWritesExpected: 0 | 1;
    remindersExpected: 0;
    externalWritesExpected: 0;
  };
};

export const defaultLeaderAssignmentInput = {
  title: "Assign a Rush Month event owner",
  instructions:
    "Choose one student owner, confirm the event goal, and tell them what proof/testimonial should be collected afterward.",
  ownerRole: "Action Committee Member",
  dueLabel: "Next Friday",
  evidenceRequired: "Owner name, Luma/event link, and proof collection plan.",
  points: 15,
  kpi: "Rush Month event owner assigned",
} as const satisfies ChapterAssignmentInput;

export function getLeaderAssignmentPacket(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  env: EnvSource = process.env,
): LeaderAssignmentPacket {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadPacket: false,
      title: "Leader assignment packet hidden for this role",
      status: "hidden",
      plainEnglishSummary:
        "Leader assignment activation is an HQ safety surface, not a student, chapter leader, or coach operating view.",
      chapterId: data.chapter.id,
      campaignId: data.campaign.id,
      defaultInput: defaultLeaderAssignmentInput,
      checks: [],
      readbackEvidence: [],
      roleResponsibilities: [],
      verificationPacket: buildHiddenVerificationPacket(),
      proofToCollect: [],
      counts: emptyCounts(),
    };
  }

  const targetActor = getMockLocalActorContext(
    "leader.a@mymedlife.test",
    "Target chapter leader for local assignment creation testing.",
    data.source.status,
    "local_auth_session",
    env.MYMEDLIFE_AUTH_MODE === "local_supabase" ? "signed_in" : "signed_out",
  );
  const context = {
    chapterId: data.chapter.id,
    campaignId: data.campaign.id,
    existingAssignments: data.assignments,
  };
  const writeConfig = getAssignmentCreateWriteConfig(env);
  const readiness = getAssignmentCreateWriteReadiness(
    targetActor,
    defaultLeaderAssignmentInput,
    context,
    env,
  );
  const hqDecisionObserved = hasHqDecisionReadback(data);
  const readbackEvidence = buildReadbackEvidence(data);
  const checks = buildChecks(data, readiness, hqDecisionObserved, env);
  const status = getStatus(checks, writeConfig.enabled, readbackEvidence);
  const browserWritesExpected: 0 | 1 =
    status === "ready_for_local_assignment_create" ? 1 : 0;
  const verificationPacket = buildVerificationPacket(status, readbackEvidence);

  return {
    canReadPacket: true,
    title: getTitle(actor),
    status,
    plainEnglishSummary:
      "This packet prepares the fourth local Rush Month write: a fake chapter leader creates one new assignment for an action committee member. It proves the assignment row, structured event, disabled reminder/outbox row, and audit log without sending reminders or external automation.",
    chapterId: data.chapter.id,
    campaignId: data.campaign.id,
    defaultInput: defaultLeaderAssignmentInput,
    checks,
    readbackEvidence,
    roleResponsibilities: buildRoleResponsibilities(),
    verificationPacket,
    proofToCollect: [
      "Screenshot of `/admin/assignment-write` before the test showing the packet is ready.",
      "Screenshot of `/rush-month/actions` with the assignment-create form enabled for a fake chapter leader.",
      "Screenshot after submit showing the assignment_created result state.",
      "Readback proof that the new assignment row exists.",
      "Evidence that action_assigned internal event, integration event, disabled outbox row, and audit log were created.",
      "Evidence that reminder emails, SMS, HubSpot handoff, n8n workflow, and external sends stayed at zero.",
    ],
    counts: {
      checks: checks.length,
      passedChecks: checks.filter((check) => check.passed).length,
      observedReadbackItems: readbackEvidence.filter((item) => {
        return item.status === "observed" || item.status === "disabled_outbox_observed";
      }).length,
      browserWritesExpected,
      remindersExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function buildRoleResponsibilities(): LeaderAssignmentRoleResponsibility[] {
  return [
    {
      roleLabel: "President / VP",
      responsibility: "Approval guardrails",
      route: "/rush-month/actions",
      reviewPrompt:
        "Confirm the assignment title, owner role, points, KPI, proof requirement, and role coverage are safe before the local write is tested.",
      safetyBoundary:
        "Does not create assignments, approve memberships, change roles, or send reminders from the packet.",
    },
    {
      roleLabel: "E-Board Member",
      responsibility: "Owner handoff",
      route: "/rush-month/actions",
      reviewPrompt:
        "Confirm the owner handoff is concrete enough for event execution and proof follow-up before more work is assigned.",
      safetyBoundary:
        "Does not trigger Luma, n8n, SMS, email, HubSpot, warehouse, Power BI, or AI writes.",
    },
    {
      roleLabel: "Action Committee Chair",
      responsibility: "Committee coordination",
      route: "/action-committees",
      reviewPrompt:
        "Confirm the action committee lane has an owner pool ready to receive the assignment without overloading one student.",
      safetyBoundary:
        "Does not move committee lanes, assign roles, or change member access.",
    },
  ];
}

function buildChecks(
  data: ReadOnlyAppData,
  readiness: ReturnType<typeof getAssignmentCreateWriteReadiness>,
  hqDecisionObserved: boolean,
  env: EnvSource,
): LeaderAssignmentPacketCheck[] {
  const localWritesRequested = env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const assignmentCreateEnabled =
    env.MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE === "true";
  const localAuthMode = env.MYMEDLIFE_AUTH_MODE === "local_supabase";

  return [
    {
      key: "local_supabase_reads",
      label: "Local Supabase read model is active",
      passed: data.source.mode === "supabase",
      detail:
        data.source.mode === "supabase"
          ? "The app is reading local Supabase data instead of mock fallback data."
          : "The app is using mock fallback data, so assignment creation cannot target real chapter/campaign UUIDs.",
    },
    {
      key: "chapter_uuid",
      label: "Chapter uses a Supabase UUID",
      passed: isUuid(data.chapter.id),
      detail: isUuid(data.chapter.id)
        ? "The current chapter can be passed to app.create_chapter_assignment."
        : "Mock chapter IDs are intentionally blocked before assignment creation is saved.",
    },
    {
      key: "campaign_uuid",
      label: "Campaign uses a Supabase UUID",
      passed: isUuid(data.campaign.id),
      detail: isUuid(data.campaign.id)
        ? "The current campaign can be passed to app.create_chapter_assignment."
        : "Mock campaign IDs are intentionally blocked before assignment creation is saved.",
    },
    {
      key: "hq_decision_readback",
      label: "HQ proof decision readback has been proven",
      passed: hqDecisionObserved,
      detail: hqDecisionObserved
        ? "A prior hq_sharing_decision_logged event, integration event, disabled outbox row, and audit log are visible."
        : "Run `/admin/hq-proof-write` before trying the leader assignment packet.",
    },
    {
      key: "auth_mode",
      label: "Local Supabase Auth mode is selected",
      passed: localAuthMode,
      detail: localAuthMode
        ? "Local sign-in can create a fake chapter leader seed user session."
        : "Set MYMEDLIFE_AUTH_MODE=local_supabase for the local assignment-create test.",
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
      key: "assignment_create_flag",
      label: "Assignment-create write switch is on",
      passed: assignmentCreateEnabled,
      detail: assignmentCreateEnabled
        ? "Only the assignment-create write gate is allowed to open."
        : "Set MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE=true only after HQ decision readback is proven.",
    },
    toCheck(readiness, "local_auth_session", "Fake chapter leader is signed in locally"),
    toCheck(readiness, "actor_can_create_assignment", "Fake actor can create assignments"),
    toCheck(readiness, "title_long_enough", "Default assignment title is clear"),
    toCheck(readiness, "instructions_long_enough", "Default instructions explain the action"),
    toCheck(readiness, "evidence_requirement_long_enough", "Default proof requirement is clear"),
    toCheck(readiness, "kpi_present", "Default KPI is present"),
    toCheck(readiness, "points_valid", "Default points value is valid"),
    toCheck(readiness, "owner_role_valid", "Default owner role maps safely"),
    toCheck(readiness, "duplicate_assignment", "Default assignment is not a duplicate"),
    toCheck(readiness, "reminders_disabled", "Reminder automation stays disabled"),
    toCheck(readiness, "external_writes_disabled", "External sends stay disabled"),
  ];
}

function toCheck(
  readiness: ReturnType<typeof getAssignmentCreateWriteReadiness>,
  key: ReturnType<typeof getAssignmentCreateWriteReadiness>["checks"][number]["key"],
  label: string,
): LeaderAssignmentPacketCheck {
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
  checks: LeaderAssignmentPacketCheck[],
  writeEnabled: boolean,
  readbackEvidence: LeaderAssignmentReadbackItem[],
): LeaderAssignmentPacketStatus {
  if (isAssignmentReadbackObserved(readbackEvidence)) {
    return "evidence_observed";
  }

  if (isAssignmentCoreObservedWithoutAudit(readbackEvidence)) {
    return "needs_manual_audit_check";
  }

  if (!isCheckPassed(checks, "local_supabase_reads")) {
    return "blocked_until_local_supabase";
  }

  if (!isCheckPassed(checks, "hq_decision_readback")) {
    return "blocked_until_hq_decision";
  }

  if (
    !writeEnabled ||
    !isCheckPassed(checks, "local_write_flag") ||
    !isCheckPassed(checks, "assignment_create_flag") ||
    !isCheckPassed(checks, "reminders_disabled")
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

  return "ready_for_local_assignment_create";
}

function buildReadbackEvidence(
  data: ReadOnlyAppData,
): LeaderAssignmentReadbackItem[] {
  const assignment = data.assignments.find((item) => {
    return item.title.trim().toLowerCase() ===
      defaultLeaderAssignmentInput.title.trim().toLowerCase();
  });
  const integrationEvent = data.integrationEventRows.find((item) => {
    return item.event_type === "action_assigned" &&
      item.external_object_type === "assignment" &&
      (assignment ? item.external_object_id === assignment.id : true);
  });
  const event = data.eventRows.find((item) => {
    return item.event_type === "action_assigned" &&
      (integrationEvent?.source_event_id
        ? item.id === integrationEvent.source_event_id
        : assignment
          ? item.assignment_id === assignment.id
          : true);
  });
  const outbox = data.automationOutboxRows.find((item) => {
    return item.event_type === "action_assigned" &&
      item.status === "disabled" &&
      (integrationEvent ? item.integration_event_id === integrationEvent.id : true);
  });
  const auditLog = data.auditLogs.find((item) => {
    return item.action === "action_assigned" &&
      item.target_table === "assignments" &&
      (assignment ? item.target_id === assignment.id : true);
  });

  return [
    {
      key: "assignment_row",
      label: "Assignment row",
      status: assignment ? "observed" : "missing",
      detail: assignment
        ? `Local readback shows assignment: ${assignment.title}.`
        : "No matching local assignment row is visible yet.",
    },
    {
      key: "internal_event",
      label: "Internal event",
      status: event ? "observed" : "missing",
      detail: event
        ? "Internal event row records action_assigned."
        : "No action_assigned internal event is visible yet.",
    },
    {
      key: "integration_event",
      label: "Integration event",
      status: integrationEvent ? "observed" : "missing",
      detail: integrationEvent
        ? "Integration event records future reminder/handoff intent without sending."
        : "No action_assigned integration event is visible yet.",
    },
    {
      key: "disabled_outbox",
      label: "Disabled outbox row",
      status: outbox ? "disabled_outbox_observed" : "missing",
      detail: outbox
        ? "Automation outbox row exists with disabled status for future n8n pickup."
        : "No disabled assignment outbox row is visible yet.",
    },
    {
      key: "audit_log",
      label: "Audit log",
      status: auditLog
        ? "observed"
        : assignment && event && integrationEvent && outbox
          ? "manual_check_needed"
          : "missing",
      detail: auditLog
        ? "Audit log records the guarded leader assignment creation."
        : "Audit log proof is still missing or needs manual inspection.",
    },
  ];
}

function hasHqDecisionReadback(data: ReadOnlyAppData): boolean {
  const event = data.eventRows.find((item) => {
    return item.event_type === "hq_sharing_decision_logged";
  });
  const integrationEvent = data.integrationEventRows.find((item) => {
    return item.event_type === "hq_sharing_decision_logged" &&
      item.external_object_type === "evidence_item";
  });
  const outbox = data.automationOutboxRows.find((item) => {
    return item.event_type === "hq_sharing_decision_logged" &&
      item.status === "disabled";
  });
  const auditLog = data.auditLogs.find((item) => {
    return item.action === "hq_sharing_decision_logged" &&
      item.target_table === "evidence_items";
  });

  return Boolean(event && integrationEvent && outbox && auditLog);
}

function buildVerificationPacket(
  status: LeaderAssignmentPacketStatus,
  readbackEvidence: LeaderAssignmentReadbackItem[],
): LeaderAssignmentVerificationPacket {
  const evidenceObserved = isAssignmentReadbackObserved(readbackEvidence);
  const auditNeedsManualCheck = isAssignmentCoreObservedWithoutAudit(readbackEvidence);

  return {
    status,
    canPromoteToStagingReview: evidenceObserved,
    title: "Leader assignment operator packet",
    plainEnglishDecision: getPlainEnglishDecision(status, evidenceObserved, auditNeedsManualCheck),
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
        key: "MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE",
        value: "false",
        reason: "HQ decision readback should already be proven before assignment creation.",
      },
      {
        key: "MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE",
        value: "true",
        reason: "Open only the leader assignment creation write gate.",
      },
      {
        key: "MYMEDLIFE_ENABLE_REMINDER_SENDS",
        value: "false",
        reason: "Assignment creation must not send reminder email, SMS, or n8n automation.",
      },
    ],
    fakeLeaderCredential: {
      email: "leader.a@mymedlife.test",
      passwordLabel: "password",
      route: "/login",
    },
    operatorSequence: [
      {
        label: "Confirm HQ decision evidence",
        route: "/admin/hq-proof-write",
        expectedProof:
          "HQ proof decision readback is observed before assignment creation testing begins.",
      },
      {
        label: "Sign in as the fake chapter leader",
        route: "/login",
        expectedProof:
          "The app shows a local Supabase Auth session for leader.a@mymedlife.test.",
      },
      {
        label: "Open assignments",
        route: "/rush-month/actions",
        expectedProof:
          "The assignment-create form is enabled only locally for the fake chapter leader.",
      },
      {
        label: "Create one assignment",
        route: "/rush-month/actions",
        expectedProof:
          "The result state is assignment_created and no reminder or external automation happens.",
      },
      {
        label: "Verify readback",
        route: "/admin/assignment-write",
        expectedProof:
          "Assignment, event, integration event, disabled outbox, and audit readback are visible.",
      },
    ],
    safetyStops: [
      "Stop if the app is not reading local Supabase data.",
      "Stop if `/admin/hq-proof-write` has not shown HQ decision readback evidence.",
      "Stop if the chapter or campaign ID is not a Supabase UUID.",
      "Stop if reminder, SMS, email, HubSpot, n8n, or Luma sends appear enabled.",
      "Stop if the operator is not using a fake chapter leader or Super Admin local seed user.",
    ],
  };
}

function getPlainEnglishDecision(
  status: LeaderAssignmentPacketStatus,
  evidenceObserved: boolean,
  auditNeedsManualCheck: boolean,
): string {
  if (evidenceObserved) {
    return "Leader assignment evidence is observed. Staff can review this packet for staging only after confirming no reminders or external sends happened.";
  }

  if (auditNeedsManualCheck) {
    return "Core leader assignment readback is visible, but audit proof needs manual confirmation before staging review.";
  }

  switch (status) {
    case "ready_for_local_assignment_create":
      return "Ready to run locally. Create one assignment and collect readback evidence before any staging discussion.";
    case "blocked_until_local_supabase":
      return "Do not run. Local Supabase readback is required before assignment creation can be tested.";
    case "blocked_until_hq_decision":
      return "Do not run. Prove HQ proof decision readback before creating leader assignments.";
    case "blocked_until_flags":
      return "Do not run. Required local flags are missing or reminder automation is not safely disabled.";
    case "blocked_until_auth":
      return "Do not run. Sign in as the fake local chapter leader before attempting assignment creation.";
    case "needs_manual_audit_check":
    case "evidence_observed":
      return "Review readback evidence before continuing.";
    case "hidden":
      return "This packet is hidden for the selected role.";
  }
}

function isAssignmentReadbackObserved(
  items: LeaderAssignmentReadbackItem[],
): boolean {
  const statuses = Object.fromEntries(items.map((item) => [item.key, item.status]));

  return statuses.assignment_row === "observed" &&
    statuses.internal_event === "observed" &&
    statuses.integration_event === "observed" &&
    statuses.disabled_outbox === "disabled_outbox_observed" &&
    statuses.audit_log === "observed";
}

function isAssignmentCoreObservedWithoutAudit(
  items: LeaderAssignmentReadbackItem[],
): boolean {
  const statuses = Object.fromEntries(items.map((item) => [item.key, item.status]));

  return statuses.assignment_row === "observed" &&
    statuses.internal_event === "observed" &&
    statuses.integration_event === "observed" &&
    statuses.disabled_outbox === "disabled_outbox_observed" &&
    statuses.audit_log === "manual_check_needed";
}

function isCheckPassed(checks: LeaderAssignmentPacketCheck[], key: string): boolean {
  return checks.find((check) => check.key === key)?.passed === true;
}

function buildHiddenVerificationPacket(): LeaderAssignmentVerificationPacket {
  return {
    status: "hidden",
    canPromoteToStagingReview: false,
    title: "Leader assignment packet hidden",
    plainEnglishDecision:
      "This packet is hidden for chapter operating roles and visible only to HQ safety reviewers.",
    envSettings: [],
    fakeLeaderCredential: {
      email: "leader.a@mymedlife.test",
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
      return "Admin leader assignment packet";
    case "ds_admin":
      return "DS Admin assignment safety packet";
    case "super_admin":
      return "Full local leader assignment packet";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Leader assignment packet hidden for this role";
  }
}

function emptyCounts(): LeaderAssignmentPacket["counts"] {
  return {
    checks: 0,
    passedChecks: 0,
    observedReadbackItems: 0,
    browserWritesExpected: 0,
    remindersExpected: 0,
    externalWritesExpected: 0,
  };
}
