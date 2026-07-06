import type {
  ProductionRolloutOwnerPacketStatus,
} from "./production-rollout-owner-packet-status.ts";
import type {
  ProductionRolloutOwnerRecipientAssignment,
} from "./production-rollout-owner-send-tracker.ts";

export type ProductionRolloutOwnerRecipientStatusRow = {
  ownerSlug: string;
  owner: string;
  recipientEmail: string;
  ccEmails: string;
  ready: boolean;
  issues: string[];
  nextAction: string;
};

export type ProductionRolloutOwnerRecipientStatus = {
  readyForOwnerPacketSend: boolean;
  summary: {
    ownerCount: number;
    assignedOwnerCount: number;
    missingRecipientCount: number;
    issueCount: number;
  };
  rows: ProductionRolloutOwnerRecipientStatusRow[];
  assignmentIssues: string[];
};

export function getProductionRolloutOwnerRecipientStatus({
  status,
  recipientAssignments,
}: {
  status: ProductionRolloutOwnerPacketStatus;
  recipientAssignments: ProductionRolloutOwnerRecipientAssignment[];
}): ProductionRolloutOwnerRecipientStatus {
  const assignmentIssues = getAssignmentIntegrityIssues({
    status,
    recipientAssignments,
  });
  const assignmentByOwnerSlug = new Map(
    recipientAssignments.map((assignment) => [
      assignment.ownerSlug,
      assignment,
    ]),
  );
  const rows = status.owners.map((owner) => {
    const assignment = assignmentByOwnerSlug.get(owner.ownerSlug);
    const issues = getOwnerRecipientIssues(assignment);

    return {
      ownerSlug: owner.ownerSlug,
      owner: owner.owner,
      recipientEmail: assignment?.recipientEmail ?? "",
      ccEmails: assignment?.ccEmails ?? "",
      ready: issues.length === 0,
      issues,
      nextAction:
        issues.length === 0
          ? "Ready to send owner packet."
          : "Add a valid recipient email before sending.",
    };
  });
  const issueCount =
    rows.reduce((count, row) => count + row.issues.length, 0) +
    assignmentIssues.length +
    (status.readyForAssembly ? 0 : 1);

  return {
    readyForOwnerPacketSend:
      status.readyForAssembly && issueCount === 0 && rows.length > 0,
    summary: {
      ownerCount: status.ownerCount,
      assignedOwnerCount: rows.filter((row) => row.ready).length,
      missingRecipientCount: rows.filter((row) =>
        row.issues.includes("recipientEmail is missing."),
      ).length,
      issueCount,
    },
    rows,
    assignmentIssues: [
      ...assignmentIssues,
      ...(status.readyForAssembly
        ? []
        : ["Owner packet folder structure is not ready for sendout."]),
    ],
  };
}

export function formatProductionRolloutOwnerRecipientStatus(
  status: ProductionRolloutOwnerRecipientStatus,
) {
  return [
    `# myMEDLIFE owner recipient readiness: ${status.readyForOwnerPacketSend ? "READY TO SEND" : "NOT READY"}`,
    "",
    "Use this report before sending the 30-chapter rollout owner packet handoff.",
    "",
    "This report is read-only. It does not send email, create users, write Supabase rows, call Luma, send invites, trigger n8n, or change production config.",
    "",
    "## Summary",
    "",
    `- owner recipients assigned: ${status.summary.assignedOwnerCount}/${status.summary.ownerCount}`,
    `- missing recipient emails: ${status.summary.missingRecipientCount}`,
    `- issue count: ${status.summary.issueCount}`,
    "",
    "## Owner Recipients",
    "",
    "| Owner | Recipient | CC | Status | Issues | Next action |",
    "|---|---|---|---|---|---|",
    ...status.rows.map(
      (row) =>
        `| ${row.owner} | ${row.recipientEmail || "Missing"} | ${row.ccEmails || "None"} | ${row.ready ? "READY" : "NOT READY"} | ${formatCellList(row.issues)} | ${row.nextAction} |`,
    ),
    "",
    "## Assignment Integrity",
    "",
    ...formatList(
      status.assignmentIssues,
      "No assignment integrity issues.",
      "Assignment issues:",
    ),
    "",
    "## Next Commands",
    "",
    "```bash",
    "pnpm rollout:owner-send-tracker --owner-dir <owner-dir> --out production-rollout-owner-send-tracker --recipient-assignments <owner-recipient-assignments.csv>",
    "pnpm rollout:owner-followup --owner-dir <owner-dir> --tracker production-rollout-owner-send-tracker/owner-send-tracker.csv --out production-rollout-owner-followup-report.md",
    "```",
    "",
    "## Safety Rules",
    "",
    "- Keep recipient assignment files free of passwords, temporary passwords, API keys, tokens, secrets, private notes, medical details, screenshots of private rows, and raw table exports.",
    "- Do not send broad student invitations from this owner handoff step.",
    "",
  ].join("\n");
}

function getAssignmentIntegrityIssues({
  status,
  recipientAssignments,
}: {
  status: ProductionRolloutOwnerPacketStatus;
  recipientAssignments: ProductionRolloutOwnerRecipientAssignment[];
}) {
  const ownerSlugs = new Set(status.owners.map((owner) => owner.ownerSlug));
  const seen = new Set<string>();
  const issues: string[] = [];

  for (const assignment of recipientAssignments) {
    if (!assignment.ownerSlug) {
      issues.push("Assignment row is missing ownerSlug.");
      continue;
    }

    if (seen.has(assignment.ownerSlug)) {
      issues.push(`Duplicate assignment row for ${assignment.ownerSlug}.`);
    }

    seen.add(assignment.ownerSlug);

    if (!ownerSlugs.has(assignment.ownerSlug)) {
      issues.push(`Unknown ownerSlug ${assignment.ownerSlug}.`);
    }

    if (hasUnsafeCell(assignment)) {
      issues.push(`Assignment row for ${assignment.ownerSlug} contains unsafe secret-like text.`);
    }
  }

  return issues;
}

function getOwnerRecipientIssues(
  assignment: ProductionRolloutOwnerRecipientAssignment | undefined,
) {
  const issues: string[] = [];

  if (!assignment) {
    return ["recipientEmail is missing."];
  }

  if (!assignment.recipientEmail) {
    issues.push("recipientEmail is missing.");
  } else if (!looksLikeEmail(assignment.recipientEmail)) {
    issues.push("recipientEmail must look like an email address.");
  }

  return issues;
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasUnsafeCell(assignment: ProductionRolloutOwnerRecipientAssignment) {
  const text = [
    assignment.recipientEmail,
    assignment.ccEmails,
    assignment.notes,
  ].join(" ");

  return /(password|api[_-]?key|secret|token|bearer|service[_-]?role|gho_)/i.test(
    text,
  );
}

function formatCellList(items: string[]) {
  if (items.length === 0) {
    return "None";
  }

  return items.join("<br>");
}

function formatList(items: string[], emptyLabel: string, label: string) {
  if (items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return [`- ${label}`, ...items.map((item) => `  - ${item}`)];
}
