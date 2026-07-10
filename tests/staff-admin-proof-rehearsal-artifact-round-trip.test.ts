import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("staff-admin proof TEST rehearsal artifact round-trip", () => {
  it("verifies the emitted reviewer note and manifest back from disk", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-staff-admin-round-trip-"));
    const snapshotPath = join(directory, "staff-admin-proof-rehearsal.md");
    const reviewNotePath = join(directory, "staff-admin-proof-rehearsal-review-note.md");
    const manifestPath = join(directory, "staff-admin-proof-rehearsal-review-note-manifest.json");

    const buildOutput = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-staff-admin-proof-rehearsal.mjs",
        "--out",
        snapshotPath,
        "--review-note-out",
        reviewNotePath,
        "--manifest-out",
        manifestPath,
      ],
      {
        encoding: "utf8",
      },
    );

    expect(buildOutput).toContain("Staff/Admin TEST rehearsal reviewer note manifest written to");
    expect(buildOutput).toContain("reviewNoteFixturePath=tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md");

    const verifyOutput = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/verify-staff-admin-proof-rehearsal-artifacts.mjs",
        "--review-note",
        reviewNotePath,
        "--manifest",
        manifestPath,
      ],
      {
        encoding: "utf8",
      },
    );

    expect(verifyOutput).toContain("Staff/Admin TEST rehearsal artifact round-trip checked: PASS");
    expect(verifyOutput).toContain("reviewNoteChecksum=");
    expect(verifyOutput).toContain("reviewNoteFixturePath=tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md");
    expect(verifyOutput).toContain("routeTargets=/staff?view=chapters,/admin,/app");

    const reviewNote = readFileSync(reviewNotePath, "utf8");
    const manifest = readFileSync(manifestPath, "utf8");

    expect(reviewNote).toContain("reviewer-facing only");
    expect(reviewNote).toContain("TEST rehearsal packet output");
    expect(reviewNote).toContain("Blocked from production proof");
    expect(manifest).toContain('"reviewNoteFixturePath": "tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md"');
    expect(manifest).toContain('"productionEvidenceBlocked": true');
    expect(manifest).toContain('"kind": "staff-admin-test-rehearsal-review-note-manifest"');
  });
});
