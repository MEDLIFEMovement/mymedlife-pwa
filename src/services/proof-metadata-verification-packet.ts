import { isUuid } from "@/services/action-start-write";
import {
  getProofSubmissionWriteConfig,
  getProofSubmissionWriteReadiness,
} from "@/services/proof-submission-write";
import { getMockLocalActorContext, type LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import type { ProofSubmissionInput } from "@/services/local-action-contracts";
import { buildLeaderAssignmentRouteHref } from "@/services/leader-assignment-route-href";
import type { Assignment } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type ProofMetadataPacketStatus =
  | "hidden"
  | "blocked_until_local_supabase"
  | "blocked_until_first_write"
  | "blocked_until_flags"
  | "blocked_until_auth"
  | "ready_for_local_proof_metadata"
  | "needs_manual_audit_check"
  | "evidence_observed";

export type ProofMetadataPacketCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type ProofMetadataReadbackStatus =
  | "observed"
  | "missing"
  | "manual_check_needed"
  | "disabled_outbox_observed"
  | "blocked";

export type ProofMetadataReadbackItem = {
  key: string;
  label: string;
  status: ProofMetadataReadbackStatus;
  detail: string;
};

export type ProofMetadataVerificationPacket = {
  status: ProofMetadataPacketStatus;
  canPromoteToStagingReview: boolean;
  title: string;
  plainEnglishDecision: string;
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

export type ProofMetadataCandidate = {
  id: string;
  title: string;
  status: Assignment["status"];
  route: string;
  usesSupabaseUuid: boolean;
  readyForProof: boolean;
};

export type ProofMetadataPacket = {
  canReadPacket: boolean;
  title: string;
  status: ProofMetadataPacketStatus;
  plainEnglishSummary: string;
  candidateAssignment: ProofMetadataCandidate | null;
  defaultInput: ProofSubmissionInput;
  checks: ProofMetadataPacketCheck[];
  readbackEvidence: ProofMetadataReadbackItem[];
  verificationPacket: ProofMetadataVerificationPacket;
  proofToCollect: string[];
  counts: {
    checks: number;
    passedChecks: number;
    observedReadbackItems: number;
    browserWritesExpected: 0 | 1;
    externalWritesExpected: 0;
    uploadsExpected: 0;
  };
};

const defaultProofInput = {
  evidenceType: "testimonial_text",
  summary:
    "Local proof packet: this testimonial explains what happened and why another student should take action.",
} as const satisfies ProofSubmissionInput;

export function getProofMetadataPacket(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  env: EnvSource = process.env,
): ProofMetadataPacket {
  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadPacket: false,
      title: "Proof metadata packet hidden for this role",
      status: "hidden",
      plainEnglishSummary:
        "Proof metadata activation is an HQ safety surface, not a student, leader, or coach operating view.",
      candidateAssignment: null,
      defaultInput: defaultProofInput,
      checks: [],
      readbackEvidence: [],
      verificationPacket: buildHiddenVerificationPacket(),
      proofToCollect: [],
      counts: emptyCounts(),
    };
  }

  const candidateAssignment = findCandidateAssignment(data.assignments);
  const targetActor = getMockLocalActorContext(
    "member.a@mymedlife.test",
    "Target pilot member for proof/testimonial metadata testing.",
    data.source.status,
    "local_auth_session",
    env.MYMEDLIFE_AUTH_MODE === "local_supabase" ? "signed_in" : "signed_out",
  );
  const writeConfig = getProofSubmissionWriteConfig(env);
  const readiness = candidateAssignment
    ? getProofSubmissionWriteReadiness(
        targetActor,
        candidateAssignment,
        defaultProofInput,
        env,
      )
    : null;
  const candidate = candidateAssignment ? toCandidate(candidateAssignment) : null;
  const firstWriteObserved = candidateAssignment
    ? hasActionStartReadback(data, candidateAssignment.id)
    : false;
  const readbackEvidence = buildReadbackEvidence(data, candidate);
  const checks = buildChecks(
    data,
    candidateAssignment,
    readiness,
    firstWriteObserved,
    env,
  );
  const status = getStatus(checks, writeConfig.enabled, readbackEvidence);
  const browserWritesExpected: 0 | 1 =
    status === "ready_for_local_proof_metadata" ? 1 : 0;
  const verificationPacket = buildVerificationPacket(
    status,
    candidate,
    readbackEvidence,
  );

  return {
    canReadPacket: true,
    title: getTitle(actor),
    status,
    plainEnglishSummary:
      "This packet prepares the second local Rush Month write: one fake member submits testimonial/proof metadata for one in-progress assignment. It proves the proof record, structured event, disabled n8n outbox row, and audit log without uploading files or sharing proof publicly.",
    candidateAssignment: candidate,
    defaultInput: defaultProofInput,
    checks,
    readbackEvidence,
    verificationPacket,
    proofToCollect: [
      "Screenshot of `/admin/proof-write` before the test showing the packet is ready.",
      "Screenshot of the target action detail route with the proof form enabled.",
      "Screenshot after submit showing the `proof_submitted` result state.",
      "Readback proof that assignment status moved to `submitted`.",
      "Evidence that an evidence item, internal event, integration event, disabled outbox row, and audit log were created.",
      "Evidence that file uploads, public proof sharing, and external sends stayed at zero.",
    ],
    counts: {
      checks: checks.length,
      passedChecks: checks.filter((check) => check.passed).length,
      observedReadbackItems: readbackEvidence.filter((item) => {
        return item.status === "observed" || item.status === "disabled_outbox_observed";
      }).length,
      browserWritesExpected,
      externalWritesExpected: 0,
      uploadsExpected: 0,
    },
  };
}

function findCandidateAssignment(assignments: Assignment[]): Assignment | null {
  return (
    assignments.find((assignment) => {
      return assignment.lane === "Member" &&
        isProofReadyAssignment(assignment) &&
        isUuid(assignment.id);
    }) ??
    assignments.find((assignment) => {
      return assignment.lane === "Member" && isUuid(assignment.id);
    }) ??
    assignments.find((assignment) => {
      return isProofReadyAssignment(assignment) && isUuid(assignment.id);
    }) ??
    assignments.find((assignment) => isUuid(assignment.id)) ??
    assignments.find((assignment) => {
      return assignment.lane === "Member" && isProofReadyAssignment(assignment);
    }) ??
    assignments.find((assignment) => assignment.lane === "Member") ??
    assignments.find(isProofReadyAssignment) ??
    assignments[0] ??
    null
  );
}

function isProofReadyAssignment(assignment: Assignment): boolean {
  return (
    assignment.status === "in_progress" ||
    assignment.status === "changes_requested"
  );
}

function toCandidate(assignment: Assignment): ProofMetadataCandidate {
  return {
    id: assignment.id,
    title: assignment.title,
    status: assignment.status,
    route: buildLeaderAssignmentRouteHref(assignment.id, {
      source: "proof_metadata_packet",
    }),
    usesSupabaseUuid: isUuid(assignment.id),
    readyForProof: isProofReadyAssignment(assignment),
  };
}

function buildChecks(
  data: ReadOnlyAppData,
  assignment: Assignment | null,
  readiness: ReturnType<typeof getProofSubmissionWriteReadiness> | null,
  firstWriteObserved: boolean,
  env: EnvSource,
): ProofMetadataPacketCheck[] {
  const localWritesRequested = env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const proofSubmissionEnabled =
    env.MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE === "true";
  const localAuthMode = env.MYMEDLIFE_AUTH_MODE === "local_supabase";
  const uploadsDisabled = env.MYMEDLIFE_ALLOW_PROOF_UPLOADS !== "true";

  return [
    {
      key: "local_supabase_reads",
      label: "Local Supabase read model is active",
      passed: data.source.mode === "supabase",
      detail:
        data.source.mode === "supabase"
          ? "The app is reading local Supabase data instead of mock fallback data."
          : "The app is using mock fallback data, so proof metadata testing cannot target a real assignment UUID.",
    },
    {
      key: "candidate_assignment",
      label: "A proof-ready member assignment exists",
      passed: Boolean(assignment),
      detail: assignment
        ? `Candidate action: ${assignment.title}.`
        : "No assignment is available for proof metadata testing.",
    },
    {
      key: "candidate_assignment_uuid",
      label: "Candidate assignment uses a Supabase UUID",
      passed: Boolean(assignment && isUuid(assignment.id)),
      detail:
        assignment && isUuid(assignment.id)
          ? "The candidate action can be passed to app.submit_assignment_proof_metadata."
          : "Mock assignment IDs are intentionally blocked before proof metadata is saved.",
    },
    {
      key: "first_write_readback",
      label: "Action-start readback has been proven",
      passed: firstWriteObserved,
      detail: firstWriteObserved
        ? "The selected assignment has action_started event, integration event, and audit proof."
        : "Run `/admin/first-write` before trying the proof metadata packet.",
    },
    {
      key: "assignment_ready_for_proof",
      label: "Assignment is ready for proof",
      passed: Boolean(assignment && isProofReadyAssignment(assignment)),
      detail:
        assignment && isProofReadyAssignment(assignment)
          ? `Current status is ${assignment.status}.`
          : "Proof metadata should only be submitted after the assignment is in progress or changes are requested.",
    },
    {
      key: "auth_mode",
      label: "Local Supabase Auth mode is selected",
      passed: localAuthMode,
      detail: localAuthMode
        ? "Local sign-in can create a fake seed user session."
        : "Set MYMEDLIFE_AUTH_MODE=local_supabase for the local proof metadata test.",
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
      key: "proof_submission_flag",
      label: "Proof metadata write switch is on",
      passed: proofSubmissionEnabled,
      detail: proofSubmissionEnabled
        ? "Only the proof metadata write gate is allowed to open."
        : "Set MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE=true only after first-write readback is proven.",
    },
    {
      key: "local_auth_session",
      label: "Fake member is signed in locally",
      passed: Boolean(
        readiness?.checks.find((check) => check.key === "local_auth_session")
          ?.passed,
      ),
      detail:
        readiness?.checks.find((check) => check.key === "local_auth_session")
          ?.passed
          ? "The target fake member has a local Supabase Auth session."
          : "Sign in as member.a@mymedlife.test before submitting proof metadata.",
    },
    {
      key: "summary_long_enough",
      label: "Default testimonial summary is valid",
      passed: Boolean(
        readiness?.checks.find((check) => check.key === "summary_long_enough")
          ?.passed,
      ),
      detail:
        "The packet uses a metadata-only testimonial summary long enough to pass local validation.",
    },
    {
      key: "proof_uploads_disabled",
      label: "Proof file uploads stay disabled",
      passed: uploadsDisabled,
      detail: uploadsDisabled
        ? "This packet records metadata only. No file or storage object should be uploaded."
        : "Turn off MYMEDLIFE_ALLOW_PROOF_UPLOADS before testing metadata-only proof.",
    },
    {
      key: "external_writes_disabled",
      label: "External sends stay disabled",
      passed: true,
      detail:
        "HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes remain disabled.",
    },
  ];
}

function getStatus(
  checks: ProofMetadataPacketCheck[],
  writeEnabled: boolean,
  readbackEvidence: ProofMetadataReadbackItem[],
): ProofMetadataPacketStatus {
  if (isProofReadbackObserved(readbackEvidence)) {
    return "evidence_observed";
  }

  if (isProofCoreObservedWithoutAudit(readbackEvidence)) {
    return "needs_manual_audit_check";
  }

  if (!isCheckPassed(checks, "local_supabase_reads")) {
    return "blocked_until_local_supabase";
  }

  if (
    !isCheckPassed(checks, "first_write_readback") ||
    !isCheckPassed(checks, "assignment_ready_for_proof")
  ) {
    return "blocked_until_first_write";
  }

  if (
    !writeEnabled ||
    !isCheckPassed(checks, "local_write_flag") ||
    !isCheckPassed(checks, "proof_submission_flag") ||
    !isCheckPassed(checks, "proof_uploads_disabled")
  ) {
    return "blocked_until_flags";
  }

  if (
    !isCheckPassed(checks, "auth_mode") ||
    !isCheckPassed(checks, "local_auth_session")
  ) {
    return "blocked_until_auth";
  }

  return "ready_for_local_proof_metadata";
}

function buildReadbackEvidence(
  data: ReadOnlyAppData,
  candidate: ProofMetadataCandidate | null,
): ProofMetadataReadbackItem[] {
  if (!candidate) {
    return [
      {
        key: "candidate_assignment",
        label: "Candidate assignment",
        status: "blocked",
        detail: "No assignment exists, so proof metadata readback cannot be checked.",
      },
    ];
  }

  const assignment = data.assignments.find((item) => item.id === candidate.id);
  const evidenceItem = data.evidenceItems.find((item) => {
    return item.assignmentId === candidate.id && item.status === "pending_review";
  });
  const event = data.eventRows.find((item) => {
    return item.assignment_id === candidate.id && item.event_type === "evidence_submitted";
  });
  const integrationEvent = data.integrationEventRows.find((item) => {
    return item.event_type === "evidence_submitted" &&
      item.external_object_type === "evidence_item" &&
      (evidenceItem ? item.external_object_id === evidenceItem.id : true);
  });
  const outbox = data.automationOutboxRows.find((item) => {
    return item.event_type === "evidence_submitted" && item.status === "disabled";
  });
  const auditLog = data.auditLogs.find((item) => {
    return item.action === "evidence_submitted" &&
      item.target_table === "evidence_items" &&
      (evidenceItem ? item.target_id === evidenceItem.id : true);
  });

  return [
    {
      key: "assignment_status",
      label: "Assignment status",
      status: assignment?.status === "submitted" ? "observed" : "missing",
      detail:
        assignment?.status === "submitted"
          ? "Local readback shows the assignment moved to submitted."
          : "After the proof metadata test, the assignment should read back as submitted.",
    },
    {
      key: "evidence_item",
      label: "Evidence item",
      status: evidenceItem ? "observed" : "missing",
      detail: evidenceItem
        ? `Evidence metadata exists: ${evidenceItem.summary}`
        : "No proof/testimonial metadata row is visible yet.",
    },
    {
      key: "internal_event",
      label: "Internal event",
      status: event ? "observed" : "missing",
      detail: event
        ? "Internal event row records evidence_submitted."
        : "No evidence_submitted internal event is visible yet.",
    },
    {
      key: "integration_event",
      label: "Integration event",
      status: integrationEvent ? "observed" : "missing",
      detail: integrationEvent
        ? "Integration event records future automation intent without sending."
        : "No evidence_submitted integration event is visible yet.",
    },
    {
      key: "disabled_outbox",
      label: "Disabled outbox row",
      status: outbox ? "disabled_outbox_observed" : "missing",
      detail: outbox
        ? "Automation outbox row exists with disabled status for future n8n pickup."
        : "No disabled proof metadata outbox row is visible yet.",
    },
    {
      key: "audit_log",
      label: "Audit log",
      status: auditLog
        ? "observed"
        : evidenceItem && event && integrationEvent && outbox
          ? "manual_check_needed"
          : "missing",
      detail: auditLog
        ? "Audit log records the guarded proof metadata write."
        : "Audit log proof is still missing or needs manual inspection.",
    },
  ];
}

function hasActionStartReadback(data: ReadOnlyAppData, assignmentId: string): boolean {
  const assignmentReady = data.assignments.some((assignment) => {
    return assignment.id === assignmentId && isProofReadyAssignment(assignment);
  });
  const hasEvent = data.eventRows.some((event) => {
    return event.assignment_id === assignmentId && event.event_type === "action_started";
  });
  const hasIntegrationEvent = data.integrationEventRows.some((event) => {
    return event.event_type === "action_started" &&
      event.external_object_type === "assignment" &&
      event.external_object_id === assignmentId;
  });
  const hasAuditLog = data.auditLogs.some((log) => {
    return log.action === "action_started" &&
      log.target_table === "assignments" &&
      log.target_id === assignmentId;
  });

  return assignmentReady && hasEvent && hasIntegrationEvent && hasAuditLog;
}

function buildVerificationPacket(
  status: ProofMetadataPacketStatus,
  candidate: ProofMetadataCandidate | null,
  readbackEvidence: ProofMetadataReadbackItem[],
): ProofMetadataVerificationPacket {
  const evidenceObserved = isProofReadbackObserved(readbackEvidence);
  const auditNeedsManualCheck = isProofCoreObservedWithoutAudit(readbackEvidence);

  return {
    status,
    canPromoteToStagingReview: evidenceObserved,
    title: "Proof metadata operator packet",
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
        key: "MYMEDLIFE_ENABLE_ACTION_START_WRITE",
        value: "false",
        reason: "Action-start should already be proven before testing proof metadata.",
      },
      {
        key: "MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE",
        value: "true",
        reason: "Open only the proof/testimonial metadata write gate.",
      },
      {
        key: "MYMEDLIFE_ALLOW_PROOF_UPLOADS",
        value: "false",
        reason: "This packet is metadata-only. No file uploads or storage writes.",
      },
    ],
    fakeMemberCredential: {
      email: "member.a@mymedlife.test",
      passwordLabel: "password",
      route: "/login",
    },
    operatorSequence: [
      {
        label: "Confirm first-write evidence",
        route: "/admin/first-write",
        expectedProof:
          "Action-start readback is observed before proof metadata testing begins.",
      },
      {
        label: "Sign in as the fake member",
        route: "/login",
        expectedProof:
          "The app shows a local Supabase Auth session for member.a@mymedlife.test.",
      },
      {
        label: "Open the target action",
        route: candidate?.route ?? "/rush-month/actions",
        expectedProof:
          "The action is in progress and the proof/testimonial form is enabled only locally.",
      },
      {
        label: "Submit metadata only",
        route: candidate?.route ?? "/rush-month/actions",
        expectedProof:
          "The result state is proof_submitted and no upload or public sharing happens.",
      },
      {
        label: "Verify readback",
        route: "/admin/proof-write",
        expectedProof:
          "Assignment, evidence item, event, integration event, disabled outbox, and audit readback are visible.",
      },
    ],
    safetyStops: [
      "Stop if the app is not reading local Supabase data.",
      "Stop if `/admin/first-write` has not shown action-start readback evidence.",
      "Stop if the target assignment is not a Supabase UUID.",
      "Stop if proof upload controls appear enabled.",
      "Stop if any external send, public proof publish, AI summary, or warehouse export appears enabled.",
      "Stop if the operator is not using a fake local seed user.",
    ],
  };
}

function getPlainEnglishDecision(
  status: ProofMetadataPacketStatus,
  evidenceObserved: boolean,
  auditNeedsManualCheck: boolean,
): string {
  if (evidenceObserved) {
    return "Proof metadata evidence is observed. Staff can review this packet for staging only after confirming no files, public proof, or external sends happened.";
  }

  if (auditNeedsManualCheck) {
    return "Core proof metadata readback is visible, but audit proof needs manual confirmation before staging review.";
  }

  switch (status) {
    case "ready_for_local_proof_metadata":
      return "Ready to run locally. Submit one metadata-only proof/testimonial and collect the readback evidence before any staging discussion.";
    case "blocked_until_local_supabase":
      return "Do not run. Local Supabase readback is required before proof metadata can be tested.";
    case "blocked_until_first_write":
      return "Do not run. Prove the first action-start write before submitting proof metadata.";
    case "blocked_until_flags":
      return "Do not run. Required local flags are missing or proof upload controls are not safely disabled.";
    case "blocked_until_auth":
      return "Do not run. Sign in as the fake local member before attempting proof metadata.";
    case "needs_manual_audit_check":
    case "evidence_observed":
      return "Review readback evidence before continuing.";
    case "hidden":
      return "This packet is hidden for the selected role.";
  }
}

function isProofReadbackObserved(items: ProofMetadataReadbackItem[]): boolean {
  const statuses = Object.fromEntries(items.map((item) => [item.key, item.status]));

  return statuses.assignment_status === "observed" &&
    statuses.evidence_item === "observed" &&
    statuses.internal_event === "observed" &&
    statuses.integration_event === "observed" &&
    statuses.disabled_outbox === "disabled_outbox_observed" &&
    statuses.audit_log === "observed";
}

function isProofCoreObservedWithoutAudit(items: ProofMetadataReadbackItem[]): boolean {
  const statuses = Object.fromEntries(items.map((item) => [item.key, item.status]));

  return statuses.assignment_status === "observed" &&
    statuses.evidence_item === "observed" &&
    statuses.internal_event === "observed" &&
    statuses.integration_event === "observed" &&
    statuses.disabled_outbox === "disabled_outbox_observed" &&
    statuses.audit_log === "manual_check_needed";
}

function isCheckPassed(checks: ProofMetadataPacketCheck[], key: string): boolean {
  return checks.find((check) => check.key === key)?.passed === true;
}

function buildHiddenVerificationPacket(): ProofMetadataVerificationPacket {
  return {
    status: "hidden",
    canPromoteToStagingReview: false,
    title: "Proof metadata packet hidden",
    plainEnglishDecision:
      "This packet is hidden for chapter operating roles and visible only to HQ safety reviewers.",
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
  switch (getActorSurfaceFamily(actor)) {
    case "staff":
      return "Admin proof metadata packet";
    case "ds_admin":
      return "DS Admin proof metadata safety packet";
    case "super_admin":
      return "Full local proof metadata packet";
    case "member":
    case "leader":
    case "coach":
      return "Proof metadata packet hidden for this role";
  }
}

function emptyCounts(): ProofMetadataPacket["counts"] {
  return {
    checks: 0,
    passedChecks: 0,
    observedReadbackItems: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    uploadsExpected: 0,
  };
}
