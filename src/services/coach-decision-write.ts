import type { CoachDecisionResultCode } from "@/services/coach-decision-result-states";
import {
  canLogCoachDecision,
  type CoachDecisionInput,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { isUuid } from "@/services/action-start-write";
import { isActorAllowedForPlannedWrite } from "@/services/write-plan-matrix";
import type { PhaseRow, ReadinessStatus, CoachValidationStatus } from "@/shared/types/persistence";

type EnvSource = Record<string, string | undefined>;

export type CoachDecisionWriteConfig =
  | {
      enabled: true;
      isLocalOnly: true;
      externalWritesEnabled: false;
      escalationPacketsEnabled: false;
      reason: string;
    }
  | {
      enabled: false;
      isLocalOnly: true;
      externalWritesEnabled: false;
      escalationPacketsEnabled: false;
      reason: string;
    };

export type CoachDecisionContext = {
  chapterId: string;
  campaignId: string;
  phaseId: string;
};

export type CoachDecisionWriteReadiness = {
  operation: "coach_decision_logged";
  canSubmit: boolean;
  resultCodeIfSubmitted: CoachDecisionResultCode;
  reason: string;
  checks: Array<{
    key:
      | "local_writes_requested"
      | "coach_decision_write_approved"
      | "local_auth_session"
      | "chapter_uuid"
      | "campaign_uuid"
      | "phase_uuid"
      | "actor_can_log_coach_decision"
      | "actor_allowed_by_write_plan"
      | "coach_portfolio_or_staff"
      | "note_long_enough"
      | "blocker_summary_present"
      | "escalation_packets_disabled"
      | "external_writes_disabled";
    label: string;
    passed: boolean;
  }>;
};

export type CoachDecisionRpcRow = {
  review_id: string;
  event_id: string;
  integration_event_id: string;
  outbox_id: string;
  audit_log_id: string;
  next_readiness_status: ReadinessStatus;
  next_coach_validation_status: CoachValidationStatus;
};

export type CoachDecisionServerResult =
  | {
      success: true;
      code: Extract<
        CoachDecisionResultCode,
        "advance_recorded" | "hold_recorded" | "intervention_recorded"
      >;
      reviewId: string;
      eventId: string;
      integrationEventId: string;
      outboxId: string;
      auditLogId: string;
      nextReadinessStatus: ReadinessStatus;
      nextCoachValidationStatus: CoachValidationStatus;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code: Exclude<
        CoachDecisionResultCode,
        "advance_recorded" | "hold_recorded" | "intervention_recorded"
      >;
      plainEnglishMessage: string;
    };

export type CoachDecisionReadbackState = {
  confirmsDecision: boolean;
  tone: "info" | "success" | "warning";
  message: string;
  readinessStatus?: ReadinessStatus;
  coachValidationStatus?: CoachValidationStatus;
};

export function getCoachDecisionWriteConfig(
  env: EnvSource = process.env,
): CoachDecisionWriteConfig {
  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return {
      enabled: false,
      isLocalOnly: true,
      externalWritesEnabled: false,
      escalationPacketsEnabled: false,
      reason:
        "Local Supabase writes are disabled. Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true only for local write testing.",
    };
  }

  if (env.MYMEDLIFE_ENABLE_COACH_DECISION_WRITE !== "true") {
    return {
      enabled: false,
      isLocalOnly: true,
      externalWritesEnabled: false,
      escalationPacketsEnabled: false,
      reason:
        "Coach decision browser-facing writes remain disabled. Set MYMEDLIFE_ENABLE_COACH_DECISION_WRITE=true only after local auth and RLS are ready.",
    };
  }

  return {
    enabled: true,
    isLocalOnly: true,
    externalWritesEnabled: false,
    escalationPacketsEnabled: false,
    reason:
      "Local coach decision writes are enabled for localhost Supabase only. Escalation packets and external sends remain disabled.",
  };
}

export function getCoachDecisionWriteReadiness(
  actor: LocalActorContext,
  input: CoachDecisionInput,
  context: CoachDecisionContext,
  env: EnvSource = process.env,
): CoachDecisionWriteReadiness {
  const config = getCoachDecisionWriteConfig(env);
  const localWritesRequested = env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const coachDecisionWriteApproved =
    env.MYMEDLIFE_ENABLE_COACH_DECISION_WRITE === "true";
  const hasLocalAuthSession =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";
  const actorCanLog = canLogCoachDecision(actor);
  const actorAllowed = isActorAllowedForPlannedWrite(
    actor.audience,
    "coach_decision_logged",
  );
  const coachPortfolioOrStaff =
    actor.audience !== "coach" || actor.coachPortfolioChapterNames.length > 0;
  const noteLongEnough = input.note.trim().length >= 12;
  const blockerSummary =
    input.decision !== "intervene" ||
    (input.blockerSummary?.trim().length ?? 0) >= 8;

  const checks: CoachDecisionWriteReadiness["checks"] = [
    {
      key: "local_writes_requested",
      label: "Local write switch is on",
      passed: localWritesRequested,
    },
    {
      key: "coach_decision_write_approved",
      label: "Coach decision write switch is on",
      passed: coachDecisionWriteApproved,
    },
    {
      key: "local_auth_session",
      label: "Signed-in local Supabase Auth session",
      passed: hasLocalAuthSession,
    },
    {
      key: "chapter_uuid",
      label: "Chapter ID is a Supabase UUID",
      passed: isUuid(context.chapterId),
    },
    {
      key: "campaign_uuid",
      label: "Campaign ID is a Supabase UUID",
      passed: isUuid(context.campaignId),
    },
    {
      key: "phase_uuid",
      label: "Phase ID is a Supabase UUID",
      passed: isUuid(context.phaseId),
    },
    {
      key: "actor_can_log_coach_decision",
      label: "Actor can log coach decisions",
      passed: actorCanLog,
    },
    {
      key: "actor_allowed_by_write_plan",
      label: "Actor can log coach decisions in the write plan",
      passed: actorAllowed,
    },
    {
      key: "coach_portfolio_or_staff",
      label: "Coach has portfolio access or staff role",
      passed: coachPortfolioOrStaff,
    },
    {
      key: "note_long_enough",
      label: "Coach decision note has enough context",
      passed: noteLongEnough,
    },
    {
      key: "blocker_summary_present",
      label: "Intervention blocker summary is present",
      passed: blockerSummary,
    },
    {
      key: "escalation_packets_disabled",
      label: "Escalation packets stay disabled",
      passed: !config.escalationPacketsEnabled,
    },
    {
      key: "external_writes_disabled",
      label: "External sends stay disabled",
      passed: !config.externalWritesEnabled,
    },
  ];

  const failedCheck = checks.find((check) => !check.passed);

  return {
    operation: "coach_decision_logged",
    canSubmit: config.enabled && !failedCheck,
    resultCodeIfSubmitted:
      config.enabled && !failedCheck
        ? getSuccessCodeForDecision(input.decision)
        : getCoachDecisionBlockedResultCode(failedCheck?.key, config.enabled),
    reason: failedCheck
      ? `${failedCheck.label} is not ready. ${config.reason}`
      : config.reason,
    checks,
  };
}

export function getCoachDecisionReadbackState(
  phase: Pick<PhaseRow, "readiness_status" | "coach_validation_status"> | undefined,
  resultCode?: CoachDecisionResultCode,
): CoachDecisionReadbackState | null {
  if (!resultCode) {
    return null;
  }

  if (
    resultCode !== "advance_recorded" &&
    resultCode !== "hold_recorded" &&
    resultCode !== "intervention_recorded"
  ) {
    return {
      confirmsDecision: false,
      tone: "info",
      message:
        "No local coach readiness change is expected for this result. The page is still reading current readiness safely.",
      readinessStatus: phase?.readiness_status,
      coachValidationStatus: phase?.coach_validation_status,
    };
  }

  const expected = getExpectedStatusesForResult(resultCode);

  if (
    phase?.readiness_status === expected.readinessStatus &&
    phase.coach_validation_status === expected.coachValidationStatus
  ) {
    return {
      confirmsDecision: true,
      tone: "success",
      message:
        "Local readback confirms the coach decision updated readiness without sending an escalation packet.",
      readinessStatus: phase.readiness_status,
      coachValidationStatus: phase.coach_validation_status,
    };
  }

  return {
    confirmsDecision: false,
    tone: "warning",
    message:
      "The coach decision returned success, but the refreshed page has not read the expected readiness state yet.",
    readinessStatus: phase?.readiness_status,
    coachValidationStatus: phase?.coach_validation_status,
  };
}

export function mapCoachDecisionRpcSuccess(
  decision: CoachDecisionInput["decision"],
  row: CoachDecisionRpcRow,
): CoachDecisionServerResult {
  return {
    success: true,
    code: getSuccessCodeForDecision(decision),
    reviewId: row.review_id,
    eventId: row.event_id,
    integrationEventId: row.integration_event_id,
    outboxId: row.outbox_id,
    auditLogId: row.audit_log_id,
    nextReadinessStatus: row.next_readiness_status,
    nextCoachValidationStatus: row.next_coach_validation_status,
    plainEnglishMessage:
      "Coach decision saved locally. The app recorded the readiness review, event, integration event, disabled outbox row, and audit log. No escalation packet or external send happened.",
  };
}

export function mapCoachDecisionRpcError(
  error: { code?: string; message?: string },
): CoachDecisionServerResult {
  const message = error.message?.toLowerCase() ?? "";

  if (message.includes("authenticated user required")) {
    return failureResult(
      "missing_auth",
      "Sign in with a local Supabase coach, Admin, or Super Admin before saving this decision.",
    );
  }

  if (error.code === "42501" || message.includes("cannot log coach decision")) {
    return failureResult(
      "permission_denied",
      "This signed-in local role cannot log coach decisions for this chapter.",
    );
  }

  if (error.code === "P0002" || message.includes("phase not found")) {
    return failureResult(
      "portfolio_not_assigned",
      "The selected phase was not found for this chapter and campaign.",
    );
  }

  if (message.includes("note")) {
    return failureResult(
      "note_too_short",
      "Add a plain-English coach decision note before saving.",
    );
  }

  if (message.includes("blocker summary")) {
    return failureResult(
      "blocker_summary_required",
      "Add a blocker summary before saving an intervention decision.",
    );
  }

  if (message.includes("decision must be")) {
    return failureResult(
      "server_error",
      "The coach decision was not recognized. No escalation packet or external automation ran.",
    );
  }

  return failureResult(
    "server_error",
    "The app could not safely save this coach decision. No escalation packet or external automation ran.",
  );
}

export function parseCoachDecision(
  value: FormDataEntryValue | null,
): CoachDecisionInput["decision"] | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === "advance" || trimmed === "hold" || trimmed === "intervene"
    ? trimmed
    : null;
}

function getSuccessCodeForDecision(
  decision: CoachDecisionInput["decision"],
): Extract<
  CoachDecisionResultCode,
  "advance_recorded" | "hold_recorded" | "intervention_recorded"
> {
  switch (decision) {
    case "advance":
      return "advance_recorded";
    case "hold":
      return "hold_recorded";
    case "intervene":
      return "intervention_recorded";
  }
}

function getCoachDecisionBlockedResultCode(
  failedCheckKey:
    | CoachDecisionWriteReadiness["checks"][number]["key"]
    | undefined,
  configEnabled: boolean,
): CoachDecisionResultCode {
  if (!configEnabled) {
    return "write_disabled";
  }

  switch (failedCheckKey) {
    case "local_auth_session":
      return "missing_auth";
    case "actor_can_log_coach_decision":
    case "actor_allowed_by_write_plan":
      return "permission_denied";
    case "coach_portfolio_or_staff":
    case "chapter_uuid":
    case "campaign_uuid":
    case "phase_uuid":
      return "portfolio_not_assigned";
    case "note_long_enough":
      return "note_too_short";
    case "blocker_summary_present":
      return "blocker_summary_required";
    case "escalation_packets_disabled":
      return "escalation_disabled";
    default:
      return "server_error";
  }
}

function getExpectedStatusesForResult(resultCode: CoachDecisionResultCode): {
  readinessStatus: ReadinessStatus;
  coachValidationStatus: CoachValidationStatus;
} {
  switch (resultCode) {
    case "advance_recorded":
      return {
        readinessStatus: "validated",
        coachValidationStatus: "validated",
      };
    case "hold_recorded":
      return {
        readinessStatus: "ready",
        coachValidationStatus: "pending",
      };
    case "intervention_recorded":
      return {
        readinessStatus: "blocked",
        coachValidationStatus: "blocked",
      };
    default:
      return {
        readinessStatus: "not_ready",
        coachValidationStatus: "not_required",
      };
  }
}

function failureResult(
  code: Exclude<
    CoachDecisionResultCode,
    "advance_recorded" | "hold_recorded" | "intervention_recorded"
  >,
  plainEnglishMessage: string,
): CoachDecisionServerResult {
  return {
    success: false,
    code,
    plainEnglishMessage,
  };
}
