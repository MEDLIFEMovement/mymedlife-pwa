import {
  buildFigmaTestSeedManifest,
  type FigmaTestSeedLogin,
  type FigmaTestSeedManifest,
  type FigmaTestSeedShellKey,
  type FigmaTestSeedShellRecord,
} from "../data/figma-test-seed-map.ts";
import {
  buildFigmaSandboxSignedInRoleProofReport,
  getFigmaSandboxSignedInRoleProofValidation,
  type FigmaSandboxSignedInRoleProofReport,
  type FigmaSandboxSignedInRoleProofValidation,
} from "./figma-sandbox-signed-in-role-proof.ts";
import {
  getActiveLaunchLaneAuthReadiness,
  type LaunchLaneRouteReadiness,
  type LaunchLaneRouteWorkspace,
} from "./launch-lane-auth-readiness.ts";

type SandboxExerciseWorkspace = Exclude<LaunchLaneRouteWorkspace, "public">;

export type FigmaSandboxRoleExerciseRoute = {
  canonicalHref: string;
  label: string;
  workspace: SandboxExerciseWorkspace;
  notes: string;
};

export type FigmaSandboxRoleExerciseRow = {
  shell: FigmaTestSeedShellKey;
  label: string;
  loginEmail: string;
  loginDisplayName: string;
  loginRole: FigmaTestSeedLogin["role"];
  chapterName: string | null;
  expectedDefaultRoute: string;
  derivedDefaultRoute: string;
  defaultRoutePassed: boolean;
  reviewMode: "default_signed_in_shell" | "sandbox_review_alias";
  exerciseRoutes: FigmaSandboxRoleExerciseRoute[];
  excludedFromProductionEvidence: true;
  exclusionReason: string;
  notProductionProofReason: string;
};

export type FigmaSandboxRoleExerciseReport = {
  generatedAt: string;
  seedFamily: FigmaTestSeedManifest["seedFamily"];
  source: FigmaTestSeedManifest["source"];
  environment: FigmaTestSeedManifest["environment"];
  notProductionEvidence: true;
  productionProofStatus: "blocked_by_design";
  rows: FigmaSandboxRoleExerciseRow[];
  validation: FigmaSandboxSignedInRoleProofValidation;
  commands: {
    buildSeedArtifacts: string;
    buildSandboxProof: string;
    applyLocalSeed: string;
  };
};

const routeWorkspaceByShell: Record<FigmaTestSeedShellKey, SandboxExerciseWorkspace> = {
  member_app: "member",
  leader_command_center: "leader",
  staff_command_center: "staff",
  admin_backend: "admin",
  slt_prep: "member",
};

const commandCatalog = {
  buildSeedArtifacts: "pnpm figma-seed:build",
  buildSandboxProof: "pnpm figma-seed:proof",
  applyLocalSeed:
    "MYMEDLIFE_TEST_PRODUCTION_CONFIRM=CREATE_TEST_DATA pnpm test-production:seed -- --local",
} as const;

export function buildFigmaSandboxRoleExerciseReport(
  manifest = buildFigmaTestSeedManifest(),
  proofReport = buildFigmaSandboxSignedInRoleProofReport(manifest),
): FigmaSandboxRoleExerciseReport {
  const validation = getFigmaSandboxSignedInRoleProofValidation(proofReport);

  return {
    generatedAt: manifest.generatedAt,
    seedFamily: manifest.seedFamily,
    source: manifest.source,
    environment: manifest.environment,
    notProductionEvidence: true,
    productionProofStatus: "blocked_by_design",
    rows: manifest.shells.flatMap((shell) =>
      buildShellExerciseRows(shell, proofReport.rows, getActiveLaunchLaneAuthReadiness()),
    ),
    validation,
    commands: commandCatalog,
  };
}

export function formatFigmaSandboxRoleExerciseMarkdown(
  report = buildFigmaSandboxRoleExerciseReport(),
): string {
  const lines = [
    "# myMEDLIFE Figma Sandbox Role Exercise",
    "",
    `Seed family: \`${report.seedFamily}\``,
    `Source: \`${report.source}\``,
    `Environment: \`${report.environment}\``,
    "",
    "This checklist is local/sandbox-only. It must not count as production signed-in route proof, invite-gate proof, or rollout evidence.",
    "",
    "Local-only commands:",
    `- Build seed artifacts: \`${report.commands.buildSeedArtifacts}\``,
    `- Build sandbox route proof: \`${report.commands.buildSandboxProof}\``,
    `- Apply local seed: \`${report.commands.applyLocalSeed}\``,
    "",
    "Validation:",
    ...report.validation.checks.map(
      (check) => `- ${check.passed ? "PASS" : "FAIL"} ${check.message}`,
    ),
    "",
  ];

  for (const row of report.rows) {
    lines.push(`## ${row.label}`);
    lines.push("");
    lines.push(`- Login: ${row.loginDisplayName} <${row.loginEmail}>`);
    lines.push(`- Role: \`${row.loginRole}\``);
    lines.push(`- Chapter: ${row.chapterName ?? "Test staff"}`);
    lines.push(`- Expected default route: \`${row.expectedDefaultRoute}\``);
    lines.push(`- Derived default route: \`${row.derivedDefaultRoute}\``);
    lines.push(`- Default route status: ${row.defaultRoutePassed ? "PASS" : "FAIL"}`);
    lines.push(
      `- Exercise mode: \`${row.reviewMode === "sandbox_review_alias" ? "sandbox_review_alias" : "default_signed_in_shell"}\``,
    );
    lines.push(`- Evidence posture: ${row.exclusionReason}`);
    lines.push(`- Production-proof boundary: ${row.notProductionProofReason}`);
    lines.push("");
    lines.push("Routes to review:");
    for (const route of row.exerciseRoutes) {
      lines.push(
        `- \`${route.canonicalHref}\` - ${route.label}. ${route.notes}`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

function buildShellExerciseRows(
  shell: FigmaTestSeedShellRecord,
  proofRows: FigmaSandboxSignedInRoleProofReport["rows"],
  readinessRoutes: LaunchLaneRouteReadiness[],
): FigmaSandboxRoleExerciseRow[] {
  return shell.logins.map((login) => {
    const proofRow = proofRows.find(
      (row) => row.shell === shell.shell && row.loginEmail === login.email,
    );

    if (!proofRow) {
      throw new Error(`Missing sandbox proof row for ${shell.shell} ${login.email}`);
    }

    return {
      shell: shell.shell,
      label: shell.label,
      loginEmail: login.email,
      loginDisplayName: login.displayName,
      loginRole: login.role,
      chapterName: login.chapterName,
      expectedDefaultRoute: shell.primaryRoute,
      derivedDefaultRoute: proofRow.derivedDefaultRoute,
      defaultRoutePassed: proofRow.passed,
      reviewMode:
        proofRow.proofMode === "sandbox_review_alias"
          ? "sandbox_review_alias"
          : "default_signed_in_shell",
      exerciseRoutes: getExerciseRoutes(shell.shell, readinessRoutes),
      excludedFromProductionEvidence: true,
      exclusionReason: shell.exclusionReason,
      notProductionProofReason:
        "Sandbox/Test/Figma exercise output is explicitly excluded. Real production signed-in proof still requires approved production packet rows, live data counts, and real production accounts.",
    };
  });
}

function getExerciseRoutes(
  shell: FigmaTestSeedShellKey,
  readinessRoutes: LaunchLaneRouteReadiness[],
): FigmaSandboxRoleExerciseRoute[] {
  const workspace = routeWorkspaceByShell[shell];
  const activeRoutes = readinessRoutes
    .filter((route) => route.workspace === workspace)
    .map((route) => ({
      canonicalHref: route.canonicalHref,
      label: route.label,
      workspace,
      notes: route.notes,
    }));

  if (shell !== "slt_prep") {
    return activeRoutes;
  }

  return [
    ...activeRoutes,
    {
      canonicalHref: "/app/slt-prep",
      label: "SLT Prep sandbox review alias",
      workspace,
      notes:
        "Use this route only as a sandbox review alias. The signed-in default route still remains /app, and this alias must not count as production proof.",
    },
  ];
}
