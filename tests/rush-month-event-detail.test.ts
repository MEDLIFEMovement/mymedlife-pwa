import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
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
    expect(workspace?.nextStep.href).toBe("/rush-month/actions");
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
  });

  it("focuses committee chairs on event execution ownership", () => {
    const actor = getMockLocalActorContext("committee.chair@mymedlife.test");
    const workspace = getRushMonthEventDetailWorkspace(
      actor,
      "event-rush-med-talk-001",
    );

    expect(workspace?.title).toBe("Chair event execution check");
    expect(workspace?.nextStep.label).toBe("Check event assignments");
    expect(workspace?.event?.lumaStatusTone).toBe("future_sync_disabled");
    expect(
      workspace?.readinessChecks.find((check) => check.label === "Luma posture")
        ?.status,
    ).toBe("disabled");
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
});
