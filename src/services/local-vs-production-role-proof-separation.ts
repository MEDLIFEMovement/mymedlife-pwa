import {
  buildFigmaSandboxRoleQaBundleReport,
  formatFigmaSandboxRoleQaBundleMarkdown,
  type FigmaSandboxRoleQaBundleReport,
} from "./figma-sandbox-role-qa-bundle.ts";
import type { ProductionRolloutBootstrapPacket } from "./production-rollout-bootstrap.ts";
import {
  formatProductionSignedInRouteProofDriftValidation,
  formatProductionSignedInRouteProofGapReport,
  getProductionSignedInRouteProofDriftValidation,
  getProductionSignedInRouteProofGapReport,
  type ProductionSignedInRouteProofDriftValidation,
  type ProductionSignedInRouteProofGapReport,
} from "./production-signed-in-route-proof.ts";

export type LocalVsProductionRoleProofSeparationValidation = {
  ready: boolean;
  checks: Array<{
    key: string;
    passed: boolean;
    message: string;
  }>;
};

export type LocalVsProductionRoleProofSeparationReport = {
  generatedAt: string;
  localSandboxQa: {
    label: "Local sandbox role QA";
    status: "ready" | "not_ready";
    evidenceClass: "test_only_rehearsal";
    report: FigmaSandboxRoleQaBundleReport;
  };
  productionSignedInProof: {
    label: "Production signed-in proof";
    status:
      | "ready"
      | "open_gaps"
      | "packet_missing";
    packetProvided: boolean;
    gapReport: ProductionSignedInRouteProofGapReport;
    driftValidation: ProductionSignedInRouteProofDriftValidation;
  };
  rolloutBlockers: string[];
  commands: {
    buildSeparationReport: string;
    buildSandboxQaBundle: string;
    checkProductionProofDrift: string;
    checkProductionProofGaps: string;
  };
  validation: LocalVsProductionRoleProofSeparationValidation;
};

const commands = {
  buildSeparationReport: "pnpm figma-seed:proof-separation",
  buildSandboxQaBundle: "pnpm figma-seed:qa-bundle",
  checkProductionProofDrift: "pnpm production:signed-in-route-proof:check",
  checkProductionProofGaps:
    "pnpm production:signed-in-route-proof-gaps --packet production-rollout-packet.json",
} as const;

export function buildLocalVsProductionRoleProofSeparationReport(
  packet: ProductionRolloutBootstrapPacket | null = null,
): LocalVsProductionRoleProofSeparationReport {
  const sandboxQa = buildFigmaSandboxRoleQaBundleReport();
  const gapReport = getProductionSignedInRouteProofGapReport(packet);
  const driftValidation = getProductionSignedInRouteProofDriftValidation();

  const report = {
    generatedAt: sandboxQa.generatedAt,
    localSandboxQa: {
      label: "Local sandbox role QA",
      status: sandboxQa.validation.ready ? "ready" : "not_ready",
      evidenceClass: "test_only_rehearsal",
      report: sandboxQa,
    },
    productionSignedInProof: {
      label: "Production signed-in proof",
      status:
        packet === null ? "packet_missing" : gapReport.ready ? "ready" : "open_gaps",
      packetProvided: packet !== null,
      gapReport,
      driftValidation,
    },
    rolloutBlockers: getRolloutBlockers(packet, gapReport),
    commands,
    validation: {
      ready: false,
      checks: [],
    },
  } satisfies Omit<LocalVsProductionRoleProofSeparationReport, "validation"> & {
    validation: LocalVsProductionRoleProofSeparationValidation;
  };

  return {
    ...report,
    validation: getLocalVsProductionRoleProofSeparationValidation(report),
  };
}

export function getLocalVsProductionRoleProofSeparationValidation(
  report = buildLocalVsProductionRoleProofSeparationReport(),
): LocalVsProductionRoleProofSeparationValidation {
  const checks = [
    {
      key: "sandbox-boundary-intact",
      passed:
        report.localSandboxQa.report.notProductionEvidence === true &&
        report.localSandboxQa.report.productionProofStatus === "blocked_by_design",
      message:
        "Local sandbox role QA stays marked as Test-only rehearsal and blocked from production proof by design.",
    },
    {
      key: "sandbox-qa-report-ready",
      passed: report.localSandboxQa.report.validation.ready,
      message:
        "Local sandbox role QA bundle is internally green for proof, exercise, drift, and four-shell regression.",
    },
    {
      key: "production-gap-classes-visible",
      passed:
        report.productionSignedInProof.gapReport.gaps.length === 4 &&
        report.productionSignedInProof.gapReport.gaps.every((gap) =>
          ["/app", "/leader?view=overview", "/staff?view=chapters", "/admin"].includes(
            gap.expectedPath,
          ),
        ),
      message:
        "Production signed-in proof section still lists member, leader, staff/support, and DS/admin as distinct required classes.",
    },
    {
      key: "production-drift-guard-ready",
      passed: report.productionSignedInProof.driftValidation.ready,
      message:
        "Production proof drift guard still aligns required proof classes to active signed-in launch-lane routes and blocked source markers.",
    },
    {
      key: "rollout-blockers-visible",
      passed:
        report.rolloutBlockers.length > 0 &&
        report.rolloutBlockers.some((blocker) =>
          blocker.includes("signed-in-route-proof.csv"),
        ),
      message:
        "Report makes the remaining rollout/invite-gate blockers explicit and keeps signed-in-route-proof.csv separate from sandbox artifacts.",
    },
    {
      key: "boundary-language-safe",
      passed: !containsUnsafeBoundaryClaim(formatLocalVsProductionRoleProofSeparationMarkdown(report)),
      message:
        "Report wording does not imply that sandbox evidence can satisfy production signed-in proof, rollout evidence, or invite-gate proof.",
    },
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

export function formatLocalVsProductionRoleProofSeparationMarkdown(
  report = buildLocalVsProductionRoleProofSeparationReport(),
): string {
  const localStatus =
    report.localSandboxQa.status === "ready" ? "READY" : "NOT READY";
  const productionStatus = formatProductionStatus(report);

  return [
    "# myMEDLIFE Local vs Production Role Proof Separation",
    "",
    `Built: ${report.generatedAt}`,
    "",
    "This report is read-only. It exists to keep local sandbox/Test rehearsal evidence separate from real production signed-in proof.",
    "",
    "Commands:",
    `- Build separation report: \`${report.commands.buildSeparationReport}\``,
    `- Build local sandbox QA bundle: \`${report.commands.buildSandboxQaBundle}\``,
    `- Check production proof drift: \`${report.commands.checkProductionProofDrift}\``,
    `- Check production proof gaps: \`${report.commands.checkProductionProofGaps}\``,
    "",
    "## Local sandbox role QA",
    `Status: ${localStatus}`,
    "Evidence class: Test-only rehearsal",
    "Meaning: useful for sandbox rehearsal only. It does not count as production signed-in proof, rollout evidence, or invite-gate proof.",
    `Summary: ${report.localSandboxQa.report.proof.summary.defaultRouteShellsPassed}/${report.localSandboxQa.report.proof.summary.defaultRouteShellsRequired} default-route shells passed; regression routes ${report.localSandboxQa.report.regression.expectedRoutes.join(", ")}.`,
    "",
    "## Production signed-in proof",
    `Status: ${productionStatus}`,
    `Packet provided: ${report.productionSignedInProof.packetProvided ? "yes" : "no"}`,
    "Meaning: this section tracks real production member, leader, staff/support, and DS/admin proof only.",
    ...report.productionSignedInProof.gapReport.gaps.map(
      (gap) =>
        `- ${gap.label}: ${gap.status.toUpperCase()} (${gap.expectedPath}) - ${gap.detail}`,
    ),
    "",
    "## What still blocks rollout and invite gate",
    ...report.rolloutBlockers.map((blocker) => `- ${blocker}`),
    "",
    "## Copy boundary",
    "- Do not copy local sandbox proof rows, screenshots, Markdown, or JSON into signed-in-route-proof.csv.",
    "- Do not use local sandbox/Test/Figma/SOP/sample evidence in the rollout packet.",
    "- Do not use local sandbox/Test/Figma/SOP/sample evidence as invite-gate proof.",
    "",
    "## Validation",
    ...report.validation.checks.map(
      (check) => `- ${check.passed ? "PASS" : "FAIL"} ${check.message}`,
    ),
    "",
    "## Source detail",
    "Local sandbox bundle:",
    indent(formatFigmaSandboxRoleQaBundleMarkdown(report.localSandboxQa.report)),
    "",
    "Production proof drift check:",
    indent(
      formatProductionSignedInRouteProofDriftValidation(
        report.productionSignedInProof.driftValidation,
      ),
    ),
    "",
    "Production proof gaps:",
    indent(
      formatProductionSignedInRouteProofGapReport(
        report.productionSignedInProof.gapReport,
      ),
    ),
    "",
  ].join("\n");
}

function getRolloutBlockers(
  packet: ProductionRolloutBootstrapPacket | null,
  gapReport: ProductionSignedInRouteProofGapReport,
): string[] {
  const blockers = [
    "Local sandbox/Test bundle remains excluded from signed-in-route-proof.csv, the rollout packet, and invite-gate proof.",
  ];

  if (packet === null) {
    blockers.push(
      "Production rollout packet was not provided, so real production signed-in proof cannot be evaluated yet.",
    );
  }

  for (const gap of gapReport.gaps) {
    if (gap.status === "present") {
      continue;
    }

    blockers.push(
      `${gap.label} still needs real production evidence at ${gap.expectedPath} before signed-in-route-proof.csv can be considered complete.`,
    );
  }

  return blockers;
}

function formatProductionStatus(
  report: LocalVsProductionRoleProofSeparationReport,
) {
  if (report.productionSignedInProof.status === "ready") {
    return "PRESENT";
  }

  if (report.productionSignedInProof.status === "packet_missing") {
    return "MISSING PACKET / PROOF ROWS";
  }

  return "OPEN GAPS";
}

function containsUnsafeBoundaryClaim(text: string): boolean {
  const normalized = text.toLowerCase();
  return [
    "sandbox evidence counts as production proof",
    "local sandbox role qa satisfies production proof",
    "sandbox proof satisfies invite gate",
    "sandbox proof counts as rollout evidence",
    "production signed-in proof complete from sandbox",
    "invite gate passed from sandbox",
  ].some((marker) => normalized.includes(marker));
}

function indent(text: string) {
  return text
    .split("\n")
    .map((line) => (line.length > 0 ? `> ${line}` : ">"))
    .join("\n");
}
