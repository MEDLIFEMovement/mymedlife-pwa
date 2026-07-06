import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("figma sandbox role shell regression script", () => {
  it("writes a local-only regression report for the four core shells", () => {
    const outDirectory = mkdtempSync(
      join(tmpdir(), "mymedlife-figma-regression-"),
    );

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/build-figma-sandbox-role-shell-regression.mjs",
        "--out",
        outDirectory,
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Figma sandbox role shell regression written to");
    expect(output).toContain("must not be used as production signed-in proof");
    expect(
      readFileSync(
        join(outDirectory, "figma-sandbox-role-shell-regression.md"),
        "utf8",
      ),
    ).toContain("# myMEDLIFE Local Sandbox Signed-In Role Shell Regression");
    expect(
      readFileSync(
        join(outDirectory, "figma-sandbox-role-shell-regression.json"),
        "utf8",
      ),
    ).toContain('"executionMode": "deterministic_local_route_regression"');
  });
});
