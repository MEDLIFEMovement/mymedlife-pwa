import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("staff-admin proof rehearsal support packet", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/staff-admin-proof-rehearsal-support-packet.md"),
    "utf8",
  );

  it("lists the exact file set and reviewer proof commands", () => {
    expect(doc).toContain("docs/staff-admin-proof-rehearsal-workflow-chain.md");
    expect(doc).toContain("docs/staff-admin-proof-rehearsal-quickstart.md");
    expect(doc).toContain("docs/staff-admin-proof-rehearsal-ops-note.md");
    expect(doc).toContain("docs/staff-admin-proof-rehearsal-front-door.md");
    expect(doc).toContain("scripts/help-staff-admin-proof-rehearsal-chain.mjs");
    expect(doc).toContain("scripts/run-staff-admin-proof-rehearsal-chain.mjs");
    expect(doc).toContain("scripts/check-staff-admin-proof-rehearsal.mjs");
    expect(doc).toContain("scripts/verify-staff-admin-proof-rehearsal-artifacts.mjs");
    expect(doc).toContain("scripts/verify-staff-admin-proof-rehearsal-workflow-chain.mjs");
    expect(doc).toContain("scripts/staff-admin-proof-rehearsal-front-door.mjs");
    expect(doc).toContain("pnpm staff-admin-proof-rehearsal:front-door");
    expect(doc).toContain("pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv");
    expect(doc).toContain("pnpm staff-admin-proof-rehearsal:workflow-verify");
  });

  it("states the acceptance criteria, out of scope, and promote-vs-park call", () => {
    expect(doc).toContain("The reviewer/operator can discover the workflow from the front door without stitching the pieces together by hand.");
    expect(doc).toContain("The chain command runs the TEST rehearsal snapshot build and the round-trip verifier in one read-only step.");
    expect(doc).toContain("production proof");
    expect(doc).toContain("UI/product changes");
    expect(doc).toContain("Promote if the queue wants a low-risk support-only packet");
    expect(doc).toContain("Park if the queue is prioritizing product behavior");
  });

  it("keeps the TEST-only boundary explicit", () => {
    expect(doc).toContain("TEST-only rehearsal output");
    expect(doc).toContain("blocked from production proof");
    expect(doc).toContain("do not use this packet as live production evidence");
    expect(doc).toContain("keep the negative member row visible");
  });
});
