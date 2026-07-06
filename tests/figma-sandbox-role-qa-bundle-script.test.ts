import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("figma sandbox role qa bundle script", () => {
  it("writes a local-only operator-facing qa bundle", () => {
    const outDirectory = mkdtempSync(
      join(tmpdir(), "mymedlife-figma-qa-bundle-"),
    );

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/build-figma-sandbox-role-qa-bundle.mjs",
        "--out",
        outDirectory,
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Figma sandbox role QA bundle written to");
    expect(output).toContain(
      "excluded from production signed-in proof, rollout evidence, and invite-gate proof",
    );
    expect(
      readFileSync(join(outDirectory, "figma-sandbox-role-qa-bundle.md"), "utf8"),
    ).toContain("# myMEDLIFE Local Sandbox Role QA Bundle");
    expect(
      readFileSync(join(outDirectory, "figma-sandbox-role-qa-bundle.json"), "utf8"),
    ).toContain('"productionProofStatus": "blocked_by_design"');
  });
});
