import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production rollout rehearsal script", () => {
  it("writes a target-scale rehearsal report without creating a production packet", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-rehearsal-"));
    const outPath = join(directory, "production-rollout-rehearsal.md");

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-production-rollout-rehearsal.mjs",
        "--out",
        outPath,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );
    const report = readFileSync(outPath, "utf8");

    expect(output).toContain("Production rollout rehearsal written to");
    expect(report).toContain("30-chapter rollout rehearsal: READY");
    expect(report).toContain("- active Test chapters: 30");
    expect(report).toContain("- approved Test student/leader invitees: 500");
    expect(report).toContain("Stage summary: 6/6 passed");
    expect(report).toContain("Batch 1 pilot: 5 chapter(s), 55 recipient(s)");
    expect(report).not.toContain("test.member.001@medlifemovement.org");
    expect(existsSync(join(directory, "production-rollout-packet.json"))).toBe(
      false,
    );
  });

  it("returns NOT READY when the rehearsal exposes a batch cap issue", () => {
    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/check-production-rollout-rehearsal.mjs",
          "--max-recipients",
          "50",
        ],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      expect(getProcessOutput(error, "stdout")).toContain(
        "30-chapter rollout rehearsal: NOT READY",
      );
      expect(getProcessOutput(error, "stdout")).toContain(
        "Batch 1 has 55 invitees, which exceeds the cap of 50.",
      );
      return;
    }

    throw new Error("Expected rehearsal script to fail with a low batch cap.");
  });
});

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
