import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production signed-in proof preflight doc", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/production-signed-in-proof-preflight.md"),
    "utf8",
  );

  it("keeps local and production proof clearly separated", () => {
    expect(doc).toContain("do **not** count as production signed-in proof");
    expect(doc).toContain("Do not copy local artifacts into:");
    expect(doc).toContain("signed-in-route-proof.csv");
    expect(doc).toContain("the invite gate");
  });

  it("lists the four required production proof classes and preflight commands", () => {
    expect(doc).toContain("member -> `/app`");
    expect(doc).toContain("leader -> `/leader?view=overview`");
    expect(doc).toContain("staff/support -> `/staff?view=chapters`");
    expect(doc).toContain("DS/admin -> `/admin`");
    expect(doc).toContain("pnpm figma-seed:proof-separation");
    expect(doc).toContain("pnpm production:signed-in-route-proof-readiness");
    expect(doc).toContain("pnpm auth:role-access-invariants");
    expect(doc).toContain("pnpm production:signed-in-route-proof-gaps");
    expect(doc).toContain("pnpm production:signed-in-route-proof:check");
    expect(doc).toContain("pnpm rollout:signed-in-proof-import");
  });

  it("keeps the blocker language visible", () => {
    expect(doc).toContain("an approved production rollout packet");
    expect(doc).toContain("production live data counts");
    expect(doc).toContain("production signed-in proof is not ready yet");
  });
});
