import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  canActorConfigureLumaStatus,
  canActorCreateChapterEvent,
  canActorRsvpToEvent,
  canActorViewEventAnalytics,
  createEmptyStagingLumaEventLoop,
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
});
