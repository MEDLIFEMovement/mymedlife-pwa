import { isUuid } from "@/services/action-start-write";
import type { ChapterJoinRequest, ChapterMemberRow } from "@/services/chapter-membership-workspace";
import type { MembershipApprovalResultCode } from "@/services/membership-approval-result-states";
import {
  getMembershipApprovalWriteConfig,
  type MembershipApprovalWriteConfig,
} from "@/services/membership-approval-write-readiness";
import type { DatabaseRoleKey } from "@/shared/types/persistence";

export type MembershipApprovalRpcRow = {
  membership_id: string;
  event_id: string;
  integration_event_id: string;
  outbox_id: string;
  audit_log_id: string;
};

export type MembershipApprovalServerResult =
  | {
      success: true;
      code: "membership_approved";
      membershipId: string;
      eventId: string;
      integrationEventId: string;
      outboxId: string;
      auditLogId: string;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code: Exclude<MembershipApprovalResultCode, "membership_approved">;
      membershipId: null;
      plainEnglishMessage: string;
    };

export type MembershipApprovalReadbackState = {
  confirmsApproved: boolean;
  tone: "info" | "success" | "warning";
  message: string;
  currentMembershipStatus: ChapterMemberRow["membershipStatus"] | "not_visible";
  joinRequestStillVisible: boolean;
};

const chapterRoleKeys = new Set<DatabaseRoleKey>([
  "general_member",
  "action_committee_member",
  "action_committee_chair",
  "e_board_member",
  "president_vp",
]);

export function getMembershipApprovalLocalWriteConfig(
  env: Record<string, string | undefined> = process.env,
): MembershipApprovalWriteConfig {
  return getMembershipApprovalWriteConfig(env);
}

export function getMembershipApprovalReadbackState(
  members: readonly ChapterMemberRow[],
  joinRequests: readonly ChapterJoinRequest[],
  resultCode?: MembershipApprovalResultCode,
  applicantEmail?: string,
  joinRequestId?: string,
): MembershipApprovalReadbackState | null {
  if (!resultCode) {
    return null;
  }

  const normalizedEmail = applicantEmail?.trim().toLowerCase() ?? "";
  const approvedMember = normalizedEmail
    ? members.find((member) => member.email.trim().toLowerCase() === normalizedEmail)
    : undefined;
  const joinRequestStillVisible = Boolean(
    joinRequestId &&
      joinRequests.some((request) => request.id === joinRequestId),
  );

  if (resultCode !== "membership_approved") {
    return {
      confirmsApproved: false,
      tone: "info",
      message:
        "No approved membership readback is expected for this result. The page is still reading roster state safely.",
      currentMembershipStatus: approvedMember?.membershipStatus ?? "not_visible",
      joinRequestStillVisible,
    };
  }

  if (approvedMember?.membershipStatus === "approved" && !joinRequestStillVisible) {
    return {
      confirmsApproved: true,
      tone: "success",
      message:
        "Readback confirms this applicant now appears in the chapter roster as an approved member and the join request is no longer pending.",
      currentMembershipStatus: approvedMember.membershipStatus,
      joinRequestStillVisible,
    };
  }

  return {
    confirmsApproved: false,
    tone: "warning",
    message:
      "The approval returned success, but the refreshed page has not fully confirmed the roster update yet.",
    currentMembershipStatus: approvedMember?.membershipStatus ?? "not_visible",
    joinRequestStillVisible,
  };
}

export function mapMembershipApprovalRpcSuccess(
  row: MembershipApprovalRpcRow,
): MembershipApprovalServerResult {
  return {
    success: true,
    code: "membership_approved",
    membershipId: row.membership_id,
    eventId: row.event_id,
    integrationEventId: row.integration_event_id,
    outboxId: row.outbox_id,
    auditLogId: row.audit_log_id,
    plainEnglishMessage:
      "Membership approved in the current Supabase review lane. The app recorded the membership status, internal event, integration event, disabled outbox row, and audit log. No external send happened.",
  };
}

export function mapMembershipApprovalRpcError(
  error: { code?: string; message?: string },
): MembershipApprovalServerResult {
  const message = error.message?.toLowerCase() ?? "";

  if (
    error.code === "P0002" ||
    message.includes("join request not found") ||
    message.includes("requested membership row not found")
  ) {
    return failureResult(
      "join_request_not_found",
      "The join request was not found in local Supabase, so nothing was saved.",
    );
  }

  if (message.includes("authenticated user required")) {
    return failureResult(
      "missing_auth",
      "Sign in with an approved chapter leader, Admin, or Super Admin reviewer before approving membership.",
    );
  }

  if (
    error.code === "42501" ||
    message.includes("actor cannot approve chapter membership") ||
    message.includes("not allowed to approve chapter membership")
  ) {
    return failureResult(
      "permission_denied",
      "This signed-in role is not allowed to approve chapter membership in the current write path.",
    );
  }

  if (message.includes("approval reason")) {
    return failureResult(
      "audit_reason_required",
      "Add a clearer approval reason before saving membership.",
    );
  }

  if (message.includes("duplicate approved membership")) {
    return failureResult(
      "duplicate_membership",
      "This student already has an approved membership in the chapter, so the app blocked a duplicate.",
    );
  }

  if (message.includes("requested role must match")) {
    return failureResult(
      "role_assignment_invalid",
      "The requested role did not match the visible join request, so nothing was saved.",
    );
  }

  if (message.includes("chapter-scoped role")) {
    return failureResult(
      "role_assignment_invalid",
      "Membership approval can only assign chapter-scoped roles.",
    );
  }

  if (message.includes("applicant profile")) {
    return failureResult(
      "profile_not_ready",
      "The join request does not map cleanly to one applicant profile yet.",
    );
  }

  return failureResult(
    "server_error",
    "The app could not safely approve this membership. No welcome message, CRM sync, or external automation ran.",
  );
}

export function parseMembershipApprovalRole(
  value: FormDataEntryValue | null,
): DatabaseRoleKey | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim() as DatabaseRoleKey;

  return chapterRoleKeys.has(normalized) ? normalized : null;
}

export function normalizeMembershipApprovalReturnTo(
  value: FormDataEntryValue | null,
): string {
  if (typeof value !== "string") {
    return "/chapter/members";
  }

  const trimmed = value.trim();

  if (
    trimmed !== "/chapter/members" ||
    trimmed.startsWith("//") ||
    trimmed.includes("\n") ||
    trimmed.includes("\r")
  ) {
    return "/chapter/members";
  }

  return trimmed;
}

export function hasMembershipApprovalSupabaseIds(input: {
  chapterId: string;
  joinRequestId: string;
}) {
  return isUuid(input.chapterId) && isUuid(input.joinRequestId);
}

function failureResult(
  code: Exclude<MembershipApprovalResultCode, "membership_approved">,
  plainEnglishMessage: string,
): MembershipApprovalServerResult {
  return {
    success: false,
    code,
    membershipId: null,
    plainEnglishMessage,
  };
}
