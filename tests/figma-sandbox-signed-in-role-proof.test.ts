import { describe, expect, it } from "vitest";

import {
  buildFigmaSandboxSignedInRoleProofReport,
  formatFigmaSandboxSignedInRoleProofMarkdown,
  getFigmaSandboxSignedInRoleProofValidation,
} from "@/services/figma-sandbox-signed-in-role-proof";

describe("figma sandbox signed-in role proof", () => {
  it("proves member, leader, staff, and admin default routes from the figma seed logins", () => {
    const report = buildFigmaSandboxSignedInRoleProofReport();

    expect(report.summary.defaultRouteShellsPassed).toBe(4);
    expect(report.summary.defaultRouteShellsRequired).toBe(4);
    expect(
      report.rows.filter((row) => row.shell === "member_app").map((row) => row.derivedDefaultRoute),
    ).toEqual(["/app"]);
    expect(
      report.rows
        .filter((row) => row.shell === "leader_command_center")
        .map((row) => row.derivedDefaultRoute),
    ).toEqual(["/leader?view=overview"]);
    expect(
      report.rows
        .filter((row) => row.shell === "staff_command_center")
        .every((row) => row.derivedDefaultRoute === "/staff?view=chapters"),
    ).toBe(true);
    expect(
      report.rows
        .filter((row) => row.shell === "admin_backend")
        .every((row) => row.derivedDefaultRoute === "/admin"),
    ).toBe(true);
  });

  it("keeps SLT Prep as a sandbox review alias instead of signed-in default route proof", () => {
    const report = buildFigmaSandboxSignedInRoleProofReport();
    const sltRows = report.rows.filter((row) => row.shell === "slt_prep");

    expect(sltRows).toHaveLength(1);
    expect(sltRows[0]).toMatchObject({
      expectedRoute: "/app/slt-prep",
      derivedDefaultRoute: "/app",
      proofMode: "sandbox_review_alias",
      passed: true,
    });
    expect(sltRows[0]?.note).toContain("must not count as production signed-in route proof");
  });

  it("marks every sandbox proof row as excluded from production rollout evidence", () => {
    const report = buildFigmaSandboxSignedInRoleProofReport();
    const validation = getFigmaSandboxSignedInRoleProofValidation(report);

    expect(validation.ready).toBe(true);
    expect(
      report.rows.every(
        (row) =>
          row.excludedFromProductionEvidence &&
          row.exclusionReason.includes("must stay out of production rollout evidence"),
      ),
    ).toBe(true);
  });

  it("renders a reviewer-friendly markdown report", () => {
    const markdown = formatFigmaSandboxSignedInRoleProofMarkdown();

    expect(markdown).toContain("# myMEDLIFE Figma Sandbox Signed-In Role Proof");
    expect(markdown).toContain("`route_logic_validation_only`");
    expect(markdown).toContain("Member app");
    expect(markdown).toContain("/leader?view=overview");
    expect(markdown).toContain("Sandbox review alias only.");
  });
});
