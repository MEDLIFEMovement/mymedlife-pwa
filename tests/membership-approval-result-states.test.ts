import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getDisabledMembershipApprovalResultPreview,
  getFutureMembershipApprovalResultIfEnabled,
  getMembershipApprovalResultState,
  getMembershipApprovalResultStates,
  type MembershipApprovalInput,
} from "@/services/membership-approval-result-states";

const validInput = {
  joinRequestId: "join-avery",
  applicantEmail: "avery.new@mymedlife.test",
  requestedRoleKey: "general_member",
  requestedCommitteeLane: "Recruitment",
  auditReason: "Approve local Rush Month join request for chapter review.",
} satisfies MembershipApprovalInput;

describe("membership approval result states", () => {
  it("defines plain-English states for the future membership approval save", () => {
    const states = getMembershipApprovalResultStates();

    expect(states.map((state) => state.code)).toEqual([
      "membership_approved",
      "write_disabled",
      "welcome_disabled",
      "crm_sync_disabled",
      "duplicate_membership",
      "permission_denied",
      "missing_auth",
      "join_request_not_found",
      "profile_not_ready",
      "role_assignment_invalid",
      "audit_reason_required",
      "server_error",
    ]);
    expect(states.every((state) => state.plainEnglishMessage.length > 30)).toBe(true);
    expect(states.every((state) => state.sendsWelcome === false)).toBe(true);
    expect(states.every((state) => state.syncsCrm === false)).toBe(true);
  });

  it("keeps the current browser membership approval result disabled", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const preview = getDisabledMembershipApprovalResultPreview(actor, validInput);

    expect(preview.operation).toBe("membership_approved");
    expect(preview.currentResult.code).toBe("write_disabled");
    expect(preview.currentResult.createsMembership).toBe(false);
    expect(preview.currentResult.assignsChapterRole).toBe(false);
    expect(preview.currentResult.sendsWelcome).toBe(false);
    expect(preview.currentResult.syncsCrm).toBe(false);
    expect(preview.serverResultShape).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "write_disabled",
        applicantEmail: "avery.new@mymedlife.test",
      }),
    );
  });

  it("previews success for leaders and admins with valid approval input", () => {
    for (const email of [
      "leader.a@mymedlife.test",
      "admin@mymedlife.test",
      "super.admin@mymedlife.test",
    ]) {
      const actor = getMockLocalActorContext(email);

      expect(getFutureMembershipApprovalResultIfEnabled(actor, validInput)).toEqual(
        expect.objectContaining({
          code: "membership_approved",
          createsMembership: true,
          assignsChapterRole: true,
          createsOutboxItem: true,
          sendsWelcome: false,
          syncsCrm: false,
        }),
      );
    }
  });

  it("blocks roles that do not own membership approval", () => {
    for (const email of [
      "member.a@mymedlife.test",
      "coach@mymedlife.test",
      "ds.admin@mymedlife.test",
    ]) {
      const actor = getMockLocalActorContext(email);

      expect(getFutureMembershipApprovalResultIfEnabled(actor, validInput)).toEqual(
        expect.objectContaining({
          code: "permission_denied",
          createsMembership: false,
        }),
      );
    }
  });

  it("validates duplicate memberships, profile mapping, role, and audit reason", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");

    expect(
      getFutureMembershipApprovalResultIfEnabled(actor, validInput, [
        "avery.new@mymedlife.test",
      ]),
    ).toEqual(expect.objectContaining({ code: "duplicate_membership" }));
    expect(
      getFutureMembershipApprovalResultIfEnabled(actor, {
        ...validInput,
        applicantEmail: "not-an-email",
      }),
    ).toEqual(expect.objectContaining({ code: "profile_not_ready" }));
    expect(
      getFutureMembershipApprovalResultIfEnabled(actor, {
        ...validInput,
        requestedRoleKey: "admin",
      }),
    ).toEqual(expect.objectContaining({ code: "role_assignment_invalid" }));
    expect(
      getFutureMembershipApprovalResultIfEnabled(actor, {
        ...validInput,
        auditReason: "Too short",
      }),
    ).toEqual(expect.objectContaining({ code: "audit_reason_required" }));
    expect(
      getFutureMembershipApprovalResultIfEnabled(actor, {
        ...validInput,
        joinRequestId: "",
      }),
    ).toEqual(expect.objectContaining({ code: "join_request_not_found" }));
  });

  it("keeps welcome and CRM sync disabled as documented non-send states", () => {
    expect(getMembershipApprovalResultState("welcome_disabled")).toEqual(
      expect.objectContaining({
        sendsWelcome: false,
        syncsCrm: false,
      }),
    );
    expect(getMembershipApprovalResultState("crm_sync_disabled")).toEqual(
      expect.objectContaining({
        sendsWelcome: false,
        syncsCrm: false,
      }),
    );
  });
});
