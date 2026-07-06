import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("role access invariants script", () => {
  it("writes a read-only invariant report", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-role-invariants-"));

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-role-access-invariants.mjs",
        "--out",
        directory,
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain(
      "PASS The four required production proof classes still align to /app, /leader?view=overview, /staff?view=chapters, and /admin.",
    );
    expect(output).toContain("Role access invariants written to");
    expect(
      readFileSync(join(directory, "role-access-invariants.md"), "utf8"),
    ).toContain("Role access invariants: READ-ONLY readiness report");
    expect(
      readFileSync(join(directory, "role-access-invariants.json"), "utf8"),
    ).toContain('"key": "coach_plus_ds_admin"');
  });
});
