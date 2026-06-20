import {
  canApproveChapterMembership,
  type ChapterMembershipApprovalInput,
} from "@/services/local-action-contracts";
import { isUuid } from "@/services/action-start-write";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getFutureMembershipApprovalResultIfEnabled,
  type MembershipApprovalResultCode,
  type MembershipApprovalResultState,
} from "@/services/membership-approval-result-states";
import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";
import { isActorAllowedForPlannedWrite } from "@/services/write-plan-matrix";
import type { DatabaseRoleKey } from "@/shared/types/persistence";

type EnvSource = Record<string, string | undefined>;

export type MembershipApprovalWriteCheckKey =
  | "local_writes_requested"
  | "membership_approval_write_approved"
  | "database_function_ready"
  | "rls_tests_ready"
  | "local_auth_session"
  | "chapter_uuid"
  | "join_request_visible"
  | "applicant_profile_ready"
  | "requested_role_valid"
  | "no_duplicate_membership"
  | "audit_reason_present"
  | "actor_can_approve_membership"
  | "actor_allowed_by_write_plan"
  | "welcome_sends_disabled"
  | "crm_sync_disabled"
  | "external_writes_disabled";

export type MembershipApprovalWriteCheck = {
  key: MembershipApprovalWriteCheckKey;
  label: string;
  passed: boolean;
};

export type MembershipApprovalWriteConfig =
  | {
      enabled: true;
      isLocalOnly: boolean;
      isHostedStaging: boolean;
      externalWritesEnabled: false;
      sendsWelcome: false;
      syncsCrm: false;
      reason: string;
    }
  | {
      enabled: false;
      isLocalOnly: boolean;
      isHostedStaging: boolean;
      externalWritesEnabled: false;
      sendsWelcome: false;
      syncsCrm: false;
      reason: string;
    };

export type MembershipApprovalWriteReadiness = {
  title: "Goal 162 membership approval write readiness";
  operation: "membership_approved";
  targetRoute: "/chapter/members";
  futureFunction: "app.approve_chapter_membership";
  canSubmit: boolean;
  resultCodeIfSubmitted: MembershipApprovalResultCode;
  reason: string;
  config: MembershipApprovalWriteConfig;
  futureResultIfEnabled: MembershipApprovalResultState;
  checks: MembershipApprovalWriteCheck[];
  requiredRlsTests: readonly string[];
  requiredEnvFlags: readonly string[];
  futureTables: readonly string[];
};

const chapterRoleKeys = [
  "general_member",
  "action_committee_member",
  "action_committee_chair",
  "e_board_member",
  "president_vp",
] as const satisfies readonly DatabaseRoleKey[];

const requiredRlsTests = [
  "chapter_leader_can_approve_visible_join_request",
  "admin_can_approve_chapter_membership_with_audit_reason",
  "super_admin_can_approve_chapter_membership",
  "member_cannot_approve_membership",
  "coach_cannot_approve_membership",
  "ds_admin_cannot_approve_membership",
  "duplicate_membership_is_rejected",
  "membership_approval_creates_disabled_outbox_row",
] as const;

const localRequiredEnvFlags = [
  "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE=true",
] as const;

const hostedStagingRequiredEnvFlags = [
  "MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE=true",
] as const;

const futureTables = [
  "memberships",
  "events",
  "integration_events",
  "automation_outbox",
  "audit_logs",
] as const;

export function getMembershipApprovalWriteConfig(
  env: EnvSource = process.env,
): MembershipApprovalWriteConfig {
  const authConfig = getSupabaseAuthConfig(env);

  if (!authConfig.enabled) {
    return disabledConfig(authConfig.reason, authConfig.isLocalOnly, authConfig.isHostedStaging);
  }

  if (authConfig.isHostedStaging) {
    if (env.MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES !== "true") {
      return disabledConfig(
        "Hosted staging writes are disabled. Set MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES=true only for the approved staging write rehearsal.",
        false,
        true,
      );
    }

    if (env.MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE !== "true") {
      return disabledConfig(
        "Hosted staging membership approval remains disabled. Set MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE=true only after auth, RLS, rollback, and audit readback are approved.",
        false,
        true,
      );
    }

    return {
      enabled: true,
      isLocalOnly: false,
      isHostedStaging: true,
      externalWritesEnabled: false,
      sendsWelcome: false,
      syncsCrm: false,
      reason:
        "Hosted staging membership approval is enabled for staging.mymedlife.org only. Welcome messages, CRM syncs, uploads, and external sends remain disabled.",
    };
  }

  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return disabledConfig(
      "Membership approval writes are disabled. Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true only for localhost Supabase write testing.",
      true,
      false,
    );
  }

  if (env.MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE !== "true") {
    return disabledConfig(
      "Membership approval browser-facing writes remain disabled. Set MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE=true only after auth, RLS, rollback, and audit readback are approved.",
      true,
      false,
    );
  }

  return {
    enabled: true,
    isLocalOnly: true,
    isHostedStaging: false,
    externalWritesEnabled: false,
    sendsWelcome: false,
    syncsCrm: false,
    reason:
      "Local membership approval writes are enabled for localhost Supabase only. Welcome messages, CRM syncs, and external sends remain disabled.",
  };
}

export function getMembershipApprovalWriteReadiness(
  actor: LocalActorContext,
  input: ChapterMembershipApprovalInput,
  existingMemberEmails: readonly string[] = [],
  env: EnvSource = process.env,
): MembershipApprovalWriteReadiness {
  const config = getMembershipApprovalWriteConfig(env);
  const futureResult = getFutureMembershipApprovalResultIfEnabled(
    actor,
    input,
    existingMemberEmails,
  );
  const localWritesRequested = config.isHostedStaging
    ? env.MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES === "true"
    : env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true";
  const membershipApprovalWriteApproved =
    env.MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE === "true";
  const localAuthSession =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";
  const normalizedEmail = input.applicantEmail.trim().toLowerCase();
  const duplicateMembership = existingMemberEmails.some((email) => {
    return email.trim().toLowerCase() === normalizedEmail;
  });
  const requestedRoleValid = chapterRoleKeys.includes(
    input.requestedRoleKey as (typeof chapterRoleKeys)[number],
  );

  const checks: MembershipApprovalWriteCheck[] = [
    {
      key: "local_writes_requested",
      label: config.isHostedStaging
        ? "Hosted staging write switch is on"
        : "Local write switch is on",
      passed: localWritesRequested,
    },
    {
      key: "membership_approval_write_approved",
      label: "Membership approval write switch is on",
      passed: membershipApprovalWriteApproved,
    },
    {
      key: "database_function_ready",
      label: "Membership approval database function is implemented",
      passed: true,
    },
    {
      key: "rls_tests_ready",
      label: "Membership approval RLS tests are implemented",
      passed: true,
    },
    {
      key: "local_auth_session",
      label: config.isHostedStaging
        ? "Signed-in hosted staging Supabase Auth session"
        : "Signed-in local Supabase Auth session",
      passed: localAuthSession,
    },
    {
      key: "chapter_uuid",
      label: "Chapter ID is a Supabase UUID",
      passed: isUuid(input.chapterId),
    },
    {
      key: "join_request_visible",
      label: "Join request is a visible Supabase UUID",
      passed: isUuid(input.joinRequestId),
    },
    {
      key: "applicant_profile_ready",
      label: "Applicant profile email is valid",
      passed: normalizedEmail.includes("@") && normalizedEmail.length >= 5,
    },
    {
      key: "requested_role_valid",
      label: "Requested role is chapter-scoped",
      passed: requestedRoleValid,
    },
    {
      key: "no_duplicate_membership",
      label: "No duplicate membership exists",
      passed: !duplicateMembership,
    },
    {
      key: "audit_reason_present",
      label: "Audit reason has enough context",
      passed: input.auditReason.trim().length >= 12,
    },
    {
      key: "actor_can_approve_membership",
      label: "Actor can approve chapter membership",
      passed: canApproveChapterMembership(actor),
    },
    {
      key: "actor_allowed_by_write_plan",
      label: "Actor is allowed by the planned write matrix",
      passed: isActorAllowedForPlannedWrite(actor.audience, "membership_approved"),
    },
    {
      key: "welcome_sends_disabled",
      label: "Welcome messages stay disabled",
      passed: !config.sendsWelcome,
    },
    {
      key: "crm_sync_disabled",
      label: "CRM sync stays disabled",
      passed: !config.syncsCrm,
    },
    {
      key: "external_writes_disabled",
      label: "External writes stay disabled",
      passed: !config.externalWritesEnabled,
    },
  ];
  const failedCheck = checks.find((check) => !check.passed);
  const canSubmit = config.enabled && !failedCheck;

  return {
    title: "Goal 162 membership approval write readiness",
    operation: "membership_approved",
    targetRoute: "/chapter/members",
    futureFunction: "app.approve_chapter_membership",
    canSubmit,
    resultCodeIfSubmitted: canSubmit
      ? "membership_approved"
      : getBlockedResultCode(failedCheck?.key, futureResult.code),
    reason: failedCheck
      ? `${failedCheck.label} is not ready. ${config.reason}`
      : config.reason,
    config,
    futureResultIfEnabled: futureResult,
    checks,
    requiredRlsTests,
    requiredEnvFlags: config.isHostedStaging
      ? hostedStagingRequiredEnvFlags
      : localRequiredEnvFlags,
    futureTables,
  };
}

function disabledConfig(
  reason: string,
  isLocalOnly: boolean,
  isHostedStaging: boolean,
): MembershipApprovalWriteConfig {
  return {
    enabled: false,
    isLocalOnly,
    isHostedStaging,
    externalWritesEnabled: false,
    sendsWelcome: false,
    syncsCrm: false,
    reason,
  };
}

function getBlockedResultCode(
  failedCheckKey: MembershipApprovalWriteCheckKey | undefined,
  futureResultCode: MembershipApprovalResultCode,
): MembershipApprovalResultCode {
  switch (failedCheckKey) {
    case "actor_can_approve_membership":
    case "actor_allowed_by_write_plan":
      return "permission_denied";
    case "local_auth_session":
      return "missing_auth";
    case "chapter_uuid":
    case "join_request_visible":
      return "join_request_not_found";
    case "applicant_profile_ready":
      return "profile_not_ready";
    case "requested_role_valid":
      return "role_assignment_invalid";
    case "no_duplicate_membership":
      return "duplicate_membership";
    case "audit_reason_present":
      return "audit_reason_required";
    case "welcome_sends_disabled":
      return "welcome_disabled";
    case "crm_sync_disabled":
      return "crm_sync_disabled";
    case "local_writes_requested":
    case "membership_approval_write_approved":
    case "database_function_ready":
    case "rls_tests_ready":
    case "external_writes_disabled":
    case undefined:
      return futureResultCode === "membership_approved" ? "write_disabled" : futureResultCode;
  }
}
