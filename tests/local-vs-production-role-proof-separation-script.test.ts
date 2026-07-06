import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("local vs production role proof separation script", () => {
  it("writes a read-only separation report that keeps sandbox evidence separate", () => {
    const outDirectory = mkdtempSync(join(tmpdir(), "mymedlife-role-separation-"));

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/build-local-vs-production-role-proof-separation.mjs",
        "--out",
        outDirectory,
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain(
      "Local-vs-production role proof separation report written to",
    );
    expect(output).toContain(
      "Sandbox/Test evidence remains excluded from production signed-in proof, rollout evidence, and invite-gate proof.",
    );
    expect(
      readFileSync(
        join(outDirectory, "local-vs-production-role-proof-separation.md"),
        "utf8",
      ),
    ).toContain("# myMEDLIFE Local vs Production Role Proof Separation");
    expect(
      readFileSync(
        join(outDirectory, "local-vs-production-role-proof-separation.json"),
        "utf8",
      ),
    ).toContain('"status": "packet_missing"');
  });
});
