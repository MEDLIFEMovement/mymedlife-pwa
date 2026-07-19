import { describe, expect, it } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMvpMemberHome } from "@/services/mvp-event-tracking-workspace";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing MVP event tracking workspace.");

describe("mvp event tracking workspace", () => {
  it("builds the member home from the event-and-points launch lane", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getMvpMemberHome(actor, data);

    expect(workspace.greeting).toBe("Hi, TEST Sofia");
    expect(workspace.chapterName).toBe("UCLA MEDLIFE");
    expect(workspace.chapterMeta).toBe(
      "General Member • UCLA • Events and points",
    );
    expect(workspace.primaryEvent).toMatchObject({
      title: "Rush Month kickoff social",
      timing: "Sun Nov 15 · 10:00 AM - 12:00 PM",
      location: "Bruin Plaza",
      rsvpLabel: "RSVP'd",
      actionLabel: "View event",
      href: "/app/events/chapter-event-ucla-kickoff?source=home",
    });
    expect(workspace.pointsBalance).toBe("145 pts");
    expect(workspace.pointsDetail).toBe("Chapter rank #3");
    expect(workspace.recentHistory).toEqual([
      {
        label: "Rush Month kickoff social",
        detail: "Points awarded",
      },
      {
        label: "24 attendee(s) confirmed",
        detail: "40 event point(s) awarded",
      },
      {
        label: "UCLA MEDLIFE chapter total",
        detail: "50 point(s) currently visible.",
      },
    ]);
    expect(workspace.attendanceStatusLabel).toBe("Points awarded");
    expect(workspace.travelerHref).toBeNull();
  });

  it("keeps traveler users in the same member launch lane while SLT prep stays parked", () => {
    const actor = getMockLocalActorContext("traveler.a@mymedlife.test");
    const workspace = getMvpMemberHome(actor, data);

    expect(workspace.greeting).toBe("Hi, TEST Taylor");
    expect(workspace.primaryEvent?.title).toBe("Rush Month kickoff social");
    expect(workspace.travelerHref).toBeNull();
  });

  it("does not fall back to broader readiness modules when no live launch-lane event exists", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const emptyLaunchLaneData = {
      ...data,
      chapterEventRows: [],
      lumaEventLinkRows: [],
      eventRows: [],
      allEventRows: [],
      allChapterEventRows: [],
      allLumaEventLinkRows: [],
      allPointsEventRows: [],
      pointsEventRows: [],
    };

    const workspace = getMvpMemberHome(actor, emptyLaunchLaneData);

    expect(workspace.chapterMeta).toBe("General Member • UCLA • Events and points");
    expect(workspace.primaryEvent).toBeNull();
    expect(workspace.attendanceStatusLabel).toBe("No attendance yet");
    expect(workspace.recentHistory).toEqual([
      {
        label: "No event history yet",
        detail: "Your attendance and points will appear here after your first event.",
      },
    ]);
  });
});
