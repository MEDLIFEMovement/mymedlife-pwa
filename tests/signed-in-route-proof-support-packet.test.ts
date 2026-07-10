import { describe, expect, it } from "vitest";
import {
  formatSignedInRouteProofOperatorMiniPacket,
} from "@/services/signed-in-route-proof-operator-mini-packet";
import {
  formatSignedInRouteProofPreflightCard,
} from "@/services/signed-in-route-proof-preflight-card";
import {
  formatSignedInRouteProofSupportPacketHeader,
  formatSignedInRouteProofOperatorSummary,
} from "@/services/signed-in-route-proof-support-packet-header";
import {
  formatSignedInRouteProofSupportPacket,
  getSignedInRouteProofSupportPacket,
} from "@/services/signed-in-route-proof-support-packet";
import type { ProductionRolloutBootstrapPacket } from "@/services/production-rollout-bootstrap";

describe("signed-in route proof support packet", () => {
  it("round-trips the signed-in proof source CSV through the importer and readiness checklist", () => {
    const packet = getSignedInRouteProofSupportPacket(createPacket());

    expect(packet.canReadPacket).toBe(true);
    expect(packet.localOnly).toBe(true);
    expect(packet.rowGapSnapshot.acceptedWorkspaces).toEqual([
      "student_app",
      "leader_command_center",
      "staff_command_center",
      "admin_backend",
    ]);
    expect(packet.importResult.counts).toEqual({
      proofRows: 4,
      passedRows: 4,
      workspaces: 4,
    });
    expect(packet.readinessChecklist.validation.ready).toBe(false);
    expect(packet.readinessChecklist.requiredClasses.map((item) => item.key)).toEqual([
      "student_app",
      "leader_command_center",
      "staff_command_center",
      "admin_backend",
    ]);
    expect(packet.noGoRules).toContain("No live provider calls.");
    expect(formatSignedInRouteProofSupportPacket(packet)).toContain(
      "Signed-in route proof support packet: READY",
    );
    expect(formatSignedInRouteProofSupportPacket(packet)).toContain(
      "Row-gap snapshot:",
    );
    expect(formatSignedInRouteProofOperatorSummary(packet)).toContain(
      "Signed-in proof operator summary:",
    );
    expect(formatSignedInRouteProofSupportPacketHeader(packet)).toContain(
      "Signed-in route proof support packet",
    );
    expect(formatSignedInRouteProofOperatorMiniPacket(packet.operatorMiniPacket)).toContain(
      "Signed-in proof operator mini-packet",
    );
    expect(formatSignedInRouteProofOperatorMiniPacket(packet.operatorMiniPacket)).toContain(
      "Next artifact request:",
    );
    expect(formatSignedInRouteProofPreflightCard(packet.preflightCard)).toContain(
      "Signed-in proof preflight decision card",
    );
    expect(formatSignedInRouteProofPreflightCard(packet.preflightCard)).toContain(
      "What counts later:",
    );
  });

  it("stays blocked when the packet lacks the live-count blocker and production packet context", () => {
    const packet = getSignedInRouteProofSupportPacket(createPacket());

    expect(packet.readinessChecklist.blockers).toContain(
      "production-live-data-counts.txt is still required separately before final invite-gate review.",
    );
    expect(packet.rowGapSnapshot.missingWorkspaces).toEqual([]);
    expect(packet.nextSmallestGoal).toBe(
      "Keep the signed-in proof checklist parked until live counts and the approved rollout packet exist.",
    );
    expect(formatSignedInRouteProofOperatorSummary(packet)).toContain(
      "unsafe rows: none",
    );
    expect(packet.preflightCard.nextStep).toContain(
      "live counts",
    );
    expect(formatSignedInRouteProofSupportPacketHeader(packet)).toContain(
      "Mini-packet note:",
    );
  });
});

function createPacket(): ProductionRolloutBootstrapPacket {
  return {
    chapters: [{ id: "chapter-ucla", name: "UCLA MEDLIFE", campus: "UCLA" }],
    users: [
      { email: "member@medlifemovement.org", displayName: "Launch Member" },
      { email: "leader@medlifemovement.org", displayName: "Launch Leader" },
      { email: "coach@medlifemovement.org", displayName: "Launch Coach" },
      { email: "ds@medlifemovement.org", displayName: "Launch DS" },
    ],
    memberships: [],
    staffRoles: [],
    coachAssignments: [],
    campaigns: [],
    launchOwners: [
      {
        email: "coach@medlifemovement.org",
        ownerType: "support",
        displayName: "Launch Coach",
        status: "active",
      },
      {
        email: "ds@medlifemovement.org",
        ownerType: "rollback",
        displayName: "Launch DS",
        status: "active",
      },
      {
        email: "ds@medlifemovement.org",
        ownerType: "production_apply",
        displayName: "Launch DS",
        status: "active",
      },
    ],
    signedInRouteProof: [
      {
        email: "member@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
        checkedAt: "2026-07-06T12:00:00Z",
      },
      {
        email: "leader@medlifemovement.org",
        workspace: "leader_command_center",
        expectedPath: "/leader?view=overview",
        observedPath: "/leader?view=overview",
        status: "passed",
        checkedAt: "2026-07-06T12:01:00Z",
      },
      {
        email: "coach@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-06T12:02:00Z",
      },
      {
        email: "ds@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
        checkedAt: "2026-07-06T12:03:00Z",
      },
    ],
  };
}
