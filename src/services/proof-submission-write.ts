import type { ProofSubmissionResultCode } from "@/services/proof-submission-result-states";
import {
  canSubmitProofForAssignment,
  type ProofSubmissionInput,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { isActorAllowedForPlannedWrite } from "@/services/write-plan-matrix";
import { isUuid } from "@/services/action-start-write";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type ProofSubmissionWriteConfig =
  | {
      enabled: true;
      isLocalOnly: true;
      externalWritesEnabled: false;
      uploadsEnabled: false;
      reason: string;
    }
  | {
      enabled: false;
      isLocalOnly: true;
      externalWritesEnabled: false;
      uploadsEnabled: false;
      reason: string;
    };

export type ProofSubmissionWriteReadiness = {
  operation: "evidence_submitted";
  canSubmit: boolean;
  resultCodeIfSubmitted: ProofSubmissionResultCode;
  reason: string;
  checks: Array<{
    key:
      | "local_writes_requested"
      | "proof_submission_write_approved"
      | "local_auth_session"
      | "assignment_uuid"
      | "actor_can_submit_proof"
      | "actor_allowed_by_write_plan"
      | "assignment_ready_for_proof"
      | "summary_long_enough"
      | "proof_uploads_disabled"
      | "external_writes_disabled";
    label: string;
    passed: boolean;
  }>;
};

export type ProofSubmissionRpcRow = {
  assignment_id: string;
  evidence_item_id: string;
  event_id: string;
  integration_event_id: string;
  outbox_id: string;
  audit_log_id: string;
};

export type ProofSubmissionServerResult =
  | {
      success: true;
      code: "proof_submitted";
      assignmentId: string;
      evidenceItemId: string;
      eventId: string;
      integrationEventId: string;
      outboxId: string;
      auditLogId: string;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code: Exclude<ProofSubmissionResultCode, "proof_submitted">;
      assignmentId: string;
      plainEnglishMessage: string;
    };

export type ProofSubmissionReadbackState = {
  assignmentStatus: Assignment["status"];
  confirmsSubmitted: boolean;
  tone: "info" | "success" | "warning";
  message: string;
};

export const allowedProofEvidenceTypes = [
  "testimonial_text",
  "bridge_video",
  "link",
  "text",
  "external_link",
] as const satisfies readonly EvidenceItem["evidenceType"][];

export function parseProofSubmissionStatus(
  value: string | null | undefined,
): Assignment["status"] | null {
  switch (value) {
    case "not_started":
    case "in_progress":
    case "submitted":
    case "approved":
    case "changes_requested":
      return value;
    default:
      return null;
  }
}

export function isProofSubmissionReadyStatus(
  status: Assignment["status"],
): boolean {
  return status === "in_progress" || status === "changes_requested";
}

export function isProofAccuracyConfirmed(
  value: FormDataEntryValue | null,
): boolean {
  return typeof value === "string" && value.trim() === "yes";
}

export function getProofSubmissionWriteConfig(
  env: EnvSource = process.env,
): ProofSubmissionWriteConfig {
  if (env.MYMEDLIFE_ALLOW_PROOF_UPLOADS === "true") {
    return {
      enabled: false,
      isLocalOnly: true,
      externalWritesEnabled: false,
      uploadsEnabled: false,
      reason:
        "Proof uploads are still disabled. Turn off MYMEDLIFE_ALLOW_PROOF_UPLOADS before testing metadata-only proof writes.",
    };
  }

  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return {
      enabled: false,
      isLocalOnly: true,
      externalWritesEnabled: false,
      uploadsEnabled: false,
      reason:
        "Local Supabase writes are disabled. Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true only for local write testing.",
    };
  }

  if (env.MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE !== "true") {
    return {
      enabled: false,
      isLocalOnly: true,
      externalWritesEnabled: false,
      uploadsEnabled: false,
      reason:
        "Proof-submission browser-facing writes remain disabled. Set MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE=true only after local auth and RLS are ready.",
    };
  }

  return {
    enabled: true,
    isLocalOnly: true,
    externalWritesEnabled: false,
    uploadsEnabled: false,
    reason:
      "Local proof/testimonial metadata writes are enabled for localhost Supabase only. Uploads and external sends remain disabled.",
  };
}

export function getProofSubmissionWriteReadiness(
  actor: LocalActorContext,
  assignment: Assignment,
  input: ProofSubmissionInput,
  env: EnvSource = process.env,
): ProofSubmissionWriteReadiness {
  const config = getProofSubmissionWriteConfig(env);
  const localWritesRequested = env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const proofSubmissionWriteApproved =
    env.MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE === "true";
  const hasLocalAuthSession =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";
  const assignmentUuid = isUuid(assignment.id);
  const actorCanSubmitProof = canSubmitProofForAssignment(actor, assignment);
  const actorAllowed = isActorAllowedForPlannedWrite(
    actor.audience,
    "evidence_submitted",
  );
  const assignmentReady = isProofSubmissionReadyStatus(assignment.status);
  const summaryLongEnough = input.summary.trim().length >= 12;
  const uploadsDisabled = env.MYMEDLIFE_ALLOW_PROOF_UPLOADS !== "true";

  const checks: ProofSubmissionWriteReadiness["checks"] = [
    {
      key: "local_writes_requested",
      label: "Local write switch is on",
      passed: localWritesRequested,
    },
    {
      key: "proof_submission_write_approved",
      label: "Proof-submission write switch is on",
      passed: proofSubmissionWriteApproved,
    },
    {
      key: "local_auth_session",
      label: "Signed-in local Supabase Auth session",
      passed: hasLocalAuthSession,
    },
    {
      key: "assignment_uuid",
      label: "Assignment ID is a Supabase UUID",
      passed: assignmentUuid,
    },
    {
      key: "actor_can_submit_proof",
      label: "Actor can submit proof for this assignment",
      passed: actorCanSubmitProof,
    },
    {
      key: "actor_allowed_by_write_plan",
      label: "Actor can submit proof in the write plan",
      passed: actorAllowed,
    },
    {
      key: "assignment_ready_for_proof",
      label: "Assignment is ready for proof",
      passed: assignmentReady,
    },
    {
      key: "summary_long_enough",
      label: "Proof summary has enough context",
      passed: summaryLongEnough,
    },
    {
      key: "proof_uploads_disabled",
      label: "File uploads stay disabled",
      passed: uploadsDisabled,
    },
    {
      key: "external_writes_disabled",
      label: "External sends stay disabled",
      passed: !config.externalWritesEnabled,
    },
  ];

  const failedCheck = checks.find((check) => !check.passed);

  return {
    operation: "evidence_submitted",
    canSubmit: config.enabled && !failedCheck,
    resultCodeIfSubmitted:
      config.enabled && !failedCheck
        ? "proof_submitted"
        : getProofSubmissionBlockedResultCode(failedCheck?.key, config.enabled),
    reason: failedCheck
      ? `${failedCheck.label} is not ready. ${config.reason}`
      : config.reason,
    checks,
  };
}

export function getProofSubmissionReadbackState(
  assignment: Pick<Assignment, "status">,
  resultCode?: ProofSubmissionResultCode,
): ProofSubmissionReadbackState | null {
  if (!resultCode) {
    return null;
  }

  if (resultCode !== "proof_submitted") {
    return {
      assignmentStatus: assignment.status,
      confirmsSubmitted: false,
      tone: "info",
      message:
        "No local proof status change is expected for this result. The page is still reading the current assignment state safely.",
    };
  }

  if (assignment.status === "submitted") {
    return {
      assignmentStatus: assignment.status,
      confirmsSubmitted: true,
      tone: "success",
      message:
        "Local readback confirms this proof/testimonial is submitted for HQ review.",
    };
  }

  return {
    assignmentStatus: assignment.status,
    confirmsSubmitted: false,
    tone: "warning",
    message:
      "The proof submission returned success, but the refreshed page has not read a submitted assignment yet.",
  };
}

export function mapProofSubmissionRpcSuccess(
  assignmentId: string,
  row: ProofSubmissionRpcRow,
): ProofSubmissionServerResult {
  return {
    success: true,
    code: "proof_submitted",
    assignmentId,
    evidenceItemId: row.evidence_item_id,
    eventId: row.event_id,
    integrationEventId: row.integration_event_id,
    outboxId: row.outbox_id,
    auditLogId: row.audit_log_id,
    plainEnglishMessage:
      "Proof/testimonial metadata submitted locally. The app recorded the evidence item, event, integration event, disabled outbox row, and audit log. No upload, public sharing, or external send happened.",
  };
}

export function getProofSubmissionAccuracyRequiredServerResult(
  assignmentId: string,
): ProofSubmissionServerResult {
  return failureResult(
    assignmentId,
    "accuracy_required",
    "Confirm that this testimonial or proof summary is accurate and safe for private MEDLIFE review before saving it locally.",
  );
}

export function getProofSubmissionAlreadySubmittedServerResult(
  assignmentId: string,
): ProofSubmissionServerResult {
  return failureResult(
    assignmentId,
    "already_submitted",
    "This assignment already has submitted or approved proof in local Supabase, so no duplicate proof item was created.",
  );
}

export function getProofSubmissionActionNotReadyServerResult(
  assignmentId: string,
): ProofSubmissionServerResult {
  return failureResult(
    assignmentId,
    "action_not_ready",
    "Start the action before submitting proof. The app left the assignment unchanged.",
  );
}

export function mapProofSubmissionRpcError(
  assignmentId: string,
  error: { code?: string; message?: string },
): ProofSubmissionServerResult {
  const message = error.message?.toLowerCase() ?? "";

  if (message.includes("accuracy") || message.includes("private medlife review")) {
    return getProofSubmissionAccuracyRequiredServerResult(assignmentId);
  }

  if (error.code === "P0002" || message.includes("assignment not found")) {
    return failureResult(
      assignmentId,
      "assignment_not_found",
      "The action was not found in local Supabase, so no proof was saved.",
    );
  }

  if (message.includes("authenticated user required")) {
    return failureResult(
      assignmentId,
      "missing_auth",
      "Sign in with a local Supabase seed user before submitting proof.",
    );
  }

  if (error.code === "22023" || message.includes("proof summary")) {
    return failureResult(
      assignmentId,
      "summary_too_short",
      "Add a short testimonial or context note before saving proof.",
    );
  }

  if (message.includes("already submitted")) {
    return getProofSubmissionAlreadySubmittedServerResult(assignmentId);
  }

  if (error.code === "42501" || message.includes("cannot submit proof")) {
    return failureResult(
      assignmentId,
      "permission_denied",
      "This signed-in local role cannot submit proof for this action.",
    );
  }

  return failureResult(
    assignmentId,
    "server_error",
    "The app could not safely submit this proof item. No upload or external automation ran.",
  );
}

export function parseProofEvidenceType(
  value: FormDataEntryValue | null,
): EvidenceItem["evidenceType"] | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return allowedProofEvidenceTypes.includes(
    trimmed as (typeof allowedProofEvidenceTypes)[number],
  )
    ? (trimmed as EvidenceItem["evidenceType"])
    : null;
}

function getProofSubmissionBlockedResultCode(
  failedCheckKey:
    | ProofSubmissionWriteReadiness["checks"][number]["key"]
    | undefined,
  configEnabled: boolean,
): ProofSubmissionResultCode {
  if (!configEnabled) {
    return "write_disabled";
  }

  switch (failedCheckKey) {
    case "local_auth_session":
      return "missing_auth";
    case "assignment_uuid":
      return "assignment_not_found";
    case "actor_can_submit_proof":
    case "actor_allowed_by_write_plan":
      return "permission_denied";
    case "assignment_ready_for_proof":
      return "action_not_ready";
    case "summary_long_enough":
      return "summary_too_short";
    case "proof_uploads_disabled":
      return "upload_disabled";
    default:
      return "write_disabled";
  }
}

function failureResult(
  assignmentId: string,
  code: Exclude<ProofSubmissionResultCode, "proof_submitted">,
  plainEnglishMessage: string,
): ProofSubmissionServerResult {
  return {
    success: false,
    code,
    assignmentId,
    plainEnglishMessage,
  };
}
