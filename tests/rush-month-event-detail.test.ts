import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getRushMonthEventDetailWorkspace } from "@/services/rush-month-event-detail";

describe("rush month event detail", () => {
  it("gives members a direct event game plan with zero writes expected", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getRushMonthEventDetailWorkspace(
      actor,
      "event-rush-social-001",
    );

    expect(workspace?.canReadWorkspace).toBe(true);
    expect(workspace?.title).toBe("Your event game plan");
    expect(workspace?.event?.title).toBe("Tabling at Bruin Walk");
    expect(workspace?.event?.committeeName).toBe("Social Action Committee");
    expect(workspace?.event?.rsvpStatusLabel).toBe("You're on the list");
    expect(workspace?.event?.rsvpDetail).toContain("showing up ready");
    expect(workspace?.summary).toBe(
      "See when to show up, what kind of student moment to create, and how RSVP, attendance, and points connect after the event. Luma is the source of truth, RSVP shows intent, attendance confirms who showed up, and points move once attendance is confirmed.",
    );
    expect(workspace?.nextStep.href).toBe("/app/points?source=events");
    expect(workspace?.nextStep.label).toBe("Open leaderboard");
    expect(workspace?.nextStep.detail).toBe(
      "After attendance is confirmed, the chapter leaderboard is the clearest place to see the point impact.",
    );
    expect(workspace?.secondaryStep.href).toBe("/app/events?source=events");
    expect(workspace?.secondaryStep.label).toBe("Open events");
    expect(workspace?.secondaryStep.detail).toBe(
      "Stay close to the event list so RSVP, attendance, and the next chapter moment all stay easy to reach.",
    );
    expect(workspace?.readinessChecks.map((check) => check.label)).toEqual([
      "Owner",
      "Student action",
      "RSVP posture",
      "Luma posture",
      "NPS prompt",
      "Proof prompt",
    ]);
    expect(workspace?.counts.browserWritesExpected).toBe(0);
    expect(workspace?.counts.externalWritesExpected).toBe(0);
    expect(workspace?.summary).not.toContain("disabled automation posture");
    expect(workspace?.summary).not.toContain("launch-ready");
    expect(workspace?.nextStep.detail).not.toContain("local write path is approved");
  });

  it("keeps committee members on the member-owned event game-plan posture", () => {
    const actor = getMockLocalActorContext("committee.member@mymedlife.test");
    const workspace = getRushMonthEventDetailWorkspace(
      actor,
      "event-rush-social-001",
    );

    expect(workspace?.title).toBe("Your event support plan");
    expect(workspace?.event?.rsvpStatusLabel).toBe("You're on the list");
    expect(workspace?.secondaryStep.label).toBe("Open events");
  });

  it("focuses committee chairs on event execution ownership", () => {
    const actor = getMockLocalActorContext("committee.chair@mymedlife.test");
    const workspace = getRushMonthEventDetailWorkspace(
      actor,
      "event-rush-med-talk-001",
    );

    expect(workspace?.title).toBe("Chair event execution check");
    expect(workspace?.nextStep.label).toBe("Open leader events");
    expect(workspace?.event?.lumaStatusTone).toBe("future_sync_disabled");
    expect(
      workspace?.readinessChecks.find((check) => check.label === "Luma posture")
        ?.status,
    ).toBe("disabled");
  });

  it("folds legacy campaign origin into the standard member event loop links", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getRushMonthEventDetailWorkspace(
      actor,
      "event-rush-med-talk-001",
      "campaigns",
    );

    expect(workspace?.nextStep.href).toBe("/app/points?source=events");
    expect(workspace?.secondaryStep.href).toBe("/app/events?source=events");
  });

  it("keeps DS Admin out of chapter event detail truth", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getRushMonthEventDetailWorkspace(
      actor,
      "event-rush-social-001",
    );

    expect(workspace?.canReadWorkspace).toBe(false);
    expect(workspace?.title).toBe("Event detail hidden for DS Admin");
    expect(workspace?.event).toBeNull();
    expect(workspace?.summary).toContain("should not read chapter event");
  });

  it("returns null for non-Rush or unknown event IDs", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");

    expect(getRushMonthEventDetailWorkspace(actor, "event-fundraiser-001")).toBeNull();
    expect(getRushMonthEventDetailWorkspace(actor, "missing-event")).toBeNull();
  });

  it("names future structured events and keeps outbox disabled", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getRushMonthEventDetailWorkspace(
      actor,
      "event-rush-social-001",
    );

    expect(workspace?.futureStructuredEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "chapter_event_viewed",
        "luma_event_linked",
        "luma_attendance_import_mocked",
        "kpi_event_recorded",
        "evidence_submitted",
      ]),
    );
    expect(
      workspace?.disabledOutboxItems.every((item) => item.status === "disabled"),
    ).toBe(true);
    expect(workspace?.disabledOutboxItems.map((item) => item.destination)).toEqual(
      expect.arrayContaining(["Luma", "n8n", "warehouse"]),
    );
  });

  it("supports live chapter-event ids when read-only event data is available", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing live event detail.");
    const workspace = getRushMonthEventDetailWorkspace(
      actor,
      "chapter-event-ucla-kickoff",
      null,
      data,
    );

    expect(workspace?.event?.title).toBe("Rush Month kickoff social");
    expect(workspace?.event?.memberDateTimeLabel).toBe("Sun Nov 15 · 10:00 AM - 12:00 PM");
    expect(workspace?.event?.memberLocationLabel).toBe("Bruin Plaza");
    expect(workspace?.event?.rsvpStatusLabel).toBe("RSVP already recorded");
    expect(
      workspace?.readinessChecks.find((check) => check.label === "Attendance posture")?.detail,
    ).toContain("24 attendee(s)");
  });
});
