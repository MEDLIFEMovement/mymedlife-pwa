import {
  productionRolloutCsvTemplates,
  type ProductionRolloutCsvTemplate,
} from "./production-rollout-csv-templates.ts";
import {
  getProductionRolloutOwnerPacketAssembly,
  type ProductionRolloutOwnerPacketAssembly,
  type ProductionRolloutOwnerPacketFoundFile,
} from "./production-rollout-owner-packet-assembly.ts";
import { getProductionRolloutOwnerPackets } from "./production-rollout-owner-packets.ts";

export type ProductionRolloutOwnerPacketStatusOptions = {
  minimumChapterCount?: number;
  minimumStudentMembershipCount?: number;
  minimumPilotChapterCount?: number;
};

export type ProductionRolloutOwnerPacketFileStatus = {
  filename: string;
  sourcePath: string;
  rowCount: number;
  minimumRows: number;
  headerReady: boolean;
  ready: boolean;
  message: string;
};

export type ProductionRolloutOwnerPacketOwnerStatus = {
  ownerSlug: string;
  owner: string;
  purpose: string;
  ready: boolean;
  files: ProductionRolloutOwnerPacketFileStatus[];
  blockers: string[];
  nextSteps: string[];
};

export type ProductionRolloutOwnerPacketStatus = {
  readyForAssembly: boolean;
  readyForPacketBuild: boolean;
  sourceDirectoryName: string;
  outputDirectoryName: string;
  ownerCount: number;
  readyOwnerCount: number;
  owners: ProductionRolloutOwnerPacketOwnerStatus[];
  assembly: ProductionRolloutOwnerPacketAssembly;
  nextCommands: string[];
  safetyRules: string[];
};

export function getProductionRolloutOwnerPacketStatus({
  foundFiles,
  sourceDirectoryName = "rollout-owner-packets",
  outputDirectoryName = "rollout-csv",
  options = {},
}: {
  foundFiles: ProductionRolloutOwnerPacketFoundFile[];
  sourceDirectoryName?: string;
  outputDirectoryName?: string;
  options?: ProductionRolloutOwnerPacketStatusOptions;
}): ProductionRolloutOwnerPacketStatus {
  const assembly = getProductionRolloutOwnerPacketAssembly({
    foundFiles,
    sourceDirectoryName,
    outputDirectoryName,
  });
  const foundByPath = new Map(
    foundFiles.map((file) => [getOwnerFileKey(file), file]),
  );
  const templatesByFilename = new Map(
    productionRolloutCsvTemplates.map((template) => [template.filename, template]),
  );
  const owners = getProductionRolloutOwnerPackets().map((packet) => {
    const files = packet.files.map((filename) => {
      const template = getRequiredTemplate(templatesByFilename, filename);
      const sourcePath = `${packet.slug}/${filename}`;
      const found = foundByPath.get(sourcePath);
      const actualHeader = found ? getCsvHeader(found.content) : "";
      const expectedHeader = getTemplateHeader(template);
      const headerReady = Boolean(found) && actualHeader === expectedHeader;
      const rowCount = found ? getCsvDataRowCount(found.content) : 0;
      const minimumRows = getMinimumRows(filename, options);
      const ready = headerReady && rowCount >= minimumRows;

      return {
        filename,
        sourcePath,
        rowCount,
        minimumRows,
        headerReady,
        ready,
        message: getFileStatusMessage({
          filename,
          found: Boolean(found),
          actualHeader,
          expectedHeader,
          rowCount,
          minimumRows,
          headerReady,
        }),
      };
    });
    const blockers = files
      .filter((file) => !file.ready)
      .map((file) => file.message);

    return {
      ownerSlug: packet.slug,
      owner: packet.owner,
      purpose: packet.purpose,
      ready: blockers.length === 0,
      files,
      blockers,
      nextSteps: packet.nextSteps,
    };
  });
  const readyForPacketBuild =
    assembly.ready && owners.every((owner) => owner.ready);

  return {
    readyForAssembly: assembly.ready,
    readyForPacketBuild,
    sourceDirectoryName,
    outputDirectoryName,
    ownerCount: owners.length,
    readyOwnerCount: owners.filter((owner) => owner.ready).length,
    owners,
    assembly,
    nextCommands: getNextCommands({
      readyForPacketBuild,
      sourceDirectoryName,
      outputDirectoryName,
    }),
    safetyRules: [
      "This status check reads local owner CSV files only.",
      "It does not create users, write Supabase rows, call Luma, send invites, send email/SMS, trigger n8n, or change production config.",
      "Passing this status only means the owner folders are ready for assembly and deeper rollout validation.",
      "Do not invite students until the final invite gate passes.",
    ],
  };
}

export function formatProductionRolloutOwnerPacketStatusReport(
  status: ProductionRolloutOwnerPacketStatus,
) {
  const lines = [
    `# myMEDLIFE owner packet status: ${status.readyForPacketBuild ? "READY FOR PACKET BUILD" : "NOT READY"}`,
    "",
    `Source folder: ${status.sourceDirectoryName}`,
    `Target CSV folder: ${status.outputDirectoryName}`,
    `Assembly structure: ${status.readyForAssembly ? "READY" : "NOT READY"}`,
    `Owner progress: ${status.readyOwnerCount}/${status.ownerCount} owners ready`,
    "",
    "This is a pre-assembly status check. It does not prove production invite readiness.",
    "",
    ...formatAssemblyIssues(status.assembly),
    "## Owner Status",
    "",
    ...status.owners.flatMap(formatOwnerStatus),
    "## Next Commands",
    "",
    "```bash",
    ...status.nextCommands,
    "```",
    "",
    "## Safety Rules",
    "",
    ...status.safetyRules.map((rule) => `- ${rule}`),
    "",
  ];

  return lines.join("\n");
}

function formatOwnerStatus(owner: ProductionRolloutOwnerPacketOwnerStatus) {
  return [
    `### ${owner.owner}`,
    "",
    `Folder: ${owner.ownerSlug}`,
    `Status: ${owner.ready ? "READY" : "NOT READY"}`,
    owner.purpose,
    "",
    "Files:",
    ...owner.files.map(
      (file) =>
        `- ${file.filename}: ${file.rowCount}/${file.minimumRows} data rows - ${file.ready ? "ready" : file.message}`,
    ),
    "",
    "Blockers:",
    ...formatList(owner.blockers, "None"),
    "",
    "Owner next steps:",
    ...owner.nextSteps.map((step) => `- ${step}`),
    "",
  ];
}

function formatAssemblyIssues(assembly: ProductionRolloutOwnerPacketAssembly) {
  const issues = [
    ...assembly.missingFiles,
    ...assembly.duplicateFiles,
    ...assembly.unexpectedFiles,
    ...assembly.headerErrors,
  ];

  if (issues.length === 0) {
    return ["## Structure Issues", "", "- None.", ""];
  }

  return [
    "## Structure Issues",
    "",
    ...issues.map((issue) => `- ${issue.message}`),
    "",
  ];
}

function getMinimumRows(
  filename: string,
  options: ProductionRolloutOwnerPacketStatusOptions,
) {
  const minimumChapterCount = options.minimumChapterCount ?? 30;
  const minimumStudentMembershipCount =
    options.minimumStudentMembershipCount ?? 500;
  const minimumPilotChapterCount = options.minimumPilotChapterCount ?? 5;

  switch (filename) {
    case "chapters.csv":
    case "coach-assignments.csv":
    case "campaigns.csv":
    case "luma-calendars.csv":
      return minimumChapterCount;
    case "users.csv":
    case "memberships.csv":
      return minimumStudentMembershipCount;
    case "pilot-event-proof.csv":
      return minimumPilotChapterCount;
    case "launch-owners.csv":
      return 3;
    case "signed-in-route-proof.csv":
      return 4;
    case "staff-roles.csv":
      return 1;
    default:
      return 1;
  }
}

function getFileStatusMessage({
  filename,
  found,
  actualHeader,
  expectedHeader,
  rowCount,
  minimumRows,
  headerReady,
}: {
  filename: string;
  found: boolean;
  actualHeader: string;
  expectedHeader: string;
  rowCount: number;
  minimumRows: number;
  headerReady: boolean;
}) {
  if (!found) {
    return `${filename} is missing.`;
  }

  if (!headerReady) {
    return `${filename} has header "${actualHeader}", expected "${expectedHeader}".`;
  }

  if (rowCount < minimumRows) {
    return `${filename} needs ${minimumRows} ${pluralize("data row", minimumRows)}; current: ${rowCount}.`;
  }

  return `${filename} has enough rows for the next validation step.`;
}

function getNextCommands({
  readyForPacketBuild,
  sourceDirectoryName,
  outputDirectoryName,
}: {
  readyForPacketBuild: boolean;
  sourceDirectoryName: string;
  outputDirectoryName: string;
}) {
  if (!readyForPacketBuild) {
    return [
      `pnpm rollout:owner-status --owner-dir ${sourceDirectoryName} --out production-rollout-owner-packet-status.md`,
      `pnpm rollout:owner-requests --owner-dir ${sourceDirectoryName} --out production-rollout-owner-requests`,
      `pnpm rollout:owner-email-drafts --owner-dir ${sourceDirectoryName} --out production-rollout-owner-email-drafts`,
      "Ask each owner to fix the blockers in their folder.",
      "Rerun this status check before assembling the shared CSV folder.",
    ];
  }

  return [
    `pnpm rollout:assemble-owner-packets --owner-dir ${sourceDirectoryName} --out ${outputDirectoryName}`,
    `pnpm rollout:data-request --dir ${outputDirectoryName} --out production-rollout-data-request.md`,
    `pnpm rollout:check-csv --dir ${outputDirectoryName}`,
    "pnpm rollout:build \\",
    `  --chapters ${outputDirectoryName}/chapters.csv \\`,
    `  --users ${outputDirectoryName}/users.csv \\`,
    `  --memberships ${outputDirectoryName}/memberships.csv \\`,
    `  --staff-roles ${outputDirectoryName}/staff-roles.csv \\`,
    `  --coach-assignments ${outputDirectoryName}/coach-assignments.csv \\`,
    `  --campaigns ${outputDirectoryName}/campaigns.csv \\`,
    `  --luma-calendars ${outputDirectoryName}/luma-calendars.csv \\`,
    `  --pilot-event-proof ${outputDirectoryName}/pilot-event-proof.csv \\`,
    `  --launch-owners ${outputDirectoryName}/launch-owners.csv \\`,
    `  --signed-in-route-proof ${outputDirectoryName}/signed-in-route-proof.csv \\`,
    "  --out production-rollout-packet.json",
    "pnpm rollout:check production-rollout-packet.json",
  ];
}

function getRequiredTemplate(
  templatesByFilename: Map<string, ProductionRolloutCsvTemplate>,
  filename: string,
) {
  const template = templatesByFilename.get(filename);

  if (!template) {
    throw new Error(`Missing rollout CSV template for ${filename}.`);
  }

  return template;
}

function getOwnerFileKey({
  ownerSlug,
  filename,
}: {
  ownerSlug: string;
  filename: string;
}) {
  return `${ownerSlug}/${filename}`;
}

function getTemplateHeader(template: ProductionRolloutCsvTemplate) {
  return template.headers.join(",");
}

function getCsvHeader(content: string) {
  return (content.split(/\r?\n/, 1)[0] ?? "").replace(/^\uFEFF/, "").trim();
}

function getCsvDataRowCount(content: string) {
  return content
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => line.trim().length > 0).length;
}

function pluralize(label: string, count: number) {
  return count === 1 ? label : `${label}s`;
}

function formatList(items: string[], emptyLabel: string) {
  if (items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}
