import { describe, expect, it } from "vitest";
import { getAdminIntegrationOutboxWorkspace } from "@/services/admin-integration-outbox-workspace";
import type { AdminHubSpotSyncWorkspace } from "@/services/admin-hubspot-sync-workspace";
import type { AdminLumaSyncWorkspace } from "@/services/admin-luma-sync-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import type {
  AuditLogRow,
  AutomationOutboxRow,
  IntegrationEventRow,
} from "@/shared/types/persistence";

const data = getMockReadOnlyAppData(
  "Testing admin integration outbox workspace.",
);

describe("admin integration outbox workspace", () => {
  it("gives Admin a focused read-only integration and outbox review", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminIntegrationOutboxWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.canReadAuditRows).toBe(true);
    expect(workspace.title).toBe("Admin integration and outbox review");
    expect(workspace.nextStep.href).toBe("/admin/write-sequence");
    expect(workspace.counts).toEqual({
      structuredEvents: data.integrationEvents.length,
      visibleOutboxRows: data.outboxItems.length,
      rawIntegrationEventRows: 5,
      rawAutomationOutboxRows: 5,
      visibleAuditRows: 5,
      hiddenAuditRows: 0,
      liveSendRows: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    });
    expect(workspace.integrationEvents.map((event) => event.eventType)).toContain(
      "action_assigned",
    );
    expect(workspace.outboxItems.map((item) => item.destination)).toEqual(
      expect.arrayContaining(["n8n", "Luma", "HubSpot", "warehouse"]),
    );
    expect(workspace.contractReview.counts).toEqual({
      total: 4,
      ready: 4,
      watch: 0,
      blocked: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
    });
    expect(workspace.contractReview.items.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "Luma event sync contract",
        "HubSpot upstream CRM sync contract",
        "Databricks and Power BI export contract",
        "AI recommendation contract",
      ]),
    );
    expect(workspace.blockedControls).toEqual(
      expect.arrayContaining(["approve live sends", "run AI summaries"]),
    );
    expect(workspace.liveSendPreflight.title).toBe(
      "Live-send preflight checklist",
    );
    expect(workspace.liveSendPreflight.counts).toEqual({
      total: 5,
      ready: 5,
      watch: 0,
      blocked: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    });
  });

  it("uses live provider readback instead of stale mock-row status", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getAdminIntegrationOutboxWorkspace(actor, data, {
      providerReadback: {
        luma: {
          canRead: true,
          config: { enabled: true },
          lastRun: { status: "completed" },
          counts: {
            calendars: 1,
            importedEvents: 67,
            materializedEvents: 67,
            conflicts: 0,
            openFailures: 0,
          },
        } as AdminLumaSyncWorkspace,
        hubspot: {
          canRead: true,
          config: { enabled: true },
          lastRun: { status: "completed" },
          counts: {
            companies: 8,
            contacts: 116,
            memberships: 116,
            pendingCompanies: 0,
            pendingContacts: 0,
            pendingMemberships: 0,
            materializedMemberships: 116,
            ignoredMemberships: 0,
            openFailures: 0,
          },
        } as AdminHubSpotSyncWorkspace,
      },
    });

    expect(workspace.contractReview.title).toBe(
      "Integration contracts and live readback",
    );
    expect(workspace.contractReview.summary).toContain(
      "HubSpot are upstream sources",
    );

    const luma = workspace.contractReview.items.find(
      (item) => item.key === "luma",
    );
    expect(luma?.status).toBe("ready");
    expect(luma?.currentPosture).toContain("67 provider event(s) imported");
    expect(luma?.currentPosture).toContain("provider writes remain disabled");
    expect(luma?.sourceOfTruth).toContain("upstream event provider");
    expect(luma?.routeEvidence).toContain("/admin/integrations/luma");

    const hubspot = workspace.contractReview.items.find(
      (item) => item.key === "hubspot",
    );
    expect(hubspot?.status).toBe("ready");
    expect(hubspot?.currentPosture).toContain("116 contact record(s)");
    expect(hubspot?.sourceOfTruth).toContain("upstream CRM");
    expect(hubspot?.routeEvidence).toContain("/admin/integrations/hubspot");
  });

  it("builds a live-send preflight checklist before any external automation", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminIntegrationOutboxWorkspace(actor, data);

    expect(workspace.liveSendPreflight.items.map((item) => item.key)).toEqual([
      "source_event",
      "payload_and_idempotency",
      "audit_readback",
      "destination_policy",
      "secrets_boundary",
    ]);
    expect(
      workspace.liveSendPreflight.items.find((item) => item.key === "source_event")
        ?.status,
    ).toBe("ready");
    expect(
      workspace.liveSendPreflight.items.find(
        (item) => item.key === "payload_and_idempotency",
      )?.status,
    ).toBe("ready");
    expect(
      workspace.liveSendPreflight.items.find(
        (item) => item.key === "audit_readback",
      )?.currentPosture,
    ).toContain("5 audit row");
    expect(workspace.liveSendPreflight.blockedControls).toEqual(
      expect.arrayContaining([
        "approve live sends",
        "retry failed sends",
        "show integration secrets",
        "start external workers",
      ]),
    );
    expect(
      workspace.liveSendPreflight.items.every(
        (item) =>
          item.browserWritesExpected === 0 && item.externalWritesExpected === 0,
      ),
    ).toBe(true);
  });

  it("keeps DS Admin focused on outbox safety while hiding audit row details", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getAdminIntegrationOutboxWorkspace(actor, {
      ...data,
      auditLogs: [auditLog()],
    });

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.canReadAuditRows).toBe(false);
    expect(workspace.title).toBe("DS Admin integration safety review");
    expect(workspace.nextStep.href).toBe("/admin");
    expect(workspace.counts.visibleAuditRows).toBe(0);
    expect(workspace.counts.hiddenAuditRows).toBe(1);
    expect(workspace.auditRows).toEqual([]);
    expect(workspace.safetyNotes.join(" ")).toContain(
      "without row-level audit details",
    );
    expect(workspace.contractReview.items).toHaveLength(4);
    expect(
      workspace.liveSendPreflight.items.find(
        (item) => item.key === "audit_readback",
      )?.currentPosture,
    ).toBe("1 audit row(s) hidden from this role by design.");
  });

  it("hides integration and outbox review from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getAdminIntegrationOutboxWorkspace(member, data).canReadWorkspace).toBe(
      false,
    );
    expect(getAdminIntegrationOutboxWorkspace(leader, data).canReadWorkspace).toBe(
      false,
    );
    expect(getAdminIntegrationOutboxWorkspace(coach, data).canReadWorkspace).toBe(
      false,
    );
  });

  it("surfaces local readback rows without enabling live external sends", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getAdminIntegrationOutboxWorkspace(actor, {
      ...data,
      integrationEventRows: [integrationEventRow()],
      automationOutboxRows: [automationOutboxRow()],
      auditLogs: [auditLog()],
    });

    expect(workspace.title).toBe("Full integration and outbox review");
    expect(workspace.counts.rawIntegrationEventRows).toBe(1);
    expect(workspace.counts.rawAutomationOutboxRows).toBe(1);
    expect(workspace.counts.visibleAuditRows).toBe(1);
    expect(workspace.counts.liveSendRows).toBe(0);
    expect(workspace.counts.externalWritesEnabled).toBe(0);
    expect(workspace.readbackRows).toHaveLength(2);
    expect(
      workspace.destinationSummaries.find((item) => item.destination === "n8n")
        ?.posture,
    ).toBe("mock_safe");
    expect(
      workspace.contractReview.items.find((item) => item.key === "warehouse_power_bi")
        ?.status,
    ).toBe("ready");
    expect(
      workspace.liveSendPreflight.items.find(
        (item) => item.key === "payload_and_idempotency",
      )?.status,
    ).toBe("ready");
  });

  it("blocks preflight approval when local rows look live-send related", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getAdminIntegrationOutboxWorkspace(actor, {
      ...data,
      integrationEventRows: [
        {
          ...integrationEventRow(),
          destination: "hubspot",
          status: "approved_for_live_send",
        },
      ],
    });

    expect(workspace.counts.liveSendRows).toBe(1);
    expect(
      workspace.liveSendPreflight.items.find(
        (item) => item.key === "destination_policy",
      )?.status,
    ).toBe("blocked");
    expect(
      workspace.contractReview.items.find((item) => item.key === "hubspot")
        ?.status,
    ).toBe("blocked");
    expect(workspace.liveSendPreflight.counts.blocked).toBe(1);
  });
});

function integrationEventRow(): IntegrationEventRow {
  return {
    id: "integration-event-1",
    source_event_id: "event-1",
    chapter_id: "chapter-northview",
    event_type: "proof_submitted",
    destination: "n8n",
    external_object_type: null,
    external_object_id: null,
    status: "disabled",
    payload: { proof: "metadata" },
    created_by: "admin-user",
    created_at: "2026-06-17T00:00:00.000Z",
    updated_at: "2026-06-17T00:00:00.000Z",
  };
}

function automationOutboxRow(): AutomationOutboxRow {
  return {
    id: "automation-outbox-1",
    source_event_id: "event-1",
    integration_event_id: "integration-event-1",
    chapter_id: "chapter-northview",
    destination: "n8n",
    event_type: "proof_submitted",
    payload: { proof: "metadata" },
    idempotency_key: "proof-submitted-1",
    status: "disabled",
    attempt_count: 0,
    available_at: "2026-06-17T00:00:00.000Z",
    locked_at: null,
    sent_at: null,
    last_error: null,
    created_at: "2026-06-17T00:00:00.000Z",
    updated_at: "2026-06-17T00:00:00.000Z",
  };
}

function auditLog(): AuditLogRow {
  return {
    id: "audit-1",
    actor_user_id: "admin-user",
    chapter_id: "chapter-northview",
    action: "integration_event_recorded",
    target_table: "integration_events",
    target_id: "integration-event-1",
    before_value: null,
    after_value: { status: "disabled" },
    reason: "Testing integration readback.",
    created_at: "2026-06-17T00:00:00.000Z",
  };
}
