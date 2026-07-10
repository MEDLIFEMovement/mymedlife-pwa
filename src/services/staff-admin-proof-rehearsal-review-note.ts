import {
  buildStaffAdminProofRehearsalBrowserSnapshot,
  type StaffAdminProofRehearsalBrowserSnapshot,
} from "./staff-admin-proof-rehearsal-browser.ts";

export type StaffAdminProofRehearsalReviewNote = {
  title: string;
  summary: string;
  command: string;
  reviewChecklist: string[];
  routeTargets: string[];
  browserSnapshot: StaffAdminProofRehearsalBrowserSnapshot;
  markdown: string;
};

export type StaffAdminProofRehearsalReviewNoteOptions = {
  csvPath?: string;
  command?: string;
};

export type StaffAdminProofRehearsalReviewNoteConsistency = {
  ready: boolean;
  checks: Array<{
    key: string;
    passed: boolean;
    message: string;
  }>;
};

export function buildStaffAdminProofRehearsalReviewNote(
  csv: string,
  options: StaffAdminProofRehearsalReviewNoteOptions = {},
): StaffAdminProofRehearsalReviewNote {
  const command =
    options.command ??
    "pnpm staff-admin-proof-rehearsal --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv --out /tmp/staff-admin-proof-rehearsal.md --review-note-out /tmp/staff-admin-proof-rehearsal-review-note.md";
  const csvPath = options.csvPath ?? "tests/fixtures/staff-admin-proof-rehearsal.test.csv";
  const browserSnapshot = buildStaffAdminProofRehearsalBrowserSnapshot(csv);

  const reviewChecklist = [
    "Confirm the packet is TEST-only and does not count as production proof.",
    "Confirm the rows map to /staff?view=chapters for staff/support and /admin for DS Admin and Super Admin.",
    "Confirm the unauthorized member row still fails and stays visible in the packet.",
    "Confirm production evidence remains blocked until real hosted proof replaces the rehearsal rows.",
  ];

  const routeTargets = [
    "/staff?view=chapters",
    "/admin",
    "/app",
  ];

  const summary = [
    `Ready: ${browserSnapshot.summary.ready ? "yes" : "no"}`,
    `Staff rows: ${browserSnapshot.summary.staffRows}`,
    `Admin rows: ${browserSnapshot.summary.adminRows}`,
    `Passed rows: ${browserSnapshot.summary.passedRows}`,
    `Failed rows: ${browserSnapshot.summary.failedRows}`,
    `CSV source: ${csvPath}`,
  ].join(" | ");

  return {
    title: "Staff/Admin TEST rehearsal reviewer note",
    summary,
    command,
    reviewChecklist,
    routeTargets,
    browserSnapshot,
    markdown: formatMarkdown({
      csvPath,
      command,
      browserSnapshot,
      reviewChecklist,
      routeTargets,
    }),
  };
}

export function validateStaffAdminProofRehearsalReviewNote(
  note: StaffAdminProofRehearsalReviewNote,
): StaffAdminProofRehearsalReviewNoteConsistency {
  const checks = [
    {
      key: "title_mentions_test_rehearsal",
      passed: note.title === "Staff/Admin TEST rehearsal reviewer note",
      message: "The reviewer note title must stay scoped to the TEST rehearsal packet.",
    },
    {
      key: "summary_mentions_snapshot_counts",
      passed:
        note.summary.includes("Ready:") &&
        note.summary.includes("Staff rows:") &&
        note.summary.includes("Admin rows:") &&
        note.summary.includes("Passed rows:") &&
        note.summary.includes("Failed rows:"),
      message: "The reviewer note summary must expose the same snapshot counts as the packet.",
    },
    {
      key: "route_targets_are_member_safe",
      passed:
        note.routeTargets.length === 3 &&
        note.routeTargets[0] === "/staff?view=chapters" &&
        note.routeTargets[1] === "/admin" &&
        note.routeTargets[2] === "/app",
      message: "The reviewer note must keep the exact staff/admin/member route targets in order.",
    },
    {
      key: "markdown_states_test_only_boundary",
      passed:
        note.markdown.includes("TEST-only rehearsal output") &&
        note.markdown.includes("Blocked from production proof") &&
        note.markdown.includes("Keep the negative member row visible"),
      message: "The reviewer note markdown must keep the TEST-only boundary explicit.",
    },
    {
      key: "markdown_mentions_route_targets",
      passed:
        note.markdown.includes("/staff?view=chapters") &&
        note.markdown.includes("/admin") &&
        note.markdown.includes("/app"),
      message: "The reviewer note markdown must mention the same route targets for reviewer copy/paste.",
    },
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

function formatMarkdown({
  csvPath,
  command,
  browserSnapshot,
  reviewChecklist,
  routeTargets,
}: {
  csvPath: string;
  command: string;
  browserSnapshot: StaffAdminProofRehearsalBrowserSnapshot;
  reviewChecklist: string[];
  routeTargets: string[];
}) {
  return [
    "# Staff/Admin TEST rehearsal reviewer note",
    "",
    "This note is reviewer-facing only. It helps copy/paste the TEST rehearsal packet output without turning it into production evidence.",
    "",
    `CSV source: ${csvPath}`,
    `Command: ${command}`,
    "",
    "## What this is",
    "",
    "- A deterministic wrapper around the TEST rehearsal snapshot CLI output.",
    "- A local or staging-only handoff aid.",
    "- A reminder that production evidence is still blocked.",
    "",
    "## What this is not",
    "",
    "- Production signed-in proof.",
    "- A live route smoke result.",
    "- A rollout artifact.",
    "",
    "## Route Targets",
    "",
    ...routeTargets.map((route) => `- ${route}`),
    "",
    "## Reviewer Checklist",
    "",
    ...reviewChecklist.map((item) => `- ${item}`),
    "",
    "## Snapshot Summary",
    "",
    `- Ready: ${browserSnapshot.summary.ready ? "yes" : "no"}`,
    `- Staff rows: ${browserSnapshot.summary.staffRows}`,
    `- Admin rows: ${browserSnapshot.summary.adminRows}`,
    `- Passed rows: ${browserSnapshot.summary.passedRows}`,
    `- Failed rows: ${browserSnapshot.summary.failedRows}`,
    "",
    "## Safety Boundary",
    "",
    "- TEST-only rehearsal output.",
    "- Blocked from production proof.",
    "- Keep the negative member row visible so the packet remains honest.",
    "",
  ].join("\n");
}
