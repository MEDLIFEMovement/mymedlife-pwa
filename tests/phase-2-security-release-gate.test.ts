import { describe, expect, it } from "vitest";
import { getPhase2SecurityReleaseGatePacket } from "@/services/phase-2-security-release-gate";

describe("phase 2 security release gate packet", () => {
  it("keeps the live security gate closed while classifying review status", () => {
    const packet = getPhase2SecurityReleaseGatePacket();

    expect(packet.liveSecurityGateOpen).toBe(false);
    expect(packet.counts.localEvidenceReady).toBe(4);
    expect(packet.counts.dsReviewRequired).toBe(3);
    expect(packet.counts.blockedUntilStorageReview).toBe(1);
    expect(packet.checks).toHaveLength(8);
  });

  it("tracks the critical security checks and current evidence", () => {
    const packet = getPhase2SecurityReleaseGatePacket();

    expect(packet.checks.map((item) => item.key)).toEqual([
      "schema_exposure_review",
      "rls_enabled_on_app_tables",
      "direct_write_denials",
      "audit_persistence",
      "role_and_chapter_isolation",
      "storage_policy_gate",
      "service_key_boundary",
      "ci_evidence_capture",
    ]);
    expect(
      packet.checks.find((item) => item.key === "schema_exposure_review")
        ?.localEvidence,
    ).toContain("April 2026 change");
    expect(
      packet.currentEvidence.map((item) => item.artifact),
    ).toEqual(
      expect.arrayContaining([
        "docs/architecture/supabase-schema-auth-rls-plan.md",
        "docs/testing/rls-test-plan.md",
        "src/services/database-security-decision.ts and /admin/database-security",
      ]),
    );
  });

  it("keeps hosted actions blocked until DS and security sign-off", () => {
    const packet = getPhase2SecurityReleaseGatePacket();

    expect(packet.blockedLiveActions).toEqual(
      expect.arrayContaining([
        "Running live migrations against hosted Supabase",
        "Enabling proof storage or uploads",
        "Allowing production browser writes",
      ]),
    );
    expect(packet.officialReferences).toHaveLength(4);
  });
});
