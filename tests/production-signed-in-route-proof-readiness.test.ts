import { describe, expect, it } from "vitest";
import {
  formatProductionSignedInRouteProofReadinessChecklist,
  getProductionSignedInRouteProofReadinessChecklist,
} from "@/services/production-signed-in-route-proof-readiness";
import type { ProductionRolloutBootstrapPacket } from "@/services/production-rollout-bootstrap";

describe("production signed-in route proof readiness checklist", () => {
  it("stays valid and honest when the packet is still missing", () => {
    const checklist = getProductionSignedInRouteProofReadinessChecklist();

    expect(checklist.validation.ready).toBe(true);
    expect(checklist.packetProvided).toBe(false);
    expect(checklist.requiredClasses).toHaveLength(4);
    expect(checklist.blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining("production-live-data-counts.txt"),
        expect.stringContaining("production rollout packet is still missing"),
      ]),
    );
  });

  it("keeps the four proof classes visible when a real packet shape is present", () => {
    const checklist = getProductionSignedInRouteProofReadinessChecklist(
      createPacket(),
    );

    expect(checklist.packetProvided).toBe(true);
    expect(checklist.gapReport.ready).toBe(true);
    expect(checklist.gapReport.gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "student_app", status: "present" }),
        expect.objectContaining({
          key: "leader_command_center",
          status: "present",
        }),
        expect.objectContaining({
          key: "staff_command_center",
          status: "present",
        }),
        expect.objectContaining({ key: "admin_backend", status: "present" }),
      ]),
    );
  });

  it("formats a checklist with the import/check sequence and blocked evidence wording", () => {
    const formatted = formatProductionSignedInRouteProofReadinessChecklist(
      getProductionSignedInRouteProofReadinessChecklist(),
    );

    expect(formatted).toContain(
      "Production signed-in route proof readiness: READ-ONLY OPERATOR CHECKLIST",
    );
    expect(formatted).toContain("Required production proof classes:");
    expect(formatted).toContain("pnpm rollout:signed-in-proof-import");
    expect(formatted).toContain("pnpm production:signed-in-route-proof --packet production-rollout-packet.json");
    expect(formatted).toContain("preview-cookie sessions");
    expect(formatted).toContain("fake screenshots or copied sandbox artifacts");
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
    memberships: [
      {
        email: "member@medlifemovement.org",
        chapterId: "chapter-ucla",
        roleKey: "general_member",
        status: "approved",
      },
      {
        email: "leader@medlifemovement.org",
        chapterId: "chapter-ucla",
        roleKey: "president_vp",
        status: "approved",
      },
    ],
    staffRoles: [
      {
        email: "coach@medlifemovement.org",
        roleKey: "coach",
        status: "active",
      },
      {
        email: "ds@medlifemovement.org",
        roleKey: "ds_admin",
        status: "active",
      },
    ],
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
