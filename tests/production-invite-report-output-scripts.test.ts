import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production invite report output scripts", () => {
  it("writes an attachable invite batch report even when the packet is not ready", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-invite-batches-"));
    const packetPath = join(directory, "production-rollout-packet.json");
    const outPath = join(directory, "production-invite-batches.md");

    writeFileSync(
      packetPath,
      JSON.stringify({
        chapters: [],
        users: [],
        memberships: [],
        staffRoles: [],
        coachAssignments: [],
        campaigns: [],
        lumaCalendars: [],
        pilotEventProof: [],
        launchOwners: [],
      }),
    );

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/check-production-invite-batches.mjs",
          "--packet",
          packetPath,
          "--out",
          outPath,
        ],
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      const stdout = getProcessOutput(error, "stdout");
      const report = readFileSync(outPath, "utf8");

      expect(stdout).toContain("Production invite batch readiness written to");
      expect(existsSync(outPath)).toBe(true);
      expect(report).toContain("Production invite batch readiness: NOT READY");
      expect(report).toContain("Fix the invite-batch blockers");
      return;
    }

    throw new Error("Expected incomplete rollout packet to fail invite readiness.");
  });

  it("documents the final invite gate output option", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-production-invite-gate.mjs",
        "--help",
      ],
      {
        encoding: "utf8",
      },
    );
    const output = [result.stdout, result.stderr].join("\n");

    expect(result.status).toBe(0);
    expect(output).toContain("[--out production-invite-gate.md]");
  });
});

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
