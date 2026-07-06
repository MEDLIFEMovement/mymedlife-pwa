import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production signed-in route proof import script", () => {
  it("writes signed-in-route-proof.csv and protects existing rows", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-signed-in-proof-"));
    const proofPath = join(directory, "signed-in-route-proof-source.csv");
    const outDirectory = join(directory, "rollout-csv");

    writeFileSync(
      proofPath,
      [
        "email,workspace,observedPath,status,checkedAt,notes",
        "member@medlifemovement.org,member,/app,passed,2026-07-05T15:00:00Z,Member route verified",
        "leader@medlifemovement.org,leader,/leader?view=overview,passed,2026-07-05T15:01:00Z,Leader route verified",
        "",
      ].join("\n"),
    );

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-signed-in-route-proof-import.mjs",
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

    expect(output).toContain("Production signed-in route proof import: READY");
    expect(output).toContain("- proof rows: 2");
    expect(output).toContain("- passed rows: 2");
    expect(readFileSync(join(outDirectory, "signed-in-route-proof.csv"), "utf8")).toContain(
      "member@medlifemovement.org,student_app,/app,/app,passed",
    );

    const failedOutput = runFailedImport(proofPath, outDirectory);

    expect(failedOutput).toContain("already contains signed-in route proof rows");
  });
});

function runFailedImport(proofPath: string, outDirectory: string) {
  try {
    return execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-signed-in-route-proof-import.mjs",
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
