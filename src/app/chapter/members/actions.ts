"use server";

import { redirect } from "next/navigation";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import {
  getMembershipApprovalLocalWriteConfig,
  hasMembershipApprovalSupabaseIds,
  mapMembershipApprovalRpcError,
  mapMembershipApprovalRpcSuccess,
  normalizeMembershipApprovalReturnTo,
  parseMembershipApprovalRole,
  type MembershipApprovalRpcRow,
  type MembershipApprovalServerResult,
} from "@/services/membership-approval-write";

export async function submitMembershipApprovalAction(formData: FormData) {
  const joinRequestId = String(formData.get("joinRequestId") ?? "").trim();
  const applicantEmail = String(formData.get("applicantEmail") ?? "").trim();
  const returnTo = normalizeMembershipApprovalReturnTo(formData.get("returnTo"));
  const result = await submitMembershipApprovalForLocalSupabase(formData);
  const search = new URLSearchParams({
    membershipApprovalResult: result.code,
    applicantEmail,
    joinRequestId,
  });

  redirect(`${returnTo}?${search.toString()}`);
}

export async function submitMembershipApprovalForLocalSupabase(
  formData: FormData,
): Promise<MembershipApprovalServerResult> {
  const chapterId = String(formData.get("chapterId") ?? "").trim();
  const joinRequestId = String(formData.get("joinRequestId") ?? "").trim();
  const requestedRoleKey = parseMembershipApprovalRole(formData.get("requestedRoleKey"));
  const auditReason = String(formData.get("auditReason") ?? "").trim();
  const config = getMembershipApprovalLocalWriteConfig();

  if (!config.enabled) {
    return {
      success: false,
      code: "write_disabled",
      membershipId: null,
      plainEnglishMessage: config.reason,
    };
  }

  if (!hasMembershipApprovalSupabaseIds({ chapterId, joinRequestId })) {
    return {
      success: false,
      code: "join_request_not_found",
      membershipId: null,
      plainEnglishMessage:
        "The current chapter or join request uses mock data instead of approved Supabase UUIDs, so no membership was approved.",
    };
  }

  if (!requestedRoleKey) {
    return {
      success: false,
      code: "role_assignment_invalid",
      membershipId: null,
      plainEnglishMessage:
        "Choose a valid chapter role before approving membership.",
    };
  }

  if (auditReason.length < 12) {
    return {
      success: false,
      code: "audit_reason_required",
      membershipId: null,
      plainEnglishMessage:
        "Add a short approval reason so the audit log explains why access changed.",
    };
  }

  const { client, config: authConfig } = await createLocalSupabaseServerClient();

  if (!client) {
    return {
      success: false,
      code: "write_disabled",
      membershipId: null,
      plainEnglishMessage: authConfig.reason,
    };
  }

  const authSession = await getAuthSessionState(client);

  if (authSession.status !== "signed_in") {
    return {
      success: false,
      code: "missing_auth",
      membershipId: null,
      plainEnglishMessage:
        "Sign in with an approved chapter leader, Admin, or Super Admin reviewer before approving membership.",
    };
  }

  const { data, error } = await client
    .schema("app")
    .rpc("approve_chapter_membership", {
      chapter_uuid: chapterId,
      join_request_uuid: joinRequestId,
      requested_role_key_input: requestedRoleKey,
      audit_reason_input: auditReason,
    });

  if (error) {
    return mapMembershipApprovalRpcError(error);
  }

  const firstRow = Array.isArray(data)
    ? (data[0] as MembershipApprovalRpcRow | undefined)
    : undefined;

  if (!firstRow) {
    return {
      success: false,
      code: "server_error",
      membershipId: null,
      plainEnglishMessage:
        "Supabase did not return the expected membership approval record. No welcome message, CRM sync, or external automation ran.",
    };
  }

  return mapMembershipApprovalRpcSuccess(firstRow);
}
