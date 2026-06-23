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
    expect(workspace?.summary).toBe(
      "See when to show up, what kind of student moment to create, and what proof to capture after the event.",
    );
    expect(workspace?.nextStep.href).toBe(
      "/rush-month/actions/member-push?event=event-rush-social-001&source=events",
    );
    expect(workspace?.nextStep.label).toBe("Start next action");
    expect(workspace?.nextStep.detail).toBe(
      "Show up ready, do the linked Rush Month action, and capture a quick proof note after the event.",
    );
    expect(workspace?.proofNextStep.href).toBe(
      "/rush-month/actions/member-push?step=submit&event=event-rush-social-001&source=events#submit-evidence",
    );
    expect(workspace?.proofNextStep.label).toBe("Submit evidence");
    expect(workspace?.proofNextStep.detail).toBe(
      "After the event, save one photo, quote, or short proof note on the same action route.",
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
    expect(workspace?.proofNextStep.label).toBe("Submit evidence");
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

  it("preserves campaign origin when the event detail was opened from the campaign route", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getRushMonthEventDetailWorkspace(
      actor,
      "event-rush-med-talk-001",
      "campaigns",
    );

    expect(workspace?.nextStep.href).toBe(
      "/rush-month/actions/member-push?event=event-rush-med-talk-001&source=campaigns",
    );
    expect(workspace?.proofNextStep.href).toBe(
      "/rush-month/actions/member-push?step=submit&event=event-rush-med-talk-001&source=campaigns#submit-evidence",
    );
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
