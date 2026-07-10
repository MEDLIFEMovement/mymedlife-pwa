import {
  normalizeSignedInRouteProofSourceRow,
  type SignedInRouteProofSourceRowInput,
} from "./signed-in-route-proof-row-normalizer.ts";

export type SignedInRouteProofRowGapSnapshot = {
  title: string;
  sourceRowCount: number;
  normalizedRowCount: number;
  acceptedWorkspaces: string[];
  missingWorkspaces: string[];
  unsafeSourceRows: string[];
  notes: string[];
};

const expectedWorkspaces = [
  "student_app",
  "leader_command_center",
  "staff_command_center",
  "admin_backend",
] as const;

export function getSignedInRouteProofRowGapSnapshot(
  rows: ReadonlyArray<SignedInRouteProofSourceRowInput>,
): SignedInRouteProofRowGapSnapshot {
  const unsafeSourceRows: string[] = [];
  const acceptedRows: Array<{
    workspace: "student_app" | "leader_command_center" | "staff_command_center" | "admin_backend";
  }> = [];

  rows.forEach((row, index) => {
    try {
      acceptedRows.push(
        normalizeSignedInRouteProofSourceRow(row, index + 2),
      );
    } catch (error) {
      unsafeSourceRows.push(formatUnsafeRowLabel(index + 2, error));
    }
  });

  const acceptedWorkspaces = Array.from(
    new Set(acceptedRows.map((row) => row.workspace)),
  );
  const missingWorkspaces = expectedWorkspaces.filter(
    (workspace) => !acceptedWorkspaces.includes(workspace),
  );

  return {
    title: "Signed-in proof row-gap snapshot",
    sourceRowCount: rows.length,
    normalizedRowCount: acceptedRows.length,
    acceptedWorkspaces,
    missingWorkspaces,
    unsafeSourceRows,
    notes: [
      "This snapshot is support-only and no-write.",
      "It summarizes missing or unsafe signed-in proof source-row shapes before any readiness logic is involved.",
      "It does not verify route authorization, production counts, or rollout readiness.",
    ],
  };
}

export function formatSignedInRouteProofRowGapSnapshot(
  snapshot: SignedInRouteProofRowGapSnapshot,
): string {
  return [
    snapshot.title,
    "",
    `Source rows: ${snapshot.sourceRowCount}`,
    `Normalized rows: ${snapshot.normalizedRowCount}`,
    "",
    "Accepted workspaces:",
    ...snapshot.acceptedWorkspaces.map((workspace) => `- ${workspace}`),
    "",
    "Missing workspaces:",
    ...snapshot.missingWorkspaces.map((workspace) => `- ${workspace}`),
    "",
    "Unsafe source rows:",
    ...snapshot.unsafeSourceRows.map((row) => `- ${row}`),
    "",
    "Notes:",
    ...snapshot.notes.map((note) => `- ${note}`),
  ].join("\n");
}

function formatUnsafeRowLabel(rowNumber: number, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return `row ${rowNumber}: ${message}`;
}
