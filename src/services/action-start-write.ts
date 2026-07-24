import type { ActionStartResultCode } from "@/services/action-start-result-states";
import type { LocalActorContext } from "@/services/local-actor-context";
import { canReadAssignment } from "@/services/role-visibility";
import { isActorAllowedForPlannedWrite } from "@/services/write-plan-matrix";
import type { Assignment } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type ActionStartWriteConfig =
  | {
      enabled: true;
      environment: "local" | "production";
      isLocalOnly: boolean;
      externalWritesEnabled: false;
      reason: string;
    }
  | {
      enabled: false;
      environment: "local" | "staging" | "production";
      isLocalOnly: boolean;
      externalWritesEnabled: false;
      reason: string;
    };

export type ActionStartWriteReadiness = {
  operation: "action_started";
  environment: "local" | "staging" | "production";
  canSubmit: boolean;
  resultCodeIfSubmitted: ActionStartResultCode;
  reason: string;
  checks: Array<{
    key:
      | "local_writes_requested"
      | "action_start_write_approved"
      | "local_auth_session"
      | "assignment_uuid"
      | "actor_can_read_assignment"
      | "actor_allowed_by_write_plan"
      | "assignment_ready_to_start"
      | "external_writes_disabled";
    label: string;
    passed: boolean;
  }>;
};

export type ActionStartRpcRow = {
  assignment_id: string;
  previous_status: string;
  next_status: string;
  event_id: string;
  integration_event_id: string;
  audit_log_id: string;
};

export type ActionStartServerResult =
  | {
      success: true;
      code: "started";
      assignmentId: string;
      eventId: string;
      integrationEventId: string;
      auditLogId: string;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code: Exclude<ActionStartResultCode, "started">;
      assignmentId: string;
      plainEnglishMessage: string;
    };

export type ActionStartReadbackState = {
  assignmentStatus: Assignment["status"];
  confirmsStarted: boolean;
  tone: "info" | "success" | "warning";
  message: string;
};

export function parseActionStartStatus(
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

export function isActionStartableStatus(status: Assignment["status"]): boolean {
  return status === "not_started" || status === "changes_requested";
}

export function getActionStartWriteConfig(
  env: EnvSource = process.env,
): ActionStartWriteConfig {
  const environment = getActionStartEnvironment(env);

  if (environment === "production") {
    if (env.MYMEDLIFE_ENABLE_ACTION_START_WRITE !== "true") {
      return disabledConfig(
        environment,
        "Action-start writes stay locked until the dedicated write flag is enabled.",
      );
    }

    if (env.MYMEDLIFE_ALLOW_PRODUCTION_ACTION_START_WRITE !== "true") {
      return disabledConfig(
        environment,
        "Production action start requires the separate production approval flag.",
      );
    }

    return {
      enabled: true,
      environment,
      isLocalOnly: false,
      externalWritesEnabled: false,
      reason:
        "Production action-start writes are enabled for authenticated eligible assignment owners. External sends remain disabled.",
    };
  }

  if (environment === "staging") {
    return disabledConfig(
      environment,
      "Hosted staging action start remains disabled until a dedicated staging approval is configured.",
    );
  }

  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return disabledConfig(
      environment,
      "Local Supabase writes are disabled. Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true only for local write testing.",
    );
  }

  if (env.MYMEDLIFE_ENABLE_ACTION_START_WRITE !== "true") {
    return disabledConfig(
      environment,
      "Action-start browser-facing writes remain disabled. Set MYMEDLIFE_ENABLE_ACTION_START_WRITE=true only after local auth and RLS are ready.",
    );
  }

  return {
    enabled: true,
    environment,
    isLocalOnly: true,
    externalWritesEnabled: false,
    reason:
      "Local action-start writes are enabled for localhost Supabase only. External sends remain disabled.",
  };
}

export function getActionStartWriteReadiness(
  actor: LocalActorContext,
  assignment: Assignment,
  env: EnvSource = process.env,
): ActionStartWriteReadiness {
  const config = getActionStartWriteConfig(env);
  const environmentWriteApproved = isEnvironmentWriteApproved(
    config.environment,
    env,
  );
  const actionStartWriteApproved =
    env.MYMEDLIFE_ENABLE_ACTION_START_WRITE === "true";
  const hasLocalAuthSession =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";
  const assignmentUuid = isUuid(assignment.id);
  const actorCanRead = canReadAssignment(actor, assignment);
  const actorAllowed = isActorAllowedForPlannedWrite(actor.audience, "action_started");
  const assignmentReady = isActionStartableStatus(assignment.status);

  const checks: ActionStartWriteReadiness["checks"] = [
    {
      key: "local_writes_requested",
      label: "Environment write approval is on",
      passed: environmentWriteApproved,
    },
    {
      key: "action_start_write_approved",
      label: "Action-start write switch is on",
      passed: actionStartWriteApproved,
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
      key: "actor_can_read_assignment",
      label: "Actor can read this assignment",
      passed: actorCanRead,
    },
    {
      key: "actor_allowed_by_write_plan",
      label: "Actor can start assignments in the write plan",
      passed: actorAllowed,
    },
    {
      key: "assignment_ready_to_start",
      label: "Assignment is ready to start",
      passed: assignmentReady,
    },
    {
      key: "external_writes_disabled",
      label: "External sends stay disabled",
      passed: !config.externalWritesEnabled,
    },
  ];

  const failedCheck = checks.find((check) => !check.passed);

  return {
    operation: "action_started",
    environment: config.environment,
    canSubmit: config.enabled && !failedCheck,
    resultCodeIfSubmitted:
      config.enabled && !failedCheck
        ? "started"
        : getActionStartBlockedResultCode(failedCheck?.key, config.enabled),
    reason: failedCheck
      ? `${failedCheck.label} is not ready. ${config.reason}`
      : config.reason,
    checks,
  };
}

export function getActionStartReadbackState(
  assignment: Pick<Assignment, "status">,
  resultCode?: ActionStartResultCode,
): ActionStartReadbackState | null {
  if (!resultCode) {
    return null;
  }

  if (resultCode !== "started") {
    return {
      assignmentStatus: assignment.status,
      confirmsStarted: false,
      tone: "info",
      message:
        "No status change is expected for this result. The page is still reading the current app-owned assignment state safely.",
    };
  }

  if (assignment.status === "in_progress") {
    return {
      assignmentStatus: assignment.status,
      confirmsStarted: true,
      tone: "success",
      message:
        "App-owned readback confirms this assignment is now in progress in Supabase.",
    };
  }

  return {
    assignmentStatus: assignment.status,
    confirmsStarted: false,
    tone: "warning",
    message:
      "The start action returned success, but the refreshed page has not read an in-progress assignment yet.",
  };
}

export function mapActionStartRpcSuccess(
  assignmentId: string,
  row: ActionStartRpcRow,
): ActionStartServerResult {
  return {
    success: true,
    code: "started",
    assignmentId,
    eventId: row.event_id,
    integrationEventId: row.integration_event_id,
    auditLogId: row.audit_log_id,
    plainEnglishMessage:
      "Action started. The app recorded the assignment status, event, integration event, and audit log. No external send happened.",
  };
}

export function getActionStartAlreadyStartedServerResult(
  assignmentId: string,
): ActionStartServerResult {
  return failureResult(
    assignmentId,
    "already_started",
    "This action is already underway in Supabase, so no duplicate start event was created.",
  );
}

export function getActionStartStaleServerResult(
  assignmentId: string,
  currentStatus: Assignment["status"],
): ActionStartServerResult {
  return failureResult(
    assignmentId,
    "stale_assignment",
    `This action changed to ${currentStatus} before the save completed. Refresh the page and review the latest assignment state before trying again.`,
  );
}

export function mapActionStartRpcError(
  assignmentId: string,
  error: { code?: string; message?: string },
): ActionStartServerResult {
  const message = error.message?.toLowerCase() ?? "";

  if (error.code === "P0002" || message.includes("assignment not found")) {
    return failureResult(
      assignmentId,
      "assignment_not_found",
      "The action was not found in app-owned Supabase, so nothing was saved.",
    );
  }

  if (message.includes("authenticated user required")) {
    return failureResult(
      assignmentId,
      "missing_auth",
      "Sign in with an eligible Supabase account before starting this action.",
    );
  }

  if (message.includes("changed since page load")) {
    return failureResult(
      assignmentId,
      "stale_assignment",
      "This action changed before the save completed. Refresh the page and review the latest assignment state before trying again.",
    );
  }

  if (message.includes("already started")) {
    return getActionStartAlreadyStartedServerResult(assignmentId);
  }

  if (error.code === "42501" || message.includes("cannot start")) {
    return failureResult(
      assignmentId,
      "permission_denied",
      "This signed-in role cannot start this action.",
    );
  }

  return failureResult(
    assignmentId,
    "server_error",
    "The app could not safely start this action. No external automation ran.",
  );
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getActionStartEnvironment(
  env: EnvSource,
): "local" | "staging" | "production" {
  if (env.MYMEDLIFE_AUTH_MODE === "production_supabase") return "production";
  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") return "staging";
  return "local";
}

function disabledConfig(
  environment: "local" | "staging" | "production",
  reason: string,
): Extract<ActionStartWriteConfig, { enabled: false }> {
  return {
    enabled: false,
    environment,
    isLocalOnly: environment === "local",
    externalWritesEnabled: false,
    reason,
  };
}

function isEnvironmentWriteApproved(
  environment: "local" | "staging" | "production",
  env: EnvSource,
) {
  if (environment === "production") {
    return env.MYMEDLIFE_ALLOW_PRODUCTION_ACTION_START_WRITE === "true";
  }

  if (environment === "local") {
    return env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  }

  return false;
}

function getActionStartBlockedResultCode(
  failedCheckKey: ActionStartWriteReadiness["checks"][number]["key"] | undefined,
  configEnabled: boolean,
): ActionStartResultCode {
  if (!configEnabled) {
    return "write_disabled";
  }

  switch (failedCheckKey) {
    case "local_auth_session":
      return "missing_auth";
    case "assignment_uuid":
      return "assignment_not_found";
    case "actor_can_read_assignment":
    case "actor_allowed_by_write_plan":
      return "permission_denied";
    case "assignment_ready_to_start":
      return "already_started";
    default:
      return "write_disabled";
  }
}

function failureResult(
  assignmentId: string,
  code: Exclude<ActionStartResultCode, "started">,
  plainEnglishMessage: string,
): ActionStartServerResult {
  return {
    success: false,
    code,
    assignmentId,
    plainEnglishMessage,
  };
}
