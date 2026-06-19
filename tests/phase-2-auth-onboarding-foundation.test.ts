import { describe, expect, it } from "vitest";
import { getPhase2AuthOnboardingFoundationPacket } from "@/services/phase-2-auth-onboarding-foundation";

describe("phase 2 auth and onboarding foundation packet", () => {
  it("keeps live auth blocked while documenting role routing", () => {
    const packet = getPhase2AuthOnboardingFoundationPacket();

    expect(packet.liveAuthBlocked).toBe(true);
    expect(packet.callbackRoute).toBe("/auth/callback");
    expect(packet.counts.roleRoutes).toBe(7);
    expect(packet.roleRoutes.map((item) => item.audience)).toEqual([
      "member",
      "chapter_leader",
      "coach",
      "staff",
      "admin",
      "ds_admin",
      "super_admin",
    ]);
    expect(
      packet.roleRoutes.find((item) => item.audience === "ds_admin"),
    ).toMatchObject({
      preferredRoute: "/admin/phase-2",
      fallbackRoute: "/admin",
    });
  });

  it("documents identity and authorization rules clearly", () => {
    const packet = getPhase2AuthOnboardingFoundationPacket();

    expect(packet.counts.readyForReview).toBe(10);
    expect(packet.counts.ownerInputRequired).toBe(2);
    expect(packet.profileRules.map((item) => item.key)).toEqual([
      "one_auth_user_one_profile",
      "duplicate_handling",
      "membership_not_granted_on_signup",
      "server_actor_context",
      "authorization_claim_source",
      "support_owner",
    ]);
    expect(
      packet.profileRules.find((item) => item.key === "authorization_claim_source")
        ?.rule,
    ).toContain("user-editable metadata");
    expect(
      packet.ownerDecisions.find((item) => item.key === "support_and_rollback_owner")
        ?.status,
    ).toBe("owner_input_required");
  });

  it("keeps blocked live actions and official references explicit", () => {
    const packet = getPhase2AuthOnboardingFoundationPacket();

    expect(packet.blockedLiveActions).toEqual(
      expect.arrayContaining([
        "Creating production users",
        "Saving chapter join requests against hosted Supabase",
        "Routing users from preview cookies instead of validated auth identity",
      ]),
    );
    expect(packet.identitySourceOfTruth).toContain("Supabase Auth identity");
    expect(packet.officialReferences).toHaveLength(4);
  });
});
