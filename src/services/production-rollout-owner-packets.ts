import {
  getProductionRolloutCsvTemplateContent,
  productionRolloutCsvTemplates,
} from "./production-rollout-csv-templates.ts";
import { getProductionRolloutWorkbook } from "./production-rollout-workbook.ts";

export type ProductionRolloutOwnerPacket = {
  slug: string;
  owner: string;
  purpose: string;
  files: string[];
  nextSteps: string[];
};

export type ProductionRolloutOwnerPacketFile = {
  path: string;
  content: string;
};

const ownerPacketDefinitions: ProductionRolloutOwnerPacket[] = [
  {
    slug: "nick-hq-launch-owner",
    owner: "Nick / HQ launch owner",
    purpose: "Approve the 30 launch chapters and name support, rollback, and production apply owners.",
    files: ["chapters.csv", "launch-owners.csv"],
    nextSteps: [
      "Confirm these are the 30 chapters allowed into the first production rollout.",
      "Name active support, rollback, and production apply owners.",
      "Do not include test chapters, placeholder campuses, passwords, or private notes.",
    ],
  },
  {
    slug: "ds-launch-owner",
    owner: "DS / launch owner",
    purpose: "Prepare production users, staff roles, and post-apply signed-in route proof.",
    files: ["users.csv", "staff-roles.csv", "signed-in-route-proof.csv"],
    nextSteps: [
      "List every launch student, leader, coach, admin, DS admin, and owner in users.csv.",
      "Grant only the minimum required staff/admin access in staff-roles.csv.",
      "Fill signed-in-route-proof.csv only after production users and app rows exist.",
    ],
  },
  {
    slug: "chapter-launch-owners",
    owner: "Chapter launch owners",
    purpose: "Connect students and student leaders to their approved launch chapter roles.",
    files: ["memberships.csv"],
    nextSteps: [
      "Add approved members and student leaders for each launch chapter.",
      "Every active chapter needs at least one approved member and one approved leader.",
      "Keep students out of multiple launch chapters unless that is intentional and reviewed.",
    ],
  },
  {
    slug: "sales-coaching-lead",
    owner: "Sales / coaching lead",
    purpose: "Assign coach coverage for every launch chapter.",
    files: ["coach-assignments.csv"],
    nextSteps: [
      "Add one active coach assignment for every active launch chapter.",
      "Make sure every coach email is also listed in users.csv and staff-roles.csv.",
      "Use portfolio for ongoing support unless expansion is intentionally selected.",
    ],
  },
  {
    slug: "campaign-launch-owner",
    owner: "Campaign / launch owner",
    purpose: "Activate the launch campaign that powers events, RSVP, attendance, points, and leaderboards.",
    files: ["campaigns.csv"],
    nextSteps: [
      "Add one active launch campaign for every active chapter.",
      "Use the approved first-launch campaign name and slug convention.",
      "Keep non-launch campaigns out of the first 30-chapter packet.",
    ],
  },
  {
    slug: "luma-ds-owner",
    owner: "Luma / DS owner",
    purpose: "Map every launch chapter to the Luma calendar that owns its event lifecycle.",
    files: ["luma-calendars.csv"],
    nextSteps: [
      "Add one linked Luma calendar row for every active launch chapter.",
      "Use calendar IDs only; never paste a Luma API key, token, or secret.",
      "After approval, generate the runtime registry with pnpm rollout:luma-registry.",
    ],
  },
  {
    slug: "launch-owner-ds",
    owner: "Launch owner / DS",
    purpose: "Record five-chapter proof for RSVP, attendance, points, audit, outbox, and route evidence.",
    files: ["pilot-event-proof.csv"],
    nextSteps: [
      "Record at least five ready pilot chapters before broad invites.",
      "Each ready row needs RSVP, attendance, points, audit, zero-send outbox, route links, reviewer, and timestamp evidence.",
      "Do not treat event visibility alone as event-loop proof.",
    ],
  },
];

export function getProductionRolloutOwnerPackets() {
  return ownerPacketDefinitions.map((packet) => ({
    ...packet,
    files: [...packet.files],
    nextSteps: [...packet.nextSteps],
  }));
}

export function getProductionRolloutOwnerPacketFiles(
  packet: ProductionRolloutOwnerPacket,
): ProductionRolloutOwnerPacketFile[] {
  return [
    {
      path: "README.md",
      content: formatProductionRolloutOwnerPacketReadme(packet),
    },
    ...packet.files.map((filename) => ({
      path: filename,
      content: getTemplateContent(filename),
    })),
  ];
}

export function formatProductionRolloutOwnerPacketIndex(
  outputDirectoryName = "rollout-owner-packets",
) {
  const packets = getProductionRolloutOwnerPackets();
  const lines = [
    "# myMEDLIFE 30-Chapter Rollout Owner Packets",
    "",
    "Use these folders to collect the real launch data needed before inviting about 500 students across 30 chapters.",
    "",
    "This is a human data handoff. It does not create users, write Supabase rows, call Luma, send invites, send email/SMS, trigger n8n, or change production config.",
    "",
    "## Fill Order",
    "",
    "1. Nick / HQ launch owner confirms chapters and launch owners.",
    "2. DS / launch owner fills users and staff roles.",
    "3. Chapter launch owners fill memberships.",
    "4. Sales / coaching lead fills coach assignments.",
    "5. Campaign / launch owner fills campaigns.",
    "6. Luma / DS owner fills calendar mappings.",
    "7. Launch owner / DS fills five-chapter event-loop proof.",
    "8. DS / launch owner fills signed-in route proof after production data is applied.",
    "",
    "## Owner Folders",
    "",
    ...packets.flatMap((packet) => [
      `- ${packet.slug}: ${packet.owner} - ${packet.files.join(", ")}`,
    ]),
    "",
    "## Assemble The Final CSV Folder",
    "",
    "When the owner folders are filled, check owner readiness, assemble them into one shared `rollout-csv` folder, then run the validation sequence:",
    "",
    "```bash",
    `pnpm rollout:owner-status --owner-dir ${outputDirectoryName} --out production-rollout-owner-packet-status.md`,
    `pnpm rollout:owner-requests --owner-dir ${outputDirectoryName} --out production-rollout-owner-requests`,
    `pnpm rollout:assemble-owner-packets --owner-dir ${outputDirectoryName} --out rollout-csv`,
    "pnpm rollout:data-request --dir rollout-csv --out production-rollout-data-request.md",
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
    "```",
    "",
    "## Safety Rules",
    "",
    "- Use real approved MEDLIFE rollout data only.",
    "- Do not add passwords, temporary passwords, API keys, tokens, secrets, private notes, or helper columns.",
    "- Keep headers exactly as generated.",
    "- Keep the launch lane focused on login, member app, leader command center, staff command center, Luma events, RSVP, attendance/check-in, points, and leaderboards.",
    "- Do not invite students until the final invite gate passes.",
    "",
    `Generated folder name: ${outputDirectoryName}`,
    "",
  ];

  return lines.join("\n");
}

export function formatProductionRolloutOwnerPacketReadme(
  packet: ProductionRolloutOwnerPacket,
) {
  const workbookByFilename = new Map(
    getProductionRolloutWorkbook().map((section) => [section.filename, section]),
  );
  const lines = [
    `# ${packet.owner}`,
    "",
    packet.purpose,
    "",
    "This packet is for collecting launch data only. It does not create users, write Supabase rows, call Luma, send invites, or change production config.",
    "",
    "## Files To Fill",
    "",
    ...packet.files.flatMap((filename) => {
      const workbookSection = workbookByFilename.get(filename);

      if (!workbookSection) {
        return [`- ${filename}`];
      }

      return [
        `### ${filename}`,
        "",
        workbookSection.purpose,
        "",
        `Required for: ${workbookSection.requiredFor}`,
        "",
        "Headers:",
        `\`${workbookSection.headers.join(",")}\``,
        "",
        "Accepted values:",
        ...workbookSection.allowedValues.map((value) => `- ${value}`),
        "",
        "Checklist:",
        ...workbookSection.checklist.map((item) => `- ${item}`),
        "",
      ];
    }),
    "## Next Steps",
    "",
    ...packet.nextSteps.map((step) => `- ${step}`),
    "",
    "## Safety Rules",
    "",
    "- Do not add passwords, temporary passwords, API keys, tokens, secrets, private notes, or helper columns.",
    "- Do not rename, remove, or reorder CSV headers.",
    "- If a value is unknown, leave the row out until the owner can confirm it.",
    "",
  ];

  return lines.join("\n");
}

function getTemplateContent(filename: string) {
  const template = productionRolloutCsvTemplates.find(
    (candidate) => candidate.filename === filename,
  );

  if (!template) {
    throw new Error(`Unknown production rollout CSV template: ${filename}`);
  }

  return getProductionRolloutCsvTemplateContent(template);
}
