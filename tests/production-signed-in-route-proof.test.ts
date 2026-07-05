import { describe, expect, it } from "vitest";
import {
  formatProductionSignedInRouteProofReadiness,
  getProductionSignedInRouteProofReadiness,
} from "@/services/production-signed-in-route-proof";
import type { ProductionRolloutBootstrapPacket } from "@/services/production-rollout-bootstrap";

describe("production signed-in route proof", () => {
  it("passes when one real account reaches each required workspace", () => {
    const readiness = getProductionSignedInRouteProofReadiness(createPacket());

    expect(readiness.ready).toBe(true);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.counts).toEqual({
      proofRows: 4,
      passedProofRows: 4,
    });
    expect(formatProductionSignedInRouteProofReadiness(readiness)).toContain(
      "Production signed-in route proof: READY",
    );
  });

  it("blocks broad invites when signed-in route proof is missing", () => {
    const packet = createPacket();
    packet.signedInRouteProof = [];

    const readiness = getProductionSignedInRouteProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "General member lands in the student app: needs one passed proof row for approved general_member or action_committee_member at /app",
    );
    expect(formatProductionSignedInRouteProofReadiness(readiness)).toContain(
      "Production signed-in route proof: NOT READY",
    );
  });

  it("rejects passed proof rows when the user does not have the claimed role", () => {
    const packet = createPacket();
    packet.signedInRouteProof = [
      {
        email: "leader@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
      },
      ...(packet.signedInRouteProof ?? []).slice(1),
    ];

    const readiness = getProductionSignedInRouteProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "leader@medlifemovement.org student_app needs approved general_member or action_committee_member.",
    );
  });

  it("rejects passed proof rows when observed route does not match the expected workspace route", () => {
    const packet = createPacket();
    packet.signedInRouteProof = [
      {
        email: "member@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/leader?view=overview",
        status: "passed",
      },
      ...(packet.signedInRouteProof ?? []).slice(1),
    ];

    const readiness = getProductionSignedInRouteProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "member@medlifemovement.org student_app observedPath must be /app when status is passed.",
    );
  });
});

function createPacket(): ProductionRolloutBootstrapPacket {
  return {
    chapters: [
      {
        id: "chapter-ucla",
        name: "UCLA MEDLIFE",
        campus: "UCLA",
      },
    ],
    users: [
      { email: "member@medlifemovement.org", displayName: "Launch Member" },
      { email: "leader@medlifemovement.org", displayName: "Launch Leader" },
      { email: "coach@medlifemovement.org", displayName: "Launch Coach" },
      { email: "ds@medlifemovement.org", displayName: "DS Admin" },
    ],
    memberships: [
      {
        email: "member@medlifemovement.org",
        chapterId: "chapter-ucla",
        roleKey: "general_member",
      },
      {
        email: "leader@medlifemovement.org",
        chapterId: "chapter-ucla",
        roleKey: "president_vp",
      },
    ],
    staffRoles: [
      { email: "coach@medlifemovement.org", roleKey: "coach" },
      { email: "ds@medlifemovement.org", roleKey: "ds_admin" },
    ],
    coachAssignments: [
      {
        coachEmail: "coach@medlifemovement.org",
        chapterId: "chapter-ucla",
        coachType: "portfolio",
      },
    ],
    campaigns: [
      {
        chapterId: "chapter-ucla",
        name: "Rush Month",
        slug: "rush-month-ucla",
      },
    ],
    signedInRouteProof: [
      {
        email: "member@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
      },
      {
        email: "leader@medlifemovement.org",
        workspace: "leader_command_center",
        expectedPath: "/leader?view=overview",
        observedPath: "/leader?view=overview",
        status: "passed",
      },
      {
        email: "coach@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
      },
      {
        email: "ds@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
      },
    ],
  };
}
