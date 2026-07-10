import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildProductionSignedInRouteProofImport } from "@/services/production-signed-in-route-proof-import";

describe("leader signed-in proof TEST rehearsal doc", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/leader-signed-in-proof-test-rehearsal.md"),
    "utf8",
  );

  it("contains one approved TEST Leader row and one unauthorized TEST role row", () => {
    expect(doc).toContain("test.leader.chapter@example.test,leader,/leader?view=overview,passed");
    expect(doc).toContain("test.member.only@example.test,leader,/app,failed");
    expect(doc).toContain("member-only account must not satisfy Leader proof");
  });

  it("keeps the non-production boundary visible", () => {
    expect(doc).toContain("must not be copied into");
    expect(doc).toContain("production `signed-in-route-proof.csv`");
    expect(doc).toContain("Do not write production Supabase rows");
    expect(doc).toContain("preview-cookie, local actor, staging, TEST, Figma, or sample");
  });

  it("documents the validation path without treating TEST rows as production proof", () => {
    expect(doc).toContain("pnpm production:signed-in-route-proof-readiness");
    expect(doc).toContain("pnpm production:signed-in-route-proof:check");
    expect(doc).toContain("pnpm auth:role-access-invariants");
    expect(doc).toContain("tests/leader-signed-in-proof-test-rehearsal-doc.test.ts");
  });

  it("proves the TEST rehearsal rows are rejected by the production importer", () => {
    const rehearsalCsv = [
      "email,workspace,observedPath,status,checkedAt,notes",
      "test.leader.chapter@example.test,leader,/leader?view=overview,passed,2026-07-10T15:00:00Z,TEST staging rehearsal only",
      "test.member.only@example.test,leader,/app,failed,2026-07-10T15:05:00Z,TEST staging negative only",
    ].join("\n");

    expect(() => buildProductionSignedInRouteProofImport(rehearsalCsv)).toThrow(
      /test or placeholder email data/,
    );
  });
});
