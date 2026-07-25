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
        actorUserId: "TEST member-1",
        chapterId: "TEST chapter-1",
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

    const html = renderToStaticMarkup(
      React.createElement(AdminAuditLogReviewPanel, { review }),
    );

    expect(html).toContain("persisted readback empty");
    expect(html).toContain(
      "The authenticated data source returned no visible audit rows.",
    );
    expect(html).not.toContain("Mock review mode can prove audit intent");
  });

  it("renders the mock-only empty-state explanation", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const review = getAdminAuditLogReview(actor, dataWithAuditLogs([]));

    const html = renderToStaticMarkup(
      React.createElement(AdminAuditLogReviewPanel, { review }),
    );

    expect(html).toContain("mock intent only");
    expect(html).toContain("Mock review mode can prove audit intent");
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
    expect(
      renderToStaticMarkup(
        React.createElement(AdminAuditLogReviewPanel, { review: coachReview }),
      ),
    ).toBe("");
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
    expect(html).toContain("Visible rows below are local TEST audit readback only.");
    expect(html).toContain("TEST member-1");
    expect(html).toContain("TEST chapter-1");
    expect(html).toContain("Blocked here edit audit rows");
    expect(html).toContain("Blocked here export audit rows");
    expect(html).toContain(
      "This review stays read-only. No audit export, retention change, secret reveal, or production-write approval runs from this surface.",
    );
  });

  it("renders nothing when the review surface is hidden for the current role", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const review = getAdminAuditLogReview(actor, dataWithAuditLogs([]));

    const html = renderToStaticMarkup(
      React.createElement(AdminAuditLogReviewPanel, { review }),
    );

    expect(html).toBe("");
  });

  it("does not double-prefix already labeled audit row values", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const review = getAdminAuditLogReview(
      actor,
      dataWithAuditLogs([
        {
          id: "audit-1",
          actor_user_id: "TEST member-1",
          chapter_id: "TEST chapter-1",
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

    expect(review.rows[0]).toEqual(
      expect.objectContaining({
        actorUserId: "TEST member-1",
        chapterId: "TEST chapter-1",
      }),
    );
  });

  it("keeps deliberate system and none audit fallback values unprefixed", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const review = getAdminAuditLogReview(
      actor,
      dataWithAuditLogs([
        {
          id: "audit-fallbacks",
          actor_user_id: null,
          chapter_id: null,
          action: "proof_reviewed",
          target_table: "proof_items",
          target_id: "proof-3",
          before_value: { status: "queued" },
          after_value: { status: "approved" },
          reason: "Fallback coverage.",
          created_at: "2026-06-15T00:10:00Z",
        },
      ]),
    );

    expect(review.rows[0]).toEqual(
      expect.objectContaining({
        actorUserId: "system",
        chapterId: "none",
      }),
    );
  });

  it("summarizes null, array, empty object, and scalar audit values readably", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const review = getAdminAuditLogReview(
      actor,
      dataWithAuditLogs([
        {
          id: "audit-null-array",
          actor_user_id: "member-1",
          chapter_id: "chapter-1",
          action: "proof_reviewed",
          target_table: "proof_items",
          target_id: "proof-1",
          before_value: null,
          after_value: ["queued"],
          reason: "Array summary coverage.",
          created_at: "2026-06-15T00:00:00Z",
        },
        {
          id: "audit-object-scalar",
          actor_user_id: "member-2",
          chapter_id: "chapter-2",
          action: "proof_reviewed",
          target_table: "proof_items",
          target_id: "proof-2",
          before_value: {},
          after_value: "ready",
          reason: "Scalar summary coverage.",
          created_at: "2026-06-15T00:05:00Z",
        },
      ]),
    );

    expect(review.rows[0]).toEqual(
      expect.objectContaining({
        beforeSummary: "none",
        afterSummary: "1 item",
      }),
    );
    expect(review.rows[1]).toEqual(
      expect.objectContaining({
        beforeSummary: "empty object",
        afterSummary: "ready",
      }),
    );
  });
});

function dataWithAuditLogs(auditLogs: AuditLogRow[]) {
  return {
    ...getMockReadOnlyAppData("Testing audit logs."),
    auditLogs,
  };
}
