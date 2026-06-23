import { isUuid } from "@/services/action-start-write";
import {
  getHqProofDecisionWriteConfig,
  getHqProofDecisionWriteReadiness,
} from "@/services/hq-proof-decision-write";
import { getMockLocalActorContext, type LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import type { HqSharingDecisionInput } from "@/services/local-action-contracts";
import { buildLeaderAssignmentRouteHref } from "@/services/leader-assignment-route-href";
import type { EvidenceItem } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type HqProofDecisionPacketStatus =
  | "hidden"
  | "blocked_until_local_supabase"
  | "blocked_until_proof_metadata"
  | "blocked_until_flags"
  | "blocked_until_auth"
  | "ready_for_local_hq_decision"
  | "needs_manual_audit_check"
  | "evidence_observed";

export type HqProofDecisionPacketCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type HqProofDecisionReadbackStatus =
  | "observed"
  | "missing"
  | "manual_check_needed"
  | "disabled_outbox_observed"
  | "blocked";

export type HqProofDecisionReadbackItem = {
  key: string;
  label: string;
  status: HqProofDecisionReadbackStatus;
  detail: string;
};

export type HqProofDecisionCandidate = {
  id: string;
  assignmentId: string;
  summary: string;
  status: EvidenceItem["status"];
  route: string;
  reviewRoute: string;
  usesSupabaseUuid: boolean;
  readyForHqDecision: boolean;
};

export type HqProofDecisionVerificationPacket = {
  status: HqProofDecisionPacketStatus;
  canPromoteToStagingReview: boolean;
  title: string;
  plainEnglishDecision: string;
  envSettings: Array<{
    key: string;
    value: string;
    reason: string;
  }>;
  fakeAdminCredential: {
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

export type HqProofDecisionPacket = {
  canReadPacket: boolean;
  title: string;
  status: HqProofDecisionPacketStatus;
  plainEnglishSummary: string;
  candidateEvidence: HqProofDecisionCandidate | null;
  defaultInput: HqSharingDecisionInput;
  checks: HqProofDecisionPacketCheck[];
  readbackEvidence: HqProofDecisionReadbackItem[];
  verificationPacket: HqProofDecisionVerificationPacket;
  proofToCollect: string[];
  counts: {
    checks: number;
    passedChecks: number;
    observedReadbackItems: number;
    browserWritesExpected: 0 | 1;
    externalWritesExpected: 0;
    publicSharesExpected: 0;
  };
};

const defaultDecisionInput = {
  decision: "approved",
  note:
    "Local HQ packet: approve this proof for future sharing review without publishing it yet.",
} as const satisfies HqSharingDecisionInput;

export function getHqProofDecisionPacket(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  env: EnvSource = process.env,
): HqProofDecisionPacket {
  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadPacket: false,
      title: "HQ proof decision packet hidden for this role",
      status: "hidden",
      plainEnglishSummary:
        "HQ proof-sharing decisions are a staff safety surface, not a student, chapter leader, or coach operating view.",
      candidateEvidence: null,
      defaultInput: defaultDecisionInput,
      checks: [],
      readbackEvidence: [],
      verificationPacket: buildHiddenVerificationPacket(),
      proofToCollect: [],
      counts: emptyCounts(),
    };
  }

  const candidateEvidence = findCandidateEvidence(data);
  const targetActor = getMockLocalActorContext(
    "admin@mymedlife.test",
    "Target HQ admin for local proof-sharing decision testing.",
    data.source.status,
    "local_auth_session",
    env.MYMEDLIFE_AUTH_MODE === "local_supabase" ? "signed_in" : "signed_out",
  );
  const writeConfig = getHqProofDecisionWriteConfig(env);
  const readiness = candidateEvidence
    ? getHqProofDecisionWriteReadiness(
        targetActor,
        candidateEvidence,
        defaultDecisionInput,
        env,
      )
    : null;
  const candidate = candidateEvidence ? toCandidate(candidateEvidence) : null;
  const proofMetadataObserved = candidateEvidence
    ? hasProofMetadataReadback(data, candidateEvidence)
    : false;
  const readbackEvidence = buildReadbackEvidence(data, candidate);
  const checks = buildChecks(
    data,
    candidateEvidence,
    readiness,
    proofMetadataObserved,
    env,
  );
  const status = getStatus(checks, writeConfig.enabled, readbackEvidence);
  const browserWritesExpected: 0 | 1 =
    status === "ready_for_local_hq_decision" ? 1 : 0;
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
      "This packet prepares the third local Rush Month write: HQ records whether one submitted proof/testimonial should be approved for future sharing review, held for better context, or kept internal. It proves the HQ decision event, disabled n8n outbox row, and audit log without publishing proof or sending automation.",
    candidateEvidence: candidate,
    defaultInput: defaultDecisionInput,
    checks,
    readbackEvidence,
    verificationPacket,
    proofToCollect: [
      "Screenshot of `/admin/hq-proof-write` before the test showing the packet is ready.",
      "Screenshot of `/rush-month/review` with the HQ decision form enabled for a fake Admin or Super Admin.",
      "Screenshot after submit showing the local HQ decision result state.",
      "Readback proof that the proof/testimonial status moved to approved or changes requested.",
      "Evidence that hq_sharing_decision_logged internal event, integration event, disabled outbox row, and audit log were created.",
      "Evidence that public proof publishing, warehouse export, AI summary, and external sends stayed at zero.",
    ],
    counts: {
      checks: checks.length,
      passedChecks: checks.filter((check) => check.passed).length,
      observedReadbackItems: readbackEvidence.filter((item) => {
        return item.status === "observed" || item.status === "disabled_outbox_observed";
      }).length,
      browserWritesExpected,
      externalWritesExpected: 0,
      publicSharesExpected: 0,
    },
  };
}

function findCandidateEvidence(data: ReadOnlyAppData): EvidenceItem | null {
  return (
    data.evidenceItems.find((item) => {
      return isReadyForHqDecision(item) &&
        isUuid(item.id) &&
        hasProofMetadataReadback(data, item);
    }) ??
    data.evidenceItems.find((item) => {
      return isUuid(item.id) && hasHqDecisionReadback(data, item);
    }) ??
    data.evidenceItems.find((item) => {
      return isReadyForHqDecision(item) && isUuid(item.id);
    }) ??
    data.evidenceItems.find((item) => isUuid(item.id)) ??
    data.evidenceItems.find(isReadyForHqDecision) ??
    data.evidenceItems[0] ??
    null
  );
}

function isReadyForHqDecision(evidenceItem: EvidenceItem): boolean {
  return (
    evidenceItem.status === "pending_review" ||
    evidenceItem.status === "changes_requested"
  );
}

function toCandidate(evidenceItem: EvidenceItem): HqProofDecisionCandidate {
  return {
    id: evidenceItem.id,
    assignmentId: evidenceItem.assignmentId,
    summary: evidenceItem.summary,
    status: evidenceItem.status,
    route: buildLeaderAssignmentRouteHref(evidenceItem.assignmentId, {
      source: "hq_proof_packet",
    }),
    reviewRoute: "/rush-month/review",
    usesSupabaseUuid: isUuid(evidenceItem.id),
    readyForHqDecision: isReadyForHqDecision(evidenceItem),
  };
}

function buildChecks(
  data: ReadOnlyAppData,
  evidenceItem: EvidenceItem | null,
  readiness: ReturnType<typeof getHqProofDecisionWriteReadiness> | null,
  proofMetadataObserved: boolean,
  env: EnvSource,
): HqProofDecisionPacketCheck[] {
  const localWritesRequested = env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const hqDecisionEnabled =
    env.MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE === "true";
  const localAuthMode = env.MYMEDLIFE_AUTH_MODE === "local_supabase";
  const publicSharingDisabled = env.MYMEDLIFE_ALLOW_PUBLIC_PROOF_SHARING !== "true";

  return [
    {
      key: "local_supabase_reads",
      label: "Local Supabase read model is active",
      passed: data.source.mode === "supabase",
      detail:
        data.source.mode === "supabase"
          ? "The app is reading local Supabase data instead of mock fallback data."
          : "The app is using mock fallback data, so HQ decision testing cannot target a real proof UUID.",
    },
    {
      key: "candidate_evidence",
      label: "A submitted proof/testimonial exists",
      passed: Boolean(evidenceItem),
      detail: evidenceItem
        ? `Candidate proof: ${evidenceItem.summary}`
        : "No proof/testimonial is available for HQ decision testing.",
    },
    {
      key: "candidate_evidence_uuid",
      label: "Candidate proof uses a Supabase UUID",
      passed: Boolean(evidenceItem && isUuid(evidenceItem.id)),
      detail:
        evidenceItem && isUuid(evidenceItem.id)
          ? "The candidate proof can be passed to app.record_hq_proof_sharing_decision."
          : "Mock proof IDs are intentionally blocked before HQ decisions are saved.",
    },
    {
      key: "proof_metadata_readback",
      label: "Proof metadata readback has been proven",
      passed: proofMetadataObserved,
      detail: proofMetadataObserved
        ? "The selected proof has evidence_submitted event, integration event, disabled outbox, and audit proof."
        : "Run `/admin/proof-write` before trying the HQ proof decision packet.",
    },
    {
      key: "evidence_ready_for_hq",
      label: "Proof is ready for HQ decision",
      passed: Boolean(evidenceItem && isReadyForHqDecision(evidenceItem)),
      detail:
        evidenceItem && isReadyForHqDecision(evidenceItem)
          ? `Current proof status is ${evidenceItem.status}.`
          : "HQ decisions should target proof that is pending review or has requested changes, not already-final proof.",
    },
    {
      key: "auth_mode",
      label: "Local Supabase Auth mode is selected",
      passed: localAuthMode,
      detail: localAuthMode
        ? "Local sign-in can create a fake HQ seed user session."
        : "Set MYMEDLIFE_AUTH_MODE=local_supabase for the local HQ decision test.",
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
      key: "hq_decision_flag",
      label: "HQ decision write switch is on",
      passed: hqDecisionEnabled,
      detail: hqDecisionEnabled
        ? "Only the HQ proof-sharing decision write gate is allowed to open."
        : "Set MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE=true only after proof metadata readback is proven.",
    },
    {
      key: "local_auth_session",
      label: "Fake Admin is signed in locally",
      passed: Boolean(
        readiness?.checks.find((check) => check.key === "local_auth_session")
          ?.passed,
      ),
      detail:
        readiness?.checks.find((check) => check.key === "local_auth_session")
          ?.passed
          ? "The target fake Admin has a local Supabase Auth session."
          : "Sign in as admin@mymedlife.test before saving an HQ proof decision.",
    },
    {
      key: "note_long_enough",
      label: "Default HQ decision note is valid",
      passed: Boolean(
        readiness?.checks.find((check) => check.key === "note_long_enough")
          ?.passed,
      ),
      detail:
        "The packet uses a plain-English HQ note long enough to pass local validation.",
    },
    {
      key: "public_sharing_disabled",
      label: "Public proof sharing stays disabled",
      passed: publicSharingDisabled,
      detail: publicSharingDisabled
        ? "This packet records sharing posture only. It does not publish proof to students or the public."
        : "Turn off MYMEDLIFE_ALLOW_PUBLIC_PROOF_SHARING before testing the HQ decision packet.",
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
  checks: HqProofDecisionPacketCheck[],
  writeEnabled: boolean,
  readbackEvidence: HqProofDecisionReadbackItem[],
): HqProofDecisionPacketStatus {
  if (isHqDecisionReadbackObserved(readbackEvidence)) {
    return "evidence_observed";
  }

  if (isHqDecisionCoreObservedWithoutAudit(readbackEvidence)) {
    return "needs_manual_audit_check";
  }

  if (!isCheckPassed(checks, "local_supabase_reads")) {
    return "blocked_until_local_supabase";
  }

  if (
    !isCheckPassed(checks, "proof_metadata_readback") ||
    !isCheckPassed(checks, "evidence_ready_for_hq")
  ) {
    return "blocked_until_proof_metadata";
  }

  if (
    !writeEnabled ||
    !isCheckPassed(checks, "local_write_flag") ||
    !isCheckPassed(checks, "hq_decision_flag") ||
    !isCheckPassed(checks, "public_sharing_disabled")
  ) {
    return "blocked_until_flags";
  }

  if (
    !isCheckPassed(checks, "auth_mode") ||
    !isCheckPassed(checks, "local_auth_session")
  ) {
    return "blocked_until_auth";
  }

  return "ready_for_local_hq_decision";
}

function buildReadbackEvidence(
  data: ReadOnlyAppData,
  candidate: HqProofDecisionCandidate | null,
): HqProofDecisionReadbackItem[] {
  if (!candidate) {
    return [
      {
        key: "candidate_evidence",
        label: "Candidate proof",
        status: "blocked",
        detail: "No proof/testimonial exists, so HQ decision readback cannot be checked.",
      },
    ];
  }

  const evidenceItem = data.evidenceItems.find((item) => item.id === candidate.id);
  const integrationEvent = data.integrationEventRows.find((item) => {
    return item.event_type === "hq_sharing_decision_logged" &&
      item.external_object_type === "evidence_item" &&
      item.external_object_id === candidate.id;
  });
  const event = data.eventRows.find((item) => {
    return item.event_type === "hq_sharing_decision_logged" &&
      (integrationEvent?.source_event_id
        ? item.id === integrationEvent.source_event_id
        : item.assignment_id === candidate.assignmentId);
  });
  const outbox = data.automationOutboxRows.find((item) => {
    return item.event_type === "hq_sharing_decision_logged" &&
      item.status === "disabled" &&
      (integrationEvent
        ? item.integration_event_id === integrationEvent.id
        : true);
  });
  const auditLog = data.auditLogs.find((item) => {
    return item.action === "hq_sharing_decision_logged" &&
      item.target_table === "evidence_items" &&
      item.target_id === candidate.id;
  });

  return [
    {
      key: "evidence_status",
      label: "Proof review status",
      status:
        evidenceItem?.status === "approved" ||
        evidenceItem?.status === "changes_requested"
          ? "observed"
          : "missing",
      detail:
        evidenceItem?.status === "approved"
          ? "Local readback shows HQ recorded a final sharing posture without publishing proof."
          : evidenceItem?.status === "changes_requested"
            ? "Local readback shows HQ requested better proof context."
            : "After the HQ decision test, the proof should read back as approved or changes requested.",
    },
    {
      key: "internal_event",
      label: "Internal event",
      status: event ? "observed" : "missing",
      detail: event
        ? "Internal event row records hq_sharing_decision_logged."
        : "No hq_sharing_decision_logged internal event is visible yet.",
    },
    {
      key: "integration_event",
      label: "Integration event",
      status: integrationEvent ? "observed" : "missing",
      detail: integrationEvent
        ? "Integration event records future automation intent without sending."
        : "No hq_sharing_decision_logged integration event is visible yet.",
    },
    {
      key: "disabled_outbox",
      label: "Disabled outbox row",
      status: outbox ? "disabled_outbox_observed" : "missing",
      detail: outbox
        ? "Automation outbox row exists with disabled status for future n8n pickup."
        : "No disabled HQ decision outbox row is visible yet.",
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
        ? "Audit log records the guarded HQ proof-sharing decision."
        : "Audit log proof is still missing or needs manual inspection.",
    },
  ];
}

function hasProofMetadataReadback(
  data: ReadOnlyAppData,
  evidenceItem: EvidenceItem,
): boolean {
  const assignmentSubmitted = data.assignments.some((assignment) => {
    return assignment.id === evidenceItem.assignmentId &&
      assignment.status === "submitted";
  });
  const event = data.eventRows.find((item) => {
    return item.assignment_id === evidenceItem.assignmentId &&
      item.event_type === "evidence_submitted";
  });
  const integrationEvent = data.integrationEventRows.find((item) => {
    return item.event_type === "evidence_submitted" &&
      item.external_object_type === "evidence_item" &&
      item.external_object_id === evidenceItem.id;
  });
  const outbox = data.automationOutboxRows.find((item) => {
    return item.event_type === "evidence_submitted" &&
      item.status === "disabled" &&
      (integrationEvent ? item.integration_event_id === integrationEvent.id : true);
  });
  const auditLog = data.auditLogs.find((item) => {
    return item.action === "evidence_submitted" &&
      item.target_table === "evidence_items" &&
      item.target_id === evidenceItem.id;
  });

  return Boolean(assignmentSubmitted && event && integrationEvent && outbox && auditLog);
}

function hasHqDecisionReadback(
  data: ReadOnlyAppData,
  evidenceItem: EvidenceItem,
): boolean {
  const candidate = toCandidate(evidenceItem);
  return isHqDecisionReadbackObserved(buildReadbackEvidence(data, candidate));
}

function buildVerificationPacket(
  status: HqProofDecisionPacketStatus,
  candidate: HqProofDecisionCandidate | null,
  readbackEvidence: HqProofDecisionReadbackItem[],
): HqProofDecisionVerificationPacket {
  const evidenceObserved = isHqDecisionReadbackObserved(readbackEvidence);
  const auditNeedsManualCheck = isHqDecisionCoreObservedWithoutAudit(readbackEvidence);

  return {
    status,
    canPromoteToStagingReview: evidenceObserved,
    title: "HQ proof decision operator packet",
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
        key: "MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE",
        value: "false",
        reason: "Proof metadata should already be proven before testing the HQ decision.",
      },
      {
        key: "MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE",
        value: "true",
        reason: "Open only the HQ proof-sharing decision write gate.",
      },
      {
        key: "MYMEDLIFE_ALLOW_PUBLIC_PROOF_SHARING",
        value: "false",
        reason: "This packet records sharing posture only. It does not publish proof.",
      },
    ],
    fakeAdminCredential: {
      email: "admin@mymedlife.test",
      passwordLabel: "password",
      route: "/login",
    },
    operatorSequence: [
      {
        label: "Confirm proof metadata evidence",
        route: "/admin/proof-write",
        expectedProof:
          "Proof/testimonial metadata readback is observed before HQ decision testing begins.",
      },
      {
        label: "Sign in as the fake Admin",
        route: "/login",
        expectedProof:
          "The app shows a local Supabase Auth session for admin@mymedlife.test.",
      },
      {
        label: "Open HQ proof review",
        route: candidate?.reviewRoute ?? "/rush-month/review",
        expectedProof:
          "The proof is pending HQ review and the decision form is enabled only locally.",
      },
      {
        label: "Record local HQ decision",
        route: candidate?.reviewRoute ?? "/rush-month/review",
        expectedProof:
          "The result state confirms the HQ decision was saved locally without publishing proof.",
      },
      {
        label: "Verify readback",
        route: "/admin/hq-proof-write",
        expectedProof:
          "Proof status, event, integration event, disabled outbox, and audit readback are visible.",
      },
    ],
    safetyStops: [
      "Stop if the app is not reading local Supabase data.",
      "Stop if `/admin/proof-write` has not shown proof metadata readback evidence.",
      "Stop if the target proof/testimonial is not a Supabase UUID.",
      "Stop if public proof publishing or share controls appear enabled.",
      "Stop if any external send, social post, AI summary, warehouse export, or n8n workflow appears enabled.",
      "Stop if the operator is not using a fake Admin or Super Admin local seed user.",
    ],
  };
}

function getPlainEnglishDecision(
  status: HqProofDecisionPacketStatus,
  evidenceObserved: boolean,
  auditNeedsManualCheck: boolean,
): string {
  if (evidenceObserved) {
    return "HQ decision evidence is observed. Staff can review this packet for staging only after confirming no proof was publicly published and no external sends happened.";
  }

  if (auditNeedsManualCheck) {
    return "Core HQ decision readback is visible, but audit proof needs manual confirmation before staging review.";
  }

  switch (status) {
    case "ready_for_local_hq_decision":
      return "Ready to run locally. Record one HQ proof-sharing decision and collect readback evidence before any staging discussion.";
    case "blocked_until_local_supabase":
      return "Do not run. Local Supabase readback is required before HQ proof decisions can be tested.";
    case "blocked_until_proof_metadata":
      return "Do not run. Prove proof/testimonial metadata readback before recording an HQ sharing decision.";
    case "blocked_until_flags":
      return "Do not run. Required local flags are missing or public proof sharing is not safely disabled.";
    case "blocked_until_auth":
      return "Do not run. Sign in as the fake local Admin before attempting an HQ decision.";
    case "needs_manual_audit_check":
    case "evidence_observed":
      return "Review readback evidence before continuing.";
    case "hidden":
      return "This packet is hidden for the selected role.";
  }
}

function isHqDecisionReadbackObserved(
  items: HqProofDecisionReadbackItem[],
): boolean {
  const statuses = Object.fromEntries(items.map((item) => [item.key, item.status]));

  return statuses.evidence_status === "observed" &&
    statuses.internal_event === "observed" &&
    statuses.integration_event === "observed" &&
    statuses.disabled_outbox === "disabled_outbox_observed" &&
    statuses.audit_log === "observed";
}

function isHqDecisionCoreObservedWithoutAudit(
  items: HqProofDecisionReadbackItem[],
): boolean {
  const statuses = Object.fromEntries(items.map((item) => [item.key, item.status]));

  return statuses.evidence_status === "observed" &&
    statuses.internal_event === "observed" &&
    statuses.integration_event === "observed" &&
    statuses.disabled_outbox === "disabled_outbox_observed" &&
    statuses.audit_log === "manual_check_needed";
}

function isCheckPassed(checks: HqProofDecisionPacketCheck[], key: string): boolean {
  return checks.find((check) => check.key === key)?.passed === true;
}

function buildHiddenVerificationPacket(): HqProofDecisionVerificationPacket {
  return {
    status: "hidden",
    canPromoteToStagingReview: false,
    title: "HQ proof decision packet hidden",
    plainEnglishDecision:
      "This packet is hidden for chapter operating roles and visible only to HQ safety reviewers.",
    envSettings: [],
    fakeAdminCredential: {
      email: "admin@mymedlife.test",
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
      return "Admin HQ proof decision packet";
    case "ds_admin":
      return "DS Admin HQ decision safety packet";
    case "super_admin":
      return "Full local HQ proof decision packet";
    case "member":
    case "leader":
    case "coach":
      return "HQ proof decision packet hidden for this role";
  }
}

function emptyCounts(): HqProofDecisionPacket["counts"] {
  return {
    checks: 0,
    passedChecks: 0,
    observedReadbackItems: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    publicSharesExpected: 0,
  };
}
