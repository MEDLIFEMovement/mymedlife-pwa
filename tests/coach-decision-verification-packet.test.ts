import { describe, expect, it } from "vitest";
import {
  defaultCoachDecisionInput,
  getCoachDecisionPacket,
} from "@/services/coach-decision-verification-packet";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";
import type { PhaseRow } from "@/shared/types/persistence";

const mockData = getMockReadOnlyAppData("Testing coach decision packet.");
const chapterId = "10000000-0000-4000-8000-000000000001";
const campaignId = "40000000-0000-4000-8000-000000000001";
const phaseId = "50000000-0000-4000-8000-000000000001";
const assignmentId = "80000000-0000-4000-8000-000000000001";
const assignmentEventId = "81000000-0000-4000-8000-000000000001";
const assignmentIntegrationEventId = "82000000-0000-4000-8000-000000000001";
const assignmentOutboxId = "83000000-0000-4000-8000-000000000001";
const coachReviewId = "90000000-0000-4000-8000-000000000001";
const coachEventId = "91000000-0000-4000-8000-000000000001";
const coachIntegrationEventId = "92000000-0000-4000-8000-000000000001";
const coachOutboxId = "93000000-0000-4000-8000-000000000001";

describe("coach decision verification packet", () => {
  it("shows admin the packet while blocked in mock fallback data", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getCoachDecisionPacket(actor, mockData, {});

    expect(packet.canReadPacket).toBe(true);
    expect(packet.title).toBe("Admin coach decision packet");
    expect(packet.status).toBe("blocked_until_local_supabase");
    expect(packet.counts.browserWritesExpected).toBe(0);
    expect(packet.counts.escalationPacketsExpected).toBe(0);
    expect(packet.counts.externalWritesExpected).toBe(0);
  });

  it("blocks local Supabase data until leader assignment readback exists", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getCoachDecisionPacket(actor, withSupabaseBase(), {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
    });

    expect(packet.status).toBe("blocked_until_assignment");
    expect(
      packet.checks.find((check) => check.key === "assignment_readback")?.passed,
    ).toBe(false);
    expect(packet.verificationPacket.plainEnglishDecision).toContain(
      "Prove leader assignment readback",
    );
  });

  it("marks coach decision ready only with assignment readback, local auth, and flags", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getCoachDecisionPacket(actor, withAssignmentReadback(), {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
    });

    expect(packet.status).toBe("ready_for_local_coach_decision");
    expect(packet.defaultInput).toMatchObject({
      decision: "intervene",
      blockerSummary: defaultCoachDecisionInput.blockerSummary,
    });
    expect(packet.counts.browserWritesExpected).toBe(1);
    expect(packet.counts.escalationPacketsExpected).toBe(0);
    expect(packet.counts.externalWritesExpected).toBe(0);
    expect(packet.checks.every((check) => check.passed)).toBe(true);
    expect(packet.verificationPacket.envSettings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "MYMEDLIFE_ENABLE_COACH_DECISION_WRITE",
          value: "true",
        }),
        expect.objectContaining({
          key: "MYMEDLIFE_ENABLE_ESCALATION_SENDS",
          value: "false",
        }),
      ]),
    );
    expect(packet.verificationPacket.title).toBe(
      "Staff chapter decision and coach note packet",
    );
    expect(
      packet.verificationPacket.supportNotesSummary.blockedControls,
    ).toContain("member nudge");
    expect(
      packet.verificationPacket.coverageChecklist.find(
        (item) => item.key === "downstream_locks",
      ),
    ).toMatchObject({
      status: "locked",
      route: "/admin/integration-outbox",
    });
  });

  it("shows observed coach decision readback after the local records exist", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const packet = getCoachDecisionPacket(actor, withCoachDecisionReadback(), {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
    });

    expect(packet.status).toBe("evidence_observed");
    expect(packet.verificationPacket.canPromoteToStagingReview).toBe(true);
    expect(Object.fromEntries(
      packet.readbackEvidence.map((item) => [item.key, item.status]),
    )).toEqual({
      readiness_review: "observed",
      internal_event: "observed",
      integration_event: "observed",
      disabled_outbox: "disabled_outbox_observed",
      audit_log: "observed",
    });
    expect(packet.counts.observedReadbackItems).toBe(5);
  });

  it("requires manual audit confirmation when audit proof is missing", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getCoachDecisionPacket(actor, {
      ...withCoachDecisionReadback(),
      auditLogs: withAssignmentReadback().auditLogs,
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

    const dsAdminPacket = getCoachDecisionPacket(dsAdmin, mockData);

    expect(dsAdminPacket.canReadPacket).toBe(true);
    expect(dsAdminPacket.title).toBe(
      "DS Admin coach decision safety packet",
    );
    expect(dsAdminPacket.verificationPacket.supportNotesSummary.canReadNotes).toBe(
      false,
    );
    expect(
      dsAdminPacket.verificationPacket.roleCoverage.find(
        (role) => role.role === "DS Admin",
      ),
    ).toMatchObject({
      decisionAccess: "Blocked from owning chapter truth",
      packetAccess: "Safety-only packet",
    });
    expect(getCoachDecisionPacket(member, mockData).canReadPacket).toBe(false);
    expect(getCoachDecisionPacket(leader, mockData).canReadPacket).toBe(false);
    expect(getCoachDecisionPacket(coach, mockData).canReadPacket).toBe(false);
  });

  it("summarizes note visibility and correction posture for admin review", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getCoachDecisionPacket(actor, mockData);

    expect(packet.verificationPacket.supportNotesSummary.canReadNotes).toBe(true);
    expect(packet.verificationPacket.supportNotesSummary.visibleNotes).toBeGreaterThan(0);
    expect(packet.verificationPacket.supportNotesSummary.coachPrivate).toBeGreaterThan(0);
    expect(packet.verificationPacket.supportNotesSummary.hqSupport).toBeGreaterThan(0);
    expect(
      packet.verificationPacket.supportNotesSummary.chapterFollowUp,
    ).toBeGreaterThan(0);
    expect(packet.verificationPacket.rollbackPlan[0]).toContain(
      "new correction event",
    );
    expect(
      packet.verificationPacket.coverageChecklist.find(
        (item) => item.key === "duplicate_and_correction",
      )?.detail,
    ).toContain("fresh readiness review");
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
    phases: [makePhase()],
    assignments: mockData.assignments.map((assignment, index) => ({
      ...assignment,
      id: `70000000-0000-4000-8000-00000000000${index + 1}`,
    })),
    ...overrides,
  };
}

function withAssignmentReadback(
  overrides: Partial<ReadOnlyAppData> = {},
): ReadOnlyAppData {
  const data = withSupabaseBase(overrides);

  return {
    ...data,
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
        occurred_at: "2026-06-16T21:00:00Z",
        created_at: "2026-06-16T21:00:00Z",
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
        created_at: "2026-06-16T21:00:00Z",
        updated_at: "2026-06-16T21:00:00Z",
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
        available_at: "2026-06-16T21:00:00Z",
        locked_at: null,
        sent_at: null,
        last_error: null,
        created_at: "2026-06-16T21:00:00Z",
        updated_at: "2026-06-16T21:00:00Z",
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
        created_at: "2026-06-16T21:00:00Z",
      },
    ],
  };
}

function withCoachDecisionReadback(): ReadOnlyAppData {
  const data = withAssignmentReadback();

  return {
    ...data,
    phases: [
      {
        ...makePhase(),
        readiness_status: "blocked",
        coach_validation_status: "blocked",
      },
    ],
    readinessReviews: [
      ...data.readinessReviews,
      {
        id: coachReviewId,
        chapter_id: chapterId,
        campaign_id: campaignId,
        phase_id: phaseId,
        reviewer_user_id: "00000000-0000-4000-8000-000000000030",
        readiness_status: "blocked",
        decision_note: defaultCoachDecisionInput.note,
        blocker_summary: defaultCoachDecisionInput.blockerSummary ?? null,
        reviewed_at: "2026-06-16T21:05:00Z",
        created_at: "2026-06-16T21:05:00Z",
      },
    ],
    eventRows: [
      ...data.eventRows,
      {
        id: coachEventId,
        event_type: "coach_decision_logged",
        actor_user_id: "00000000-0000-4000-8000-000000000030",
        chapter_id: chapterId,
        campaign_id: campaignId,
        assignment_id: null,
        chapter_event_id: null,
        payload: {
          source: "app.log_coach_decision",
          phaseId,
          coachDecision: "intervene",
          liveExternalWrite: false,
        },
        correlation_id: "coach_decision:test",
        occurred_at: "2026-06-16T21:05:00Z",
        created_at: "2026-06-16T21:05:00Z",
      },
    ],
    integrationEventRows: [
      ...data.integrationEventRows,
      {
        id: coachIntegrationEventId,
        source_event_id: coachEventId,
        chapter_id: chapterId,
        event_type: "coach_decision_logged",
        destination: "internal",
        external_object_type: "phase_readiness_review",
        external_object_id: coachReviewId,
        status: "recorded",
        payload: {
          coachDecision: "intervene",
          liveExternalWrite: false,
        },
        created_by: "00000000-0000-4000-8000-000000000030",
        created_at: "2026-06-16T21:05:00Z",
        updated_at: "2026-06-16T21:05:00Z",
      },
    ],
    automationOutboxRows: [
      ...data.automationOutboxRows,
      {
        id: coachOutboxId,
        source_event_id: coachEventId,
        integration_event_id: coachIntegrationEventId,
        chapter_id: chapterId,
        destination: "n8n",
        event_type: "coach_decision_logged",
        payload: {
          coachDecision: "intervene",
          liveExternalWrite: false,
        },
        idempotency_key: "coach_decision:test",
        status: "disabled",
        attempt_count: 0,
        available_at: "2026-06-16T21:05:00Z",
        locked_at: null,
        sent_at: null,
        last_error: null,
        created_at: "2026-06-16T21:05:00Z",
        updated_at: "2026-06-16T21:05:00Z",
      },
    ],
    auditLogs: [
      ...data.auditLogs,
      {
        id: "94000000-0000-4000-8000-000000000001",
        actor_user_id: "00000000-0000-4000-8000-000000000030",
        chapter_id: chapterId,
        action: "coach_decision_logged",
        target_table: "phases",
        target_id: phaseId,
        before_value: {
          readinessStatus: "ready",
          coachValidationStatus: "pending",
        },
        after_value: {
          coachDecision: "intervene",
          readinessStatus: "blocked",
          coachValidationStatus: "blocked",
          reviewId: coachReviewId,
        },
        reason: "Local coach decision logging path.",
        created_at: "2026-06-16T21:05:00Z",
      },
    ],
  };
}

function makePhase(): PhaseRow {
  return {
    id: phaseId,
    chapter_id: chapterId,
    campaign_id: campaignId,
    phase_template_id: null,
    title: "Rush Month closeout",
    objective: "Decide whether the chapter should advance, hold, or receive intervention.",
    starts_at: "2026-06-16T00:00:00Z",
    ends_at: null,
    status: "active",
    readiness_status: "ready",
    coach_validation_status: "pending",
    required_outputs: [],
    entry_criteria: [],
    exit_criteria: [],
    created_at: "2026-06-16T00:00:00Z",
    updated_at: "2026-06-16T00:00:00Z",
  };
}
