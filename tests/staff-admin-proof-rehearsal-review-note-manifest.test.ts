import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildStaffAdminProofRehearsalReviewNote,
  validateStaffAdminProofRehearsalReviewNote,
} from "@/services/staff-admin-proof-rehearsal-review-note";
import {
  buildStaffAdminProofRehearsalReviewNoteManifest,
  formatStaffAdminProofRehearsalReviewNoteManifest,
  validateStaffAdminProofRehearsalReviewNoteManifest,
} from "@/services/staff-admin-proof-rehearsal-review-note-manifest";

describe("staff-admin proof TEST rehearsal reviewer note manifest", () => {
  const csv = readFileSync(
    join(process.cwd(), "tests/fixtures/staff-admin-proof-rehearsal.test.csv"),
    "utf8",
  );
  const noteFixture = readFileSync(
    join(process.cwd(), "tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md"),
    "utf8",
  );
  const manifestFixture = JSON.parse(
    readFileSync(
      join(
        process.cwd(),
        "tests/fixtures/staff-admin-proof-rehearsal-review-note-manifest.test.json",
      ),
      "utf8",
    ),
  ) as ReturnType<typeof buildStaffAdminProofRehearsalReviewNoteManifest>;

  it("writes a deterministic TEST-only manifest for the reviewer note artifact", () => {
    const note = buildStaffAdminProofRehearsalReviewNote(csv);
    const manifest = buildStaffAdminProofRehearsalReviewNoteManifest(note);

    expect(validateStaffAdminProofRehearsalReviewNote(note).ready).toBe(true);
    expect(manifest).toEqual(manifestFixture);
    expect(formatStaffAdminProofRehearsalReviewNoteManifest(manifest)).toBe(
      JSON.stringify(manifestFixture, null, 2),
    );
    expect(manifest.kind).toBe("staff-admin-test-rehearsal-review-note-manifest");
    expect(manifest.isTestOnly).toBe(true);
    expect(manifest.productionEvidenceBlocked).toBe(true);
    expect(manifest.reviewNoteFixturePath).toBe(
      "tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md",
    );
    expect(manifest.routeTargets).toEqual(["/staff?view=chapters", "/admin", "/app"]);
    expect(manifest.reviewNoteChecksum).toMatch(/^[a-f0-9]{64}$/);
    expect(noteFixture).toContain("TEST-only rehearsal output");
    expect(manifest.reviewNoteChecksum).toBe("c616c9e5c8fcf41275533cb3ad058fbc81647d7101f2b1fb86c7c7eab5f6738f");
    expect(formatStaffAdminProofRehearsalReviewNoteManifest(manifest)).toContain(
      '"reviewNoteFixturePath": "tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md"',
    );
  });

  it("fails when the manifest no longer matches the reviewer note or snapshot", () => {
    const note = buildStaffAdminProofRehearsalReviewNote(csv);
    const manifest = buildStaffAdminProofRehearsalReviewNoteManifest(note);
    const driftedManifest = {
      ...manifest,
      routeTargets: ["/app", "/admin", "/staff?view=chapters"],
    };

    const consistency = validateStaffAdminProofRehearsalReviewNoteManifest(driftedManifest, note);

    expect(consistency.ready).toBe(false);
    expect(consistency.checks.find((check) => check.key === "route_targets")).toMatchObject({
      passed: false,
    });
  });

  it("fails when the manifest points at the wrong reviewer-note fixture", () => {
    const note = buildStaffAdminProofRehearsalReviewNote(csv);
    const manifest = buildStaffAdminProofRehearsalReviewNoteManifest(note, "tests/fixtures/elsewhere.md");
    const consistency = validateStaffAdminProofRehearsalReviewNoteManifest(manifest, note);

    expect(consistency.ready).toBe(false);
    expect(consistency.checks.find((check) => check.key === "fixture_path")).toMatchObject({
      passed: false,
    });
  });
});
