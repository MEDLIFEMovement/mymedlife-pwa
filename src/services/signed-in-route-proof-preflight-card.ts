import type { SignedInRouteProofRowGapSnapshot } from "./signed-in-route-proof-row-gap-snapshot.ts";

export type SignedInRouteProofPreflightGapGroup = {
  label: string;
  items: string[];
};

export type SignedInRouteProofPreflightCard = {
  title: string;
  legend: string[];
  gapGroups: SignedInRouteProofPreflightGapGroup[];
  nextStep: string;
  whatCountsLater: string;
  blockedEvidenceExplanation: string;
  noGoRules: string[];
};

export function getSignedInRouteProofPreflightCard(
  snapshot: SignedInRouteProofRowGapSnapshot,
): SignedInRouteProofPreflightCard {
  return {
    title: "Signed-in proof preflight decision card",
    legend: [
      "accepted workspaces = row shapes that normalized into the canonical signed-in proof boundary",
      "missing workspaces = required member, leader, staff, or admin classes not yet represented",
      "unsafe rows = source rows rejected because they look preview/test/staging/sample/secret-shaped",
    ],
    gapGroups: [
      {
        label: "Accepted rows",
        items:
          snapshot.acceptedWorkspaces.length > 0
            ? snapshot.acceptedWorkspaces
            : ["none"],
      },
      {
        label: "Missing rows",
        items:
          snapshot.missingWorkspaces.length > 0
            ? snapshot.missingWorkspaces
            : ["none"],
      },
      {
        label: "Unsafe rows",
        items:
          snapshot.unsafeSourceRows.length > 0
            ? snapshot.unsafeSourceRows
            : ["none"],
      },
    ],
    nextStep:
      snapshot.missingWorkspaces.length > 0
        ? `Send back one clean production signed-in proof row per missing workspace: ${snapshot.missingWorkspaces.join(", ")}.`
        : "Confirm the imported rows are still production-only, then wait for live counts and the approved rollout packet before any invite-gate claim.",
    whatCountsLater:
      "Later evidence must be real production signed-in proof rows with a real email, canonical route, passed status, and valid checkedAt timestamp. Preview/Test/Figma/staging/sample rows still do not count.",
    blockedEvidenceExplanation:
      "These gaps are support-only markers. They show what is still missing or unsafe before any readiness gate can move, but they do not prove rollout readiness themselves.",
    noGoRules: [
      "No live provider calls.",
      "No production reads or writes.",
      "No shared UI edits.",
      "No rollout-ready claim from support packets alone.",
    ],
  };
}

export function formatSignedInRouteProofPreflightCard(
  card: SignedInRouteProofPreflightCard,
): string {
  return [
    card.title,
    "",
    "Legend:",
    ...card.legend.map((item) => `- ${item}`),
    "",
    ...card.gapGroups.flatMap((group) => [
      `${group.label}:`,
      ...group.items.map((item) => `- ${item}`),
      "",
    ]),
    "Blocked-evidence explanation:",
    `- ${card.blockedEvidenceExplanation}`,
    "",
    "Exact next step:",
    `- ${card.nextStep}`,
    "",
    "What counts later:",
    `- ${card.whatCountsLater}`,
    "",
    "No-go rules:",
    ...card.noGoRules.map((rule) => `- ${rule}`),
  ].join("\n");
}
