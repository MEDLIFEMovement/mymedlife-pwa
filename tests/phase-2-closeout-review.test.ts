import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getPhase2CloseoutReview } from "@/services/phase-2-closeout-review";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";

describe("phase 2 closeout review", () => {
  it("gives admin one review-first route for the remaining Phase 2 packet decisions", () => {
    const review = getPhase2CloseoutReview(
      getMockLocalActorContext("admin@mymedlife.test"),
      getMockReadOnlyAppData("Testing Phase 2 closeout review."),
    );

    expect(review.canReadReview).toBe(true);
    expect(review.title).toBe("Admin Phase 2 closeout review");
    expect(review.packetPath).toBe(
      "docs/review/2026-06-24-phase-2-live-mvp-pilot-closeout-packet.md",
    );
    expect(review.counts.lanes).toBe(8);
    expect(review.counts.reviewNow).toBeGreaterThan(0);
    expect(review.counts.awaitingHumanConfirmation).toBeGreaterThan(0);
    expect(review.counts.blockedBeforePilot).toBeGreaterThan(0);
    expect(review.counts.criteriaReviewReadyInRepo).toBeGreaterThan(0);
    expect(review.counts.criteriaAwaitingHostedProof).toBeGreaterThan(0);
    expect(review.counts.browserWritesExpected).toBe(0);
    expect(review.counts.externalWritesExpected).toBe(0);
    expect(review.approvalReplyHint).toContain("Human approval is still required");
    expect(review.approvalReplyBlock.join("\n")).toContain(
      "Pilot chapter: UCLA MEDLIFE",
    );
    expect(review.doneCriteria).toHaveLength(8);
    expect(review.hostedEvidenceChecklist).toHaveLength(7);

    const laneHrefs = review.lanes.map((lane) => lane.href);
    expect(laneHrefs).toEqual(
      expect.arrayContaining([
        "/admin/release-readiness",
        "/admin/staff-dry-run",
        "/admin/design-qa",
        "/onboarding",
        "/admin/pilot-scope",
        "/admin/first-write",
        "/admin/proof-write",
        "/admin",
      ]),
    );

    expect(
      review.lanes.find((lane) => lane.key === "pilot_scope")?.evidence.join(" "),
    ).toContain("UCLA MEDLIFE");
    expect(
      review.lanes.find((lane) => lane.key === "pilot_scope")?.evidence.join(" "),
    ).toContain("owner slots");
    expect(
      review.lanes.find((lane) => lane.key === "closeout_packet")?.evidence.join(" "),
    ).toContain("Phase 2 closeout criteria are review-ready in repo");
    expect(
      review.lanes.find((lane) => lane.key === "auth_onboarding")?.evidence.join(" "),
    ).toContain("Vercel SSO");
    expect(
      review.lanes.find((lane) => lane.key === "auth_onboarding")?.evidence.join(" "),
    ).toContain("/login?next=/sso-api");
    expect(
      review.lanes.find((lane) => lane.key === "first_hosted_write")?.summary,
    ).toContain("action_started");
    expect(
      review.lanes.find((lane) => lane.key === "hosted_proof_loop")?.summary,
    ).toContain("proof metadata");
    expect(
      review.lanes.find((lane) => lane.key === "hosted_proof_loop")?.evidence.join(" "),
    ).toContain("Leader review readback");
    expect(
      review.doneCriteria.find((criterion) => criterion.key === "evidence_separation")
        ?.status,
    ).toBe("review_ready_in_repo");
    expect(
      review.doneCriteria.find((criterion) => criterion.key === "hosted_auth")
        ?.status,
    ).toBe("awaiting_hosted_proof");
    expect(
      review.doneCriteria.find((criterion) => criterion.key === "named_owners")
        ?.status,
    ).toBe("awaiting_human_confirmation");
    expect(review.hostedEvidenceChecklist.join(" ")).toContain(
      "approved staging reviewer path",
    );
    expect(review.hostedEvidenceChecklist.join(" ")).toContain(
      "/login?next=/sso-api",
    );
    expect(review.hostedEvidenceChecklist.join(" ")).toContain(
      "hosted `action_started` write",
    );
    expect(review.hostedEvidenceChecklist.join(" ")).toContain(
      "host-side Luma check-in",
    );
    expect(review.reviewerAction).toContain("approved as written");
  });

  it("shrinks the remaining human-decision list when pilot owners are already recorded", () => {
    const originalRollback = process.env.MYMEDLIFE_PILOT_ROLLBACK_OWNER;
    const originalSupport = process.env.MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL;
    const originalCoach = process.env.MYMEDLIFE_PILOT_COACH_OWNER;
    const originalDs = process.env.MYMEDLIFE_PILOT_DS_OWNER;
    const originalHq = process.env.MYMEDLIFE_PILOT_HQ_ADMIN_OWNER;
    const originalChapterLeader = process.env.MYMEDLIFE_PILOT_CHAPTER_LEADER_OWNER;

    process.env.MYMEDLIFE_PILOT_ROLLBACK_OWNER = "Kiomi Matsukawa";
    process.env.MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL = "#mymedlife-pilot-watch";
    process.env.MYMEDLIFE_PILOT_COACH_OWNER = "Priya Coach";
    process.env.MYMEDLIFE_PILOT_DS_OWNER = "Renato DS";
    process.env.MYMEDLIFE_PILOT_HQ_ADMIN_OWNER = "Maya HQ";
    process.env.MYMEDLIFE_PILOT_CHAPTER_LEADER_OWNER = "Jordan Chapter";

    try {
      const review = getPhase2CloseoutReview(
        getMockLocalActorContext("admin@mymedlife.test"),
        getMockReadOnlyAppData("Testing recorded Phase 2 approvals."),
      );

      expect(review.recordedAnswers).toEqual(
        expect.arrayContaining([
          "Rollback owner: Kiomi Matsukawa",
          "Support and pause channel: #mymedlife-pilot-watch",
        ]),
      );
      expect(review.requiredHumanDecisions.join(" ")).not.toContain(
        "support/pause channel",
      );
      expect(
        review.lanes.find((lane) => lane.key === "controlled_pilot_gate")?.evidence.join(" "),
      ).toContain("approval answers are already recorded");
    } finally {
      restoreEnv("MYMEDLIFE_PILOT_ROLLBACK_OWNER", originalRollback);
      restoreEnv("MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL", originalSupport);
      restoreEnv("MYMEDLIFE_PILOT_COACH_OWNER", originalCoach);
      restoreEnv("MYMEDLIFE_PILOT_DS_OWNER", originalDs);
      restoreEnv("MYMEDLIFE_PILOT_HQ_ADMIN_OWNER", originalHq);
      restoreEnv(
        "MYMEDLIFE_PILOT_CHAPTER_LEADER_OWNER",
        originalChapterLeader,
      );
    }
  });

  it("keeps member actors out of the Phase 2 closeout packet", () => {
    const review = getPhase2CloseoutReview(
      getMockLocalActorContext("member.a@mymedlife.test"),
      getMockReadOnlyAppData("Testing hidden Phase 2 closeout review."),
    );

    expect(review.canReadReview).toBe(false);
    expect(review.lanes).toEqual([]);
  });

  it("promotes hosted write and proof-loop lanes to signoff once readback evidence already exists", () => {
    const review = getPhase2CloseoutReview(
      getMockLocalActorContext("admin@mymedlife.test"),
      withHostedPhase2Evidence(),
    );

    expect(
      review.doneCriteria.find((criterion) => criterion.key === "first_hosted_write")
        ?.status,
    ).toBe("awaiting_human_confirmation");
    expect(
      review.doneCriteria.find((criterion) => criterion.key === "proof_loop")?.status,
    ).toBe("awaiting_human_confirmation");
    expect(
      review.doneCriteria.find((criterion) => criterion.key === "readback_surfaces")
        ?.status,
    ).toBe("awaiting_human_confirmation");
    expect(
      review.lanes.find((lane) => lane.key === "first_hosted_write")?.status,
    ).toBe("awaiting_human_confirmation");
    expect(
      review.lanes.find((lane) => lane.key === "hosted_proof_loop")?.status,
    ).toBe("awaiting_human_confirmation");
    expect(review.hostedEvidenceChecklist.join(" ")).toContain(
      "Record the current hosted `action_started` proof",
    );
    expect(review.hostedEvidenceChecklist.join(" ")).toContain(
      "Record the current hosted proof-loop evidence",
    );
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function withHostedPhase2Evidence(): ReadOnlyAppData {
  const assignmentId = "50000000-0000-4000-8000-000000000002";
  const actionStartedEventId = "80326f8b-2436-409b-9a7d-454006c76772";
  const actionStartedIntegrationEventId = "20033a9c-f891-43c6-88ca-0e3bf0b03a8c";
  const evidenceSubmittedEventId = "cca7640b-149f-45b7-8efe-c6c50b5815cf";
  const evidenceSubmittedIntegrationEventId = "b95589cd-1000-4435-a28d-3fbb9a168a4a";
  const evidenceItemId = "3e7b2ab6-8770-488f-9637-90cbaa863b62";
  const data = getMockReadOnlyAppData("Testing hosted Phase 2 evidence.");

  return {
    ...data,
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "Testing hosted staging readback evidence.",
    },
    assignments: data.assignments.map((assignment, index) => {
      if (index !== 0) {
        return assignment;
      }

      return {
        ...assignment,
        id: assignmentId,
        status: "submitted",
        lane: "Member",
        title: "Invite three more students to Rush Month",
      };
    }),
    evidenceItems: [
      {
        id: evidenceItemId,
        assignmentId,
        submittedBy: "Sofia Alvarez",
        evidenceType: "testimonial_text",
        summary:
          "Hosted staging proof drill: Sofia finished the Rush Month outreach follow-up and captured the exact member invite context for leader review.",
        status: "pending_review",
      },
    ],
    eventRows: [
      {
        id: "luma-pilot-event-created",
        event_type: "luma_event_upserted",
        actor_user_id: "00000000-0000-4000-8000-000000000010",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: null,
        chapter_event_id: "evt-bJE178Q02N5DaLH",
        payload: {
          source: "luma_live_pilot",
        },
        correlation_id: "luma-pilot:event-created",
        occurred_at: "2026-06-29T15:20:00Z",
        created_at: "2026-06-29T15:20:00Z",
      },
      {
        id: "luma-pilot-rsvp",
        event_type: "event_rsvp_recorded",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: null,
        chapter_event_id: "evt-bJE178Q02N5DaLH",
        payload: {
          source: "luma_live_pilot",
          rsvpCount: 4,
        },
        correlation_id: "luma-pilot:rsvp",
        occurred_at: "2026-06-29T15:40:00Z",
        created_at: "2026-06-29T15:40:00Z",
      },
      {
        id: "luma-pilot-attendance",
        event_type: "event_attendance_recorded",
        actor_user_id: "00000000-0000-4000-8000-000000000010",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: null,
        chapter_event_id: "evt-bJE178Q02N5DaLH",
        payload: {
          source: "luma_live_pilot",
          attendanceCount: 2,
        },
        correlation_id: "luma-pilot:attendance",
        occurred_at: "2026-06-29T16:05:00Z",
        created_at: "2026-06-29T16:05:00Z",
      },
      {
        id: actionStartedEventId,
        event_type: "action_started",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: assignmentId,
        chapter_event_id: null,
        payload: {
          source: "app.start_assignment_action",
        },
        correlation_id: "action_started:assignment-2:member-1",
        occurred_at: "2026-06-29T15:33:24Z",
        created_at: "2026-06-29T15:33:24Z",
      },
      {
        id: evidenceSubmittedEventId,
        event_type: "evidence_submitted",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: assignmentId,
        chapter_event_id: null,
        payload: {
          source: "app.submit_proof_metadata",
          evidenceItemId,
        },
        correlation_id: "evidence_submitted:assignment-2:member-1",
        occurred_at: "2026-06-29T15:51:53Z",
        created_at: "2026-06-29T15:51:53Z",
      },
    ],
    integrationEventRows: [
      {
        id: actionStartedIntegrationEventId,
        source_event_id: actionStartedEventId,
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
        created_at: "2026-06-29T15:33:24Z",
        updated_at: "2026-06-29T15:33:24Z",
      },
      {
        id: evidenceSubmittedIntegrationEventId,
        source_event_id: evidenceSubmittedEventId,
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
        created_at: "2026-06-29T15:51:53Z",
        updated_at: "2026-06-29T15:51:53Z",
      },
      {
        id: "luma-pilot-linked",
        source_event_id: "luma-pilot-event-created",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "luma_event_linked",
        destination: "luma",
        external_object_type: "chapter_event",
        external_object_id: "evt-bJE178Q02N5DaLH",
        status: "recorded",
        payload: {
          source: "luma_live_pilot",
        },
        created_by: "00000000-0000-4000-8000-000000000010",
        created_at: "2026-06-29T15:20:00Z",
        updated_at: "2026-06-29T15:20:00Z",
      },
      {
        id: "luma-pilot-rsvp-integration",
        source_event_id: "luma-pilot-rsvp",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "luma_rsvp_recorded",
        destination: "internal",
        external_object_type: "chapter_event",
        external_object_id: "evt-bJE178Q02N5DaLH",
        status: "recorded",
        payload: {
          source: "luma_live_pilot",
          rsvpCount: 4,
        },
        created_by: "00000000-0000-4000-8000-000000000010",
        created_at: "2026-06-29T15:40:00Z",
        updated_at: "2026-06-29T15:40:00Z",
      },
      {
        id: "luma-pilot-attendance-integration",
        source_event_id: "luma-pilot-attendance",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "luma_attendance_imported",
        destination: "internal",
        external_object_type: "chapter_event",
        external_object_id: "evt-bJE178Q02N5DaLH",
        status: "recorded",
        payload: {
          source: "luma_live_pilot",
          attendanceCount: 2,
        },
        created_by: "00000000-0000-4000-8000-000000000010",
        created_at: "2026-06-29T16:05:00Z",
        updated_at: "2026-06-29T16:05:00Z",
      },
    ],
    automationOutboxRows: [
      {
        id: "e80798d1-18cb-4441-8d94-84a56bc1ad0c",
        source_event_id: evidenceSubmittedEventId,
        integration_event_id: evidenceSubmittedIntegrationEventId,
        chapter_id: "10000000-0000-4000-8000-000000000001",
        destination: "n8n",
        event_type: "evidence_submitted",
        payload: {
          disabled: true,
        },
        idempotency_key: "evidence_submitted:assignment-2:member-1",
        status: "disabled",
        attempt_count: 0,
        available_at: "2026-06-29T15:51:53Z",
        locked_at: null,
        sent_at: null,
        last_error: null,
        created_at: "2026-06-29T15:51:53Z",
        updated_at: "2026-06-29T15:51:53Z",
      },
    ],
    auditLogs: [
      {
        id: "99ad7242-b46c-48d4-a573-79eef122fa74",
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
          eventId: actionStartedEventId,
        },
        reason: "Hosted preview action-start proof save.",
        created_at: "2026-06-29T15:33:24Z",
      },
      {
        id: "bf1c1538-6983-46f6-b0f5-d4053be65da5",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        action: "evidence_submitted",
        target_table: "evidence_items",
        target_id: evidenceItemId,
        before_value: null,
        after_value: {
          assignmentId,
          eventId: evidenceSubmittedEventId,
        },
        reason: "Hosted preview proof metadata save.",
        created_at: "2026-06-29T15:51:53Z",
      },
    ],
    pointsEventRows: [
      {
        id: "00000000-0000-4000-8000-000000000901",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: null,
        chapter_event_id: "evt-bJE178Q02N5DaLH",
        evidence_item_id: null,
        approval_id: null,
        awarded_to_user_id: "00000000-0000-4000-8000-000000000001",
        points_delta: 20,
        reason: "Attendance confirmed for Intro GBM",
        created_by: "00000000-0000-4000-8000-000000000010",
        created_at: "2026-06-29T16:05:00Z",
      },
    ],
  };
}
