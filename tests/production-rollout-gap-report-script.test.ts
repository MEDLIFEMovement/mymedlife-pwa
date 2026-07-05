import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production rollout gap report script", () => {
  it("writes a read-only gap report markdown file", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-rollout-gaps-"));
    const packetPath = join(directory, "packet.json");
    const outPath = join(directory, "production-rollout-gaps.md");

    writeFileSync(packetPath, JSON.stringify(createPacket()));

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-gap-report.mjs",
        packetPath,
        "--out",
        outPath,
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
    const report = readFileSync(outPath, "utf8");

    expect(output).toContain("Production rollout gap report written to");
    expect(existsSync(outPath)).toBe(true);
    expect(report).toContain("Production rollout packet gaps: READY");
    expect(report).not.toContain("student@medlifemovement.org");
  });

  it("fails with useful missing-count gaps for an empty packet", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-rollout-gaps-"));
    const packetPath = join(directory, "packet.json");

    writeFileSync(packetPath, JSON.stringify({
      chapters: [],
      users: [],
      memberships: [],
      staffRoles: [],
      coachAssignments: [],
      campaigns: [],
      lumaCalendars: [],
      pilotEventProof: [],
      launchOwners: [],
      signedInRouteProof: [],
    }));

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-rollout-gap-report.mjs",
          packetPath,
        ],
        {
          encoding: "utf8",
        },
      );
    } catch (error) {
      const output = getProcessOutput(error, "stdout");

      expect(output).toContain("Production rollout packet gaps: NOT READY");
      expect(output).toContain("Add 30 more active chapter row(s).");
      expect(output).toContain("Add 500 more approved student/leader invitee(s).");
      return;
    }

    throw new Error("Expected empty rollout packet gap report to fail.");
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
      {
        email: "admin@medlifemovement.org",
        ownerType: "launch_decision",
        displayName: "Launch Admin",
        status: "active",
      },
    ],
    signedInRouteProof: [
      {
        email: "student@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
      },
      {
        email: "leader@medlifemovement.org",
        workspace: "leader_command_center",
        expectedPath: "/leader?view=overview",
        observedPath: "/leader?view=overview",
        status: "passed",
      },
      {
        email: "admin@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
      },
      {
        email: "ds@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
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
