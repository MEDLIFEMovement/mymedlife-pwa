import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production rollout owner packets script", () => {
  it("writes owner-specific folders with README and CSV files", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-packets-"));
    const outPath = join(directory, "rollout-owner-packets");

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-owner-packets.mjs",
        "--out",
        outPath,
      ],
      {
        encoding: "utf8",
      },
    );
    const index = readFileSync(join(outPath, "README.md"), "utf8");
    const dsReadme = readFileSync(join(outPath, "ds-launch-owner", "README.md"), "utf8");
    const dsUsers = readFileSync(join(outPath, "ds-launch-owner", "users.csv"), "utf8");
    const lumaCsv = readFileSync(
      join(outPath, "luma-ds-owner", "luma-calendars.csv"),
      "utf8",
    );

    expect(output).toContain("Production rollout owner packets written to");
    expect(existsSync(join(outPath, "nick-hq-launch-owner", "chapters.csv"))).toBe(true);
    expect(index).toContain("myMEDLIFE 30-Chapter Rollout Owner Packets");
    expect(dsReadme).toContain("Prepare production users, staff roles");
    expect(dsUsers).toBe("email,displayName\n");
    expect(lumaCsv).toBe("chapterId,calendarId,calendarName,status\n");
    expect(index).not.toContain("student@medlifemovement.org");
  });

  it("requires an output path", () => {
    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-rollout-owner-packets.mjs",
        ],
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      expect(getProcessOutput(error, "stderr")).toContain(
        "Missing required argument --out.",
      );
      return;
    }

    throw new Error("Expected owner packets script to require --out.");
  });
});

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
