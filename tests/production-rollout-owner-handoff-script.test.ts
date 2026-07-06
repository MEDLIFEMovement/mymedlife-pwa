import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production rollout owner handoff script", () => {
  it("writes the full owner handoff kit", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-handoff-"));
    const outDir = join(directory, "production-rollout-owner-handoff");

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-owner-handoff.mjs",
        "--out",
        outDir,
        "--minimum-chapters",
        "2",
        "--minimum-students",
        "3",
        "--minimum-pilot-chapters",
        "1",
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Production rollout owner handoff kit written");
    expect(output).toContain("Current status: NOT READY");
    expect(output).toContain("Owner progress: 0/7 owners ready");
    expect(existsSync(join(outDir, "README.md"))).toBe(true);
    expect(existsSync(join(outDir, "rollout-owner-packets", "README.md"))).toBe(true);
    expect(existsSync(join(outDir, "rollout-owner-packets", "ds-launch-owner", "users.csv"))).toBe(true);
    expect(existsSync(join(outDir, "production-rollout-owner-requests", "ds-launch-owner.md"))).toBe(true);
    expect(existsSync(join(outDir, "production-rollout-owner-email-drafts", "ds-launch-owner.md"))).toBe(true);
    expect(
      existsSync(
        join(outDir, "production-rollout-owner-send-tracker", "owner-send-tracker.csv"),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          outDir,
          "production-rollout-owner-send-tracker",
          "owner-recipient-assignments.csv",
        ),
      ),
    ).toBe(true);
    expect(
      readFileSync(
        join(outDir, "production-rollout-owner-email-drafts", "ds-launch-owner.md"),
        "utf8",
      ),
    ).toContain("Subject: myMEDLIFE rollout data request - DS / launch owner");
    expect(
      readFileSync(join(outDir, "production-rollout-owner-packet-status.md"), "utf8"),
    ).toContain("Owner progress: 0/7 owners ready");
    expect(
      readFileSync(
        join(outDir, "production-rollout-owner-send-tracker", "owner-send-tracker.csv"),
        "utf8",
      ),
    ).toContain("ds-launch-owner,DS / launch owner,no,3");
  });

  it("requires an output directory", () => {
    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-rollout-owner-handoff.mjs",
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

    throw new Error("Expected owner handoff script to require --out.");
  });
});

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
