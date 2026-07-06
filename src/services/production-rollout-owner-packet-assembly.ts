import {
  productionRolloutCsvTemplates,
  type ProductionRolloutCsvTemplate,
} from "./production-rollout-csv-templates.ts";
import { getProductionRolloutOwnerPackets } from "./production-rollout-owner-packets.ts";

export type ProductionRolloutOwnerPacketFoundFile = {
  ownerSlug: string;
  filename: string;
  content: string;
};

export type ProductionRolloutOwnerPacketAssemblyFile = {
  filename: string;
  ownerSlug: string;
  owner: string;
  sourcePath: string;
  content: string;
};

export type ProductionRolloutOwnerPacketAssemblyIssue = {
  filename: string;
  ownerSlug?: string;
  message: string;
};

export type ProductionRolloutOwnerPacketAssembly = {
  ready: boolean;
  sourceDirectoryName: string;
  outputDirectoryName: string;
  files: ProductionRolloutOwnerPacketAssemblyFile[];
  missingFiles: ProductionRolloutOwnerPacketAssemblyIssue[];
  duplicateFiles: ProductionRolloutOwnerPacketAssemblyIssue[];
  unexpectedFiles: ProductionRolloutOwnerPacketAssemblyIssue[];
  headerErrors: ProductionRolloutOwnerPacketAssemblyIssue[];
  nextCommands: string[];
  safetyRules: string[];
};

type ExpectedOwnerPacketFile = {
  filename: string;
  ownerSlug: string;
  owner: string;
  expectedHeader: string;
};

export function getProductionRolloutOwnerPacketAssembly({
  foundFiles,
  sourceDirectoryName = "rollout-owner-packets",
  outputDirectoryName = "rollout-csv",
}: {
  foundFiles: ProductionRolloutOwnerPacketFoundFile[];
  sourceDirectoryName?: string;
  outputDirectoryName?: string;
}): ProductionRolloutOwnerPacketAssembly {
  const expectedFiles = getExpectedOwnerPacketFiles();
  const expectedByPath = new Map(
    expectedFiles.map((file) => [getOwnerFileKey(file), file]),
  );
  const templatesByFilename = new Map(
    productionRolloutCsvTemplates.map((template) => [template.filename, template]),
  );
  const foundByPath = new Map(
    foundFiles.map((file) => [getOwnerFileKey(file), file]),
  );
  const foundByFilename = groupFoundFilesByFilename(foundFiles);
  const missingFiles = expectedFiles
    .filter((expected) => !foundByPath.has(getOwnerFileKey(expected)))
    .map((expected) => ({
      filename: expected.filename,
      ownerSlug: expected.ownerSlug,
      message: `Missing ${expected.ownerSlug}/${expected.filename}.`,
    }));
  const duplicateFiles = [...foundByFilename.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([filename, files]) => ({
      filename,
      message: `${filename} appears in multiple owner folders: ${files
        .map((file) => file.ownerSlug)
        .join(", ")}.`,
    }));
  const unexpectedFiles = foundFiles
    .filter((file) => !expectedByPath.has(getOwnerFileKey(file)))
    .map((file) => ({
      filename: file.filename,
      ownerSlug: file.ownerSlug,
      message: templatesByFilename.has(file.filename)
        ? `${file.filename} belongs in ${getExpectedOwnerSlug(file.filename)}, not ${file.ownerSlug}.`
        : `${file.ownerSlug}/${file.filename} is not part of the production rollout CSV packet.`,
    }));
  const headerErrors = expectedFiles
    .flatMap((expected) => {
      const found = foundByPath.get(getOwnerFileKey(expected));

      if (!found) {
        return [];
      }

      const actualHeader = getCsvHeader(found.content);

      if (actualHeader === expected.expectedHeader) {
        return [];
      }

      return [
        {
          filename: expected.filename,
          ownerSlug: expected.ownerSlug,
          message: `${expected.ownerSlug}/${expected.filename} has header "${actualHeader}", expected "${expected.expectedHeader}".`,
        },
      ];
    });
  const ready =
    missingFiles.length === 0 &&
    duplicateFiles.length === 0 &&
    unexpectedFiles.length === 0 &&
    headerErrors.length === 0;
  const files = expectedFiles.flatMap((expected) => {
    const found = foundByPath.get(getOwnerFileKey(expected));

    if (!found) {
      return [];
    }

    return [
      {
        filename: expected.filename,
        ownerSlug: expected.ownerSlug,
        owner: expected.owner,
        sourcePath: `${expected.ownerSlug}/${expected.filename}`,
        content: ensureTrailingNewline(found.content),
      },
    ];
  });

  return {
    ready,
    sourceDirectoryName,
    outputDirectoryName,
    files,
    missingFiles,
    duplicateFiles,
    unexpectedFiles,
    headerErrors,
    nextCommands: [
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
    ],
    safetyRules: [
      "This assembly step writes local CSV files only.",
      "It does not create users, write Supabase rows, call Luma, send invites, send email/SMS, trigger n8n, or change production config.",
      "Do not invite students until the final invite gate passes.",
    ],
  };
}

export function formatProductionRolloutOwnerPacketAssemblyReport(
  assembly: ProductionRolloutOwnerPacketAssembly,
) {
  const issueSections = [
    ["Missing Files", assembly.missingFiles],
    ["Duplicate Files", assembly.duplicateFiles],
    ["Unexpected Files", assembly.unexpectedFiles],
    ["Header Errors", assembly.headerErrors],
  ] as const;
  const lines = [
    `# myMEDLIFE owner packet assembly: ${assembly.ready ? "READY" : "NOT READY"}`,
    "",
    `Source folder: ${assembly.sourceDirectoryName}`,
    `Output folder: ${assembly.outputDirectoryName}`,
    "",
    assembly.ready
      ? "The owner packet folders can be assembled into one rollout CSV folder."
      : "Fix the owner packet folders before assembling the rollout CSV folder.",
    "",
    "## Files To Assemble",
    "",
    ...assembly.files.map(
      (file) => `- ${file.filename}: ${file.owner} (${file.sourcePath})`,
    ),
    "",
    ...issueSections.flatMap(([title, issues]) => formatIssueSection(title, issues)),
    "## Next Commands",
    "",
    "Run these after the assembled CSV folder exists:",
    "",
    "```bash",
    ...assembly.nextCommands,
    "```",
    "",
    "## Safety Rules",
    "",
    ...assembly.safetyRules.map((rule) => `- ${rule}`),
    "",
  ];

  return lines.join("\n");
}

function getExpectedOwnerPacketFiles(): ExpectedOwnerPacketFile[] {
  const ownersByFilename = new Map(
    getProductionRolloutOwnerPackets().flatMap((packet) =>
      packet.files.map((filename) => [
        filename,
        {
          ownerSlug: packet.slug,
          owner: packet.owner,
        },
      ]),
    ),
  );

  return productionRolloutCsvTemplates.map((template) => {
    const owner = ownersByFilename.get(template.filename);

    if (!owner) {
      throw new Error(`Missing owner packet mapping for ${template.filename}.`);
    }

    return {
      filename: template.filename,
      ownerSlug: owner.ownerSlug,
      owner: owner.owner,
      expectedHeader: getTemplateHeader(template),
    };
  });
}

function groupFoundFilesByFilename(files: ProductionRolloutOwnerPacketFoundFile[]) {
  const groups = new Map<string, ProductionRolloutOwnerPacketFoundFile[]>();

  for (const file of files) {
    groups.set(file.filename, [...(groups.get(file.filename) ?? []), file]);
  }

  return groups;
}

function getExpectedOwnerSlug(filename: string) {
  return getExpectedOwnerPacketFiles().find((file) => file.filename === filename)
    ?.ownerSlug;
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

function ensureTrailingNewline(content: string) {
  return `${content.trimEnd()}\n`;
}

function formatIssueSection(
  title: string,
  issues: ProductionRolloutOwnerPacketAssemblyIssue[],
) {
  if (issues.length === 0) {
    return [`## ${title}`, "", "- None.", ""];
  }

  return [
    `## ${title}`,
    "",
    ...issues.map((issue) => `- ${issue.message}`),
    "",
  ];
}
