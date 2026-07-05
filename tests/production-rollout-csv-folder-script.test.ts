import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getProductionRolloutCsvTemplateContent,
  productionRolloutCsvTemplates,
} from "@/services/production-rollout-csv-templates";

describe("production rollout CSV folder script", () => {
  it("checks a filled CSV folder without writing a JSON packet", () => {
    const directory = makeCsvDirectory({
      "chapters.csv": [
        "id,name,campus,region,status",
        "chapter-ucla,UCLA MEDLIFE,UCLA,West,active",
      ].join("\n"),
      "users.csv": [
        "email,displayName",
        "leader@medlifemovement.org,Chapter Leader",
        "member@medlifemovement.org,Chapter Member",
        "coach@medlifemovement.org,Launch Coach",
        "admin@medlifemovement.org,Launch Admin",
        "ds@medlifemovement.org,DS Admin",
      ].join("\n"),
      "memberships.csv": [
        "email,chapterId,roleKey,status",
        "leader@medlifemovement.org,chapter-ucla,president_vp,approved",
        "member@medlifemovement.org,chapter-ucla,general_member,approved",
      ].join("\n"),
      "staff-roles.csv": [
        "email,roleKey,status",
        "coach@medlifemovement.org,coach,active",
        "admin@medlifemovement.org,admin,active",
        "ds@medlifemovement.org,ds_admin,active",
      ].join("\n"),
      "coach-assignments.csv": [
        "coachEmail,chapterId,coachType,status",
        "coach@medlifemovement.org,chapter-ucla,portfolio,active",
      ].join("\n"),
      "campaigns.csv": [
        "chapterId,name,slug,status",
        "chapter-ucla,Rush Month,rush-month-ucla,active",
      ].join("\n"),
      "luma-calendars.csv": [
        "chapterId,calendarId,calendarName,status",
        "chapter-ucla,cal-ucla,UCLA MEDLIFE,linked",
      ].join("\n"),
      "pilot-event-proof.csv": [
        "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status",
        "chapter-ucla,Rush Month Kickoff,evt-ucla,12,10,10,recorded,zero_sends,ready",
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
    });

    const output = runCsvFolderCheck(
      directory,
      "--minimum-chapters",
      "1",
      "--minimum-students",
      "2",
      "--minimum-pilot-chapters",
      "1",
    );

    expect(output).toContain("Production rollout packet: READY");
    expect(output).toContain("Next: run pnpm rollout:build");
  });

  it("names empty CSV sections before reviewers build the JSON packet", () => {
    const directory = makeCsvDirectory(Object.fromEntries(
      productionRolloutCsvTemplates.map((template) => [
        template.filename,
        getProductionRolloutCsvTemplateContent(template),
      ]),
    ));

    expect(runFailedCsvFolderCheck(directory)).toContain(
      "Add launch users to users.csv before production rollout.",
    );
  });
});

function makeCsvDirectory(files: Record<string, string>) {
  const directory = mkdtempSync(join(tmpdir(), "mymedlife-rollout-csv-"));

  for (const [filename, content] of Object.entries(files)) {
    writeFileSync(join(directory, filename), `${content.trimEnd()}\n`);
  }

  return directory;
}

function runCsvFolderCheck(directory: string, ...extraArgs: string[]) {
  return execFileSync(
    process.execPath,
    [
      "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
      "scripts/check-production-rollout-csv-folder.mjs",
      "--dir",
      directory,
      ...extraArgs,
    ],
    {
      encoding: "utf8",
    },
  );
}

function runFailedCsvFolderCheck(directory: string) {
  try {
    runCsvFolderCheck(directory);
  } catch (error) {
    return [
      getProcessOutput(error, "stdout"),
      getProcessOutput(error, "stderr"),
    ].join("\n");
  }

  throw new Error("Expected CSV folder check to fail.");
}

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
