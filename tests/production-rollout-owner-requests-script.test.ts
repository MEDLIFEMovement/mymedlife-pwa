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

describe("production rollout owner requests script", () => {
  it("writes request docs when owner folders are not yet ready", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-requests-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    const outDir = join(directory, "production-rollout-owner-requests");
    writeOwnerPacketFolders(ownerDir, {});

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-owner-requests.mjs",
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

    const indexPath = join(outDir, "README.md");
    const dsRequestPath = join(outDir, "ds-launch-owner.md");

    expect(output).toContain("Production rollout owner request package written");
    expect(output).toContain("Current status: NOT READY");
    expect(output).toContain("Owner progress: 0/7 owners ready");
    expect(existsSync(indexPath)).toBe(true);
    expect(existsSync(dsRequestPath)).toBe(true);
    expect(readFileSync(indexPath, "utf8")).toContain(
      "myMEDLIFE rollout owner requests: NOT READY",
    );
    expect(readFileSync(dsRequestPath, "utf8")).toContain(
      "| users.csv | 0 | 3 | ready | NOT READY |",
    );
  });

  it("fails when the output directory argument is missing", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-requests-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    writeOwnerPacketFolders(ownerDir, {});

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-rollout-owner-requests.mjs",
          "--owner-dir",
          ownerDir,
        ],
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      const stderr = getProcessOutput(error, "stderr");

      expect(stderr).toContain("Missing required argument --out.");
      expect(stderr).toContain("Production rollout owner request package was not created.");
      return;
    }

    throw new Error("Expected owner requests script to fail without --out.");
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
