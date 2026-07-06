import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production rollout chapter import script", () => {
  it("writes chapter-level rollout CSVs and protects existing rows", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-rollout-chapters-"));
    const chaptersPath = join(directory, "launch-chapters.csv");
    const outDirectory = join(directory, "rollout-csv");

    writeFileSync(
      chaptersPath,
      [
        "chapterId,chapterName,campus,region,coachEmail,coachType,calendarId,calendarName,campaignName,campaignSlug",
        "chapter-ucla,UCLA MEDLIFE,UCLA,West,coach@medlifemovement.org,portfolio,cal-ucla,UCLA Calendar,Rush Month,rush-month-ucla",
        "",
      ].join("\n"),
    );

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-chapter-import.mjs",
        "--chapters",
        chaptersPath,
        "--out-dir",
        outDirectory,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    expect(output).toContain("Production rollout chapter import: READY");
    expect(output).toContain("- chapters: 1");
    expect(readFileSync(join(outDirectory, "chapters.csv"), "utf8")).toContain(
      "chapter-ucla,UCLA MEDLIFE,UCLA,West,active",
    );
    expect(readFileSync(join(outDirectory, "coach-assignments.csv"), "utf8")).toContain(
      "coach@medlifemovement.org,chapter-ucla,portfolio,active",
    );
    expect(readFileSync(join(outDirectory, "campaigns.csv"), "utf8")).toContain(
      "chapter-ucla,Rush Month,rush-month-ucla,active",
    );
    expect(readFileSync(join(outDirectory, "luma-calendars.csv"), "utf8")).toContain(
      "chapter-ucla,cal-ucla,UCLA Calendar,linked",
    );

    const failedOutput = runFailedImport(chaptersPath, outDirectory);

    expect(failedOutput).toContain("already contains rollout rows");
  });
});

function runFailedImport(chaptersPath: string, outDirectory: string) {
  try {
    return execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-chapter-import.mjs",
        "--chapters",
        chaptersPath,
        "--out-dir",
        outDirectory,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch (error) {
    return [
      getProcessOutput(error, "stdout"),
      getProcessOutput(error, "stderr"),
    ].join("\n");
  }
}

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
