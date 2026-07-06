import { describe, expect, it } from "vitest";
import {
  formatRoleAccessInvariantsReport,
  getRoleAccessInvariantsReport,
} from "@/services/role-access-invariants";

describe("role access invariants", () => {
  it("keeps the four production proof classes aligned to their routes", () => {
    const report = getRoleAccessInvariantsReport();

    expect(report.validation.ready).toBe(true);
    expect(report.productionProofRequirements.map((item) => item.expectedPath)).toEqual([
      "/app",
      "/leader?view=overview",
      "/staff?view=chapters",
      "/admin",
    ]);
  });

  it("keeps members, leaders, staff, and ds admins inside the expected access boundaries", () => {
    const report = getRoleAccessInvariantsReport();
    const member = report.cases.find((item) => item.key === "member_only");
    const leader = report.cases.find((item) => item.key === "leader_only");
    const staff = report.cases.find((item) => item.key === "staff_support_only");
    const dsAdmin = report.cases.find((item) => item.key === "ds_admin_only");

    expect(member).toMatchObject({
      defaultWorkspace: "student_app",
      ownerWorkspaces: ["student_app"],
    });
    expect(leader).toMatchObject({
      defaultWorkspace: "leader_command_center",
      ownerWorkspaces: ["student_app", "leader_command_center"],
    });
    expect(staff).toMatchObject({
      defaultWorkspace: "staff_command_center",
      ownerWorkspaces: ["staff_command_center"],
      previewWorkspaces: ["student_app", "leader_command_center"],
      previewWritesBlocked: true,
    });
    expect(dsAdmin).toMatchObject({
      defaultWorkspace: "admin_backend",
      ownerWorkspaces: ["admin_backend"],
      previewWorkspaces: ["student_app", "leader_command_center"],
      previewWritesBlocked: true,
    });
  });

  it("spells out mixed-role defaults without turning them into proof substitutes", () => {
    const report = getRoleAccessInvariantsReport();
    const leaderPlusStaff = report.cases.find(
      (item) => item.key === "leader_plus_staff",
    );
    const coachPlusAdmin = report.cases.find(
      (item) => item.key === "coach_plus_ds_admin",
    );

    expect(leaderPlusStaff).toMatchObject({
      defaultWorkspace: "staff_command_center",
      ownerWorkspaces: [
        "student_app",
        "leader_command_center",
        "staff_command_center",
      ],
    });
    expect(coachPlusAdmin).toMatchObject({
      defaultWorkspace: "admin_backend",
      ownerWorkspaces: ["staff_command_center", "admin_backend"],
      previewWorkspaces: ["student_app", "leader_command_center"],
    });
  });

  it("formats a concise read-only invariant map", () => {
    const formatted = formatRoleAccessInvariantsReport();

    expect(formatted).toContain("Role access invariants: READ-ONLY readiness report");
    expect(formatted).toContain("General member");
    expect(formatted).toContain("Student leader");
    expect(formatted).toContain("Staff/support coach");
    expect(formatted).toContain("DS admin");
    expect(formatted).toContain("Leader plus coach assignment");
    expect(formatted).toContain("Coach plus DS/admin assignment");
  });
});
