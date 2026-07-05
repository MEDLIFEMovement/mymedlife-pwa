import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production rollout approval summary script", () => {
  it("writes a redacted approval summary markdown file", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-approval-summary-"));
    const packetPath = join(directory, "packet.json");
    const outPath = join(directory, "approval-summary.md");

    writeFileSync(packetPath, JSON.stringify(createPacket()));

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-approval-summary.mjs",
        packetPath,
        "--out",
        outPath,
      ],
      {
        encoding: "utf8",
      },
    );
    const report = readFileSync(outPath, "utf8");

    expect(output).toContain("Production rollout approval summary written to");
    expect(existsSync(outPath)).toBe(true);
    expect(report).toContain(
      "30-chapter approval summary: READY FOR FINAL GATE REVIEW",
    );
    expect(report).toContain("Batch 1 pilot: 5 chapter(s), 55 recipient(s)");
    expect(report).not.toContain("member.001@medlifemovement.org");
  });

  it("fails safely for an empty packet", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-approval-summary-"));
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
          "scripts/create-production-rollout-approval-summary.mjs",
          packetPath,
        ],
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      const output = getProcessOutput(error, "stdout");

      expect(output).toContain("30-chapter approval summary: NOT READY");
      expect(output).toContain("Rollout packet is not ready.");
      expect(output).toContain("One or more chapters still have launch data gaps.");
      return;
    }

    throw new Error("Expected empty approval summary to fail.");
  });
});

function createPacket() {
  const chapters = Array.from({ length: 30 }, (_value, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      id: `chapter-${number}`,
      name: `Chapter ${number} MEDLIFE`,
      campus: `Campus ${number}`,
      status: "active",
    };
  });
  let memberIndex = 0;

  return {
    chapters,
    users: [
      { email: "coach@medlifemovement.org", displayName: "Launch Coach" },
      { email: "admin@medlifemovement.org", displayName: "Launch Admin" },
      { email: "ds@medlifemovement.org", displayName: "DS Admin" },
      ...chapters.map((chapter, index) => {
        const number = String(index + 1).padStart(2, "0");

        return {
          email: `leader.${number}@medlifemovement.org`,
          displayName: `${chapter.name} Leader`,
        };
      }),
      ...Array.from({ length: 470 }, (_value, index) => {
        const number = String(index + 1).padStart(3, "0");

        return {
          email: `member.${number}@medlifemovement.org`,
          displayName: `Launch Member ${number}`,
        };
      }),
    ],
    memberships: [
      ...chapters.map((chapter, index) => {
        const number = String(index + 1).padStart(2, "0");

        return {
          email: `leader.${number}@medlifemovement.org`,
          chapterId: chapter.id,
          roleKey: "president_vp",
          status: "approved",
        };
      }),
      ...chapters.flatMap((chapter, index) =>
        Array.from({ length: getMemberCountForChapter(index) }, () => {
          memberIndex += 1;
          const memberNumber = String(memberIndex).padStart(3, "0");

          return {
            email: `member.${memberNumber}@medlifemovement.org`,
            chapterId: chapter.id,
            roleKey: "general_member",
            status: "approved",
          };
        }),
      ),
    ],
    staffRoles: [
      { email: "coach@medlifemovement.org", roleKey: "coach", status: "active" },
      { email: "admin@medlifemovement.org", roleKey: "admin", status: "active" },
      { email: "ds@medlifemovement.org", roleKey: "ds_admin", status: "active" },
    ],
    coachAssignments: chapters.map((chapter) => ({
      coachEmail: "coach@medlifemovement.org",
      chapterId: chapter.id,
      coachType: "portfolio",
      status: "active",
    })),
    campaigns: chapters.map((chapter, index) => {
      const number = String(index + 1).padStart(2, "0");

      return {
        chapterId: chapter.id,
        name: "Rush Month",
        slug: `rush-month-${number}`,
        status: "active",
      };
    }),
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
        eventRoute: `/app/events/evt-chapter-${number}`,
        attendanceRoute: `/leader?view=events&event=evt-chapter-${number}`,
        pointsRoute: `/leader?view=leaderboard&chapter=${chapter.id}`,
        auditRoute: "/admin/audit-log",
        outboxRoute: "/admin/integration-outbox",
        checkedAt: "2026-07-05T15:00:00Z",
        reviewedByEmail: "admin@medlifemovement.org",
      };
    }),
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
    signedInRouteProof: [
      ...chapters.slice(0, 5).flatMap((chapter, index) => {
        const number = String(index + 1).padStart(2, "0");
        const memberNumber = String(getFirstMemberNumberForChapter(index)).padStart(3, "0");

        return [
          {
            email: `member.${memberNumber}@medlifemovement.org`,
            workspace: "student_app",
            expectedPath: "/app",
            observedPath: "/app",
            status: "passed",
            checkedAt: "2026-07-05T15:00:00Z",
          },
          {
            email: `leader.${number}@medlifemovement.org`,
            workspace: "leader_command_center",
            expectedPath: "/leader?view=overview",
            observedPath: "/leader?view=overview",
            status: "passed",
            checkedAt: "2026-07-05T15:00:00Z",
          },
        ];
      }),
      {
        email: "coach@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-05T15:00:00Z",
      },
      {
        email: "admin@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-05T15:00:00Z",
      },
      {
        email: "ds@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
        checkedAt: "2026-07-05T15:00:00Z",
      },
    ],
  };
}

function getMemberCountForChapter(index: number) {
  if (index < 5) {
    return 10;
  }

  return index < 25 ? 17 : 16;
}

function getFirstMemberNumberForChapter(chapterIndex: number) {
  let memberNumber = 1;

  for (let index = 0; index < chapterIndex; index += 1) {
    memberNumber += getMemberCountForChapter(index);
  }

  return memberNumber;
}

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
