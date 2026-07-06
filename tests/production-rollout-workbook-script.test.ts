import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production rollout workbook script", () => {
  it("writes the workbook markdown file", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-rollout-workbook-"));
    const outPath = join(directory, "production-rollout-workbook.md");

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-workbook.mjs",
        "--out",
        outPath,
        "--csv-dir",
        "rollout-csv",
      ],
      {
        encoding: "utf8",
      },
    );
    const workbook = readFileSync(outPath, "utf8");

    expect(output).toContain("Production rollout workbook written to");
    expect(existsSync(outPath)).toBe(true);
    expect(workbook).toContain("myMEDLIFE 30-Chapter Production Rollout Workbook");
    expect(workbook).toContain("pnpm rollout:owner-packets --out rollout-owner-packets");
    expect(workbook).toContain(
      "pnpm rollout:assemble-owner-packets --owner-dir rollout-owner-packets --out rollout-csv",
    );
    expect(workbook).toContain(
      "pnpm rollout:data-request --dir rollout-csv --out production-rollout-data-request.md",
    );
    expect(workbook).toContain("pnpm rollout:check-csv --dir rollout-csv");
    expect(workbook).not.toContain("student@medlifemovement.org");
  });

  it("requires an output path", () => {
    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-rollout-workbook.mjs",
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

    throw new Error("Expected workbook script to require --out.");
  });
});

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
