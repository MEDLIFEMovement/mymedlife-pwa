import { describe, expect, it } from "vitest";
import type { createSupabaseAppClient } from "@/lib/supabase-app-client";
import { getAdminSystemHealthReview } from "@/services/admin-system-health-review";
import { getAdminSystemHealthReviewDurable } from "@/services/admin-system-health-review";
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
      localReady: 3,
      mockSafe: 2,
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
    expect(review.packetSources.production.mode).toBe("env");
    expect(review.packetSources.pilot.mode).toBe("env");
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

  it("moves auth and ops checks into review state when production packet values are recorded", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const review = getAdminSystemHealthReview(
      actor,
      getMockReadOnlyAppData("Recorded production packet context."),
      {
        MYMEDLIFE_DATA_SOURCE: "mock",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS: "false",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "false",
        MYMEDLIFE_ALLOW_PROOF_UPLOADS: "false",
        MYMEDLIFE_PRODUCTION_AUTH_CALLBACK_URL:
          "https://www.mymedlife.org/auth/callback",
        MYMEDLIFE_STAGING_AUTH_CALLBACK_URL:
          "https://staging.mymedlife.org/auth/callback",
        MYMEDLIFE_PRODUCTION_BACKUP_OWNER: "DS on-call",
        MYMEDLIFE_PRODUCTION_RESTORE_PATH:
          "Supabase PITR plus manual app repair runbook",
        MYMEDLIFE_PILOT_SUPPORT_OWNER: "Maya Support",
        MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL: "#mymedlife-pilot-support",
        MYMEDLIFE_PILOT_ROLLBACK_OWNER: "Nick Ellis",
      },
    );

    expect(
      review.checks.find((check) => check.key === "production_auth"),
    ).toEqual(
      expect.objectContaining({
        status: "needs_review",
        signal: expect.stringContaining("Recorded callback plan exists"),
      }),
    );
    expect(
      review.checks.find((check) => check.key === "monitoring_backup"),
    ).toEqual(
      expect.objectContaining({
        status: "needs_review",
        signal: expect.stringContaining("Recorded production-ops packet values now exist"),
      }),
    );
    expect(review.counts).toEqual({
      total: 9,
      localReady: 3,
      mockSafe: 2,
      needsReview: 2,
      blockedBeforeLive: 2,
    });
  });

  it("reads recorded production packet values from process env by default", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const originalProdCallback = process.env.MYMEDLIFE_PRODUCTION_AUTH_CALLBACK_URL;
    const originalStagingCallback = process.env.MYMEDLIFE_STAGING_AUTH_CALLBACK_URL;

    process.env.MYMEDLIFE_PRODUCTION_AUTH_CALLBACK_URL =
      "https://www.mymedlife.org/auth/callback";
    process.env.MYMEDLIFE_STAGING_AUTH_CALLBACK_URL =
      "https://staging.mymedlife.org/auth/callback";

    try {
      const review = getAdminSystemHealthReview(
        actor,
        getMockReadOnlyAppData("Default env packet read."),
      );

      expect(
        review.checks.find((check) => check.key === "production_auth"),
      ).toEqual(
        expect.objectContaining({
          status: "needs_review",
          signal: expect.stringContaining("Recorded callback plan exists"),
        }),
      );
    } finally {
      restoreEnv("MYMEDLIFE_PRODUCTION_AUTH_CALLBACK_URL", originalProdCallback);
      restoreEnv("MYMEDLIFE_STAGING_AUTH_CALLBACK_URL", originalStagingCallback);
    }
  });

  it("keeps placeholder owner values blocked until concrete pilot owners are recorded", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const review = getAdminSystemHealthReview(
      actor,
      getMockReadOnlyAppData("Placeholder packet context."),
      {
        MYMEDLIFE_PRODUCTION_BACKUP_OWNER: "DS on-call",
        MYMEDLIFE_PRODUCTION_RESTORE_PATH:
          "Supabase PITR plus manual app repair runbook",
        MYMEDLIFE_PILOT_SUPPORT_OWNER: "pending HQ ops",
        MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL: "TBD support channel",
        MYMEDLIFE_PILOT_ROLLBACK_OWNER: "not yet assigned",
      },
    );

    expect(
      review.checks.find((check) => check.key === "monitoring_backup"),
    ).toEqual(
      expect.objectContaining({
        status: "needs_review",
        signal: expect.stringContaining("support owner pending HQ ops"),
      }),
    );
  });

  it("prefers durable production and pilot packet rows when Supabase review records exist", async () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const review = await getAdminSystemHealthReviewDurable(
      actor,
      getMockReadOnlyAppData("Durable system health packet context."),
      {},
      {
        createClient: (async () => ({
          persistence: {
            mode: "supabase",
            status: "ready",
            reason: "test",
            isLocalOnly: false,
          },
          client: {
            persistence: {
              mode: "supabase",
              status: "ready",
              reason: "test",
              isLocalOnly: false,
            },
            selectRows: async <TRow>(
              _table,
              options,
            ) => {
              const rows = [
                {
                  id: "pilot-row-1",
                  category: "pilot_scope" as const,
                  record_key: "MYMEDLIFE_PILOT_SUPPORT_OWNER",
                  value: "Maya Support",
                  reason: "Named support owner.",
                  actor_role: "admin" as const,
                  updated_by: "user-1",
                  updated_at: "2026-06-29T22:00:00.000Z",
                },
                {
                  id: "pilot-row-2",
                  category: "pilot_scope" as const,
                  record_key: "MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL",
                  value: "#mymedlife-pilot-support",
                  reason: "Named support channel.",
                  actor_role: "admin" as const,
                  updated_by: "user-1",
                  updated_at: "2026-06-29T22:01:00.000Z",
                },
                {
                  id: "pilot-row-3",
                  category: "pilot_scope" as const,
                  record_key: "MYMEDLIFE_PILOT_ROLLBACK_OWNER",
                  value: "Nick Ellis",
                  reason: "Named rollback owner.",
                  actor_role: "admin" as const,
                  updated_by: "user-1",
                  updated_at: "2026-06-29T22:02:00.000Z",
                },
                {
                  id: "production-row-1",
                  category: "production_launch" as const,
                  record_key: "MYMEDLIFE_PRODUCTION_AUTH_CALLBACK_URL",
                  value: "https://www.mymedlife.org/auth/callback",
                  reason: "Recorded production callback.",
                  actor_role: "admin" as const,
                  updated_by: "user-2",
                  updated_at: "2026-06-29T23:00:00.000Z",
                },
                {
                  id: "production-row-2",
                  category: "production_launch" as const,
                  record_key: "MYMEDLIFE_STAGING_AUTH_CALLBACK_URL",
                  value: "https://staging.mymedlife.org/auth/callback",
                  reason: "Recorded staging callback.",
                  actor_role: "admin" as const,
                  updated_by: "user-2",
                  updated_at: "2026-06-29T23:01:00.000Z",
                },
              ];
              const categoryFilter = options?.query?.category;
              const filteredRows = categoryFilter?.startsWith("eq.")
                ? rows.filter((row) => row.category === categoryFilter.slice(3))
                : rows;
              const sortedRows =
                options?.order?.column === "updated_at" &&
                options.order.ascending === false
                  ? [...filteredRows].sort((left, right) =>
                      right.updated_at.localeCompare(left.updated_at),
                    )
                  : filteredRows;

              return sortedRows as TRow[];
            },
            rpc: async <TResult>() => [] as TResult,
            insertRows: async <TRow>() => [] as TRow[],
            upsertRows: async <TRow>() => [] as TRow[],
            updateRows: async <TRow>() => [] as TRow[],
          },
        })) as unknown as typeof createSupabaseAppClient,
      },
    );

    expect(review.packetSources.production.mode).toBe("supabase");
    expect(review.packetSources.production.recordCount).toBe(2);
    expect(review.packetSources.pilot.mode).toBe("supabase");
    expect(review.packetSources.pilot.recordCount).toBe(3);
    expect(
      review.checks.find((check) => check.key === "production_auth"),
    ).toEqual(
      expect.objectContaining({
        status: "needs_review",
        signal: expect.stringContaining("Recorded callback plan exists"),
      }),
    );
    expect(
      review.checks.find((check) => check.key === "monitoring_backup")?.signal,
    ).toContain("support owner Maya Support");
  });

  it("hides system health from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const data = getMockReadOnlyAppData("Hidden role health.");

    expect(getAdminSystemHealthReview(member, data).canReadReview).toBe(false);
    expect(getAdminSystemHealthReview(committeeMember, data).canReadReview).toBe(false);
    expect(getAdminSystemHealthReview(committeeChair, data).canReadReview).toBe(false);
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

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
