import { describe, expect, it } from "vitest";

import {
  buildFigmaSandboxRoleShellRegressionReport,
  formatFigmaSandboxRoleShellRegressionMarkdown,
  getFigmaSandboxRoleShellRegressionValidation,
} from "@/services/figma-sandbox-role-shell-regression";

describe("figma sandbox role shell regression", () => {
  it("summarizes the four core local signed-in shell targets", () => {
    const report = buildFigmaSandboxRoleShellRegressionReport();

    expect(report.notProductionEvidence).toBe(true);
    expect(report.productionProofStatus).toBe("blocked_by_design");
    expect(report.rows.map((row) => row.roleClass)).toEqual([
      "member",
      "leader",
      "staff_support",
      "ds_admin",
    ]);
    expect(report.rows.map((row) => row.expectedRoute)).toEqual([
      "/app",
      "/leader?view=overview",
      "/staff?view=chapters",
      "/admin",
    ]);
  });

  it("keeps the regression output clearly outside production proof and rollout evidence", () => {
    const report = buildFigmaSandboxRoleShellRegressionReport();
    const validation = getFigmaSandboxRoleShellRegressionValidation(report);

    expect(validation.ready).toBe(true);
    expect(
      report.rows.every(
        (row) =>
          row.excludedFromProductionEvidence &&
          row.notProductionProofReason.includes(
            "must not be used as production signed-in proof",
          ),
      ),
    ).toBe(true);
  });

  it("renders a reviewer-friendly local-only markdown summary", () => {
    const markdown = formatFigmaSandboxRoleShellRegressionMarkdown();

    expect(markdown).toContain(
      "# myMEDLIFE Local Sandbox Signed-In Role Shell Regression",
    );
    expect(markdown).toContain("`pnpm figma-seed:regression`");
    expect(markdown).toContain("must not be used as production signed-in proof");
    expect(markdown).toContain("/leader?view=overview");
    expect(markdown).toContain("staff_support");
  });
});
