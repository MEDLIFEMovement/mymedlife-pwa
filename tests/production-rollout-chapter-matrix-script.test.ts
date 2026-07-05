import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production rollout chapter matrix script", () => {
  it("writes a read-only chapter matrix markdown file", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-chapter-matrix-"));
    const csvDir = join(directory, "rollout-csv");
    const outPath = join(directory, "chapter-matrix.md");
    mkdirSync(csvDir);
    writeReadyCsvFolder(csvDir);

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-chapter-matrix.mjs",
        "--dir",
        csvDir,
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
    const report = readFileSync(outPath, "utf8");

    expect(output).toContain("Production rollout chapter matrix written to");
    expect(existsSync(outPath)).toBe(true);
    expect(report).toContain("Production rollout chapter matrix: READY");
    expect(report).toContain("| UCLA MEDLIFE | 2 | pass | pass | pass | pass | pass | pass | pass | ready |");
    expect(report).not.toContain("member@medlifemovement.org");
  });

  it("fails with useful chapter-level blockers for header-only CSVs", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-chapter-matrix-"));
    const csvDir = join(directory, "rollout-csv");
    mkdirSync(csvDir);
    writeHeaderOnlyCsvFolder(csvDir);

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-rollout-chapter-matrix.mjs",
          "--dir",
          csvDir,
        ],
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      const output = getProcessOutput(error, "stdout");

      expect(output).toContain("Production rollout chapter matrix: NOT READY");
      expect(output).toContain("Add 30 more active chapter row(s).");
      expect(output).toContain("No active chapters in the packet.");
      return;
    }

    throw new Error("Expected header-only rollout CSV matrix to fail.");
  });
});

function writeReadyCsvFolder(csvDir: string) {
  writeFileSync(
    join(csvDir, "chapters.csv"),
    "id,name,campus,region,status\nchapter-ucla,UCLA MEDLIFE,UCLA,West,active\n",
  );
  writeFileSync(
    join(csvDir, "users.csv"),
    [
      "email,displayName",
      "member@medlifemovement.org,Launch Member",
      "leader@medlifemovement.org,Launch Leader",
      "coach@medlifemovement.org,Launch Coach",
      "admin@medlifemovement.org,Launch Admin",
    ].join("\n"),
  );
  writeFileSync(
    join(csvDir, "memberships.csv"),
    [
      "email,chapterId,roleKey,status",
      "member@medlifemovement.org,chapter-ucla,general_member,approved",
      "leader@medlifemovement.org,chapter-ucla,president_vp,approved",
    ].join("\n"),
  );
  writeFileSync(
    join(csvDir, "staff-roles.csv"),
    [
      "email,roleKey,status",
      "coach@medlifemovement.org,coach,active",
      "admin@medlifemovement.org,ds_admin,active",
    ].join("\n"),
  );
  writeFileSync(
    join(csvDir, "coach-assignments.csv"),
    "coachEmail,chapterId,coachType,status\ncoach@medlifemovement.org,chapter-ucla,portfolio,active\n",
  );
  writeFileSync(
    join(csvDir, "campaigns.csv"),
    "chapterId,name,slug,status\nchapter-ucla,Rush Month,rush-month-ucla,active\n",
  );
  writeFileSync(
    join(csvDir, "luma-calendars.csv"),
    "chapterId,calendarId,calendarName,status\nchapter-ucla,cal-ucla,UCLA MEDLIFE,linked\n",
  );
  writeFileSync(
    join(csvDir, "pilot-event-proof.csv"),
    [
      "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes",
      "chapter-ucla,Rush Month Kickoff,evt-ucla,12,10,10,recorded,zero_sends,ready,/app/events/evt-ucla,/leader?view=events&event=evt-ucla,/leader?view=leaderboard&chapter=chapter-ucla,/admin/audit-log,/admin/integration-outbox,2026-07-05T15:00:00Z,admin@medlifemovement.org,event loop proof verified",
    ].join("\n"),
  );
  writeFileSync(
    join(csvDir, "launch-owners.csv"),
    "email,ownerType,displayName,status\nadmin@medlifemovement.org,support,Launch Admin,active\n",
  );
  writeFileSync(
    join(csvDir, "signed-in-route-proof.csv"),
    [
      "email,workspace,expectedPath,observedPath,status,checkedAt,notes",
      "member@medlifemovement.org,student_app,/app,/app,passed,2026-07-05T15:01:00Z,member proof",
      "leader@medlifemovement.org,leader_command_center,/leader?view=overview,/leader?view=overview,passed,2026-07-05T15:02:00Z,leader proof",
    ].join("\n"),
  );
}

function writeHeaderOnlyCsvFolder(csvDir: string) {
  writeFileSync(join(csvDir, "chapters.csv"), "id,name,campus,region,status\n");
  writeFileSync(join(csvDir, "users.csv"), "email,displayName\n");
  writeFileSync(join(csvDir, "memberships.csv"), "email,chapterId,roleKey,status\n");
  writeFileSync(join(csvDir, "staff-roles.csv"), "email,roleKey,status\n");
  writeFileSync(
    join(csvDir, "coach-assignments.csv"),
    "coachEmail,chapterId,coachType,status\n",
  );
  writeFileSync(join(csvDir, "campaigns.csv"), "chapterId,name,slug,status\n");
  writeFileSync(
    join(csvDir, "luma-calendars.csv"),
    "chapterId,calendarId,calendarName,status\n",
  );
  writeFileSync(
    join(csvDir, "pilot-event-proof.csv"),
    "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes\n",
  );
  writeFileSync(
    join(csvDir, "launch-owners.csv"),
    "email,ownerType,displayName,status\n",
  );
  writeFileSync(
    join(csvDir, "signed-in-route-proof.csv"),
    "email,workspace,expectedPath,observedPath,status,checkedAt,notes\n",
  );
}

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
