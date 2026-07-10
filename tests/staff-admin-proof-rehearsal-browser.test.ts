import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildStaffAdminProofRehearsalBrowserSnapshot } from "@/services/staff-admin-proof-rehearsal-browser";

describe("staff-admin proof TEST rehearsal browser snapshot", () => {
  const csv = readFileSync(
    join(process.cwd(), "tests/fixtures/staff-admin-proof-rehearsal.test.csv"),
    "utf8",
  );

  it("renders a TEST-only DOM snapshot that maps rows to the member-safe staff/admin routes", () => {
    const snapshot = buildStaffAdminProofRehearsalBrowserSnapshot(csv);

    expect(snapshot.title).toBe("Staff/Admin TEST rehearsal browser proof");
    expect(snapshot.summary).toEqual({
      ready: true,
      staffRows: 2,
      adminRows: 2,
      passedRows: 3,
      failedRows: 1,
    });
    expect(snapshot.html).toContain('data-proof="staff-admin-test-rehearsal"');
    expect(snapshot.html).toContain('data-production-proof="blocked"');
    expect(snapshot.html).toContain("TEST-only rehearsal snapshot");
    expect(snapshot.html).toContain("Staff/Admin proof rehearsal browser snapshot");
    expect(snapshot.html).toContain("Staff/Admin TEST rehearsal rows");
    expect(snapshot.html).toContain("must not be used as production proof");
    expect(snapshot.html).toContain("Production evidence remains blocked");
    expect(snapshot.html).toContain("/staff?view=chapters");
    expect(snapshot.html).toContain("/admin");
    expect(snapshot.html).toContain("test.member.only@example.test");
    expect(snapshot.html).toContain("/app");
    expect(snapshot.html).not.toContain("rollout-ready");
  });
});
