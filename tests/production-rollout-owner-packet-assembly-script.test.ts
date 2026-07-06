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
import {
  getProductionRolloutOwnerPacketFiles,
  getProductionRolloutOwnerPackets,
} from "@/services/production-rollout-owner-packets";

describe("production rollout owner packet assembly script", () => {
  it("assembles filled owner folders into one rollout CSV folder", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-assembly-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    const outDir = join(directory, "rollout-csv");
    writeOwnerPacketFolders(ownerDir, [], {
      "chapters.csv": 2,
      "users.csv": 3,
      "memberships.csv": 3,
      "staff-roles.csv": 1,
      "coach-assignments.csv": 2,
      "campaigns.csv": 2,
      "luma-calendars.csv": 2,
      "pilot-event-proof.csv": 1,
      "launch-owners.csv": 3,
      "signed-in-route-proof.csv": 4,
    });

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/assemble-production-rollout-owner-packets.mjs",
        "--owner-dir",
        ownerDir,
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

    expect(output).toContain("myMEDLIFE owner packet assembly: READY");
    expect(output).toContain("Production rollout CSV folder assembled at");
    expect(readFileSync(join(outDir, "users.csv"), "utf8")).toContain(
      "email,displayName\nvalue-0",
    );
    expect(readFileSync(join(outDir, "ASSEMBLY_REPORT.md"), "utf8")).toContain(
      "pnpm rollout:check-csv --dir",
    );
    expect(existsSync(join(outDir, "luma-calendars.csv"))).toBe(true);
  });

  it("fails before writing when owner files are only header templates", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-assembly-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    const outDir = join(directory, "rollout-csv");
    writeOwnerPacketFolders(ownerDir);

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/assemble-production-rollout-owner-packets.mjs",
          "--owner-dir",
          ownerDir,
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
          stdio: "pipe",
        },
      );
    } catch (error) {
      expect(getProcessOutput(error, "stdout")).toContain(
        "myMEDLIFE owner packet status: NOT READY",
      );
      expect(getProcessOutput(error, "stdout")).toContain(
        "users.csv needs 3 data rows; current: 0.",
      );
      expect(existsSync(outDir)).toBe(false);
      return;
    }

    throw new Error("Expected owner packet assembly to fail on header-only owner files.");
  });

  it("fails before writing when an owner file is missing", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-assembly-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    const outDir = join(directory, "rollout-csv");
    writeOwnerPacketFolders(ownerDir, ["memberships.csv"]);

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/assemble-production-rollout-owner-packets.mjs",
          "--owner-dir",
          ownerDir,
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
          stdio: "pipe",
        },
      );
    } catch (error) {
      expect(getProcessOutput(error, "stdout")).toContain(
        "Missing chapter-launch-owners/memberships.csv.",
      );
      expect(existsSync(outDir)).toBe(false);
      return;
    }

    throw new Error("Expected owner packet assembly to fail.");
  });
});

function writeOwnerPacketFolders(
  ownerDir: string,
  omittedFiles: string[] = [],
  rowCounts: Record<string, number> = {},
) {
  for (const packet of getProductionRolloutOwnerPackets()) {
    const packetDir = join(ownerDir, packet.slug);

    mkdirSync(packetDir, { recursive: true });

    for (const file of getProductionRolloutOwnerPacketFiles(packet)) {
      if (omittedFiles.includes(file.path)) {
        continue;
      }

      const rows = Array.from(
        { length: rowCounts[file.path] ?? 0 },
        (_, index) => `value-${index}`,
      );
      const content =
        rows.length > 0
          ? `${file.content}${rows.join("\n")}\n`
          : file.content;

      writeFileSync(join(packetDir, file.path), content);
    }
  }
}

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
