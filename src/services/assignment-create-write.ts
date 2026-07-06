import type { AssignmentCreateResultCode } from "@/services/assignment-create-result-states";
import {
  canCreateChapterAssignment,
  type ChapterAssignmentInput,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";
import { isUuid } from "@/services/action-start-write";
import { isActorAllowedForPlannedWrite } from "@/services/write-plan-matrix";
import type { Assignment, ChapterRole } from "@/shared/types/domain";
import type { DatabaseRoleKey } from "@/shared/types/persistence";

type EnvSource = Record<string, string | undefined>;

export type AssignmentCreateWriteConfig =
  | {
      enabled: true;
      isLocalOnly: true;
      externalWritesEnabled: false;
      remindersEnabled: false;
      reason: string;
    }
  | {
      enabled: false;
      isLocalOnly: boolean;
      externalWritesEnabled: false;
      remindersEnabled: false;
      reason: string;
    };

export type AssignmentCreateContext = {
  chapterId: string;
  campaignId: string;
  existingAssignments?: readonly Assignment[];
};

export type AssignmentCreateWriteReadiness = {
  operation: "action_assigned";
  canSubmit: boolean;
  resultCodeIfSubmitted: AssignmentCreateResultCode;
  reason: string;
  checks: Array<{
    key:
      | "local_writes_requested"
      | "assignment_create_write_approved"
      | "local_auth_session"
      | "chapter_uuid"
      | "campaign_uuid"
      | "actor_can_create_assignment"
      | "actor_allowed_by_write_plan"
      | "title_long_enough"
      | "instructions_long_enough"
      | "evidence_requirement_long_enough"
      | "kpi_present"
      | "points_valid"
      | "owner_role_valid"
      | "duplicate_assignment"
      | "reminders_disabled"
      | "external_writes_disabled";
    label: string;
    passed: boolean;
  }>;
};

export type AssignmentCreateRpcRow = {
  assignment_id: string;
  event_id: string;
  integration_event_id: string;
  outbox_id: string;
  audit_log_id: string;
};

export type AssignmentCreateServerResult =
  | {
      success: true;
      code: "assignment_created";
      assignmentId: string;
      eventId: string;
      integrationEventId: string;
      outboxId: string;
      auditLogId: string;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code: Exclude<AssignmentCreateResultCode, "assignment_created">;
      assignmentId: null;
      plainEnglishMessage: string;
    };

export type AssignmentCreateReadbackState = {
  confirmsCreated: boolean;
  tone: "info" | "success" | "warning";
  message: string;
};

export function getAssignmentCreateWriteConfig(
  env: EnvSource = process.env,
): AssignmentCreateWriteConfig {
  const authConfig = getSupabaseAuthConfig(env);

  if (!authConfig.enabled) {
    return {
      enabled: false,
      isLocalOnly: authConfig.isLocalOnly,
      externalWritesEnabled: false,
      remindersEnabled: false,
      reason: authConfig.reason,
    };
  }

  if (authConfig.isHostedStaging) {
    return {
      enabled: false,
      isLocalOnly: false,
      externalWritesEnabled: false,
      remindersEnabled: false,
      reason:
        "Hosted staging assignment creation remains disabled until a dedicated staging browser-write gate is explicitly approved.",
    };
  }

  if (!authConfig.isLocalOnly) {
    return {
      enabled: false,
      isLocalOnly: false,
      externalWritesEnabled: false,
      remindersEnabled: false,
      reason:
        "Hosted production assignment creation remains disabled until a future approved production gate exists.",
    };
  }

  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return {
      enabled: false,
      isLocalOnly: true,
      externalWritesEnabled: false,
      remindersEnabled: false,
      reason:
        "Local Supabase writes are disabled. Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true only for local write testing.",
    };
  }

  if (env.MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE !== "true") {
    return {
      enabled: false,
      isLocalOnly: true,
      externalWritesEnabled: false,
      remindersEnabled: false,
      reason:
        "Assignment-create browser-facing writes remain disabled. Set MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE=true only after local auth and RLS are ready.",
    };
  }

  return {
    enabled: true,
    isLocalOnly: true,
    externalWritesEnabled: false,
    remindersEnabled: false,
    reason:
      "Local assignment creation writes are enabled for localhost Supabase only. Reminder automation and external sends remain disabled.",
  };
}

export function getAssignmentCreateWriteReadiness(
  actor: LocalActorContext,
  input: ChapterAssignmentInput,
  context: AssignmentCreateContext,
  env: EnvSource = process.env,
): AssignmentCreateWriteReadiness {
  const config = getAssignmentCreateWriteConfig(env);
  const localWritesRequested = env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const assignmentCreateWriteApproved =
    env.MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE === "true";
  const hasLocalAuthSession =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";
  const actorCanCreate = canCreateChapterAssignment(actor);
  const actorAllowed = isActorAllowedForPlannedWrite(
    actor.audience,
    "action_assigned",
  );
  const normalizedTitle = input.title.trim();
  const normalizedInstructions = input.instructions.trim();
  const normalizedEvidence = input.evidenceRequired.trim();
  const normalizedKpi = input.kpi.trim();
  const ownerRoleValid = mapChapterRoleToDatabaseRole(input.ownerRole) !== null;
  const duplicateAssignment = Boolean(
    context.existingAssignments?.some((assignment) => {
      return assignment.title.trim().toLowerCase() === normalizedTitle.toLowerCase();
    }),
  );

  const checks: AssignmentCreateWriteReadiness["checks"] = [
    {
      key: "local_writes_requested",
      label: "Local write switch is on",
      passed: localWritesRequested,
    },
    {
      key: "assignment_create_write_approved",
      label: "Assignment-create write switch is on",
      passed: assignmentCreateWriteApproved,
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
      key: "actor_can_create_assignment",
      label: "Actor can create chapter assignments",
      passed: actorCanCreate,
    },
    {
      key: "actor_allowed_by_write_plan",
      label: "Actor can create assignments in the write plan",
      passed: actorAllowed,
    },
    {
      key: "title_long_enough",
      label: "Assignment title is clear enough",
      passed: normalizedTitle.length >= 5,
    },
    {
      key: "instructions_long_enough",
      label: "Assignment instructions explain the action",
      passed: normalizedInstructions.length >= 12,
    },
    {
      key: "evidence_requirement_long_enough",
      label: "Proof/testimonial requirement is clear",
      passed: normalizedEvidence.length >= 5,
    },
    {
      key: "kpi_present",
      label: "KPI is present",
      passed: normalizedKpi.length >= 2,
    },
    {
      key: "points_valid",
      label: "Points are between 0 and 1000",
      passed: input.points >= 0 && input.points <= 1000,
    },
    {
      key: "owner_role_valid",
      label: "Owner role maps to a chapter role",
      passed: ownerRoleValid,
    },
    {
      key: "duplicate_assignment",
      label: "No duplicate assignment title exists",
      passed: !duplicateAssignment,
    },
    {
      key: "reminders_disabled",
      label: "Reminder automation stays disabled",
      passed: !config.remindersEnabled,
    },
    {
      key: "external_writes_disabled",
      label: "External sends stay disabled",
      passed: !config.externalWritesEnabled,
    },
  ];

  const failedCheck = checks.find((check) => !check.passed);

  return {
    operation: "action_assigned",
    canSubmit: config.enabled && !failedCheck,
    resultCodeIfSubmitted:
      config.enabled && !failedCheck
        ? "assignment_created"
        : getAssignmentCreateBlockedResultCode(failedCheck?.key, config.enabled),
    reason: failedCheck
      ? `${failedCheck.label} is not ready. ${config.reason}`
      : config.reason,
    checks,
  };
}

export function getAssignmentCreateReadbackState(
  assignments: readonly Assignment[],
  resultCode?: AssignmentCreateResultCode,
  assignmentTitle?: string,
): AssignmentCreateReadbackState | null {
  if (!resultCode) {
    return null;
  }

  if (resultCode !== "assignment_created") {
    return {
      confirmsCreated: false,
      tone: "info",
      message:
        "No local assignment row is expected for this result. The page is still reading current assignment data safely.",
    };
  }

  const normalizedTitle = assignmentTitle?.trim().toLowerCase();
  const foundAssignment = normalizedTitle
    ? assignments.some((assignment) => {
        return assignment.title.trim().toLowerCase() === normalizedTitle;
      })
    : false;

  if (foundAssignment) {
    return {
      confirmsCreated: true,
      tone: "success",
      message:
        "Local readback confirms this assignment exists in Supabase without sending reminders.",
    };
  }

  return {
    confirmsCreated: false,
    tone: "warning",
    message:
      "The assignment-create action returned success, but the refreshed page has not read the new assignment yet.",
  };
}

export function mapAssignmentCreateRpcSuccess(
  row: AssignmentCreateRpcRow,
): AssignmentCreateServerResult {
  return {
    success: true,
    code: "assignment_created",
    assignmentId: row.assignment_id,
    eventId: row.event_id,
    integrationEventId: row.integration_event_id,
    outboxId: row.outbox_id,
    auditLogId: row.audit_log_id,
    plainEnglishMessage:
      "Assignment created locally. The app recorded the assignment, event, integration event, disabled outbox row, and audit log. No reminder or external send happened.",
  };
}

export function mapAssignmentCreateRpcError(
  error: { code?: string; message?: string },
): AssignmentCreateServerResult {
  const message = error.message?.toLowerCase() ?? "";

  if (message.includes("authenticated user required")) {
    return failureResult(
      "missing_auth",
      "Sign in with a local Supabase chapter leader or Super Admin before creating an assignment.",
    );
  }

  if (error.code === "42501" || message.includes("cannot create assignments")) {
    return failureResult(
      "permission_denied",
      "This signed-in local role cannot create assignments for this chapter.",
    );
  }

  if (message.includes("title is too short")) {
    return failureResult(
      "title_too_short",
      "Add a clearer assignment title before saving.",
    );
  }

  if (message.includes("instructions")) {
    return failureResult(
      "instructions_too_short",
      "Add enough instructions for the student to know what to do next.",
    );
  }

  if (message.includes("evidence requirement")) {
    return failureResult(
      "evidence_requirement_too_short",
      "Add a clearer proof or testimonial requirement before saving.",
    );
  }

  if (message.includes("kpi")) {
    return failureResult(
      "kpi_required",
      "Connect this assignment to a simple KPI before saving.",
    );
  }

  if (message.includes("points")) {
    return failureResult(
      "invalid_points",
      "Choose a points value between 0 and 1000 before saving.",
    );
  }

  if (
    error.code === "23505" ||
    message.includes("duplicate assignment title exists")
  ) {
    return failureResult(
      "duplicate_assignment",
      "A similar assignment already exists for this chapter, so the app blocked a duplicate.",
    );
  }

  return failureResult(
    "server_error",
    "The app could not safely create this assignment. No reminder or external automation ran.",
  );
}

export function mapChapterRoleToDatabaseRole(
  role: ChapterRole,
): DatabaseRoleKey | null {
  switch (role) {
    case "General Member":
      return "general_member";
    case "Action Committee Member":
      return "action_committee_member";
    case "Action Committee Chair":
      return "action_committee_chair";
    case "E-Board Member":
      return "e_board_member";
    case "Chapter President / Vice President":
      return "president_vp";
    case "Coach":
      return "coach";
    case "Admin":
      return "admin";
    case "Super Admin":
      return "super_admin";
  }
}

export function parseAssignmentOwnerRole(
  value: FormDataEntryValue | null,
): ChapterRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const roles: ChapterRole[] = [
    "General Member",
    "Action Committee Member",
    "Action Committee Chair",
    "E-Board Member",
    "Chapter President / Vice President",
    "Coach",
    "Admin",
    "Super Admin",
  ];

  return roles.includes(trimmed as ChapterRole) ? (trimmed as ChapterRole) : null;
}

function getAssignmentCreateBlockedResultCode(
  failedCheckKey:
    | AssignmentCreateWriteReadiness["checks"][number]["key"]
    | undefined,
  configEnabled: boolean,
): AssignmentCreateResultCode {
  if (!configEnabled) {
    return "write_disabled";
  }

  switch (failedCheckKey) {
    case "local_auth_session":
      return "missing_auth";
    case "actor_can_create_assignment":
    case "actor_allowed_by_write_plan":
      return "permission_denied";
    case "title_long_enough":
      return "title_too_short";
    case "instructions_long_enough":
      return "instructions_too_short";
    case "evidence_requirement_long_enough":
      return "evidence_requirement_too_short";
    case "kpi_present":
      return "kpi_required";
    case "points_valid":
      return "invalid_points";
    case "duplicate_assignment":
      return "duplicate_assignment";
    case "reminders_disabled":
      return "reminders_disabled";
    default:
      return "server_error";
  }
}

function failureResult(
  code: Exclude<AssignmentCreateResultCode, "assignment_created">,
  plainEnglishMessage: string,
): AssignmentCreateServerResult {
  return {
    success: false,
    code,
    assignmentId: null,
    plainEnglishMessage,
  };
}
