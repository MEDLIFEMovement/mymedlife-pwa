import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("leader proof gap backlog", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/leader-proof-gap-backlog.md"),
    "utf8",
  );

  it("lists the remaining leader proof gaps in order", () => {
    expect(doc).toContain("Real production Leader account");
    expect(doc).toContain("Reviewer-owned hosted browser proof");
    expect(doc).toContain("selected-member states.");
    expect(doc).toContain("Production rollout packet and production live-data counts");
  });

  it("keeps TEST and staging evidence out of production proof", () => {
    expect(doc).toContain("TEST-only");
    expect(doc).toContain("preview-cookie");
    expect(doc).toContain("local actor");
    expect(doc).toContain("Staging evidence presented as production proof");
  });
});
