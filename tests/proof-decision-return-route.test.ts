import { describe, expect, it } from "vitest";

import { normalizeProofDecisionReturnTo } from "@/services/proof-decision-return-route";

describe("proof decision return route", () => {
  it("allows only the two proof review routes", () => {
    expect(normalizeProofDecisionReturnTo(" /rush-month/review ")).toBe(
      "/rush-month/review",
    );
    expect(normalizeProofDecisionReturnTo("/admin/hq-proof-write")).toBe(
      "/admin/hq-proof-write",
    );
  });

  it("falls back for missing, external, or malformed routes", () => {
    expect(normalizeProofDecisionReturnTo(null)).toBe("/rush-month/review");
    expect(normalizeProofDecisionReturnTo("https://example.org")).toBe(
      "/rush-month/review",
    );
    expect(normalizeProofDecisionReturnTo("//admin/hq-proof-write")).toBe(
      "/rush-month/review",
    );
  });
});
