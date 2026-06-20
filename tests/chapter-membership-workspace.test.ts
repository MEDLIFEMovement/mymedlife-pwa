import { afterEach, describe, expect, it, vi } from "vitest";
import { getChapterMembershipWorkspace } from "@/services/chapter-membership-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing chapter membership workspace.");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("chapter membership workspace", () => {
  it("gives chapter leaders a read-only member management workspace", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const workspace = getChapterMembershipWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toContain("member workspace");
    expect(workspace.counts.activeMembers).toBe(5);
    expect(workspace.counts.pendingRequests).toBe(2);
    expect(workspace.counts.enabledControls).toBe(0);
    expect(workspace.membershipApprovalPacket).toEqual(
      expect.objectContaining({
        title: "Goal 160 membership approval packet",
        targetRoute: "/chapter/members",
        futureFunction: "app.approve_chapter_membership",
        joinRequestId: "join-avery",
        applicantEmail: "avery.new@mymedlife.test",
        requestedRoleLabel: "General Member",
        currentResultCode: "membership_writes_disabled",
        futureResultCode: "membership_approved",
      }),
    );
    expect(workspace.membershipApprovalPacket?.payload).toEqual(
      expect.objectContaining({
        chapterId: data.chapter.id,
        applicantEmail: "avery.new@mymedlife.test",
        requestedRoleKey: "general_member",
        requestedCommitteeLane: "Recruitment",
        source: "rush_event",
        approvedByActorEmail: "leader.a@mymedlife.test",
        auditReason: "Approve Rush Month join request for chapter review.",
      }),
    );
    expect(workspace.membershipApprovalPacket?.resultPreview.currentResult.code).toBe(
      "write_disabled",
    );
    expect(
      workspace.membershipApprovalPacket?.resultPreview.futureResultIfEnabled.code,
    ).toBe("membership_approved");
    expect(workspace.membershipApprovalPacket?.writeReadiness).toEqual(
      expect.objectContaining({
        title: "Goal 162 membership approval write readiness",
        operation: "membership_approved",
        targetRoute: "/chapter/members",
        futureFunction: "app.approve_chapter_membership",
        canSubmit: false,
        resultCodeIfSubmitted: "write_disabled",
      }),
    );
    expect(workspace.members.map((member) => member.roleLabel)).toEqual(
      expect.arrayContaining([
        "General Member",
        "Action Committee Member",
        "Action Committee Chair",
        "E-Board Member",
        "President / VP",
      ]),
    );
  });

  it("shows coaches roster health without join approval ownership", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getChapterMembershipWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toContain("coach roster readout");
    expect(workspace.joinRequests).toEqual([]);
    expect(workspace.membershipApprovalPacket).toBeNull();
    expect(workspace.summary).toContain("without owning membership approvals");
  });

  it("keeps DS Admin and general members out of member-management truth", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");

    expect(getChapterMembershipWorkspace(dsAdmin, data).canReadWorkspace).toBe(false);
    expect(getChapterMembershipWorkspace(member, data).canReadWorkspace).toBe(false);
    expect(getChapterMembershipWorkspace(dsAdmin, data).membershipApprovalPacket).toBeNull();
    expect(getChapterMembershipWorkspace(member, data).membershipApprovalPacket).toBeNull();
    expect(getChapterMembershipWorkspace(dsAdmin, data).summary).toContain(
      "should not read or own chapter membership truth",
    );
  });

  it("keeps role approval and membership controls disabled", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getChapterMembershipWorkspace(actor, data);

    expect(workspace.disabledControls.map((control) => control.key)).toEqual([
      "approve_join_request",
      "assign_chapter_role",
      "move_committee_lane",
      "deactivate_member",
    ]);
    expect(
      workspace.disabledControls.every((control) => control.reason.length > 20),
    ).toBe(true);
    expect(workspace.auditPreview.join(" ")).toContain("membership_approved");
    expect(workspace.outboxPreview.join(" ")).toContain("disabled");
    expect(workspace.membershipApprovalPacket?.futureRecords).toEqual(
      expect.arrayContaining([
        {
          label: "Structured event",
          value: "membership_approved",
        },
        {
          label: "Audit action",
          value: "membership_approved",
        },
      ]),
    );
    expect(workspace.membershipApprovalPacket?.blockedControls).toEqual(
      expect.arrayContaining([
        "Approve join request",
        "Create membership row",
        "Send welcome message",
        "Sync CRM contact",
      ]),
    );
    expect(
      workspace.membershipApprovalPacket?.readinessChecks.find(
        (check) => check.key === "live_auth_required",
      ),
    ).toEqual(
      expect.objectContaining({
        passed: false,
      }),
    );
    expect(
      workspace.membershipApprovalPacket?.writeReadiness.checks.find(
        (check) => check.key === "database_function_ready",
      ),
    ).toEqual(expect.objectContaining({ passed: true }));
    expect(
      workspace.membershipApprovalPacket?.writeReadiness.requiredRlsTests,
    ).toEqual(expect.arrayContaining(["ds_admin_cannot_approve_membership"]));
  });

  it("flags thin action committee coverage before live launch", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getChapterMembershipWorkspace(actor, data);
    const chairCoverage = workspace.roleCoverage.find(
      (item) => item.roleKey === "action_committee_chair",
    );
    const memberCoverage = workspace.roleCoverage.find(
      (item) => item.roleKey === "action_committee_member",
    );

    expect(chairCoverage?.status).toBe("thin");
    expect(memberCoverage?.status).toBe("thin");
    expect(workspace.roleCoverage.some((item) => item.status === "missing")).toBe(false);
  });

  it("switches the enabled safety note to hosted staging language when the staging rehearsal is on", () => {
    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "staging_supabase");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://rceupryepjgkdeqgxzrc.supabase.co",
    );
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "staging-publishable-key");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.mymedlife.org");
    vi.stubEnv("MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES", "true");
    vi.stubEnv("MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE", "true");

    const actor = {
      ...getMockLocalActorContext("leader.a@mymedlife.test"),
      identitySource: "local_auth_session" as const,
      authSessionStatus: "signed_in" as const,
      isLocalOnly: false,
    };
    const chapterId = "10000000-0000-4000-8000-000000000001";
    const leaderUserId = "20000000-0000-4000-8000-000000000001";
    const applicantUserId = "20000000-0000-4000-8000-000000000005";
    const workspace = getChapterMembershipWorkspace(actor, {
      ...data,
      source: {
        mode: "supabase",
        status: "supabase_ready",
        message: "Reading hosted staging Supabase data for the signed-in session.",
      },
      chapter: {
        ...data.chapter,
        id: chapterId,
      },
      profiles: [
        {
          id: leaderUserId,
          display_name: "Priya President",
          email: "leader.a@mymedlife.test",
          status: "active",
          created_at: "2026-06-20T00:00:00.000Z",
          updated_at: "2026-06-20T00:00:00.000Z",
        },
        {
          id: applicantUserId,
          display_name: "Avery New",
          email: "avery.new@mymedlife.test",
          status: "active",
          created_at: "2026-06-20T00:00:00.000Z",
          updated_at: "2026-06-20T00:00:00.000Z",
        },
      ],
      memberships: [
        {
          id: "30000000-0000-4000-8000-000000000001",
          user_id: leaderUserId,
          chapter_id: chapterId,
          role_key: "president_vp",
          status: "approved",
          requested_at: "2026-06-20T00:00:00.000Z",
          approved_at: "2026-06-20T00:00:00.000Z",
          approved_by: leaderUserId,
          created_at: "2026-06-20T00:00:00.000Z",
          updated_at: "2026-06-20T00:00:00.000Z",
        },
        {
          id: "30000000-0000-4000-8000-000000000005",
          user_id: applicantUserId,
          chapter_id: chapterId,
          role_key: "general_member",
          status: "requested",
          requested_at: "2026-06-20T00:00:00.000Z",
          approved_at: null,
          approved_by: null,
          created_at: "2026-06-20T00:00:00.000Z",
          updated_at: "2026-06-20T00:00:00.000Z",
        },
      ],
    });

    expect(workspace.counts.enabledControls).toBe(1);
    expect(workspace.safetyNote).toContain("Hosted staging membership approval");
    expect(workspace.safetyNote).toContain("staging.mymedlife.org only");
    expect(
      workspace.membershipApprovalPacket?.readinessChecks.find(
        (check) => check.key === "live_auth_required",
      ),
    ).toEqual(
      expect.objectContaining({
        label: "Signed-in hosted staging Supabase Auth session is required before approval",
        passed: true,
      }),
    );
    expect(workspace.membershipApprovalPacket?.readinessReason).toContain(
      "hosted staging membership approval server action and readback path",
    );
  });
});
