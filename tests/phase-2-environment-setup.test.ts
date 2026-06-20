import { describe, expect, it } from "vitest";
import { getPhase2EnvironmentSetupPacket } from "@/services/phase-2-environment-setup";

describe("phase 2 environment setup packet", () => {
  it("documents four environments while keeping live setup blocked", () => {
    const packet = getPhase2EnvironmentSetupPacket();

    expect(packet.liveSetupBlocked).toBe(true);
    expect(packet.selectedTopology.key).toBe("B");
    expect(packet.environments.map((item) => item.key)).toEqual([
      "local",
      "preview",
      "staging",
      "production",
    ]);
    expect(packet.counts.environments).toBe(4);
    expect(packet.counts.hostedProjects).toBe(1);
    expect(packet.counts.readyForReview).toBe(3);
    expect(packet.counts.ownerInputRequired).toBe(1);
  });

  it("captures browser and server-only key boundaries without secrets", () => {
    const packet = getPhase2EnvironmentSetupPacket();

    expect(packet.environmentVariables.map((item) => item.name)).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SECRET_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_VERCEL_URL",
    ]);
    expect(packet.counts.browserVariables).toBe(5);
    expect(packet.counts.serverOnlyVariables).toBe(2);
    expect(
      packet.environmentVariables.find(
        (item) => item.name === "SUPABASE_SECRET_KEY",
      ),
    ).toMatchObject({
      scope: "server_only",
      environments: ["staging", "production"],
    });
  });

  it("spells out the owner inputs and blocked live actions", () => {
    const packet = getPhase2EnvironmentSetupPacket();

    expect(packet.expectations.map((item) => item.key)).toEqual([
      "supabase_ownership",
      "vercel_environment_plan",
      "callback_and_redirects",
      "backup_monitoring",
      "promotion_and_rollback",
    ]);
    expect(packet.blockedLiveActions).toEqual(
      expect.arrayContaining([
        "Creating or linking real Supabase projects",
        "Adding staging or production keys to source control",
        "Promoting a preview deployment to production before the security gate is approved",
      ]),
    );
    expect(packet.ownerFollowUp.map((item) => item.key)).toEqual([
      "confirm_existing_project_role",
      "create_missing_hosted_project",
      "name_staging_domain_and_vercel_env",
      "load_env_vars_without_source_control",
    ]);
    expect(packet.hostedSupabaseState.projects).toEqual([
      expect.objectContaining({
        name: "myMEDLIFE",
        ref: "rceupryepjgkdeqgxzrc",
        environmentRole: "unknown",
      }),
    ]);
    expect(packet.officialReferences).toHaveLength(5);
  });
});
