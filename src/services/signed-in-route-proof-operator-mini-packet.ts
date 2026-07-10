import type { SignedInRouteProofRowGapSnapshot } from "./signed-in-route-proof-row-gap-snapshot.ts";

export type SignedInRouteProofOperatorGapGroup = {
  label: string;
  rows: string[];
};

export type SignedInRouteProofOperatorMiniPacket = {
  title: string;
  legend: string[];
  gapGroups: SignedInRouteProofOperatorGapGroup[];
  blockedEvidenceExplanation: string;
  nextArtifactRequest: string;
  noGoRules: string[];
};

export function getSignedInRouteProofOperatorMiniPacket(
  snapshot: SignedInRouteProofRowGapSnapshot,
): SignedInRouteProofOperatorMiniPacket {
  return {
    title: "Signed-in proof operator mini-packet",
    legend: [
      "accepted workspaces = rows that normalized into the canonical signed-in proof shape",
      "missing workspaces = required member, leader, staff, or admin classes not yet represented",
      "unsafe rows = source rows rejected because they look preview/test/staging/sample/secret-shaped",
    ],
    gapGroups: [
      {
        label: "Accepted rows",
        rows:
          snapshot.acceptedWorkspaces.length > 0
            ? snapshot.acceptedWorkspaces
            : ["none"],
      },
      {
        label: "Missing rows",
        rows:
          snapshot.missingWorkspaces.length > 0
            ? snapshot.missingWorkspaces
            : ["none"],
      },
      {
        label: "Unsafe rows",
        rows:
          snapshot.unsafeSourceRows.length > 0
            ? snapshot.unsafeSourceRows
            : ["none"],
      },
    ],
    blockedEvidenceExplanation:
      "These gaps are support-only markers. They show which signed-in proof rows still need real production evidence or need unsafe evidence rewritten before any readiness gate can move.",
    nextArtifactRequest:
      "Send back one clean production signed-in proof row per missing workspace, with a real email, canonical route, passed status, and valid checkedAt timestamp.",
    noGoRules: [
      "No live provider calls.",
      "No production reads or writes.",
      "No shared UI edits.",
      "No rollout-ready claim from support packets alone.",
    ],
  };
}

export function formatSignedInRouteProofOperatorMiniPacket(
  packet: SignedInRouteProofOperatorMiniPacket,
): string {
  return [
    packet.title,
    "",
    "Legend:",
    ...packet.legend.map((item) => `- ${item}`),
    "",
    ...packet.gapGroups.flatMap((group) => [
      `${group.label}:`,
      ...group.rows.map((row) => `- ${row}`),
      "",
    ]),
    "Blocked-evidence explanation:",
    `- ${packet.blockedEvidenceExplanation}`,
    "",
    "Next artifact request:",
    `- ${packet.nextArtifactRequest}`,
    "",
    "No-go rules:",
    ...packet.noGoRules.map((rule) => `- ${rule}`),
  ].join("\n");
}
