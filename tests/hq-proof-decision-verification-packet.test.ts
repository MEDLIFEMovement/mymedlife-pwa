import { describe, expect, it } from "vitest";
import { getHqProofDecisionPacket } from "@/services/hq-proof-decision-verification-packet";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";

const mockData = getMockReadOnlyAppData("Testing HQ proof decision packet.");
const assignmentId = "00000000-0000-4000-8000-000000000101";
const evidenceItemId = "00000000-0000-4000-8000-000000000401";
const proofEventId = "00000000-0000-4000-8000-000000000501";
const proofIntegrationEventId = "00000000-0000-4000-8000-000000000601";
const proofOutboxId = "00000000-0000-4000-8000-000000000701";
const hqEventId = "00000000-0000-4000-8000-000000000901";
const hqIntegrationEventId = "00000000-0000-4000-8000-000000001001";
const hqOutboxId = "00000000-0000-4000-8000-000000001101";

describe("HQ proof decision verification packet", () => {
  it("shows admin the packet while blocked in mock fallback data", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getHqProofDecisionPacket(actor, mockData, {});

    expect(packet.canReadPacket).toBe(true);
    expect(packet.title).toBe("Admin HQ proof decision packet");
    expect(packet.status).toBe("blocked_until_local_supabase");
    expect(packet.counts.browserWritesExpected).toBe(0);
    expect(packet.counts.externalWritesExpected).toBe(0);
    expect(packet.counts.publicSharesExpected).toBe(0);
  });

  it("blocks local Supabase data until proof metadata readback exists", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getHqProofDecisionPacket(actor, withSubmittedProofWithoutReadback(), {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
    });

    expect(packet.status).toBe("blocked_until_proof_metadata");
    expect(
      packet.checks.find((check) => check.key === "proof_metadata_readback")
        ?.passed,
    ).toBe(false);
    expect(packet.verificationPacket.plainEnglishDecision).toContain(
      "Prove proof/testimonial metadata",
    );
  });

  it("marks HQ decision ready only with proof metadata readback, local auth, and flags", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getHqProofDecisionPacket(actor, withProofMetadataReadback(), {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
    });

    expect(packet.status).toBe("ready_for_local_hq_decision");
    expect(packet.counts.browserWritesExpected).toBe(1);
    expect(packet.counts.externalWritesExpected).toBe(0);
    expect(packet.counts.publicSharesExpected).toBe(0);
    expect(packet.checks.every((check) => check.passed)).toBe(true);
    expect(packet.candidateEvidence?.route).toBe(
      `/rush-month/actions/${assignmentId}`,
    );
    expect(packet.candidateEvidence?.reviewRoute).toBe("/rush-month/review");
    expect(packet.candidateEvidence?.privateUploadStatusLabel).toBe(
      "No raw file required",
    );
    expect(packet.candidateEvidence?.privacyBoundary).toContain("sharing intent only");
    expect(packet.verificationPacket.envSettings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE",
          value: "true",
        }),
        expect.objectContaining({
          key: "MYMEDLIFE_ALLOW_PUBLIC_PROOF_SHARING",
          value: "false",
        }),
      ]),
    );
    expect(packet.proofToCollect).toContain(
      "Evidence that any attached raw file stayed private and no public URL or member-visible asset was created.",
    );
  });

  it("blocks if public proof sharing flags are requested", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getHqProofDecisionPacket(actor, withProofMetadataReadback(), {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
      MYMEDLIFE_ALLOW_PUBLIC_PROOF_SHARING: "true",
    });

    expect(packet.status).toBe("blocked_until_flags");
    expect(
      packet.checks.find((check) => check.key === "public_sharing_disabled")
        ?.passed,
    ).toBe(false);
  });

  it("shows observed HQ decision readback after the local records exist", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const packet = getHqProofDecisionPacket(actor, withHqDecisionReadback(), {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
    });

    expect(packet.status).toBe("evidence_observed");
    expect(packet.verificationPacket.canPromoteToStagingReview).toBe(true);
    expect(Object.fromEntries(
      packet.readbackEvidence.map((item) => [item.key, item.status]),
    )).toEqual({
      evidence_status: "observed",
      internal_event: "observed",
      integration_event: "observed",
      disabled_outbox: "disabled_outbox_observed",
      audit_log: "observed",
    });
    expect(packet.counts.observedReadbackItems).toBe(5);
  });

  it("requires manual audit confirmation when audit proof is missing", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getHqProofDecisionPacket(actor, {
      ...withHqDecisionReadback(),
      auditLogs: [],
    });

    expect(packet.status).toBe("needs_manual_audit_check");
    expect(packet.verificationPacket.canPromoteToStagingReview).toBe(false);
    expect(
      packet.readbackEvidence.find((item) => item.key === "audit_log")?.status,
    ).toBe("manual_check_needed");
  });

  it("prefers a ready proof with a private upload attached and surfaces takedown guidance", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getHqProofDecisionPacket(actor, withRawUploadReady(), {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
    });

    expect(packet.candidateEvidence?.privateUploadStatusLabel).toBe(
      "Private file attached",
    );
    expect(packet.candidateEvidence?.privateUploadGuidance).toContain(
      "approved submitter/HQ boundary",
    );
    expect(packet.candidateEvidence?.deletionBoundary).toContain(
      "/proof-library/upload",
    );
    expect(packet.verificationPacket.safetyStops).toEqual(
      expect.arrayContaining([
        expect.stringContaining("public URL"),
        expect.stringContaining("deletion/takedown"),
      ]),
    );
  });

  it("keeps DS Admin eligible and operating roles hidden", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getHqProofDecisionPacket(dsAdmin, mockData).canReadPacket).toBe(true);
    expect(getHqProofDecisionPacket(dsAdmin, mockData).title).toBe(
      "DS Admin HQ decision safety packet",
    );
    expect(getHqProofDecisionPacket(member, mockData).canReadPacket).toBe(false);
    expect(getHqProofDecisionPacket(committeeMember, mockData).canReadPacket).toBe(
      false,
    );
    expect(getHqProofDecisionPacket(committeeChair, mockData).canReadPacket).toBe(
      false,
    );
    expect(getHqProofDecisionPacket(leader, mockData).canReadPacket).toBe(false);
    expect(getHqProofDecisionPacket(coach, mockData).canReadPacket).toBe(false);
  });
});

function withSubmittedProofWithoutReadback(): ReadOnlyAppData {
  return {
    ...mockData,
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "Testing local Supabase data.",
    },
    assignments: [
      {
        ...mockData.assignments[0],
        id: assignmentId,
        status: "submitted",
        lane: "Member",
      },
      ...mockData.assignments.slice(1),
    ],
    evidenceItems: [
      {
        id: evidenceItemId,
        assignmentId,
        submittedBy: "Member A",
        evidenceType: "testimonial_text",
        summary:
          "This local proof explains what happened and why another student should take action.",
        status: "pending_review",
      },
    ],
  };
}

function withProofMetadataReadback(): ReadOnlyAppData {
  const data = withSubmittedProofWithoutReadback();

  return {
    ...data,
    eventRows: [
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
      {
        id: "00000000-0000-4000-8000-000000000801",
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

function withHqDecisionReadback(): ReadOnlyAppData {
  const data = withProofMetadataReadback();

  return {
    ...data,
    evidenceItems: data.evidenceItems.map((evidenceItem) => {
      if (evidenceItem.id !== evidenceItemId) {
        return evidenceItem;
      }

      return {
        ...evidenceItem,
        status: "approved",
      };
    }),
    eventRows: [
      ...data.eventRows,
      {
        id: hqEventId,
        event_type: "hq_sharing_decision_logged",
        actor_user_id: "00000000-0000-4000-8000-000000000010",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: assignmentId,
        chapter_event_id: null,
        payload: {
          source: "app.record_hq_proof_sharing_decision",
          publicPublish: false,
        },
        correlation_id: "hq_sharing_decision:test",
        occurred_at: "2026-06-16T19:10:00Z",
        created_at: "2026-06-16T19:10:00Z",
      },
    ],
    integrationEventRows: [
      ...data.integrationEventRows,
      {
        id: hqIntegrationEventId,
        source_event_id: hqEventId,
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "hq_sharing_decision_logged",
        destination: "internal",
        external_object_type: "evidence_item",
        external_object_id: evidenceItemId,
        status: "recorded",
        payload: {
          liveExternalWrite: false,
        },
        created_by: "00000000-0000-4000-8000-000000000010",
        created_at: "2026-06-16T19:10:00Z",
        updated_at: "2026-06-16T19:10:00Z",
      },
    ],
    automationOutboxRows: [
      ...data.automationOutboxRows,
      {
        id: hqOutboxId,
        source_event_id: hqEventId,
        integration_event_id: hqIntegrationEventId,
        chapter_id: "10000000-0000-4000-8000-000000000001",
        destination: "n8n",
        event_type: "hq_sharing_decision_logged",
        payload: {
          liveExternalWrite: false,
          publicPublish: false,
        },
        idempotency_key: "hq_sharing_decision:test",
        status: "disabled",
        attempt_count: 0,
        available_at: "2026-06-16T19:10:00Z",
        locked_at: null,
        sent_at: null,
        last_error: null,
        created_at: "2026-06-16T19:10:00Z",
        updated_at: "2026-06-16T19:10:00Z",
      },
    ],
    auditLogs: [
      ...data.auditLogs,
      {
        id: "00000000-0000-4000-8000-000000000902",
        actor_user_id: "00000000-0000-4000-8000-000000000010",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        action: "hq_sharing_decision_logged",
        target_table: "evidence_items",
        target_id: evidenceItemId,
        before_value: {
          status: "pending_review",
        },
        after_value: {
          status: "approved",
          publicPublish: false,
        },
        reason: "Local HQ proof decision write path.",
        created_at: "2026-06-16T19:10:00Z",
      },
    ],
  };
}

function withRawUploadReady(): ReadOnlyAppData {
  const data = withProofMetadataReadback();

  return {
    ...data,
    evidenceItems: data.evidenceItems.map((evidenceItem) => {
      if (evidenceItem.id !== evidenceItemId) {
        return evidenceItem;
      }

      return {
        ...evidenceItem,
        evidenceType: "bridge_video",
        storagePath:
          "chapters/10000000-0000-4000-8000-000000000001/evidence/00000000-0000-4000-8000-000000000401/rush-social-bridge-video.mov",
      };
    }),
  };
}
