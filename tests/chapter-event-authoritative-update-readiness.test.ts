import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getChapterEventAuthoritativeUpdateReadiness,
  getChapterEventAuthoritativeUpdateWriteConfig,
  type ChapterEventAuthoritativeUpdateInput,
} from "@/services/chapter-event-authoritative-update-readiness";

const validInput = {
  chapterEventId: "70000000-0000-4000-8000-000000000021",
  patch: {
    status: "scheduled",
    attendance_count: 18,
  },
  auditReason: "Correct local event status and attendance after chapter review.",
} satisfies ChapterEventAuthoritativeUpdateInput;

describe("chapter-event authoritative update readiness", () => {
  it("keeps the future server boundary disabled by default", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const readiness = getChapterEventAuthoritativeUpdateReadiness(actor, validInput);

    expect(readiness.title).toBe(
      "Chapter-event authoritative update server boundary readiness",
    );
    expect(readiness.operation).toBe("chapter_event_authoritative_update");
    expect(readiness.futureFunction).toBe(
      "app.update_chapter_event_authoritative_fields",
    );
    expect(readiness.futureServerAction).toBe(
      "updateChapterEventAuthoritativeFields",
    );
    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("write_disabled");
    expect(readiness.config).toEqual(
      expect.objectContaining({
        enabled: false,
        isLocalOnly: true,
        externalWritesEnabled: false,
        browserControlsEnabled: false,
      }),
    );
    expect(readiness.allowedFields).toEqual(
      expect.arrayContaining([
        "status",
        "starts_at",
        "ends_at",
        "attendance_count",
        "eligible_member_count",
        "attendance_rate",
        "nps_score",
      ]),
    );
    expect(readiness.futureTables).toEqual([
      "chapter_events",
      "events",
      "audit_logs",
    ]);
    expect(readiness.requiredDatabaseProof).toEqual(
      expect.arrayContaining([
        "direct_owner_and_leader_updates_are_blocked_without_helper",
        "leader_can_update_authoritative_subset_through_helper",
        "helper_records_internal_event_and_audit_log_only",
      ]),
    );
  });

  it("stays not-ready even when the local prerequisites are otherwise satisfied", () => {
    const actor = {
      ...getMockLocalActorContext("leader.a@mymedlife.test"),
      identitySource: "local_auth_session" as const,
      authSessionStatus: "signed_in" as const,
    };
    const env = {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE: "true",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
    } satisfies Record<string, string>;

    expect(getChapterEventAuthoritativeUpdateWriteConfig(env)).toEqual(
      expect.objectContaining({
        enabled: true,
        isLocalOnly: true,
        isHostedStaging: false,
      }),
    );

    const readiness = getChapterEventAuthoritativeUpdateReadiness(
      actor,
      validInput,
      env,
    );

    expect(readiness.canSubmit).toBe(true);
    expect(readiness.resultCodeIfSubmitted).toBe("chapter_event_updated");
    expect(readiness.reason).toContain("reviewed server-only localhost boundary");
    expect(
      readiness.checks.find((check) => check.key === "database_function_ready"),
    ).toEqual(expect.objectContaining({ passed: true }));
    expect(readiness.checks.find((check) => check.key === "rls_tests_ready")).toEqual(
      expect.objectContaining({ passed: true }),
    );
    expect(
      readiness.checks.find((check) => check.key === "local_auth_session"),
    ).toEqual(expect.objectContaining({ passed: true }));
    expect(
      readiness.checks.find((check) => check.key === "implemented_field_subset_only"),
    ).toEqual(expect.objectContaining({ passed: true }));
    expect(
      readiness.checks.find((check) => check.key === "server_boundary_implemented"),
    ).toEqual(expect.objectContaining({ passed: true }));
  });

  it("rejects deferred and narrative fields from the future authoritative payload", () => {
    const actor = {
      ...getMockLocalActorContext("leader.a@mymedlife.test"),
      identitySource: "local_auth_session" as const,
      authSessionStatus: "signed_in" as const,
    };
    const readiness = getChapterEventAuthoritativeUpdateReadiness(
      actor,
      {
        ...validInput,
        patch: {
          title: "Test Event Title",
          feedback_summary: "Looks great",
        },
      },
      {
        MYMEDLIFE_AUTH_MODE: "local_supabase",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE: "true",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
      },
    );

    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("field_subset_invalid");
    expect(
      readiness.checks.find((check) => check.key === "implemented_field_subset_only"),
    ).toEqual(expect.objectContaining({ passed: false }));
  });

  it("blocks actors outside the leader and admin authority set", () => {
    const actor = {
      ...getMockLocalActorContext("coach@mymedlife.test"),
      identitySource: "local_auth_session" as const,
      authSessionStatus: "signed_in" as const,
    };
    const readiness = getChapterEventAuthoritativeUpdateReadiness(
      actor,
      validInput,
      {
        MYMEDLIFE_AUTH_MODE: "local_supabase",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE: "true",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
      },
    );

    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("permission_denied");
    expect(readiness.checks.find((check) => check.key === "actor_allowed")).toEqual(
      expect.objectContaining({ passed: false }),
    );
  });

  it("keeps hosted staging disabled even if someone flips the future write flag", () => {
    const actor = {
      ...getMockLocalActorContext("admin@mymedlife.test"),
      identitySource: "local_auth_session" as const,
      authSessionStatus: "signed_in" as const,
      isLocalOnly: false,
    };
    const readiness = getChapterEventAuthoritativeUpdateReadiness(
      actor,
      validInput,
      {
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "staging-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
        MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("write_disabled");
    expect(readiness.config).toEqual(
      expect.objectContaining({
        enabled: false,
        isHostedStaging: true,
      }),
    );
    expect(readiness.reason).toContain("write and upload flags are off");
  });
});
