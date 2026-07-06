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

describe("production rollout owner recipient decision script", () => {
  it("writes a NOT READY recipient decision worksheet for blank assignments", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-decisions-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    const assignmentsPath = join(directory, "owner-recipient-assignments.csv");
    const outPath = join(
      directory,
      "production-rollout-owner-recipient-decisions.md",
    );
    writeOwnerPacketFolders(ownerDir);
    writeFileSync(assignmentsPath, blankAssignmentsCsv());

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-rollout-owner-recipient-decisions.mjs",
          "--owner-dir",
          ownerDir,
          "--recipient-assignments",
          assignmentsPath,
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
      const stdout = getProcessOutput(error, "stdout");
      const report = readFileSync(outPath, "utf8");

      expect(stdout).toContain(
        "Production rollout owner recipient decisions written to",
      );
      expect(stdout).toContain("Current status: NOT READY");
      expect(stdout).toContain("Owner recipients assigned: 0/7");
      expect(existsSync(outPath)).toBe(true);
      expect(report).toContain(
        "owner recipient decision worksheet: NOT READY",
      );
      expect(report).toContain("Suggested accountable seat");
      expect(report).toContain("pending recipient decision");
      return;
    }

    throw new Error("Expected blank recipient decisions to fail readiness.");
  });

  it("requires owner dir, recipient assignments, and output path", () => {
    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-rollout-owner-recipient-decisions.mjs",
        ],
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      const stderr = getProcessOutput(error, "stderr");

      expect(stderr).toContain("Missing required argument --owner-dir.");
      expect(stderr).toContain(
        "Production rollout owner recipient decisions were not created.",
      );
      return;
    }

    throw new Error("Expected owner recipient decisions script to fail.");
  });
});

function writeOwnerPacketFolders(ownerDir: string) {
  for (const packet of getProductionRolloutOwnerPackets()) {
    const packetDir = join(ownerDir, packet.slug);

    mkdirSync(packetDir, { recursive: true });

    for (const file of getProductionRolloutOwnerPacketFiles(packet)) {
      writeFileSync(join(packetDir, file.path), file.content);
    }
  }
}

function blankAssignmentsCsv() {
  return [
    "ownerSlug,owner,recipientEmail,ccEmails,notes",
    "nick-hq-launch-owner,Nick / HQ launch owner,,,",
    "ds-launch-owner,DS / launch owner,,,",
    "chapter-launch-owners,Chapter launch owners,,,",
    "sales-coaching-lead,Sales / coaching lead,,,",
    "campaign-launch-owner,Campaign / launch owner,,,",
    "luma-ds-owner,Luma / DS owner,,,",
    "launch-owner-ds,Launch owner / DS,,,",
  ].join("\n");
}

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
