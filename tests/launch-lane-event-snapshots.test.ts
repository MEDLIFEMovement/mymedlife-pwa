import { describe, expect, it } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  countLaunchLaneRsvpsForEvent,
  getLaunchLaneActorProfileId,
  getLaunchLaneEventSnapshots,
  hasLaunchLaneRecordedAttendance,
  hasLaunchLaneRecordedRsvp,
  sumLaunchLaneAttendancePointsForEvent,
} from "@/services/launch-lane-event-snapshots";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("launch lane event snapshots", () => {
  it("builds one shared event snapshot with RSVP, attendance, points, and Luma state", () => {
    const data = getMockReadOnlyAppData("Testing launch-lane event snapshots.");

    const snapshots = getLaunchLaneEventSnapshots(data);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({
      id: "chapter-event-ucla-kickoff",
      chapterName: "UCLA MEDLIFE",
      timing: "Nov 15, 10:00 AM - 12:00 PM",
      memberDateTimeLabel: "Sun Nov 15 · 10:00 AM - 12:00 PM",
      memberLocationLabel: "Bruin Plaza",
      rsvpCount: 2,
      attendanceCount: 24,
      pointsAwarded: 40,
      hasLumaLink: true,
      lumaEventId: "mock-luma-rush-kickoff",
    });
  });

  it("uses the linked chapter timezone when the launch lane widens beyond UCLA", () => {
    const data = getMockReadOnlyAppData("Testing multi-chapter timezone formatting.");

    const snapshots = getLaunchLaneEventSnapshots(data, {
      chapterEvents: data.allChapterEventRows,
      lumaEventLinks: data.allLumaEventLinkRows,
    });
    const bostonSnapshot = snapshots.find(
      (snapshot) => snapshot.id === "chapter-event-boston-info-night",
    );

    expect(bostonSnapshot).toMatchObject({
      chapterName: "Boston College MEDLIFE",
      timeZone: "America/New_York",
      timing: "Nov 18, 6:00 PM - 8:00 PM",
      memberDateTimeLabel: "Wed Nov 18 · 6:00 PM - 8:00 PM",
      hasLumaLink: true,
      lumaEventId: "mock-luma-boston-info-night",
    });
  });

  it("matches a signed-in member to an RSVP record through the shared helper", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing shared RSVP matching.");
    const profileId = getLaunchLaneActorProfileId(actor, data);

    expect(profileId).toBe("member-a");
    expect(
      hasLaunchLaneRecordedRsvp({
        eventRows: data.allEventRows,
        chapterEventId: "chapter-event-ucla-kickoff",
        userEmail: actor.user.email,
        profileId,
      }),
    ).toBe(true);
  });

  it("distinguishes member attendance from aggregate event attendance", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member attendance matching.");
    const profileId = getLaunchLaneActorProfileId(actor, data);
    const memberAttendanceRow = {
      ...data.allEventRows.find(
        (row) => row.event_type === "event_attendance_recorded",
      )!,
      id: "member-attendance-1",
      actor_user_id: profileId,
      payload: { checkedInUserId: profileId, userEmail: actor.user.email },
    };

    expect(
      hasLaunchLaneRecordedAttendance({
        eventRows: data.allEventRows,
        chapterEventId: "chapter-event-ucla-kickoff",
        userEmail: actor.user.email,
        profileId,
      }),
    ).toBe(false);
    expect(
      hasLaunchLaneRecordedAttendance({
        eventRows: [...data.allEventRows, memberAttendanceRow],
        chapterEventId: "chapter-event-ucla-kickoff",
        userEmail: actor.user.email,
        profileId,
      }),
    ).toBe(true);
  });

  it("counts attendance awards without treating unrelated event points as check-in", () => {
    const data = getMockReadOnlyAppData("Testing attendance point classification.");
    const unrelatedPoints = {
      ...data.allPointsEventRows[0],
      id: "event-bonus-1",
      chapter_event_id: "chapter-event-ucla-kickoff",
      awarded_to_user_id: "member-a",
      points_delta: 100,
      reason: "Event participation bonus",
    };

    expect(
      sumLaunchLaneAttendancePointsForEvent(
        [...data.allPointsEventRows, unrelatedPoints],
        "chapter-event-ucla-kickoff",
        "member-a",
      ),
    ).toBe(20);
  });

  it("treats the latest RSVP cancellation as an open member RSVP state", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing shared RSVP cancellation matching.");
    const profileId = getLaunchLaneActorProfileId(actor, data);
    const eventRows = [
      ...data.allEventRows,
      {
        id: "event-row-rsvp-cancel-ucla-1",
        event_type: "event_rsvp_cancelled",
        actor_user_id: "member-a",
        chapter_id: "chapter-northview",
        campaign_id: "rush-month-2026",
        assignment_id: null,
        chapter_event_id: "chapter-event-ucla-kickoff",
        payload: {
          userId: "member-a",
          userEmail: actor.user.email,
          liveExternalWrite: false,
        },
        correlation_id: "mock-rsvp-cancel-ucla-1",
        occurred_at: "2026-11-14T12:30:00Z",
        created_at: "2026-11-14T12:30:00Z",
      },
    ];

    expect(
      hasLaunchLaneRecordedRsvp({
        eventRows,
        chapterEventId: "chapter-event-ucla-kickoff",
        userEmail: actor.user.email,
        profileId,
      }),
    ).toBe(false);
    expect(countLaunchLaneRsvpsForEvent(eventRows, "chapter-event-ucla-kickoff")).toBe(1);
  });

  it("counts a member again after they re-RSVP following a cancellation", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing RSVP re-record after cancellation.");
    const profileId = getLaunchLaneActorProfileId(actor, data);
    const eventRows = [
      ...data.allEventRows,
      {
        id: "event-row-rsvp-cancel-ucla-1",
        event_type: "event_rsvp_cancelled",
        actor_user_id: "member-a",
        chapter_id: "chapter-northview",
        campaign_id: "rush-month-2026",
        assignment_id: null,
        chapter_event_id: "chapter-event-ucla-kickoff",
        payload: {
          userId: "member-a",
          userEmail: actor.user.email,
          liveExternalWrite: false,
        },
        correlation_id: "mock-rsvp-cancel-ucla-1",
        occurred_at: "2026-11-14T12:30:00Z",
        created_at: "2026-11-14T12:30:00Z",
      },
      {
        id: "event-row-rsvp-ucla-3",
        event_type: "event_rsvp_recorded",
        actor_user_id: "member-a",
        chapter_id: "chapter-northview",
        campaign_id: "rush-month-2026",
        assignment_id: null,
        chapter_event_id: "chapter-event-ucla-kickoff",
        payload: {
          userId: "member-a",
          userEmail: actor.user.email,
          liveExternalWrite: false,
        },
        correlation_id: "mock-rsvp-ucla-3",
        occurred_at: "2026-11-14T12:45:00Z",
        created_at: "2026-11-14T12:45:00Z",
      },
    ];

    expect(
      hasLaunchLaneRecordedRsvp({
        eventRows,
        chapterEventId: "chapter-event-ucla-kickoff",
        userEmail: actor.user.email,
        profileId,
      }),
    ).toBe(true);
    expect(countLaunchLaneRsvpsForEvent(eventRows, "chapter-event-ucla-kickoff")).toBe(2);
  });
});
