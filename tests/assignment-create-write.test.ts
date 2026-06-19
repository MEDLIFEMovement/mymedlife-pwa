import { describe, expect, it } from "vitest";
import {
  getAssignmentCreateReadbackState,
  getAssignmentCreateWriteConfig,
  getAssignmentCreateWriteReadiness,
  mapAssignmentCreateRpcError,
  mapAssignmentCreateRpcSuccess,
  mapChapterRoleToDatabaseRole,
  parseAssignmentOwnerRole,
} from "@/services/assignment-create-write";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import type { Assignment } from "@/shared/types/domain";

describe("assignment-create write readiness", () => {
  it("keeps assignment creation writes disabled by default", () => {
    expect(getAssignmentCreateWriteConfig({})).toMatchObject({
      enabled: false,
      externalWritesEnabled: false,
      remindersEnabled: false,
    });
  });

  it("requires local writes and the assignment-create approval flag", () => {
    expect(
      getAssignmentCreateWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Assignment-create browser-facing writes remain disabled. Set MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE=true only after local auth and RLS are ready.",
    });

    expect(
      getAssignmentCreateWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      externalWritesEnabled: false,
      remindersEnabled: false,
    });
  });

  it("keeps the write locked without auth-derived actor context", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const readiness = getAssignmentCreateWriteReadiness(
      actor,
      makeAssignmentInput(),
      makeContext(),
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("missing_auth");
    expect(
      readiness.checks.find((check) => check.key === "local_auth_session"),
    ).toMatchObject({
      passed: false,
    });
  });

  it("allows a signed-in local chapter leader to create a UUID-backed assignment", () => {
    const actor = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getAssignmentCreateWriteReadiness(
      actor,
      makeAssignmentInput(),
      makeContext(),
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(true);
    expect(readiness.resultCodeIfSubmitted).toBe("assignment_created");
    expect(readiness.checks.every((check) => check.passed)).toBe(true);
  });

  it("blocks Admin and DS Admin from assignment creation ownership", () => {
    const env = {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
    };

    for (const email of ["admin@mymedlife.test", "ds.admin@mymedlife.test"]) {
      const actor = getMockLocalActorContext(
        email,
        "Signed in locally.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      );
      const readiness = getAssignmentCreateWriteReadiness(
        actor,
        makeAssignmentInput(),
        makeContext(),
        env,
      );

      expect(readiness.canSubmit).toBe(false);
      expect(readiness.resultCodeIfSubmitted).toBe("permission_denied");
    }
  });

  it("blocks mock chapter/campaign ids and invalid assignment inputs", () => {
    const actor = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const env = {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
    };

    expect(
      getAssignmentCreateWriteReadiness(
        actor,
        makeAssignmentInput(),
        {
          chapterId: "mock-chapter",
          campaignId: "00000000-0000-4000-8000-000000000102",
        },
        env,
      ).resultCodeIfSubmitted,
    ).toBe("server_error");

    expect(
      getAssignmentCreateWriteReadiness(
        actor,
        {
          ...makeAssignmentInput(),
          title: "Bad",
        },
        makeContext(),
        env,
      ).resultCodeIfSubmitted,
    ).toBe("title_too_short");

    expect(
      getAssignmentCreateWriteReadiness(
        actor,
        {
          ...makeAssignmentInput(),
          points: 2000,
        },
        makeContext(),
        env,
      ).resultCodeIfSubmitted,
    ).toBe("invalid_points");
  });

  it("blocks duplicate assignment titles before local write readiness", () => {
    const actor = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getAssignmentCreateWriteReadiness(
      actor,
      makeAssignmentInput(),
      {
        ...makeContext(),
        existingAssignments: [makeExistingAssignment("Assign a tabling owner")],
      },
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("duplicate_assignment");
  });

  it("maps chapter roles to database role keys", () => {
    expect(mapChapterRoleToDatabaseRole("General Member")).toBe("general_member");
    expect(mapChapterRoleToDatabaseRole("Action Committee Member")).toBe(
      "action_committee_member",
    );
    expect(mapChapterRoleToDatabaseRole("Chapter President / Vice President")).toBe(
      "president_vp",
    );
  });

  it("maps local RPC success and errors into assignment result states", () => {
    expect(
      mapAssignmentCreateRpcSuccess({
        assignment_id: "00000000-0000-4000-8000-000000000101",
        event_id: "00000000-0000-4000-8000-000000000201",
        integration_event_id: "00000000-0000-4000-8000-000000000301",
        outbox_id: "00000000-0000-4000-8000-000000000401",
        audit_log_id: "00000000-0000-4000-8000-000000000501",
      }),
    ).toMatchObject({
      success: true,
      code: "assignment_created",
      outboxId: "00000000-0000-4000-8000-000000000401",
    });

    expect(
      mapAssignmentCreateRpcError({
        code: "42501",
        message: "actor cannot create assignments for this chapter",
      }),
    ).toMatchObject({
      success: false,
      code: "permission_denied",
    });

    expect(
      mapAssignmentCreateRpcError({
        code: "22023",
        message: "assignment points must be between 0 and 1000",
      }),
    ).toMatchObject({
      success: false,
      code: "invalid_points",
    });

    expect(
      mapAssignmentCreateRpcError({
        code: "23505",
        message: "duplicate assignment title exists for this chapter campaign",
      }),
    ).toMatchObject({
      success: false,
      code: "duplicate_assignment",
    });
  });

  it("confirms local readback when the created assignment appears", () => {
    expect(
      getAssignmentCreateReadbackState(
        [makeExistingAssignment("Assign a tabling owner")],
        "assignment_created",
        "Assign a tabling owner",
      ),
    ).toMatchObject({
      confirmsCreated: true,
      tone: "success",
    });
  });

  it("parses only known owner roles", () => {
    expect(parseAssignmentOwnerRole("Action Committee Member")).toBe(
      "Action Committee Member",
    );
    expect(parseAssignmentOwnerRole("Unapproved Role")).toBeNull();
    expect(parseAssignmentOwnerRole(null)).toBeNull();
  });
});

function makeAssignmentInput() {
  return {
    title: "Assign a tabling owner",
    instructions: "Ask one student to own the next Rush Month tabling event.",
    ownerRole: "Action Committee Member",
    dueLabel: "Friday",
    evidenceRequired: "Owner name, event link, and proof collection plan.",
    points: 15,
    kpi: "rush_month_event_owner_assigned",
  } as const;
}

function makeContext() {
  return {
    chapterId: "00000000-0000-4000-8000-000000000101",
    campaignId: "00000000-0000-4000-8000-000000000102",
    existingAssignments: [],
  };
}

function makeExistingAssignment(title: string): Assignment {
  return {
    id: "00000000-0000-4000-8000-000000000201",
    title,
    ownerRole: "Action Committee Member",
    lane: "Member",
    dueLabel: "Friday",
    status: "not_started",
    evidenceRequired: "Owner name, event link, and proof collection plan.",
    instructions: "Ask one student to own the next Rush Month tabling event.",
    points: 15,
    kpi: "rush_month_event_owner_assigned",
  };
}
