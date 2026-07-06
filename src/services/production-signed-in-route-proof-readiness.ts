import type { ProductionRolloutBootstrapPacket } from "./production-rollout-bootstrap.ts";
import {
  getBlockedProductionSignedInProofSourceMarkers,
} from "./production-signed-in-route-proof-import.ts";
import {
  getProductionSignedInRouteProofDriftValidation,
  getProductionSignedInRouteProofGapReport,
  getProductionSignedInRouteProofRequirements,
  type ProductionSignedInRouteProofDriftValidation,
  type ProductionSignedInRouteProofGapReport,
  type ProductionSignedInRouteProofRequirement,
} from "./production-signed-in-route-proof.ts";

export type ProductionSignedInRouteProofReadinessChecklistValidation = {
  ready: boolean;
  checks: Array<{
    key: string;
    passed: boolean;
    message: string;
  }>;
};

export type ProductionSignedInRouteProofReadinessChecklist = {
  title: string;
  packetProvided: boolean;
  productionLiveDataCountsProvided: false;
  requiredClasses: ProductionSignedInRouteProofRequirement[];
  blockedSources: string[];
  commands: {
    importProofRows: string;
    rebuildPacket: string;
    checkProofReadiness: string;
    checkProofGaps: string;
    checkProofDrift: string;
  };
  operatorSteps: string[];
  gapReport: ProductionSignedInRouteProofGapReport;
  driftValidation: ProductionSignedInRouteProofDriftValidation;
  blockers: string[];
  validation: ProductionSignedInRouteProofReadinessChecklistValidation;
};

const commands = {
  importProofRows:
    "pnpm rollout:signed-in-proof-import --proof signed-in-route-proof-source.csv --out-dir rollout-csv",
  rebuildPacket:
    "pnpm rollout:build --chapters rollout-csv/chapters.csv --users rollout-csv/users.csv --memberships rollout-csv/memberships.csv --staff-roles rollout-csv/staff-roles.csv --coach-assignments rollout-csv/coach-assignments.csv --campaigns rollout-csv/campaigns.csv --luma-calendars rollout-csv/luma-calendars.csv --pilot-event-proof rollout-csv/pilot-event-proof.csv --launch-owners rollout-csv/launch-owners.csv --signed-in-route-proof rollout-csv/signed-in-route-proof.csv --out production-rollout-packet.json",
  checkProofReadiness:
    "pnpm production:signed-in-route-proof --packet production-rollout-packet.json",
  checkProofGaps:
    "pnpm production:signed-in-route-proof-gaps --packet production-rollout-packet.json",
  checkProofDrift: "pnpm production:signed-in-route-proof:check",
} as const;

export function getProductionSignedInRouteProofReadinessChecklist(
  packet: ProductionRolloutBootstrapPacket | null = null,
): ProductionSignedInRouteProofReadinessChecklist {
  const requiredClasses = getProductionSignedInRouteProofRequirements();
  const gapReport = getProductionSignedInRouteProofGapReport(packet);
  const driftValidation = getProductionSignedInRouteProofDriftValidation();
  const checklist = {
    title: "Production signed-in route proof readiness: READ-ONLY OPERATOR CHECKLIST",
    packetProvided: packet !== null,
    productionLiveDataCountsProvided: false,
    requiredClasses,
    blockedSources: getBlockedProductionSignedInProofSourceMarkers(),
    commands,
    operatorSteps: [
      "Collect one real production proof row for each required class: member, leader, staff/support, and DS/admin.",
      "Record only short route evidence in signed-in-route-proof-source.csv: email, workspace, observedPath, status, checkedAt, and notes.",
      "Do not collect proof until production users and app rows exist.",
      "Import the reviewer sheet into local signed-in-route-proof.csv, rebuild the packet, then run the proof gap and readiness checks.",
      "Keep local sandbox/Test/Figma/SOP/sample, preview-cookie, staging, fake screenshot, and missing-profile evidence out of the CSV entirely.",
      "Treat production-live-data-counts.txt and the approved rollout packet as separate required blockers for final invite-gate review.",
    ],
    gapReport,
    driftValidation,
    blockers: getChecklistBlockers(packet, gapReport),
    validation: {
      ready: false,
      checks: [],
    },
  } satisfies Omit<
    ProductionSignedInRouteProofReadinessChecklist,
    "validation"
  > & {
    validation: ProductionSignedInRouteProofReadinessChecklistValidation;
  };

  return {
    ...checklist,
    validation: getProductionSignedInRouteProofReadinessChecklistValidation(
      checklist,
    ),
  };
}

export function getProductionSignedInRouteProofReadinessChecklistValidation(
  checklist = getProductionSignedInRouteProofReadinessChecklist(),
): ProductionSignedInRouteProofReadinessChecklistValidation {
  const checks = [
    {
      key: "required-classes-complete",
      passed:
        checklist.requiredClasses.length === 4 &&
        checklist.requiredClasses.map((item) => item.expectedPath).join("|") ===
          "/app|/leader?view=overview|/staff?view=chapters|/admin",
      message:
        "Checklist still names the four required production proof classes and their exact routes.",
    },
    {
      key: "blocked-sources-visible",
      passed:
        checklist.blockedSources.includes("preview-cookie") &&
        checklist.blockedSources.includes("local sandbox") &&
        checklist.blockedSources.includes("figma_seed") &&
        checklist.blockedSources.includes("sop sample") &&
        checklist.blockedSources.includes("staging.mymedlife.org"),
      message:
        "Checklist keeps preview, sandbox, Figma/Test, SOP sample, and staging evidence visibly blocked.",
    },
    {
      key: "import-and-check-sequence-visible",
      passed:
        checklist.commands.importProofRows.includes(
          "rollout:signed-in-proof-import",
        ) &&
        checklist.commands.checkProofReadiness.includes(
          "production:signed-in-route-proof",
        ) &&
        checklist.commands.checkProofGaps.includes(
          "production:signed-in-route-proof-gaps",
        ),
      message:
        "Checklist includes the import, rebuild, gap-check, and readiness-check sequence for real production proof rows.",
    },
    {
      key: "packet-and-live-count-blockers-visible",
      passed:
        checklist.blockers.some((blocker) =>
          blocker.includes("production-live-data-counts.txt"),
        ) &&
        checklist.blockers.some((blocker) =>
          blocker.includes("production rollout packet"),
        ),
      message:
        "Checklist keeps packet and live-data-count blockers explicit before final invite-gate review.",
    },
    {
      key: "drift-guard-still-ready",
      passed: checklist.driftValidation.ready,
      message:
        "Checklist is still aligned with the production proof drift guard and launch-lane route metadata.",
    },
    {
      key: "boundary-language-safe",
      passed: !containsUnsafeProductionClaim(
        formatProductionSignedInRouteProofReadinessChecklist(checklist),
      ),
      message:
        "Checklist wording does not imply that sandbox, preview, staging, or sample evidence counts as production proof.",
    },
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

export function formatProductionSignedInRouteProofReadinessChecklist(
  checklist = getProductionSignedInRouteProofReadinessChecklist(),
): string {
  return [
    checklist.title,
    "",
    "Summary:",
    `- Packet provided: ${checklist.packetProvided ? "yes" : "no"}`,
    "- Production live data counts provided: no",
    "- This checklist is read-only. It does not sign in, create users, write Supabase rows, send invites, or query production data.",
    "",
    "Required production proof classes:",
    ...checklist.requiredClasses.map(
      (required) =>
        `- ${required.label}: ${required.expectedPath} using ${required.roleDetail}`,
    ),
    "",
    "What cannot count as proof:",
    ...formatList([
      "preview-cookie sessions",
      "local sandbox or localhost sessions",
      "Test/Figma rows or screenshots",
      "SOP/sample or staging evidence",
      "missing-profile/setup-only sessions",
      "fake screenshots or copied sandbox artifacts",
    ]),
    "",
    "Import and check sequence once real production evidence exists:",
    `- Import source rows: \`${checklist.commands.importProofRows}\``,
    `- Rebuild packet: \`${checklist.commands.rebuildPacket}\``,
    `- Check proof gaps: \`${checklist.commands.checkProofGaps}\``,
    `- Check proof readiness: \`${checklist.commands.checkProofReadiness}\``,
    `- Check route drift guard: \`${checklist.commands.checkProofDrift}\``,
    "",
    "Operator steps:",
    ...formatList(checklist.operatorSteps),
    "",
    "Current proof gaps:",
    ...checklist.gapReport.gaps.map(
      (gap) =>
        `- ${gap.label}: ${gap.status.toUpperCase()} (${gap.expectedPath}) - ${gap.detail}`,
    ),
    "",
    "Still blocked before final invite gate:",
    ...formatList(checklist.blockers),
    "",
    "Validation:",
    ...checklist.validation.checks.map(
      (check) => `- ${check.passed ? "PASS" : "FAIL"} ${check.message}`,
    ),
  ].join("\n");
}

function getChecklistBlockers(
  packet: ProductionRolloutBootstrapPacket | null,
  gapReport: ProductionSignedInRouteProofGapReport,
) {
  const blockers = [
    "production-live-data-counts.txt is still required separately before final invite-gate review.",
  ];

  if (packet === null) {
    blockers.push(
      "An approved production rollout packet is still missing, so real production signed-in proof cannot be marked ready.",
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

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`);
}

function containsUnsafeProductionClaim(text: string) {
  const normalized = text.toLowerCase();
  return [
    "sandbox counts as production proof",
    "preview counts as production proof",
    "staging counts as production proof",
    "sample evidence counts as production proof",
    "invite gate ready from sandbox",
  ].some((marker) => normalized.includes(marker));
}
