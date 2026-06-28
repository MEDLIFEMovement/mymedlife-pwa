import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getProductionOperationsRunbook } from "@/services/production-operations-runbook";

describe("production operations runbook", () => {
  it("gives admins a write-safe production operations runbook", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const runbook = getProductionOperationsRunbook(actor);

    expect(runbook.canReadRunbook).toBe(true);
    expect(runbook.title).toBe("Admin production operations runbook");
    expect(runbook.launchReady).toBe(false);
    expect(runbook.browserWritesExpected).toBe(0);
    expect(runbook.externalWritesExpected).toBe(0);
    expect(runbook.secretsShown).toBe(0);
    expect(runbook.counts).toEqual({
      total: 8,
      localRunbookReady: 3,
      blockedBeforeLive: 5,
    });
    expect(runbook.finalPrompt).toContain("real students");
  });

  it("covers the required runbook areas and keeps every item approval-bound", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const runbook = getProductionOperationsRunbook(actor);

    expect(runbook.title).toBe("Full production operations runbook");
    expect(runbook.items.map((item) => item.key)).toEqual([
      "incident_triage",
      "auth_access_incident",
      "database_rls_incident",
      "write_rollback",
      "proof_storage_moderation",
      "integration_recovery",
      "mobile_pwa_support",
      "pilot_communications",
    ]);
    expect(
      runbook.items.every(
        (item) =>
          item.browserWritesExpected === 0 &&
          item.externalWritesExpected === 0 &&
          item.secretsShown === 0 &&
          item.firstResponseSteps.length >= 3 &&
          item.missingLiveEvidence.length >= 3 &&
          item.approvalRequired.length > 20,
      ),
    ).toBe(true);
  });

  it("shows DS Admin the integration recovery posture without enabling sends", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const runbook = getProductionOperationsRunbook(actor);
    const integrationRecovery = runbook.items.find(
      (item) => item.key === "integration_recovery",
    );

    expect(runbook.title).toBe("DS Admin production operations and recovery runbook");
    expect(integrationRecovery?.ownerLane).toBe("Data Solutions");
    expect(integrationRecovery?.status).toBe("local_runbook_ready");
    expect(integrationRecovery?.localRunbook).toContain("approved Luma event loop");
    expect(integrationRecovery?.localRunbook).toContain("n8n");
    expect(integrationRecovery?.missingLiveEvidence.join(" ")).toContain(
      "non-approved Luma contracts remain disabled",
    );
    expect(integrationRecovery?.missingLiveEvidence.join(" ")).toContain("dead-letter");
    expect(integrationRecovery?.externalWritesExpected).toBe(0);
  });

  it("names offline PWA support without clearing mobile launch approval", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const runbook = getProductionOperationsRunbook(actor);
    const mobileSupport = runbook.items.find((item) => item.key === "mobile_pwa_support");

    expect(mobileSupport?.status).toBe("blocked_before_live");
    expect(mobileSupport?.localRunbook).toContain("offline fallback shell");
    expect(mobileSupport?.missingLiveEvidence.join(" ")).toContain("service worker");
    expect(mobileSupport?.reviewRoutes).toContain("/offline");
  });

  it("keeps auth, database, proof, mobile, and pilot support blocked before live", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const runbook = getProductionOperationsRunbook(actor);

    expect(
      runbook.items
        .filter((item) => item.status === "blocked_before_live")
        .map((item) => item.key),
    ).toEqual([
      "auth_access_incident",
      "database_rls_incident",
      "proof_storage_moderation",
      "mobile_pwa_support",
      "pilot_communications",
    ]);
  });

  it("hides production operations from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getProductionOperationsRunbook(member).canReadRunbook).toBe(false);
    expect(getProductionOperationsRunbook(committeeMember).canReadRunbook).toBe(false);
    expect(getProductionOperationsRunbook(committeeChair).canReadRunbook).toBe(false);
    expect(getProductionOperationsRunbook(leader).canReadRunbook).toBe(false);
    expect(getProductionOperationsRunbook(coach).canReadRunbook).toBe(false);
    expect(getProductionOperationsRunbook(member).items).toEqual([]);
  });
});
