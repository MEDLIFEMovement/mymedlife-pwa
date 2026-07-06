import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production rollout packet build script", () => {
  it("writes the JSON packet only when filled CSV rows pass readiness", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-rollout-build-"));
    const outPath = join(directory, "production-rollout-packet.json");

    writeCsvFiles(directory, createReadyCsvFiles());

    const output = runBuildScript(directory, outPath, [
      "--minimum-chapters",
      "1",
      "--minimum-students",
      "2",
      "--minimum-pilot-chapters",
      "1",
    ]);

    expect(output).toContain("Production rollout packet written to");
    expect(output).toContain("Production rollout packet: READY");
    expect(JSON.parse(readFileSync(outPath, "utf8")).chapters).toHaveLength(1);
  });

  it("fails before writing when the CSV rows are header-only", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-rollout-build-"));
    const outPath = join(directory, "production-rollout-packet.json");

    writeCsvFiles(directory, createHeaderOnlyCsvFiles());

    try {
      runBuildScript(directory, outPath, [
        "--minimum-chapters",
        "1",
        "--minimum-students",
        "2",
        "--minimum-pilot-chapters",
        "1",
      ]);
    } catch (error) {
      expect(getProcessOutput(error, "stdout")).toContain(
        "Production rollout packet: NOT READY",
      );
      expect(getProcessOutput(error, "stdout")).toContain(
        "Production rollout packet was not written.",
      );
      expect(getProcessOutput(error, "stdout")).toContain(
        "Add launch users to users.csv before production rollout.",
      );
      expect(existsSync(outPath)).toBe(false);
      return;
    }

    throw new Error("Expected header-only CSV rows to fail before packet write.");
  });
});

function runBuildScript(
  directory: string,
  outPath: string,
  extraArgs: string[] = [],
) {
  return execFileSync(
    process.execPath,
    [
      "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
      "scripts/build-production-rollout-packet.mjs",
      "--chapters",
      join(directory, "chapters.csv"),
      "--users",
      join(directory, "users.csv"),
      "--memberships",
      join(directory, "memberships.csv"),
      "--staff-roles",
      join(directory, "staff-roles.csv"),
      "--coach-assignments",
      join(directory, "coach-assignments.csv"),
      "--campaigns",
      join(directory, "campaigns.csv"),
      "--luma-calendars",
      join(directory, "luma-calendars.csv"),
      "--pilot-event-proof",
      join(directory, "pilot-event-proof.csv"),
      "--launch-owners",
      join(directory, "launch-owners.csv"),
      "--signed-in-route-proof",
      join(directory, "signed-in-route-proof.csv"),
      "--out",
      outPath,
      ...extraArgs,
    ],
    {
      encoding: "utf8",
      stdio: "pipe",
    },
  );
}

function writeCsvFiles(directory: string, files: Record<string, string>) {
  mkdirSync(directory, { recursive: true });

  for (const [filename, content] of Object.entries(files)) {
    writeFileSync(join(directory, filename), `${content.trimEnd()}\n`);
  }
}

function createReadyCsvFiles() {
  return {
    "chapters.csv": "id,name,campus,region,status\nchapter-ucla,UCLA MEDLIFE,UCLA,West,active",
    "users.csv": [
      "email,displayName",
      "member@medlifemovement.org,Chapter Member",
      "leader@medlifemovement.org,Chapter Leader",
      "coach@medlifemovement.org,Launch Coach",
      "admin@medlifemovement.org,Launch Admin",
      "ds@medlifemovement.org,DS Admin",
    ].join("\n"),
    "memberships.csv": [
      "email,chapterId,roleKey,status",
      "member@medlifemovement.org,chapter-ucla,general_member,approved",
      "leader@medlifemovement.org,chapter-ucla,president_vp,approved",
    ].join("\n"),
    "staff-roles.csv": [
      "email,roleKey,status",
      "coach@medlifemovement.org,coach,active",
      "admin@medlifemovement.org,admin,active",
      "ds@medlifemovement.org,ds_admin,active",
    ].join("\n"),
    "coach-assignments.csv":
      "coachEmail,chapterId,coachType,status\ncoach@medlifemovement.org,chapter-ucla,portfolio,active",
    "campaigns.csv":
      "chapterId,name,slug,status\nchapter-ucla,Rush Month,rush-month-ucla,active",
    "luma-calendars.csv":
      "chapterId,calendarId,calendarName,status\nchapter-ucla,cal-ucla,UCLA MEDLIFE,linked",
    "pilot-event-proof.csv": [
      "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes",
      "chapter-ucla,Rush Month Kickoff,evt-ucla,12,10,10,recorded,zero_sends,ready,/app/events/evt-ucla,/leader?view=events&event=evt-ucla,/leader?view=leaderboard&chapter=chapter-ucla,/admin/audit-log,/admin/integration-outbox,2026-07-05T15:00:00Z,admin@medlifemovement.org,event loop proof verified",
    ].join("\n"),
    "launch-owners.csv": [
      "email,ownerType,displayName,status",
      "admin@medlifemovement.org,support,Launch Admin,active",
      "ds@medlifemovement.org,rollback,DS Admin,active",
      "ds@medlifemovement.org,production_apply,DS Admin,active",
    ].join("\n"),
    "signed-in-route-proof.csv": [
      "email,workspace,expectedPath,observedPath,status,checkedAt,notes",
      "member@medlifemovement.org,student_app,/app,/app,passed,2026-07-05T15:00:00Z,member proof",
      "leader@medlifemovement.org,leader_command_center,/leader?view=overview,/leader?view=overview,passed,2026-07-05T15:01:00Z,leader proof",
      "coach@medlifemovement.org,staff_command_center,/staff?view=chapters,/staff?view=chapters,passed,2026-07-05T15:02:00Z,staff proof",
      "ds@medlifemovement.org,admin_backend,/admin,/admin,passed,2026-07-05T15:03:00Z,admin proof",
    ].join("\n"),
  };
}

function createHeaderOnlyCsvFiles() {
  return {
    "chapters.csv": "id,name,campus,region,status",
    "users.csv": "email,displayName",
    "memberships.csv": "email,chapterId,roleKey,status",
    "staff-roles.csv": "email,roleKey,status",
    "coach-assignments.csv": "coachEmail,chapterId,coachType,status",
    "campaigns.csv": "chapterId,name,slug,status",
    "luma-calendars.csv": "chapterId,calendarId,calendarName,status",
    "pilot-event-proof.csv":
      "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes",
    "launch-owners.csv": "email,ownerType,displayName,status",
    "signed-in-route-proof.csv":
      "email,workspace,expectedPath,observedPath,status,checkedAt,notes",
  };
}

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
