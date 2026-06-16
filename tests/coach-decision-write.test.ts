import { describe, expect, it } from "vitest";
import {
  getCoachDecisionReadbackState,
  getCoachDecisionWriteConfig,
  getCoachDecisionWriteReadiness,
  mapCoachDecisionRpcError,
  mapCoachDecisionRpcSuccess,
  parseCoachDecision,
} from "@/services/coach-decision-write";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("coach decision write readiness", () => {
  it("keeps coach decision writes disabled by default", () => {
    expect(getCoachDecisionWriteConfig({})).toMatchObject({
      enabled: false,
      externalWritesEnabled: false,
      escalationPacketsEnabled: false,
    });
  });

  it("requires local writes and the coach decision approval flag", () => {
    expect(
      getCoachDecisionWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Coach decision browser-facing writes remain disabled. Set MYMEDLIFE_ENABLE_COACH_DECISION_WRITE=true only after local auth and RLS are ready.",
    });

    expect(
      getCoachDecisionWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      externalWritesEnabled: false,
      escalationPacketsEnabled: false,
    });
  });

  it("keeps the write locked without auth-derived actor context", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const readiness = getCoachDecisionWriteReadiness(
      actor,
      makeDecisionInput(),
      makeContext(),
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("missing_auth");
  });

  it("allows a signed-in local coach to log a UUID-backed hold decision", () => {
    const actor = getMockLocalActorContext(
      "coach@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getCoachDecisionWriteReadiness(
      actor,
      makeDecisionInput(),
      makeContext(),
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(true);
    expect(readiness.resultCodeIfSubmitted).toBe("hold_recorded");
    expect(readiness.checks.every((check) => check.passed)).toBe(true);
  });

  it("blocks chapter leaders and DS Admin from coach decision ownership", () => {
    const env = {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
    };

    for (const email of ["leader.a@mymedlife.test", "ds.admin@mymedlife.test"]) {
      const actor = getMockLocalActorContext(
        email,
        "Signed in locally.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      );
      const readiness = getCoachDecisionWriteReadiness(
        actor,
        makeDecisionInput(),
        makeContext(),
        env,
      );

      expect(readiness.canSubmit).toBe(false);
      expect(readiness.resultCodeIfSubmitted).toBe("permission_denied");
    }
  });

  it("requires UUID context, a clear note, and blocker summary for interventions", () => {
    const actor = getMockLocalActorContext(
      "coach@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const env = {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
    };

    expect(
      getCoachDecisionWriteReadiness(
        actor,
        makeDecisionInput(),
        {
          chapterId: "mock-chapter",
          campaignId: "00000000-0000-4000-8000-000000000102",
          phaseId: "00000000-0000-4000-8000-000000000103",
        },
        env,
      ).resultCodeIfSubmitted,
    ).toBe("portfolio_not_assigned");

    expect(
      getCoachDecisionWriteReadiness(
        actor,
        {
          decision: "hold",
          note: "Too short",
        },
        makeContext(),
        env,
      ).resultCodeIfSubmitted,
    ).toBe("note_too_short");

    expect(
      getCoachDecisionWriteReadiness(
        actor,
        {
          decision: "intervene",
          note: "Chapter needs direct support this week.",
        },
        makeContext(),
        env,
      ).resultCodeIfSubmitted,
    ).toBe("blocker_summary_required");
  });

  it("maps local RPC success and errors into coach decision result states", () => {
    expect(
      mapCoachDecisionRpcSuccess("advance", {
        review_id: "00000000-0000-4000-8000-000000000101",
        event_id: "00000000-0000-4000-8000-000000000201",
        integration_event_id: "00000000-0000-4000-8000-000000000301",
        outbox_id: "00000000-0000-4000-8000-000000000401",
        audit_log_id: "00000000-0000-4000-8000-000000000501",
        next_readiness_status: "validated",
        next_coach_validation_status: "validated",
      }),
    ).toMatchObject({
      success: true,
      code: "advance_recorded",
      outboxId: "00000000-0000-4000-8000-000000000401",
    });

    expect(
      mapCoachDecisionRpcError({
        code: "42501",
        message: "actor cannot log coach decision for this chapter",
      }),
    ).toMatchObject({
      success: false,
      code: "permission_denied",
    });

    expect(
      mapCoachDecisionRpcError({
        code: "22023",
        message: "intervene decisions need a blocker summary",
      }),
    ).toMatchObject({
      success: false,
      code: "blocker_summary_required",
    });
  });

  it("confirms local readback for advance, hold, and intervene decisions", () => {
    expect(
      getCoachDecisionReadbackState(
        {
          readiness_status: "validated",
          coach_validation_status: "validated",
        },
        "advance_recorded",
      ),
    ).toMatchObject({
      confirmsDecision: true,
      tone: "success",
    });

    expect(
      getCoachDecisionReadbackState(
        {
          readiness_status: "ready",
          coach_validation_status: "pending",
        },
        "hold_recorded",
      ),
    ).toMatchObject({
      confirmsDecision: true,
      tone: "success",
    });

    expect(
      getCoachDecisionReadbackState(
        {
          readiness_status: "blocked",
          coach_validation_status: "blocked",
        },
        "intervention_recorded",
      ),
    ).toMatchObject({
      confirmsDecision: true,
      tone: "success",
    });
  });

  it("parses only known coach decisions", () => {
    expect(parseCoachDecision("advance")).toBe("advance");
    expect(parseCoachDecision("hold")).toBe("hold");
    expect(parseCoachDecision("intervene")).toBe("intervene");
    expect(parseCoachDecision("escalate")).toBeNull();
    expect(parseCoachDecision(null)).toBeNull();
  });
});

function makeDecisionInput() {
  return {
    decision: "hold",
    note: "Chapter should complete proof follow-up before advancing.",
  } as const;
}

function makeContext() {
  return {
    chapterId: "00000000-0000-4000-8000-000000000101",
    campaignId: "00000000-0000-4000-8000-000000000102",
    phaseId: "00000000-0000-4000-8000-000000000103",
  };
}
