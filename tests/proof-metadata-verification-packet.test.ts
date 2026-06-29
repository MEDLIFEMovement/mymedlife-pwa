import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getProofMetadataPacket } from "@/services/proof-metadata-verification-packet";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";

const mockData = getMockReadOnlyAppData("Testing proof metadata packet.");
const assignmentId = "00000000-0000-4000-8000-000000000101";
const eventId = "00000000-0000-4000-8000-000000000201";
const integrationEventId = "00000000-0000-4000-8000-000000000301";
const evidenceItemId = "00000000-0000-4000-8000-000000000401";
const proofEventId = "00000000-0000-4000-8000-000000000501";
const proofIntegrationEventId = "00000000-0000-4000-8000-000000000601";
const proofOutboxId = "00000000-0000-4000-8000-000000000701";

describe("proof metadata verification packet", () => {
  it("shows admin the packet while blocked in mock fallback data", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getProofMetadataPacket(actor, mockData, {});

    expect(packet.canReadPacket).toBe(true);
    expect(packet.title).toBe("Admin proof metadata packet");
    expect(packet.status).toBe("blocked_until_local_supabase");
    expect(packet.counts.browserWritesExpected).toBe(0);
    expect(packet.counts.externalWritesExpected).toBe(0);
    expect(packet.counts.uploadsExpected).toBe(0);
    expect(
      packet.checks.find((check) => check.key === "candidate_assignment_uuid")
        ?.passed,
    ).toBe(false);
  });

  it("blocks local Supabase data until action-start readback exists", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getProofMetadataPacket(actor, withUuidInProgressAssignment(mockData), {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
    });

    expect(packet.status).toBe("blocked_until_first_write");
    expect(
      packet.checks.find((check) => check.key === "first_write_readback")
        ?.passed,
    ).toBe(false);
    expect(packet.verificationPacket.plainEnglishDecision).toContain(
      "Prove the first action-start write",
    );
    expect(
      packet.checks.find((check) => check.key === "candidate_assignment")?.passed,
    ).toBe(true);
  });

  it("marks proof metadata ready only with first-write readback, local auth, and flags", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getProofMetadataPacket(actor, withFirstWriteReadback(), {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
    });

    expect(packet.status).toBe("ready_for_local_proof_metadata");
    expect(packet.counts.browserWritesExpected).toBe(1);
    expect(packet.counts.externalWritesExpected).toBe(0);
    expect(packet.counts.uploadsExpected).toBe(0);
    expect(packet.checks.every((check) => check.passed)).toBe(true);
    expect(packet.candidateAssignment?.route).toBe(
      `/rush-month/actions?assignmentId=${assignmentId}&source=proof_metadata_packet`,
    );
    expect(packet.verificationPacket.envSettings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE",
          value: "true",
        }),
        expect.objectContaining({
          key: "MYMEDLIFE_ALLOW_PROOF_UPLOADS",
          value: "false",
        }),
      ]),
    );
  });

  it("blocks if proof upload flags are requested", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getProofMetadataPacket(actor, withFirstWriteReadback(), {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
      MYMEDLIFE_ALLOW_PROOF_UPLOADS: "true",
    });

    expect(packet.status).toBe("blocked_until_flags");
    expect(
      packet.checks.find((check) => check.key === "proof_uploads_disabled")
        ?.passed,
    ).toBe(false);
  });

  it("recognizes an explicitly approved staging review path for hosted proof metadata", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getProofMetadataPacket(actor, withFirstWriteReadback(), {
      MYMEDLIFE_AUTH_MODE: "staging_supabase",
      MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH: "true",
      MYMEDLIFE_ENABLE_STAGING_PROOF_SUBMISSION_WRITE: "true",
      MYMEDLIFE_ALLOW_PROOF_UPLOADS: "false",
    });

    expect(packet.status).toBe("ready_for_local_proof_metadata");
    expect(packet.checks.find((check) => check.key === "auth_mode")?.label).toBe(
      "Hosted staging Supabase Auth mode is selected",
    );
    expect(
      packet.checks.find((check) => check.key === "proof_submission_flag")?.detail,
    ).toContain("MYMEDLIFE_ENABLE_STAGING_PROOF_SUBMISSION_WRITE=true");
    expect(packet.verificationPacket.envSettings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "MYMEDLIFE_AUTH_MODE",
          value: "staging_supabase",
        }),
        expect.objectContaining({
          key: "MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH",
          value: "true",
          reason: expect.stringContaining("Vercel gate"),
        }),
        expect.objectContaining({
          key: "MYMEDLIFE_ENABLE_STAGING_PROOF_SUBMISSION_WRITE",
          value: "true",
        }),
      ]),
    );
    expect(
      packet.verificationPacket.operatorSequence.find((step) => step.route === "/login")
        ?.expectedProof,
    ).toContain("clears the approved staging access path");
    expect(
      packet.checks.find((check) => check.key === "auth_mode")?.detail,
    ).toContain("protected staging access path");
    expect(packet.verificationPacket.safetyStops.join(" ")).toContain(
      "approved staging access path",
    );
    expect(
      packet.checks.find((check) => check.key === "local_auth_session")?.label,
    ).toBe("Approved pilot member is signed in on staging");
    expect(packet.plainEnglishSummary).toContain("hosted staging");
    expect(packet.verificationPacket.plainEnglishDecision).toContain(
      "Ready to run on hosted staging",
    );
    expect(packet.hostedCloseout.recommendedProofLoop).toBe(
      "proof metadata submission plus leader review only",
    );
    expect(packet.hostedCloseout.blockedScope).toEqual(
      expect.arrayContaining(["leader proof decision writes", "proof uploads"]),
    );
    expect(packet.hostedCloseout.reviewSurfaces).toEqual(
      expect.arrayContaining(["/rush-month/review", "/admin/proof-write"]),
    );
  });

  it("reflects recorded proof-loop and owner answers in the hosted closeout", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getProofMetadataPacket(actor, withFirstWriteReadback(), {
      MYMEDLIFE_PILOT_PROOF_REVIEW_LOOP:
        "proof metadata submission plus leader review only",
      MYMEDLIFE_PILOT_CHAPTER_LEADER_OWNER: "Jordan Chapter",
      MYMEDLIFE_PILOT_HQ_ADMIN_OWNER: "Maya HQ",
      MYMEDLIFE_PILOT_DS_OWNER: "Renato DS",
      MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL: "#mymedlife-pilot-watch",
      MYMEDLIFE_PILOT_ROLLBACK_OWNER: "Kiomi Matsukawa",
    });

    expect(packet.hostedCloseout.hostedDecision).toContain("Recorded Phase 2 proof loop");
    expect(packet.hostedCloseout.recordedOwnerAnswers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Chapter leader owner", value: "Jordan Chapter" }),
        expect.objectContaining({ label: "HQ/admin owner", value: "Maya HQ" }),
        expect.objectContaining({ label: "DS owner", value: "Renato DS" }),
        expect.objectContaining({
          label: "Support and pause channel",
          value: "#mymedlife-pilot-watch",
        }),
        expect.objectContaining({ label: "Rollback owner", value: "Kiomi Matsukawa" }),
      ]),
    );
    expect(packet.hostedCloseout.namedOwnersStillNeeded).toEqual([]);
  });

  it("shows observed proof metadata readback after the local records exist", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const packet = getProofMetadataPacket(actor, withProofMetadataReadback(), {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
    });

    expect(packet.status).toBe("evidence_observed");
    expect(packet.verificationPacket.canPromoteToStagingReview).toBe(true);
    expect(Object.fromEntries(
      packet.readbackEvidence.map((item) => [item.key, item.status]),
    )).toEqual({
      assignment_status: "observed",
      evidence_item: "observed",
      internal_event: "observed",
      integration_event: "observed",
      disabled_outbox: "disabled_outbox_observed",
      audit_log: "observed",
    });
    expect(packet.counts.observedReadbackItems).toBe(6);
  });

  it("requires manual audit confirmation when audit proof is missing", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getProofMetadataPacket(actor, {
      ...withProofMetadataReadback(),
      auditLogs: [],
    });

    expect(packet.status).toBe("needs_manual_audit_check");
    expect(packet.verificationPacket.canPromoteToStagingReview).toBe(false);
    expect(
      packet.readbackEvidence.find((item) => item.key === "audit_log")?.status,
    ).toBe("manual_check_needed");
  });

  it("keeps DS Admin eligible and operating roles hidden", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getProofMetadataPacket(dsAdmin, mockData).canReadPacket).toBe(true);
    expect(getProofMetadataPacket(dsAdmin, mockData).title).toBe(
      "DS Admin proof metadata safety packet",
    );
    expect(getProofMetadataPacket(member, mockData).canReadPacket).toBe(false);
    expect(getProofMetadataPacket(committeeMember, mockData).canReadPacket).toBe(false);
    expect(getProofMetadataPacket(committeeChair, mockData).canReadPacket).toBe(false);
    expect(getProofMetadataPacket(leader, mockData).canReadPacket).toBe(false);
    expect(getProofMetadataPacket(coach, mockData).canReadPacket).toBe(false);
  });
});

function withUuidInProgressAssignment(data: ReadOnlyAppData): ReadOnlyAppData {
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
        id: assignmentId,
        status: "in_progress",
        lane: "Member",
      },
      ...data.assignments.slice(1),
    ],
  };
}

function withFirstWriteReadback(): ReadOnlyAppData {
  const data = withUuidInProgressAssignment(mockData);

  return {
    ...data,
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
    auditLogs: [
      {
        id: "00000000-0000-4000-8000-000000000801",
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
        },
        reason: "Local action start test.",
        created_at: "2026-06-16T19:00:00Z",
      },
    ],
  };
}

function withProofMetadataReadback(): ReadOnlyAppData {
  const data = withFirstWriteReadback();

  return {
    ...data,
    assignments: data.assignments.map((assignment) => {
      if (assignment.id !== assignmentId) {
        return assignment;
      }

      return {
        ...assignment,
        status: "submitted",
      };
    }),
    evidenceItems: [
      {
        id: evidenceItemId,
        assignmentId,
        submittedBy: "Member A",
        evidenceType: "testimonial_text",
        summary:
          "This local proof metadata explains what happened and why another student should take action.",
        status: "pending_review",
      },
    ],
    eventRows: [
      ...data.eventRows,
      {
        id: proofEventId,
        event_type: "evidence_submitted",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: assignmentId,
        chapter_event_id: null,
        payload: {
          source: "app.submit_assignment_proof_metadata",
        },
        correlation_id: "evidence_submitted:test",
        occurred_at: "2026-06-16T19:05:00Z",
        created_at: "2026-06-16T19:05:00Z",
      },
    ],
    integrationEventRows: [
      ...data.integrationEventRows,
      {
        id: proofIntegrationEventId,
        source_event_id: proofEventId,
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "evidence_submitted",
        destination: "internal",
        external_object_type: "evidence_item",
        external_object_id: evidenceItemId,
        status: "recorded",
        payload: {
          liveExternalWrite: false,
        },
        created_by: "00000000-0000-4000-8000-000000000001",
        created_at: "2026-06-16T19:05:00Z",
        updated_at: "2026-06-16T19:05:00Z",
      },
    ],
    automationOutboxRows: [
      {
        id: proofOutboxId,
        source_event_id: proofEventId,
        integration_event_id: proofIntegrationEventId,
        chapter_id: "10000000-0000-4000-8000-000000000001",
        destination: "n8n",
        event_type: "evidence_submitted",
        payload: {
          liveExternalWrite: false,
        },
        idempotency_key: "evidence_submitted:test",
        status: "disabled",
        attempt_count: 0,
        available_at: "2026-06-16T19:05:00Z",
        locked_at: null,
        sent_at: null,
        last_error: null,
        created_at: "2026-06-16T19:05:00Z",
        updated_at: "2026-06-16T19:05:00Z",
      },
    ],
    auditLogs: [
      ...data.auditLogs,
      {
        id: "00000000-0000-4000-8000-000000000901",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        action: "evidence_submitted",
        target_table: "evidence_items",
        target_id: evidenceItemId,
        before_value: {
          assignmentStatus: "in_progress",
        },
        after_value: {
          assignmentStatus: "submitted",
          evidenceItemId,
        },
        reason: "Local proof metadata write path.",
        created_at: "2026-06-16T19:05:00Z",
      },
    ],
  };
}
