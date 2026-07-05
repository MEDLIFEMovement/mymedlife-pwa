import { describe, expect, it } from "vitest";
import {
  createProductionLumaRuntimeRegistryExport,
  formatProductionLumaRuntimeRegistryExport,
} from "@/services/production-luma-mapping-readiness";
import type {
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

describe("production Luma runtime registry export", () => {
  it("creates the runtime registry JSON from approved packet mappings", () => {
    const output = createProductionLumaRuntimeRegistryExport(createPacket(5), {
      minimumChapterCount: 5,
      minimumPilotChapterCount: 5,
    });
    const parsed = JSON.parse(output.registryJson);
    const report = formatProductionLumaRuntimeRegistryExport(
      output,
      "/tmp/chapter-luma-map.json",
    );

    expect(output.ready).toBe(true);
    expect(Object.keys(output.registry)).toHaveLength(5);
    expect(parsed["chapter-01"]).toMatchObject({
      chapterId: "chapter-01",
      chapterName: "Chapter 01 MEDLIFE",
      calendarId: "cal-chapter-01",
      status: "ready",
    });
    expect(report).toContain("Production Luma runtime registry export: READY");
    expect(report).toContain("Production Luma mapping readiness: READY");
  });

  it("does not mark the registry export ready when packet mappings are unsafe", () => {
    const packet = createPacket(5);
    packet.lumaCalendars![0] = {
      chapterId: "chapter-01",
      calendarId: "sk_live_should_not_be_here",
      status: "linked",
    };
    const output = createProductionLumaRuntimeRegistryExport(packet, {
      minimumChapterCount: 5,
      minimumPilotChapterCount: 5,
    });

    expect(output.ready).toBe(false);
    expect(output.readiness.blockers).toContain(
      "chapter-01 has a calendar id that looks like a secret or API key. Replace it with the Luma calendar id only.",
    );
  });
});

function createPacket(chapterCount: number): ProductionRolloutBootstrapPacket {
  const chapters = Array.from({ length: chapterCount }, (_value, index) => {
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
        status: "linked",
      };
    }),
    pilotEventProof: chapters.slice(0, 5).map((chapter, index) => {
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
      };
    }),
    launchOwners: [],
  };
}
