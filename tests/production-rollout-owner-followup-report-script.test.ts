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

describe("production rollout owner follow-up report script", () => {
  it("writes a follow-up report from owner folders and a send tracker", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-followup-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    const trackerPath = join(directory, "owner-send-tracker.csv");
    const outPath = join(directory, "production-rollout-owner-followup-report.md");
    writeOwnerPacketFolders(ownerDir, {});
    writeFileSync(
      trackerPath,
      [
        "ownerSlug,owner,ready,blockerCount,emailDraftPath,requestDocPath,ownerFolderPath,recipientEmail,ccEmails,sendStatus,sentAt,returnedAt,validatedAt,nextAction,notes",
        "ds-launch-owner,DS / launch owner,no,3,draft.md,request.md,folder,ds@example.org,,sent,2026-07-06,,,,",
      ].join("\n"),
    );

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-owner-followup-report.mjs",
        "--owner-dir",
        ownerDir,
        "--tracker",
        trackerPath,
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

    const report = readFileSync(outPath, "utf8");

    expect(output).toContain("Production rollout owner follow-up report written");
    expect(output).toContain("Current status: NOT READY");
    expect(output).toContain("Owner progress: 0/7 owners ready");
    expect(existsSync(outPath)).toBe(true);
    expect(report).toContain("myMEDLIFE owner follow-up report: NOT READY");
    expect(report).toContain("DS / launch owner");
    expect(report).toContain("Follow up until completed CSV files are returned.");
    expect(report).toContain("Missing tracker rows:");
  });

  it("requires a tracker path", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-followup-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    writeOwnerPacketFolders(ownerDir, {});

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-rollout-owner-followup-report.mjs",
          "--owner-dir",
          ownerDir,
          "--out",
          join(directory, "report.md"),
        ],
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      const stderr = getProcessOutput(error, "stderr");

      expect(stderr).toContain("Missing required argument --tracker.");
      expect(stderr).toContain(
        "Production rollout owner follow-up report was not created.",
      );
      return;
    }

    throw new Error("Expected owner follow-up report script to fail without --tracker.");
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
