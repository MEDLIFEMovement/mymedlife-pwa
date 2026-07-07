import { afterEach, describe, expect, it, vi } from "vitest";

import * as rolloutControls from "@/services/admin-rollout-controls-registry";
import {
  formatMembershipRosterRoleChangeSafetyContract,
  getMembershipRosterRoleChangeSafetyContract,
} from "@/services/membership-roster-role-change-safety-contract";

describe("membership / roster / role-change safety contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps roster truth, approvals, role changes, and production proof boundaries fail-closed", () => {
    const contract = getMembershipRosterRoleChangeSafetyContract();

    expect(contract.currentWritePath).toMatchObject({
      exists: false,
    });
    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
    expect(contract.lanes.map((lane) => lane.key)).toEqual([
      "roster_truth_and_preview_boundary",
      "chapter_membership_approval_authority",
      "role_change_and_escalation_authority",
      "staff_admin_preview_access_boundary",
      "welcome_contact_and_crm_side_effects",
      "derived_assignment_points_proof_authority",
      "production_proof_and_rollout_evidence",
    ]);
    expect(
      contract.lanes.find((lane) => lane.key === "roster_truth_and_preview_boundary"),
    ).toMatchObject({
      route: "/chapter/members",
      status: "read_only_preview",
      requiredFlags: ["membership_approval_write"],
    });
    expect(
      contract.lanes.find((lane) => lane.key === "role_change_and_escalation_authority"),
    ).toMatchObject({
      route: "/chapter/members",
      status: "blocked_pending_future_lane",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "production_proof_and_rollout_evidence"),
    ).toMatchObject({
      route: "/admin/launch-gate",
      status: "blocked_pending_future_lane",
    });
  });

  it("pins preview role switching, CRM side effects, and rollout evidence drift as blocked", () => {
    const contract = getMembershipRosterRoleChangeSafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "staff_admin_preview_access_boundary")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake DS/admin role proof from preview access to member or leader shells.",
        "No hidden membership, role, or coach assignment write from read-only inspection routes.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "welcome_contact_and_crm_side_effects")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake welcome email or reminder send.",
        "No fake HubSpot/contact sync.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_proof_and_rollout_evidence")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No preview-cookie or local role-switching artifact counts as rollout packet evidence or live counts.",
        "No local preview role switching counts as final rollout approval.",
      ]),
    );
  });

  it("formats the contract in plain English for operators", () => {
    const output = formatMembershipRosterRoleChangeSafetyContract();

    expect(output).toContain(
      "Membership / roster / role-change safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("Current write path:");
    expect(output).toContain("exists: false");
    expect(output).toContain("Roster truth versus preview, static, and Test-only rosters");
    expect(output).toContain("Role changes, promotions, demotions, and committee/leader derivation");
    expect(output).toContain("Production signed-in proof, live counts, pilot proof, and invite-gate boundary");
    expect(output).toContain(
      "Local preview role switching stays rehearsal-only and must not count as production signed-in role proof.",
    );
    expect(output).toContain(
      "A dedicated membership and role-change server boundary with approved actor authority and rollback ownership.",
    );
  });

  it("fails closed when the membership approval rollout control is missing", () => {
    const originalGetFeatureFlagDefinition = rolloutControls.getFeatureFlagDefinition;
    vi.spyOn(rolloutControls, "getFeatureFlagDefinition").mockImplementation((key) =>
      key === "membership_approval_write"
        ? null
        : originalGetFeatureFlagDefinition(key),
    );

    expect(() => getMembershipRosterRoleChangeSafetyContract()).toThrow(
      "Missing membership_approval_write rollout control definition.",
    );
  });

  it("fails closed when the membership approval rollout control drifts from disabled defaults", () => {
    const originalGetFeatureFlagDefinition = rolloutControls.getFeatureFlagDefinition;
    vi.spyOn(rolloutControls, "getFeatureFlagDefinition").mockImplementation((key) => {
      const definition = originalGetFeatureFlagDefinition(key);

      if (key !== "membership_approval_write" || !definition) {
        return definition;
      }

      return {
        ...definition,
        approvalPolicy: "production_blocked",
        defaultEnabledByEnvironment: {
          local: true,
          staging: false,
          production: false,
        },
      };
    });

    expect(() => getMembershipRosterRoleChangeSafetyContract()).toThrow(
      "membership_approval_write rollout control drifted away from the expected disabled-by-default posture.",
    );
  });
});
