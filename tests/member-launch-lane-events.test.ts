import { describe, expect, it } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
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
      memberLumaLabel: "Luma",
      rsvpStatusLabel: "Attendance confirmed; points pending",
      rsvpCount: 2,
      attendanceCount: 24,
      pointsAwarded: 0,
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
    expect(row?.pointsAwarded).toBe(20);
  });
});
