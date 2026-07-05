import { describe, expect, it } from "vitest";
import {
  formatProductionLumaMappingReadiness,
  getProductionLumaMappingReadiness,
} from "@/services/production-luma-mapping-readiness";
import type {
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

describe("production Luma mapping readiness", () => {
  it("blocks when the packet has mappings but the runtime registry is not supplied", () => {
    const readiness = getProductionLumaMappingReadiness(createPacket(5), {
      minimumChapterCount: 5,
      minimumPilotChapterCount: 5,
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "Add the runtime chapter-to-Luma mapping before hosted rollout proof. Set MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON or pass --mapping-json with the approved registry.",
    );
    expect(readiness.counts.packetMappedActiveChapters).toBe(5);
    expect(readiness.counts.runtimeMappedActiveChapters).toBe(0);
  });

  it("passes when packet and runtime mappings cover the launch chapters", () => {
    const packet = createPacket(5);
    const readiness = getProductionLumaMappingReadiness(packet, {
      minimumChapterCount: 5,
      minimumPilotChapterCount: 5,
      runtimeMappingJson: createRuntimeMap(packet),
    });
    const report = formatProductionLumaMappingReadiness(readiness);

    expect(readiness.ready).toBe(true);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.counts.runtimeMatchedActiveChapters).toBe(5);
    expect(readiness.counts.pilotMappedChapters).toBe(5);
    expect(report).toContain("Production Luma mapping readiness: READY");
    expect(report).not.toContain("cal-chapter-01");
  });

  it("blocks missing duplicate and mismatched mappings", () => {
    const packet = createPacket(5);
    packet.lumaCalendars = [
      ...packet.lumaCalendars!,
      {
        chapterId: "chapter-01",
        calendarId: "cal-duplicate",
        status: "linked",
      },
      {
        chapterId: "chapter-unknown",
        calendarId: "cal-unknown",
        status: "linked",
      },
    ];
    packet.lumaCalendars![3] = {
      chapterId: "chapter-04",
      calendarId: "sk_live_should_not_be_here",
      status: "linked",
    };
    packet.lumaCalendars![4] = {
      chapterId: "chapter-05",
      calendarId: "",
      status: "linked",
    };
    const runtimeMap = JSON.stringify({
      "chapter-01": "cal-chapter-01",
      "chapter-02": "cal-other",
      "chapter-03": "cal-chapter-03",
    });

    const readiness = getProductionLumaMappingReadiness(packet, {
      minimumChapterCount: 5,
      minimumPilotChapterCount: 5,
      runtimeMappingJson: runtimeMap,
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain("Duplicate linked Luma mapping for chapter chapter-01.");
    expect(readiness.blockers).toContain(
      "Linked Luma mapping cal-...nown references unknown or inactive chapter chapter-unknown.",
    );
    expect(readiness.blockers).toContain(
      "chapter-04 has a calendar id that looks like a secret or API key. Replace it with the Luma calendar id only.",
    );
    expect(readiness.blockers).toContain(
      "Missing runtime Luma calendar mappings for Chapter 04 MEDLIFE, Chapter 05 MEDLIFE.",
    );
    expect(readiness.blockers).toContain(
      "Chapter 02 MEDLIFE has different packet and runtime Luma calendar ids (cal-...r-02 vs cal-...ther).",
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

function createRuntimeMap(packet: ProductionRolloutBootstrapPacket) {
  return JSON.stringify(Object.fromEntries(
    packet.lumaCalendars!.map((calendar) => [
      calendar.chapterId,
      calendar.calendarId,
    ]),
  ));
}
