import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getProductionLaunchGate } from "@/services/production-launch-gate";
import { getStagingLumaEventLoopReadModel } from "@/services/staging-luma-event-loop";

describe("production launch gate", () => {
  it("gives admins a launch gate that is explicit about missing live evidence", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const gate = getProductionLaunchGate(actor);

    expect(gate.canReadGate).toBe(true);
    expect(gate.title).toBe("Admin production launch gate");
    expect(gate.launchReady).toBe(false);
    expect(gate.browserWritesEnabled).toBe(0);
    expect(gate.externalWritesEnabled).toBe(0);
    expect(gate.counts).toEqual({
      total: 8,
      localEvidenceReady: 1,
      stagingEvidenceRecorded: 0,
      blockedBeforeLive: 7,
      launchEvidenceChecks: 10,
      environmentReadinessItems: 7,
    });
    expect(gate.launchEvidenceChecks).toHaveLength(10);
    expect(gate.environmentReadiness).toHaveLength(7);
    expect(gate.reviewSnapshot.recordedNow).toEqual([]);
    expect(gate.reviewSnapshot.stillMissing).toHaveLength(17);
    expect(gate.finalReviewPrompt).toContain("production writes");
  });

  it("covers the required production launch gates and review routes", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const gate = getProductionLaunchGate(actor);

    expect(gate.items.map((item) => item.key)).toEqual([
      "production_auth",
      "rls_security",
      "write_promotion",
      "proof_storage",
      "campaign_templates",
      "integration_outbox",
      "audit_observability",
      "pilot_operations",
    ]);
    expect(
      gate.items.find((item) => item.key === "production_auth")?.reviewRoutes,
    ).toEqual(
      expect.arrayContaining([
        "/login",
        "/onboarding",
        "/admin/launch-gate",
        "/chapter/members",
      ]),
    );
    expect(
      gate.items.find((item) => item.key === "production_auth")?.localEvidence,
    ).toContain("onboarding readiness route");
    expect(
      gate.items.find((item) => item.key === "production_auth")?.localEvidence,
    ).toContain("Goal 157 production auth preflight");
    expect(
      gate.items.find((item) => item.key === "production_auth")?.localEvidence,
    ).toContain("Goal 160 membership approval packet");
    expect(
      gate.items.find((item) => item.key === "production_auth")?.localEvidence,
    ).toContain("Goal 161 membership approval result states");
    expect(
      gate.items.find((item) => item.key === "production_auth")
        ?.missingLiveEvidence,
    ).toEqual(expect.arrayContaining([expect.stringContaining("Goal 157")]));
    expect(
      gate.items.find((item) => item.key === "campaign_templates")?.reviewRoutes,
    ).toEqual(
      expect.arrayContaining([
        "/campaigns/planning-goal-setting",
        "/campaigns/start-a-chapter",
      ]),
    );
    expect(
      gate.items.find((item) => item.key === "write_promotion")
        ?.missingLiveEvidence,
    ).toEqual(expect.arrayContaining([expect.stringContaining("rollback")]));
    expect(
      gate.items.find((item) => item.key === "rls_security")?.missingLiveEvidence,
    ).toEqual(expect.arrayContaining([expect.stringContaining("PlanetScale/MySQL")]));
    expect(
      gate.items.find((item) => item.key === "rls_security")?.reviewRoutes,
    ).toEqual(
      expect.arrayContaining(["/admin/launch-gate", "/admin/database-security"]),
    );
    expect(
      gate.items.find((item) => item.key === "audit_observability")
        ?.missingLiveEvidence,
    ).toEqual(expect.arrayContaining([expect.stringContaining("before/after value")]));
    expect(
      gate.items.find((item) => item.key === "audit_observability")
        ?.missingLiveEvidence,
    ).toEqual(expect.arrayContaining([expect.stringContaining("System health review")]));
    expect(
      gate.items.find((item) => item.key === "audit_observability")?.localEvidence,
    ).toContain("production operations runbook");
    expect(
      gate.items.find((item) => item.key === "audit_observability")?.reviewRoutes,
    ).toEqual(
      expect.arrayContaining([
        "/admin/launch-gate",
        "/admin/audit-log",
        "/admin/system-health",
        "/admin/operations",
      ]),
    );
    expect(
      gate.items.find((item) => item.key === "pilot_operations")?.localEvidence,
    ).toContain("production operations runbook");
    expect(
      gate.items.find((item) => item.key === "proof_storage")?.localEvidence,
    ).toContain("Goal 158 proof submission packet");
    expect(
      gate.items.find((item) => item.key === "proof_storage")?.localEvidence,
    ).toContain("Goal 159 proof storage intake packet");
  });

  it("lists the staging and pilot launch evidence required before approval", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const gate = getProductionLaunchGate(actor);
    const evidenceKeys = gate.launchEvidenceChecks.map((check) => check.key);

    expect(evidenceKeys).toEqual([
      "staging_url",
      "staging_supabase",
      "auth_callbacks",
      "rls_ci",
      "proof_storage",
      "luma_event_loop",
      "device_qa_signoff",
      "monitoring_backup",
      "outbox_integration_hold",
      "pilot_support_owner",
    ]);
    expect(
      gate.launchEvidenceChecks.every(
        (check) =>
          check.status === "missing_before_pilot" &&
          check.requiredEvidence.length > 30 &&
          check.acceptanceSignal.length > 30 &&
          check.blockedUntil.length > 20,
      ),
    ).toBe(true);
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "luma_event_loop")
        ?.requiredEvidence,
    ).toContain("create or update the approved Luma event");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "luma_event_loop")
        ?.requiredEvidence,
    ).toContain("/app, /leader, /staff, /admin, and /rush-month/leaderboard");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "luma_event_loop")
        ?.acceptanceSignal,
    ).toContain("zero unauthorized outbox sends");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "luma_event_loop")
        ?.supportingRoutes,
    ).toEqual(
      expect.arrayContaining([
        "/app",
        "/leader",
        "/staff",
        "/admin",
        "/rush-month/leaderboard",
        "/admin/audit-log?source=luma-live-pilot",
        "/admin/integration-outbox?source=luma-live-pilot",
      ]),
    );
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "luma_event_loop")
        ?.reviewRoute,
    ).toBe("/admin/luma-live-pilot");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "device_qa_signoff")
        ?.requiredEvidence,
    ).toContain("Goal 149 device/PWA matrix");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "outbox_integration_hold")
        ?.requiredEvidence,
    ).toContain("non-approved Luma behavior");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "auth_callbacks")
        ?.requiredEvidence,
    ).toContain("Goal 157 auth preflight");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "auth_callbacks")
        ?.requiredEvidence,
    ).toContain("Vercel-SSO-gated staging access path");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "staging_url")
        ?.requiredEvidence,
    ).toContain("/login?next=/sso-api");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "staging_url")
        ?.acceptanceSignal,
    ).toContain("Vercel-SSO-to-login staging gate");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "auth_callbacks")
        ?.reviewRoute,
    ).toBe("/onboarding");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "staging_url")
        ?.requiredEvidence,
    ).toContain("approved reviewer access path");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "pilot_support_owner")
        ?.reviewRoute,
    ).toBe("/admin/pilot-scope");
  });

  it("exposes the production Supabase and Vercel readiness packet without secrets", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const gate = getProductionLaunchGate(actor, {
      MYMEDLIFE_PILOT_ROLLBACK_OWNER: "Nick Ellis",
      MYMEDLIFE_PILOT_SUPPORT_OWNER: "Maya Support",
      MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL: "#mymedlife-pilot-support",
      MYMEDLIFE_PILOT_DS_OWNER: "DS owner",
      MYMEDLIFE_PILOT_HQ_ADMIN_OWNER: "HQ owner",
    });
    const packetKeys = gate.environmentReadiness.map((item) => item.key);

    expect(packetKeys).toEqual([
      "production_supabase_project",
      "production_vercel_environment",
      "production_env_vars",
      "auth_callback_urls",
      "dns_domain_plan",
      "backup_restore_path",
      "rollback_support_owners",
    ]);
    expect(
      gate.environmentReadiness
        .filter((item) => item.key !== "rollback_support_owners")
        .every(
          (item) =>
            item.status === "missing_before_pilot" &&
            item.secretsShown === 0 &&
            item.requiredEvidence.length >= 3 &&
            item.safeDefaults.length >= 3,
        ),
    ).toBe(true);
    expect(
      gate.environmentReadiness.find((item) => item.key === "rollback_support_owners")
        ?.status,
    ).toBe("recorded_for_review");
    expect(
      gate.reviewSnapshot.recordedNow.map((item) => item.label),
    ).toContain("Rollback and support owners");
    expect(
      gate.environmentReadiness.find(
        (item) => item.key === "production_env_vars",
      )?.requiredEvidence,
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("NEXT_PUBLIC_SUPABASE_URL"),
        expect.stringContaining("MYMEDLIFE_CONTROL_LAYER_SOURCE=supabase"),
      ]),
    );
    expect(
      gate.environmentReadiness.find(
        (item) => item.key === "production_env_vars",
      )?.envVarManifest,
    ).toEqual(
      expect.arrayContaining([
        {
          label: "Browser-safe public values",
          names: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
        },
        {
          label: "Approved Luma pilot only",
          names: expect.arrayContaining([
            "LUMA_API_KEY",
            "LUMA_CALENDAR_ID",
            "MYMEDLIFE_ENABLE_LUMA_ATTENDANCE_IMPORT",
          ]),
        },
        {
          label: "External systems held off",
          names: expect.arrayContaining([
            "HUBSPOT_*",
            "N8N_*",
            "OPENAI_API_KEY",
          ]),
        },
      ]),
    );
    expect(
      gate.environmentReadiness.find((item) => item.key === "auth_callback_urls")
        ?.requiredEvidence,
    ).toEqual(expect.arrayContaining([expect.stringContaining("www.mymedlife.org")]));
    expect(
      gate.environmentReadiness.find((item) => item.key === "dns_domain_plan")
        ?.requiredEvidence,
    ).toEqual(expect.arrayContaining([expect.stringContaining("staging.mymedlife.org")]));
    expect(
      gate.environmentReadiness.find((item) => item.key === "backup_restore_path")
        ?.requiredEvidence,
    ).toEqual(expect.arrayContaining([expect.stringContaining("Restore drill owner")]));
    expect(
      gate.environmentReadiness.find((item) => item.key === "rollback_support_owners")
        ?.requiredEvidence,
    ).toEqual(
      expect.arrayContaining([
        "Rollback owner: Nick Ellis.",
        "Support owner: Maya Support.",
        "Support/pause channel: #mymedlife-pilot-support.",
        "DS owner: DS owner.",
        "HQ/admin owner: HQ owner.",
      ]),
    );
  });

  it("records safe production packet details when names-only readiness values are present", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const gate = getProductionLaunchGate(actor, {
      MYMEDLIFE_PRODUCTION_SUPABASE_PROJECT_REF: "prod-abc123",
      MYMEDLIFE_PRODUCTION_SUPABASE_MIGRATION_OWNER: "Kiomi",
      MYMEDLIFE_PRODUCTION_SECURITY_PROOF_NOTE: "Security advisor rerun required after approved apply",
      MYMEDLIFE_PRODUCTION_VERCEL_PROJECT: "mymedlife-pwa-production",
      MYMEDLIFE_PRODUCTION_DEPLOY_SOURCE: "main",
      MYMEDLIFE_PRODUCTION_ROLLBACK_TARGET: "last-known-good deployment",
      MYMEDLIFE_PRODUCTION_ACCESS_POSTURE: "pilot reviewers use approved app auth",
      MYMEDLIFE_PRODUCTION_ENV_PACKET_STATUS: "reviewed by DS/platform",
      MYMEDLIFE_PRODUCTION_SECRET_OWNER: "DS/platform",
      MYMEDLIFE_PRODUCTION_LUMA_SCOPE: "approved pilot calendar only",
      MYMEDLIFE_PRODUCTION_AUTH_CALLBACK_URL: "https://www.mymedlife.org/auth/callback",
      MYMEDLIFE_STAGING_AUTH_CALLBACK_URL: "https://staging.mymedlife.org/auth/callback",
      MYMEDLIFE_PRODUCTION_ROLE_ROUTING_NOTE: "backend-routed role shells",
      MYMEDLIFE_PRODUCTION_DNS_OWNER: "Renato",
      MYMEDLIFE_PRODUCTION_REGISTRAR: "GoDaddy",
      MYMEDLIFE_PRODUCTION_CUTOVER_PLAN: "weeknight pilot-only cutover",
      MYMEDLIFE_PRODUCTION_BACKUP_OWNER: "DS on-call",
      MYMEDLIFE_PRODUCTION_RESTORE_PATH: "Supabase PITR plus manual app repair runbook",
      MYMEDLIFE_PRODUCTION_RESTORE_DRILL_NOTE: "restore drill scheduled before pilot",
      MYMEDLIFE_PILOT_ROLLBACK_OWNER: "Nick Ellis",
      MYMEDLIFE_PILOT_SUPPORT_OWNER: "Maya Support",
      MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL: "#mymedlife-pilot-support",
      MYMEDLIFE_PILOT_DS_OWNER: "DS owner",
      MYMEDLIFE_PILOT_HQ_ADMIN_OWNER: "HQ owner",
    });

    expect(
      gate.environmentReadiness.find(
        (item) => item.key === "production_supabase_project",
      )?.status,
    ).toBe("recorded_for_review");
    expect(
      gate.environmentReadiness.find(
        (item) => item.key === "production_supabase_project",
      )?.recordedEvidence,
    ).toEqual(
      expect.arrayContaining([
        "Project ref: prod-abc123.",
        "Migration owner: Kiomi.",
      ]),
    );
    expect(
      gate.environmentReadiness.find(
        (item) => item.key === "production_vercel_environment",
      )?.status,
    ).toBe("recorded_for_review");
    expect(
      gate.environmentReadiness.find(
        (item) => item.key === "production_env_vars",
      )?.recordedEvidence,
    ).toEqual(
      expect.arrayContaining([
        "Names-only env-var manifest: reviewed by DS/platform.",
        "Secret owner: DS/platform.",
        "Approved Luma scope: approved pilot calendar only.",
      ]),
    );
    expect(
      gate.environmentReadiness.find((item) => item.key === "auth_callback_urls")
        ?.recordedEvidence,
    ).toEqual(
      expect.arrayContaining([
        "Production callback URL: https://www.mymedlife.org/auth/callback.",
        "Staging callback URL: https://staging.mymedlife.org/auth/callback.",
      ]),
    );
    expect(
      gate.environmentReadiness.find((item) => item.key === "dns_domain_plan")
        ?.status,
    ).toBe("recorded_for_review");
    expect(
      gate.environmentReadiness.find((item) => item.key === "backup_restore_path")
        ?.status,
    ).toBe("recorded_for_review");
    expect(
      gate.environmentReadiness.find((item) => item.key === "rollback_support_owners")
        ?.status,
    ).toBe("recorded_for_review");
    expect(
      gate.environmentReadiness.find((item) => item.key === "rollback_support_owners")
        ?.recordedEvidence,
    ).toEqual(
      expect.arrayContaining([
        "Rollback owner: Nick Ellis.",
        "Support owner: Maya Support.",
        "Support/pause channel: #mymedlife-pilot-support.",
      ]),
    );
  });

  it("surfaces recorded pilot answers in the launch gate without claiming approval", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const gate = getProductionLaunchGate(actor, {
      MYMEDLIFE_PILOT_CHAPTER: "UCLA MEDLIFE",
      MYMEDLIFE_PILOT_FIRST_HOSTED_WRITE: "`action_started`",
      MYMEDLIFE_PILOT_COACH_OWNER: "Coach Ana",
      MYMEDLIFE_PILOT_SUPPORT_OWNER: "Maya Support",
      MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL: "#mymedlife-pilot-support",
      MYMEDLIFE_PILOT_ROLLBACK_OWNER: "Kiomi Matsukawa",
    });

    expect(
      gate.items.find((item) => item.key === "write_promotion")?.missingLiveEvidence,
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("`action_started`"),
        expect.stringContaining("Kiomi Matsukawa"),
      ]),
    );
    expect(
      gate.items.find((item) => item.key === "audit_observability")
        ?.missingLiveEvidence,
    ).toEqual(
      expect.arrayContaining([expect.stringContaining("Kiomi Matsukawa")]),
    );
    expect(
      gate.items.find((item) => item.key === "pilot_operations")?.localEvidence,
    ).toContain("UCLA MEDLIFE");
    expect(
      gate.items.find((item) => item.key === "pilot_operations")?.localEvidence,
    ).toContain("Maya Support");
    expect(
      gate.items.find((item) => item.key === "pilot_operations")?.localEvidence,
    ).toContain("#mymedlife-pilot-support");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "pilot_support_owner")
        ?.requiredEvidence,
    ).toContain("UCLA MEDLIFE");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "pilot_support_owner")
        ?.requiredEvidence,
    ).toContain("Maya Support");
  });

  it("distinguishes staged proof from fully missing launch evidence when hosted staging evidence exists", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const gate = getProductionLaunchGate(actor, process.env, {
      lumaReadModel: getStagingLumaEventLoopReadModel("staging"),
      hostedStagingEvidenceObserved: true,
    });

    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "staging_url")
        ?.status,
    ).toBe("staging_evidence_recorded");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "staging_supabase")
        ?.status,
    ).toBe("staging_evidence_recorded");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "auth_callbacks")
        ?.status,
    ).toBe("staging_evidence_recorded");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "luma_event_loop")
        ?.status,
    ).toBe("staging_evidence_recorded");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "staging_url")
        ?.requiredEvidence,
    ).toContain("already has a stable reviewer URL");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "staging_supabase")
        ?.acceptanceSignal,
    ).toContain("Supabase-backed readback");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "auth_callbacks")
        ?.blockedUntil,
    ).toContain("still need final approval");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "luma_event_loop")
        ?.acceptanceSignal,
    ).toContain("leaderboard readback");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "luma_event_loop")
        ?.acceptanceSignal,
    ).toContain("/app, /leader, /staff, /admin, and /rush-month/leaderboard");
    expect(gate.counts.stagingEvidenceRecorded).toBe(4);
    expect(
      gate.reviewSnapshot.recordedNow.map((item) => item.label),
    ).toEqual(
      expect.arrayContaining([
        "Staging deployment URL",
        "Staging Supabase posture",
        "Auth callback and role routing",
        "Luma event, RSVP, attendance, and points loop",
      ]),
    );
    expect(
      gate.reviewSnapshot.stillMissing.map((item) => item.label),
    ).toContain("Production Supabase project");
  });

  it("keeps every gate write-safe and approval-bound", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const gate = getProductionLaunchGate(actor);

    expect(gate.title).toBe("DS Admin production launch and integration gate");
    expect(
      gate.items.every(
        (item) =>
          item.browserWritesExpected === 0 &&
          item.externalWritesExpected === 0 &&
          item.approvalRequired.length > 20 &&
          item.missingLiveEvidence.length >= 3,
      ),
    ).toBe(true);
    expect(
      gate.items.find((item) => item.key === "integration_outbox")?.approvalRequired,
    ).toContain("External writes");
  });

  it("hides the launch gate from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getProductionLaunchGate(member).canReadGate).toBe(false);
    expect(getProductionLaunchGate(committeeMember).canReadGate).toBe(false);
    expect(getProductionLaunchGate(committeeChair).canReadGate).toBe(false);
    expect(getProductionLaunchGate(leader).canReadGate).toBe(false);
    expect(getProductionLaunchGate(coach).canReadGate).toBe(false);
    expect(getProductionLaunchGate(member).items).toEqual([]);
    expect(getProductionLaunchGate(member).launchEvidenceChecks).toEqual([]);
    expect(getProductionLaunchGate(member).environmentReadiness).toEqual([]);
  });
});
