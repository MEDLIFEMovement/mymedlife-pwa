import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("staff-admin proof rehearsal front door", () => {
  it("points to the full support workflow and keeps the TEST-only boundary explicit", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/staff-admin-proof-rehearsal-front-door.mjs",
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Staff/Admin TEST Rehearsal Front Door");
    expect(output).toContain("pnpm staff-admin-proof-rehearsal:front-door");
    expect(output).toContain("pnpm staff-admin-proof-rehearsal:help");
    expect(output).toContain("pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv");
    expect(output).toContain("pnpm staff-admin-proof-rehearsal:workflow-verify");
    expect(output).toContain("PASS TEST rehearsal rows mapped cleanly.");
    expect(output).toContain("Staff/Admin TEST rehearsal artifact round-trip checked: PASS");
    expect(output).toContain("Staff/Admin TEST rehearsal workflow-chain verifier: PASS");
    expect(output).toContain("TEST-only rehearsal output");
    expect(output).toContain("blocked from production proof");
  });
});
