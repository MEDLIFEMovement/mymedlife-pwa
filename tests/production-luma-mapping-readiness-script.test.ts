import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production Luma mapping readiness script", () => {
  it("compares the packet to a runtime mapping file without calling Luma", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-luma-mapping-"));
    const packetPath = join(directory, "packet.json");
    const mappingPath = join(directory, "mapping.json");

    writeFileSync(packetPath, JSON.stringify(createPacket()));
    writeFileSync(mappingPath, JSON.stringify({
      "chapter-ucla": "cal-ucla",
    }));

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-production-luma-mapping-readiness.mjs",
        "--packet",
        packetPath,
        "--mapping-json",
        mappingPath,
        "--minimum-chapters",
        "1",
        "--minimum-pilot-chapters",
        "1",
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Production Luma mapping readiness: READY");
    expect(output).toContain("- runtime matched active chapters: 1");
  });
});

function createPacket() {
  return {
    chapters: [
      {
        id: "chapter-ucla",
        name: "UCLA MEDLIFE",
        campus: "UCLA",
        region: "West",
      },
    ],
    users: [],
    memberships: [],
    staffRoles: [],
    coachAssignments: [],
    campaigns: [],
    lumaCalendars: [
      {
        chapterId: "chapter-ucla",
        calendarId: "cal-ucla",
        calendarName: "UCLA MEDLIFE Calendar",
        status: "linked",
      },
    ],
    pilotEventProof: [
      {
        chapterId: "chapter-ucla",
        eventName: "Rush Month Kickoff",
        lumaEventId: "evt-ucla",
        rsvpCount: 12,
        attendanceCount: 10,
        pointsAwardedCount: 10,
        auditEvidence: "recorded",
        outboxStatus: "zero_sends",
        status: "ready",
      },
    ],
    launchOwners: [],
  };
}
