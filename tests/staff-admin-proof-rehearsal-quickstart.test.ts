import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("staff-admin proof rehearsal quickstart", () => {
  const quickstart = readFileSync(
    join(process.cwd(), "docs/staff-admin-proof-rehearsal-quickstart.md"),
    "utf8",
  );

  it("points to the exact chain command and required inputs", () => {
    expect(quickstart).toContain(
      "pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv",
    );
    expect(quickstart).toContain("tests/fixtures/staff-admin-proof-rehearsal.test.csv");
    expect(quickstart).toContain("the exported-note build step from the same rehearsal packet");
    expect(quickstart).toContain("the on-disk reviewer note and manifest created by the chain command");
  });

  it("lists expected PASS output and the main failure cases", () => {
    expect(quickstart).toContain("PASS TEST rehearsal rows mapped cleanly.");
    expect(quickstart).toContain("Staff/Admin TEST rehearsal artifact round-trip checked: PASS");
    expect(quickstart).toContain("FAIL TEST rehearsal rows still have a boundary issue.");
    expect(quickstart).toContain("reviewNoteFixturePath=tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md");
    expect(quickstart).toContain("routeTargets=/staff?view=chapters,/admin,/app");
  });

  it("keeps the TEST-only boundary explicit", () => {
    expect(quickstart).toContain("TEST-only rehearsal output");
    expect(quickstart).toContain("blocked from production proof");
    expect(quickstart).toContain("do not use this quickstart as live production evidence");
  });
});
