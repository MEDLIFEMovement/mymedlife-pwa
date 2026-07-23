import { describe, expect, it } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getMemberLaunchLaneEventDetailData,
  getMemberLaunchLaneEventRowById,
  getMemberLaunchLaneEventRows,
} from "@/services/member-launch-lane-events";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("member launch lane events", () => {
  it("builds live member event rows from chapter events", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member launch-lane events.");

    const rows = getMemberLaunchLaneEventRows(actor, data);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "chapter-event-ucla-kickoff",
      title: "Rush Month kickoff social",
      chapterName: "UCLA MEDLIFE",
      memberDateTimeLabel: "Sun Nov 15 · 10:00 AM - 12:00 PM",
      memberLocationLabel: "Bruin Plaza",
      memberCampaignLabel: "Event loop",
      memberPointsLabel: "20 pts for attending",
      memberRsvpLabel: "RSVP'd",
      memberRsvpState: "registered",
      memberCanCancelRsvp: false,
      memberRsvpLockLabel: "RSVP locked after check-in",
      memberLumaLabel: "Luma",
      rsvpStatusLabel: "Points awarded",
      rsvpCount: 2,
      attendanceCount: 24,
      pointsAwarded: 40,
    });
  });

  it("allows RSVP cancellation before member-specific points exist", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member RSVP cancellation availability.");
    const pointsWithoutMemberAttendance = data.allPointsEventRows.filter(
      (row) =>
        row.chapter_event_id !== "chapter-event-ucla-kickoff" ||
        row.awarded_to_user_id !== "member-a",
    );

    const row = getMemberLaunchLaneEventRowById(
      actor,
      {
        ...data,
        chapterEventRows: data.chapterEventRows.map((event) => ({
          ...event,
          status: "published" as const,
        })),
        allPointsEventRows: pointsWithoutMemberAttendance,
      },
      "chapter-event-ucla-kickoff",
    );

    expect(row).toMatchObject({
      memberRsvpState: "registered",
      memberCanCancelRsvp: true,
      memberRsvpLockLabel: null,
    });
  });

  it("does not lock RSVP cancellation for unrelated event bonus points", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing unrelated event points.");
    const pointsWithoutMemberAttendance = data.allPointsEventRows.filter(
      (row) =>
        row.chapter_event_id !== "chapter-event-ucla-kickoff" ||
        row.awarded_to_user_id !== "member-a",
    );
    const unrelatedBonus = {
      ...data.allPointsEventRows[0],
      id: "event-bonus-1",
      chapter_event_id: "chapter-event-ucla-kickoff",
      awarded_to_user_id: "member-a",
      points_delta: 50,
      reason: "Event participation bonus",
    };

    const row = getMemberLaunchLaneEventRowById(
      actor,
      {
        ...data,
        chapterEventRows: data.chapterEventRows.map((event) => ({
          ...event,
          status: "published" as const,
        })),
        allPointsEventRows: [...pointsWithoutMemberAttendance, unrelatedBonus],
      },
      "chapter-event-ucla-kickoff",
    );

    expect(row).toMatchObject({
      memberCheckedIn: false,
      memberCanCancelRsvp: true,
      memberRsvpLockLabel: null,
      memberPointsAwarded: 0,
    });
  });

  it("reopens RSVP after the latest member intent is cancellation", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member RSVP cancellation readback.");
    const cancellationRow = {
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
    };
    const pointsWithoutMemberAttendance = data.allPointsEventRows.filter(
      (row) =>
        row.chapter_event_id !== "chapter-event-ucla-kickoff" ||
        row.awarded_to_user_id !== "member-a",
    );

    const row = getMemberLaunchLaneEventRowById(
      actor,
      {
        ...data,
        allEventRows: [...data.allEventRows, cancellationRow],
        allPointsEventRows: pointsWithoutMemberAttendance,
      },
      "chapter-event-ucla-kickoff",
    );

    expect(row).toMatchObject({
      memberRsvpLabel: "RSVP",
      memberRsvpState: "open",
      memberCanCancelRsvp: false,
      rsvpCount: 1,
    });
  });

  it("finds a live event by chapter-event id", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member launch-lane event lookup.");

    const row = getMemberLaunchLaneEventRowById(
      actor,
      data,
      "chapter-event-ucla-kickoff",
    );

    expect(row?.title).toBe("Rush Month kickoff social");
    expect(row?.rsvpDetail).toContain("Attendance is confirmed");
  });

  it("does not substitute TEST fixture data for an unknown event id", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing missing event fail-closed behavior.");

    expect(
      getMemberLaunchLaneEventDetailData(actor, data, "missing-production-event"),
    ).toEqual({
      event: null,
      snapshot: null,
    });
  });

  it("closes member actions when the source event is completed", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing completed event action closure.");
    const chapterEventRows = data.chapterEventRows.map((row) => ({
      ...row,
      status: "feedback_collected" as const,
    }));

    const row = getMemberLaunchLaneEventRowById(
      actor,
      { ...data, chapterEventRows },
      "chapter-event-ucla-kickoff",
    );

    expect(row).toMatchObject({
      memberLifecycleState: "completed",
      memberLifecycleLabel: "Event completed",
      memberActionsClosed: true,
      memberCanCancelRsvp: false,
    });
  });

  it("shows the completed loop state once attendance-backed points exist", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member launch-lane completed event.");
    const completedData = {
      ...data,
      allPointsEventRows: [
        ...data.allPointsEventRows,
        {
          id: "points-ucla-kickoff-complete",
          chapter_id: "chapter-northview",
          campaign_id: "rush-month-2026",
          assignment_id: null,
          chapter_event_id: "chapter-event-ucla-kickoff",
          evidence_item_id: null,
          approval_id: null,
          awarded_to_user_id: "member-a",
          points_delta: 20,
          reason: "Attendance confirmed for the kickoff event.",
          created_by: "leader-1",
          created_at: "2026-11-15T21:00:00Z",
        },
      ],
    };

    const row = getMemberLaunchLaneEventRowById(
      actor,
      completedData,
      "chapter-event-ucla-kickoff",
    );

    expect(row?.rsvpStatusLabel).toBe("Points awarded");
    expect(row?.rsvpDetail).toContain("points are visible for this event");
    expect(row?.pointsAwarded).toBe(60);
  });
});
