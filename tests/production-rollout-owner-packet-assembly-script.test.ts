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
    writeOwnerPacketFolders(ownerDir);

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/assemble-production-rollout-owner-packets.mjs",
        "--owner-dir",
        ownerDir,
        "--out",
        outDir,
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("myMEDLIFE owner packet assembly: READY");
    expect(output).toContain("Production rollout CSV folder assembled at");
    expect(readFileSync(join(outDir, "users.csv"), "utf8")).toBe(
      "email,displayName\n",
    );
    expect(readFileSync(join(outDir, "ASSEMBLY_REPORT.md"), "utf8")).toContain(
      "pnpm rollout:check-csv --dir",
    );
    expect(existsSync(join(outDir, "luma-calendars.csv"))).toBe(true);
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

function writeOwnerPacketFolders(ownerDir: string, omittedFiles: string[] = []) {
  for (const packet of getProductionRolloutOwnerPackets()) {
    const packetDir = join(ownerDir, packet.slug);

    mkdirSync(packetDir, { recursive: true });

    for (const file of getProductionRolloutOwnerPacketFiles(packet)) {
      if (omittedFiles.includes(file.path)) {
        continue;
      }

      writeFileSync(join(packetDir, file.path), file.content);
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
