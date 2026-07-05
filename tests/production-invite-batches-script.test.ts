import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production invite batches script", () => {
  it("reports a ready batch plan without sending invites", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-invite-batches-"));
    const packetPath = join(directory, "packet.json");

    writeFileSync(packetPath, JSON.stringify(createPacket()));

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-production-invite-batches.mjs",
        "--packet",
        packetPath,
        "--minimum-chapters",
        "1",
        "--minimum-students",
        "2",
        "--minimum-pilot-chapters",
        "1",
        "--max-recipients",
        "10",
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Production invite batch readiness: READY");
    expect(output).toContain("Batch 1 pilot: 1 chapter(s), 2 recipient(s)");
    expect(output).not.toContain("student@medlifemovement.org");
  });

  it("fails when the packet is missing pilot proof", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-invite-batches-"));
    const packetPath = join(directory, "packet.json");
    const packet = createPacket();

    packet.pilotEventProof = [];
    writeFileSync(packetPath, JSON.stringify(packet));

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/check-production-invite-batches.mjs",
          "--packet",
          packetPath,
          "--minimum-chapters",
          "1",
          "--minimum-students",
          "2",
          "--minimum-pilot-chapters",
          "1",
        ],
        {
          encoding: "utf8",
        },
      );
    } catch (error) {
      expect(getProcessOutput(error, "stdout")).toContain(
        "Production invite batch readiness: NOT READY",
      );
      expect(getProcessOutput(error, "stdout")).toContain(
        "Need 1 pilot-ready chapters in batch 1. Current pilot-ready chapters: 0.",
      );
      return;
    }

    throw new Error("Expected invite batch readiness to fail.");
  });
});

function createPacket() {
  return {
    chapters: [
      {
        id: "chapter-ucla",
        name: "UCLA MEDLIFE",
        campus: "UCLA",
        status: "active",
      },
    ],
    users: [
      { email: "student@medlifemovement.org", displayName: "Launch Student" },
      { email: "leader@medlifemovement.org", displayName: "Launch Leader" },
      { email: "coach@medlifemovement.org", displayName: "Launch Coach" },
      { email: "admin@medlifemovement.org", displayName: "Launch Admin" },
      { email: "ds@medlifemovement.org", displayName: "DS Admin" },
    ],
    memberships: [
      {
        email: "student@medlifemovement.org",
        chapterId: "chapter-ucla",
        roleKey: "general_member",
        status: "approved",
      },
      {
        email: "leader@medlifemovement.org",
        chapterId: "chapter-ucla",
        roleKey: "president_vp",
        status: "approved",
      },
    ],
    staffRoles: [
      { email: "coach@medlifemovement.org", roleKey: "coach", status: "active" },
      { email: "admin@medlifemovement.org", roleKey: "admin", status: "active" },
      { email: "ds@medlifemovement.org", roleKey: "ds_admin", status: "active" },
    ],
    coachAssignments: [
      {
        coachEmail: "coach@medlifemovement.org",
        chapterId: "chapter-ucla",
        coachType: "portfolio",
        status: "active",
      },
    ],
    campaigns: [
      {
        chapterId: "chapter-ucla",
        name: "Rush Month",
        slug: "rush-month-ucla",
        status: "active",
      },
    ],
    lumaCalendars: [
      {
        chapterId: "chapter-ucla",
        calendarId: "cal-ucla",
        calendarName: "UCLA Calendar",
        status: "linked",
      },
    ],
    pilotEventProof: [
      {
        chapterId: "chapter-ucla",
        eventName: "Rush Month Kickoff",
        lumaEventId: "evt-ucla",
        rsvpCount: 10,
        attendanceCount: 8,
        pointsAwardedCount: 8,
        auditEvidence: "recorded",
        outboxStatus: "zero_sends",
        status: "ready",
        eventRoute: "/app/events/evt-ucla",
        attendanceRoute: "/leader?view=events&event=evt-ucla",
        pointsRoute: "/leader?view=leaderboard&chapter=chapter-ucla",
        auditRoute: "/admin/audit-log",
        outboxRoute: "/admin/integration-outbox",
        checkedAt: "2026-07-05T15:00:00Z",
        reviewedByEmail: "admin@medlifemovement.org",
      },
    ],
    launchOwners: [
      {
        email: "admin@medlifemovement.org",
        ownerType: "support",
        displayName: "Launch Admin",
        status: "active",
      },
      {
        email: "ds@medlifemovement.org",
        ownerType: "rollback",
        displayName: "DS Admin",
        status: "active",
      },
      {
        email: "ds@medlifemovement.org",
        ownerType: "production_apply",
        displayName: "DS Admin",
        status: "active",
      },
    ],
  };
}

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
