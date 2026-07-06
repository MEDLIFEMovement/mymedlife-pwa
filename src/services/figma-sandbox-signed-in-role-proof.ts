import {
  buildFigmaTestSeedManifest,
  type FigmaTestSeedLogin,
  type FigmaTestSeedManifest,
  type FigmaTestSeedShellKey,
  type FigmaTestSeedShellRecord,
} from "../data/figma-test-seed-map.ts";
import {
  getDefaultWorkspace,
  getWorkspaceHref,
  type WorkspaceAccessUser,
} from "./workspace-access.ts";
import type { DatabaseRoleKey } from "../shared/types/persistence.ts";

type ProofMode = "default_sign_in_route" | "sandbox_review_alias";

export type FigmaSandboxSignedInRoleProofRow = {
  shell: FigmaTestSeedShellKey;
  label: string;
  loginEmail: string;
  loginDisplayName: string;
  loginRole: DatabaseRoleKey;
  chapterName: string | null;
  expectedRoute: string;
  derivedDefaultRoute: string;
  proofMode: ProofMode;
  passed: boolean;
  note: string;
  excludedFromProductionEvidence: true;
  exclusionReason: string;
};

export type FigmaSandboxSignedInRoleProofReport = {
  generatedAt: string;
  seedFamily: FigmaTestSeedManifest["seedFamily"];
  source: FigmaTestSeedManifest["source"];
  environment: FigmaTestSeedManifest["environment"];
  executionMode: "route_logic_validation_only";
  notProductionEvidence: true;
  rows: FigmaSandboxSignedInRoleProofRow[];
  summary: {
    defaultRouteShellsPassed: number;
    defaultRouteShellsRequired: number;
    sltReviewAliasConfirmed: boolean;
  };
};

export type FigmaSandboxSignedInRoleProofValidation = {
  ready: boolean;
  checks: Array<{
    key: string;
    passed: boolean;
    message: string;
  }>;
};

const supportedRoleKeys = new Set<DatabaseRoleKey>([
  "general_member",
  "action_committee_chair",
  "president_vp",
  "coach",
  "admin",
  "ds_admin",
  "super_admin",
]);

export function buildFigmaSandboxSignedInRoleProofReport(
  manifest = buildFigmaTestSeedManifest(),
): FigmaSandboxSignedInRoleProofReport {
  const rows = manifest.shells.flatMap((shell) => buildShellProofRows(shell));
  const defaultRouteShells = dedupe(
    rows
      .filter((row) => row.proofMode === "default_sign_in_route")
      .map((row) => row.shell),
  );
  const passedDefaultRouteShells = dedupe(
    rows
      .filter((row) => row.proofMode === "default_sign_in_route" && row.passed)
      .map((row) => row.shell),
  );

  return {
    generatedAt: manifest.generatedAt,
    seedFamily: manifest.seedFamily,
    source: manifest.source,
    environment: manifest.environment,
    executionMode: "route_logic_validation_only",
    notProductionEvidence: true,
    rows,
    summary: {
      defaultRouteShellsPassed: passedDefaultRouteShells.length,
      defaultRouteShellsRequired: defaultRouteShells.length,
      sltReviewAliasConfirmed: rows.some(
        (row) => row.shell === "slt_prep" && row.passed,
      ),
    },
  };
}

export function getFigmaSandboxSignedInRoleProofValidation(
  report = buildFigmaSandboxSignedInRoleProofReport(),
): FigmaSandboxSignedInRoleProofValidation {
  const checks = [
    {
      key: "member_sign_in_lands_in_app",
      passed: hasPassingShellProof(report, "member_app"),
      message: "A sandbox Test member login resolves to /app.",
    },
    {
      key: "leader_sign_in_lands_in_leader",
      passed: hasPassingShellProof(report, "leader_command_center"),
      message: "A sandbox Test leader login resolves to /leader?view=overview.",
    },
    {
      key: "staff_sign_in_lands_in_staff",
      passed: hasPassingShellProof(report, "staff_command_center"),
      message: "Sandbox Test coach/staff logins resolve to /staff?view=chapters.",
    },
    {
      key: "admin_sign_in_lands_in_admin",
      passed: hasPassingShellProof(report, "admin_backend"),
      message: "Sandbox Test DS/admin logins resolve to /admin.",
    },
    {
      key: "slt_prep_stays_review_only",
      passed: report.summary.sltReviewAliasConfirmed,
      message:
        "The /app/slt-prep alias stays a sandbox review path instead of being treated as a signed-in default route proof.",
    },
    {
      key: "sandbox_rows_stay_excluded_from_rollout_evidence",
      passed: report.rows.every(
        (row) =>
          row.excludedFromProductionEvidence &&
          row.exclusionReason.includes("must stay out of production rollout evidence"),
      ),
      message: "Every sandbox proof row stays excluded from production rollout evidence.",
    },
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

export function formatFigmaSandboxSignedInRoleProofMarkdown(
  report = buildFigmaSandboxSignedInRoleProofReport(),
): string {
  const validation = getFigmaSandboxSignedInRoleProofValidation(report);
  const lines = [
    "# myMEDLIFE Figma Sandbox Signed-In Role Proof",
    "",
    `Seed family: \`${report.seedFamily}\``,
    `Source: \`${report.source}\``,
    `Environment: \`${report.environment}\``,
    `Execution mode: \`${report.executionMode}\``,
    "",
    "This report is local/sandbox-only and is not production rollout evidence.",
    "",
    `${report.summary.defaultRouteShellsPassed}/${report.summary.defaultRouteShellsRequired} required signed-in default route shells passed.`,
    `SLT Prep sandbox review alias confirmed: ${report.summary.sltReviewAliasConfirmed ? "yes" : "no"}`,
    "",
    "Checks:",
    ...validation.checks.map(
      (check) => `- ${check.passed ? "PASS" : "FAIL"} ${check.message}`,
    ),
    "",
    "| Shell | Login | Role | Expected route | Derived default route | Status | Notes |",
    "|---|---|---|---|---|---|---|",
    ...report.rows.map((row) =>
      `| ${[
        row.label,
        `${row.loginDisplayName} <${row.loginEmail}>`,
        row.loginRole,
        row.expectedRoute,
        row.derivedDefaultRoute,
        row.passed ? "PASS" : "FAIL",
        row.note,
      ]
        .map(escapeCell)
        .join(" | ")} |`,
    ),
    "",
  ];

  return lines.join("\n");
}

function buildShellProofRows(
  shell: FigmaTestSeedShellRecord,
): FigmaSandboxSignedInRoleProofRow[] {
  return shell.logins.map((login) => {
    const roleKey = toDatabaseRoleKey(login);
    const derivedDefaultRoute = getWorkspaceHref(
      getDefaultWorkspace({
        databaseRoleKeys: [roleKey],
      } satisfies WorkspaceAccessUser),
    );
    const sandboxReviewAlias = shell.shell === "slt_prep";
    const passed = sandboxReviewAlias
      ? derivedDefaultRoute === "/app"
      : derivedDefaultRoute === shell.primaryRoute;

    return {
      shell: shell.shell,
      label: shell.label,
      loginEmail: login.email,
      loginDisplayName: login.displayName,
      loginRole: roleKey,
      chapterName: login.chapterName,
      expectedRoute: shell.primaryRoute,
      derivedDefaultRoute,
      proofMode: sandboxReviewAlias
        ? "sandbox_review_alias"
        : "default_sign_in_route",
      passed,
      note: sandboxReviewAlias
        ? "Sandbox review alias only. This member login still defaults to /app and must not count as production signed-in route proof."
        : `${login.demonstrates} Derived from the same workspace-access landing logic used by local auth sessions.`,
      excludedFromProductionEvidence: shell.excludedFromProductionEvidence,
      exclusionReason: shell.exclusionReason,
    };
  });
}

function toDatabaseRoleKey(login: FigmaTestSeedLogin): DatabaseRoleKey {
  if (!supportedRoleKeys.has(login.role as DatabaseRoleKey)) {
    throw new Error(`Unsupported figma sandbox login role: ${login.role}`);
  }

  return login.role as DatabaseRoleKey;
}

function hasPassingShellProof(
  report: FigmaSandboxSignedInRoleProofReport,
  shell: FigmaTestSeedShellKey,
) {
  return report.rows.some(
    (row) =>
      row.shell === shell &&
      row.proofMode === "default_sign_in_route" &&
      row.passed,
  );
}

function dedupe<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function escapeCell(value: string) {
  return value.replaceAll("|", "\\|");
}
