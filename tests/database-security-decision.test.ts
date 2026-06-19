import { describe, expect, it } from "vitest";
import { getDatabaseSecurityDecisionPacket } from "@/services/database-security-decision";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("database security decision packet", () => {
  it("recommends keeping Supabase for the MVP without marking launch approved", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getDatabaseSecurityDecisionPacket(actor);

    expect(packet.canReadPacket).toBe(true);
    expect(packet.title).toBe("Admin database security decision");
    expect(packet.verdict).toBe("keep_supabase_for_mvp_not_live_approved");
    expect(packet.recommendedStack).toBe("Supabase Postgres/Auth/Storage");
    expect(packet.alternativeReviewed).toBe("PlanetScale MySQL/Vitess");
    expect(packet.liveLaunchReady).toBe(false);
    expect(packet.browserWritesExpected).toBe(0);
    expect(packet.externalWritesExpected).toBe(0);
    expect(packet.decision).toContain("keep Supabase");
    expect(packet.decision).toContain("PlanetScale MySQL");
  });

  it("documents the security tradeoffs DS needs to review", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const packet = getDatabaseSecurityDecisionPacket(actor);

    expect(packet.title).toBe("DS Admin database security decision");
    expect(packet.counts).toEqual({
      platformsReviewed: 4,
      localEvidenceReady: 2,
      approvalRequired: 5,
    });
    expect(packet.comparisons.map((item) => item.key)).toEqual([
      "supabase_postgres_rls",
      "supabase_auth_storage",
      "planetscale_mysql",
      "app_layer_authorization",
    ]);
    expect(
      packet.comparisons.find((item) => item.key === "planetscale_mysql")?.securityImpact,
    ).toContain("own more chapter and role authorization");
    expect(
      packet.controls.find((item) => item.key === "chapter_scoped_rls")
        ?.requiredBeforeLive,
    ).toContain("production policies");
    expect(
      packet.controls.find((item) => item.key === "service_key_handling")
        ?.requiredBeforeLive,
    ).toContain("server-only");
    expect(packet.nextApprovalPrompt).toContain("BAA/HIPAA");
  });

  it("keeps the packet hidden from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getDatabaseSecurityDecisionPacket(member).canReadPacket).toBe(false);
    expect(getDatabaseSecurityDecisionPacket(leader).canReadPacket).toBe(false);
    expect(getDatabaseSecurityDecisionPacket(coach).canReadPacket).toBe(false);
    expect(getDatabaseSecurityDecisionPacket(member).comparisons).toEqual([]);
  });
});
