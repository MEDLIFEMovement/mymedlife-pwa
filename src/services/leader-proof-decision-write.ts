import { isUuid } from "@/services/action-start-write";
import {
  canRecordLeaderProofDecision,
  type LeaderProofDecisionInput,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { LeaderProofDecisionResultCode } from "@/services/leader-proof-decision-result-states";
import { canReadAssignment } from "@/services/role-visibility";
import { isActorAllowedForPlannedWrite } from "@/services/write-plan-matrix";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type LeaderProofDecisionWriteConfig =
  | {
      enabled: true;
      environment: "local" | "production";
      isLocalOnly: boolean;
      externalWritesEnabled: false;
      memberNudgesEnabled: false;
      publishesProof: false;
      reason: string;
    }
  | {
      enabled: false;
      environment: "local" | "staging" | "production";
      isLocalOnly: boolean;
      externalWritesEnabled: false;
      memberNudgesEnabled: false;
      publishesProof: false;
      reason: string;
    };

export type LeaderProofDecisionWriteReadiness = {
  operation: "leader_proof_decision";
  environment: "local" | "staging" | "production";
  canSubmit: boolean;
  resultCodeIfSubmitted: LeaderProofDecisionResultCode;
  reason: string;
  checks: Array<{
    key:
      | "local_writes_requested"
      | "leader_proof_decision_write_approved"
      | "local_auth_session"
      | "assignment_uuid"
      | "evidence_uuid"
      | "actor_can_read_assignment"
      | "actor_can_record_leader_proof_decision"
      | "actor_allowed_by_write_plan"
      | "proof_ready_for_decision"
      | "note_long_enough"
      | "member_nudges_disabled"
      | "public_sharing_disabled"
      | "external_writes_disabled";
    label: string;
    passed: boolean;
  }>;
};

export type LeaderProofDecisionRpcRow = {
  evidence_item_id: string;
  assignment_id: string;
  approval_id: string;
  points_event_id: string | null;
  kpi_event_id: string | null;
  event_id: string;
  integration_event_id: string;
  outbox_id: string;
  audit_log_id: string;
};

export type LeaderProofDecisionServerResult =
  | {
      success: true;
      code: Extract<
        LeaderProofDecisionResultCode,
        "changes_requested" | "proof_approved" | "proof_rejected"
      >;
      evidenceItemId: string;
      assignmentId: string;
      approvalId: string;
      pointsEventId: string | null;
      kpiEventId: string | null;
      eventId: string;
      integrationEventId: string;
      outboxId: string;
      auditLogId: string;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code: Exclude<
        LeaderProofDecisionResultCode,
        "changes_requested" | "proof_approved" | "proof_rejected"
      >;
      evidenceItemId: string;
      assignmentId: string;
      plainEnglishMessage: string;
    };

export type LeaderProofDecisionReadbackState = {
  assignmentStatus: Assignment["status"];
  evidenceStatus: EvidenceItem["status"];
  confirmsDecision: boolean;
  tone: "info" | "success" | "warning";
  message: string;
};

export function getLeaderProofDecisionWriteConfig(
  env: EnvSource = process.env,
): LeaderProofDecisionWriteConfig {
  const environment = getLeaderProofDecisionEnvironment(env);

  if (environment === "production") {
    if (env.MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE !== "true") {
      return disabledConfig(
        environment,
        "Leader proof decisions stay locked until the dedicated write flag is enabled.",
      );
    }

    if (
      env.MYMEDLIFE_ALLOW_PRODUCTION_LEADER_PROOF_DECISION_WRITE !== "true"
    ) {
      return disabledConfig(
        environment,
        "Production leader proof decisions require the separate production approval flag.",
      );
    }

    return {
      enabled: true,
      environment,
      isLocalOnly: false,
      externalWritesEnabled: false,
      memberNudgesEnabled: false,
      publishesProof: false,
      reason:
        "Production leader proof decisions are enabled for authenticated eligible chapter leaders and Super Admin. Member nudges, public proof sharing, and external sends remain disabled.",
    };
  }

  if (environment === "staging") {
    return disabledConfig(
      environment,
      "Hosted staging leader proof decisions remain disabled until a dedicated staging approval is configured.",
    );
  }

  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return disabledConfig(
      environment,
      "Local Supabase writes are disabled. Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true only for local write testing.",
    );
  }

  if (env.MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE !== "true") {
    return disabledConfig(
      environment,
      "Leader proof decision browser-facing writes remain disabled. Set MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE=true only after local auth, RLS, and Goal 115 SQL tests are ready.",
    );
  }

  return {
    enabled: true,
    environment,
    isLocalOnly: true,
    externalWritesEnabled: false,
    memberNudgesEnabled: false,
    publishesProof: false,
    reason:
      "Local leader proof decision writes are enabled for localhost Supabase only. Member nudges, public proof sharing, and external sends remain disabled.",
  };
}

export function getLeaderProofDecisionWriteReadiness(
  actor: LocalActorContext,
  assignment: Assignment,
  evidenceItem: EvidenceItem | null,
  input: LeaderProofDecisionInput,
  env: EnvSource = process.env,
): LeaderProofDecisionWriteReadiness {
  const config = getLeaderProofDecisionWriteConfig(env);
  const environmentWriteApproved =
    config.environment === "production"
      ? env.MYMEDLIFE_ALLOW_PRODUCTION_LEADER_PROOF_DECISION_WRITE === "true"
      : env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const leaderProofDecisionWriteApproved =
    env.MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE === "true";
  const hasLocalAuthSession =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";
  const assignmentUuid = isUuid(assignment.id);
  const evidenceUuid = Boolean(evidenceItem && isUuid(evidenceItem.id));
  const actorCanRead = canReadAssignment(actor, assignment);
  const actorCanRecord = canRecordLeaderProofDecision(actor);
  const actorAllowed = isActorAllowedForPlannedWrite(
    actor.audience,
    "leader_proof_decision",
  );
  const proofReady =
    assignment.status === "submitted" && evidenceItem?.status === "pending_review";
  const noteLongEnough = input.note.trim().length >= 12;

  const checks: LeaderProofDecisionWriteReadiness["checks"] = [
    {
      key: "local_writes_requested",
      label:
        config.environment === "production"
          ? "Production leader decision approval is on"
          : "Local write switch is on",
      passed: environmentWriteApproved,
    },
    {
      key: "leader_proof_decision_write_approved",
      label: "Leader proof decision write switch is on",
      passed: leaderProofDecisionWriteApproved,
    },
    {
      key: "local_auth_session",
      label: "Signed-in Supabase Auth session",
      passed: hasLocalAuthSession,
    },
    {
      key: "assignment_uuid",
      label: "Assignment ID is a Supabase UUID",
      passed: assignmentUuid,
    },
    {
      key: "evidence_uuid",
      label: "Evidence item ID is a Supabase UUID",
      passed: evidenceUuid,
    },
    {
      key: "actor_can_read_assignment",
      label: "Actor can read this assignment",
      passed: actorCanRead,
    },
    {
      key: "actor_can_record_leader_proof_decision",
      label: "Actor can record chapter proof decisions",
      passed: actorCanRecord,
    },
    {
      key: "actor_allowed_by_write_plan",
      label: "Actor can make leader proof decisions in the write plan",
      passed: actorAllowed,
    },
    {
      key: "proof_ready_for_decision",
      label: "Assignment and proof are ready for leader decision",
      passed: proofReady,
    },
    {
      key: "note_long_enough",
      label: "Decision note has enough context",
      passed: noteLongEnough,
    },
    {
      key: "member_nudges_disabled",
      label: "Member nudges stay disabled",
      passed: !config.memberNudgesEnabled,
    },
    {
      key: "public_sharing_disabled",
      label: "Public proof sharing stays disabled",
      passed: !config.publishesProof,
    },
    {
      key: "external_writes_disabled",
      label: "External sends stay disabled",
      passed: !config.externalWritesEnabled,
    },
  ];

  const failedCheck = checks.find((check) => !check.passed);

  return {
    operation: "leader_proof_decision",
    environment: config.environment,
    canSubmit: config.enabled && !failedCheck,
    resultCodeIfSubmitted:
      config.enabled && !failedCheck
        ? getSuccessCodeForLeaderDecision(input.decision)
        : getLeaderDecisionBlockedResultCode(failedCheck?.key, config.enabled),
    reason: failedCheck
      ? `${failedCheck.label} is not ready. ${config.reason}`
      : config.reason,
    checks,
  };
}

export function getLeaderProofDecisionReadbackState(
  assignment: Pick<Assignment, "status">,
  evidenceItem: Pick<EvidenceItem, "status"> | null,
  resultCode?: LeaderProofDecisionResultCode,
): LeaderProofDecisionReadbackState | null {
  if (!resultCode || !evidenceItem) {
    return null;
  }

  if (
    resultCode !== "proof_approved" &&
    resultCode !== "changes_requested" &&
    resultCode !== "proof_rejected"
  ) {
    return {
      assignmentStatus: assignment.status,
      evidenceStatus: evidenceItem.status,
      confirmsDecision: false,
      tone: "info",
      message:
        "No leader proof status change is expected for this result. The page is still reading current proof state safely.",
    };
  }

  const expectedAssignmentStatus =
    resultCode === "proof_approved" ? "approved" : "changes_requested";
  const expectedEvidenceStatus =
    resultCode === "proof_approved"
      ? "approved"
      : resultCode === "proof_rejected"
        ? "rejected"
        : "changes_requested";

  if (
    assignment.status === expectedAssignmentStatus &&
    evidenceItem.status === expectedEvidenceStatus
  ) {
    return {
      assignmentStatus: assignment.status,
      evidenceStatus: evidenceItem.status,
      confirmsDecision: true,
      tone: "success",
      message:
        "App-owned readback confirms the leader proof decision was recorded without member nudges, public proof sharing, or external automation.",
    };
  }

  return {
    assignmentStatus: assignment.status,
    evidenceStatus: evidenceItem.status,
    confirmsDecision: false,
    tone: "warning",
    message:
      "The leader proof decision returned success, but the refreshed page has not read the expected assignment and proof status yet.",
  };
}

export function mapLeaderProofDecisionRpcSuccess(
  evidenceItemId: string,
  decision: LeaderProofDecisionInput["decision"],
  row: LeaderProofDecisionRpcRow,
): LeaderProofDecisionServerResult {
  return {
    success: true,
    code: getSuccessCodeForLeaderDecision(decision),
    evidenceItemId,
    assignmentId: row.assignment_id,
    approvalId: row.approval_id,
    pointsEventId: row.points_event_id,
    kpiEventId: row.kpi_event_id,
    eventId: row.event_id,
    integrationEventId: row.integration_event_id,
    outboxId: row.outbox_id,
    auditLogId: row.audit_log_id,
    plainEnglishMessage:
      "Leader proof decision saved. The app recorded assignment/proof status, approval, event, integration event, disabled outbox, and audit rows. Approval also records app-owned points and KPI rows. No member nudge, public sharing, or external automation ran.",
  };
}

export function mapLeaderProofDecisionRpcError(
  evidenceItemId: string,
  assignmentId: string,
  error: { code?: string; message?: string },
): LeaderProofDecisionServerResult {
  const message = error.message?.toLowerCase() ?? "";

  if (error.code === "P0002" || message.includes("evidence item not found")) {
    return failureResult(
      evidenceItemId,
      assignmentId,
      "evidence_not_found",
      "The proof item was not found in app-owned data, so no leader proof decision was saved.",
    );
  }

  if (message.includes("authenticated user required")) {
    return failureResult(
      evidenceItemId,
      assignmentId,
      "missing_auth",
      "Sign in with an eligible Supabase chapter leader or Super Admin account before saving this decision.",
    );
  }

  if (error.code === "42501" || message.includes("actor cannot record")) {
    return failureResult(
      evidenceItemId,
      assignmentId,
      "permission_denied",
      "This signed-in role cannot record chapter proof decisions.",
    );
  }

  if (message.includes("already has a final")) {
    return failureResult(
      evidenceItemId,
      assignmentId,
      "already_approved",
      "This proof already has a final leader proof decision.",
    );
  }

  if (message.includes("not ready")) {
    return failureResult(
      evidenceItemId,
      assignmentId,
      "proof_not_submitted",
      "This assignment and proof are not ready for a leader proof decision.",
    );
  }

  if (error.code === "22023" || message.includes("note")) {
    return failureResult(
      evidenceItemId,
      assignmentId,
      "note_too_short",
      "Add a plain-English leader decision note before saving.",
    );
  }

  return failureResult(
    evidenceItemId,
    assignmentId,
    "server_error",
    "The app could not safely save this leader proof decision. No member nudge, public sharing, or external automation ran.",
  );
}

export function parseLeaderProofDecision(
  value: FormDataEntryValue | null,
): LeaderProofDecisionInput["decision"] | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (
    trimmed === "approve" ||
    trimmed === "request_changes" ||
    trimmed === "reject"
  ) {
    return trimmed;
  }

  return null;
}

function getLeaderProofDecisionEnvironment(
  env: EnvSource,
): "local" | "staging" | "production" {
  if (env.MYMEDLIFE_AUTH_MODE === "production_supabase") return "production";
  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") return "staging";
  return "local";
}

function disabledConfig(
  environment: "local" | "staging" | "production",
  reason: string,
): LeaderProofDecisionWriteConfig {
  return {
    enabled: false,
    environment,
    isLocalOnly: environment === "local",
    externalWritesEnabled: false,
    memberNudgesEnabled: false,
    publishesProof: false,
    reason,
  };
}

function getSuccessCodeForLeaderDecision(
  decision: LeaderProofDecisionInput["decision"],
): Extract<
  LeaderProofDecisionResultCode,
  "changes_requested" | "proof_approved" | "proof_rejected"
> {
  switch (decision) {
    case "approve":
      return "proof_approved";
    case "request_changes":
      return "changes_requested";
    case "reject":
      return "proof_rejected";
  }
}

function getLeaderDecisionBlockedResultCode(
  failedCheckKey:
    | LeaderProofDecisionWriteReadiness["checks"][number]["key"]
    | undefined,
  configEnabled: boolean,
): LeaderProofDecisionResultCode {
  if (!configEnabled) {
    return "write_disabled";
  }

  switch (failedCheckKey) {
    case "local_auth_session":
      return "missing_auth";
    case "assignment_uuid":
    case "evidence_uuid":
      return "evidence_not_found";
    case "actor_can_read_assignment":
    case "actor_can_record_leader_proof_decision":
    case "actor_allowed_by_write_plan":
      return "permission_denied";
    case "proof_ready_for_decision":
      return "proof_not_submitted";
    case "note_long_enough":
      return "note_too_short";
    default:
      return "write_disabled";
  }
}

function failureResult(
  evidenceItemId: string,
  assignmentId: string,
  code: Exclude<
    LeaderProofDecisionResultCode,
    "changes_requested" | "proof_approved" | "proof_rejected"
  >,
  plainEnglishMessage: string,
): LeaderProofDecisionServerResult {
  return {
    success: false,
    code,
    evidenceItemId,
    assignmentId,
    plainEnglishMessage,
  };
}
