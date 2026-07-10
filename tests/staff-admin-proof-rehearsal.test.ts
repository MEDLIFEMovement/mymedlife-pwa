import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildProductionSignedInRouteProofImport } from "@/services/production-signed-in-route-proof-import";
import { buildStaffAdminProofRehearsalValidation } from "@/services/staff-admin-proof-rehearsal";

describe("staff-admin proof TEST rehearsal", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/staff-admin-proof-rehearsal.md"),
    "utf8",
  );
  const csv = readFileSync(
    join(process.cwd(), "tests/fixtures/staff-admin-proof-rehearsal.test.csv"),
    "utf8",
  );
  const negativeCsv = readFileSync(
    join(process.cwd(), "tests/fixtures/staff-admin-proof-rehearsal-negative.test.csv"),
    "utf8",
  );

  it("keeps the rehearsal packet explicitly TEST-only and non-production", () => {
    expect(doc).toContain("Staff/Admin Signed-In Proof TEST Rehearsal");
    expect(doc).toContain("must not be copied");
    expect(doc).toContain("production `signed-in-route-proof.csv`");
    expect(doc).toContain("Do not write production Supabase rows");
    expect(doc).toContain("Do not count preview-cookie, local actor, staging, TEST, Figma, or sample");
    expect(doc).toContain("tests/staff-admin-proof-rehearsal.test.ts");
    expect(doc).toContain("--review-note-out /tmp/staff-admin-proof-rehearsal-review-note.md");
  });

  it("covers staff/support, DS Admin, Super Admin, and unauthorized member cases", () => {
    expect(csv).toContain("test.staff.support@example.test,staff,/staff?view=chapters,passed");
    expect(csv).toContain("test.ds.admin@example.test,admin,/admin,passed");
    expect(csv).toContain("test.super.admin@example.test,admin,/admin,passed");
    expect(csv).toContain("test.member.only@example.test,staff,/app,failed");
    expect(csv).toContain("member-only account must not satisfy Staff/Admin proof");
    expect(csv).toContain("TEST staging rehearsal only");

    expect(negativeCsv).toContain("test.member.only@example.test,staff,/app,failed");
    expect(negativeCsv).toContain("member-only account must not satisfy Staff/Admin proof");
    expect(negativeCsv).toContain("TEST staging negative only");
  });

  it("maps the TEST CSV into an explicit staff/admin proof support summary", () => {
    const validation = buildStaffAdminProofRehearsalValidation(csv);

    expect(validation.ready).toBe(true);
    expect(validation.summary).toEqual({
      staffRows: 2,
      adminRows: 2,
      passedRows: 3,
      failedRows: 1,
      testOnlyRows: 4,
    });
    expect(validation.rows.map((row) => row.normalizedWorkspace)).toEqual([
      "staff_command_center",
      "admin_backend",
      "admin_backend",
      "staff_command_center",
    ]);
    expect(validation.rows.every((row) => row.productionEvidenceAllowed === false)).toBe(true);
    expect(validation.checks.map((check) => check.key)).toEqual([
      "contains_staff_rehearsal_row",
      "contains_admin_rehearsal_rows",
      "contains_negative_member_row",
      "all_rows_are_test_only",
      "all_rows_map_cleanly",
    ]);
  });

  it("rejects the TEST rehearsal CSV from becoming production signed-in proof", () => {
    expect(() => buildProductionSignedInRouteProofImport(csv)).toThrow(
      /test or placeholder email data/,
    );
    expect(() => buildProductionSignedInRouteProofImport(negativeCsv)).toThrow(
      /test or placeholder email data/,
    );
  });

  it("keeps the packet-ready mapping visible for the reviewer", () => {
    expect(doc).toContain("staff_command_center");
    expect(doc).toContain("admin_backend");
    expect(doc).toContain("approved staff/support coach with chapters read posture");
    expect(doc).toContain("approved DS Admin with admin backend read posture");
    expect(doc).toContain("approved Super Admin with admin backend read posture");
    expect(doc).toContain("member-only account must not satisfy Staff/Admin proof");
  });
});
