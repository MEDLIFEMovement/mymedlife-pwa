import type {
  ProductionRolloutOwnerPacketOwnerStatus,
  ProductionRolloutOwnerPacketStatus,
} from "./production-rollout-owner-packet-status.ts";

export type ProductionRolloutOwnerFollowupTrackerRow = {
  ownerSlug: string;
  owner: string;
  recipientEmail: string;
  ccEmails: string;
  draftId: string;
  draftedAt: string;
  sendStatus: string;
  sentAt: string;
  returnedAt: string;
  validatedAt: string;
  notes: string;
};

export type ProductionRolloutOwnerFollowupRow = {
  ownerSlug: string;
  owner: string;
  ownerReady: boolean;
  trackerStatus: string;
  blockerCount: number;
  draftEvidence: string;
  issues: string[];
  nextAction: string;
};

export type ProductionRolloutOwnerFollowupReport = {
  ready: boolean;
  summary: {
    ownerCount: number;
    readyOwnerCount: number;
    draftedCount: number;
    sentCount: number;
    returnedCount: number;
    validatedCount: number;
    blockedCount: number;
    draftEvidenceCount: number;
    missingRecipientCount: number;
    issueCount: number;
  };
  rows: ProductionRolloutOwnerFollowupRow[];
  missingTrackerRows: string[];
  extraTrackerRows: string[];
};

const expectedHeaders = [
  "ownerSlug",
  "owner",
  "ready",
  "blockerCount",
  "emailDraftPath",
  "requestDocPath",
  "ownerFolderPath",
  "recipientEmail",
  "ccEmails",
  "sendStatus",
  "sentAt",
  "returnedAt",
  "validatedAt",
  "nextAction",
  "notes",
];

const validSendStatuses = new Set([
  "drafted",
  "sent",
  "returned",
  "validated",
  "blocked",
]);

export function getProductionRolloutOwnerFollowupReport({
  status,
  trackerCsv,
}: {
  status: ProductionRolloutOwnerPacketStatus;
  trackerCsv: string;
}): ProductionRolloutOwnerFollowupReport {
  const parsedTracker = parseOwnerSendTrackerCsv(trackerCsv);
  const trackerByOwnerSlug = new Map(
    parsedTracker.map((row) => [row.ownerSlug, row]),
  );
  const ownerSlugs = new Set(status.owners.map((owner) => owner.ownerSlug));
  const rows = status.owners.map((owner) =>
    getOwnerFollowupRow({
      owner,
      tracker: trackerByOwnerSlug.get(owner.ownerSlug),
    }),
  );
  const missingTrackerRows = status.owners
    .filter((owner) => !trackerByOwnerSlug.has(owner.ownerSlug))
    .map((owner) => owner.ownerSlug);
  const extraTrackerRows = parsedTracker
    .filter((row) => !ownerSlugs.has(row.ownerSlug))
    .map((row) => row.ownerSlug);
  const issueCount =
    rows.reduce((count, row) => count + row.issues.length, 0) +
    extraTrackerRows.length;

  return {
    ready: status.readyForPacketBuild && issueCount === 0,
    summary: {
      ownerCount: status.ownerCount,
      readyOwnerCount: status.readyOwnerCount,
      draftedCount: countStatus(rows, "drafted"),
      sentCount: countStatus(rows, "sent"),
      returnedCount: countStatus(rows, "returned"),
      validatedCount: countStatus(rows, "validated"),
      blockedCount: countStatus(rows, "blocked"),
      draftEvidenceCount: rows.filter((row) => row.draftEvidence !== "None")
        .length,
      missingRecipientCount: rows.filter((row) =>
        row.issues.some((issue) => issue === "recipientEmail is missing."),
      ).length,
      issueCount,
    },
    rows,
    missingTrackerRows,
    extraTrackerRows,
  };
}

export function formatProductionRolloutOwnerFollowupReport(
  report: ProductionRolloutOwnerFollowupReport,
) {
  const lines = [
    `# myMEDLIFE owner follow-up report: ${report.ready ? "READY" : "NOT READY"}`,
    "",
    "Use this report to chase the owner packet handoff before the 30-chapter invite gate.",
    "",
    "This report is read-only. It does not send email, create users, write Supabase rows, call Luma, send invites, trigger n8n, or change production config.",
    "",
    "## Summary",
    "",
    `- owner progress: ${report.summary.readyOwnerCount}/${report.summary.ownerCount} owners ready`,
    `- drafted: ${report.summary.draftedCount}`,
    `- sent: ${report.summary.sentCount}`,
    `- returned: ${report.summary.returnedCount}`,
    `- validated: ${report.summary.validatedCount}`,
    `- blocked: ${report.summary.blockedCount}`,
    `- draft evidence rows: ${report.summary.draftEvidenceCount}`,
    `- missing recipient emails: ${report.summary.missingRecipientCount}`,
    `- issue count: ${report.summary.issueCount}`,
    "",
    "## Owner Follow-Up",
    "",
    "| Owner | Tracker status | Owner folder | Draft evidence | Issues | Next action |",
    "|---|---|---|---|---|---|",
    ...report.rows.map(
      (row) =>
        `| ${row.owner} | ${row.trackerStatus} | ${row.ownerReady ? "READY" : "NOT READY"} | ${row.draftEvidence} | ${formatCellList(row.issues)} | ${row.nextAction} |`,
    ),
    "",
    "## Tracker Row Integrity",
    "",
    ...formatList(report.missingTrackerRows, "No missing tracker rows.", "Missing tracker rows:"),
    ...formatList(report.extraTrackerRows, "No extra tracker rows.", "Extra tracker rows:"),
    "",
    "## Next Commands",
    "",
    "```bash",
    "pnpm rollout:owner-status --owner-dir <owner-dir> --out production-rollout-owner-packet-status.md",
    "pnpm rollout:owner-followup --owner-dir <owner-dir> --tracker <tracker-csv> --out production-rollout-owner-followup-report.md",
    "```",
    "",
    "## Safety Rules",
    "",
    "- Keep the tracker free of passwords, temporary passwords, API keys, tokens, secrets, private notes, medical details, screenshots of private rows, and raw table exports.",
    "- Do not invite students until the final invite gate says READY and human approval is recorded.",
    "",
  ];

  return lines.join("\n");
}

export function parseOwnerSendTrackerCsv(
  csv: string,
): ProductionRolloutOwnerFollowupTrackerRow[] {
  const rows = parseCsvRows(csv);

  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => header.trim());

  for (const expectedHeader of expectedHeaders) {
    if (!headers.includes(expectedHeader)) {
      throw new Error(`Owner send tracker is missing header ${expectedHeader}.`);
    }
  }

  return dataRows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row, index) => {
      if (row.length !== headers.length) {
        throw new Error(
          `Owner send tracker row ${index + 2} has ${row.length} cells; expected ${headers.length}.`,
        );
      }

      const values = Object.fromEntries(
        headers.map((header, headerIndex) => [header, row[headerIndex].trim()]),
      );

      return {
        ownerSlug: values.ownerSlug ?? "",
        owner: values.owner ?? "",
        recipientEmail: values.recipientEmail ?? "",
        ccEmails: values.ccEmails ?? "",
        draftId: values.draftId ?? "",
        draftedAt: values.draftedAt ?? "",
        sendStatus: normalizeStatus(values.sendStatus ?? ""),
        sentAt: values.sentAt ?? "",
        returnedAt: values.returnedAt ?? "",
        validatedAt: values.validatedAt ?? "",
        notes: values.notes ?? "",
      };
    });
}

function getOwnerFollowupRow({
  owner,
  tracker,
}: {
  owner: ProductionRolloutOwnerPacketOwnerStatus;
  tracker?: ProductionRolloutOwnerFollowupTrackerRow;
}): ProductionRolloutOwnerFollowupRow {
  const trackerStatus = normalizeStatus(tracker?.sendStatus ?? "");
  const issues = getOwnerIssues({ owner, tracker, trackerStatus });

  return {
    ownerSlug: owner.ownerSlug,
    owner: owner.owner,
    ownerReady: owner.ready,
    trackerStatus,
    blockerCount: owner.blockers.length,
    draftEvidence: formatDraftEvidence(tracker),
    issues,
    nextAction: getNextAction({ owner, tracker, trackerStatus, issues }),
  };
}

function formatDraftEvidence(
  tracker?: ProductionRolloutOwnerFollowupTrackerRow,
) {
  if (!tracker) {
    return "None";
  }

  const evidence = [tracker.draftId, tracker.draftedAt].filter(Boolean);

  return evidence.length > 0 ? evidence.join("<br>") : "None";
}

function getOwnerIssues({
  owner,
  tracker,
  trackerStatus,
}: {
  owner: ProductionRolloutOwnerPacketOwnerStatus;
  tracker?: ProductionRolloutOwnerFollowupTrackerRow;
  trackerStatus: string;
}) {
  const issues: string[] = [];

  if (!tracker) {
    return ["Tracker row is missing."];
  }

  if (!tracker.recipientEmail) {
    issues.push("recipientEmail is missing.");
  }

  if (!validSendStatuses.has(trackerStatus)) {
    issues.push(`sendStatus must be one of ${[...validSendStatuses].join(", ")}.`);
  }

  if ((trackerStatus === "sent" || trackerStatus === "returned") && !tracker.sentAt) {
    issues.push("sentAt is missing.");
  }

  if (trackerStatus === "returned" && !tracker.returnedAt) {
    issues.push("returnedAt is missing.");
  }

  if (trackerStatus === "returned" && !owner.ready) {
    issues.push("Owner returned files, but owner folder is still not validated.");
  }

  if (trackerStatus === "validated" && !owner.ready) {
    issues.push("Tracker says validated, but owner folder is not ready.");
  }

  if (trackerStatus === "validated" && owner.ready && !tracker.validatedAt) {
    issues.push("validatedAt is missing.");
  }

  return issues;
}

function getNextAction({
  owner,
  tracker,
  trackerStatus,
  issues,
}: {
  owner: ProductionRolloutOwnerPacketOwnerStatus;
  tracker?: ProductionRolloutOwnerFollowupTrackerRow;
  trackerStatus: string;
  issues: string[];
}) {
  if (!tracker) {
    return "Regenerate or repair the owner send tracker.";
  }

  if (issues.some((issue) => issue === "recipientEmail is missing.")) {
    return "Add the correct owner recipient before sending.";
  }

  if (trackerStatus === "drafted") {
    if (tracker.draftId || tracker.draftedAt) {
      return "Review/send the Gmail draft, then update tracker to sent.";
    }

    return "Send the owner packet, request doc, and email draft.";
  }

  if (trackerStatus === "sent") {
    return "Follow up until completed CSV files are returned.";
  }

  if (trackerStatus === "returned" && !owner.ready) {
    return "Fix validation blockers, then rerun owner status.";
  }

  if (trackerStatus === "blocked") {
    return "Escalate the blocker to the launch owner.";
  }

  if (trackerStatus === "validated" && owner.ready && issues.length === 0) {
    return "Ready for shared CSV assembly when every owner is validated.";
  }

  return "Review the tracker issues and owner blockers.";
}

function countStatus(rows: ProductionRolloutOwnerFollowupRow[], status: string) {
  return rows.filter((row) => row.trackerStatus === status).length;
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
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

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (quoted) {
      if (char === "\"" && next === "\"") {
        cell += "\"";
        index += 1;
      } else if (char === "\"") {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}
