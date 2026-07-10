import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("staff-admin proof rehearsal chain", () => {
  it("runs the snapshot build and round-trip verifier as one TEST-only command", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/run-staff-admin-proof-rehearsal-chain.mjs",
        "--csv",
        "tests/fixtures/staff-admin-proof-rehearsal.test.csv",
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Staff/Admin TEST rehearsal snapshot written to");
    expect(output).toContain("Staff/Admin TEST rehearsal reviewer note manifest written to");
    expect(output).toContain("PASS TEST rehearsal rows mapped cleanly.");
    expect(output).toContain("Staff/Admin TEST rehearsal artifact round-trip checked: PASS");
    expect(output).toContain("reviewNoteFixturePath=tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md");
    expect(output).toContain("routeTargets=/staff?view=chapters,/admin,/app");
  });
});
