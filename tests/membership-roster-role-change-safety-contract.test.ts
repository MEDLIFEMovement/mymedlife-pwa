import { describe, expect, it } from "vitest";

import {
  formatMembershipRosterRoleChangeSafetyContract,
  getMembershipRosterRoleChangeSafetyContract,
} from "@/services/membership-roster-role-change-safety-contract";

describe("membership / roster / role-change safety contract", () => {
  it("keeps local role switching and staff/admin preview access out of write authority", () => {
    const contract = getMembershipRosterRoleChangeSafetyContract();

    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
    expect(
      contract.lanes.find((lane) => lane.key === "local_preview_role_switching"),
    ).toMatchObject({
      route: "/login",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "staff_admin_preview_access")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No preview access grants member submit authority.",
        "No preview-only route access authorizes roster mutation.",
      ]),
    );
  });

  it("pins Test/Figma/sandbox roster data and local proof as excluded from rollout evidence", () => {
    const contract = getMembershipRosterRoleChangeSafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "roster_import_evidence_boundary")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Test-prefixed display name enters rollout users CSV.",
        "No figma_seed marker enters rollout users or memberships CSV.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_rollout_evidence")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Test/Figma/sandbox/mock/staging roster row counts as rollout packet evidence.",
        "No local preview role switch counts as signed-in proof.",
        "No live-count, pilot-proof, or owner-packet row is created by this contract.",
      ]),
    );
    expect(contract.globalGuards.join(" ")).toContain(
      "do not count as production rollout packet, signed-in proof, live-count, pilot-proof, or invite-gate evidence",
    );
  });

  it("requires a future audited authority path before live role changes", () => {
    const contract = getMembershipRosterRoleChangeSafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "role_change_audit_intent"),
    ).toMatchObject({
      route: "/admin/users",
      status: "blocked_pending_future_lane",
    });
    expect(contract.requiredFoundations).toEqual(
      expect.arrayContaining([
        "A dedicated audited role-change write path if admins need to grant, revoke, or transfer roles in production.",
        "Privacy review before profile, contact, emergency, traveler, or external-provider identity writes are enabled.",
      ]),
    );
  });

  it("formats a reviewer-friendly readiness report", () => {
    const output = formatMembershipRosterRoleChangeSafetyContract();

    expect(output).toContain(
      "Membership / roster / role-change safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("Local preview role switching and route rehearsal");
    expect(output).toContain("Roster import evidence boundary");
    expect(output).toContain("Profile/contact/emergency/traveler data write boundary");
    expect(output).toContain("does not create production users, invites, owner CSVs");
  });
});
