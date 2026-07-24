import { describe, expect, it } from "vitest";
import {
  getLeaderProofDecisionReadbackState,
  getLeaderProofDecisionWriteConfig,
  getLeaderProofDecisionWriteReadiness,
  mapLeaderProofDecisionRpcError,
  mapLeaderProofDecisionRpcSuccess,
  parseLeaderProofDecision,
} from "@/services/leader-proof-decision-write";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";

describe("leader proof decision write readiness", () => {
  it("keeps leader proof decision writes disabled by default", () => {
    expect(getLeaderProofDecisionWriteConfig({})).toMatchObject({
      enabled: false,
      environment: "local",
      externalWritesEnabled: false,
      memberNudgesEnabled: false,
      publishesProof: false,
    });
  });

  it("requires a separate production approval before enabling leader decisions", () => {
    expect(
      getLeaderProofDecisionWriteConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
      }),
    ).toMatchObject({
      enabled: false,
      environment: "production",
      reason:
        "Leader proof decisions stay locked until the dedicated write flag is enabled.",
    });

    expect(
      getLeaderProofDecisionWriteConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: false,
      environment: "production",
      isLocalOnly: false,
      reason:
        "Production leader proof decisions require the separate production approval flag.",
    });

    expect(
      getLeaderProofDecisionWriteConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_LEADER_PROOF_DECISION_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      environment: "production",
      isLocalOnly: false,
      externalWritesEnabled: false,
      memberNudgesEnabled: false,
      publishesProof: false,
    });
  });

  it("keeps hosted staging leader decisions closed", () => {
    expect(
      getLeaderProofDecisionWriteConfig({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_LEADER_PROOF_DECISION_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: false,
      environment: "staging",
      isLocalOnly: false,
      reason:
        "Hosted staging leader proof decisions remain disabled until a dedicated staging approval is configured.",
    });
  });

  it("requires local writes and the leader proof decision approval flag", () => {
    expect(
      getLeaderProofDecisionWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Leader proof decision browser-facing writes remain disabled. Set MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE=true only after local auth, RLS, and Goal 115 SQL tests are ready.",
    });

    expect(
      getLeaderProofDecisionWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      externalWritesEnabled: false,
      memberNudgesEnabled: false,
      publishesProof: false,
    });
  });

  it("keeps the write locked without auth-derived actor context", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const readiness = getLeaderProofDecisionWriteReadiness(
      actor,
      makeSubmittedAssignment(),
      makePendingEvidence(),
      makeDecisionInput(),
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE: "true",
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

  it("allows a signed-in local leader to record a UUID proof decision", () => {
    const actor = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getLeaderProofDecisionWriteReadiness(
      actor,
      makeSubmittedAssignment(),
      makePendingEvidence(),
      makeDecisionInput(),
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(true);
    expect(readiness.resultCodeIfSubmitted).toBe("proof_approved");
    expect(readiness.checks.every((check) => check.passed)).toBe(true);
  });

  it("allows an eligible signed-in production leader only after both flags pass", () => {
    const actor = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      "Signed in to production Supabase.",
      "supabase_ready",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getLeaderProofDecisionWriteReadiness(
      actor,
      makeSubmittedAssignment(),
      makePendingEvidence(),
      makeDecisionInput(),
      {
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_LEADER_PROOF_DECISION_WRITE: "true",
      },
    );

    expect(readiness).toMatchObject({
      environment: "production",
      canSubmit: true,
      resultCodeIfSubmitted: "proof_approved",
    });
    expect(readiness.checks.every((check) => check.passed)).toBe(true);
  });

  it("blocks Admin and DS Admin from routine leader proof decisions", () => {
    const env = {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE: "true",
    };

    for (const email of ["admin@mymedlife.test", "ds.admin@mymedlife.test"]) {
      const actor = getMockLocalActorContext(
        email,
        "Signed in locally.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      );

      expect(
        getLeaderProofDecisionWriteReadiness(
          actor,
          makeSubmittedAssignment(),
          makePendingEvidence(),
          makeDecisionInput(),
          env,
        ).resultCodeIfSubmitted,
      ).toBe("permission_denied");
    }
  });

  it("blocks mock IDs, not-ready proof, and short notes", () => {
    const actor = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const env = {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE: "true",
    };

    expect(
      getLeaderProofDecisionWriteReadiness(
        actor,
        {
          ...makeSubmittedAssignment(),
          id: "mock-assignment",
        },
        makePendingEvidence(),
        makeDecisionInput(),
        env,
      ).resultCodeIfSubmitted,
    ).toBe("evidence_not_found");

    expect(
      getLeaderProofDecisionWriteReadiness(
        actor,
        {
          ...makeSubmittedAssignment(),
          status: "in_progress",
        },
        makePendingEvidence(),
        makeDecisionInput(),
        env,
      ).resultCodeIfSubmitted,
    ).toBe("proof_not_submitted");

    expect(
      getLeaderProofDecisionWriteReadiness(
        actor,
        makeSubmittedAssignment(),
        makePendingEvidence(),
        {
          decision: "approve",
          note: "Too short",
        },
        env,
      ).resultCodeIfSubmitted,
    ).toBe("note_too_short");
  });

  it("maps local RPC success and errors into leader result states", () => {
    expect(
      mapLeaderProofDecisionRpcSuccess(
        "00000000-0000-4000-8000-000000000201",
        "approve",
        {
          evidence_item_id: "00000000-0000-4000-8000-000000000201",
          assignment_id: "00000000-0000-4000-8000-000000000101",
          approval_id: "00000000-0000-4000-8000-000000000301",
          points_event_id: "00000000-0000-4000-8000-000000000401",
          kpi_event_id: "00000000-0000-4000-8000-000000000501",
          event_id: "00000000-0000-4000-8000-000000000601",
          integration_event_id: "00000000-0000-4000-8000-000000000701",
          outbox_id: "00000000-0000-4000-8000-000000000801",
          audit_log_id: "00000000-0000-4000-8000-000000000901",
        },
      ),
    ).toMatchObject({
      success: true,
      code: "proof_approved",
      pointsEventId: "00000000-0000-4000-8000-000000000401",
      kpiEventId: "00000000-0000-4000-8000-000000000501",
    });

    expect(
      mapLeaderProofDecisionRpcError("missing", "assignment", {
        code: "P0002",
        message: "evidence item not found",
      }),
    ).toMatchObject({
      success: false,
      code: "evidence_not_found",
    });

    expect(
      mapLeaderProofDecisionRpcError("denied", "assignment", {
        code: "42501",
        message: "actor cannot record leader proof decision",
      }),
    ).toMatchObject({
      success: false,
      code: "permission_denied",
    });

    expect(
      mapLeaderProofDecisionRpcError("not-ready", "assignment", {
        code: "22023",
        message: "proof is not ready for leader decision",
      }),
    ).toMatchObject({
      success: false,
      code: "proof_not_submitted",
    });
  });

  it("confirms local readback for approval, changes-requested, and reject decisions", () => {
    expect(
      getLeaderProofDecisionReadbackState(
        { status: "approved" },
        { status: "approved" },
        "proof_approved",
      ),
    ).toMatchObject({
      confirmsDecision: true,
      tone: "success",
    });

    expect(
      getLeaderProofDecisionReadbackState(
        { status: "changes_requested" },
        { status: "changes_requested" },
        "changes_requested",
      ),
    ).toMatchObject({
      confirmsDecision: true,
      tone: "success",
    });

    expect(
      getLeaderProofDecisionReadbackState(
        { status: "changes_requested" },
        { status: "rejected" },
        "proof_rejected",
      ),
    ).toMatchObject({
      confirmsDecision: true,
      tone: "success",
    });
  });

  it("parses only known leader proof decisions", () => {
    expect(parseLeaderProofDecision("approve")).toBe("approve");
    expect(parseLeaderProofDecision("request_changes")).toBe("request_changes");
    expect(parseLeaderProofDecision("reject")).toBe("reject");
    expect(parseLeaderProofDecision("approved")).toBeNull();
    expect(parseLeaderProofDecision(null)).toBeNull();
  });
});

function makeSubmittedAssignment(): Assignment {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    title: "Submitted proof assignment",
    ownerRole: "General Member",
    lane: "Member",
    dueLabel: "Today",
    status: "submitted",
    evidenceRequired: "Submit proof.",
    instructions: "Submit enough proof for review.",
    points: 15,
    kpi: "students_invited",
  };
}

function makePendingEvidence(): EvidenceItem {
  return {
    id: "00000000-0000-4000-8000-000000000201",
    assignmentId: "00000000-0000-4000-8000-000000000101",
    submittedBy: "Local Member",
    evidenceType: "testimonial_text",
    summary: "This proof is ready for local leader review.",
    status: "pending_review",
  };
}

function makeDecisionInput() {
  return {
    decision: "approve" as const,
    note: "This proof has enough context to count for the action.",
  };
}
