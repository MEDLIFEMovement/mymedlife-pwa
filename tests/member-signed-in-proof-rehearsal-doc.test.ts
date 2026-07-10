import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("member signed-in proof rehearsal doc", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/member-signed-in-proof-rehearsal.md"),
    "utf8",
  );

  it("keeps the rehearsal packet clearly TEST-only", () => {
    expect(doc).toContain("TEST-only rehearsal packet");
    expect(doc).toContain("does **not** count as production signed-in proof");
    expect(doc).toContain("visible `TEST` labels");
  });

  it("lists the exact member proof route sequence", () => {
    expect(doc).toContain("/login?redirectTo=/app");
    expect(doc).toContain("/app");
    expect(doc).toContain("/app/events");
    expect(doc).toContain("/app/events/[eventId]");
    expect(doc).toContain("/app/points");
    expect(doc).toContain("/profile");
    expect(doc).toContain("back into the same member loop");
  });

  it("keeps the proof boundary and read-only commands visible", () => {
    expect(doc).toContain("preview-cookie sessions");
    expect(doc).toContain("SOP/sample or staging evidence");
    expect(doc).toContain("pnpm production:signed-in-route-proof-readiness");
    expect(doc).toContain("pnpm production:signed-in-route-proof-gaps");
    expect(doc).toContain("pnpm production:signed-in-route-proof:check");
  });
});
