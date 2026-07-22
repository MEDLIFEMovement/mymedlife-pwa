import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminAuditLogReviewPanel } from "@/components/admin-audit-log-review-panel";
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
    expect(review.summary).toContain("read-only admin review surface");
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
      "approve production writes from preview",
    );
  });

  it("is honest when mock fallback has audit intent but no persisted rows", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const review = getAdminAuditLogReview(
      actor,
      {
        ...getMockReadOnlyAppData("Testing mock audit posture."),
        auditLogs: [],
      },
    );

    expect(review.canReadRows).toBe(true);
    expect(review.title).toBe("Super Admin audit readback");
    expect(review.posture).toBe("mock_intent_only");
    expect(review.rows).toEqual([]);
    expect(review.summary).toContain("read-only review surface");
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
        "edit audit rows in browser",
        "delete audit rows in browser",
        "export audit rows from preview",
        "approve production writes from preview",
      ]),
    );
    expect(review.nextStep).toContain("localhost Supabase write/readback drills");
    expect(review.nextStep).toContain("read-only");
  });

  it("uses the unscoped RLS-protected audit collection for persisted admin readback", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const data = dataWithAuditLogs([]);
    data.source = {
      mode: "supabase",
      status: "supabase_ready",
      message: "Reading authenticated Supabase data.",
    };
    data.allAuditLogs = [{
      id: "audit-global-1",
      actor_user_id: "super-admin-1",
      chapter_id: null,
      action: "admin_user_access.deactivate_user",
      target_table: "auth.users",
      target_id: "target-user-1",
      before_value: { status: "active" },
      after_value: { status: "deactivated" },
      reason: "Suspend the TEST lifecycle account.",
      created_at: "2026-07-22T00:00:00Z",
    }];

    const review = getAdminAuditLogReview(actor, data);

    expect(review.posture).toBe("persisted_readback_visible");
    expect(review.counts.visibleRows).toBe(1);
    expect(review.rows[0]).toMatchObject({
      id: "audit-global-1",
      action: "admin_user_access.deactivate_user",
      target: "auth.users:target-user-1",
    });
  });

  it("does not call an empty authenticated Supabase read mock fallback", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const data = dataWithAuditLogs([]);
    data.source = {
      mode: "supabase",
      status: "supabase_ready",
      message: "Reading authenticated Supabase data.",
    };
    data.allAuditLogs = [];

    const review = getAdminAuditLogReview(actor, data);

    expect(review.posture).toBe("persisted_readback_empty");
    expect(review.summary).not.toContain("Mock fallback");
    expect(review.nextStep).toContain("audit RLS");
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
    expect(review.summary).toContain("read-only review surface");
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
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const data = dataWithAuditLogs([]);

    expect(getAdminAuditLogReview(member, data).canReadReview).toBe(false);
    expect(getAdminAuditLogReview(leader, data).canReadReview).toBe(false);
    const coachReview = getAdminAuditLogReview(coach, data);

    expect(coachReview.canReadReview).toBe(false);
    expect(coachReview.auditPreflight.items).toEqual([]);
  });

  it("renders blocked preview controls in the audit log panel", () => {
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

    const html = renderToStaticMarkup(
      React.createElement(AdminAuditLogReviewPanel, { review }),
    );

    expect(html).toContain(
      "This review route shows audit posture and readback evidence only.",
    );
    expect(html).toContain("Blocked here edit audit rows");
    expect(html).toContain("Blocked here export audit rows");
    expect(html).toContain(
      "This review stays read-only. No audit export, retention change, secret reveal, or production-write approval runs from this surface.",
    );
  });
});

function dataWithAuditLogs(auditLogs: AuditLogRow[]) {
  return {
    ...getMockReadOnlyAppData("Testing audit logs."),
    auditLogs,
  };
}
