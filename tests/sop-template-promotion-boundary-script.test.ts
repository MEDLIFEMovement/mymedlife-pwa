import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("sop template promotion boundary script", () => {
  it("writes a read-only report for a manifest that is ready for manual review", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-sop-boundary-"));
    const manifestPath = join(directory, "manifest.json");
    const outPath = join(directory, "boundary.md");

    writeFileSync(
      manifestPath,
      JSON.stringify({
        name: "Chapter Follow-up SOP",
        state: "scheduled",
        approvals: {
          reviewedBy: "content-owner@medlifemovement.org",
          reviewedAt: "2026-07-06T12:00:00Z",
          dsApprovedBy: "ds-admin@medlifemovement.org",
          dsApprovedAt: "2026-07-06T13:00:00Z",
          promotionOwner: "launch-owner@medlifemovement.org",
        },
        guards: {
          rolloutEvidenceExcluded: true,
          signedInProofExcluded: true,
          inviteGateExcluded: true,
          launchBehaviorUnchanged: true,
        },
      }),
      "utf8",
    );

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-sop-template-promotion-boundary.mjs",
        "--manifest",
        manifestPath,
        "--out",
        outPath,
      ],
      {
        encoding: "utf8",
      },
    );
    const report = readFileSync(outPath, "utf8");

    expect(output).toContain("SOP/template promotion boundary written to");
    expect(existsSync(outPath)).toBe(true);
    expect(report).toContain(
      "SOP/template promotion boundary: READY_FOR_MANUAL_REVIEW",
    );
    expect(report).toContain("Eligible for manual review: yes");
  });

  it("fails safely when a manifest still carries sample content", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-sop-boundary-"));
    const manifestPath = join(directory, "manifest.json");

    writeFileSync(
      manifestPath,
      JSON.stringify({
        name: "SOP sample content only",
        state: "reviewed",
        approvals: {
          reviewedBy: "content-owner@medlifemovement.org",
          reviewedAt: "2026-07-06T12:00:00Z",
        },
        guards: {
          rolloutEvidenceExcluded: true,
          signedInProofExcluded: true,
          inviteGateExcluded: true,
          launchBehaviorUnchanged: true,
        },
      }),
      "utf8",
    );

    const output = runFailedBoundaryCheck(manifestPath);

    expect(output).toContain("SOP/template promotion boundary: BLOCKED");
    expect(output).toContain("manifest.name contains sop sample");
  });
});

function runFailedBoundaryCheck(manifestPath: string) {
  try {
    return execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-sop-template-promotion-boundary.mjs",
        "--manifest",
        manifestPath,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch (error) {
    return [
      getProcessOutput(error, "stdout"),
      getProcessOutput(error, "stderr"),
    ].join("\n");
  }
}

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
