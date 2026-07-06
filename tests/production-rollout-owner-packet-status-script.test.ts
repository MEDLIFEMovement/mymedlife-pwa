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

describe("production rollout owner packet status script", () => {
  it("fails loudly when owner folders only contain blank generated templates", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-status-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    const outPath = join(directory, "production-rollout-owner-packet-status.md");
    writeOwnerPacketFolders(ownerDir, {});

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/check-production-rollout-owner-packets.mjs",
          "--owner-dir",
          ownerDir,
          "--out",
          outPath,
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
      const output = getProcessOutput(error, "stdout");

      expect(output).toContain("myMEDLIFE owner packet status: NOT READY");
      expect(output).toContain("Owner progress: 0/7 owners ready");
      expect(output).toContain("chapters.csv: 0/2 data rows");
      expect(existsSync(outPath)).toBe(true);
      expect(readFileSync(outPath, "utf8")).toContain(
        "This is a pre-assembly status check",
      );
      return;
    }

    throw new Error("Expected blank owner packet status to fail.");
  });

  it("passes when owner folders have enough rows for the next validation step", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-status-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    const outPath = join(directory, "production-rollout-owner-packet-status.md");

    writeOwnerPacketFolders(ownerDir, {
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
        "scripts/check-production-rollout-owner-packets.mjs",
        "--owner-dir",
        ownerDir,
        "--out",
        outPath,
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

    expect(output).toContain(
      "myMEDLIFE owner packet status: READY FOR PACKET BUILD",
    );
    expect(output).toContain("Owner progress: 7/7 owners ready");
    expect(readFileSync(outPath, "utf8")).toContain(
      "pnpm rollout:assemble-owner-packets --owner-dir",
    );
  });
});

function writeOwnerPacketFolders(
  ownerDir: string,
  rowCounts: Record<string, number>,
) {
  for (const packet of getProductionRolloutOwnerPackets()) {
    const packetDir = join(ownerDir, packet.slug);

    mkdirSync(packetDir, { recursive: true });

    for (const file of getProductionRolloutOwnerPacketFiles(packet)) {
      const rowCount = rowCounts[file.path] ?? 0;
      const rows = file.path.endsWith(".csv")
        ? Array.from({ length: rowCount }, (_, index) => `value-${index}`)
        : [];
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
