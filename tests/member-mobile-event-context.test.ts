import { describe, expect, it } from "vitest";

import { buildMemberMobileEventContext } from "@/services/member-mobile-event-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import type { ChapterEventRow } from "@/shared/types/persistence";

function createEvent(
  id: string,
  overrides: Partial<ChapterEventRow> = {},
): ChapterEventRow {
  const data = getMockReadOnlyAppData("Build member event test row.");

  return {
    ...data.chapterEventRows[0],
    id,
    title: `Event ${id}`,
    status: "planning",
    starts_at: "2026-08-01T18:00:00Z",
    attendance_count: 0,
    ...overrides,
  };
}

describe("member mobile event context", () => {
  it("prioritizes actionable events and maps Luma, points, dates, and honest location", () => {
    const data = getMockReadOnlyAppData("Map actor-scoped event rows.");
    const publishedId = "event-published";
    const basePoints = data.pointsEventRows[0];

    data.chapterEventRows = [
      createEvent("event-completed", {
        status: "feedback_collected",
        starts_at: "2026-07-01T18:00:00Z",
      }),
      createEvent(publishedId, {
        title: "Skills training",
        event_type: "training",
        status: "published",
        starts_at: "2026-08-01T18:00:00Z",
        attendance_count: 12,
      }),
      createEvent("event-planned", {
        event_type: "social",
        starts_at: "2026-09-01T18:00:00Z",
      }),
    ];
    data.lumaEventLinkRows = [
      {
        ...data.lumaEventLinkRows[0],
        chapter_event_id: publishedId,
      },
    ];
    data.pointsEventRows = [
      {
        ...basePoints,
        chapter_event_id: publishedId,
        points_delta: 20,
      },
      {
        ...basePoints,
        id: "points-second",
        chapter_event_id: publishedId,
        points_delta: 5,
      },
    ];

    const result = buildMemberMobileEventContext(data);

    expect(result.campaign).toEqual({
      name: "TEST Rush Month",
      objective:
        "TEST Help the chapter invite new students, collect proof of outreach, and prepare a coach-readable progress decision.",
    });
    expect(result.events.map((event) => event.id)).toEqual([
      publishedId,
      "event-planned",
      "event-completed",
    ]);
    expect(result.events[0]).toEqual(
      expect.objectContaining({
        title: "TEST Skills training",
        date: "Sat, Aug 1, 6:00 PM",
        loc: "Location not set",
        pts: 25,
        status: "RSVP Open",
        eventType: "Skills Session",
        featured: true,
        luma: true,
        rsvps: 12,
      }),
    );
    expect(result.events[1]).toEqual(
      expect.objectContaining({
        status: "Upcoming",
        eventType: "Meet People / Social",
        featured: false,
        luma: false,
      }),
    );
    expect(result.events[2]?.status).toBe("Completed");
    expect(result.events.every((event) => event.campaign === result.campaign.name)).toBe(true);
  });

  it("normalizes repeated TEST prefixes across campaign copy and event associations", () => {
    const data = getMockReadOnlyAppData("Normalize production campaign copy.");
    data.campaign.name = "Test Test Rush Month";
    data.campaign.objective =
      "Test Test New York University event, RSVP, attendance, points, and evidence loop.";
    data.chapterEventRows = [createEvent("event-campaign")];

    const result = buildMemberMobileEventContext(data);

    expect(result.campaign).toEqual({
      name: "TEST Rush Month",
      objective: "TEST New York University event, RSVP, attendance, points, and evidence loop.",
    });
    expect(result.events[0]?.campaign).toBe("TEST Rush Month");
  });

  it("keeps campaignless Luma imports visible as newest-first read-only history", () => {
    const data = getMockReadOnlyAppData("Map imported Luma history.");
    const campaignEvent = createEvent("event-campaign", {
      status: "published",
      starts_at: "2026-08-01T18:00:00Z",
    });
    const olderImport = createEvent("event-luma-older", {
      campaign_id: null,
      status: "completed",
      starts_at: "2026-05-01T18:00:00Z",
      location_name: "Older provider venue",
    });
    const newerImport = createEvent("event-luma-newer", {
      campaign_id: null,
      status: "completed",
      starts_at: "2026-07-20T18:00:00Z",
      location_name: "UCLA, Los Angeles, CA",
    });
    data.chapterEventRows = [olderImport, campaignEvent, newerImport];
    data.lumaEventLinkRows = [
      {
        ...data.lumaEventLinkRows[0],
        id: "luma-link-older",
        chapter_event_id: olderImport.id,
      },
      {
        ...data.lumaEventLinkRows[0],
        id: "luma-link-newer",
        chapter_event_id: newerImport.id,
      },
    ];

    const result = buildMemberMobileEventContext(data);

    expect(result.events.map((event) => event.id)).toEqual([
      campaignEvent.id,
      newerImport.id,
      olderImport.id,
    ]);
    expect(result.events[1]).toEqual(
      expect.objectContaining({
        campaign: "Luma calendar history",
        status: "Completed",
        luma: true,
        loc: "UCLA, Los Angeles, CA",
      }),
    );
  });

  it("keeps missing and invalid dates honest and treats cancelled rows as history", () => {
    const data = getMockReadOnlyAppData("Map incomplete event rows.");
    data.chapterEventRows = [
      createEvent("event-missing-date", { starts_at: null, event_type: "general" }),
      createEvent("event-invalid-date", { starts_at: "not-a-date", event_type: "general" }),
      createEvent("event-cancelled", { status: "canceled", event_type: "general" }),
    ];
    data.lumaEventLinkRows = [];
    data.pointsEventRows = [];

    const result = buildMemberMobileEventContext(data);

    expect(result.events[0]?.date).toBe("Date not set");
    expect(result.events[1]?.date).toBe("Date not set");
    expect(result.events[2]?.status).toBe("Completed");
    expect(result.events.every((event) => event.eventType === "Growing the Movement")).toBe(true);
  });

  it.each([
    ["fundraiser", "Fundraising"],
    ["community service", "Local Volunteering"],
    ["slt orientation", "SLT Prep"],
    ["mentor meetup", "Mentorship Meeting"],
    ["tutoring", "Tutoring"],
    ["general body meeting", "GBM"],
  ] as const)("maps %s events to the supported %s presentation", (eventType, expected) => {
    const data = getMockReadOnlyAppData("Map event presentation type.");
    data.chapterEventRows = [createEvent("event-type", { event_type: eventType })];
    data.lumaEventLinkRows = [];
    data.pointsEventRows = [];

    expect(buildMemberMobileEventContext(data).events[0]?.eventType).toBe(expected);
  });
});
