import { describe, expect, it } from "vitest";

import {
  buildFigmaSandboxRoleQaBundleReport,
  formatFigmaSandboxRoleQaBundleMarkdown,
  getFigmaSandboxRoleQaBundleValidation,
} from "@/services/figma-sandbox-role-qa-bundle";

describe("figma sandbox role qa bundle", () => {
  it("combines proof, exercise, drift, and regression into one local-only bundle", () => {
    const report = buildFigmaSandboxRoleQaBundleReport();

    expect(report.notProductionEvidence).toBe(true);
    expect(report.productionProofStatus).toBe("blocked_by_design");
    expect(report.proof.summary.defaultRouteShellsPassed).toBe(4);
    expect(report.regression.expectedRoutes).toEqual([
      "/app",
      "/leader?view=overview",
      "/staff?view=chapters",
      "/admin",
    ]);
  });

  it("fails closed if the underlying validations drift", () => {
    const report = buildFigmaSandboxRoleQaBundleReport();
    const validation = getFigmaSandboxRoleQaBundleValidation(report);

    expect(validation.ready).toBe(true);
    expect(
      validation.checks.find((check) => check.key === "boundary_language_safe")
        ?.passed,
    ).toBe(true);
  });

  it("renders a non-technical markdown summary with explicit local-only boundaries", () => {
    const markdown = formatFigmaSandboxRoleQaBundleMarkdown();

    expect(markdown).toContain("# myMEDLIFE Local Sandbox Role QA Bundle");
    expect(markdown).toContain("excluded from production signed-in proof");
    expect(markdown).toContain("excluded from rollout evidence");
    expect(markdown).toContain("excluded from invite-gate proof");
    expect(markdown).toContain("`pnpm figma-seed:qa-bundle`");
  });
});
