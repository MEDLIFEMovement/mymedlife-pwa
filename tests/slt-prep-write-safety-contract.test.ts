import { describe, expect, it } from "vitest";

import {
  formatSltPrepWriteSafetyContract,
  getSltPrepWriteSafetyContract,
} from "@/services/slt-prep-write-safety-contract";

describe("slt prep write safety contract", () => {
  it("keeps current SLT prep surfaces in read-only preview mode with no local write path", () => {
    const contract = getSltPrepWriteSafetyContract();

    expect(contract.currentLocalWritePath).toMatchObject({
      exists: false,
    });
    expect(contract.currentPreviewEvidence).toEqual({
      travelerWorkspaceRoute: "/slt-prep",
      staffDashboardRoute: "/slt-prep/staff",
      checklistPacketRoute: "/admin/slt-checklist-write",
      travelerWorkspaceWritesExpected: 0,
      staffDashboardWritesExpected: 0,
      checklistPacketWritesExpected: 0,
      packetStatus: "evidence_observed",
    });
    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
  });

  it("pins blocked future lanes for traveler profile, payments, providers, reminders, and production-proof drift", () => {
    const contract = getSltPrepWriteSafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "traveler_workspace"),
    ).toMatchObject({
      route: "/slt-prep",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "staff_dashboard"),
    ).toMatchObject({
      route: "/slt-prep/staff",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "traveler_profile_updates"),
    ).toMatchObject({
      route: "/slt-prep/profile",
      status: "blocked_pending_future_lane",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "scholarship_and_payments")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Shopify write.",
        "No scholarship approval or denial write.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "meeting_and_notification_delivery")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No reminder email, SMS, or push send.",
        "No n8n workflow execution.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_proof")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Test/Figma/sandbox/SLT mock row counts as production proof.",
        "No localhost checklist packet screenshot counts as rollout evidence.",
      ]),
    );
  });

  it("formats the SLT prep boundary in plain English", () => {
    const output = formatSltPrepWriteSafetyContract();

    expect(output).toContain(
      "SLT Prep data/write safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("exists: no");
    expect(output).toContain("/slt-prep/checklist");
    expect(output).toContain("traveler_checklist_completion");
    expect(output).toContain("Traveler profile and registration updates");
    expect(output).toContain("Forms, Drive, HubSpot, Shopify, Luma, and Zoom sync");
    expect(output).toContain("Meetings, reminders, and traveler notifications");
    expect(output).toContain(
      "No Forms/Drive/HubSpot/Shopify/Luma/Zoom label may be treated as proof that a real provider write path exists.",
    );
  });
});
