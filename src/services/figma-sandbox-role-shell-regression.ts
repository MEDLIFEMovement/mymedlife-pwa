import {
  buildFigmaSandboxRoleExerciseReport,
  type FigmaSandboxRoleExerciseReport,
  type FigmaSandboxRoleExerciseRow,
} from "./figma-sandbox-role-exercise.ts";
import {
  buildFigmaSandboxSignedInRoleProofReport,
  getFigmaSandboxSignedInRoleProofValidation,
} from "./figma-sandbox-signed-in-role-proof.ts";

type CoreRoleClass = "member" | "leader" | "staff_support" | "ds_admin";

export type FigmaSandboxRoleShellRegressionRow = {
  roleClass: CoreRoleClass;
  label: string;
  loginEmail: string;
  loginDisplayName: string;
  loginRole: string;
  shell: FigmaSandboxRoleExerciseRow["shell"];
  expectedRoute: string;
  derivedDefaultRoute: string;
  passed: boolean;
  excludedFromProductionEvidence: true;
  exclusionReason: string;
  notProductionProofReason: string;
};

export type FigmaSandboxRoleShellRegressionValidation = {
  ready: boolean;
  checks: Array<{
    key: string;
    passed: boolean;
    message: string;
  }>;
};

export type FigmaSandboxRoleShellRegressionReport = {
  generatedAt: string;
  seedFamily: FigmaSandboxRoleExerciseReport["seedFamily"];
  source: FigmaSandboxRoleExerciseReport["source"];
  environment: FigmaSandboxRoleExerciseReport["environment"];
  executionMode: "deterministic_local_route_regression";
  notProductionEvidence: true;
  productionProofStatus: "blocked_by_design";
  rows: FigmaSandboxRoleShellRegressionRow[];
  commands: {
    buildRegression: string;
    buildSandboxProof: string;
    buildSandboxExercise: string;
    checkSandboxExerciseDrift: string;
  };
  validation: FigmaSandboxRoleShellRegressionValidation;
};

const commands = {
  buildRegression: "pnpm figma-seed:regression",
  buildSandboxProof: "pnpm figma-seed:proof",
  buildSandboxExercise: "pnpm figma-seed:exercise",
  checkSandboxExerciseDrift: "pnpm figma-seed:exercise:check",
} as const;

export function buildFigmaSandboxRoleShellRegressionReport(): FigmaSandboxRoleShellRegressionReport {
  const proofReport = buildFigmaSandboxSignedInRoleProofReport();
  const proofValidation = getFigmaSandboxSignedInRoleProofValidation(proofReport);
  const exerciseReport = buildFigmaSandboxRoleExerciseReport(undefined, proofReport);
  const rows = selectCoreRows(exerciseReport.rows);

  const validation = buildValidation({
    rows,
    proofValidationReady: proofValidation.ready,
    exerciseReport,
  });

  return {
    generatedAt: exerciseReport.generatedAt,
    seedFamily: exerciseReport.seedFamily,
    source: exerciseReport.source,
    environment: exerciseReport.environment,
    executionMode: "deterministic_local_route_regression",
    notProductionEvidence: true,
    productionProofStatus: "blocked_by_design",
    rows,
    commands,
    validation,
  };
}

export function getFigmaSandboxRoleShellRegressionValidation(
  input: FigmaSandboxRoleShellRegressionReport,
): FigmaSandboxRoleShellRegressionValidation;
export function getFigmaSandboxRoleShellRegressionValidation(
  input = buildFigmaSandboxRoleShellRegressionReport(),
): FigmaSandboxRoleShellRegressionValidation {
  return input.validation;
}

function buildValidation(input: {
  rows: FigmaSandboxRoleShellRegressionRow[];
  proofValidationReady: boolean;
  exerciseReport: FigmaSandboxRoleExerciseReport;
}): FigmaSandboxRoleShellRegressionValidation {
  const { rows, proofValidationReady, exerciseReport } = input;

  const checks = [
    {
      key: "proof_report_ready",
      passed: proofValidationReady,
      message:
        "Existing figma sandbox signed-in route proof still passes for the four core classes.",
    },
    {
      key: "exercise_report_ready",
      passed: exerciseReport.validation.ready && exerciseReport.driftValidation.ready,
      message:
        "Existing figma sandbox role exercise and drift validation still pass against launch-lane route metadata.",
    },
    {
      key: "exactly_four_core_classes",
      passed: rows.length === 4,
      message: `Regression report covers ${rows.length}/4 required role shells.`,
    },
    ...rows.flatMap((row) => [
      {
        key: `${row.roleClass}:route`,
        passed: row.passed,
        message: `${row.label} resolves to ${row.expectedRoute}.`,
      },
      {
        key: `${row.roleClass}:boundary`,
        passed:
          row.excludedFromProductionEvidence &&
          row.exclusionReason.includes("must stay out of production rollout evidence") &&
          row.notProductionProofReason.includes("must not be used as production signed-in proof") &&
          !containsUnsafeProductionProofClaim(
            `${row.exclusionReason} ${row.notProductionProofReason}`,
          ),
        message: `${row.label} stays explicitly excluded from production proof and rollout evidence.`,
      },
    ]),
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

export function formatFigmaSandboxRoleShellRegressionMarkdown(
  report = buildFigmaSandboxRoleShellRegressionReport(),
): string {
  return [
    "# myMEDLIFE Local Sandbox Signed-In Role Shell Regression",
    "",
    `Seed family: \`${report.seedFamily}\``,
    `Source: \`${report.source}\``,
    `Environment: \`${report.environment}\``,
    `Execution mode: \`${report.executionMode}\``,
    "",
    "This report is local/sandbox/Test evidence only. It must not be used as production signed-in proof, rollout evidence, or invite-gate proof.",
    "",
    "Commands:",
    `- Build regression report: \`${report.commands.buildRegression}\``,
    `- Build sandbox proof: \`${report.commands.buildSandboxProof}\``,
    `- Build sandbox exercise: \`${report.commands.buildSandboxExercise}\``,
    `- Check sandbox drift: \`${report.commands.checkSandboxExerciseDrift}\``,
    "",
    "Checks:",
    ...report.validation.checks.map(
      (check) => `- ${check.passed ? "PASS" : "FAIL"} ${check.message}`,
    ),
    "",
    "| Role class | Login | Role | Expected route | Derived route | Status | Boundary |",
    "|---|---|---|---|---|---|---|",
    ...report.rows.map((row) =>
      `| ${[
        row.roleClass,
        `${row.loginDisplayName} <${row.loginEmail}>`,
        row.loginRole,
        row.expectedRoute,
        row.derivedDefaultRoute,
        row.passed ? "PASS" : "FAIL",
        row.notProductionProofReason,
      ]
        .map(escapeCell)
        .join(" | ")} |`,
    ),
    "",
  ].join("\n");
}

function selectCoreRows(rows: FigmaSandboxRoleExerciseRow[]): FigmaSandboxRoleShellRegressionRow[] {
  const member = selectRow(rows, (row) => row.shell === "member_app");
  const leader = selectRow(
    rows,
    (row) =>
      row.shell === "leader_command_center" &&
      row.loginRole === "president_vp",
    (row) => row.shell === "leader_command_center",
  );
  const staff = selectRow(
    rows,
    (row) => row.shell === "staff_command_center" && row.loginRole === "coach",
    (row) => row.shell === "staff_command_center",
  );
  const admin = selectRow(
    rows,
    (row) => row.shell === "admin_backend" && row.loginRole === "ds_admin",
    (row) => row.shell === "admin_backend",
  );

  return [
    toRegressionRow("member", member),
    toRegressionRow("leader", leader),
    toRegressionRow("staff_support", staff),
    toRegressionRow("ds_admin", admin),
  ];
}

function selectRow(
  rows: FigmaSandboxRoleExerciseRow[],
  preferred: (row: FigmaSandboxRoleExerciseRow) => boolean,
  fallback = preferred,
) {
  const preferredMatch = rows.find(preferred);
  if (preferredMatch) {
    return preferredMatch;
  }

  const fallbackMatch = rows.find(fallback);

  if (!fallbackMatch) {
    throw new Error("Missing sandbox exercise row for regression report.");
  }

  return fallbackMatch;
}

function toRegressionRow(
  roleClass: CoreRoleClass,
  row: FigmaSandboxRoleExerciseRow,
): FigmaSandboxRoleShellRegressionRow {
  return {
    roleClass,
    label: row.label,
    loginEmail: row.loginEmail,
    loginDisplayName: row.loginDisplayName,
    loginRole: row.loginRole,
    shell: row.shell,
    expectedRoute: row.expectedDefaultRoute,
    derivedDefaultRoute: row.derivedDefaultRoute,
    passed: row.defaultRoutePassed,
    excludedFromProductionEvidence: row.excludedFromProductionEvidence,
    exclusionReason: row.exclusionReason,
    notProductionProofReason:
      "This local sandbox/Test regression must not be used as production signed-in proof, rollout evidence, or invite-gate proof.",
  };
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

function escapeCell(value: string) {
  return value.replaceAll("|", "\\|");
}
