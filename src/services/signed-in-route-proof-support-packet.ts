import {
  buildProductionSignedInRouteProofImport,
  type ProductionSignedInRouteProofImportResult,
} from "./production-signed-in-route-proof-import.ts";
import {
  formatSignedInRouteProofRowGapSnapshot,
  getSignedInRouteProofRowGapSnapshot,
  type SignedInRouteProofRowGapSnapshot,
} from "./signed-in-route-proof-row-gap-snapshot.ts";
export {
  formatSignedInRouteProofOperatorMiniPacket,
} from "./signed-in-route-proof-operator-mini-packet.ts";
import {
  formatSignedInRouteProofOperatorMiniPacket,
  getSignedInRouteProofOperatorMiniPacket,
  type SignedInRouteProofOperatorMiniPacket,
} from "./signed-in-route-proof-operator-mini-packet.ts";
import {
  getSignedInRouteProofPreflightCard,
  type SignedInRouteProofPreflightCard,
} from "./signed-in-route-proof-preflight-card.ts";
import {
  formatSignedInRouteProofSupportPacketHeader,
} from "./signed-in-route-proof-support-packet-header.ts";
import {
  normalizeSignedInRouteProofSourceRows,
  type SignedInRouteProofNormalizedRow,
} from "./signed-in-route-proof-row-normalizer.ts";
import {
  formatProductionSignedInRouteProofReadinessChecklist,
  getProductionSignedInRouteProofReadinessChecklist,
  type ProductionSignedInRouteProofReadinessChecklist,
} from "./production-signed-in-route-proof-readiness.ts";
import type { ProductionRolloutBootstrapPacket } from "./production-rollout-bootstrap.ts";

export type SignedInRouteProofSupportPacket = {
  canReadPacket: boolean;
  title: string;
  summary: string;
  localOnly: true;
  sourceCsv: string;
  rowGapSnapshot: SignedInRouteProofRowGapSnapshot;
  operatorMiniPacket: SignedInRouteProofOperatorMiniPacket;
  preflightCard: SignedInRouteProofPreflightCard;
  importResult: ProductionSignedInRouteProofImportResult;
  readinessChecklist: ProductionSignedInRouteProofReadinessChecklist;
  noGoRules: string[];
  proofNotes: string[];
  nextSmallestGoal: string;
};

export function getSignedInRouteProofSupportPacket(
  packet: ProductionRolloutBootstrapPacket,
): SignedInRouteProofSupportPacket {
  const sourceCsv = buildSignedInRouteProofSourceCsv(packet);
  const rowGapSnapshot = getSignedInRouteProofRowGapSnapshot(
    packet.signedInRouteProof ?? [],
  );
  const operatorMiniPacket = getSignedInRouteProofOperatorMiniPacket(
    rowGapSnapshot,
  );
  const preflightCard = getSignedInRouteProofPreflightCard(rowGapSnapshot);
  const importResult = buildProductionSignedInRouteProofImport(sourceCsv);
  const readinessChecklist =
    getProductionSignedInRouteProofReadinessChecklist(packet);

  return {
    canReadPacket: true,
    title: "Signed-in route proof support packet",
    summary:
      "This packet keeps signed-in route proof local-only by turning the current rollout packet into an importable source CSV, then round-tripping it through the existing signed-in proof importer and read-only readiness checklist. It helps future evidence collection stay honest about member, leader, staff, and admin route proof without overlapping the pilot-proof or artifact-request lanes.",
    localOnly: true,
    sourceCsv,
    rowGapSnapshot,
    operatorMiniPacket,
    preflightCard,
    importResult,
    readinessChecklist,
    noGoRules: [
      "No live provider calls.",
      "No production writes or reads.",
      "No shared UI edits.",
      "No rollout-ready claim until real production route proof, live counts, and the approved rollout packet all exist separately.",
      "No duplicate leader runbook or external artifact-request work.",
    ],
    proofNotes: [
      "The source CSV is generated through the row normalizer so the fixture stays honest to the signed-in proof boundary.",
      "The row-gap snapshot shows accepted, missing, and unsafe row shapes before any readiness logic is involved.",
      "The operator mini-packet turns that row-gap snapshot into a compact, read-only action summary.",
      "The preflight card turns that summary into a reusable operator-facing decision card.",
      "The import result is read-only and can be inspected without enabling live provider writes.",
      "This packet is a support aid for signed-in route proof collection, not the invite gate itself.",
    ],
    nextSmallestGoal: readinessChecklist.blockers.some((blocker) =>
      blocker.includes("production-live-data-counts.txt"),
    )
      ? "Keep the signed-in proof checklist parked until live counts and the approved rollout packet exist."
      : "Collect real production route proof for member, leader, staff, and admin before any invite-gate claim.",
  };
}

export function formatSignedInRouteProofSupportPacket(
  packet: SignedInRouteProofSupportPacket,
): string {
  return [
    packet.canReadPacket
      ? "Signed-in route proof support packet: READY"
      : "Signed-in route proof support packet: NOT READY",
    "",
    "Counts:",
    `- source CSV proof rows: ${packet.importResult.counts.proofRows}`,
    `- source CSV passed rows: ${packet.importResult.counts.passedRows}`,
    `- source CSV workspaces: ${packet.importResult.counts.workspaces}`,
    "",
    formatSignedInRouteProofSupportPacketHeader(packet),
    "",
    "Row-gap snapshot:",
    formatSignedInRouteProofRowGapSnapshot(packet.rowGapSnapshot),
    "",
    formatSignedInRouteProofOperatorMiniPacket(packet.operatorMiniPacket),
    "",
    "No-go rules:",
    ...packet.noGoRules.map((rule) => `- ${rule}`),
    "",
    "Proof notes:",
    ...packet.proofNotes.map((note) => `- ${note}`),
    "",
    `Next smallest goal: ${packet.nextSmallestGoal}`,
    "",
    formatProductionSignedInRouteProofReadinessChecklist(packet.readinessChecklist),
    "",
    "Source CSV:",
    packet.sourceCsv.trimEnd(),
    "",
    "Normalized import CSV:",
    packet.importResult.signedInRouteProofCsv.trimEnd(),
  ].join("\n");
}

function buildSignedInRouteProofSourceCsv(
  packet: ProductionRolloutBootstrapPacket,
) {
  const normalizedRows = normalizeSignedInRouteProofSourceRows(
    packet.signedInRouteProof ?? [],
  );
  const rows = [
    [
      "email",
      "workspace",
      "observedPath",
      "status",
      "checkedAt",
      "notes",
    ],
    ...normalizedRows.map((proof) => normalizedSignedInRouteProofRowToCsv(proof)),
  ];

  return formatCsv(rows);
}

function normalizedSignedInRouteProofRowToCsv(
  row: SignedInRouteProofNormalizedRow,
) {
  return [
    row.email,
    row.workspace,
    row.observedPath,
    row.status,
    row.checkedAt,
    row.notes,
  ];
}

function formatCsv(rows: string[][]) {
  return `${rows.map((row) => row.map(formatCsvCell).join(",")).join("\n")}\n`;
}

function formatCsvCell(cell: string) {
  if (cell === "") {
    return "";
  }

  if (/["\n,]/.test(cell)) {
    return `"${cell.replaceAll('"', '""')}"`;
  }

  return cell;
}
