import { describe, expect, it } from "vitest";
import {
  formatPilotEventLoopProofPacket,
  getPilotEventLoopProofPacket,
} from "@/services/pilot-event-loop-proof-packet";
import type { ProductionRolloutBootstrapPacket } from "@/services/production-rollout-bootstrap";

describe("pilot event-loop proof packet", () => {
  it("stays local-only and summarizes the five-chapter pilot proof seam", () => {
    const packet = getPilotEventLoopProofPacket(buildReadyPacket());

    expect(packet.canReadPacket).toBe(true);
    expect(packet.localOnly).toBe(true);
    expect(packet.chapterCalendarSummary.readyCount).toBe(5);
    expect(packet.pilotEventProofReadiness.ready).toBe(true);
    expect(packet.pilotEventProofReadiness.counts.provenPilotChapters).toBe(5);
    expect(packet.noGoRules).toContain("No live provider calls.");
    expect(formatPilotEventLoopProofPacket(packet)).toContain(
      "Five-chapter pilot event-loop proof packet: READY",
    );
  });

  it("stays blocked when pilot proof does not reach five chapters", () => {
    const packet = getPilotEventLoopProofPacket(buildBlockedPacket());

    expect(packet.pilotEventProofReadiness.ready).toBe(false);
    expect(packet.pilotEventProofReadiness.blockers).toContain(
      "Complete ready event-loop proof for at least 5 pilot chapters. Current proven pilot chapters: 1.",
    );
    expect(packet.nextSmallestGoal).toBe(
      "Complete the five-chapter RSVP, attendance, points, audit, and zero-send rows before any live pilot claim.",
    );
  });
});

function buildReadyPacket(): ProductionRolloutBootstrapPacket {
  const chapters = Array.from({ length: 5 }, (_value, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      id: `chapter-${number}`,
      name: `Chapter ${number} MEDLIFE`,
      campus: `Campus ${number}`,
      region: "Pilot",
      status: "active" as const,
    };
  });

  return {
    chapters,
    users: [
      { email: "reviewer@medlifemovement.org", displayName: "Pilot Reviewer" },
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
        status: "linked" as const,
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
        auditEvidence: "recorded" as const,
        outboxStatus: "zero_sends" as const,
        status: "ready" as const,
        eventRoute: `/app/events/evt-chapter-${number}`,
        attendanceRoute: `/leader?view=events&event=evt-chapter-${number}`,
        pointsRoute: `/leader?view=leaderboard&chapter=chapter-${number}`,
        auditRoute: "/admin/audit-log",
        outboxRoute: "/admin/integration-outbox",
        checkedAt: "2026-07-05T20:00:00Z",
        reviewedByEmail: "reviewer@medlifemovement.org",
      };
    }),
    launchOwners: [],
  };
}

function buildBlockedPacket(): ProductionRolloutBootstrapPacket {
  const packet = buildReadyPacket();

  packet.pilotEventProof = [packet.pilotEventProof![0]!];
  packet.lumaCalendars = [packet.lumaCalendars![0]!];

  return packet;
}
