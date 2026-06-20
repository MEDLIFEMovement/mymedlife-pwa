import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getProductionLaunchGate } from "@/services/production-launch-gate";

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
      blockedBeforeLive: 7,
      launchEvidenceChecks: 9,
      stagingPilotMilestones: 5,
    });
    expect(gate.launchEvidenceChecks).toHaveLength(9);
    expect(gate.stagingPilotMilestones).toHaveLength(5);
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
      gate.launchEvidenceChecks.find((check) => check.key === "device_qa_signoff")
        ?.requiredEvidence,
    ).toContain("Goal 149 device/PWA matrix");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "outbox_integration_hold")
        ?.requiredEvidence,
    ).toContain("HubSpot");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "auth_callbacks")
        ?.requiredEvidence,
    ).toContain("Goal 157 auth preflight");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "auth_callbacks")
        ?.reviewRoute,
    ).toBe("/onboarding");
    expect(
      gate.launchEvidenceChecks.find((check) => check.key === "pilot_support_owner")
        ?.reviewRoute,
    ).toBe("/admin/pilot-scope");
  });

  it("turns the Phase 2 gate into an ordered staging approval sequence", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const gate = getProductionLaunchGate(actor);

    expect(gate.stagingPilotMilestones.map((item) => item.key)).toEqual([
      "staff_dry_run",
      "device_accessibility",
      "pilot_scope_owners",
      "first_hosted_write",
      "integration_hold",
    ]);
    expect(
      gate.stagingPilotMilestones.find((item) => item.key === "staff_dry_run")
        ?.reviewRoute,
    ).toBe("/admin/staff-dry-run");
    expect(
      gate.stagingPilotMilestones.find((item) => item.key === "device_accessibility")
        ?.evidenceToCapture.join(" "),
    ).toContain("staging build");
    expect(
      gate.stagingPilotMilestones.find((item) => item.key === "pilot_scope_owners")
        ?.blockedUntil,
    ).toContain("support owners");
    expect(
      gate.stagingPilotMilestones.find((item) => item.key === "first_hosted_write")
        ?.evidenceToCapture.join(" "),
    ).toContain("Rollback");
    expect(
      gate.stagingPilotMilestones.find((item) => item.key === "integration_hold")
        ?.goal,
    ).toContain("outside systems");
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
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getProductionLaunchGate(member).canReadGate).toBe(false);
    expect(getProductionLaunchGate(leader).canReadGate).toBe(false);
    expect(getProductionLaunchGate(coach).canReadGate).toBe(false);
    expect(getProductionLaunchGate(member).items).toEqual([]);
    expect(getProductionLaunchGate(member).launchEvidenceChecks).toEqual([]);
  });
});
