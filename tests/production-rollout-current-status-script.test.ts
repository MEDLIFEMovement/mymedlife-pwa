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

describe("production rollout current status script", () => {
  it("auto-discovers generated handoff artifacts when default folders are absent", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-current-status-"));
    const handoffDir = join(
      directory,
      ".codex-artifacts",
      "production-rollout-owner-handoff",
    );
    const ownerDir = join(handoffDir, "rollout-owner-packets");
    const trackerDir = join(handoffDir, "production-rollout-owner-send-tracker");
    const csvDir = join(directory, ".codex-artifacts", "production-rollout-csv");
    const outPath = join(directory, "production-rollout-current-status.md");
    writeOwnerPacketFolders(ownerDir);
    mkdirSync(trackerDir, { recursive: true });
    mkdirSync(csvDir, { recursive: true });
    writeFileSync(join(csvDir, "chapters.csv"), "id,name,campus,region,status\n");
    writeFileSync(
      join(trackerDir, "owner-recipient-assignments.csv"),
      [
        "ownerSlug,owner,recipientEmail,ccEmails,notes",
        "nick-hq-launch-owner,Nick / HQ launch owner,,,",
        "ds-launch-owner,DS / launch owner,,,",
        "chapter-launch-owners,Chapter launch owners,,,",
        "sales-coaching-lead,Sales / coaching lead,,,",
        "campaign-launch-owner,Campaign / launch owner,,,",
        "luma-ds-owner,Luma / DS owner,,,",
        "launch-owner-ds,Launch owner / DS,,,",
      ].join("\n"),
    );

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          join(process.cwd(), "scripts/check-production-rollout-current-status.mjs"),
          "--out",
          outPath,
        ],
        {
          cwd: directory,
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      expect(getProcessOutput(error, "stdout")).toContain(
        "Production rollout current status written to",
      );
      const report = readFileSync(outPath, "utf8");

      expect(report).toContain(
        "- owner packet folder: .codex-artifacts/production-rollout-owner-handoff/rollout-owner-packets",
      );
      expect(report).toContain(
        "- owner recipient assignments: .codex-artifacts/production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-recipient-assignments.csv",
      );
      expect(report).toContain(
        "- shared CSV folder: .codex-artifacts/production-rollout-csv",
      );
      expect(report).toContain("shared rollout CSV folder: FOUND");
      expect(report).toContain("Owner packet recipients are incomplete");
      expect(report).toContain("0/7 owner recipients assigned");
      expect(report).toContain(
        "Fill .codex-artifacts/production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-recipient-assignments.csv",
      );
      return;
    }

    throw new Error("Expected current status script to exit not ready.");
  });

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

  it("writes the recipient assignment blocker when assignment rows are blank", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-current-status-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    const assignmentsPath = join(directory, "owner-recipient-assignments.csv");
    const outPath = join(directory, "production-rollout-current-status.md");
    writeOwnerPacketFolders(ownerDir);
    writeFileSync(
      assignmentsPath,
      [
        "ownerSlug,owner,recipientEmail,ccEmails,notes",
        "nick-hq-launch-owner,Nick / HQ launch owner,,,",
        "ds-launch-owner,DS / launch owner,,,",
        "chapter-launch-owners,Chapter launch owners,,,",
        "sales-coaching-lead,Sales / coaching lead,,,",
        "campaign-launch-owner,Campaign / launch owner,,,",
        "luma-ds-owner,Luma / DS owner,,,",
        "launch-owner-ds,Launch owner / DS,,,",
      ].join("\n"),
    );

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/check-production-rollout-current-status.mjs",
          "--owner-dir",
          ownerDir,
          "--recipient-assignments",
          assignmentsPath,
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

      expect(report).toContain("Owner packet recipients are incomplete");
      expect(report).toContain("0/7 owner recipients assigned");
      expect(report).toContain(
        "owner recipient assignments: NOT READY (0/7 recipients assigned, 7 missing)",
      );
      expect(report).toContain(`--recipient-assignments ${assignmentsPath}`);
      return;
    }

    throw new Error("Expected current status script to exit not ready.");
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

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
