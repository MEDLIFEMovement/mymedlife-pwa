import { canApproveChapterMembership } from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getWriteReadinessSummary } from "@/services/write-readiness";

export type MembershipApprovalResultCode =
  | "membership_approved"
  | "audit_reason_required"
  | "crm_sync_disabled"
  | "duplicate_membership"
  | "join_request_not_found"
  | "missing_auth"
  | "permission_denied"
  | "profile_not_ready"
  | "role_assignment_invalid"
  | "server_error"
  | "welcome_disabled"
  | "write_disabled";

export type MembershipApprovalResultTone =
  | "error"
  | "info"
  | "success"
  | "warning";

export type MembershipApprovalInput = {
  joinRequestId: string;
  applicantEmail: string;
  requestedRoleKey: string;
  requestedCommitteeLane: string;
  auditReason: string;
};

export type MembershipApprovalResultState = {
  code: MembershipApprovalResultCode;
  title: string;
  plainEnglishMessage: string;
  nextStep: string;
  tone: MembershipApprovalResultTone;
  success: boolean;
  retryAllowed: boolean;
  createsMembership: boolean;
  assignsChapterRole: boolean;
  createsOutboxItem: boolean;
  sendsWelcome: false;
  syncsCrm: false;
};

export type MembershipApprovalResultPreview = {
  operation: "membership_approved";
  currentResult: MembershipApprovalResultState;
  futureResultIfEnabled: MembershipApprovalResultState;
  serverResultShape: {
    success: boolean;
    errorCode?: MembershipApprovalResultCode;
    applicantEmail: string;
    plainEnglishMessage: string;
  };
};

const chapterRoleKeys = [
  "general_member",
  "action_committee_member",
  "action_committee_chair",
  "e_board_member",
  "president_vp",
] as const;

const membershipApprovalResultStates = [
  {
    code: "membership_approved",
    title: "Membership approved",
    plainEnglishMessage:
      "The student is approved for the chapter with a chapter-scoped role, disabled welcome outbox, and audit record.",
    nextStep:
      "Show the member in the roster and keep welcome messages or CRM syncs disabled until separately approved.",
    tone: "success",
    success: true,
    retryAllowed: false,
    createsMembership: true,
    assignsChapterRole: true,
    createsOutboxItem: true,
    sendsWelcome: false,
    syncsCrm: false,
  },
  {
    code: "write_disabled",
    title: "Membership approval is not turned on yet",
    plainEnglishMessage:
      "This membership approval packet is safe to review, but the app is not allowed to approve join requests from the browser yet.",
    nextStep:
      "Keep the approval packet read-only until production auth, RLS, audit readback, and rollback are approved.",
    tone: "info",
    success: false,
    retryAllowed: false,
    createsMembership: false,
    assignsChapterRole: false,
    createsOutboxItem: false,
    sendsWelcome: false,
    syncsCrm: false,
  },
  {
    code: "welcome_disabled",
    title: "Welcome message is not turned on yet",
    plainEnglishMessage:
      "Approving membership may shape a future welcome outbox row, but no email or SMS should send automatically.",
    nextStep: "Keep welcome messages disabled until external communication is approved.",
    tone: "info",
    success: false,
    retryAllowed: false,
    createsMembership: false,
    assignsChapterRole: false,
    createsOutboxItem: false,
    sendsWelcome: false,
    syncsCrm: false,
  },
  {
    code: "crm_sync_disabled",
    title: "CRM sync is not turned on yet",
    plainEnglishMessage:
      "Membership approval should not update HubSpot or any CRM destination until the integration path is approved.",
    nextStep: "Keep CRM sync disabled and inspect only the future outbox posture.",
    tone: "info",
    success: false,
    retryAllowed: false,
    createsMembership: false,
    assignsChapterRole: false,
    createsOutboxItem: false,
    sendsWelcome: false,
    syncsCrm: false,
  },
  {
    code: "duplicate_membership",
    title: "Membership already exists",
    plainEnglishMessage:
      "This email already appears in the chapter roster, so the app should not create a duplicate membership.",
    nextStep:
      "Show the existing member row and ask the leader to update the existing role only after role writes are approved.",
    tone: "warning",
    success: false,
    retryAllowed: false,
    createsMembership: false,
    assignsChapterRole: false,
    createsOutboxItem: false,
    sendsWelcome: false,
    syncsCrm: false,
  },
  {
    code: "permission_denied",
    title: "This role cannot approve membership",
    plainEnglishMessage:
      "Membership approval belongs to chapter leaders, Admin, or Super Admin, not general members, coaches, or DS Admin.",
    nextStep: "Switch to an approved reviewer role or keep the roster read-only.",
    tone: "error",
    success: false,
    retryAllowed: false,
    createsMembership: false,
    assignsChapterRole: false,
    createsOutboxItem: false,
    sendsWelcome: false,
    syncsCrm: false,
  },
  {
    code: "missing_auth",
    title: "Sign-in is required",
    plainEnglishMessage:
      "The app must know which approved reviewer is signed in before saving a membership approval.",
    nextStep: "After production auth is approved, send the reviewer through sign-in.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsMembership: false,
    assignsChapterRole: false,
    createsOutboxItem: false,
    sendsWelcome: false,
    syncsCrm: false,
  },
  {
    code: "join_request_not_found",
    title: "Join request is missing",
    plainEnglishMessage:
      "The app cannot approve membership without a specific join request tied to the chapter.",
    nextStep: "Ask the student to submit a join request before approval.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsMembership: false,
    assignsChapterRole: false,
    createsOutboxItem: false,
    sendsWelcome: false,
    syncsCrm: false,
  },
  {
    code: "profile_not_ready",
    title: "Student profile is not ready",
    plainEnglishMessage:
      "The applicant needs a valid profile identity before a chapter-scoped membership can be approved.",
    nextStep:
      "Confirm the email maps to one production profile before creating membership truth.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsMembership: false,
    assignsChapterRole: false,
    createsOutboxItem: false,
    sendsWelcome: false,
    syncsCrm: false,
  },
  {
    code: "role_assignment_invalid",
    title: "Requested chapter role is invalid",
    plainEnglishMessage:
      "Membership approval can only assign chapter roles, not coach, admin, DS Admin, or Super Admin permissions.",
    nextStep: "Choose a valid chapter role before approval.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsMembership: false,
    assignsChapterRole: false,
    createsOutboxItem: false,
    sendsWelcome: false,
    syncsCrm: false,
  },
  {
    code: "audit_reason_required",
    title: "Approval reason is required",
    plainEnglishMessage:
      "Membership approval needs a short reason so the audit log explains why access changed.",
    nextStep: "Ask the reviewer for a clear approval reason before saving.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsMembership: false,
    assignsChapterRole: false,
    createsOutboxItem: false,
    sendsWelcome: false,
    syncsCrm: false,
  },
  {
    code: "server_error",
    title: "Something went wrong",
    plainEnglishMessage:
      "The app could not safely approve this membership. No welcome message, CRM sync, or external automation should run.",
    nextStep: "Show a friendly retry message and log the error for the product team.",
    tone: "error",
    success: false,
    retryAllowed: true,
    createsMembership: false,
    assignsChapterRole: false,
    createsOutboxItem: false,
    sendsWelcome: false,
    syncsCrm: false,
  },
] as const satisfies readonly MembershipApprovalResultState[];

export function getMembershipApprovalResultStates(): readonly MembershipApprovalResultState[] {
  return membershipApprovalResultStates;
}

export function getMembershipApprovalResultState(
  code: MembershipApprovalResultCode,
): MembershipApprovalResultState {
  const state = membershipApprovalResultStates.find((item) => item.code === code);

  if (!state) {
    throw new Error(`Unknown membership-approval result code: ${code}`);
  }

  return state;
}

export function getFutureMembershipApprovalResultIfEnabled(
  actor: LocalActorContext | null,
  input: MembershipApprovalInput,
  existingMemberEmails: readonly string[] = [],
): MembershipApprovalResultState {
  if (!actor) {
    return getMembershipApprovalResultState("missing_auth");
  }

  if (!canApproveMembership(actor)) {
    return getMembershipApprovalResultState("permission_denied");
  }

  if (input.joinRequestId.trim().length < 3) {
    return getMembershipApprovalResultState("join_request_not_found");
  }

  const normalizedEmail = input.applicantEmail.trim().toLowerCase();

  if (!normalizedEmail.includes("@") || normalizedEmail.length < 5) {
    return getMembershipApprovalResultState("profile_not_ready");
  }

  if (
    !chapterRoleKeys.includes(
      input.requestedRoleKey as (typeof chapterRoleKeys)[number],
    )
  ) {
    return getMembershipApprovalResultState("role_assignment_invalid");
  }

  if (input.auditReason.trim().length < 12) {
    return getMembershipApprovalResultState("audit_reason_required");
  }

  const duplicateMembership = existingMemberEmails.some((email) => {
    return email.trim().toLowerCase() === normalizedEmail;
  });

  if (duplicateMembership) {
    return getMembershipApprovalResultState("duplicate_membership");
  }

  return getMembershipApprovalResultState("membership_approved");
}

export function getDisabledMembershipApprovalResultPreview(
  actor: LocalActorContext,
  input: MembershipApprovalInput,
  existingMemberEmails: readonly string[] = [],
): MembershipApprovalResultPreview {
  const currentResult = getMembershipApprovalResultState("write_disabled");

  return {
    operation: "membership_approved",
    currentResult,
    futureResultIfEnabled: getFutureMembershipApprovalResultIfEnabled(
      actor,
      input,
      existingMemberEmails,
    ),
    serverResultShape: {
      success: false,
      errorCode: currentResult.code,
      applicantEmail: input.applicantEmail,
      plainEnglishMessage: `${currentResult.plainEnglishMessage} ${getWriteReadinessSummary()}`,
    },
  };
}

function canApproveMembership(actor: LocalActorContext): boolean {
  return canApproveChapterMembership(actor);
}
