import { describe, expect, it } from "vitest";
import {
  getMockReadOnlyAppData,
  getSupabaseReadOnlyAppData,
  readLocalDataSnapshot,
} from "@/services/read-only-app-data";
import type { SupabaseReadonlyClient } from "@/lib/supabase-readonly";

describe("read-only app data service", () => {
  it("keeps mock fallback available", () => {
    const data = getMockReadOnlyAppData("Testing fallback.");

    expect(data.source.status).toBe("mock_fallback");
    expect(data.chapter.name).toContain("UCLA");
    expect(data.assignments.length).toBeGreaterThan(0);
  });

  it("reads every Goal 8 table in the local data snapshot", async () => {
    const requestedTables: string[] = [];
    const client = createFakeClient({}, requestedTables);

    await readLocalDataSnapshot(client);

    expect(requestedTables).toEqual([
      "profiles",
      "memberships",
      "chapters",
      "campaigns",
      "phases",
      "assignments",
      "campaign_templates",
      "campaign_phase_templates",
      "campaign_role_assignments",
      "phase_readiness_reviews",
      "risk_flags",
      "campaign_closeouts",
      "evidence_items",
      "chapter_events",
      "luma_event_links",
      "chapter_luma_calendars",
      "events",
      "points_events",
      "kpi_events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ]);
  });

  it("maps fake local Supabase rows into the app read model", async () => {
    const data = await getSupabaseReadOnlyAppData(createFakeClient(fakeRows));

    expect(data.source.status).toBe("supabase_ready");
    expect(data.chapter.name).toBe("UCLA MEDLIFE");
    expect(data.campaign.name).toBe("Rush Month");
    expect(data.campaign.weekLabel).toBe("Invite week");
    expect(data.chapterRows).toHaveLength(1);
    expect(data.campaignRows).toHaveLength(1);
    expect(data.assignments).toEqual([
      expect.objectContaining({
        title: "Invite three students",
        lane: "Member",
        ownerRole: "General Member",
      }),
    ]);
    expect(data.campaignTemplates).toHaveLength(1);
    expect(data.campaignRoleAssignments).toHaveLength(1);
    expect(data.readinessReviews).toHaveLength(1);
    expect(data.riskFlags).toHaveLength(1);
    expect(data.closeouts).toHaveLength(1);
    expect(data.evidenceItems).toEqual([
      expect.objectContaining({
        id: "evidence-1",
        assignmentId: "assignment-1",
        status: "pending_review",
      }),
    ]);
    expect(data.chapterEventRows).toEqual([
      expect.objectContaining({
        id: "chapter-event-1",
        title: "Intro GBM",
      }),
    ]);
    expect(data.lumaEventLinkRows).toEqual([
      expect.objectContaining({
        id: "luma-link-1",
        luma_event_id: "evt-1",
      }),
    ]);
    expect(data.chapterLumaCalendarRows).toEqual([
      expect.objectContaining({
        id: "chapter-luma-1",
        chapter_id: "chapter-1",
        calendar_id: "cal-ucla-1234",
      }),
    ]);
    expect(data.eventRows).toHaveLength(1);
    expect(data.allChapterEventRows).toHaveLength(1);
    expect(data.allLumaEventLinkRows).toHaveLength(1);
    expect(data.allPointsEventRows).toHaveLength(1);
    expect(data.pointsEventRows).toHaveLength(1);
    expect(data.kpiEventRows).toHaveLength(1);
    expect(data.integrationEventRows).toHaveLength(1);
    expect(data.automationOutboxRows).toHaveLength(1);
    expect(data.auditLogs).toHaveLength(1);
    expect(data.pointsEvents).toEqual([
      expect.objectContaining({
        id: "points-1",
        assignmentId: "assignment-1",
        points: 15,
      }),
    ]);
    expect(data.kpiEvents).toEqual([
      expect.objectContaining({
        id: "kpi-1",
        assignmentId: "assignment-1",
        metric: "students_invited",
        value: 4,
      }),
    ]);
    expect(data.pointsSummary).toEqual({
      earned: 15,
      available: 15,
      approvedActions: 1,
    });
    expect(data.kpiSummary).toEqual({
      invitePushes: 4,
      proofPending: 0,
      eventsLinked: 0,
      coachDecision: "hold",
    });
    expect(data.metricsPosture).toEqual({
      points: "points_events",
      kpis: "kpi_events",
      leaderboard: "mock_safe",
    });
    expect(data.integrationEvents).toEqual([
      expect.objectContaining({
        id: "integration-1",
        eventType: "action_started",
        destination: "internal",
        status: "recorded",
      }),
    ]);
    expect(data.outboxItems).toEqual([
      expect.objectContaining({
        id: "outbox-1",
        destination: "n8n",
        status: "disabled",
      }),
    ]);
  });
});

function createFakeClient(
  rows: Record<string, unknown[]> = fakeRows,
  requestedTables: string[] = [],
): SupabaseReadonlyClient {
  return {
    async selectRows<TRow>(tableName: string): Promise<TRow[]> {
      requestedTables.push(tableName);
      return (rows[tableName] ?? []) as TRow[];
    },
  };
}

const fakeRows: Record<string, unknown[]> = {
  chapters: [
    {
      id: "chapter-1",
      name: "UCLA MEDLIFE",
      campus: "UCLA",
      region: "Midwest",
      status: "active",
      created_by: "admin-1",
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  campaigns: [
    {
      id: "campaign-1",
      chapter_id: "chapter-1",
      campaign_template_id: "template-1",
      name: "Rush Month",
      slug: "rush-month-2026",
      objective: "Turn campus interest into action.",
      status: "active",
      semester: "Fall",
      academic_year: "2026-2027",
      opened_by: "leader-1",
      opened_at: "2026-06-15T00:00:00Z",
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  phases: [
    {
      id: "phase-1",
      chapter_id: "chapter-1",
      campaign_id: "campaign-1",
      phase_template_id: "phase-template-1",
      title: "Invite week",
      objective: "Invite students.",
      starts_at: null,
      ends_at: null,
      status: "active",
      readiness_status: "ready",
      coach_validation_status: "pending",
      required_outputs: [],
      entry_criteria: [],
      exit_criteria: [],
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  assignments: [
    {
      id: "assignment-1",
      chapter_id: "chapter-1",
      campaign_id: "campaign-1",
      phase_id: "phase-1",
      action_template_id: null,
      action_committee_id: null,
      chapter_event_id: null,
      title: "Invite three students",
      instructions: "Invite three students and submit a reflection.",
      assigned_to_user_id: "member-1",
      assigned_to_role_key: "general_member",
      assigned_by_user_id: "leader-1",
      status: "in_progress",
      due_at: null,
      evidence_required: "Short reflection.",
      points: 15,
      kpi_key: "students_invited",
      priority: "high",
      expected_output: "Three invites.",
      support_role_labels: ["Recruitment Director"],
      late_next_step: "Leader checks in.",
      risk_flagged: false,
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  campaign_templates: [
    {
      id: "template-1",
      registry_key: "coach_02_rush_recruitment_campus_awareness",
      name: "Rush / Recruitment / Campus Awareness",
      slug: "rush-recruitment-campus-awareness",
      audience: "coach_and_chapter",
      summary: "Rush Month operating template.",
      annual_order: 20,
      status: "active",
      default_kpis: [],
      source_metadata: {},
      created_by: "admin-1",
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  campaign_phase_templates: [
    {
      id: "phase-template-1",
      campaign_template_id: "template-1",
      title: "Invite week",
      phase_order: 1,
      objective: "Invite students.",
      entry_criteria: [],
      exit_criteria: [],
      required_outputs: [],
      coach_validation_required: true,
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  campaign_role_assignments: [
    {
      id: "lane-1",
      chapter_id: "chapter-1",
      campaign_id: "campaign-1",
      user_id: "leader-1",
      role_key: "rush_recruitment_director",
      role_label: "Rush Recruitment Director",
      lane: "recruitment",
      status: "active",
      starts_at: "2026-06-15",
      ends_at: null,
      assigned_by: "admin-1",
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  phase_readiness_reviews: [
    {
      id: "readiness-1",
      chapter_id: "chapter-1",
      campaign_id: "campaign-1",
      phase_id: "phase-1",
      reviewer_user_id: "coach-1",
      readiness_status: "ready",
      decision_note: "Ready with follow-up risk.",
      blocker_summary: null,
      reviewed_at: "2026-06-15T00:00:00Z",
      created_at: "2026-06-15T00:00:00Z",
    },
  ],
  risk_flags: [
    {
      id: "risk-1",
      chapter_id: "chapter-1",
      campaign_id: "campaign-1",
      phase_id: "phase-1",
      assignment_id: "assignment-1",
      chapter_event_id: null,
      severity: "medium",
      visibility: "leader_visible",
      signal: "Follow-up owner not confirmed.",
      root_cause: null,
      owner_user_id: "leader-1",
      response_plan: "Confirm owner before next event.",
      status: "watching",
      due_at: null,
      created_by: "coach-1",
      resolved_at: null,
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  campaign_closeouts: [
    {
      id: "closeout-1",
      chapter_id: "chapter-1",
      campaign_id: "campaign-1",
      status: "draft",
      submitted_by: "leader-1",
      validated_by: null,
      goals_summary: "Invite students.",
      results_summary: "In progress.",
      kpi_summary: {},
      proof_summary: null,
      top_contributors: [],
      lessons_learned: null,
      unresolved_risks: null,
      recommendations: null,
      next_handoff: null,
      submitted_at: null,
      validated_at: null,
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  evidence_items: [
    {
      id: "evidence-1",
      assignment_id: "assignment-1",
      chapter_id: "chapter-1",
      chapter_event_id: null,
      submitted_by_user_id: "member-1",
      evidence_type: "testimonial_text",
      summary: "This local testimonial explains why the invite push mattered.",
      url: null,
      storage_path: null,
      target_audiences: ["student"],
      proof_categories: ["rush_month"],
      messenger_type: "student",
      lifecycle_stage: "rush_month",
      hesitation_addressed: "Will I belong?",
      status: "pending_review",
      sharing_status: "submitted",
      nps_score: null,
      activity_label: "Invite push",
      submitted_at: "2026-06-15T00:00:00Z",
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  chapter_events: [
    {
      id: "chapter-event-1",
      chapter_id: "chapter-1",
      campaign_id: "campaign-1",
      phase_id: "phase-1",
      action_committee_id: null,
      assignment_id: "assignment-1",
      title: "Intro GBM",
      event_type: "social",
      status: "published",
      planned_by_user_id: "leader-1",
      owner_user_id: "leader-1",
      starts_at: "2026-06-16T18:00:00Z",
      ends_at: "2026-06-16T20:00:00Z",
      promotion_summary: "Member recruitment event.",
      attendance_count: 18,
      eligible_member_count: 42,
      attendance_rate: 0.42,
      nps_score: 70,
      feedback_summary: "Strong turnout.",
      warehouse_status: "disabled",
      luma_event_link_id: "luma-link-1",
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  luma_event_links: [
    {
      id: "luma-link-1",
      chapter_id: "chapter-1",
      campaign_id: "campaign-1",
      phase_id: "phase-1",
      chapter_event_id: "chapter-event-1",
      luma_event_id: "evt-1",
      luma_event_url: "https://lu.ma/evt-1",
      status: "mocked",
      linked_by: "leader-1",
      linked_at: "2026-06-15T00:00:00Z",
      last_imported_at: null,
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  chapter_luma_calendars: [
    {
      id: "chapter-luma-1",
      chapter_id: "chapter-1",
      environment: "local",
      calendar_id: "cal-ucla-1234",
      calendar_label: "UCLA chapter calendar",
      is_default: false,
      status: "linked",
      linked_by: "leader-1",
      linked_at: "2026-06-15T00:00:00Z",
      notes: "Saved in app for the local event loop.",
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  events: [
    {
      id: "event-1",
      event_type: "action_started",
      actor_user_id: "member-1",
      chapter_id: "chapter-1",
      campaign_id: "campaign-1",
      assignment_id: "assignment-1",
      chapter_event_id: null,
      payload: {
        source: "app.start_assignment_action",
      },
      correlation_id: "action_started:assignment-1:member-1",
      occurred_at: "2026-06-15T00:00:00Z",
      created_at: "2026-06-15T00:00:00Z",
    },
  ],
  points_events: [
    {
      id: "points-1",
      chapter_id: "chapter-1",
      campaign_id: "campaign-1",
      assignment_id: "assignment-1",
      chapter_event_id: null,
      evidence_item_id: null,
      approval_id: null,
      awarded_to_user_id: "member-1",
      points_delta: 15,
      reason: "Approved assignment.",
      created_by: "leader-1",
      created_at: "2026-06-15T00:00:00Z",
    },
  ],
  kpi_events: [
    {
      id: "kpi-1",
      chapter_id: "chapter-1",
      campaign_id: "campaign-1",
      phase_id: "phase-1",
      assignment_id: "assignment-1",
      chapter_event_id: null,
      evidence_item_id: null,
      metric_key: "students_invited",
      metric_value: 4,
      unit: "students",
      source: "test_seed",
      created_by: "leader-1",
      created_at: "2026-06-15T00:00:00Z",
    },
  ],
  integration_events: [
    {
      id: "integration-1",
      source_event_id: "event-1",
      chapter_id: "chapter-1",
      event_type: "action_started",
      destination: "internal",
      external_object_type: "assignment",
      external_object_id: "assignment-1",
      status: "recorded",
      payload: {
        liveExternalWrite: false,
      },
      created_by: "member-1",
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  automation_outbox: [
    {
      id: "outbox-1",
      source_event_id: "event-other",
      integration_event_id: null,
      chapter_id: "chapter-1",
      destination: "n8n",
      event_type: "action_assigned",
      payload: {
        sendReminder: false,
      },
      idempotency_key: "action_assigned:assignment-1",
      status: "disabled",
      attempt_count: 0,
      available_at: "2026-06-15T00:00:00Z",
      locked_at: null,
      sent_at: null,
      last_error: null,
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  audit_logs: [
    {
      id: "audit-1",
      actor_user_id: "member-1",
      chapter_id: "chapter-1",
      action: "action_started",
      target_table: "assignments",
      target_id: "assignment-1",
      before_value: {
        status: "not_started",
      },
      after_value: {
        status: "in_progress",
      },
      reason: "Local action start test.",
      created_at: "2026-06-15T00:00:00Z",
    },
  ],
};
