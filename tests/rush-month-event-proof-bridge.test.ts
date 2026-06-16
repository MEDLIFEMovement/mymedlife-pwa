import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getEventProofBridgeWorkspace } from "@/services/rush-month-event-proof-bridge";

describe("rush month event proof bridge", () => {
  it("gives members a simple attend-feedback-proof loop", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getEventProofBridgeWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.mode).toBe("member");
    expect(workspace.title).toBe("Attend, reflect, and share what mattered.");
    expect(workspace.primaryCta).toEqual({
      href: "/proof-library/upload",
      label: "Preview proof intake",
    });
    expect(workspace.rows).toHaveLength(2);
    expect(workspace.rows[0]?.steps.map((step) => step.futureEventType)).toEqual([
      "chapter_event_attended",
      "event_feedback_submitted",
      "evidence_submitted",
    ]);
  });

  it("gives action committee members proof-support guidance", () => {
    const actor = getMockLocalActorContext("committee.member@mymedlife.test");
    const workspace = getEventProofBridgeWorkspace(actor);

    expect(workspace.mode).toBe("committee_member");
    expect(workspace.title).toContain("Support the event");
    expect(workspace.summary).toContain("event action");
    expect(workspace.rows.map((row) => row.title)).toEqual([
      "Freshman welcome social",
      "Health equity intro Med Talk",
    ]);
  });

  it("focuses action committee chairs on chair-owned events", () => {
    const actor = getMockLocalActorContext("committee.chair@mymedlife.test");
    const workspace = getEventProofBridgeWorkspace(actor);

    expect(workspace.mode).toBe("committee_chair");
    expect(workspace.title).toContain("Close the loop");
    expect(workspace.rows.map((row) => row.title)).toEqual(["Freshman welcome social"]);
    expect(workspace.primaryCta.href).toBe("/action-committees");
  });

  it("helps coaches use event follow-through as a health signal", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getEventProofBridgeWorkspace(actor);

    expect(workspace.mode).toBe("coach");
    expect(workspace.summary).toContain("advance/hold/intervene");
    expect(workspace.primaryCta.href).toBe("/coach");
  });

  it("keeps DS Admin out of event proof truth", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getEventProofBridgeWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(false);
    expect(workspace.rows).toEqual([]);
    expect(workspace.title).toBe("Event proof bridge hidden for DS Admin");
    expect(workspace.summary).toContain("should not read student attendance");
  });

  it("names future structured records and disabled external destinations", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getEventProofBridgeWorkspace(actor);

    expect(workspace.futureStructuredEvents).toEqual(
      expect.arrayContaining([
        "chapter_event_attended",
        "event_feedback_submitted",
        "evidence_submitted",
        "automation_outbox_recorded",
        "audit_log_recorded",
      ]),
    );
    expect(workspace.disabledOutboxDestinations).toEqual(
      expect.arrayContaining([
        "Luma check-in import disabled",
        "n8n NPS reminder disabled",
        "warehouse event export disabled",
      ]),
    );
  });
});
