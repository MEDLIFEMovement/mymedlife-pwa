import { describe, expect, it } from "vitest";
import {
  formatProductionPilotEventProofReadiness,
  getProductionPilotEventProofReadiness,
} from "@/services/production-pilot-event-proof";
import type {
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

describe("production pilot event proof readiness", () => {
  it("passes a focused five-chapter event loop packet without requiring the full 30-chapter packet", () => {
    const readiness = getProductionPilotEventProofReadiness(
      createPilotPacket(5),
    );

    expect(readiness.ready).toBe(true);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.counts.activeChapters).toBe(5);
    expect(readiness.counts.linkedLumaCalendars).toBe(5);
    expect(readiness.counts.provenPilotChapters).toBe(5);
    expect(readiness.counts.rsvpReadyRows).toBe(5);
    expect(readiness.counts.attendanceReadyRows).toBe(5);
    expect(readiness.counts.pointsReadyRows).toBe(5);
    expect(readiness.counts.reconciledReadyRows).toBe(5);
    expect(readiness.counts.auditReadyRows).toBe(5);
    expect(readiness.counts.zeroSendReadyRows).toBe(5);
    expect(readiness.counts.appRouteReadyRows).toBe(5);
    expect(readiness.nextSteps).toContain(
      "Save this report with the MED-504 evidence packet.",
    );
  });

  it("blocks broad invite prep when fewer than five pilot chapters are proven", () => {
    const readiness = getProductionPilotEventProofReadiness(
      createPilotPacket(4),
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "Add at least 5 active pilot chapters before five-chapter event-loop proof. Current active chapters: 4.",
    );
    expect(readiness.blockers).toContain(
      "Add linked Luma calendar mappings for at least 5 pilot chapters. Current linked Luma calendars: 4.",
    );
    expect(readiness.blockers).toContain(
      "Complete ready event-loop proof for at least 5 pilot chapters. Current proven pilot chapters: 4.",
    );
  });

  it("blocks ready rows that do not prove RSVP attendance points audit and zero-send safety", () => {
    const packet = createPilotPacket(5);
    packet.pilotEventProof![0] = {
      ...packet.pilotEventProof![0]!,
      rsvpCount: 0,
      attendanceCount: 0,
      pointsAwardedCount: 0,
      auditEvidence: "missing",
      outboxStatus: "sends_detected",
      checkedAt: "",
    };

    const readiness = getProductionPilotEventProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs at least one RSVP.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs at least one attendance check-in.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs at least one points award.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs recorded audit evidence.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs zero external sends in the outbox.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs a checkedAt timestamp.",
    );
  });

  it("blocks ready rows with an invalid review timestamp", () => {
    const packet = createPilotPacket(5);
    packet.pilotEventProof![0] = {
      ...packet.pilotEventProof![0]!,
      checkedAt: "soon",
    };

    const readiness = getProductionPilotEventProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 checkedAt must be a valid timestamp.",
    );
  });

  it("blocks ready rows when attendance and points do not reconcile", () => {
    const packet = createPilotPacket(5);
    packet.pilotEventProof![0] = {
      ...packet.pilotEventProof![0]!,
      rsvpCount: 8,
      attendanceCount: 10,
      pointsAwardedCount: 9,
    };

    const readiness = getProductionPilotEventProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.counts.reconciledReadyRows).toBe(4);
    expect(readiness.counts.provenPilotChapters).toBe(4);
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 attendanceCount cannot exceed rsvpCount until walk-in reconciliation is represented in the packet.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 pointsAwardedCount must match attendanceCount so every checked-in attendee is reflected in the leaderboard.",
    );
  });

  it("blocks external route links and unknown reviewers", () => {
    const packet = createPilotPacket(5);
    packet.pilotEventProof![0] = {
      ...packet.pilotEventProof![0]!,
      eventRoute: "https://luma.com/evt-chapter-01",
      attendanceRoute: "/unknown/attendance",
      reviewedByEmail: "unknown@medlifemovement.org",
    };

    const readiness = getProductionPilotEventProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 event route proof link must be an app route.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 attendance route proof link is not a known launch route: /unknown/attendance.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 reviewedByEmail references unknown user unknown@medlifemovement.org.",
    );
  });

  it("does not count paused or blocked rows as proven pilot chapters", () => {
    const packet = createPilotPacket(5);
    packet.pilotEventProof![0] = {
      ...packet.pilotEventProof![0]!,
      status: "needs_review",
    };

    const readiness = getProductionPilotEventProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.counts.readyProofRows).toBe(4);
    expect(readiness.counts.provenPilotChapters).toBe(4);
    expect(readiness.warnings).toContain(
      "chapter-01 pilot event evt-chapter-01 is marked needs_review; it will not count toward the five-chapter pilot proof.",
    );
  });

  it("formats a plain readiness report for reviewers", () => {
    const readiness = getProductionPilotEventProofReadiness(
      createPilotPacket(5),
    );
    const report = formatProductionPilotEventProofReadiness(readiness);

    expect(report).toContain("5-chapter pilot event loop proof: READY");
    expect(report).toContain("- proven pilot chapters: 5");
    expect(report).toContain("- rows with reconciled attendance and points: 5");
    expect(report).toContain("- rows with zero-send proof: 5");
  });
});

function createPilotPacket(chapterCount: number): ProductionRolloutBootstrapPacket {
  const chapters = Array.from({ length: chapterCount }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      id: `chapter-${number}`,
      name: `Chapter ${number} MEDLIFE`,
      campus: `Campus ${number}`,
      region: "Pilot",
    };
  });

  return {
    chapters,
    users: [
      {
        email: "reviewer@medlifemovement.org",
        displayName: "Pilot Reviewer",
      },
    ],
    memberships: [],
    staffRoles: [],
    coachAssignments: [],
    campaigns: [],
    lumaCalendars: chapters.map((chapter, index) => {
      const number = String(index + 1).padStart(2, "0");

      return {
        chapterId: chapter.id,
        calendarId: `cal-chapter-${number}`,
        calendarName: `${chapter.name} Calendar`,
        status: "linked",
      };
    }),
    pilotEventProof: chapters.map((chapter, index) => {
      const number = String(index + 1).padStart(2, "0");

      return {
        chapterId: chapter.id,
        eventName: "Rush Month Kickoff",
        lumaEventId: `evt-chapter-${number}`,
        rsvpCount: 12,
        attendanceCount: 10,
        pointsAwardedCount: 10,
        auditEvidence: "recorded",
        outboxStatus: "zero_sends",
        status: "ready",
        eventRoute: `/app/events/evt-chapter-${number}`,
        attendanceRoute: `/leader?view=events&event=evt-chapter-${number}`,
        pointsRoute: `/leader?view=leaderboard&chapter=${chapter.id}`,
        auditRoute: "/admin/audit-log",
        outboxRoute: "/admin/integration-outbox",
        checkedAt: "2026-07-05T15:00:00Z",
        reviewedByEmail: "reviewer@medlifemovement.org",
        notes: "RSVP, attendance, points, audit, and zero-send proof verified.",
      };
    }),
    launchOwners: [],
  };
}
