import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production rollout roster import script", () => {
  it("writes users and memberships CSVs without clobbering existing roster rows", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-rollout-roster-"));
    const rosterPath = join(directory, "rollout-roster.csv");
    const outDirectory = join(directory, "rollout-csv");

    writeFileSync(
      rosterPath,
      [
        "email,displayName,chapterId,roleKey,status,chapterName",
        "student@medlifemovement.org,Launch Student,chapter-ucla,general_member,approved,UCLA MEDLIFE",
        "leader@medlifemovement.org,Launch Leader,chapter-ucla,president_vp,approved,UCLA MEDLIFE",
        "",
      ].join("\n"),
    );

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-roster-import.mjs",
        "--roster",
        rosterPath,
        "--out-dir",
        outDirectory,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    expect(output).toContain("Production rollout roster import: READY");
    expect(output).toContain("- users: 2");
    expect(readFileSync(join(outDirectory, "users.csv"), "utf8")).toContain(
      "student@medlifemovement.org,Launch Student",
    );
    expect(readFileSync(join(outDirectory, "memberships.csv"), "utf8")).toContain(
      "leader@medlifemovement.org,chapter-ucla,president_vp,approved",
    );

    const failedOutput = runFailedImport(rosterPath, outDirectory);

    expect(failedOutput).toContain("already contains roster rows");
  });
});

function runFailedImport(rosterPath: string, outDirectory: string) {
  try {
    return execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-roster-import.mjs",
        "--roster",
        rosterPath,
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
