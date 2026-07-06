import { describe, expect, it } from "vitest";
import {
  buildLocalVsProductionRoleProofSeparationReport,
  formatLocalVsProductionRoleProofSeparationMarkdown,
} from "@/services/local-vs-production-role-proof-separation";
import type { ProductionRolloutBootstrapPacket } from "@/services/production-rollout-bootstrap";

describe("local vs production role proof separation", () => {
  it("keeps sandbox QA green while leaving production proof open when no packet is provided", () => {
    const report = buildLocalVsProductionRoleProofSeparationReport();

    expect(report.validation.ready).toBe(true);
    expect(report.localSandboxQa.status).toBe("ready");
    expect(report.productionSignedInProof.status).toBe("packet_missing");
    expect(report.productionSignedInProof.gapReport.gaps).toHaveLength(4);
    expect(report.rolloutBlockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining("signed-in-route-proof.csv"),
        expect.stringContaining("Production rollout packet was not provided"),
      ]),
    );
  });

  it("shows production proof classes as present only when real packet evidence exists", () => {
    const report = buildLocalVsProductionRoleProofSeparationReport(createPacket());

    expect(report.productionSignedInProof.status).toBe("ready");
    expect(report.productionSignedInProof.gapReport.ready).toBe(true);
    expect(report.productionSignedInProof.gapReport.gaps).toEqual(
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

  it("formats a plain-English separation report with hard copy boundaries", () => {
    const markdown = formatLocalVsProductionRoleProofSeparationMarkdown(
      buildLocalVsProductionRoleProofSeparationReport(),
    );

    expect(markdown).toContain("# myMEDLIFE Local vs Production Role Proof Separation");
    expect(markdown).toContain("Local sandbox role QA");
    expect(markdown).toContain("Production signed-in proof");
    expect(markdown).toContain("Do not copy local sandbox proof rows, screenshots, Markdown, or JSON into signed-in-route-proof.csv.");
    expect(markdown).toContain("useful for sandbox rehearsal only");
    expect(markdown).toContain("MISSING PACKET / PROOF ROWS");
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
