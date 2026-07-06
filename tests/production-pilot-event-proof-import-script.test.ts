import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production pilot event proof import script", () => {
  it("writes pilot-event-proof.csv and protects existing rows", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-pilot-proof-"));
    const proofPath = join(directory, "pilot-event-proof-source.csv");
    const outDirectory = join(directory, "rollout-csv");

    writeFileSync(
      proofPath,
      [
        "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes",
        "chapter-ucla,Rush Month Kickoff,evt-ucla-rush,18,15,15,yes,yes,/app/events/evt-ucla-rush,/leader?view=events&event=evt-ucla-rush,/leader?view=leaderboard&chapter=chapter-ucla,/admin/audit-log,/admin/integration-outbox,2026-07-05T15:00:00Z,reviewer@medlifemovement.org,Verified by launch owner",
        "",
      ].join("\n"),
    );

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-pilot-event-proof-import.mjs",
        "--proof",
        proofPath,
        "--out-dir",
        outDirectory,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    expect(output).toContain("Production pilot event proof import: READY");
    expect(output).toContain("- proof rows: 1");
    expect(output).toContain("- ready rows: 1");
    expect(readFileSync(join(outDirectory, "pilot-event-proof.csv"), "utf8")).toContain(
      "chapter-ucla,Rush Month Kickoff,evt-ucla-rush,18,15,15,recorded,zero_sends,ready",
    );

    const failedOutput = runFailedImport(proofPath, outDirectory);

    expect(failedOutput).toContain("already contains pilot event proof rows");
  });
});

function runFailedImport(proofPath: string, outDirectory: string) {
  try {
    return execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-pilot-event-proof-import.mjs",
        "--proof",
        proofPath,
        "--out-dir",
        outDirectory,
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
