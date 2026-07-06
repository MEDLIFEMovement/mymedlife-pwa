import { describe, expect, it } from "vitest";
import {
  defaultLeaderAssignmentInput,
  getLeaderAssignmentPacket,
} from "@/services/leader-assignment-verification-packet";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";
import type { Assignment } from "@/shared/types/domain";

const mockData = getMockReadOnlyAppData("Testing leader assignment packet.");
const chapterId = "10000000-0000-4000-8000-000000000001";
const campaignId = "40000000-0000-4000-8000-000000000001";
const evidenceItemId = "60000000-0000-4000-8000-000000000001";
const hqEventId = "70000000-0000-4000-8000-000000000001";
const hqIntegrationEventId = "71000000-0000-4000-8000-000000000001";
const hqOutboxId = "72000000-0000-4000-8000-000000000001";
const assignmentId = "80000000-0000-4000-8000-000000000001";
const assignmentEventId = "81000000-0000-4000-8000-000000000001";
const assignmentIntegrationEventId = "82000000-0000-4000-8000-000000000001";
const assignmentOutboxId = "83000000-0000-4000-8000-000000000001";

describe("leader assignment verification packet", () => {
  it("shows admin the packet while blocked in mock fallback data", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getLeaderAssignmentPacket(actor, mockData, {});

    expect(packet.canReadPacket).toBe(true);
    expect(packet.title).toBe("Admin leader assignment packet");
    expect(packet.status).toBe("blocked_until_local_supabase");
    expect(packet.counts.browserWritesExpected).toBe(0);
    expect(packet.counts.remindersExpected).toBe(0);
    expect(packet.counts.externalWritesExpected).toBe(0);
    expect(packet.roleResponsibilities.map((item) => item.roleLabel)).toEqual([
      "President / VP",
      "E-Board Member",
      "Action Committee Chair",
    ]);
  });

  it("maps leader assignment responsibility before a write can open", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getLeaderAssignmentPacket(actor, mockData, {});

    expect(packet.roleResponsibilities).toEqual([
      expect.objectContaining({
        roleLabel: "President / VP",
        responsibility: "Approval guardrails",
        route: "/rush-month/actions",
      }),
      expect.objectContaining({
        roleLabel: "E-Board Member",
        responsibility: "Owner handoff",
        route: "/rush-month/actions",
      }),
      expect.objectContaining({
        roleLabel: "Action Committee Chair",
        responsibility: "Committee coordination",
        route: "/action-committees",
      }),
    ]);
    expect(packet.roleResponsibilities.map((item) => item.safetyBoundary).join(" ")).toContain(
      "Does not create assignments",
    );
    expect(packet.roleResponsibilities.map((item) => item.safetyBoundary).join(" ")).toContain(
      "Does not trigger Luma",
    );
  });

  it("blocks local Supabase data until HQ decision readback exists", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getLeaderAssignmentPacket(actor, withSupabaseBase(), {
      ...localSupabaseEnv(),
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
    });

    expect(packet.status).toBe("blocked_until_hq_decision");
    expect(
      packet.checks.find((check) => check.key === "hq_decision_readback")
        ?.passed,
    ).toBe(false);
    expect(packet.verificationPacket.plainEnglishDecision).toContain(
      "Prove HQ proof decision readback",
    );
  });

  it("marks assignment creation ready only with HQ readback, local auth, and flags", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getLeaderAssignmentPacket(actor, withHqDecisionReadback(), {
      ...localSupabaseEnv(),
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
    });

    expect(packet.status).toBe("ready_for_local_assignment_create");
    expect(packet.counts.browserWritesExpected).toBe(1);
    expect(packet.counts.remindersExpected).toBe(0);
    expect(packet.counts.externalWritesExpected).toBe(0);
    expect(packet.checks.every((check) => check.passed)).toBe(true);
    expect(packet.verificationPacket.envSettings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE",
          value: "true",
        }),
        expect.objectContaining({
          key: "MYMEDLIFE_ENABLE_REMINDER_SENDS",
          value: "false",
        }),
      ]),
    );
  });

  it("blocks duplicate assignment titles before the packet can be ready", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getLeaderAssignmentPacket(actor, withHqDecisionReadback({
      assignments: [
        ...withHqDecisionReadback().assignments,
        makeAssignment(defaultLeaderAssignmentInput.title),
      ],
    }), {
      ...localSupabaseEnv(),
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
    });

    expect(packet.status).toBe("blocked_until_flags");
    expect(
      packet.checks.find((check) => check.key === "duplicate_assignment")
        ?.passed,
    ).toBe(false);
  });

  it("shows observed assignment readback after the local records exist", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const packet = getLeaderAssignmentPacket(actor, withAssignmentReadback(), {
      ...localSupabaseEnv(),
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
    });

    expect(packet.status).toBe("evidence_observed");
    expect(packet.verificationPacket.canPromoteToStagingReview).toBe(true);
    expect(Object.fromEntries(
      packet.readbackEvidence.map((item) => [item.key, item.status]),
    )).toEqual({
      assignment_row: "observed",
      internal_event: "observed",
      integration_event: "observed",
      disabled_outbox: "disabled_outbox_observed",
      audit_log: "observed",
    });
    expect(packet.counts.observedReadbackItems).toBe(5);
  });

  it("requires manual audit confirmation when audit proof is missing", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getLeaderAssignmentPacket(actor, {
      ...withAssignmentReadback(),
      auditLogs: withHqDecisionReadback().auditLogs,
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
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getLeaderAssignmentPacket(dsAdmin, mockData).canReadPacket).toBe(true);
    expect(getLeaderAssignmentPacket(dsAdmin, mockData).title).toBe(
      "DS Admin assignment safety packet",
    );
    expect(getLeaderAssignmentPacket(member, mockData).canReadPacket).toBe(false);
    expect(getLeaderAssignmentPacket(member, mockData).roleResponsibilities).toEqual([]);
    expect(getLeaderAssignmentPacket(leader, mockData).canReadPacket).toBe(false);
    expect(getLeaderAssignmentPacket(coach, mockData).canReadPacket).toBe(false);
  });
});

function withSupabaseBase(overrides: Partial<ReadOnlyAppData> = {}): ReadOnlyAppData {
  return {
    ...mockData,
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "Testing local Supabase data.",
    },
    chapter: {
      ...mockData.chapter,
      id: chapterId,
    },
    campaign: {
      ...mockData.campaign,
      id: campaignId,
    },
    assignments: mockData.assignments.map((assignment, index) => ({
      ...assignment,
      id: `50000000-0000-4000-8000-00000000000${index + 1}`,
    })),
    ...overrides,
  };
}

function withHqDecisionReadback(
  overrides: Partial<ReadOnlyAppData> = {},
): ReadOnlyAppData {
  const data = withSupabaseBase(overrides);

  return {
    ...data,
    eventRows: [
      ...data.eventRows,
      {
        id: hqEventId,
        event_type: "hq_sharing_decision_logged",
        actor_user_id: "00000000-0000-4000-8000-000000000010",
        chapter_id: chapterId,
        campaign_id: campaignId,
        assignment_id: "50000000-0000-4000-8000-000000000001",
        chapter_event_id: null,
        payload: {
          source: "app.record_hq_proof_sharing_decision",
          publicPublish: false,
        },
        correlation_id: "hq_sharing_decision:test",
        occurred_at: "2026-06-16T20:30:00Z",
        created_at: "2026-06-16T20:30:00Z",
      },
    ],
    integrationEventRows: [
      ...data.integrationEventRows,
      {
        id: hqIntegrationEventId,
        source_event_id: hqEventId,
        chapter_id: chapterId,
        event_type: "hq_sharing_decision_logged",
        destination: "internal",
        external_object_type: "evidence_item",
        external_object_id: evidenceItemId,
        status: "recorded",
        payload: {
          liveExternalWrite: false,
        },
        created_by: "00000000-0000-4000-8000-000000000010",
        created_at: "2026-06-16T20:30:00Z",
        updated_at: "2026-06-16T20:30:00Z",
      },
    ],
    automationOutboxRows: [
      ...data.automationOutboxRows,
      {
        id: hqOutboxId,
        source_event_id: hqEventId,
        integration_event_id: hqIntegrationEventId,
        chapter_id: chapterId,
        destination: "n8n",
        event_type: "hq_sharing_decision_logged",
        payload: {
          liveExternalWrite: false,
        },
        idempotency_key: "hq_sharing_decision:test",
        status: "disabled",
        attempt_count: 0,
        available_at: "2026-06-16T20:30:00Z",
        locked_at: null,
        sent_at: null,
        last_error: null,
        created_at: "2026-06-16T20:30:00Z",
        updated_at: "2026-06-16T20:30:00Z",
      },
    ],
    auditLogs: [
      ...data.auditLogs,
      {
        id: "73000000-0000-4000-8000-000000000001",
        actor_user_id: "00000000-0000-4000-8000-000000000010",
        chapter_id: chapterId,
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
        created_at: "2026-06-16T20:30:00Z",
      },
    ],
  };
}

function withAssignmentReadback(): ReadOnlyAppData {
  const data = withHqDecisionReadback();

  return {
    ...data,
    assignments: [
      ...data.assignments,
      makeAssignment(defaultLeaderAssignmentInput.title),
    ],
    eventRows: [
      ...data.eventRows,
      {
        id: assignmentEventId,
        event_type: "action_assigned",
        actor_user_id: "00000000-0000-4000-8000-000000000020",
        chapter_id: chapterId,
        campaign_id: campaignId,
        assignment_id: assignmentId,
        chapter_event_id: null,
        payload: {
          source: "app.create_chapter_assignment",
          liveExternalWrite: false,
        },
        correlation_id: "action_assigned:test",
        occurred_at: "2026-06-16T20:35:00Z",
        created_at: "2026-06-16T20:35:00Z",
      },
    ],
    integrationEventRows: [
      ...data.integrationEventRows,
      {
        id: assignmentIntegrationEventId,
        source_event_id: assignmentEventId,
        chapter_id: chapterId,
        event_type: "action_assigned",
        destination: "internal",
        external_object_type: "assignment",
        external_object_id: assignmentId,
        status: "recorded",
        payload: {
          liveExternalWrite: false,
        },
        created_by: "00000000-0000-4000-8000-000000000020",
        created_at: "2026-06-16T20:35:00Z",
        updated_at: "2026-06-16T20:35:00Z",
      },
    ],
    automationOutboxRows: [
      ...data.automationOutboxRows,
      {
        id: assignmentOutboxId,
        source_event_id: assignmentEventId,
        integration_event_id: assignmentIntegrationEventId,
        chapter_id: chapterId,
        destination: "n8n",
        event_type: "action_assigned",
        payload: {
          liveExternalWrite: false,
        },
        idempotency_key: "action_assigned:test",
        status: "disabled",
        attempt_count: 0,
        available_at: "2026-06-16T20:35:00Z",
        locked_at: null,
        sent_at: null,
        last_error: null,
        created_at: "2026-06-16T20:35:00Z",
        updated_at: "2026-06-16T20:35:00Z",
      },
    ],
    auditLogs: [
      ...data.auditLogs,
      {
        id: "84000000-0000-4000-8000-000000000001",
        actor_user_id: "00000000-0000-4000-8000-000000000020",
        chapter_id: chapterId,
        action: "action_assigned",
        target_table: "assignments",
        target_id: assignmentId,
        before_value: {},
        after_value: {
          status: "not_started",
          assignmentId,
        },
        reason: "Local leader assignment write path.",
        created_at: "2026-06-16T20:35:00Z",
      },
    ],
  };
}

function makeAssignment(title: string): Assignment {
  return {
    id: assignmentId,
    title,
    ownerRole: "Action Committee Member",
    lane: "Member",
    dueLabel: "Next Friday",
    status: "not_started",
    evidenceRequired: "Owner name, Luma/event link, and proof collection plan.",
    instructions:
      "Choose one student owner, confirm the event goal, and tell them what proof/testimonial should be collected afterward.",
    points: 15,
    kpi: "Rush Month event owner assigned",
  };
}

function localSupabaseEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
  };
}
