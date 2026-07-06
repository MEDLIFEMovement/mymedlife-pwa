import {
  buildFigmaSandboxRoleExerciseReport,
  type FigmaSandboxRoleExerciseReport,
} from "./figma-sandbox-role-exercise.ts";
import {
  buildFigmaSandboxRoleShellRegressionReport,
  type FigmaSandboxRoleShellRegressionReport,
} from "./figma-sandbox-role-shell-regression.ts";
import {
  buildFigmaSandboxSignedInRoleProofReport,
  getFigmaSandboxSignedInRoleProofValidation,
  type FigmaSandboxSignedInRoleProofReport,
  type FigmaSandboxSignedInRoleProofValidation,
} from "./figma-sandbox-signed-in-role-proof.ts";

export type FigmaSandboxRoleQaBundleValidation = {
  ready: boolean;
  checks: Array<{
    key: string;
    passed: boolean;
    message: string;
  }>;
};

export type FigmaSandboxRoleQaBundleReport = {
  generatedAt: string;
  seedFamily: FigmaSandboxSignedInRoleProofReport["seedFamily"];
  source: FigmaSandboxSignedInRoleProofReport["source"];
  environment: FigmaSandboxSignedInRoleProofReport["environment"];
  notProductionEvidence: true;
  productionProofStatus: "blocked_by_design";
  commands: {
    buildBundle: string;
    buildSandboxProof: string;
    buildSandboxExercise: string;
    checkSandboxExerciseDrift: string;
    buildSandboxRegression: string;
  };
  proof: {
    summary: FigmaSandboxSignedInRoleProofReport["summary"];
    validation: FigmaSandboxSignedInRoleProofValidation;
  };
  exercise: {
    validation: FigmaSandboxRoleExerciseReport["validation"];
    driftValidation: FigmaSandboxRoleExerciseReport["driftValidation"];
    rowCount: number;
  };
  regression: {
    validation: FigmaSandboxRoleShellRegressionReport["validation"];
    rowCount: number;
    expectedRoutes: string[];
  };
  validation: FigmaSandboxRoleQaBundleValidation;
};

const commands = {
  buildBundle: "pnpm figma-seed:qa-bundle",
  buildSandboxProof: "pnpm figma-seed:proof",
  buildSandboxExercise: "pnpm figma-seed:exercise",
  checkSandboxExerciseDrift: "pnpm figma-seed:exercise:check",
  buildSandboxRegression: "pnpm figma-seed:regression",
} as const;

export function buildFigmaSandboxRoleQaBundleReport(): FigmaSandboxRoleQaBundleReport {
  const proofReport = buildFigmaSandboxSignedInRoleProofReport();
  const proofValidation = getFigmaSandboxSignedInRoleProofValidation(proofReport);
  const exerciseReport = buildFigmaSandboxRoleExerciseReport(undefined, proofReport);
  const regressionReport = buildFigmaSandboxRoleShellRegressionReport();

  const report = {
    generatedAt: proofReport.generatedAt,
    seedFamily: proofReport.seedFamily,
    source: proofReport.source,
    environment: proofReport.environment,
    notProductionEvidence: true,
    productionProofStatus: "blocked_by_design",
    commands,
    proof: {
      summary: proofReport.summary,
      validation: proofValidation,
    },
    exercise: {
      validation: exerciseReport.validation,
      driftValidation: exerciseReport.driftValidation,
      rowCount: exerciseReport.rows.length,
    },
    regression: {
      validation: regressionReport.validation,
      rowCount: regressionReport.rows.length,
      expectedRoutes: regressionReport.rows.map((row) => row.expectedRoute),
    },
    validation: {
      ready: false,
      checks: [],
    },
  } satisfies Omit<FigmaSandboxRoleQaBundleReport, "validation"> & {
    validation: FigmaSandboxRoleQaBundleValidation;
  };

  return {
    ...report,
    validation: getFigmaSandboxRoleQaBundleValidation(report),
  };
}

export function getFigmaSandboxRoleQaBundleValidation(
  report = buildFigmaSandboxRoleQaBundleReport(),
): FigmaSandboxRoleQaBundleValidation {
  const checks = [
    {
      key: "local_only_bundle",
      passed:
        report.notProductionEvidence === true &&
        report.productionProofStatus === "blocked_by_design" &&
        report.seedFamily === "figma_seed_v1" &&
        report.source === "figma_seed" &&
        report.environment === "sandbox",
      message:
        "QA bundle is marked as local/sandbox/Test-only output that is blocked from production proof by design.",
    },
    {
      key: "proof_validation_ready",
      passed: report.proof.validation.ready,
      message:
        "Sandbox signed-in role proof passes for member, leader, staff/support, and DS/admin.",
    },
    {
      key: "exercise_validation_ready",
      passed:
        report.exercise.validation.ready && report.exercise.driftValidation.ready,
      message:
        "Sandbox role exercise and route drift validation still align to launch-lane metadata.",
    },
    {
      key: "regression_validation_ready",
      passed: report.regression.validation.ready,
      message:
        "Repeatable four-shell regression summary still passes for the core local signed-in shell targets.",
    },
    {
      key: "regression_routes_complete",
      passed:
        report.regression.rowCount === 4 &&
        arrayEquals(report.regression.expectedRoutes, [
          "/app",
          "/leader?view=overview",
          "/staff?view=chapters",
          "/admin",
        ]),
      message:
        "Regression bundle covers exactly the four expected shell routes: /app, /leader?view=overview, /staff?view=chapters, and /admin.",
    },
    {
      key: "boundary_language_safe",
      passed: !containsUnsafeProductionProofClaim(formatBundleText(report)),
      message:
        "Bundle wording stays explicitly outside production signed-in proof, rollout evidence, and invite-gate proof.",
    },
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

export function formatFigmaSandboxRoleQaBundleMarkdown(
  report = buildFigmaSandboxRoleQaBundleReport(),
): string {
  return [
    "# myMEDLIFE Local Sandbox Role QA Bundle",
    "",
    `Seed family: \`${report.seedFamily}\``,
    `Source: \`${report.source}\``,
    `Environment: \`${report.environment}\``,
    "",
    "This bundle is local/sandbox/Test-only. It is excluded from production signed-in proof, excluded from rollout evidence, and excluded from invite-gate proof.",
    "",
    "Commands:",
    `- Build QA bundle: \`${report.commands.buildBundle}\``,
    `- Build sandbox proof: \`${report.commands.buildSandboxProof}\``,
    `- Build sandbox exercise: \`${report.commands.buildSandboxExercise}\``,
    `- Check sandbox drift: \`${report.commands.checkSandboxExerciseDrift}\``,
    `- Build sandbox regression: \`${report.commands.buildSandboxRegression}\``,
    "",
    "Checks:",
    ...report.validation.checks.map(
      (check) => `- ${check.passed ? "PASS" : "FAIL"} ${check.message}`,
    ),
    "",
    "Sandbox proof summary:",
    `- Required default-route shells passed: ${report.proof.summary.defaultRouteShellsPassed}/${report.proof.summary.defaultRouteShellsRequired}`,
    `- SLT Prep sandbox review alias confirmed: ${report.proof.summary.sltReviewAliasConfirmed ? "yes" : "no"}`,
    "",
    "Sandbox exercise summary:",
    `- Exercise rows: ${report.exercise.rowCount}`,
    `- Proof validation ready: ${report.exercise.validation.ready ? "yes" : "no"}`,
    `- Drift validation ready: ${report.exercise.driftValidation.ready ? "yes" : "no"}`,
    "",
    "Regression summary:",
    `- Core shell rows: ${report.regression.rowCount}`,
    `- Expected routes: ${report.regression.expectedRoutes.join(", ")}`,
    `- Regression validation ready: ${report.regression.validation.ready ? "yes" : "no"}`,
    "",
  ].join("\n");
}

function formatBundleText(report: FigmaSandboxRoleQaBundleReport) {
  return [
    report.seedFamily,
    report.source,
    report.environment,
    ...report.validation.checks.map((check) => check.message),
  ].join(" ");
}

function containsUnsafeProductionProofClaim(text: string): boolean {
  const normalized = text.toLowerCase();
  return [
    "production proof passed",
    "production signed-in proof passed",
    "invite gate passed",
    "invite-gate passed",
    "rollout evidence passed",
    "counts as production proof",
    "counts as rollout evidence",
    "approved production proof",
  ].some((marker) => normalized.includes(marker));
}

function arrayEquals(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
