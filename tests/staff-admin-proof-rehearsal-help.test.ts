import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("staff-admin proof rehearsal chain help", () => {
  it("prints a TEST-only alias that points to the chain command and expected PASS text", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/help-staff-admin-proof-rehearsal-chain.mjs",
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Staff/Admin TEST rehearsal chain help");
    expect(output).toContain(
      "pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv",
    );
    expect(output).toContain("PASS TEST rehearsal rows mapped cleanly.");
    expect(output).toContain("Staff/Admin TEST rehearsal artifact round-trip checked: PASS");
    expect(output).toContain("TEST-only rehearsal output");
    expect(output).toContain("blocked from production proof");
    expect(output).toContain("do not use this help text as live production evidence");
  });
});
