import { describe, expect, it } from "vitest";
import { getPhase2EnvironmentSetupPacket } from "@/services/phase-2-environment-setup";

describe("phase 2 environment setup packet", () => {
  it("documents four environments while keeping live setup blocked", () => {
    const packet = getPhase2EnvironmentSetupPacket();
    const staging = packet.environments.find((item) => item.key === "staging");

    expect(packet.liveSetupBlocked).toBe(true);
    expect(packet.selectedTopology.key).toBe("B");
    expect(packet.environments.map((item) => item.key)).toEqual([
      "local",
      "preview",
      "staging",
      "production",
    ]);
    expect(packet.counts.environments).toBe(4);
    expect(packet.counts.hostedProjects).toBe(2);
    expect(packet.counts.readyForReview).toBe(2);
    expect(packet.counts.ownerInputRequired).toBe(2);
    expect(packet.hostedSupabaseState.summary).toContain(
      "confirmed as staging",
    );
    expect(packet.hostedSupabaseState.summary).toContain(
      "production Supabase project has been created",
    );
    expect(packet.hostedSupabaseState.summary).toContain(
      "security advisor is clean",
    );
    expect(packet.hostedSupabaseState.summary).toContain(
      "can close with production schema application explicitly deferred",
    );
    expect(staging).toMatchObject({
      appHost: "https://staging.mymedlife.org",
      authCallback: "https://staging.mymedlife.org/auth/callback",
      redirectPattern: "Exact staging URL only",
    });
    expect(staging?.notes.join(" ")).toContain(
      "The hosted Supabase project `rceupryepjgkdeqgxzrc` is confirmed as the staging project.",
    );
    expect(staging?.notes.join(" ")).toContain(
      "hosted staging auth is proven on staging.mymedlife.org",
    );
    expect(staging?.notes.join(" ")).toContain(
      "security advisor is now clean after enabling leaked password protection",
    );
  });

  it("captures browser and server-only key boundaries without secrets", () => {
    const packet = getPhase2EnvironmentSetupPacket();

    expect(packet.environmentVariables.map((item) => item.name)).toEqual([
      "MYMEDLIFE_AUTH_MODE",
      "MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SECRET_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_VERCEL_URL",
    ]);
    expect(packet.counts.browserVariables).toBe(5);
    expect(packet.counts.serverOnlyVariables).toBe(4);
    expect(
      packet.environmentVariables.find(
        (item) => item.name === "SUPABASE_SECRET_KEY",
      ),
    ).toMatchObject({
      scope: "server_only",
      environments: ["staging", "production"],
    });
    expect(
      packet.environmentVariables.find(
        (item) => item.name === "MYMEDLIFE_AUTH_MODE",
      ),
    ).toMatchObject({
      scope: "server_only",
      environments: ["local", "preview", "staging", "production"],
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
        "Applying production schema migrations or enabling production writes without DS/security approval",
        "Adding staging or production keys to source control",
        "Promoting a preview deployment to production before the security gate is approved",
      ]),
    );
    expect(packet.ownerFollowUp.map((item) => item.key)).toEqual([
      "approve_production_schema_path",
      "assign_staging_validation_owners",
      "name_staging_domain_and_vercel_env",
      "load_env_vars_without_source_control",
    ]);
    expect(
      packet.ownerFollowUp.find(
        (item) => item.key === "approve_production_schema_path",
      ),
    ).toMatchObject({
      label: "Record the production schema decision",
    });
    expect(
      packet.ownerFollowUp.find(
        (item) => item.key === "name_staging_domain_and_vercel_env",
      ),
    ).toMatchObject({
      label: "Record the staging Vercel target and preview scope",
      nextAction:
        "Keep staging.mymedlife.org attached to the Vercel staging environment, confirm preview stays scoped to staging rather than production, and record any remaining live-env gaps outside source control.",
    });
    expect(packet.hostedSupabaseState.projects).toEqual([
      expect.objectContaining({
        name: "myMEDLIFE",
        ref: "rceupryepjgkdeqgxzrc",
        environmentRole: "staging",
      }),
      expect.objectContaining({
        name: "myMEDLIFE Production",
        ref: "fnlhontvvprwgooevzdl",
        environmentRole: "production",
      }),
    ]);
    expect(packet.hostedSupabaseState.blockers).toEqual(
      expect.arrayContaining([
        "The team still needs to record one explicit production schema decision: defer schema application beyond Phase 2, or approve a separate production apply with rollback evidence.",
        "Hosted auth, RLS, first-write validation, backup checks, monitoring, and rollback owners still need to be named before pilot users are invited.",
      ]),
    );
    expect(packet.officialReferences).toHaveLength(5);
  });
});
