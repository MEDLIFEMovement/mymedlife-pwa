import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production rollout launch owner import script", () => {
  it("writes launch-owners.csv without clobbering existing launch owner rows", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-launch-owners-"));
    const ownersPath = join(directory, "launch-owners-source.csv");
    const outDirectory = join(directory, "rollout-csv");

    writeFileSync(
      ownersPath,
      [
        "email,ownerType,displayName,status",
        "support@medlifemovement.org,support,Support Owner,active",
        "rollback@medlifemovement.org,rollback,Rollback Owner,active",
        "apply@medlifemovement.org,production_apply,Apply Owner,active",
        "",
      ].join("\n"),
    );

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-launch-owner-import.mjs",
        "--owners",
        ownersPath,
        "--out-dir",
        outDirectory,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    expect(output).toContain("Production rollout launch owner import: READY");
    expect(output).toContain("- owners: 3");
    expect(readFileSync(join(outDirectory, "launch-owners.csv"), "utf8")).toContain(
      "support@medlifemovement.org,support,Support Owner,active",
    );

    const failedOutput = runFailedImport(ownersPath, outDirectory);

    expect(failedOutput).toContain("already contains launch owner rows");
  });
});

function runFailedImport(ownersPath: string, outDirectory: string) {
  try {
    return execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-rollout-launch-owner-import.mjs",
        "--owners",
        ownersPath,
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
