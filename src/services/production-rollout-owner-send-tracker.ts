import type {
  ProductionRolloutOwnerPacketOwnerStatus,
  ProductionRolloutOwnerPacketStatus,
} from "./production-rollout-owner-packet-status.ts";

export type ProductionRolloutOwnerSendTrackerOptions = {
  requestDirectoryName?: string;
  emailDraftDirectoryName?: string;
};

export type ProductionRolloutOwnerSendTrackerFile = {
  path: string;
  content: string;
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

export function getProductionRolloutOwnerSendTrackerFiles(
  status: ProductionRolloutOwnerPacketStatus,
  {
    requestDirectoryName = "production-rollout-owner-requests",
    emailDraftDirectoryName = "production-rollout-owner-email-drafts",
  }: ProductionRolloutOwnerSendTrackerOptions = {},
): ProductionRolloutOwnerSendTrackerFile[] {
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
      }),
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
}: {
  status: ProductionRolloutOwnerPacketStatus;
  requestDirectoryName: string;
  emailDraftDirectoryName: string;
}) {
  const rows = status.owners.map((owner) =>
    formatTrackerRow({
      status,
      owner,
      requestDirectoryName,
      emailDraftDirectoryName,
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
}: {
  status: ProductionRolloutOwnerPacketStatus;
  owner: ProductionRolloutOwnerPacketOwnerStatus;
  requestDirectoryName: string;
  emailDraftDirectoryName: string;
}): Record<string, string> {
  return {
    ownerSlug: owner.ownerSlug,
    owner: owner.owner,
    ready: owner.ready ? "yes" : "no",
    blockerCount: String(owner.blockers.length),
    emailDraftPath: `${emailDraftDirectoryName}/${owner.ownerSlug}.md`,
    requestDocPath: `${requestDirectoryName}/${owner.ownerSlug}.md`,
    ownerFolderPath: `${status.sourceDirectoryName}/${owner.ownerSlug}`,
    recipientEmail: "",
    ccEmails: "",
    sendStatus: owner.ready ? "validated" : "drafted",
    sentAt: "",
    returnedAt: "",
    validatedAt: "",
    nextAction: getNextAction(owner),
    notes: "",
  };
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
