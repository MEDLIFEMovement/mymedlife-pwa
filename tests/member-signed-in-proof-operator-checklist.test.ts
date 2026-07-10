import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("member signed-in proof operator checklist", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/member-signed-in-proof-operator-checklist.md"),
    "utf8",
  );

  it("keeps the checklist clearly TEST-only and non-production", () => {
    expect(doc).toContain("TEST-only operator checklist");
    expect(doc).toContain("does **not** create production proof");
    expect(doc).toContain("Visible fake or sandbox-facing content must keep `TEST`.");
  });

  it("documents the exact member proof route sequence", () => {
    expect(doc).toContain("/login?redirectTo=/app");
    expect(doc).toContain("/app");
    expect(doc).toContain("/app/events");
    expect(doc).toContain("/app/events/[eventId]");
    expect(doc).toContain("/app/points");
    expect(doc).toContain("/profile");
    expect(doc).toContain("back into the same member loop");
  });

  it("names the production blockers and safe commands", () => {
    expect(doc).toContain("no approved production rollout packet");
    expect(doc).toContain("no real production live-data counts");
    expect(doc).toContain("pnpm production:signed-in-route-proof-readiness");
    expect(doc).toContain("pnpm production:signed-in-route-proof-gaps");
    expect(doc).toContain("pnpm production:signed-in-route-proof:check");
  });

  it("shows a rehearsal-only evidence row shape with visible TEST labels", () => {
    expect(doc).toContain("label,route,status,checkedAt,notes");
    expect(doc).toContain("TEST member app,/app,passed");
    expect(doc).toContain("TEST profile,/profile,passed");
  });
});
