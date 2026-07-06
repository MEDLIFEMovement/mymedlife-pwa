import type {
  ProductionRolloutOwnerPacketOwnerStatus,
  ProductionRolloutOwnerPacketStatus,
} from "./production-rollout-owner-packet-status.ts";

export type ProductionRolloutOwnerEmailDraftOptions = {
  requestDirectoryName?: string;
  launchOwnerLabel?: string;
};

export type ProductionRolloutOwnerEmailDraftFile = {
  path: string;
  content: string;
};

export function getProductionRolloutOwnerEmailDraftFiles(
  status: ProductionRolloutOwnerPacketStatus,
  {
    requestDirectoryName = "production-rollout-owner-requests",
    launchOwnerLabel = "launch owner",
  }: ProductionRolloutOwnerEmailDraftOptions = {},
): ProductionRolloutOwnerEmailDraftFile[] {
  return [
    {
      path: "README.md",
      content: formatProductionRolloutOwnerEmailDraftIndex({
        status,
        requestDirectoryName,
        launchOwnerLabel,
      }),
    },
    ...status.owners.map((owner) => ({
      path: `${owner.ownerSlug}.md`,
      content: formatProductionRolloutOwnerEmailDraft({
        status,
        owner,
        requestDirectoryName,
        launchOwnerLabel,
      }),
    })),
  ];
}

export function formatProductionRolloutOwnerEmailDraftIndex({
  status,
  requestDirectoryName,
  launchOwnerLabel,
}: {
  status: ProductionRolloutOwnerPacketStatus;
  requestDirectoryName: string;
  launchOwnerLabel: string;
}) {
  const lines = [
    `# myMEDLIFE rollout owner email drafts: ${getStatusLabel(status)}`,
    "",
    "Use these drafts to request the real owner rows needed before inviting about 500 students across 30 chapters.",
    "",
    "These are copy/paste drafts only. They do not send email, create users, write Supabase rows, call Luma, send invites, trigger n8n, or change production config.",
    "",
    `Source folder: ${status.sourceDirectoryName}`,
    `Owner progress: ${status.readyOwnerCount}/${status.ownerCount} owners ready`,
    `Launch owner label: ${launchOwnerLabel}`,
    "",
    "## How To Use",
    "",
    "1. Open the draft for one owner.",
    "2. Replace the bracketed To/Cc placeholders with the correct people.",
    "3. Attach or share that owner's matching CSV folder and request doc.",
    "4. Ask the owner to return only completed CSV files with unchanged headers.",
    "5. Rerun the owner status check after the files come back.",
    "",
    "## Draft Files",
    "",
    ...status.owners.map(
      (owner) =>
        `- ${owner.ownerSlug}.md: ${owner.owner} - ${owner.ready ? "ready" : `${owner.blockers.length} blocker(s)`}`,
    ),
    "",
    "## Include With Each Email",
    "",
    `- Owner request doc from ${requestDirectoryName}/`,
    `- Owner CSV folder from ${status.sourceDirectoryName}/`,
    "- This note that the request is data collection only, not an invite send.",
    "",
    "## Safety Rules",
    "",
    ...status.safetyRules.map((rule) => `- ${rule}`),
    "- Do not collect passwords, temporary passwords, API keys, tokens, secrets, private notes, medical details, or helper columns.",
    "",
  ];

  return lines.join("\n");
}

export function formatProductionRolloutOwnerEmailDraft({
  status,
  owner,
  requestDirectoryName,
  launchOwnerLabel,
}: {
  status: ProductionRolloutOwnerPacketStatus;
  owner: ProductionRolloutOwnerPacketOwnerStatus;
  requestDirectoryName: string;
  launchOwnerLabel: string;
}) {
  const ownerFolderPath = `${status.sourceDirectoryName}/${owner.ownerSlug}`;
  const requestDocPath = `${requestDirectoryName}/${owner.ownerSlug}.md`;
  const blockedFiles = owner.files.filter((file) => !file.ready);
  const filesToMention = blockedFiles.length > 0 ? blockedFiles : owner.files;
  const lines = [
    `Subject: myMEDLIFE rollout data request - ${owner.owner}`,
    "",
    `To: [${owner.owner} owner email]`,
    `Cc: [${launchOwnerLabel}] [DS/platform owner if needed]`,
    "",
    `Hi ${owner.owner},`,
    "",
    "We are preparing the first myMEDLIFE 30-chapter rollout. Before we can invite students, we need your part of the launch packet filled with real approved rows.",
    "",
    `Your current status is: ${owner.ready ? "READY" : "NOT READY"}.`,
    "",
    "What I need from you:",
    "",
    `- Complete the CSV files in ${ownerFolderPath}.`,
    `- Use the detailed request doc at ${requestDocPath}.`,
    "- Keep the CSV headers exactly as generated.",
    "- Return only the completed CSV files.",
    "",
    "Current blockers:",
    "",
    ...formatList(owner.blockers, "None. Your owner folder is ready for the next validation step."),
    "",
    "Files to check:",
    "",
    ...filesToMention.map(
      (file) =>
        `- ${file.filename}: ${file.rowCount}/${file.minimumRows} rows - ${file.ready ? "ready" : file.message}`,
    ),
    "",
    "Please do not include:",
    "",
    "- passwords or temporary passwords",
    "- API keys, tokens, Luma keys, Supabase keys, or secrets",
    "- private notes, medical details, helper columns, or renamed CSV headers",
    "- test chapters or placeholder users in the production rollout packet",
    "",
    "Safety note:",
    "",
    "This is only a data collection request. It does not create accounts, send invitations, write to Supabase, call Luma, trigger n8n, or change production config. We will run a separate invite gate after all owner rows are returned and validated.",
    "",
    "Thank you.",
    "",
  ];

  return lines.join("\n");
}

function getStatusLabel(status: ProductionRolloutOwnerPacketStatus) {
  return status.readyForPacketBuild ? "READY FOR PACKET BUILD" : "NOT READY";
}

function formatList(items: string[], emptyLabel: string) {
  if (items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}
