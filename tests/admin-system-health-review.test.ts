import { describe, expect, it } from "vitest";
import { getAdminSystemHealthReview } from "@/services/admin-system-health-review";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import type { AuditLogRow } from "@/shared/types/persistence";

describe("admin system health review", () => {
  it("summarizes safe mock health while keeping launch blocked", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const review = getAdminSystemHealthReview(
      actor,
      getMockReadOnlyAppData("Mock fallback for health review."),
      {
        MYMEDLIFE_DATA_SOURCE: "mock",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS: "false",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "false",
        MYMEDLIFE_ALLOW_PROOF_UPLOADS: "false",
      },
    );

    expect(review.canReadReview).toBe(true);
    expect(review.title).toBe("Admin system health review");
    expect(review.launchReady).toBe(false);
    expect(review.browserWritesEnabled).toBe(0);
    expect(review.externalWritesEnabled).toBe(0);
    expect(review.secretsShown).toBe(0);
    expect(review.counts).toEqual({
      total: 9,
      localReady: 4,
      mockSafe: 1,
      needsReview: 0,
      blockedBeforeLive: 4,
    });
    expect(review.checks.map((check) => check.key)).toEqual([
      "route_registry",
      "data_source",
      "environment_flags",
      "audit_readback",
      "outbox_safety",
      "production_auth",
      "proof_storage",
      "external_integrations",
      "monitoring_backup",
    ]);
    expect(
      review.checks.find((check) => check.key === "monitoring_backup")?.signal,
    ).toContain("operations runbook");
    expect(
      review.checks.find((check) => check.key === "monitoring_backup")
        ?.routeEvidence,
    ).toContain("/admin");
  });

  it("marks environment flags blocked when unsafe local flags are present", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const review = getAdminSystemHealthReview(
      actor,
      getMockReadOnlyAppData("Unsafe flag test."),
      {
        MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
        MYMEDLIFE_ALLOW_PROOF_UPLOADS: "true",
      },
    );

    expect(review.title).toBe("Full system health review");
    expect(
      review.checks.find((check) => check.key === "environment_flags"),
    ).toEqual(
      expect.objectContaining({
        status: "blocked_before_live",
        signal: expect.stringContaining("unsafe flag"),
      }),
    );
    expect(review.counts.blockedBeforeLive).toBe(5);
  });

  it("uses local Supabase-style readback signals when rows are visible", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const review = getAdminSystemHealthReview(
      actor,
      {
        ...getMockReadOnlyAppData("Local Supabase readback."),
        source: {
          mode: "supabase",
          status: "supabase_ready",
          message: "Reading local Supabase data in read-only mode.",
        },
        auditLogs: [auditLog()],
      },
      {
        MYMEDLIFE_DATA_SOURCE: "supabase",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS: "true",
      },
    );

    expect(review.title).toBe("DS Admin system health and integration review");
    expect(review.sourceLabel).toBe("supabase");
    expect(
      review.checks.find((check) => check.key === "data_source")?.status,
    ).toBe("local_ready");
    expect(
      review.checks.find((check) => check.key === "audit_readback")?.status,
    ).toBe("local_ready");
    expect(
      review.checks.find((check) => check.key === "environment_flags")?.status,
    ).toBe("needs_review");
  });

  it("hides system health from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const data = getMockReadOnlyAppData("Hidden role health.");

    expect(getAdminSystemHealthReview(member, data).canReadReview).toBe(false);
    expect(getAdminSystemHealthReview(leader, data).canReadReview).toBe(false);
    expect(getAdminSystemHealthReview(coach, data).canReadReview).toBe(false);
  });
});

function auditLog(): AuditLogRow {
  return {
    id: "audit-1",
    actor_user_id: "member-1",
    chapter_id: "chapter-1",
    action: "action_started",
    target_table: "assignments",
    target_id: "assignment-1",
    before_value: {
      status: "not_started",
    },
    after_value: {
      status: "in_progress",
    },
    reason: "Local action start test.",
    created_at: "2026-06-15T00:00:00Z",
  };
}
