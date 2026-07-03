import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  canActorConfigureLumaStatus,
  canActorCreateChapterEvent,
  canActorRsvpToEvent,
  canActorViewEventAnalytics,
  createEmptyStagingLumaEventLoop,
  getStagingLumaCrossRoleProof,
  getStagingLumaEventLoopReadModel,
  prepStagingLumaEvent,
  recordEventAttendanceAndAwardPoints,
  recordLumaSyncFailure,
  recordMemberEventRsvp,
  shareStagingEventToFeed,
  summarizeStagingLumaEventLoop,
} from "@/services/staging-luma-event-loop";

describe("staging Luma event loop", () => {
  it("models leader event prep, Luma link, QR, feed share, RSVP, attendance, and points", () => {
    const leader = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      undefined,
      "mock_fallback",
      "local_actor_email",
      "signed_in",
    );
    const member = getMockLocalActorContext(
      "member.a@mymedlife.test",
      undefined,
      "mock_fallback",
      "local_actor_email",
      "signed_in",
    );

    let state = createEmptyStagingLumaEventLoop({ mode: "staging" });
    state = prepStagingLumaEvent(state, leader);
    state = shareStagingEventToFeed(state, leader);
    state = recordMemberEventRsvp(state, member);
    state = recordEventAttendanceAndAwardPoints(state, leader, {
      userId: member.user.id,
      userEmail: member.user.email,
    });

    const summary = summarizeStagingLumaEventLoop(state);

    expect(summary).toMatchObject({
      mode: "staging",
      eventStored: true,
      lumaLinkReady: true,
      qrReady: true,
      sharedToFeed: true,
      rsvpCount: 1,
      attendanceCount: 1,
      pointsAwarded: 20,
      externalWritesEnabled: false,
    });
    expect(state.providerLink).toMatchObject({
      provider: "luma",
      status: "attached",
      browserSafeKeyExposure: false,
    });
    expect(state.integrationEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "event_created",
        "luma_event_create_requested",
        "luma_event_linked",
        "event_shared_to_feed",
        "event_rsvp_link_generated",
        "event_qr_generated",
        "event_rsvp_recorded",
        "event_attendance_recorded",
        "event_points_awarded",
      ]),
    );
    expect(state.automationOutbox.every((item) => item.status === "disabled")).toBe(
      true,
    );
  });

  it("prevents duplicate points for the same member and event", () => {
    const leader = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      undefined,
      "mock_fallback",
      "local_actor_email",
      "signed_in",
    );
    const member = getMockLocalActorContext(
      "member.a@mymedlife.test",
      undefined,
      "mock_fallback",
      "local_actor_email",
      "signed_in",
    );

    let state = prepStagingLumaEvent(
      createEmptyStagingLumaEventLoop({ mode: "mock" }),
      leader,
    );
    state = recordEventAttendanceAndAwardPoints(state, leader, {
      userId: member.user.id,
      userEmail: member.user.email,
    });
    state = recordEventAttendanceAndAwardPoints(state, leader, {
      userId: member.user.id,
      userEmail: member.user.email,
    });

    expect(state.attendance).toHaveLength(1);
    expect(state.pointsEvents).toHaveLength(1);
    expect(summarizeStagingLumaEventLoop(state).pointsAwarded).toBe(20);
  });

  it("keeps role permissions scoped to the right workspace and chapter", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const staff = getMockLocalActorContext("general.staff@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(canActorCreateChapterEvent(member, "UCLA MEDLIFE")).toBe(false);
    expect(canActorCreateChapterEvent(leader, "UCLA MEDLIFE")).toBe(true);
    expect(canActorCreateChapterEvent(leader, "Boston College MEDLIFE")).toBe(false);
    expect(canActorRsvpToEvent(member)).toBe(true);
    expect(canActorRsvpToEvent(leader)).toBe(false);
    expect(canActorViewEventAnalytics(coach, "UCLA MEDLIFE")).toBe(true);
    expect(canActorViewEventAnalytics(staff, "UCLA MEDLIFE")).toBe(true);
    expect(canActorConfigureLumaStatus(dsAdmin)).toBe(true);
    expect(canActorConfigureLumaStatus(superAdmin)).toBe(true);
    expect(canActorConfigureLumaStatus(staff)).toBe(false);
  });

  it("keeps disabled and live-ready modes from exposing Luma links", () => {
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");

    const disabled = prepStagingLumaEvent(
      createEmptyStagingLumaEventLoop({ mode: "disabled" }),
      leader,
    );
    const liveReady = prepStagingLumaEvent(
      createEmptyStagingLumaEventLoop({ mode: "live_ready_not_enabled" }),
      leader,
    );

    expect(disabled.providerLink?.publicUrl).toBeNull();
    expect(disabled.providerLink?.qrCodeValue).toBeNull();
    expect(liveReady.providerLink?.status).toBe("requested");
    expect(liveReady.providerLink?.publicUrl).toBeNull();
    expect(
      liveReady.integrationEvents.find(
        (event) => event.eventType === "luma_event_create_requested",
      )?.status,
    ).toBe("disabled");
  });

  it("records Luma sync failure only through DS/Admin provider controls", () => {
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const state = createEmptyStagingLumaEventLoop({ mode: "staging" });

    expect(() => recordLumaSyncFailure(state, leader)).toThrow(
      "Only DS Admin or Super Admin",
    );

    const result = recordLumaSyncFailure(state, dsAdmin);

    expect(result.integrationEvents).toEqual([
      expect.objectContaining({
        eventType: "luma_sync_failed",
        destination: "Luma",
        status: "disabled",
      }),
    ]);
    expect(result.auditRecords).toHaveLength(1);
  });

  it("exposes a shared read model for visible role surfaces", () => {
    const readModel = getStagingLumaEventLoopReadModel("staging");

    expect(readModel.providerStatusLabel).toBe("Staging-safe link attached");
    expect(readModel.summary).toMatchObject({
      eventStored: true,
      lumaLinkReady: true,
      qrReady: true,
      sharedToFeed: true,
      rsvpCount: 1,
      attendanceCount: 1,
      pointsAwarded: 20,
      duplicatePointsPrevented: true,
      externalWritesEnabled: false,
    });
    expect(readModel.sequence.map((step) => step.eventType)).toEqual([
      "event_created",
      "luma_event_linked",
      "event_shared_to_feed",
      "event_rsvp_recorded",
      "event_points_awarded",
    ]);
    expect(readModel.safetyNotes.join(" ")).not.toContain("key=");
  });

  it("can derive the staging read model from stored evidence rows", () => {
    const readModel = getStagingLumaEventLoopReadModel({
      mode: "staging",
      data: {
        eventRows: [
          {
            id: "event-1",
            event_type: "event_rsvp_recorded",
            actor_user_id: "leader-1",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "chapter-event-1",
            payload: { rsvpCount: 3 },
            correlation_id: null,
            occurred_at: "2026-06-28T10:00:00Z",
            created_at: "2026-06-28T10:00:00Z",
          },
          {
            id: "event-2",
            event_type: "event_attendance_recorded",
            actor_user_id: "leader-1",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "chapter-event-1",
            payload: { attendanceCount: 2 },
            correlation_id: null,
            occurred_at: "2026-06-28T10:05:00Z",
            created_at: "2026-06-28T10:05:00Z",
          },
        ],
        integrationEventRows: [
          {
            id: "integration-1",
            source_event_id: "event-1",
            chapter_id: "chapter-1",
            event_type: "luma_event_linked",
            destination: "luma",
            external_object_type: "event",
            external_object_id: "evt_123",
            status: "recorded",
            payload: {},
            created_by: "leader-1",
            created_at: "2026-06-28T10:01:00Z",
            updated_at: "2026-06-28T10:01:00Z",
          },
        ],
        automationOutboxRows: [
          {
            id: "outbox-1",
            source_event_id: "event-1",
            integration_event_id: "integration-1",
            chapter_id: "chapter-1",
            destination: "luma",
            event_type: "luma_event_linked",
            payload: {},
            idempotency_key: "luma-1",
            status: "disabled",
            attempt_count: 0,
            available_at: "2026-06-28T10:01:00Z",
            locked_at: null,
            sent_at: null,
            last_error: null,
            created_at: "2026-06-28T10:01:00Z",
            updated_at: "2026-06-28T10:01:00Z",
          },
        ],
        pointsEventRows: [
          {
            id: "points-1",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "chapter-event-1",
            evidence_item_id: null,
            approval_id: null,
            awarded_to_user_id: "member-1",
            points_delta: 20,
            reason: "Attendance confirmed for Intro GBM",
            created_by: "leader-1",
            created_at: "2026-06-28T10:07:00Z",
          },
          {
            id: "points-2",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "chapter-event-1",
            evidence_item_id: null,
            approval_id: null,
            awarded_to_user_id: "member-2",
            points_delta: 15,
            reason: "Attendance confirmed for Intro GBM",
            created_by: "leader-1",
            created_at: "2026-06-28T10:08:00Z",
          },
        ],
      },
    });

    expect(readModel.providerStatusLabel).toBe("Staging evidence rows recorded");
    expect(readModel.summary).toMatchObject({
      eventStored: true,
      lumaLinkReady: true,
      qrReady: true,
      sharedToFeed: false,
      rsvpCount: 3,
      attendanceCount: 2,
      pointsAwarded: 35,
      duplicatePointsPrevented: true,
      externalWritesEnabled: false,
    });
  });

  it("prefers explicit Luma pilot evidence rows over older seeded chapter rows", () => {
    const readModel = getStagingLumaEventLoopReadModel({
      mode: "staging",
      data: {
        eventRows: [
          {
            id: "seed-event",
            event_type: "luma_attendance_import_mocked",
            actor_user_id: "seed-user",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "seed-chapter-event",
            payload: { attendanceCount: 24 },
            correlation_id: "seed",
            occurred_at: "2026-06-01T10:00:00Z",
            created_at: "2026-06-01T10:00:00Z",
          },
          {
            id: "pilot-rsvp",
            event_type: "event_rsvp_recorded",
            actor_user_id: "pilot-user",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "pilot-chapter-event",
            payload: { source: "luma_live_pilot", rsvpCount: 1 },
            correlation_id: "luma-pilot:rsvp:evt-123:user-1",
            occurred_at: "2026-06-28T10:00:00Z",
            created_at: "2026-06-28T10:00:00Z",
          },
          {
            id: "pilot-attendance",
            event_type: "event_attendance_recorded",
            actor_user_id: "pilot-user",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "pilot-chapter-event",
            payload: { source: "luma_live_pilot", attendanceCount: 1 },
            correlation_id: "luma-pilot:attendance:evt-123:1",
            occurred_at: "2026-06-28T10:05:00Z",
            created_at: "2026-06-28T10:05:00Z",
          },
        ],
        integrationEventRows: [
          {
            id: "pilot-link",
            source_event_id: "pilot-rsvp",
            chapter_id: "chapter-1",
            event_type: "luma_event_linked",
            destination: "luma",
            external_object_type: "event",
            external_object_id: "evt-123",
            status: "recorded",
            payload: { source: "luma_live_pilot" },
            created_by: "pilot-user",
            created_at: "2026-06-28T10:01:00Z",
            updated_at: "2026-06-28T10:01:00Z",
          },
          {
            id: "pilot-feed",
            source_event_id: "pilot-rsvp",
            chapter_id: "chapter-1",
            event_type: "event_shared_to_feed",
            destination: "internal",
            external_object_type: "chapter_event",
            external_object_id: "pilot-chapter-event",
            status: "recorded",
            payload: { source: "luma_live_pilot" },
            created_by: "pilot-user",
            created_at: "2026-06-28T10:02:00Z",
            updated_at: "2026-06-28T10:02:00Z",
          },
        ],
        automationOutboxRows: [
          {
            id: "pilot-outbox",
            source_event_id: "pilot-rsvp",
            integration_event_id: "pilot-link",
            chapter_id: "chapter-1",
            destination: "n8n",
            event_type: "luma_event_external_send_blocked",
            payload: { source: "luma_live_pilot" },
            idempotency_key: "luma-pilot:event:evt-123:blocked",
            status: "disabled",
            attempt_count: 0,
            available_at: "2026-06-28T10:00:00Z",
            locked_at: null,
            sent_at: null,
            last_error: null,
            created_at: "2026-06-28T10:00:00Z",
            updated_at: "2026-06-28T10:00:00Z",
          },
        ],
        pointsEventRows: [
          {
            id: "seed-points",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "seed-chapter-event",
            evidence_item_id: null,
            approval_id: null,
            awarded_to_user_id: "seed-user",
            points_delta: 50,
            reason: "Seeded chapter points",
            created_by: "seed-user",
            created_at: "2026-06-01T10:00:00Z",
          },
          {
            id: "pilot-points",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "pilot-chapter-event",
            evidence_item_id: null,
            approval_id: null,
            awarded_to_user_id: "pilot-user",
            points_delta: 20,
            reason: "Luma pilot attendance confirmed for Intro GBM",
            created_by: "pilot-user",
            created_at: "2026-06-28T10:05:00Z",
          },
        ],
      },
    });

    expect(readModel.summary).toMatchObject({
      rsvpCount: 1,
      attendanceCount: 1,
      pointsAwarded: 20,
      sharedToFeed: true,
      lumaLinkReady: true,
    });
  });

  it("derives cross-role proof verdicts from stored staging evidence", () => {
    const proof = getStagingLumaCrossRoleProof({
      mode: "staging",
      data: {
        eventRows: [
          {
            id: "pilot-rsvp",
            event_type: "event_rsvp_recorded",
            actor_user_id: "member-1",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "pilot-chapter-event",
            payload: { source: "luma_live_pilot", rsvpCount: 1 },
            correlation_id: "luma-pilot:rsvp:evt-123:user-1",
            occurred_at: "2026-06-28T10:00:00Z",
            created_at: "2026-06-28T10:00:00Z",
          },
          {
            id: "pilot-attendance",
            event_type: "event_attendance_recorded",
            actor_user_id: "leader-1",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "pilot-chapter-event",
            payload: {
              source: "luma_live_pilot",
              attendanceCount: 1,
              importedGuestCount: 1,
            },
            correlation_id: "luma-pilot:attendance:evt-123:1",
            occurred_at: "2026-06-28T10:05:00Z",
            created_at: "2026-06-28T10:05:00Z",
          },
        ],
        integrationEventRows: [
          {
            id: "pilot-link",
            source_event_id: "pilot-rsvp",
            chapter_id: "chapter-1",
            event_type: "luma_event_linked",
            destination: "luma",
            external_object_type: "event",
            external_object_id: "evt-123",
            status: "recorded",
            payload: { source: "luma_live_pilot" },
            created_by: "leader-1",
            created_at: "2026-06-28T10:01:00Z",
            updated_at: "2026-06-28T10:01:00Z",
          },
        ],
        automationOutboxRows: [
          {
            id: "pilot-outbox",
            source_event_id: "pilot-attendance",
            integration_event_id: "pilot-link",
            chapter_id: "chapter-1",
            destination: "n8n",
            event_type: "luma_attendance_external_send_blocked",
            payload: { source: "luma_live_pilot" },
            idempotency_key: "luma-pilot:attendance:evt-123",
            status: "disabled",
            attempt_count: 0,
            available_at: "2026-06-28T10:05:00Z",
            locked_at: null,
            sent_at: null,
            last_error: null,
            created_at: "2026-06-28T10:05:00Z",
            updated_at: "2026-06-28T10:05:00Z",
          },
        ],
        pointsEventRows: [
          {
            id: "pilot-points",
            chapter_id: "chapter-1",
            campaign_id: null,
            assignment_id: null,
            chapter_event_id: "pilot-chapter-event",
            evidence_item_id: null,
            approval_id: null,
            awarded_to_user_id: "member-1",
            points_delta: 20,
            reason: "Luma pilot attendance confirmed for Intro GBM",
            created_by: "leader-1",
            created_at: "2026-06-28T10:05:00Z",
          },
        ],
        auditLogRows: [
          {
            id: "audit-1",
            actor_user_id: "leader-1",
            chapter_id: "chapter-1",
            action: "luma_attendance_import_recorded",
            target_table: "chapter_events",
            target_id: "pilot-chapter-event",
            before_value: { source: "luma_live_pilot", attendanceCount: 0 },
            after_value: { source: "luma_live_pilot", attendanceCount: 1 },
            reason: "Recorded the staging Luma attendance proof in app tables.",
            created_at: "2026-06-28T10:05:00Z",
          },
        ],
      },
    });

    expect(proof.map((card) => [card.id, card.verdict])).toEqual([
      ["member", "ready"],
      ["leader", "ready"],
      ["staff", "ready"],
      ["admin", "ready"],
    ]);
    expect(
      proof
        .find((card) => card.id === "admin")
        ?.checks.find((check) => check.label === "Audit trail")?.value,
    ).toContain("1 pilot audit row");
    expect(
      proof
        .find((card) => card.id === "staff")
        ?.checks.find((check) => check.label === "External sends")?.value,
    ).toBe("Still blocked");
    expect(
      proof.find((card) => card.id === "staff")?.routeLinks.map((link) => link.href),
    ).toContain("/leader?view=leaderboard");
    expect(
      proof.find((card) => card.id === "admin")?.routeLinks.map((link) => link.href),
    ).toContain("/rush-month/leaderboard");
    expect(
      proof
        .find((card) => card.id === "staff")
        ?.checks.find((check) => check.label === "Points + leaderboard")?.value,
    ).toContain("leaderboard visible for staff review");
    expect(
      proof
        .find((card) => card.id === "admin")
        ?.checks.find((check) => check.label === "Leaderboard posture")?.value,
    ).toContain("narrow pilot posture");
  });
});
