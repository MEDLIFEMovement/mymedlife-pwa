import { describe, expect, it } from "vitest";
import {
  getProofSubmissionReadbackState,
  getProofSubmissionWriteConfig,
  getProofSubmissionWriteReadiness,
  mapProofSubmissionRpcError,
  mapProofSubmissionRpcSuccess,
  parseProofEvidenceType,
} from "@/services/proof-submission-write";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import type { Assignment } from "@/shared/types/domain";

describe("proof-submission write readiness", () => {
  it("keeps proof metadata writes disabled by default", () => {
    expect(getProofSubmissionWriteConfig({})).toMatchObject({
      enabled: false,
      externalWritesEnabled: false,
      uploadsEnabled: false,
    });
  });

  it("requires local writes and the proof-submission approval flag", () => {
    expect(
      getProofSubmissionWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Proof-submission browser-facing writes remain disabled. Set MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE=true only after local auth and RLS are ready.",
    });

    expect(
      getProofSubmissionWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      externalWritesEnabled: false,
      uploadsEnabled: false,
    });
  });

  it("supports an explicitly approved staging proof-metadata gate without enabling uploads or sends", () => {
    const config = getProofSubmissionWriteConfig({
      MYMEDLIFE_AUTH_MODE: "staging_supabase",
      MYMEDLIFE_ENABLE_STAGING_PROOF_SUBMISSION_WRITE: "true",
      MYMEDLIFE_ALLOW_PROOF_UPLOADS: "false",
    });

    expect(config).toMatchObject({
      enabled: true,
      isLocalOnly: false,
      externalWritesEnabled: false,
      uploadsEnabled: false,
    });

    const readiness = getProofSubmissionWriteReadiness(
      getMockLocalActorContext(
        "member.a@mymedlife.test",
        "Signed in through the approved staging lane.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
      makeProofReadyAssignment(),
      makeProofInput(),
      {
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        MYMEDLIFE_ENABLE_STAGING_PROOF_SUBMISSION_WRITE: "true",
        MYMEDLIFE_ALLOW_PROOF_UPLOADS: "false",
      },
    );

    expect(
      readiness.checks.find((check) => check.key === "local_auth_session")?.label,
    ).toBe("Signed-in staging Supabase Auth session inside the approved staging access path");
  });

  it("blocks metadata writes when proof uploads are requested", () => {
    expect(
      getProofSubmissionWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
        MYMEDLIFE_ALLOW_PROOF_UPLOADS: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Proof uploads are still disabled. Turn off MYMEDLIFE_ALLOW_PROOF_UPLOADS before testing metadata-only proof writes.",
    });
  });

  it("keeps the write locked without auth-derived actor context", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const readiness = getProofSubmissionWriteReadiness(
      actor,
      makeProofReadyAssignment(),
      makeProofInput(),
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
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

  it("allows a signed-in local member to submit metadata for a UUID in-progress assignment", () => {
    const actor = getMockLocalActorContext(
      "member.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getProofSubmissionWriteReadiness(
      actor,
      makeProofReadyAssignment(),
      makeProofInput(),
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(true);
    expect(readiness.resultCodeIfSubmitted).toBe("proof_submitted");
    expect(readiness.checks.every((check) => check.passed)).toBe(true);
  });

  it("blocks proof before the assignment is in progress", () => {
    const actor = getMockLocalActorContext(
      "member.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getProofSubmissionWriteReadiness(
      actor,
      {
        ...makeProofReadyAssignment(),
        status: "not_started",
      },
      makeProofInput(),
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("action_not_ready");
  });

  it("blocks short summaries before calling Supabase", () => {
    const actor = getMockLocalActorContext(
      "member.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const readiness = getProofSubmissionWriteReadiness(
      actor,
      makeProofReadyAssignment(),
      {
        evidenceType: "testimonial_text",
        summary: "Too short",
      },
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
      },
    );

    expect(readiness.canSubmit).toBe(false);
    expect(readiness.resultCodeIfSubmitted).toBe("summary_too_short");
  });

  it("maps local RPC success and errors into proof result states", () => {
    expect(
      mapProofSubmissionRpcSuccess("00000000-0000-4000-8000-000000000101", {
        assignment_id: "00000000-0000-4000-8000-000000000101",
        evidence_item_id: "00000000-0000-4000-8000-000000000201",
        event_id: "00000000-0000-4000-8000-000000000301",
        integration_event_id: "00000000-0000-4000-8000-000000000401",
        outbox_id: "00000000-0000-4000-8000-000000000501",
        audit_log_id: "00000000-0000-4000-8000-000000000601",
      }),
    ).toMatchObject({
      success: true,
      code: "proof_submitted",
      evidenceItemId: "00000000-0000-4000-8000-000000000201",
      outboxId: "00000000-0000-4000-8000-000000000501",
    });

    expect(
      mapProofSubmissionRpcError("missing", {
        code: "P0002",
        message: "assignment not found",
      }),
    ).toMatchObject({
      success: false,
      code: "assignment_not_found",
    });

    expect(
      mapProofSubmissionRpcError("short", {
        code: "22023",
        message: "proof summary must describe what happened",
      }),
    ).toMatchObject({
      success: false,
      code: "summary_too_short",
    });

    expect(
      mapProofSubmissionRpcError("denied", {
        code: "42501",
        message: "actor cannot submit proof for this assignment",
      }),
    ).toMatchObject({
      success: false,
      code: "permission_denied",
    });
  });

  it("confirms local readback when the refreshed assignment is submitted", () => {
    expect(
      getProofSubmissionReadbackState(
        {
          status: "submitted",
        },
        "proof_submitted",
      ),
    ).toMatchObject({
      confirmsSubmitted: true,
      tone: "success",
    });
  });

  it("warns when a successful proof result has not refreshed to submitted", () => {
    expect(
      getProofSubmissionReadbackState(
        {
          status: "in_progress",
        },
        "proof_submitted",
      ),
    ).toMatchObject({
      confirmsSubmitted: false,
      tone: "warning",
    });
  });

  it("parses only approved metadata proof evidence types", () => {
    expect(parseProofEvidenceType("testimonial_text")).toBe("testimonial_text");
    expect(parseProofEvidenceType("mock_file")).toBeNull();
    expect(parseProofEvidenceType(null)).toBeNull();
  });
});

function makeProofReadyAssignment(): Assignment {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    title: "Submit a local testimonial",
    ownerRole: "General Member",
    lane: "Member",
    dueLabel: "Today",
    status: "in_progress",
    evidenceRequired: "Short testimonial or proof note.",
    instructions: "Explain what happened and why it matters.",
    points: 10,
    kpi: "testimonial_submitted",
  };
}

function makeProofInput() {
  return {
    evidenceType: "testimonial_text",
    summary:
      "This testimonial explains why a student felt comfortable taking the next MEDLIFE action.",
  } as const;
}
