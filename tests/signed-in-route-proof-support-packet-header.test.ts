import { describe, expect, it } from "vitest";
import {
  formatSignedInRouteProofSupportPacketHeader,
  formatSignedInRouteProofOperatorSummary,
} from "@/services/signed-in-route-proof-support-packet-header";
import {
  getSignedInRouteProofSupportPacket,
} from "@/services/signed-in-route-proof-support-packet";
import type { ProductionRolloutBootstrapPacket } from "@/services/production-rollout-bootstrap";

describe("signed-in route proof support packet header", () => {
  it("renders the compact operator-facing preflight summary before the full packet", () => {
    const packet = getSignedInRouteProofSupportPacket(createPacket());
    const header = formatSignedInRouteProofSupportPacketHeader(packet);

    expect(header).toContain("Signed-in route proof support packet");
    expect(header).toContain("Scope:");
    expect(header).toContain("Signed-in proof operator summary:");
    expect(header).toContain("source rows: 4");
    expect(header).toContain("normalized rows: 4");
    expect(header).toContain("accepted workspaces: student_app, leader_command_center, staff_command_center, admin_backend");
    expect(header).toContain("Signed-in proof preflight decision card");
    expect(header).toContain("Mini-packet note:");
    expect(header).toContain("support-only and no-write");
  });

  it("keeps the operator summary focused on row-gap status and next smallest goal", () => {
    const packet = getSignedInRouteProofSupportPacket(createPacket());
    const summary = formatSignedInRouteProofOperatorSummary(packet);

    expect(summary).toContain("missing workspaces: none");
    expect(summary).toContain("unsafe rows: none");
    expect(summary).toContain("next smallest goal:");
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
