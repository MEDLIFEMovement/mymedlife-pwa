import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("figma sandbox role exercise script", () => {
  it("writes a local-only sandbox role exercise report", () => {
    const outDirectory = mkdtempSync(join(tmpdir(), "mymedlife-figma-exercise-"));

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/build-figma-sandbox-role-exercise.mjs",
        "--out",
        outDirectory,
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Figma sandbox role exercise written to");
    expect(output).toContain("must not be used as production signed-in proof");
    expect(
      readFileSync(join(outDirectory, "figma-sandbox-role-exercise.md"), "utf8"),
    ).toContain("# myMEDLIFE Figma Sandbox Role Exercise");
    expect(
      readFileSync(join(outDirectory, "figma-sandbox-role-exercise.md"), "utf8"),
    ).toContain("/admin/launch-gate");
    expect(
      readFileSync(join(outDirectory, "figma-sandbox-role-exercise.json"), "utf8"),
    ).toContain('"productionProofStatus": "blocked_by_design"');
  });
});
