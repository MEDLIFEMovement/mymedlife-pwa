import { describe, expect, it } from "vitest";
import {
  getActionStartAlreadyStartedServerResult,
  getActionStartReadbackState,
  getActionStartStaleServerResult,
  getActionStartWriteConfig,
  getActionStartWriteReadiness,
  isActionStartableStatus,
  isUuid,
  mapActionStartRpcError,
  mapActionStartRpcSuccess,
  parseActionStartStatus,
} from "@/services/action-start-write";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import type { Assignment } from "@/shared/types/domain";

describe("action-start write readiness", () => {
  it("keeps action-start writes disabled by default", () => {
    expect(getActionStartWriteConfig({})).toMatchObject({
      enabled: false,
      externalWritesEnabled: false,
    });
  });

  it("requires both local write and action-start approval flags", () => {
    expect(
      getActionStartWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Action-start browser-facing writes remain disabled. Turn on the Action started write control only after local auth and RLS are ready.",
    });

    expect(
      getActionStartWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      externalWritesEnabled: false,
    });
  });

  it("supports an explicitly approved staging action-start gate without enabling external sends", () => {
    const config = getActionStartWriteConfig({
      MYMEDLIFE_AUTH_MODE: "staging_supabase",
      MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE: "true",
    });

    expect(config).toMatchObject({
      enabled: true,
      isLocalOnly: false,
      externalWritesEnabled: false,
    });

    const readiness = getActionStartWriteReadiness(
      getMockLocalActorContext(
        "member.a@mymedlife.test",
        "Signed in through the approved staging lane.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
      makeStartableAssignment(),
      {
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE: "true",
      },
    );

    expect(
      readiness.checks.find((check) => check.key === "local_auth_session")?.label,
    ).toBe("Signed-in staging Supabase Auth session inside the approved staging access path");
  });

  it("keeps the write locked without auth-derived actor context", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const readiness = getActionStartWriteReadiness(actor, makeStartableAssignment(), {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
    });

    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("missing_auth");
    expect(
      readiness.checks.find((check) => check.key === "local_auth_session"),
    ).toMatchObject({
      passed: false,
    });
  });

  it("allows a signed-in local member to start a UUID assignment", () => {
    const actor = getMockLocalActorContext(
      "member.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getActionStartWriteReadiness(actor, makeStartableAssignment(), {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
    });

    expect(readiness.canSubmit).toBe(true);
    expect(readiness.resultCodeIfSubmitted).toBe("started");
    expect(readiness.checks.every((check) => check.passed)).toBe(true);
  });

  it("allows a changes-requested assignment to be restarted", () => {
    const actor = getMockLocalActorContext(
      "member.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getActionStartWriteReadiness(
      {
        ...actor,
      },
      {
        ...makeStartableAssignment(),
        status: "changes_requested",
      },
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(true);
    expect(readiness.resultCodeIfSubmitted).toBe("started");
  });

  it("blocks mock assignment IDs before calling Supabase", () => {
    const actor = getMockLocalActorContext(
      "member.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getActionStartWriteReadiness(
      actor,
      {
        ...makeStartableAssignment(),
        id: "member-push",
      },
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("assignment_not_found");
  });

  it("maps local RPC success and errors into result states", () => {
    expect(
      mapActionStartRpcSuccess("00000000-0000-4000-8000-000000000101", {
        assignment_id: "00000000-0000-4000-8000-000000000101",
        previous_status: "not_started",
        next_status: "in_progress",
        event_id: "00000000-0000-4000-8000-000000000201",
        integration_event_id: "00000000-0000-4000-8000-000000000301",
        audit_log_id: "00000000-0000-4000-8000-000000000401",
      }),
    ).toMatchObject({
      success: true,
      code: "started",
      eventId: "00000000-0000-4000-8000-000000000201",
    });

    expect(
      mapActionStartRpcError("missing", {
        code: "P0002",
        message: "assignment not found",
      }),
    ).toMatchObject({
      success: false,
      code: "assignment_not_found",
    });

    expect(
      mapActionStartRpcError("denied", {
        code: "42501",
        message: "actor cannot start this assignment",
      }),
    ).toMatchObject({
      success: false,
      code: "permission_denied",
    });

    expect(
      mapActionStartRpcError("stale", {
        message: "assignment changed since page load",
      }),
    ).toMatchObject({
      success: false,
      code: "stale_assignment",
    });
  });

  it("returns dedicated already-started and stale server results", () => {
    expect(getActionStartAlreadyStartedServerResult("assignment-1")).toMatchObject({
      success: false,
      code: "already_started",
    });

    expect(
      getActionStartStaleServerResult("assignment-2", "submitted"),
    ).toMatchObject({
      success: false,
      code: "stale_assignment",
      plainEnglishMessage: expect.stringContaining("submitted"),
    });
  });

  it("validates UUID shape", () => {
    expect(isUuid("00000000-0000-4000-8000-000000000101")).toBe(true);
    expect(isUuid("member-push")).toBe(false);
  });

  it("parses assignment statuses and startable states", () => {
    expect(parseActionStartStatus("changes_requested")).toBe("changes_requested");
    expect(parseActionStartStatus("unknown")).toBeNull();
    expect(isActionStartableStatus("not_started")).toBe(true);
    expect(isActionStartableStatus("changes_requested")).toBe(true);
    expect(isActionStartableStatus("submitted")).toBe(false);
  });

  it("confirms local readback when the refreshed assignment is in progress", () => {
    expect(
      getActionStartReadbackState(
        {
          status: "in_progress",
        },
        "started",
      ),
    ).toMatchObject({
      confirmsStarted: true,
      tone: "success",
    });
  });

  it("warns when a successful start result has not refreshed to in progress", () => {
    expect(
      getActionStartReadbackState(
        {
          status: "not_started",
        },
        "started",
      ),
    ).toMatchObject({
      confirmsStarted: false,
      tone: "warning",
    });
  });

  it("does not expect readback changes for blocked results", () => {
    expect(
      getActionStartReadbackState(
        {
          status: "not_started",
        },
        "write_disabled",
      ),
    ).toMatchObject({
      confirmsStarted: false,
      tone: "info",
    });
  });
});

function makeStartableAssignment(): Assignment {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    title: "Start a local invite push",
    ownerRole: "General Member",
    lane: "Member",
    dueLabel: "Today",
    status: "not_started",
    evidenceRequired: "Invite list or message screenshot.",
    instructions: "Invite three students to the Rush Month event.",
    points: 10,
    kpi: "student_invites_sent",
  };
}
