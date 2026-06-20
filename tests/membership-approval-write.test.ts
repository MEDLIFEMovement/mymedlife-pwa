import { describe, expect, it } from "vitest";
import {
  getMembershipApprovalLocalWriteConfig,
  getMembershipApprovalReadbackState,
  hasMembershipApprovalSupabaseIds,
  mapMembershipApprovalRpcError,
  mapMembershipApprovalRpcSuccess,
  normalizeMembershipApprovalReturnTo,
  parseMembershipApprovalRole,
} from "@/services/membership-approval-write";

describe("membership approval write", () => {
  it("requires local writes and the membership approval flag", () => {
    expect(getMembershipApprovalLocalWriteConfig({})).toMatchObject({
      enabled: false,
      externalWritesEnabled: false,
      sendsWelcome: false,
      syncsCrm: false,
    });

    expect(
      getMembershipApprovalLocalWriteConfig({
        MYMEDLIFE_AUTH_MODE: "local_supabase",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
      }),
    ).toMatchObject({
      enabled: false,
    });

    expect(
      getMembershipApprovalLocalWriteConfig({
        MYMEDLIFE_AUTH_MODE: "local_supabase",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE: "true",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
      }),
    ).toMatchObject({
      enabled: true,
      externalWritesEnabled: false,
      sendsWelcome: false,
      syncsCrm: false,
    });
  });

  it("parses role and return-to values safely", () => {
    expect(parseMembershipApprovalRole("general_member")).toBe("general_member");
    expect(parseMembershipApprovalRole("admin")).toBeNull();
    expect(parseMembershipApprovalRole(null)).toBeNull();

    expect(normalizeMembershipApprovalReturnTo("/chapter/members")).toBe(
      "/chapter/members",
    );
    expect(normalizeMembershipApprovalReturnTo("/rush-month/actions")).toBe(
      "/chapter/members",
    );
  });

  it("requires Supabase UUIDs for chapter and join-request IDs", () => {
    expect(
      hasMembershipApprovalSupabaseIds({
        chapterId: "10000000-0000-4000-8000-000000000001",
        joinRequestId: "20000000-0000-4000-8000-000000000005",
      }),
    ).toBe(true);

    expect(
      hasMembershipApprovalSupabaseIds({
        chapterId: "mock-chapter",
        joinRequestId: "join-avery",
      }),
    ).toBe(false);
  });

  it("maps local RPC success and errors into membership result states", () => {
    expect(
      mapMembershipApprovalRpcSuccess({
        membership_id: "20000000-0000-4000-8000-000000000005",
        event_id: "80000000-0000-4000-8000-000000000010",
        integration_event_id: "81000000-0000-4000-8000-000000000010",
        outbox_id: "82000000-0000-4000-8000-000000000010",
        audit_log_id: "90000000-0000-4000-8000-000000000010",
      }),
    ).toMatchObject({
      success: true,
      code: "membership_approved",
      membershipId: "20000000-0000-4000-8000-000000000005",
    });

    expect(
      mapMembershipApprovalRpcError({
        code: "P0002",
        message: "requested membership row not found",
      }),
    ).toMatchObject({
      success: false,
      code: "join_request_not_found",
    });

    expect(
      mapMembershipApprovalRpcError({
        code: "42501",
        message: "actor cannot approve chapter membership for this chapter",
      }),
    ).toMatchObject({
      success: false,
      code: "permission_denied",
    });

    expect(
      mapMembershipApprovalRpcError({
        code: "23505",
        message: "duplicate approved membership exists for this chapter",
      }),
    ).toMatchObject({
      success: false,
      code: "duplicate_membership",
    });
  });

  it("confirms local readback when the applicant moves into the approved roster", () => {
    expect(
      getMembershipApprovalReadbackState(
        [
          {
            id: "member-avery",
            displayName: "Avery New",
            email: "avery.new@mymedlife.test",
            roleKey: "general_member",
            roleLabel: "General Member",
            committeeLane: "Recruitment",
            membershipStatus: "approved",
            points: 0,
            completedActions: 0,
            openAssignments: 0,
            proofStatus: "none",
            nextStep: "Start the first chapter action.",
          },
        ],
        [],
        "membership_approved",
        "avery.new@mymedlife.test",
        "20000000-0000-4000-8000-000000000005",
      ),
    ).toMatchObject({
      confirmsApproved: true,
      tone: "success",
      joinRequestStillVisible: false,
    });

    expect(
      getMembershipApprovalReadbackState(
        [],
        [
          {
            id: "20000000-0000-4000-8000-000000000005",
            displayName: "Avery New",
            email: "avery.new@mymedlife.test",
            requestedRoleKey: "general_member",
            requestedRoleLabel: "General Member",
            requestedCommitteeLane: "Recruitment",
            source: "rush_event",
            requestedAtLabel: "Today",
            nextStep: "Wait for review.",
          },
        ],
        "membership_approved",
        "avery.new@mymedlife.test",
        "20000000-0000-4000-8000-000000000005",
      ),
    ).toMatchObject({
      confirmsApproved: false,
      tone: "warning",
      joinRequestStillVisible: true,
    });
  });
});
