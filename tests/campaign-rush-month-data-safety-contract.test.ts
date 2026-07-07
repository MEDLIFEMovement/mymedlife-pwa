import { afterEach, describe, expect, it, vi } from "vitest";

import * as rolloutControls from "@/services/admin-rollout-controls-registry";
import {
  formatCampaignRushMonthDataSafetyContract,
  getCampaignRushMonthDataSafetyContract,
} from "@/services/campaign-rush-month-data-safety-contract";

describe("campaigns / Rush Month data safety contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps campaign and Rush Month surfaces review-first with no approved campaign write path", () => {
    const contract = getCampaignRushMonthDataSafetyContract();

    expect(contract.currentWritePath).toMatchObject({
      exists: false,
    });
    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
    expect(
      contract.lanes.find((lane) => lane.key === "campaign_template_and_instance_truth"),
    ).toMatchObject({
      route: "/campaigns/rush-month",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "rush_month_event_review"),
    ).toMatchObject({
      route: "/app/events",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "lead_and_qr_contact_capture"),
    ).toMatchObject({
      status: "blocked_pending_future_lane",
    });
  });

  it("pins lead capture, proof, points, provider sync, and rollout evidence as blocked from fake-live drift", () => {
    const contract = getCampaignRushMonthDataSafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "lead_and_qr_contact_capture")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake QR/contact persistence.",
        "No fake HubSpot handoff.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "points_and_leaderboard_credit")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake points awards from campaign review copy.",
        "No browser-only points mutation from chapter event or assignment previews.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "provider_sync_and_funnel_exports")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake HubSpot, Luma, Hootsuite, n8n, or warehouse send.",
        "No fake reminder delivery.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_rollout_evidence")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Test/Figma/sandbox/mock campaign row counts as rollout evidence.",
        "No local rehearsal artifact counts as production signed-in role proof.",
      ]),
    );
  });

  it("formats the campaign boundary in plain English for operators", () => {
    const output = formatCampaignRushMonthDataSafetyContract();

    expect(output).toContain(
      "Campaigns / Rush Month data safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("Current write path:");
    expect(output).toContain("exists: false");
    expect(output).toContain("Campaign template and live-instance boundary");
    expect(output).toContain("Lead capture, QR scans, and contact intake");
    expect(output).toContain("Provider sync, reminders, and funnel exports");
    expect(output).toContain(
      "Preview-cookie, localhost, local sandbox, Test/Figma, SOP/sample, staging, and mock campaign rows do not count as production campaign proof, rollout evidence, or invite-gate truth.",
    );
    expect(output).toContain(
      "A campaign template and instance schema with explicit chapter ownership, audit rows, and rollback posture.",
    );
  });

  it("fails closed when a required external-write rollout control is missing", () => {
    const originalGetFeatureFlagDefinition = rolloutControls.getFeatureFlagDefinition;
    vi.spyOn(rolloutControls, "getFeatureFlagDefinition").mockImplementation((key) =>
      key === "hubspot_write" ? null : originalGetFeatureFlagDefinition(key),
    );

    expect(() => getCampaignRushMonthDataSafetyContract()).toThrow(
      "Missing hubspot_write rollout control definition.",
    );
  });
});
