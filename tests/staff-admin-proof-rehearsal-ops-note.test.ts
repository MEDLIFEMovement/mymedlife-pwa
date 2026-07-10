import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("staff-admin proof rehearsal ops note", () => {
  const note = readFileSync(
    join(process.cwd(), "docs/staff-admin-proof-rehearsal-ops-note.md"),
    "utf8",
  );

  it("keeps the one-line operator workflow and PASS text visible", () => {
    expect(note).toContain(
      "pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv",
    );
    expect(note).toContain("PASS TEST rehearsal rows mapped cleanly.");
    expect(note).toContain("Staff/Admin TEST rehearsal artifact round-trip checked: PASS");
  });

  it("keeps the TEST-only boundary explicit", () => {
    expect(note).toContain("TEST-only");
    expect(note).toContain("blocked from production proof");
    expect(note).toContain("do not use this note as production evidence");
  });
});
