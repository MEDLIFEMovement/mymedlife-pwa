import type {
  ProductionRolloutOwnerPacketOwnerStatus,
  ProductionRolloutOwnerPacketStatus,
} from "./production-rollout-owner-packet-status.ts";

export type ProductionRolloutOwnerSendTrackerOptions = {
  requestDirectoryName?: string;
  emailDraftDirectoryName?: string;
  recipientAssignments?: ProductionRolloutOwnerRecipientAssignment[];
};

export type ProductionRolloutOwnerSendTrackerFile = {
  path: string;
  content: string;
};

export type ProductionRolloutOwnerRecipientAssignment = {
  ownerSlug: string;
  owner: string;
  recipientEmail: string;
  ccEmails: string;
  notes: string;
};

const trackerHeaders = [
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

const recipientAssignmentHeaders = [
  "ownerSlug",
  "owner",
  "recipientEmail",
  "ccEmails",
  "notes",
];

export function getProductionRolloutOwnerSendTrackerFiles(
  status: ProductionRolloutOwnerPacketStatus,
  {
    requestDirectoryName = "production-rollout-owner-requests",
    emailDraftDirectoryName = "production-rollout-owner-email-drafts",
    recipientAssignments = [],
  }: ProductionRolloutOwnerSendTrackerOptions = {},
): ProductionRolloutOwnerSendTrackerFile[] {
  const assignmentIssues = getRecipientAssignmentIssues({
    status,
    recipientAssignments,
  });

  if (assignmentIssues.length > 0) {
    throw new Error(assignmentIssues.join(" "));
  }

  return [
    {
      path: "README.md",
      content: formatProductionRolloutOwnerSendTrackerReadme({
        status,
        requestDirectoryName,
        emailDraftDirectoryName,
      }),
    },
    {
      path: "owner-send-tracker.csv",
      content: formatProductionRolloutOwnerSendTrackerCsv({
        status,
        requestDirectoryName,
        emailDraftDirectoryName,
        recipientAssignments,
      }),
    },
    {
      path: "owner-recipient-assignments.csv",
      content: formatProductionRolloutOwnerRecipientAssignmentsCsv(status),
    },
  ];
}

export function formatProductionRolloutOwnerSendTrackerReadme({
  status,
  requestDirectoryName,
  emailDraftDirectoryName,
}: {
  status: ProductionRolloutOwnerPacketStatus;
  requestDirectoryName: string;
  emailDraftDirectoryName: string;
}) {
  const lines = [
    `# myMEDLIFE owner send tracker: ${status.readyForPacketBuild ? "READY FOR PACKET BUILD" : "NOT READY"}`,
    "",
    "Use this tracker to manage the manual handoff for the 30-chapter rollout owner packets.",
    "",
    "This tracker is local file output only. It does not send email, create users, write Supabase rows, call Luma, send invites, trigger n8n, or change production config.",
    "",
    `Source folder: ${status.sourceDirectoryName}`,
    `Owner progress: ${status.readyOwnerCount}/${status.ownerCount} owners ready`,
    "",
    "## Files",
    "",
    "- `owner-send-tracker.csv`: one row per owner packet, with blank columns for recipient and send/return dates.",
    "- `owner-recipient-assignments.csv`: optional helper template for assigning packet recipients before regenerating the tracker.",
    `- request docs: ${requestDirectoryName}/`,
    `- email drafts: ${emailDraftDirectoryName}/`,
    "",
    "## How To Use",
    "",
    "1. Fill `recipientEmail` and `ccEmails` with the correct people.",
    "2. Set `sendStatus` to `drafted`, `sent`, `returned`, or `validated` as the owner handoff moves.",
    "3. Fill `sentAt`, `returnedAt`, and `validatedAt` with ISO dates when each step happens.",
    "4. Keep owner CSV headers unchanged when returned files are copied back.",
    "5. Rerun owner status and current status after every returned owner folder.",
    "6. Optional: fill `owner-recipient-assignments.csv`, then rerun the tracker command with `--recipient-assignments owner-recipient-assignments.csv` to prefill recipients.",
    "7. Before sending owner packets, run `pnpm rollout:owner-recipient-decisions --owner-dir <owner-dir> --recipient-assignments owner-recipient-assignments.csv --out production-rollout-owner-recipient-decisions.md`.",
    "8. Then run `pnpm rollout:owner-recipients --owner-dir <owner-dir> --recipient-assignments owner-recipient-assignments.csv --out production-rollout-owner-recipient-status.md`.",
    "",
    "## Status Values",
    "",
    "- `drafted`: the generated draft exists but has not been sent.",
    "- `sent`: the owner received their folder, request doc, and email draft.",
    "- `returned`: the owner sent completed CSVs back.",
    "- `validated`: the owner folder passed the owner status check.",
    "- `blocked`: the owner cannot provide the rows yet.",
    "",
    "## Safety Rules",
    "",
    ...status.safetyRules.map((rule) => `- ${rule}`),
    "- Do not add passwords, temporary passwords, API keys, tokens, secrets, private notes, medical details, or helper columns to the tracker or owner CSVs.",
    "",
  ];

  return lines.join("\n");
}

export function formatProductionRolloutOwnerSendTrackerCsv({
  status,
  requestDirectoryName,
  emailDraftDirectoryName,
  recipientAssignments = [],
}: {
  status: ProductionRolloutOwnerPacketStatus;
  requestDirectoryName: string;
  emailDraftDirectoryName: string;
  recipientAssignments?: ProductionRolloutOwnerRecipientAssignment[];
}) {
  const assignmentByOwnerSlug = new Map(
    recipientAssignments.map((assignment) => [
      assignment.ownerSlug,
      assignment,
    ]),
  );
  const rows = status.owners.map((owner) =>
    formatTrackerRow({
      status,
      owner,
      requestDirectoryName,
      emailDraftDirectoryName,
      recipientAssignment: assignmentByOwnerSlug.get(owner.ownerSlug),
    }),
  );

  return [
    trackerHeaders.join(","),
    ...rows.map((row) => trackerHeaders.map((header) => csv(row[header])).join(",")),
  ].join("\n") + "\n";
}

function formatTrackerRow({
  status,
  owner,
  requestDirectoryName,
  emailDraftDirectoryName,
  recipientAssignment,
}: {
  status: ProductionRolloutOwnerPacketStatus;
  owner: ProductionRolloutOwnerPacketOwnerStatus;
  requestDirectoryName: string;
  emailDraftDirectoryName: string;
  recipientAssignment?: ProductionRolloutOwnerRecipientAssignment;
}): Record<string, string> {
  return {
    ownerSlug: owner.ownerSlug,
    owner: owner.owner,
    ready: owner.ready ? "yes" : "no",
    blockerCount: String(owner.blockers.length),
    emailDraftPath: `${emailDraftDirectoryName}/${owner.ownerSlug}.md`,
    requestDocPath: `${requestDirectoryName}/${owner.ownerSlug}.md`,
    ownerFolderPath: `${status.sourceDirectoryName}/${owner.ownerSlug}`,
    recipientEmail: recipientAssignment?.recipientEmail ?? "",
    ccEmails: recipientAssignment?.ccEmails ?? "",
    sendStatus: owner.ready ? "validated" : "drafted",
    sentAt: "",
    returnedAt: "",
    validatedAt: "",
    nextAction: getNextAction(owner),
    notes: recipientAssignment?.notes ?? "",
  };
}

export function formatProductionRolloutOwnerRecipientAssignmentsCsv(
  status: ProductionRolloutOwnerPacketStatus,
) {
  return formatProductionRolloutOwnerRecipientAssignmentsCsvFromAssignments(
    status.owners.map((owner) => ({
      ownerSlug: owner.ownerSlug,
      owner: owner.owner,
      recipientEmail: "",
      ccEmails: "",
      notes: "",
    })),
  );
}

export function hydrateProductionRolloutOwnerRecipientAssignments(
  status: ProductionRolloutOwnerPacketStatus,
  recipientAssignments: ProductionRolloutOwnerRecipientAssignment[],
): ProductionRolloutOwnerRecipientAssignment[] {
  const assignmentByOwnerSlug = new Map(
    recipientAssignments.map((assignment) => [
      assignment.ownerSlug,
      assignment,
    ]),
  );

  return status.owners.map((owner) => {
    const assignment = assignmentByOwnerSlug.get(owner.ownerSlug);

    return {
      ownerSlug: owner.ownerSlug,
      owner: owner.owner,
      recipientEmail: assignment?.recipientEmail ?? "",
      ccEmails: assignment?.ccEmails ?? "",
      notes: assignment?.notes ?? "",
    };
  });
}

export function formatProductionRolloutOwnerRecipientAssignmentsCsvFromAssignments(
  recipientAssignments: ProductionRolloutOwnerRecipientAssignment[],
) {
  const rows: Record<string, string>[] = recipientAssignments.map((assignment) => ({
    ownerSlug: assignment.ownerSlug,
    owner: assignment.owner,
    recipientEmail: assignment.recipientEmail,
    ccEmails: assignment.ccEmails,
    notes: assignment.notes,
  }));

  return [
    recipientAssignmentHeaders.join(","),
    ...rows.map((row) =>
      recipientAssignmentHeaders.map((header) => csv(row[header])).join(","),
    ),
  ].join("\n") + "\n";
}

export function parseProductionRolloutOwnerRecipientAssignmentsCsv(
  content: string,
): ProductionRolloutOwnerRecipientAssignment[] {
  const rows = parseCsvRows(content);

  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => header.trim());

  for (const expectedHeader of recipientAssignmentHeaders) {
    if (!headers.includes(expectedHeader)) {
      throw new Error(`Owner recipient assignments are missing header ${expectedHeader}.`);
    }
  }

  return dataRows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row, index) => {
      if (row.length !== headers.length) {
        throw new Error(
          `Owner recipient assignment row ${index + 2} has ${row.length} cells; expected ${headers.length}.`,
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
        notes: values.notes ?? "",
      };
    });
}

function getRecipientAssignmentIssues({
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
      issues.push("Owner recipient assignment is missing ownerSlug.");
      continue;
    }

    if (seen.has(assignment.ownerSlug)) {
      issues.push(`Owner recipient assignment has duplicate ownerSlug ${assignment.ownerSlug}.`);
    }

    seen.add(assignment.ownerSlug);

    if (!ownerSlugs.has(assignment.ownerSlug)) {
      issues.push(`Owner recipient assignment has unknown ownerSlug ${assignment.ownerSlug}.`);
    }

    if (
      assignment.recipientEmail &&
      !assignment.recipientEmail.includes("@")
    ) {
      issues.push(`recipientEmail for ${assignment.ownerSlug} must look like an email address.`);
    }
  }

  return issues;
}

function getNextAction(owner: ProductionRolloutOwnerPacketOwnerStatus) {
  if (owner.ready) {
    return "Confirm this owner folder stays validated before packet assembly.";
  }

  return "Send the owner request, collect completed CSVs, then rerun owner status.";
}

function csv(value: string | undefined) {
  const safe = value ?? "";

  if (!/[",\n\r]/.test(safe)) {
    return safe;
  }

  return `"${safe.replaceAll("\"", "\"\"")}"`;
}

function parseCsvRows(csvContent: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csvContent.length; index += 1) {
    const char = csvContent[index];
    const next = csvContent[index + 1];

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
