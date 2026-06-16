import { describe, expect, it } from "vitest";
import { getFirstWriteActivationDrill } from "@/services/first-write-activation-drill";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

const mockData = getMockReadOnlyAppData("Testing first-write activation drill.");

describe("first-write activation drill", () => {
  it("shows admin the first-write drill while blocked in mock fallback data", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const drill = getFirstWriteActivationDrill(actor, mockData, {});

    expect(drill.canReadDrill).toBe(true);
    expect(drill.title).toBe("Admin first-write activation drill");
    expect(drill.status).toBe("blocked_until_local_supabase");
    expect(drill.counts.browserWritesExpected).toBe(0);
    expect(drill.counts.externalWritesExpected).toBe(0);
    expect(
      drill.checks.find((check) => check.key === "candidate_assignment_uuid")
        ?.passed,
    ).toBe(false);
  });

  it("marks the drill ready only with local Supabase data, auth mode, flags, and UUID assignment", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const data = withSupabaseUuidAssignment(mockData);
    const drill = getFirstWriteActivationDrill(actor, data, {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
    });

    expect(drill.status).toBe("ready_for_local_action_start");
    expect(drill.counts.browserWritesExpected).toBe(1);
    expect(drill.counts.externalWritesExpected).toBe(0);
    expect(drill.checks.every((check) => check.passed)).toBe(true);
    expect(
      drill.readbackEvidence.find((item) => item.key === "internal_event")?.status,
    ).toBe("missing");
    expect(drill.candidateAssignment?.route).toBe(
      "/rush-month/actions/00000000-0000-4000-8000-000000000101",
    );
  });

  it("keeps local Supabase UUID data blocked until write flags are explicitly enabled", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const drill = getFirstWriteActivationDrill(
      actor,
      withSupabaseUuidAssignment(mockData),
      {
        MYMEDLIFE_AUTH_MODE: "local_supabase",
      },
    );

    expect(drill.status).toBe("blocked_until_flags");
    expect(
      drill.checks.find((check) => check.key === "local_write_flag")?.passed,
    ).toBe(false);
    expect(
      drill.checks.find((check) => check.key === "action_start_flag")?.passed,
    ).toBe(false);
  });

  it("names the local action-start sequence and proof expected from staff", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const drill = getFirstWriteActivationDrill(actor, mockData, {});

    expect(drill.steps.map((step) => step.key)).toEqual([
      "setup_local_stack",
      "sign_in_member",
      "enable_narrow_flags",
      "start_assignment",
      "verify_audit",
    ]);
    expect(
      drill.steps.find((step) => step.key === "start_assignment")
        ?.structuredEvents,
    ).toContain("action_started");
    expect(drill.proofToCollect.join(" ")).toContain("audit log");
    expect(drill.proofToCollect.join(" ")).toContain("external writes stayed at zero");
  });

  it("shows observed readback evidence after the local action-start records exist", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const drill = getFirstWriteActivationDrill(
      actor,
      withFirstWriteReadback(withSupabaseUuidAssignment(mockData)),
      {
        MYMEDLIFE_AUTH_MODE: "local_supabase",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
      },
    );

    expect(drill.candidateAssignment?.status).toBe("in_progress");
    expect(drill.status).toBe("blocked_until_auth");
    expect(Object.fromEntries(
      drill.readbackEvidence.map((item) => [item.key, item.status]),
    )).toEqual({
      assignment_status: "observed",
      internal_event: "observed",
      integration_event: "observed",
      audit_log: "observed",
      automation_outbox: "safe_zero",
    });
    expect(drill.counts.observedReadbackItems).toBe(5);
    expect(drill.counts.externalWritesExpected).toBe(0);
  });

  it("keeps DS Admin eligible and operating roles hidden", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getFirstWriteActivationDrill(dsAdmin, mockData).canReadDrill).toBe(true);
    expect(getFirstWriteActivationDrill(dsAdmin, mockData).title).toBe(
      "DS Admin first-write safety drill",
    );
    expect(getFirstWriteActivationDrill(member, mockData).canReadDrill).toBe(false);
    expect(getFirstWriteActivationDrill(leader, mockData).canReadDrill).toBe(false);
    expect(getFirstWriteActivationDrill(coach, mockData).canReadDrill).toBe(false);
  });
});

function withSupabaseUuidAssignment(data: ReadOnlyAppData): ReadOnlyAppData {
  return {
    ...data,
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "Testing local Supabase data.",
    },
    assignments: [
      {
        ...data.assignments[0],
        id: "00000000-0000-4000-8000-000000000101",
        status: "not_started",
        lane: "Member",
      },
      ...data.assignments.slice(1),
    ],
  };
}

function withFirstWriteReadback(data: ReadOnlyAppData): ReadOnlyAppData {
  const assignmentId = "00000000-0000-4000-8000-000000000101";
  const eventId = "00000000-0000-4000-8000-000000000201";
  const integrationEventId = "00000000-0000-4000-8000-000000000301";

  return {
    ...data,
    assignments: data.assignments.map((assignment) => {
      if (assignment.id !== assignmentId) {
        return assignment;
      }

      return {
        ...assignment,
        status: "in_progress",
      };
    }),
    eventRows: [
      {
        id: eventId,
        event_type: "action_started",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: assignmentId,
        chapter_event_id: null,
        payload: {
          source: "app.start_assignment_action",
        },
        correlation_id: "action_started:test",
        occurred_at: "2026-06-16T19:00:00Z",
        created_at: "2026-06-16T19:00:00Z",
      },
    ],
    integrationEventRows: [
      {
        id: integrationEventId,
        source_event_id: eventId,
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "action_started",
        destination: "internal",
        external_object_type: "assignment",
        external_object_id: assignmentId,
        status: "recorded",
        payload: {
          liveExternalWrite: false,
        },
        created_by: "00000000-0000-4000-8000-000000000001",
        created_at: "2026-06-16T19:00:00Z",
        updated_at: "2026-06-16T19:00:00Z",
      },
    ],
    automationOutboxRows: [],
    auditLogs: [
      {
        id: "00000000-0000-4000-8000-000000000401",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        action: "action_started",
        target_table: "assignments",
        target_id: assignmentId,
        before_value: {
          status: "not_started",
        },
        after_value: {
          status: "in_progress",
          eventId,
          integrationEventId,
        },
        reason: "Local action start test.",
        created_at: "2026-06-16T19:00:00Z",
      },
    ],
  };
}
