import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getRushMonthEventReadinessWorkspace } from "@/services/rush-month-event-readiness";

describe("rush month event readiness", () => {
  it("shows members the event, NPS, proof, and Luma readiness loop", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getRushMonthEventReadinessWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Your Rush Month events");
    expect(workspace.counts).toEqual({
      totalEvents: 2,
      mockLinkedLumaEvents: 1,
      disabledLumaSyncs: 1,
      npsPrompts: 2,
      proofPrompts: 2,
      externalWritesExpected: 0,
    });
    expect(workspace.rows.map((row) => row.title)).toEqual([
      "Freshman welcome social",
      "Health equity intro Med Talk",
    ]);
    expect(workspace.rows[0]?.rsvpStatusLabel).toBe("Registered locally");
    expect(workspace.rows[1]?.rsvpStatusLabel).toBe("RSVP not open");
    expect(workspace.rows[0]?.npsQuestion).toContain("recommend this MEDLIFE event");
    expect(workspace.rows[0]?.proofPrompt).toContain("bridge video");
  });

  it("keeps DS Admin out of chapter event truth", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getRushMonthEventReadinessWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(false);
    expect(workspace.title).toBe("Rush Month event readiness hidden for DS Admin");
    expect(workspace.rows).toEqual([]);
    expect(workspace.summary).toContain("should not read or own chapter event");
  });

  it("names future event records without enabling external destinations", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getRushMonthEventReadinessWorkspace(actor);

    expect(workspace.futureStructuredEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "luma_event_linked",
        "luma_attendance_import_mocked",
        "kpi_event_recorded",
        "evidence_submitted",
        "audit_log_recorded",
      ]),
    );
    expect(
      workspace.disabledOutboxItems.every((item) => item.status === "disabled"),
    ).toBe(true);
    expect(workspace.disabledOutboxItems.map((item) => item.destination)).toEqual(
      expect.arrayContaining(["Luma", "n8n", "warehouse"]),
    );
  });
});
