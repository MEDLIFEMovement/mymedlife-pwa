import type { HqProofDecisionResultCode } from "@/services/hq-proof-decision-result-states";
import {
  canMakeHqSharingDecision,
  type HqSharingDecisionInput,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { isUuid } from "@/services/action-start-write";
import { isActorAllowedForPlannedWrite } from "@/services/write-plan-matrix";
import type { Approval, EvidenceItem } from "@/shared/types/domain";
import type { ApprovalDecision } from "@/shared/types/persistence";

type EnvSource = Record<string, string | undefined>;

export type HqProofDecisionWriteConfig =
  | {
      enabled: true;
      isLocalOnly: true;
      externalWritesEnabled: false;
      publishesProof: false;
      reason: string;
    }
  | {
      enabled: false;
      isLocalOnly: true;
      externalWritesEnabled: false;
      publishesProof: false;
      reason: string;
    };

export type HqProofDecisionWriteReadiness = {
  operation: "hq_sharing_decision";
  canSubmit: boolean;
  resultCodeIfSubmitted: HqProofDecisionResultCode;
  reason: string;
  checks: Array<{
    key:
      | "local_writes_requested"
      | "hq_decision_write_approved"
      | "local_auth_session"
      | "evidence_uuid"
      | "actor_can_make_hq_decision"
      | "actor_allowed_by_write_plan"
      | "evidence_not_final"
      | "note_long_enough"
      | "public_sharing_disabled"
      | "external_writes_disabled";
    label: string;
    passed: boolean;
  }>;
};

export type HqProofDecisionRpcRow = {
  evidence_item_id: string;
  approval_id: string;
  event_id: string;
  integration_event_id: string;
  outbox_id: string;
  audit_log_id: string;
};

export type HqProofDecisionServerResult =
  | {
      success: true;
      code: Extract<
        HqProofDecisionResultCode,
        "changes_requested" | "decision_noted_without_sharing" | "sharing_approved"
      >;
      evidenceItemId: string;
      approvalId: string;
      eventId: string;
      integrationEventId: string;
      outboxId: string;
      auditLogId: string;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code: Exclude<
        HqProofDecisionResultCode,
        "changes_requested" | "decision_noted_without_sharing" | "sharing_approved"
      >;
      evidenceItemId: string;
      plainEnglishMessage: string;
    };

export type HqProofDecisionReadbackState = {
  evidenceStatus: EvidenceItem["status"];
  confirmsDecision: boolean;
  tone: "info" | "success" | "warning";
  message: string;
};

export function getHqProofDecisionWriteConfig(
  env: EnvSource = process.env,
): HqProofDecisionWriteConfig {
  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return {
      enabled: false,
      isLocalOnly: true,
      externalWritesEnabled: false,
      publishesProof: false,
      reason:
        "Local Supabase writes are disabled. Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true only for local write testing.",
    };
  }

  if (env.MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE !== "true") {
    return {
      enabled: false,
      isLocalOnly: true,
      externalWritesEnabled: false,
      publishesProof: false,
      reason:
        "HQ proof decision browser-facing writes remain disabled. Set MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE=true only after local auth and RLS are ready.",
    };
  }

  return {
    enabled: true,
    isLocalOnly: true,
    externalWritesEnabled: false,
    publishesProof: false,
    reason:
      "Local HQ proof decision writes are enabled for localhost Supabase only. Public proof sharing and external sends remain disabled.",
  };
}

export function getHqProofDecisionWriteReadiness(
  actor: LocalActorContext,
  evidenceItem: EvidenceItem,
  input: HqSharingDecisionInput,
  env: EnvSource = process.env,
): HqProofDecisionWriteReadiness {
  const config = getHqProofDecisionWriteConfig(env);
  const localWritesRequested = env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const hqDecisionWriteApproved =
    env.MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE === "true";
  const hasLocalAuthSession =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";
  const evidenceUuid = isUuid(evidenceItem.id);
  const actorCanDecide = canMakeHqSharingDecision(actor);
  const actorAllowed = isActorAllowedForPlannedWrite(
    actor.audience,
    "hq_sharing_decision",
  );
  const evidenceNotFinal = evidenceItem.status !== "approved";
  const noteLongEnough = input.note.trim().length >= 12;

  const checks: HqProofDecisionWriteReadiness["checks"] = [
    {
      key: "local_writes_requested",
      label: "Local write switch is on",
      passed: localWritesRequested,
    },
    {
      key: "hq_decision_write_approved",
      label: "HQ decision write switch is on",
      passed: hqDecisionWriteApproved,
    },
    {
      key: "local_auth_session",
      label: "Signed-in local Supabase Auth session",
      passed: hasLocalAuthSession,
    },
    {
      key: "evidence_uuid",
      label: "Evidence item ID is a Supabase UUID",
      passed: evidenceUuid,
    },
    {
      key: "actor_can_make_hq_decision",
      label: "Actor can make HQ proof decisions",
      passed: actorCanDecide,
    },
    {
      key: "actor_allowed_by_write_plan",
      label: "Actor can make HQ decisions in the write plan",
      passed: actorAllowed,
    },
    {
      key: "evidence_not_final",
      label: "Proof does not already have a final decision",
      passed: evidenceNotFinal,
    },
    {
      key: "note_long_enough",
      label: "Decision note has enough context",
      passed: noteLongEnough,
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
  const successCode = getSuccessCodeForDecision(input.decision);

  return {
    operation: "hq_sharing_decision",
    canSubmit: config.enabled && !failedCheck,
    resultCodeIfSubmitted:
      config.enabled && !failedCheck
        ? successCode
        : getHqDecisionBlockedResultCode(failedCheck?.key, config.enabled),
    reason: failedCheck
      ? `${failedCheck.label} is not ready. ${config.reason}`
      : config.reason,
    checks,
  };
}

export function getHqProofDecisionReadbackState(
  evidenceItem: Pick<EvidenceItem, "status">,
  resultCode?: HqProofDecisionResultCode,
): HqProofDecisionReadbackState | null {
  if (!resultCode) {
    return null;
  }

  if (
    resultCode !== "sharing_approved" &&
    resultCode !== "decision_noted_without_sharing" &&
    resultCode !== "changes_requested"
  ) {
    return {
      evidenceStatus: evidenceItem.status,
      confirmsDecision: false,
      tone: "info",
      message:
        "No local proof review status change is expected for this result. The page is still reading the current proof state safely.",
    };
  }

  const expectedStatus =
    resultCode === "changes_requested" ? "changes_requested" : "approved";

  if (evidenceItem.status === expectedStatus) {
    return {
      evidenceStatus: evidenceItem.status,
      confirmsDecision: true,
      tone: "success",
      message:
        "Local readback confirms the HQ proof decision was recorded without publishing proof.",
    };
  }

  return {
    evidenceStatus: evidenceItem.status,
    confirmsDecision: false,
    tone: "warning",
    message:
      "The HQ decision returned success, but the refreshed page has not read the expected proof review status yet.",
  };
}

export function mapHqDecisionToDatabaseDecision(
  decision: Approval["decision"],
): ApprovalDecision {
  switch (decision) {
    case "approved":
      return "approved_for_sharing";
    case "changes_requested":
      return "changes_requested";
    case "rejected":
      return "not_shared";
  }
}

export function mapHqProofDecisionRpcSuccess(
  evidenceItemId: string,
  decision: Approval["decision"],
  row: HqProofDecisionRpcRow,
): HqProofDecisionServerResult {
  const code = getSuccessCodeForDecision(decision);

  return {
    success: true,
    code,
    evidenceItemId,
    approvalId: row.approval_id,
    eventId: row.event_id,
    integrationEventId: row.integration_event_id,
    outboxId: row.outbox_id,
    auditLogId: row.audit_log_id,
    plainEnglishMessage:
      "HQ proof decision saved locally. The app recorded the approval decision, event, integration event, disabled outbox row, and audit log. No public sharing or external automation ran.",
  };
}

export function mapHqProofDecisionRpcError(
  evidenceItemId: string,
  error: { code?: string; message?: string },
): HqProofDecisionServerResult {
  const message = error.message?.toLowerCase() ?? "";

  if (error.code === "P0002" || message.includes("evidence item not found")) {
    return failureResult(
      evidenceItemId,
      "evidence_not_found",
      "The proof item was not found in local Supabase, so no HQ decision was saved.",
    );
  }

  if (message.includes("authenticated user required")) {
    return failureResult(
      evidenceItemId,
      "missing_auth",
      "Sign in with a local Supabase HQ seed user before saving this decision.",
    );
  }

  if (error.code === "42501" || message.includes("actor cannot record")) {
    return failureResult(
      evidenceItemId,
      "permission_denied",
      "This signed-in local role cannot make HQ proof-sharing decisions.",
    );
  }

  if (message.includes("already has a final")) {
    return failureResult(
      evidenceItemId,
      "already_decided",
      "This proof already has a final HQ sharing decision.",
    );
  }

  if (error.code === "22023" || message.includes("note")) {
    return failureResult(
      evidenceItemId,
      "note_too_short",
      "Add a plain-English HQ decision note before saving.",
    );
  }

  return failureResult(
    evidenceItemId,
    "server_error",
    "The app could not safely save this HQ proof decision. No public sharing or external automation ran.",
  );
}

export function parseHqProofDecision(
  value: FormDataEntryValue | null,
): Approval["decision"] | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (
    trimmed === "approved" ||
    trimmed === "changes_requested" ||
    trimmed === "rejected"
  ) {
    return trimmed;
  }

  return null;
}

function getSuccessCodeForDecision(
  decision: Approval["decision"],
): Extract<
  HqProofDecisionResultCode,
  "changes_requested" | "decision_noted_without_sharing" | "sharing_approved"
> {
  switch (decision) {
    case "approved":
      return "sharing_approved";
    case "changes_requested":
      return "changes_requested";
    case "rejected":
      return "decision_noted_without_sharing";
  }
}

function getHqDecisionBlockedResultCode(
  failedCheckKey:
    | HqProofDecisionWriteReadiness["checks"][number]["key"]
    | undefined,
  configEnabled: boolean,
): HqProofDecisionResultCode {
  if (!configEnabled) {
    return "write_disabled";
  }

  switch (failedCheckKey) {
    case "local_auth_session":
      return "missing_auth";
    case "evidence_uuid":
      return "evidence_not_found";
    case "actor_can_make_hq_decision":
    case "actor_allowed_by_write_plan":
      return "permission_denied";
    case "evidence_not_final":
      return "already_decided";
    case "note_long_enough":
      return "note_too_short";
    case "public_sharing_disabled":
      return "public_sharing_disabled";
    default:
      return "write_disabled";
  }
}

function failureResult(
  evidenceItemId: string,
  code: Exclude<
    HqProofDecisionResultCode,
    "changes_requested" | "decision_noted_without_sharing" | "sharing_approved"
  >,
  plainEnglishMessage: string,
): HqProofDecisionServerResult {
  return {
    success: false,
    code,
    evidenceItemId,
    plainEnglishMessage,
  };
}
