import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildStaffAdminProofRehearsalReviewNote,
  validateStaffAdminProofRehearsalReviewNote,
} from "@/services/staff-admin-proof-rehearsal-review-note";

describe("staff-admin proof TEST rehearsal reviewer note", () => {
  const csv = readFileSync(
    join(process.cwd(), "tests/fixtures/staff-admin-proof-rehearsal.test.csv"),
    "utf8",
  );
  const fixture = readFileSync(
    join(process.cwd(), "tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md"),
    "utf8",
  );

  it("generates a deterministic reviewer note that keeps the packet TEST-only", () => {
    const note = buildStaffAdminProofRehearsalReviewNote(csv, {
      csvPath: "tests/fixtures/staff-admin-proof-rehearsal.test.csv",
      command:
        "pnpm staff-admin-proof-rehearsal --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv --out /tmp/staff-admin-proof-rehearsal.md --review-note-out /tmp/staff-admin-proof-rehearsal-review-note.md",
    });

    expect(note.title).toBe("Staff/Admin TEST rehearsal reviewer note");
    expect(note.summary).toContain("Ready: yes");
    expect(note.summary).toContain("CSV source: tests/fixtures/staff-admin-proof-rehearsal.test.csv");
    expect(note.command).toContain("--review-note-out");
    expect(note.routeTargets).toEqual(["/staff?view=chapters", "/admin", "/app"]);
    expect(note.reviewChecklist).toContain(
      "Confirm the packet is TEST-only and does not count as production proof.",
    );
    expect(note.markdown).toContain("# Staff/Admin TEST rehearsal reviewer note");
    expect(note.markdown).toContain("Reviewer Checklist");
    expect(note.markdown).toContain("TEST-only rehearsal output");
    expect(note.markdown).toContain("Blocked from production proof");
    expect(note.markdown).toContain("Keep the negative member row visible");
    expect(note.markdown).toContain("Command:");
    expect(note.markdown).toContain("/staff?view=chapters");
    expect(note.markdown).toContain("/admin");
    expect(note.markdown).toContain("/app");

    expect(note.markdown).toBe(fixture);

    const consistency = validateStaffAdminProofRehearsalReviewNote(note);

    expect(consistency.ready).toBe(true);
    expect(consistency.checks.map((check) => check.key)).toEqual([
      "title_mentions_test_rehearsal",
      "summary_mentions_snapshot_counts",
      "route_targets_are_member_safe",
      "markdown_states_test_only_boundary",
      "markdown_mentions_route_targets",
    ]);
    expect(consistency.checks.every((check) => check.passed)).toBe(true);
  });

  it("fails when the reviewer note drifts from the snapshot boundary", () => {
    const note = buildStaffAdminProofRehearsalReviewNote(csv);
    const driftedNote = {
      ...note,
      routeTargets: ["/admin", "/staff?view=chapters", "/app"],
      markdown: note.markdown.replace("Blocked from production proof", "Ready for production proof"),
    };

    const consistency = validateStaffAdminProofRehearsalReviewNote(driftedNote);

    expect(consistency.ready).toBe(false);
    expect(consistency.checks.find((check) => check.key === "route_targets_are_member_safe"))
      .toMatchObject({ passed: false });
    expect(consistency.checks.find((check) => check.key === "markdown_states_test_only_boundary"))
      .toMatchObject({ passed: false });
  });

  it("keeps the golden markdown fixture aligned with the helper output", () => {
    const note = buildStaffAdminProofRehearsalReviewNote(csv);

    expect(fixture).toContain("# Staff/Admin TEST rehearsal reviewer note");
    expect(fixture).toContain("CSV source: tests/fixtures/staff-admin-proof-rehearsal.test.csv");
    expect(fixture).toContain("Blocked from production proof");
    expect(note.markdown).toBe(fixture);
  });
});
