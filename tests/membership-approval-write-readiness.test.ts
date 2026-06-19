import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getMembershipApprovalWriteConfig,
  getMembershipApprovalWriteReadiness,
} from "@/services/membership-approval-write-readiness";
import { prepareDisabledMembershipApprovalWrite } from "@/services/write-readiness";
import type { ChapterMembershipApprovalInput } from "@/services/local-action-contracts";

const validInput = {
  chapterId: "mock-chapter",
  joinRequestId: "join-avery",
  applicantEmail: "avery.new@mymedlife.test",
  requestedRoleKey: "general_member",
  requestedCommitteeLane: "Recruitment",
  auditReason: "Approve local Rush Month join request for chapter review.",
} satisfies ChapterMembershipApprovalInput;

const validSupabaseInput = {
  chapterId: "10000000-0000-4000-8000-000000000001",
  joinRequestId: "20000000-0000-4000-8000-000000000005",
  applicantEmail: "avery.new@mymedlife.test",
  requestedRoleKey: "general_member",
  requestedCommitteeLane: "Recruitment",
  auditReason: "Approve local Rush Month join request for chapter review.",
} satisfies ChapterMembershipApprovalInput;

describe("membership approval write readiness", () => {
  it("keeps the future membership approval write disabled by default", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const readiness = getMembershipApprovalWriteReadiness(actor, validInput);

    expect(readiness.title).toBe("Goal 162 membership approval write readiness");
    expect(readiness.operation).toBe("membership_approved");
    expect(readiness.targetRoute).toBe("/chapter/members");
    expect(readiness.futureFunction).toBe("app.approve_chapter_membership");
    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("write_disabled");
    expect(readiness.config).toEqual(
      expect.objectContaining({
        enabled: false,
        externalWritesEnabled: false,
        sendsWelcome: false,
        syncsCrm: false,
      }),
    );
    expect(readiness.futureTables).toEqual([
      "memberships",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ]);
    expect(readiness.requiredRlsTests).toEqual(
      expect.arrayContaining([
        "chapter_leader_can_approve_visible_join_request",
        "ds_admin_cannot_approve_membership",
        "membership_approval_creates_disabled_outbox_row",
      ]),
    );
  });

  it("allows a signed-in local reviewer to submit when env flags and Supabase UUIDs are present", () => {
    const actor = {
      ...getMockLocalActorContext("leader.a@mymedlife.test"),
      identitySource: "local_auth_session" as const,
      authSessionStatus: "signed_in" as const,
    };
    const readiness = getMembershipApprovalWriteReadiness(
      actor,
      validSupabaseInput,
      [],
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE: "true",
      },
    );

    expect(getMembershipApprovalWriteConfig({
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE: "true",
    }).enabled).toBe(true);
    expect(readiness.canSubmit).toBe(true);
    expect(readiness.resultCodeIfSubmitted).toBe("membership_approved");
    expect(
      readiness.checks.find((check) => check.key === "database_function_ready"),
    ).toEqual(expect.objectContaining({ passed: true }));
    expect(readiness.checks.find((check) => check.key === "rls_tests_ready")).toEqual(
      expect.objectContaining({ passed: true }),
    );
    expect(readiness.checks.find((check) => check.key === "chapter_uuid")).toEqual(
      expect.objectContaining({ passed: true }),
    );
    expect(readiness.checks.find((check) => check.key === "local_auth_session")).toEqual(
      expect.objectContaining({ passed: true }),
    );
  });

  it("keeps mock chapter and join-request IDs blocked even after the write is implemented", () => {
    const actor = {
      ...getMockLocalActorContext("leader.a@mymedlife.test"),
      identitySource: "local_auth_session" as const,
      authSessionStatus: "signed_in" as const,
    };
    const readiness = getMembershipApprovalWriteReadiness(
      actor,
      validInput,
      [],
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("join_request_not_found");
    expect(readiness.checks.find((check) => check.key === "chapter_uuid")).toEqual(
      expect.objectContaining({ passed: false }),
    );
    expect(
      readiness.checks.find((check) => check.key === "join_request_visible"),
    ).toEqual(expect.objectContaining({ passed: false }));
  });

  it("maps duplicate, invalid role, missing audit reason, and blocked actors to result states", () => {
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(
      getMembershipApprovalWriteReadiness(leader, validInput, [
        "avery.new@mymedlife.test",
      ]).futureResultIfEnabled.code,
    ).toBe("duplicate_membership");
    expect(
      getMembershipApprovalWriteReadiness(leader, {
        ...validInput,
        requestedRoleKey: "admin",
      }).futureResultIfEnabled.code,
    ).toBe("role_assignment_invalid");
    expect(
      getMembershipApprovalWriteReadiness(leader, {
        ...validInput,
        auditReason: "Too short",
      }).futureResultIfEnabled.code,
    ).toBe("audit_reason_required");
    expect(
      getMembershipApprovalWriteReadiness(coach, validInput).futureResultIfEnabled.code,
    ).toBe("permission_denied");
  });

  it("previews the disabled write payload without sending welcome or CRM updates", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const attempt = prepareDisabledMembershipApprovalWrite(actor, validInput);

    expect(attempt.success).toBe(false);
    expect(attempt.operation).toBe("membership_approved");
    expect(attempt.wouldWriteTables).toEqual([
      "memberships",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ]);
    expect(attempt.preview).toEqual(
      expect.objectContaining({
        success: true,
      }),
    );
    if (!attempt.preview.success) {
      throw new Error("Expected membership approval preview to succeed.");
    }
    expect(attempt.preview.data.membership).toEqual(
      expect.objectContaining({
        status: "approved",
        requestedRoleKey: "general_member",
        committeeLane: "Recruitment",
      }),
    );
    expect(attempt.preview.data.automationOutbox).toEqual(
      expect.objectContaining({
        destination: "HubSpot",
        status: "disabled",
      }),
    );
    expect(attempt.preview.data.auditLog.action).toBe("membership_approved");
  });
});
