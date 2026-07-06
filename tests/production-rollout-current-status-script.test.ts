import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production rollout current status script", () => {
  it("writes a NOT READY report when owner artifacts are missing", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-current-status-"));
    const outPath = join(directory, "production-rollout-current-status.md");

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/check-production-rollout-current-status.mjs",
          "--owner-dir",
          join(directory, "rollout-owner-packets"),
          "--csv-dir",
          join(directory, "rollout-csv"),
          "--packet",
          join(directory, "production-rollout-packet.json"),
          "--live-data-counts",
          join(directory, "production-live-data-counts.txt"),
          "--out",
          outPath,
        ],
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      expect(getProcessOutput(error, "stdout")).toContain(
        "Production rollout current status written to",
      );
      const report = readFileSync(outPath, "utf8");

      expect(existsSync(outPath)).toBe(true);
      expect(report).toContain("30-chapter rollout current status: NOT READY");
      expect(report).toContain("owner packet folder: MISSING");
      expect(report).toContain(
        "pnpm rollout:owner-handoff --out production-rollout-owner-handoff",
      );
      expect(report).not.toContain("student@example.com");
      expect(report).not.toContain("password,");
      return;
    }

    throw new Error("Expected current status script to exit not ready.");
  });
});

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
