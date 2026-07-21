import { describe, expect, it } from "vitest";
import {
  getHqProofDecisionReadbackState,
  getHqProofDecisionWriteConfig,
  getHqProofDecisionWriteReadiness,
  mapHqDecisionToDatabaseDecision,
  mapHqProofDecisionRpcError,
  mapHqProofDecisionRpcSuccess,
  parseHqProofDecision,
} from "@/services/hq-proof-decision-write";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import type { EvidenceItem } from "@/shared/types/domain";

describe("HQ proof decision write readiness", () => {
  it("keeps HQ decision writes disabled by default", () => {
    expect(getHqProofDecisionWriteConfig({})).toMatchObject({
      enabled: false,
      externalWritesEnabled: false,
      publishesProof: false,
    });
  });

  it("requires local writes and the HQ decision approval flag", () => {
    expect(
      getHqProofDecisionWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "HQ proof decision browser-facing writes remain disabled. Set MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE=true only after local auth and RLS are ready.",
    });

    expect(
      getHqProofDecisionWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      externalWritesEnabled: false,
      publishesProof: false,
    });
  });

  it("requires a separate production approval before enabling HQ decisions", () => {
    expect(
      getHqProofDecisionWriteConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: false,
      environment: "production",
      isLocalOnly: false,
      reason:
        "Production HQ proof decisions require the separate production approval flag.",
    });

    expect(
      getHqProofDecisionWriteConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_HQ_PROOF_DECISION_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      environment: "production",
      isLocalOnly: false,
      externalWritesEnabled: false,
      publishesProof: false,
    });
  });

  it("keeps the write locked without auth-derived actor context", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const readiness = getHqProofDecisionWriteReadiness(
      actor,
      makePendingEvidence(),
      makeDecisionInput(),
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
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

  it("allows a signed-in local admin to record a UUID proof decision", () => {
    const actor = getMockLocalActorContext(
      "admin@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getHqProofDecisionWriteReadiness(
      actor,
      makePendingEvidence(),
      makeDecisionInput(),
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(true);
    expect(readiness.resultCodeIfSubmitted).toBe("sharing_approved");
    expect(readiness.checks.every((check) => check.passed)).toBe(true);
  });

  it("allows a signed-in production admin only after both production flags pass", () => {
    const actor = getMockLocalActorContext(
      "admin@mymedlife.test",
      "Signed in to production Supabase.",
      "supabase_ready",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getHqProofDecisionWriteReadiness(
      actor,
      makePendingEvidence(),
      makeDecisionInput(),
      {
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_HQ_PROOF_DECISION_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(true);
    expect(readiness.resultCodeIfSubmitted).toBe("sharing_approved");
    expect(readiness.checks.every((check) => check.passed)).toBe(true);
  });

  it("blocks chapter leaders from HQ decision writes", () => {
    const actor = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getHqProofDecisionWriteReadiness(
      actor,
      makePendingEvidence(),
      makeDecisionInput(),
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("permission_denied");
  });

  it("blocks mock evidence ids, final proof, and short notes", () => {
    const actor = getMockLocalActorContext(
      "admin@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const env = {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
    };

    expect(
      getHqProofDecisionWriteReadiness(
        actor,
        {
          ...makePendingEvidence(),
          id: "mock-evidence",
        },
        makeDecisionInput(),
        env,
      ).resultCodeIfSubmitted,
    ).toBe("evidence_not_found");

    expect(
      getHqProofDecisionWriteReadiness(
        actor,
        {
          ...makePendingEvidence(),
          status: "approved",
        },
        makeDecisionInput(),
        env,
      ).resultCodeIfSubmitted,
    ).toBe("already_decided");

    expect(
      getHqProofDecisionWriteReadiness(
        actor,
        makePendingEvidence(),
        {
          decision: "approved",
          note: "Too short",
        },
        env,
      ).resultCodeIfSubmitted,
    ).toBe("note_too_short");
  });

  it("maps UI decisions to database decisions", () => {
    expect(mapHqDecisionToDatabaseDecision("approved")).toBe("approved_for_sharing");
    expect(mapHqDecisionToDatabaseDecision("changes_requested")).toBe(
      "changes_requested",
    );
    expect(mapHqDecisionToDatabaseDecision("rejected")).toBe("not_shared");
  });

  it("maps RPC success and errors into HQ decision result states", () => {
    expect(
      mapHqProofDecisionRpcSuccess(
        "00000000-0000-4000-8000-000000000101",
        "approved",
        {
          evidence_item_id: "00000000-0000-4000-8000-000000000101",
          approval_id: "00000000-0000-4000-8000-000000000201",
          event_id: "00000000-0000-4000-8000-000000000301",
          integration_event_id: "00000000-0000-4000-8000-000000000401",
          outbox_id: "00000000-0000-4000-8000-000000000501",
          audit_log_id: "00000000-0000-4000-8000-000000000601",
        },
      ),
    ).toMatchObject({
      success: true,
      code: "sharing_approved",
      approvalId: "00000000-0000-4000-8000-000000000201",
      outboxId: "00000000-0000-4000-8000-000000000501",
      plainEnglishMessage: expect.stringContaining(
        "approved for the authenticated member story feed",
      ),
    });

    expect(
      mapHqProofDecisionRpcError("missing", {
        code: "P0002",
        message: "evidence item not found",
      }),
    ).toMatchObject({
      success: false,
      code: "evidence_not_found",
    });

    expect(
      mapHqProofDecisionRpcError("denied", {
        code: "42501",
        message: "actor cannot record HQ proof sharing decision",
      }),
    ).toMatchObject({
      success: false,
      code: "permission_denied",
    });

    expect(
      mapHqProofDecisionRpcError("final", {
        code: "22023",
        message: "proof already has a final sharing decision",
      }),
    ).toMatchObject({
      success: false,
      code: "already_decided",
    });
  });

  it("confirms readback for approval and changes-requested decisions", () => {
    expect(
      getHqProofDecisionReadbackState(
        {
          status: "approved",
        },
        "sharing_approved",
      ),
    ).toMatchObject({
      confirmsDecision: true,
      tone: "success",
      message: expect.stringContaining("authenticated member story feed"),
    });

    expect(
      getHqProofDecisionReadbackState(
        {
          status: "changes_requested",
        },
        "changes_requested",
      ),
    ).toMatchObject({
      confirmsDecision: true,
      tone: "success",
    });
  });

  it("parses only known HQ proof decisions", () => {
    expect(parseHqProofDecision("approved")).toBe("approved");
    expect(parseHqProofDecision("changes_requested")).toBe("changes_requested");
    expect(parseHqProofDecision("not_shared")).toBeNull();
    expect(parseHqProofDecision(null)).toBeNull();
  });
});

function makePendingEvidence(): EvidenceItem {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    assignmentId: "00000000-0000-4000-8000-000000000102",
    submittedBy: "Local Member",
    evidenceType: "testimonial_text",
    summary: "This testimonial explains why Rush Month helped a student belong.",
    status: "pending_review",
  };
}

function makeDecisionInput() {
  return {
    decision: "approved",
    note: "Useful proof to share with other chapters later.",
  } as const;
}
