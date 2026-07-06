import {
  getProductionRolloutOwnerPacketFiles,
  getProductionRolloutOwnerPackets,
} from "./production-rollout-owner-packets.ts";
import {
  formatProductionRolloutOwnerPacketStatusReport,
  getProductionRolloutOwnerPacketStatus,
  type ProductionRolloutOwnerPacketStatus,
  type ProductionRolloutOwnerPacketStatusOptions,
} from "./production-rollout-owner-packet-status.ts";
import {
  getProductionRolloutOwnerRequestFiles,
} from "./production-rollout-owner-requests.ts";
import {
  getProductionRolloutOwnerEmailDraftFiles,
} from "./production-rollout-owner-email-drafts.ts";
import {
  getProductionRolloutOwnerSendTrackerFiles,
} from "./production-rollout-owner-send-tracker.ts";
import type {
  ProductionRolloutOwnerPacketFoundFile,
} from "./production-rollout-owner-packet-assembly.ts";

export type ProductionRolloutOwnerHandoffOptions = {
  outputDirectoryName?: string;
  ownerDirectoryName?: string;
  requestDirectoryName?: string;
  emailDraftDirectoryName?: string;
  sendTrackerDirectoryName?: string;
  statusFilename?: string;
  statusOptions?: ProductionRolloutOwnerPacketStatusOptions;
};

export type ProductionRolloutOwnerHandoffFile = {
  path: string;
  content: string;
};

export type ProductionRolloutOwnerHandoff = {
  ready: boolean;
  status: ProductionRolloutOwnerPacketStatus;
  files: ProductionRolloutOwnerHandoffFile[];
};

export function getProductionRolloutOwnerHandoff({
  outputDirectoryName = "production-rollout-owner-handoff",
  ownerDirectoryName = "rollout-owner-packets",
  requestDirectoryName = "production-rollout-owner-requests",
  emailDraftDirectoryName = "production-rollout-owner-email-drafts",
  sendTrackerDirectoryName = "production-rollout-owner-send-tracker",
  statusFilename = "production-rollout-owner-packet-status.md",
  statusOptions = {},
}: ProductionRolloutOwnerHandoffOptions = {}): ProductionRolloutOwnerHandoff {
  const ownerPacketFiles = getOwnerPacketHandoffFiles(ownerDirectoryName);
  const foundFiles = getFoundOwnerCsvFiles(ownerPacketFiles);
  const sourceDirectoryName = `${outputDirectoryName}/${ownerDirectoryName}`;
  const status = getProductionRolloutOwnerPacketStatus({
    foundFiles,
    sourceDirectoryName,
    outputDirectoryName: "rollout-csv",
    options: statusOptions,
  });
  const requestFiles = getProductionRolloutOwnerRequestFiles(status).map(
    (file) => ({
      path: `${requestDirectoryName}/${file.path}`,
      content: file.content,
    }),
  );
  const emailDraftFiles = getProductionRolloutOwnerEmailDraftFiles(status, {
    requestDirectoryName,
  }).map((file) => ({
    path: `${emailDraftDirectoryName}/${file.path}`,
    content: file.content,
  }));
  const sendTrackerFiles = getProductionRolloutOwnerSendTrackerFiles(status, {
    requestDirectoryName,
    emailDraftDirectoryName,
  }).map((file) => ({
    path: `${sendTrackerDirectoryName}/${file.path}`,
    content: file.content,
  }));
  const files = [
    {
      path: "README.md",
      content: formatProductionRolloutOwnerHandoffIndex({
        outputDirectoryName,
        ownerDirectoryName,
        requestDirectoryName,
        emailDraftDirectoryName,
        sendTrackerDirectoryName,
        statusFilename,
        status,
      }),
    },
    ...ownerPacketFiles,
    {
      path: statusFilename,
      content: formatProductionRolloutOwnerPacketStatusReport(status),
    },
    ...requestFiles,
    ...emailDraftFiles,
    ...sendTrackerFiles,
  ];

  return {
    ready: status.readyForPacketBuild,
    status,
    files,
  };
}

function formatProductionRolloutOwnerHandoffIndex({
  outputDirectoryName,
  ownerDirectoryName,
  requestDirectoryName,
  emailDraftDirectoryName,
  sendTrackerDirectoryName,
  statusFilename,
  status,
}: {
  outputDirectoryName: string;
  ownerDirectoryName: string;
  requestDirectoryName: string;
  emailDraftDirectoryName: string;
  sendTrackerDirectoryName: string;
  statusFilename: string;
  status: ProductionRolloutOwnerPacketStatus;
}) {
  return [
    `# myMEDLIFE 30-Chapter Owner Handoff Kit: ${status.readyForPacketBuild ? "READY" : "NOT READY"}`,
    "",
    "Use this folder to collect the real launch rows needed before inviting about 500 students across 30 chapters.",
    "",
    "This handoff kit is local file output only. It does not create users, write Supabase rows, call Luma, send invites, send email/SMS, trigger n8n, or change production config.",
    "",
    "## Current Status",
    "",
    `- owner progress: ${status.readyOwnerCount}/${status.ownerCount} owners ready`,
    `- owner packet structure: ${status.readyForAssembly ? "READY" : "NOT READY"}`,
    `- packet build readiness: ${status.readyForPacketBuild ? "READY" : "NOT READY"}`,
    "",
    "## Folder Contents",
    "",
    `- ${ownerDirectoryName}/: owner-specific README files and blank CSV templates to fill`,
    `- ${requestDirectoryName}/: owner-by-owner request docs generated from current blockers`,
    `- ${emailDraftDirectoryName}/: copy/paste email drafts for the owner request handoff`,
    `- ${sendTrackerDirectoryName}/: manual send/return tracker for owner packet follow-up`,
    `- ${statusFilename}: count and structure status report`,
    "- README.md: this top-level guide",
    "",
    "## Regenerate This Kit",
    "",
    "```bash",
    `pnpm rollout:owner-handoff --out ${outputDirectoryName}`,
    "```",
    "",
    "## Send Order",
    "",
    "1. Fill `production-rollout-owner-send-tracker/owner-recipient-assignments.csv` with the correct recipient emails when owner names are confirmed.",
    "2. Regenerate the send tracker with `--recipient-assignments` if you want recipient columns prefilled.",
    "3. Send each owner their matching folder under `rollout-owner-packets/`.",
    "4. Use each owner's matching email draft under `production-rollout-owner-email-drafts/`.",
    "5. Track sent/returned/validated status in `production-rollout-owner-send-tracker/owner-send-tracker.csv`.",
    "6. Include each owner's matching Markdown request under `production-rollout-owner-requests/`.",
    "7. Ask each owner to return only their completed CSV files.",
    "8. Rebuild this status before assembling the shared rollout CSV folder.",
    "9. Do not invite students until the final invite gate passes.",
    "",
    "## Commands After Owners Return Data",
    "",
    "```bash",
    `pnpm rollout:owner-status --owner-dir ${outputDirectoryName}/${ownerDirectoryName} --out ${statusFilename}`,
    `pnpm rollout:owner-requests --owner-dir ${outputDirectoryName}/${ownerDirectoryName} --out ${outputDirectoryName}/${requestDirectoryName}`,
    `pnpm rollout:owner-email-drafts --owner-dir ${outputDirectoryName}/${ownerDirectoryName} --out ${outputDirectoryName}/${emailDraftDirectoryName} --request-dir ${requestDirectoryName}`,
    `pnpm rollout:owner-send-tracker --owner-dir ${outputDirectoryName}/${ownerDirectoryName} --out ${outputDirectoryName}/${sendTrackerDirectoryName} --request-dir ${requestDirectoryName} --email-draft-dir ${emailDraftDirectoryName}`,
    `pnpm rollout:owner-recipient-decisions --owner-dir ${outputDirectoryName}/${ownerDirectoryName} --recipient-assignments ${outputDirectoryName}/${sendTrackerDirectoryName}/owner-recipient-assignments.csv --out production-rollout-owner-recipient-decisions.md`,
    `pnpm rollout:owner-recipients --owner-dir ${outputDirectoryName}/${ownerDirectoryName} --recipient-assignments ${outputDirectoryName}/${sendTrackerDirectoryName}/owner-recipient-assignments.csv --out production-rollout-owner-recipient-status.md`,
    `pnpm rollout:owner-send-tracker --owner-dir ${outputDirectoryName}/${ownerDirectoryName} --out ${outputDirectoryName}/${sendTrackerDirectoryName} --request-dir ${requestDirectoryName} --email-draft-dir ${emailDraftDirectoryName} --recipient-assignments ${outputDirectoryName}/${sendTrackerDirectoryName}/owner-recipient-assignments.csv`,
    `pnpm rollout:owner-followup --owner-dir ${outputDirectoryName}/${ownerDirectoryName} --tracker ${outputDirectoryName}/${sendTrackerDirectoryName}/owner-send-tracker.csv --out production-rollout-owner-followup-report.md`,
    `pnpm rollout:current-status --owner-dir ${outputDirectoryName}/${ownerDirectoryName} --recipient-assignments ${outputDirectoryName}/${sendTrackerDirectoryName}/owner-recipient-assignments.csv --out production-rollout-current-status.md`,
    `pnpm rollout:assemble-owner-packets --owner-dir ${outputDirectoryName}/${ownerDirectoryName} --out rollout-csv`,
    "pnpm rollout:check-csv --dir rollout-csv",
    "pnpm rollout:build \\",
    "  --chapters rollout-csv/chapters.csv \\",
    "  --users rollout-csv/users.csv \\",
    "  --memberships rollout-csv/memberships.csv \\",
    "  --staff-roles rollout-csv/staff-roles.csv \\",
    "  --coach-assignments rollout-csv/coach-assignments.csv \\",
    "  --campaigns rollout-csv/campaigns.csv \\",
    "  --luma-calendars rollout-csv/luma-calendars.csv \\",
    "  --pilot-event-proof rollout-csv/pilot-event-proof.csv \\",
    "  --launch-owners rollout-csv/launch-owners.csv \\",
    "  --signed-in-route-proof rollout-csv/signed-in-route-proof.csv \\",
    "  --out production-rollout-packet.json",
    "pnpm rollout:check production-rollout-packet.json",
    "pnpm production:live-data-proof-request --out production-live-data-proof-request.md",
    "pnpm production:invite-gate --packet production-rollout-packet.json --live-data-counts production-live-data-counts.txt --public-url https://www.mymedlife.org",
    "```",
    "",
    "## Safety Rules",
    "",
    ...status.safetyRules.map((rule) => `- ${rule}`),
    "- Do not add passwords, temporary passwords, API keys, tokens, secrets, private notes, or helper columns.",
    "- Do not create production users or send invitations from this kit.",
    "- After approved production apply, request count-only live-data proof before the final invite gate.",
    "- Keep the launch lane focused on login, member app, leader command center, staff command center, Luma events, RSVP, attendance/check-in, points, and leaderboards.",
    "",
  ].join("\n");
}

function getOwnerPacketHandoffFiles(ownerDirectoryName: string) {
  return [
    {
      path: `${ownerDirectoryName}/README.md`,
      content: "",
    },
    ...getProductionRolloutOwnerPackets().flatMap((packet) =>
      getProductionRolloutOwnerPacketFiles(packet).map((file) => ({
        path: `${ownerDirectoryName}/${packet.slug}/${file.path}`,
        content: file.content,
      })),
    ),
  ].map((file) =>
    file.path.endsWith(`${ownerDirectoryName}/README.md`)
      ? {
          path: file.path,
          content: formatOwnerDirectoryReadme(ownerDirectoryName),
        }
      : file,
  );
}

function formatOwnerDirectoryReadme(ownerDirectoryName: string) {
  const packets = getProductionRolloutOwnerPackets();

  return [
    "# myMEDLIFE owner CSV folders",
    "",
    "Fill these folders with real approved rollout data only.",
    "",
    "Do not add passwords, temporary passwords, API keys, tokens, secrets, private notes, or helper columns.",
    "",
    "Owner folders:",
    ...packets.map(
      (packet) =>
        `- ${packet.slug}: ${packet.owner} - ${packet.files.join(", ")}`,
    ),
    "",
    `Generated folder name: ${ownerDirectoryName}`,
    "",
  ].join("\n");
}

function getFoundOwnerCsvFiles(
  ownerPacketFiles: ProductionRolloutOwnerHandoffFile[],
): ProductionRolloutOwnerPacketFoundFile[] {
  return ownerPacketFiles
    .filter((file) => file.path.endsWith(".csv"))
    .map((file) => {
      const [, ownerSlug, filename] = file.path.split("/");

      if (!ownerSlug || !filename) {
        throw new Error(`Invalid owner packet file path: ${file.path}`);
      }

      return {
        ownerSlug,
        filename,
        content: file.content,
      };
    });
}
