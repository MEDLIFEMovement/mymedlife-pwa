import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production live-data proof request script", () => {
  it("writes the proof request markdown", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-live-data-proof-"));
    const outPath = join(directory, "production-live-data-proof-request.md");

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/create-production-live-data-proof-request.mjs",
        "--out",
        outPath,
        "--packet",
        "production-rollout-packet.json",
      ],
      {
        encoding: "utf8",
      },
    );
    const markdown = readFileSync(outPath, "utf8");

    expect(output).toContain("Production live-data proof request written to");
    expect(existsSync(outPath)).toBe(true);
    expect(markdown).toContain(
      "myMEDLIFE Production Live-Data Proof Request",
    );
    expect(markdown).toContain("Required Count Rows");
    expect(markdown).toContain("pnpm production:invite-gate");
    expect(markdown).not.toContain("student@example.com");
    expect(markdown).not.toContain("password,");
  });

  it("requires an output path", () => {
    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-live-data-proof-request.mjs",
        ],
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      expect(getProcessOutput(error, "stderr")).toContain(
        "Missing required argument --out.",
      );
      return;
    }

    throw new Error("Expected live-data proof request script to require --out.");
  });
});

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
