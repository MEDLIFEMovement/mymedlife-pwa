import type {
  ProductionRolloutOwnerPacketOwnerStatus,
  ProductionRolloutOwnerPacketStatus,
} from "./production-rollout-owner-packet-status.ts";

export type ProductionRolloutOwnerRequestFile = {
  path: string;
  content: string;
};

export function getProductionRolloutOwnerRequestFiles(
  status: ProductionRolloutOwnerPacketStatus,
): ProductionRolloutOwnerRequestFile[] {
  return [
    {
      path: "README.md",
      content: formatProductionRolloutOwnerRequestIndex(status),
    },
    ...status.owners.map((owner) => ({
      path: `${owner.ownerSlug}.md`,
      content: formatProductionRolloutOwnerRequest(status, owner),
    })),
  ];
}

export function formatProductionRolloutOwnerRequestIndex(
  status: ProductionRolloutOwnerPacketStatus,
) {
  const lines = [
    `# myMEDLIFE rollout owner requests: ${getStatusLabel(status)}`,
    "",
    "Use this package to ask each owner for the exact launch rows still needed before inviting about 500 students across 30 chapters.",
    "",
    "This is a request package only. It does not create users, write Supabase rows, call Luma, send invites, send email/SMS, trigger n8n, or change production config.",
    "",
    `Source folder: ${status.sourceDirectoryName}`,
    `Target CSV folder after assembly: ${status.outputDirectoryName}`,
    `Owner progress: ${status.readyOwnerCount}/${status.ownerCount} owners ready`,
    `Assembly structure: ${status.readyForAssembly ? "READY" : "NOT READY"}`,
    "",
    "## How To Use",
    "",
    "1. Send each owner the matching Markdown file and their matching owner folder.",
    "2. Ask owners to fix only the blockers listed in their file.",
    "3. Keep the generated CSV headers unchanged.",
    "4. Rerun the status check before assembling the shared rollout CSV folder.",
    "",
    "## Owner Request Files",
    "",
    ...status.owners.map(
      (owner) =>
        `- ${owner.ownerSlug}.md: ${owner.owner} - ${owner.ready ? "ready" : `${owner.blockers.length} blocker(s)`}`,
    ),
    "",
    "## Commands",
    "",
    "```bash",
    `pnpm rollout:owner-status --owner-dir ${status.sourceDirectoryName} --out production-rollout-owner-packet-status.md`,
    `pnpm rollout:owner-requests --owner-dir ${status.sourceDirectoryName} --out production-rollout-owner-requests`,
    "```",
    "",
    "## Safety Rules",
    "",
    ...status.safetyRules.map((rule) => `- ${rule}`),
    "- Do not add passwords, temporary passwords, API keys, tokens, secrets, private notes, or helper columns.",
    "",
  ];

  return lines.join("\n");
}

export function formatProductionRolloutOwnerRequest(
  status: ProductionRolloutOwnerPacketStatus,
  owner: ProductionRolloutOwnerPacketOwnerStatus,
) {
  const lines = [
    `# ${owner.owner}`,
    "",
    owner.purpose,
    "",
    `Current status: ${owner.ready ? "READY" : "NOT READY"}`,
    `Source folder: ${status.sourceDirectoryName}/${owner.ownerSlug}`,
    "",
    "## Files To Fix",
    "",
    "| File | Current rows | Required rows | Header | Status |",
    "|---|---:|---:|---|---|",
    ...owner.files.map(
      (file) =>
        `| ${file.filename} | ${file.rowCount} | ${file.minimumRows} | ${file.headerReady ? "ready" : "fix header"} | ${file.ready ? "READY" : "NOT READY"} |`,
    ),
    "",
    "## Current Blockers",
    "",
    ...formatList(owner.blockers, "None. This owner folder is ready for the next validation step."),
    "",
    "## What To Do Next",
    "",
    ...owner.nextSteps.map((step) => `- ${step}`),
    "- Return the updated CSV files in the source folder listed above.",
    "- Rerun the owner status check before anyone assembles the final rollout CSV folder.",
    "",
    "## What Not To Include",
    "",
    "- No passwords or temporary passwords.",
    "- No API keys, tokens, secrets, Luma keys, Supabase keys, or private credentials.",
    "- No private notes, medical details, helper columns, or renamed CSV headers.",
    "- No test chapters or placeholder users in the production rollout packet.",
    "",
    "## Safety Reminder",
    "",
    "This request does not create accounts, send invitations, call Luma, write to Supabase, trigger n8n, or change production config. It only collects the real rows needed for review.",
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
