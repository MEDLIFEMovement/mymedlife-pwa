import { afterEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getLeaderLaunchLaneEventCards,
  getMemberLaunchLaneRsvpCard,
  getMemberLaunchLaneRsvpCardForEvent,
} from "@/services/luma-launch-lane-workspace";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("luma launch lane workspace", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds a member RSVP card from the linked live pilot event", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member RSVP card.");

    const card = getMemberLaunchLaneRsvpCard(actor, data);

    expect(card).not.toBeNull();
    expect(card?.title).toBe("Rush Month kickoff social");
    expect(card?.lumaEventId).toBe("mock-luma-rush-kickoff");
    expect(card?.detailHref).toBe("/app/events/chapter-event-ucla-kickoff?source=events");
    expect(card?.alreadyRecorded).toBe(true);
    expect(card?.statusLabel).toBe("Attendance confirmed; points pending");
    expect(card?.nextStepLabel).toBe("Open leaderboard");
  });

  it("finds the matching live RSVP card when the event title maps directly to the linked pilot event", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing event-detail RSVP card lookup.");

    const card = getMemberLaunchLaneRsvpCardForEvent(actor, data, {
      eventTitle: "Rush Month kickoff social",
    });

    expect(card).not.toBeNull();
    expect(card?.title).toBe("Rush Month kickoff social");
    expect(card?.rsvpCount).toBe(2);
    expect(card?.attendanceCount).toBe(24);
    expect(card?.pointsAwarded).toBe(0);
  });

  it("shows the linked chapter name on the member RSVP card instead of the default scoped chapter", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing multi-chapter RSVP labeling.");
    const linkedEventId = data.lumaEventLinkRows[0]?.chapter_event_id;
    const updatedChapterEvents = data.chapterEventRows.map((row) =>
      row.id === linkedEventId ? { ...row, chapter_id: "chapter-lakeside" } : row,
    );
    const updatedAllChapterEvents = data.allChapterEventRows.map((row) =>
      row.id === linkedEventId ? { ...row, chapter_id: "chapter-lakeside" } : row,
    );

    const card = getMemberLaunchLaneRsvpCard(actor, {
      ...data,
      chapterEventRows: updatedChapterEvents,
      allChapterEventRows: updatedAllChapterEvents,
    });

    expect(card).not.toBeNull();
    expect(card?.chapterName).toBe("Lakeside MEDLIFE");
  });

  it("builds leader event cards with Luma create or update actions", () => {
    vi.stubEnv(
      "MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON",
      JSON.stringify([
        {
          chapterId: "chapter-northview",
          calendarId: "cal-ucla-1234",
          calendarLabel: "UCLA chapter calendar",
        },
      ]),
    );
    const data = getMockReadOnlyAppData("Testing leader event cards.");

    const cards = getLeaderLaunchLaneEventCards(data);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      title: "Rush Month kickoff social",
      chapterId: "chapter-northview",
      readyForPilot: true,
      wideningReady: true,
      calendarLabel: "UCLA chapter calendar",
      calendarStatusLabel: "Chapter calendar ready",
      calendarMapSourceLabel: "Saved in myMEDLIFE",
      lumaEventId: "mock-luma-rush-kickoff",
      eventActionLabel: "Update in Luma",
      attendanceActionLabel: "Import attendance",
      rsvpCount: 2,
      attendanceCount: 24,
      pointsAwarded: 0,
    });
  });

  it("carries chapter-specific timezone data into leader cards for multi-chapter rollout", () => {
    vi.stubEnv(
      "MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON",
      JSON.stringify([
        {
          chapterId: "chapter-boston",
          calendarId: "cal-boston-5678",
          calendarLabel: "Boston chapter calendar",
        },
      ]),
    );
    const data = getMockReadOnlyAppData("Testing Boston leader timezone.");

    const cards = getLeaderLaunchLaneEventCards({
      ...data,
      chapterEventRows: data.allChapterEventRows,
      lumaEventLinkRows: data.allLumaEventLinkRows,
    });
    const bostonCard = cards.find(
      (card) => card.chapterId === "chapter-boston",
    );

    expect(bostonCard).toMatchObject({
      chapterName: "Boston College MEDLIFE",
      timezone: "America/New_York",
      calendarLabel: "Boston chapter calendar",
      eventActionLabel: "Update in Luma",
      lumaEventId: "mock-luma-boston-info-night",
    });
  });

  it("marks leader event cards as blocked when the chapter calendar is still missing", () => {
    vi.stubEnv("MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON", "");
    vi.stubEnv("LUMA_CALENDAR_ID", "");
    vi.stubEnv("MYMEDLIFE_LUMA_SHARED_DEFAULT_CHAPTER_ID", "");
    const data = {
      ...getMockReadOnlyAppData("Testing missing chapter calendar."),
      chapterLumaCalendarRows: [],
    };

    const cards = getLeaderLaunchLaneEventCards(data);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      readyForPilot: false,
      wideningReady: false,
      calendarLabel: "Calendar not assigned",
      calendarStatusLabel: "Calendar setup needed",
      calendarMapSourceLabel: "Needs saved map",
      eventActionLabel: "Chapter calendar needed",
    });
  });
});
