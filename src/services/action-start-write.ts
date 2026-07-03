import type { ActionStartResultCode } from "@/services/action-start-result-states";
import type { LocalActorContext } from "@/services/local-actor-context";
import { canReadAssignment } from "@/services/role-visibility";
import { isActorAllowedForPlannedWrite } from "@/services/write-plan-matrix";
import type { Assignment } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type ActionStartWriteConfig =
  | {
      enabled: true;
      isLocalOnly: boolean;
      externalWritesEnabled: false;
      reason: string;
    }
  | {
      enabled: false;
      isLocalOnly: boolean;
      externalWritesEnabled: false;
      reason: string;
    };

export type ActionStartWriteReadiness = {
  operation: "action_started";
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
  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") {
    if (env.MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE !== "true") {
      return {
        enabled: false,
        isLocalOnly: false,
        externalWritesEnabled: false,
        reason:
          "Hosted staging action-start writes remain disabled. Turn on the staging Action started write control in /admin/feature-flags only after staging auth, pilot scope, and rollback ownership are approved.",
      };
    }

    return {
      enabled: true,
      isLocalOnly: false,
      externalWritesEnabled: false,
      reason:
        "Hosted staging action-start writes are enabled for the narrow pilot review lane. External sends remain disabled.",
    };
  }

  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return {
      enabled: false,
      isLocalOnly: true,
      externalWritesEnabled: false,
      reason:
        "Local Supabase writes are disabled. Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true only for local write testing.",
    };
  }

  if (env.MYMEDLIFE_ENABLE_ACTION_START_WRITE !== "true") {
    return {
        enabled: false,
        isLocalOnly: true,
        externalWritesEnabled: false,
        reason:
          "Action-start browser-facing writes remain disabled. Turn on the Action started write control only after local auth and RLS are ready.",
      };
    }

  return {
    enabled: true,
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
  const localWritesRequested = env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const stagingWriteRequested =
    env.MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE === "true";
  const writeScopeRequested = localWritesRequested || stagingWriteRequested;
  const actionStartWriteApproved =
    env.MYMEDLIFE_ENABLE_ACTION_START_WRITE === "true" ||
    stagingWriteRequested;
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
      label: config.isLocalOnly ? "Local write switch is on" : "Staging write scope is on",
      passed: writeScopeRequested,
    },
    {
      key: "action_start_write_approved",
      label: "Action-start write switch is on",
      passed: actionStartWriteApproved,
    },
    {
      key: "local_auth_session",
      label: config.isLocalOnly
        ? "Signed-in local Supabase Auth session"
        : "Signed-in staging Supabase Auth session inside the approved staging access path",
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
        "No local status change is expected for this result. The page is still reading the current assignment state safely.",
    };
  }

  if (assignment.status === "in_progress") {
    return {
      assignmentStatus: assignment.status,
      confirmsStarted: true,
      tone: "success",
      message:
        "Local readback confirms this assignment is now in progress in Supabase.",
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
      "Action started locally. The app recorded the assignment status, event, integration event, and audit log. No external send happened.",
  };
}

export function getActionStartAlreadyStartedServerResult(
  assignmentId: string,
): ActionStartServerResult {
  return failureResult(
    assignmentId,
    "already_started",
    "This action is already underway in local Supabase, so no duplicate start event was created.",
  );
}

export function getActionStartStaleServerResult(
  assignmentId: string,
  currentStatus: Assignment["status"],
): ActionStartServerResult {
  return failureResult(
    assignmentId,
    "stale_assignment",
    `This action changed to ${currentStatus} before the save completed. Refresh the page and review the latest local assignment state before trying again.`,
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
      "The action was not found in local Supabase, so nothing was saved.",
    );
  }

  if (message.includes("authenticated user required")) {
    return failureResult(
      assignmentId,
      "missing_auth",
      "Sign in with a local Supabase seed user before starting this action.",
    );
  }

  if (message.includes("changed since page load")) {
    return failureResult(
      assignmentId,
      "stale_assignment",
      "This action changed before the save completed. Refresh the page and review the latest local assignment state before trying again.",
    );
  }

  if (message.includes("already started")) {
    return getActionStartAlreadyStartedServerResult(assignmentId);
  }

  if (error.code === "42501" || message.includes("cannot start")) {
    return failureResult(
      assignmentId,
      "permission_denied",
      "This signed-in local role cannot start this action.",
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
