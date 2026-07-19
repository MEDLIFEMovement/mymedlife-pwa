import { describe, expect, it } from "vitest";
import {
  assignments,
  integrationEvents,
  kpiEventRows,
  pointsEventRows,
} from "@/data/mock-rush-month";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  buildEventPointsLedger,
  getEventRsvpPosture,
  getPilotCrossRoleEventProof,
  getPilotEventLoopReadModel,
  createEmptyStagingLumaEventLoop,
  cancelMemberEventRsvp,
  prepStagingLumaEvent,
  recordEventAttendanceAndAwardPoints,
  recordLumaSyncFailure,
  recordMemberEventRsvp,
  shareStagingEventToFeed,
  summarizeStagingLumaEventLoop,
} from "@/services/event-loop";
import { getEventPlansForCampaign } from "@/services/campaign-ops-service";

describe("event loop facade", () => {
  it("gives one readable entrypoint for the points and KPI ledger", () => {
    const ledger = buildEventPointsLedger({
      assignments,
      integrationEvents,
      pointsEventRows,
      kpiEventRows,
    });

    expect(ledger.pointsSummary.earned).toBe(10);
    expect(ledger.kpiSummary.eventsLinked).toBe(1);
    expect(ledger.posture.leaderboard).toBe("mock_safe");
  });

  it("gives one readable entrypoint for member RSVP posture", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const eventPlan = getEventPlansForCampaign("rush-month").find(
      (item) => item.id === "event-rush-social-001",
    );

    expect(eventPlan).toBeDefined();

    const posture = getEventRsvpPosture(actor, eventPlan!);

    expect(posture.label).toBe("You're on the list");
    expect(posture.tone).toBe("mocked");
  });

  it("keeps the live pilot readback and cross-role proof under one module", () => {
    const readModel = getPilotEventLoopReadModel("staging");
    const proofCards = getPilotCrossRoleEventProof("staging");

    expect(readModel.summary.pointsAwarded).toBe(20);
    expect(readModel.summary.externalWritesEnabled).toBe(false);
    expect(proofCards).toHaveLength(4);
    expect(proofCards.map((card) => card.id)).toEqual([
      "member",
      "leader",
      "staff",
      "admin",
    ]);
  });

  it("keeps local RSVP, attendance, points, and audit working when Luma is disabled", () => {
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const initialState = createEmptyStagingLumaEventLoop({ mode: "disabled" });

    const eventPrepped = prepStagingLumaEvent(initialState, leader);
    const eventShared = shareStagingEventToFeed(eventPrepped, leader);
    const rsvpRecorded = recordMemberEventRsvp(eventShared, member);
    const attendanceRecorded = recordEventAttendanceAndAwardPoints(
      rsvpRecorded,
      leader,
      {
        userEmail: member.user.email,
        userId: member.user.id,
      },
    );
    const summary = summarizeStagingLumaEventLoop(attendanceRecorded);

    expect(attendanceRecorded.providerLink).toMatchObject({
      publicUrl: null,
      qrCodeValue: null,
      status: "disabled",
      browserSafeKeyExposure: false,
    });
    expect(summary).toMatchObject({
      eventStored: true,
      externalWritesEnabled: false,
      lumaLinkReady: false,
      qrReady: false,
      rsvpCount: 1,
      attendanceCount: 1,
      pointsAwarded: 20,
      sharedToFeed: true,
    });
    expect(attendanceRecorded.auditRecords.map((row) => row.action)).toEqual(
      expect.arrayContaining([
        "event_prepped",
        "event_shared_to_feed",
        "event_rsvp_recorded",
        "event_attendance_recorded",
        "event_points_awarded",
      ]),
    );
    expect(attendanceRecorded.automationOutbox).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          destination: "Luma",
          status: "disabled",
        }),
      ]),
    );
  });

  it("lets a member cancel an RSVP before check-in without external writes", () => {
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const initialState = createEmptyStagingLumaEventLoop({ mode: "disabled" });

    const eventPrepped = prepStagingLumaEvent(initialState, leader);
    const eventShared = shareStagingEventToFeed(eventPrepped, leader);
    const rsvpRecorded = recordMemberEventRsvp(eventShared, member);
    const rsvpCancelled = cancelMemberEventRsvp(rsvpRecorded, member);
    const summary = summarizeStagingLumaEventLoop(rsvpCancelled);

    expect(summary).toMatchObject({
      rsvpCount: 0,
      attendanceCount: 0,
      pointsAwarded: 0,
      externalWritesEnabled: false,
    });
    expect(rsvpCancelled.rsvps).toContainEqual(
      expect.objectContaining({
        userId: member.user.id,
        status: "cancelled",
      }),
    );
    expect(rsvpCancelled.auditRecords.map((row) => row.action)).toEqual(
      expect.arrayContaining(["event_rsvp_recorded", "event_rsvp_cancelled"]),
    );
    expect(rsvpCancelled.integrationEvents).toContainEqual(
      expect.objectContaining({
        eventType: "event_rsvp_cancelled",
        destination: "internal",
      }),
    );
  });

  it("locks RSVP cancellation after attendance or points are recorded", () => {
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const initialState = createEmptyStagingLumaEventLoop({ mode: "disabled" });

    const eventPrepped = prepStagingLumaEvent(initialState, leader);
    const eventShared = shareStagingEventToFeed(eventPrepped, leader);
    const rsvpRecorded = recordMemberEventRsvp(eventShared, member);
    const attendanceRecorded = recordEventAttendanceAndAwardPoints(
      rsvpRecorded,
      leader,
      {
        userEmail: member.user.email,
        userId: member.user.id,
      },
    );
    const blockedCancellation = cancelMemberEventRsvp(attendanceRecorded, member);
    const summary = summarizeStagingLumaEventLoop(blockedCancellation);

    expect(summary).toMatchObject({
      rsvpCount: 1,
      attendanceCount: 1,
      pointsAwarded: 20,
    });
    expect(blockedCancellation.rsvps).toContainEqual(
      expect.objectContaining({
        userId: member.user.id,
        status: "going",
      }),
    );
    expect(blockedCancellation.auditRecords.map((row) => row.action)).toContain(
      "event_rsvp_cancel_blocked",
    );
  });

  it("audits DS/Admin Luma provider failure handling", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const state = recordLumaSyncFailure(
      createEmptyStagingLumaEventLoop({ mode: "staging" }),
      dsAdmin,
      "Staging Luma test failed safely.",
    );

    expect(state.integrationEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          destination: "Luma",
          eventType: "luma_sync_failed",
          status: "disabled",
        }),
      ]),
    );
    expect(state.auditRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "luma_sync_failed",
          actorUserId: "mock-ds_admin",
          targetType: "integration_provider",
        }),
      ]),
    );
  });
});
