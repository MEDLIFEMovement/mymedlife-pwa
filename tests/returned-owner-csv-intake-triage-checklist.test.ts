import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("returned owner CSV intake triage checklist", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/returned-owner-csv-intake-triage-checklist.md"),
    "utf8",
  );

  it("keeps the returned-owner dry-run and apply boundaries explicit", () => {
    expect(doc).toContain("returned-owner-packets/<owner-slug>/");
    expect(doc).toContain("Mode: DRY RUN");
    expect(doc).toContain("READY TO APPLY");
    expect(doc).toContain("wrong owner folder");
    expect(doc).toContain("Coordinator approval is required");
    expect(doc).toContain("No invites");
  });
});
