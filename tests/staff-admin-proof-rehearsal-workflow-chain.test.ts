import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("staff-admin proof rehearsal workflow chain", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/staff-admin-proof-rehearsal-workflow-chain.md"),
    "utf8",
  );

  it("ties together the help alias, quickstart, ops note, chain command, and verifier", () => {
    expect(doc).toContain("pnpm staff-admin-proof-rehearsal:help");
    expect(doc).toContain(
      "pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv",
    );
    expect(doc).toContain("reviewer note and manifest emitted by the chain command");
    expect(doc).toContain("checksum and route-target linkage");
    expect(doc).toContain("explicit TEST-only boundary wording");
  });

  it("keeps the packet clearly out of production proof", () => {
    expect(doc).toContain("TEST-only rehearsal output");
    expect(doc).toContain("blocked from production proof");
    expect(doc).toContain("keep the negative member row visible");
    expect(doc).toContain("production proof");
    expect(doc).toContain("any evidence that can be mistaken for production truth");
  });
});
