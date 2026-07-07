import { afterEach, describe, expect, it, vi } from "vitest";

import * as rolloutControls from "@/services/admin-rollout-controls-registry";
import {
  formatNotificationsAnalyticsReadModelSafetyContract,
  getNotificationsAnalyticsReadModelSafetyContract,
} from "@/services/notifications-analytics-read-model-safety-contract";

describe("notifications/comms + analytics read-model safety contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps notifications and analytics surfaces read-only with no approved execution or reporting-authority path", () => {
    const contract = getNotificationsAnalyticsReadModelSafetyContract();

    expect(contract.currentWritePath).toMatchObject({
      exists: false,
    });
    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
    expect(
      contract.lanes.find((lane) => lane.key === "member_and_leader_readback_context"),
    ).toMatchObject({
      route: "/leader?view=overview",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "admin_outbox_and_contract_review"),
    ).toMatchObject({
      route: "/admin/integration-outbox",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "send_retry_and_dead_letter_mutation"),
    ).toMatchObject({
      status: "blocked_pending_future_lane",
    });
  });

  it("pins provider sync, analytics authority, and rollout-evidence drift as blocked", () => {
    const contract = getNotificationsAnalyticsReadModelSafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "send_retry_and_dead_letter_mutation")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake send execution.",
        "No fake n8n workflow start, resume, or rerun.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "provider_sync_and_identity_side_effects")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake HubSpot, Luma, Hootsuite, n8n, or warehouse sync treated as app truth.",
        "No fake user, invite, membership, proof, or points creation from provider-fed rows.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "analytics_warehouse_and_reporting_truth")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake analytics row becomes operational truth.",
        "No fake warehouse aggregate approves invites, memberships, points, or proof.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_proof_and_rollout_evidence")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Test/Figma/sandbox/mock/provider/read-model row counts as production proof.",
        "No downstream analytics snapshot counts as invite-gate truth.",
      ]),
    );
  });

  it("formats the boundary in plain English for operators", () => {
    const output = formatNotificationsAnalyticsReadModelSafetyContract();

    expect(output).toContain(
      "Notifications/comms + analytics read-model safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("Current write path:");
    expect(output).toContain("exists: false");
    expect(output).toContain("Admin outbox and contract-inspection boundary");
    expect(output).toContain("Analytics, warehouse, and reporting truth boundary");
    expect(output).toContain(
      "Keep analytics/read-model/warehouse reporting separate from operational truth.",
    );
    expect(output).toContain(
      "A downstream-only analytics contract with freshness SLA, batch identity, and bad-batch recovery posture.",
    );
  });

  it("fails closed when a required blocked-default rollout control is missing", () => {
    const originalGetFeatureFlagDefinition = rolloutControls.getFeatureFlagDefinition;
    vi.spyOn(rolloutControls, "getFeatureFlagDefinition").mockImplementation((key) =>
      key === "warehouse_export" ? null : originalGetFeatureFlagDefinition(key),
    );

    expect(() => getNotificationsAnalyticsReadModelSafetyContract()).toThrow(
      "Missing warehouse_export rollout control definition.",
    );
  });
});
