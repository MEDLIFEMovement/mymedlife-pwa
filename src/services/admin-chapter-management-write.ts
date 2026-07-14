import { isUuid } from "@/services/action-start-write";
import { getAdminAccessWriteConfig } from "@/services/admin-management-write";
import type { ChapterStatus, DatabaseRoleKey } from "@/shared/types/persistence";

export type AdminChapterOperation =
  | "create_chapter"
  | "update_chapter"
  | "archive_chapter"
  | "disable_chapter"
  | "assign_coach"
  | "remove_coach"
  | "assign_student_leader"
  | "remove_student_leader";

export type AdminChapterResultCode =
  | "admin_chapter_changed"
  | "write_disabled"
  | "missing_auth"
  | "permission_denied"
  | "target_not_found"
  | "confirmation_required"
  | "audit_reason_required"
  | "invalid_operation"
  | "invalid_chapter"
  | "invalid_user"
  | "invalid_role"
  | "invalid_status"
  | "invalid_chapter_type"
  | "invalid_profile"
  | "server_error";

export type AdminChapterRpcRow = {
  operation: AdminChapterOperation;
  chapter_id: string;
  membership_id: string | null;
  coach_assignment_id: string | null;
  audit_log_id: string;
  chapter_status: ChapterStatus;
  active_member_count: number;
  active_event_count: number;
  historical_record_count: number;
};

export type AdminChapterServerResult =
  | {
      success: true;
      code: "admin_chapter_changed";
      operation: AdminChapterOperation;
      chapterId: string;
      membershipId: string | null;
      coachAssignmentId: string | null;
      auditLogId: string;
      chapterStatus: ChapterStatus;
      activeMemberCount: number;
      activeEventCount: number;
      historicalRecordCount: number;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code: Exclude<AdminChapterResultCode, "admin_chapter_changed">;
      chapterId: null;
      plainEnglishMessage: string;
    };

const adminChapterOperations = new Set<AdminChapterOperation>([
  "create_chapter",
  "update_chapter",
  "archive_chapter",
  "disable_chapter",
  "assign_coach",
  "remove_coach",
  "assign_student_leader",
  "remove_student_leader",
]);

const chapterStatuses = new Set<ChapterStatus>([
  "active",
  "inactive",
  "archived",
]);

const studentLeaderRoles = new Set<DatabaseRoleKey>([
  "action_committee_chair",
  "e_board_member",
  "president_vp",
]);

const adminChapterManagementRoute = "/admin/chapters";

export const adminChapterOperationConfirmation: Partial<
  Record<AdminChapterOperation, string>
> = {
  archive_chapter: "ARCHIVE CHAPTER",
  disable_chapter: "DEACTIVATE CHAPTER",
  remove_coach: "REMOVE COACH",
  remove_student_leader: "REMOVE STUDENT LEADER",
};

export function getAdminChapterWriteConfig(
  env: Record<string, string | undefined> = process.env,
) {
  return getAdminAccessWriteConfig(env);
}

export function parseAdminChapterOperation(
  value: FormDataEntryValue | null,
): AdminChapterOperation | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim() as AdminChapterOperation;

  return adminChapterOperations.has(normalized) ? normalized : null;
}

export function parseAdminChapterStatus(
  value: FormDataEntryValue | null,
): ChapterStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim() === "disabled" ? "inactive" : value.trim();

  return chapterStatuses.has(normalized as ChapterStatus)
    ? (normalized as ChapterStatus)
    : null;
}

export function parseAdminStudentLeaderRole(
  value: FormDataEntryValue | null,
): DatabaseRoleKey | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim() as DatabaseRoleKey;

  return studentLeaderRoles.has(normalized) ? normalized : null;
}

export function hasAdminChapterSupabaseIds(input: {
  chapterId?: string | null;
  targetUserId?: string | null;
}) {
  return (
    (input.chapterId === null ||
      input.chapterId === undefined ||
      isUuid(input.chapterId)) &&
    (input.targetUserId === null ||
      input.targetUserId === undefined ||
      isUuid(input.targetUserId))
  );
}

export function mapAdminChapterRpcSuccess(
  row: AdminChapterRpcRow,
): AdminChapterServerResult {
  return {
    success: true,
    code: "admin_chapter_changed",
    operation: row.operation,
    chapterId: row.chapter_id,
    membershipId: row.membership_id,
    coachAssignmentId: row.coach_assignment_id,
    auditLogId: row.audit_log_id,
    chapterStatus: row.chapter_status,
    activeMemberCount: row.active_member_count,
    activeEventCount: row.active_event_count,
    historicalRecordCount: row.historical_record_count,
    plainEnglishMessage:
      "Chapter management changed through the audited Supabase RPC. The app recorded the chapter change and audit log. No external send happened.",
  };
}

export function getAdminChapterDisabledResult(
  plainEnglishMessage: string,
): AdminChapterServerResult {
  return failureResult("write_disabled", plainEnglishMessage);
}

export function getAdminChapterConfirmationRequiredResult(
  plainEnglishMessage: string,
): AdminChapterServerResult {
  return failureResult("confirmation_required", plainEnglishMessage);
}

export function mapAdminChapterRpcError(error: {
  code?: string;
  message?: string;
}): AdminChapterServerResult {
  const message = error.message?.toLowerCase() ?? "";

  if (message.includes("authenticated user required")) {
    return failureResult(
      "missing_auth",
      "Sign in with a DS Admin or Super Admin account before changing chapters.",
    );
  }

  if (error.code === "P0002" || message.includes("target chapter not found")) {
    return failureResult(
      "target_not_found",
      "The selected chapter was not found, so no chapter changed.",
    );
  }

  if (
    message.includes("reason must be at least") ||
    message.includes("audit reason")
  ) {
    return failureResult(
      "audit_reason_required",
      "Add a clearer audit reason before changing this chapter.",
    );
  }

  if (message.includes("unsupported admin chapter operation")) {
    return failureResult(
      "invalid_operation",
      "Choose a supported chapter management operation before saving.",
    );
  }

  if (message.includes("chapter_uuid is required")) {
    return failureResult(
      "invalid_chapter",
      "Choose the chapter before saving this change.",
    );
  }

  if (
    message.includes("target_user_uuid is required") ||
    message.includes("active coach role")
  ) {
    return failureResult(
      "invalid_user",
      "Choose a valid user with the required role before saving this change.",
    );
  }

  if (message.includes("student leader role")) {
    return failureResult(
      "invalid_role",
      "Choose a valid student leader role before saving.",
    );
  }

  if (
    message.includes("role term") ||
    message.includes("term year") ||
    message.includes("memberships_role_term_years_valid")
  ) {
    return failureResult(
      "invalid_profile",
      "Use a valid role year range before saving this chapter role history.",
    );
  }

  if (message.includes("invalid input value for enum app.chapter_status")) {
    return failureResult(
      "invalid_status",
      "Choose a supported chapter status before saving.",
    );
  }

  if (message.includes("name and campus are required")) {
    return failureResult(
      "invalid_profile",
      "Add the chapter name and school before creating a chapter.",
    );
  }

  if (error.code === "42501" || message.includes("access required")) {
    return failureResult(
      "permission_denied",
      "This signed-in role is not allowed to manage chapters.",
    );
  }

  return failureResult(
    "server_error",
    "The app could not safely change this chapter. No external automation ran.",
  );
}

export function normalizeAdminChapterReturnTo(
  value: FormDataEntryValue | null,
): string {
  if (typeof value !== "string") {
    return adminChapterManagementRoute;
  }

  const trimmed = value.trim();

  if (
    !trimmed.startsWith(adminChapterManagementRoute) ||
    trimmed.startsWith("//") ||
    trimmed.includes("://")
  ) {
    return adminChapterManagementRoute;
  }

  return trimmed;
}

function failureResult(
  code: Exclude<AdminChapterResultCode, "admin_chapter_changed">,
  plainEnglishMessage: string,
): AdminChapterServerResult {
  return {
    success: false,
    code,
    chapterId: null,
    plainEnglishMessage,
  };
}
