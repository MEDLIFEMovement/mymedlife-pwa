import { afterEach, describe, expect, it, vi } from "vitest";

import * as rolloutControls from "@/services/admin-rollout-controls-registry";
import {
  formatMemberProfilePrivacySafetyContract,
  getMemberProfilePrivacySafetyContract,
} from "@/services/member-profile-privacy-safety-contract";

describe("member profile / privacy safety contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the profile surface read-only and acknowledges there is no general profile write path", () => {
    const contract = getMemberProfilePrivacySafetyContract();

    expect(contract.currentWritePath).toMatchObject({
      exists: false,
    });
    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
    expect(
      contract.lanes.find((lane) => lane.key === "profile_identity_scope"),
    ).toMatchObject({
      route: "/profile",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "personal_contact_and_preferences"),
    ).toMatchObject({
      status: "blocked_pending_future_lane",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "chapter_membership_and_role_scope"),
    ).toMatchObject({
      status: "read_only_preview",
    });
  });

  it("pins traveler, proof, HubSpot, and production-proof drift as blocked", () => {
    const contract = getMemberProfilePrivacySafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "emergency_and_traveler_details")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake emergency-contact save.",
        "No fake staff approval or provider handoff from traveler identity copy.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "proof_identity_and_private_source")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake raw-media export or publish.",
        "No fake production proof from internal-learning status alone.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "hubspot_contact_sync")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake HubSpot contact sync.",
        "No fake external identity proof from disabled outbox rows.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_proof_and_rollout_evidence")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Test/Figma/sandbox/mock profile row counts as production signed-in proof.",
        "No local profile or story artifact counts as invite-gate truth.",
      ]),
    );
  });

  it("formats the profile boundary in plain English for operators", () => {
    const output = formatMemberProfilePrivacySafetyContract();

    expect(output).toContain(
      "Member profile / privacy safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("Current write path:");
    expect(output).toContain("exists: false");
    expect(output).toContain("Profile identity, session source, and role scope");
    expect(output).toContain("Emergency contact and traveler-detail boundary");
    expect(output).toContain("HubSpot/contact sync and external identity propagation");
    expect(output).toContain(
      "Missing-profile signed-in sessions are setup-only identity states, not proof of a real launch-ready profile record.",
    );
    expect(output).toContain(
      "A real profile schema and audited server-side write path exist.",
    );
  });

  it("fails closed when the HubSpot rollout control is missing", () => {
    const originalGetFeatureFlagDefinition = rolloutControls.getFeatureFlagDefinition;
    vi.spyOn(rolloutControls, "getFeatureFlagDefinition").mockImplementation((key) =>
      key === "hubspot_write" ? null : originalGetFeatureFlagDefinition(key),
    );

    expect(() => getMemberProfilePrivacySafetyContract()).toThrow(
      "Missing hubspot_write rollout control definition.",
    );
  });
});
