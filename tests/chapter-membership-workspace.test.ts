import { describe, expect, it } from "vitest";
import { getChapterMembershipWorkspace } from "@/services/chapter-membership-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing chapter membership workspace.");

describe("chapter membership workspace", () => {
  it("gives chapter leaders a read-only member management workspace", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const workspace = getChapterMembershipWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toContain("roster and join requests");
    expect(workspace.counts.activeMembers).toBe(5);
    expect(workspace.counts.pendingRequests).toBe(2);
    expect(workspace.counts.enabledControls).toBe(0);
    expect(workspace.membershipApprovalPacket).toEqual(
      expect.objectContaining({
        title: "First join approval preview",
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
        auditReason: "Approve this Rush Month join request for chapter roster follow-through.",
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
    expect(workspace.title).toContain("coaching roster view");
    expect(workspace.joinRequests).toEqual([]);
    expect(workspace.membershipApprovalPacket).toBeNull();
    expect(workspace.summary).toContain("without owning join approvals");
  });

  it("lets committee chairs read the chapter roster but keeps committee members out", () => {
    const committeeChair = getChapterMembershipWorkspace(
      getMockLocalActorContext("committee.chair@mymedlife.test"),
      data,
    );
    const committeeMember = getChapterMembershipWorkspace(
      getMockLocalActorContext("committee.member@mymedlife.test"),
      data,
    );

    expect(committeeChair.canReadWorkspace).toBe(true);
    expect(committeeChair.title).toContain("roster and join requests");
    expect(committeeChair.membershipApprovalPacket?.payload.approvedByActorEmail).toBe(
      "committee.chair@mymedlife.test",
    );
    expect(committeeMember.canReadWorkspace).toBe(false);
    expect(committeeMember.members).toEqual([]);
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
    expect(workspace.auditPreview.join(" ")).toContain("audit trail");
    expect(workspace.outboxPreview.join(" ")).toContain("paused");
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
        "Add member to chapter roster",
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
});
