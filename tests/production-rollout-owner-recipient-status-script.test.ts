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

describe("production rollout owner recipient status script", () => {
  it("writes a NOT READY recipient status for blank assignments", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-recipients-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    const assignmentsPath = join(directory, "owner-recipient-assignments.csv");
    const outPath = join(directory, "production-rollout-owner-recipient-status.md");
    writeOwnerPacketFolders(ownerDir, {});
    writeFileSync(
      assignmentsPath,
      [
        "ownerSlug,owner,recipientEmail,ccEmails,notes",
        "nick-hq-launch-owner,Nick / HQ launch owner,,,",
      ].join("\n"),
    );

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/check-production-rollout-owner-recipients.mjs",
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

      expect(stdout).toContain("Current status: NOT READY");
      expect(stdout).toContain("Owner recipients assigned: 0/7");
      expect(existsSync(outPath)).toBe(true);
      expect(report).toContain("owner recipient readiness: NOT READY");
      expect(report).toContain("recipientEmail is missing.");
      return;
    }

    throw new Error("Expected blank recipient assignments to fail readiness.");
  });

  it("writes a READY recipient status when every owner has a recipient", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-recipients-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    const assignmentsPath = join(directory, "owner-recipient-assignments.csv");
    const outPath = join(directory, "production-rollout-owner-recipient-status.md");
    writeOwnerPacketFolders(ownerDir, {});
    writeFileSync(
      assignmentsPath,
      [
        "ownerSlug,owner,recipientEmail,ccEmails,notes",
        "nick-hq-launch-owner,Nick / HQ launch owner,nick@example.org,,",
        "ds-launch-owner,DS / launch owner,ds@example.org,,",
        "chapter-launch-owners,Chapter launch owners,chapters@example.org,,",
        "sales-coaching-lead,Sales / coaching lead,sales@example.org,,",
        "campaign-launch-owner,Campaign / launch owner,campaign@example.org,,",
        "luma-ds-owner,Luma / DS owner,luma@example.org,,",
        "launch-owner-ds,Launch owner / DS,launch@example.org,,",
      ].join("\n"),
    );

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-production-rollout-owner-recipients.mjs",
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
      },
    );

    expect(output).toContain("Current status: READY TO SEND");
    expect(output).toContain("Owner recipients assigned: 7/7");
    expect(readFileSync(outPath, "utf8")).toContain(
      "owner recipient readiness: READY TO SEND",
    );
  });

  it("requires a recipient assignments path", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-recipients-"));
    const ownerDir = join(directory, "rollout-owner-packets");
    writeOwnerPacketFolders(ownerDir, {});

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/check-production-rollout-owner-recipients.mjs",
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

      expect(stderr).toContain("Missing required argument --recipient-assignments.");
      expect(stderr).toContain(
        "Production rollout owner recipient status was not created.",
      );
      return;
    }

    throw new Error("Expected owner recipient status script to fail without assignments.");
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
