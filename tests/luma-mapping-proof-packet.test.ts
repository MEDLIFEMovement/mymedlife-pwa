import { describe, expect, it } from "vitest";
import { getLumaMappingProofPacket, formatLumaMappingProofPacket } from "@/services/luma-mapping-proof-packet";
import type { ProductionRolloutBootstrapPacket } from "@/services/production-rollout-bootstrap";

describe("Luma mapping proof packet", () => {
  it("stays local-only and proves chapter mapping readiness from one packet", () => {
    const packet = getLumaMappingProofPacket(buildPilotReadyPacket());

    expect(packet.canReadPacket).toBe(true);
    expect(packet.localOnly).toBe(true);
    expect(packet.mappingReadiness.ready).toBe(true);
    expect(packet.runtimeRegistryExport.ready).toBe(true);
    expect(packet.chapterCalendarSummary.readyCount).toBe(5);
    expect(packet.chapterCalendarSummary.sharedDefaultCount).toBe(0);
    expect(packet.rolloutStages.map((stage) => stage.status)).toEqual([
      "ready",
      "ready",
      "blocked",
      "blocked",
    ]);
    expect(packet.noGoRules).toContain("No live Luma provider calls.");
    expect(packet.noGoRules).toContain(
      "No pilot-ready mapping claim becomes rollout-ready until signed-in proof, pilot event proof, invite-gate proof, and live counts all exist.",
    );
    expect(formatLumaMappingProofPacket(packet)).toContain(
      "Luma mapping proof packet: READY",
    );
  });

  it("stays blocked when the packet cannot cover the pilot chapters", () => {
    const packet = getLumaMappingProofPacket(buildBlockedPacket());

    expect(packet.mappingReadiness.ready).toBe(false);
    expect(packet.runtimeRegistryExport.ready).toBe(false);
    expect(packet.mappingReadiness.blockers).toContain(
      "Map at least 5 pilot chapters in both the packet and runtime registry before five-chapter event-loop proof. Current pilot-ready mapped chapters: 1.",
    );
    expect(packet.nextSmallestGoal).toBe(
      "Fix the chapter-to-Luma mapping blockers before widening into pilot evidence.",
    );
  });
});

function buildPilotReadyPacket(): ProductionRolloutBootstrapPacket {
  const chapters = Array.from({ length: 5 }, (_value, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      id: `chapter-${number}`,
      name: `Chapter ${number} MEDLIFE`,
      campus: `Campus ${number}`,
      region: index % 2 === 0 ? "West" : "East",
      status: "active" as const,
    };
  });

  return {
    chapters,
    users: [],
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
        rsvpCount: 15,
        attendanceCount: 12,
        pointsAwardedCount: 12,
        auditEvidence: "recorded" as const,
        outboxStatus: "zero_sends" as const,
        status: "ready" as const,
        eventRoute: `/app/events/chapter-${number}`,
        attendanceRoute: `/admin/attendance/chapter-${number}`,
        pointsRoute: `/app/points/chapter-${number}`,
        auditRoute: `/admin/integration-outbox/chapter-${number}`,
        outboxRoute: `/admin/integration-outbox/chapter-${number}`,
      };
    }),
    launchOwners: [],
  };
}

function buildBlockedPacket(): ProductionRolloutBootstrapPacket {
  const packet = buildPilotReadyPacket();

  packet.lumaCalendars = [
    {
      chapterId: packet.chapters[0].id,
      calendarId: "cal-chapter-01",
      calendarName: "Chapter 01 MEDLIFE Calendar",
      status: "linked",
    },
  ];
  packet.pilotEventProof = [
    {
      chapterId: packet.chapters[0].id,
      eventName: "Rush Month Kickoff",
      lumaEventId: "evt-chapter-01",
      rsvpCount: 15,
      attendanceCount: 12,
      pointsAwardedCount: 12,
      auditEvidence: "recorded",
      outboxStatus: "zero_sends",
      status: "ready",
    },
  ];

  return packet;
}
