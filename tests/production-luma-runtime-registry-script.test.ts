import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production Luma runtime registry script", () => {
  it("writes a runtime registry file from a ready packet", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-luma-registry-"));
    const packetPath = join(directory, "packet.json");
    const outPath = join(directory, "chapter-luma-map.json");

    writeFileSync(packetPath, JSON.stringify(createPacket()));

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-luma-runtime-registry.mjs",
        "--packet",
        packetPath,
        "--out",
        outPath,
        "--minimum-chapters",
        "1",
        "--minimum-pilot-chapters",
        "1",
      ],
      {
        encoding: "utf8",
      },
    );
    const registry = JSON.parse(readFileSync(outPath, "utf8"));

    expect(output).toContain("Production Luma runtime registry export: READY");
    expect(registry["chapter-ucla"]).toMatchObject({
      chapterId: "chapter-ucla",
      calendarId: "cal-ucla",
      status: "ready",
    });
  });

  it("does not write the registry file when readiness fails", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-luma-registry-"));
    const packetPath = join(directory, "packet.json");
    const outPath = join(directory, "chapter-luma-map.json");
    const packet = createPacket();
    packet.lumaCalendars = [];

    writeFileSync(packetPath, JSON.stringify(packet));

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-luma-runtime-registry.mjs",
          "--packet",
          packetPath,
          "--out",
          outPath,
          "--minimum-chapters",
          "1",
          "--minimum-pilot-chapters",
          "1",
        ],
        {
          encoding: "utf8",
        },
      );
    } catch (error) {
      expect(getProcessOutput(error, "stdout")).toContain(
        "Production Luma runtime registry export: NOT READY",
      );
      expect(existsSync(outPath)).toBe(false);
      return;
    }

    throw new Error("Expected registry export to fail.");
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

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
