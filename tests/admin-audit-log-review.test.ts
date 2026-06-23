import { describe, expect, it } from "vitest";
import { getAdminAuditLogReview } from "@/services/admin-audit-log-review";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import type { AuditLogRow } from "@/shared/types/persistence";

describe("admin audit log review", () => {
  it("shows admins persisted audit readback without enabling writes or sends", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const review = getAdminAuditLogReview(
      actor,
      dataWithAuditLogs([
        {
          id: "audit-1",
          actor_user_id: "member-1",
          chapter_id: "chapter-1",
          action: "action_started",
          target_table: "assignments",
          target_id: "assignment-1",
          before_value: { status: "not_started" },
          after_value: { status: "in_progress" },
          reason: "Local action start test.",
          created_at: "2026-06-15T00:00:00Z",
        },
      ]),
    );

    expect(review.canReadReview).toBe(true);
    expect(review.canReadRows).toBe(true);
    expect(review.title).toBe("Admin audit readback");
    expect(review.posture).toBe("persisted_readback_visible");
    expect(review.counts).toEqual({
      visibleRows: 1,
      hiddenRows: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    });
    expect(review.rows[0]).toEqual(
      expect.objectContaining({
        action: "action_started",
        actorUserId: "member-1",
        chapterId: "chapter-1",
        target: "assignments:assignment-1",
        beforeSummary: "status",
        afterSummary: "status",
      }),
    );
    expect(review.auditPreflight.title).toBe("Write-audit preflight checklist");
    expect(review.auditPreflight.counts).toEqual({
      total: 6,
      ready: 6,
      watch: 0,
      blocked: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    });
    expect(review.auditPreflight.items.map((item) => item.key)).toEqual([
      "actor_identity",
      "target_readback",
      "before_after",
      "reason_note",
      "visibility_boundary",
      "retention_export_lock",
    ]);
    expect(review.auditPreflight.blockedControls).toContain(
      "approve production writes",
    );
  });

  it("is honest when mock fallback has audit intent but no persisted rows", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const review = getAdminAuditLogReview(
      actor,
      getMockReadOnlyAppData("Testing mock audit posture."),
    );

    expect(review.canReadRows).toBe(true);
    expect(review.title).toBe("Super Admin audit readback");
    expect(review.posture).toBe("mock_intent_only");
    expect(review.rows).toEqual([]);
    expect(review.auditPreflight.counts).toEqual({
      total: 6,
      ready: 2,
      watch: 4,
      blocked: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    });
    expect(review.auditPreflight.items.map((item) => item.key)).toEqual([
      "actor_identity",
      "target_readback",
      "before_after",
      "reason_note",
      "visibility_boundary",
      "retention_export_lock",
    ]);
    expect(review.auditPreflight.blockedControls).toEqual(
      expect.arrayContaining([
        "edit audit rows",
        "delete audit rows",
        "export audit rows",
        "approve production writes",
      ]),
    );
    expect(review.nextStep).toContain("localhost Supabase write/readback drills");
  });

  it("lets DS Admin see posture while hiding row-level audit truth", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const review = getAdminAuditLogReview(
      actor,
      dataWithAuditLogs([
        {
          id: "audit-1",
          actor_user_id: "member-1",
          chapter_id: "chapter-1",
          action: "evidence_submitted",
          target_table: "evidence_items",
          target_id: "evidence-1",
          before_value: null,
          after_value: { status: "pending_review" },
          reason: null,
          created_at: "2026-06-15T00:00:00Z",
        },
      ]),
    );

    expect(review.canReadReview).toBe(true);
    expect(review.canReadRows).toBe(false);
    expect(review.posture).toBe("row_details_hidden");
    expect(review.counts.hiddenRows).toBe(1);
    expect(review.rows).toEqual([]);
    expect(review.summary).toContain("row-level chapter/member audit details");
    expect(review.auditPreflight.counts).toEqual({
      total: 6,
      ready: 3,
      watch: 3,
      blocked: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    });
    expect(
      review.auditPreflight.items.find(
        (item) => item.key === "visibility_boundary",
      )?.currentPosture,
    ).toContain("1 row(s) hidden from this role.");
  });

  it("hides the review from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const data = dataWithAuditLogs([]);

    expect(getAdminAuditLogReview(member, data).canReadReview).toBe(false);
    expect(getAdminAuditLogReview(committeeMember, data).canReadReview).toBe(false);
    expect(getAdminAuditLogReview(committeeChair, data).canReadReview).toBe(false);
    expect(getAdminAuditLogReview(leader, data).canReadReview).toBe(false);
    const coachReview = getAdminAuditLogReview(coach, data);

    expect(coachReview.canReadReview).toBe(false);
    expect(coachReview.auditPreflight.items).toEqual([]);
  });
});

function dataWithAuditLogs(auditLogs: AuditLogRow[]) {
  return {
    ...getMockReadOnlyAppData("Testing audit logs."),
    auditLogs,
  };
}
