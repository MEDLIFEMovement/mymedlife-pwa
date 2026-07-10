import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("staff-admin proof TEST rehearsal snapshot script", () => {
  it("writes a TEST-only browser snapshot and keeps production proof blocked", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-staff-admin-snapshot-"));
    const outPath = join(directory, "staff-admin-proof-rehearsal.md");
    const reviewNoteOutPath = join(directory, "staff-admin-proof-rehearsal-review-note.md");
    const manifestOutPath = join(directory, "staff-admin-proof-rehearsal-review-note-manifest.json");

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-staff-admin-proof-rehearsal.mjs",
        "--out",
        outPath,
        "--review-note-out",
        reviewNoteOutPath,
        "--manifest-out",
        manifestOutPath,
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Staff/Admin TEST rehearsal snapshot written to");
    expect(output).toContain("Staff/Admin TEST rehearsal reviewer note written to");
    expect(output).toContain("Staff/Admin TEST rehearsal reviewer note manifest written to");
    expect(output).toContain("reviewNoteFixturePath=tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md");
    expect(output).toContain("PASS TEST rehearsal rows mapped cleanly.");

    const report = readFileSync(outPath, "utf8");
    expect(report).toContain("# Staff/Admin TEST rehearsal browser snapshot");
    expect(report).toContain("Ready: yes");
    expect(report).toContain("TEST-only and blocked from production proof");
    expect(report).toContain('data-proof="staff-admin-test-rehearsal"');
    expect(report).toContain("test.member.only@example.test");
    expect(report).toContain("/app");
    expect(report).toContain("Production evidence remains blocked");

    const reviewNote = readFileSync(reviewNoteOutPath, "utf8");
    expect(reviewNote).toContain("# Staff/Admin TEST rehearsal reviewer note");
    expect(reviewNote).toContain("CSV source: tests/fixtures/staff-admin-proof-rehearsal.test.csv");
    expect(reviewNote).toContain("TEST-only rehearsal output");
    expect(reviewNote).toContain("Blocked from production proof");
    expect(reviewNote).toContain("/staff?view=chapters");
    expect(reviewNote).toContain("/admin");
    expect(reviewNote).toContain("/app");

    const manifest = readFileSync(manifestOutPath, "utf8");
    expect(manifest).toContain('"kind": "staff-admin-test-rehearsal-review-note-manifest"');
    expect(manifest).toContain(
      '"reviewNoteFixturePath": "tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md"',
    );
    expect(manifest).toContain(
      '"reviewNoteChecksum": "c616c9e5c8fcf41275533cb3ad058fbc81647d7101f2b1fb86c7c7eab5f6738f"',
    );
  });
});
