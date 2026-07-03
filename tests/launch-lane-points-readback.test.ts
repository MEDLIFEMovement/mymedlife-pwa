import { describe, expect, it } from "vitest";

import {
  getLaunchLaneChapterLeaderboardReadback,
  getLaunchLaneLeaderAttendanceReadback,
  getLaunchLaneLeaderEventReadback,
  getLaunchLaneMemberHistory,
  getLaunchLaneMemberPointsReadback,
  getLaunchLaneOrgPointsReadback,
  getLaunchLaneOrgLeaderboardRows,
  getLaunchLaneStaffChapterReadback,
} from "@/services/launch-lane-points-readback";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";
import type {
  ChapterEventRow,
  EventRow,
  LumaEventLinkRow,
  PointsEventRow,
} from "@/shared/types/persistence";

describe("launch lane points readback", () => {
  it("builds a member event-level readback from RSVP, attendance, and points rows", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member launch-lane readback.");

    const readback = getLaunchLaneMemberPointsReadback(actor, data);

    expect(readback).not.toBeNull();
    expect(readback).toMatchObject({
      eventTitle: "Rush Month kickoff social",
      loopStage: "attendance_confirmed",
      rsvpCount: 2,
      attendanceCount: 24,
      eventPointsAwarded: 0,
      memberPointsAwarded: 0,
      chapterTotalPoints: 10,
      memberStatusLabel: "Attendance confirmed; points pending",
      eventDetailHref: "/app/events/chapter-event-ucla-kickoff?source=points",
      leaderboardHref: "/app/points?source=points",
      nextStepLabel: "Open leaderboard",
    });
  });

  it("builds an org readback for staff from chapter-level event and points data", () => {
    const data = getMockReadOnlyAppData("Testing org launch-lane readback.");

    const readback = getLaunchLaneOrgPointsReadback(data);

    expect(readback).toMatchObject({
      totalRsvps: 6,
      totalAttendance: 36,
      totalPoints: 18,
      chaptersWithPoints: 2,
      topChapterName: "UCLA MEDLIFE",
      topChapterPoints: 10,
      featuredEventTitle: "Boston kickoff info night",
      featuredEventChapterName: "Boston College MEDLIFE",
      featuredEventAttendanceCount: 12,
      featuredEventPointsAwarded: 8,
    });
  });

  it("builds member history from the same live event-and-points readback", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member history readback.");

    expect(getLaunchLaneMemberHistory(actor, data)).toEqual([
      {
        label: "Rush Month kickoff social",
        detail: "Attendance confirmed; points pending",
      },
      {
        label: "24 attendee(s) confirmed",
        detail: "Points are still pending for this event.",
      },
      {
        label: "UCLA MEDLIFE chapter total",
        detail: "10 point(s) currently visible.",
      },
    ]);
  });

  it("keeps leader events, attendance, and chapter leaderboard on one shared readback", () => {
    const data = getMockReadOnlyAppData("Testing leader launch-lane readback.");

    expect(getLaunchLaneLeaderEventReadback(data)).toMatchObject([
      {
        id: "chapter-event-ucla-kickoff",
        chapterName: "UCLA MEDLIFE",
        title: "Rush Month kickoff social",
        rsvpCount: 2,
        attendanceCount: 24,
        pointsAwarded: 0,
        statusLabel: "Attendance recorded",
        location: "Luma-linked chapter event",
        detailHref: "/leader?view=events&event=chapter-event-ucla-kickoff",
      },
    ]);
    expect(getLaunchLaneLeaderAttendanceReadback(data)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Sofia Alvarez",
          status: "Checked in",
          pointsLabel: "Points pending",
        }),
        expect.objectContaining({
          name: "Nia Committee",
          status: "Checked in",
          pointsLabel: "Points pending",
        }),
      ]),
    );
    expect(getLaunchLaneChapterLeaderboardReadback(data)).toMatchObject([
      {
        name: "Member 1",
        points: 10,
        detail: "Leading this chapter right now",
      },
    ]);
  });

  it("keeps staff chapter rows and the org leaderboard tied to the same totals", () => {
    const data = getMockReadOnlyAppData("Testing staff launch-lane readback.");

    expect(getLaunchLaneStaffChapterReadback(data)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "UCLA MEDLIFE",
          chapterEventId: "chapter-event-ucla-kickoff",
          detailHref: "/staff?view=events&campaign=rush-month&event=chapter-event-ucla-kickoff",
          calendarLabel: "UCLA chapter calendar",
          calendarStatusLabel: "Explicit map",
          calendarReady: true,
          nextEvent: "Rush Month kickoff social",
          rsvps: 2,
          attendance: 24,
          points: 10,
          risk: "Healthy",
        }),
        expect.objectContaining({
          name: "Lakeside MEDLIFE",
          calendarLabel: "Calendar not assigned",
          calendarStatusLabel: "Needs setup",
          calendarReady: false,
          nextEvent: "Lakeside welcome table",
          rsvps: 0,
          attendance: 0,
          points: 0,
          risk: "No RSVPs",
        }),
        expect.objectContaining({
          name: "Boston College MEDLIFE",
          calendarLabel: "Boston chapter calendar",
          calendarStatusLabel: "Explicit map",
          calendarReady: true,
          nextEvent: "Boston kickoff info night",
          rsvps: 2,
          attendance: 12,
          points: 8,
          risk: "Low attendance",
        }),
        expect.objectContaining({
          name: "UC San Diego MEDLIFE",
          calendarLabel: "UCSD chapter calendar",
          calendarStatusLabel: "Explicit map",
          calendarReady: true,
          nextEvent: "UCSD service social",
          rsvps: 2,
          attendance: 0,
          points: 0,
          risk: "Healthy",
        }),
        expect.objectContaining({
          name: "McGill MEDLIFE",
          calendarLabel: "Calendar not assigned",
          calendarStatusLabel: "Needs setup",
          calendarReady: false,
          chapterEventId: null,
          detailHref: null,
          nextEvent: "No event scheduled",
          rsvps: 0,
          attendance: 0,
          points: 0,
          risk: "No upcoming events",
        }),
      ]),
    );
    expect(getLaunchLaneOrgLeaderboardRows(data)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chapterName: "UCLA MEDLIFE",
          points: 10,
          eventCount: 1,
          statusLabel: "Healthy",
        }),
        expect.objectContaining({
          chapterName: "Boston College MEDLIFE",
          points: 8,
          eventCount: 1,
          statusLabel: "Low attendance",
        }),
        expect.objectContaining({
          chapterName: "McGill MEDLIFE",
          points: 0,
          eventCount: 0,
          statusLabel: "No upcoming events",
        }),
      ]),
    );
  });

  it("uses the most recent chapter event for member and org points readbacks", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = withAdditionalUclaEvent(
      getMockReadOnlyAppData("Testing most-recent event readback."),
      {
        event: {
          id: "chapter-event-ucla-closing-rally",
          title: "Rush Month closing rally",
          starts_at: "2026-11-22T19:00:00Z",
          ends_at: "2026-11-22T21:00:00Z",
          status: "completed",
          attendance_count: 12,
          luma_event_link_id: "luma-link-ucla-closing-rally",
        },
        link: {
          id: "luma-link-ucla-closing-rally",
          luma_event_id: "mock-luma-closing-rally",
          luma_event_url: "https://lu.ma/mock-closing-rally",
        },
        eventRows: [
          {
            id: "event-row-rsvp-ucla-closing-rally",
            event_type: "event_rsvp_recorded",
            actor_user_id: "member-a",
            chapter_id: "chapter-northview",
            campaign_id: "rush-month-2026",
            assignment_id: null,
            chapter_event_id: "chapter-event-ucla-closing-rally",
            payload: {
              userId: "member-a",
              userEmail: "member.a@mymedlife.test",
            },
            correlation_id: "mock-rsvp-ucla-closing-rally",
            occurred_at: "2026-11-22T16:00:00Z",
            created_at: "2026-11-22T16:00:00Z",
          },
          {
            id: "event-row-attendance-ucla-closing-rally",
            event_type: "event_attendance_recorded",
            actor_user_id: "leader-1",
            chapter_id: "chapter-northview",
            campaign_id: "rush-month-2026",
            assignment_id: null,
            chapter_event_id: "chapter-event-ucla-closing-rally",
            payload: {
              attendanceCount: 12,
            },
            correlation_id: "mock-attendance-ucla-closing-rally",
            occurred_at: "2026-11-22T21:15:00Z",
            created_at: "2026-11-22T21:15:00Z",
          },
        ],
        pointsRows: [
          {
            id: "points-ucla-closing-rally",
            chapter_id: "chapter-northview",
            campaign_id: "rush-month-2026",
            assignment_id: null,
            chapter_event_id: "chapter-event-ucla-closing-rally",
            evidence_item_id: null,
            approval_id: null,
            awarded_to_user_id: "member-a",
            points_delta: 20,
            reason: "Attendance confirmed at the closing rally.",
            created_by: "leader-1",
            created_at: "2026-11-22T21:16:00Z",
          },
        ],
      },
    );

    expect(getLaunchLaneMemberPointsReadback(actor, data)).toMatchObject({
      eventTitle: "Rush Month closing rally",
      attendanceCount: 12,
      eventPointsAwarded: 20,
      memberPointsAwarded: 20,
      chapterTotalPoints: 30,
      memberStatusLabel: "Points awarded",
    });
    expect(getLaunchLaneOrgPointsReadback(data)).toMatchObject({
      featuredEventTitle: "Rush Month closing rally",
      featuredEventChapterName: "UCLA MEDLIFE",
      featuredEventAttendanceCount: 12,
      featuredEventPointsAwarded: 20,
    });
  });

  it("keeps the staff chapter next-event card focused on the soonest event", () => {
    const data = withAdditionalUclaEvent(
      getMockReadOnlyAppData("Testing soonest-event staff readback."),
      {
        event: {
          id: "chapter-event-ucla-follow-up-fair",
          title: "Rush Month follow-up fair",
          starts_at: "2026-11-29T19:00:00Z",
          ends_at: "2026-11-29T21:00:00Z",
          status: "published",
          attendance_count: null,
          luma_event_link_id: null,
        },
      },
    );

    expect(getLaunchLaneStaffChapterReadback(data)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "UCLA MEDLIFE",
          nextEvent: "Rush Month kickoff social",
        }),
        expect.objectContaining({
          name: "Lakeside MEDLIFE",
          nextEvent: "Lakeside welcome table",
        }),
        expect.objectContaining({
          name: "Boston College MEDLIFE",
          nextEvent: "Boston kickoff info night",
        }),
      ]),
    );
    expect(getLaunchLaneOrgPointsReadback(data)).toMatchObject({
      featuredEventTitle: "Boston kickoff info night",
      featuredEventChapterName: "Boston College MEDLIFE",
      featuredEventAttendanceCount: 12,
      featuredEventPointsAwarded: 8,
    });
    expect(getLaunchLaneOrgLeaderboardRows(data)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chapterName: "UCLA MEDLIFE",
          eventCount: 2,
        }),
      ]),
    );
  });
});

function withAdditionalUclaEvent(
  data: ReadOnlyAppData,
  input: {
    event: Pick<
      ChapterEventRow,
      "id" | "title" | "starts_at" | "ends_at" | "status" | "attendance_count" | "luma_event_link_id"
    >;
    link?: Pick<LumaEventLinkRow, "id" | "luma_event_id" | "luma_event_url">;
    eventRows?: EventRow[];
    pointsRows?: PointsEventRow[];
  },
): ReadOnlyAppData {
  const baseEvent = data.chapterEventRows[0]!;
  const nextEvent: ChapterEventRow = {
    ...baseEvent,
    id: input.event.id,
    title: input.event.title,
    starts_at: input.event.starts_at,
    ends_at: input.event.ends_at,
    status: input.event.status,
    attendance_count: input.event.attendance_count,
    luma_event_link_id: input.event.luma_event_link_id,
    assignment_id: null,
    updated_at: "2026-11-22T12:00:00Z",
  };

  const nextLink = input.link
    ? ({
        ...data.lumaEventLinkRows[0],
        id: input.link.id,
        chapter_event_id: nextEvent.id,
        luma_event_id: input.link.luma_event_id,
        luma_event_url: input.link.luma_event_url,
      } satisfies LumaEventLinkRow)
    : null;

  return {
    ...data,
    chapterEventRows: [...data.chapterEventRows, nextEvent],
    allChapterEventRows: [...data.allChapterEventRows, nextEvent],
    lumaEventLinkRows: nextLink ? [...data.lumaEventLinkRows, nextLink] : data.lumaEventLinkRows,
    allLumaEventLinkRows: nextLink
      ? [...data.allLumaEventLinkRows, nextLink]
      : data.allLumaEventLinkRows,
    eventRows: input.eventRows ? [...data.eventRows, ...input.eventRows] : data.eventRows,
    allEventRows: input.eventRows ? [...data.allEventRows, ...input.eventRows] : data.allEventRows,
    pointsEventRows: input.pointsRows
      ? [...data.pointsEventRows, ...input.pointsRows]
      : data.pointsEventRows,
    allPointsEventRows: input.pointsRows
      ? [...data.allPointsEventRows, ...input.pointsRows]
      : data.allPointsEventRows,
  };
}
