import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildProductionSignedInRouteProofImport } from "@/services/production-signed-in-route-proof-import";

describe("leader signed-in proof TEST rehearsal doc", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/leader-signed-in-proof-test-rehearsal.md"),
    "utf8",
  );

  it("keeps the TEST-only leader rehearsal rows and route sequence visible", () => {
    expect(doc).toContain("test.leader.chapter@example.test,leader,/leader?view=overview,passed");
    expect(doc).toContain("test.member.only@example.test,leader,/app,failed");
    expect(doc).toContain("workspace `leader_command_center`");
    expect(doc).toContain("expected route `/leader?view=overview`");
    expect(doc).toContain("member-only user must not satisfy Leader proof");
  });

  it("keeps the non-production boundary and scratch import path explicit", () => {
    expect(doc).toContain("do **not** count as approved production signed-in proof");
    expect(doc).toContain("signed-in-route-proof.csv");
    expect(doc).toContain("production-rollout-packet.json");
    expect(doc).toContain("pnpm rollout:signed-in-proof-import --proof signed-in-route-proof-source.test.csv");
    expect(doc).toContain("production importer must still reject `TEST` rehearsal rows as production proof");
  });

  it("proves the production importer rejects the TEST rehearsal rows", () => {
    expect(() =>
      buildProductionSignedInRouteProofImport(
        [
          "email,workspace,observedPath,status,checkedAt,notes",
          "test.leader.chapter@example.test,leader,/leader?view=overview,passed,2026-07-10T12:00:00Z,TEST approved leader rehearsal row only",
          "test.member.only@example.test,leader,/app,failed,2026-07-10T12:05:00Z,TEST unauthorized member-only negative row",
        ].join("\n"),
      ),
    ).toThrow(/test or placeholder email data|cannot count as approved production signed-in proof/i);
  });
});
