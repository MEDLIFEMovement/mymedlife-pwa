import {
  productionRolloutCsvTemplates,
  type ProductionRolloutCsvTemplate,
} from "./production-rollout-csv-templates.ts";
import { getProductionRolloutOwnerPackets } from "./production-rollout-owner-packets.ts";
import { getFigmaOrTestSeedEvidenceReason } from "../data/figma-test-seed-map.ts";

export type ProductionRolloutOwnerReturnedFile = {
  ownerSlug: string;
  filename: string;
  content: string;
};

export type ProductionRolloutOwnerReturnIntakeIssue = {
  ownerSlug?: string;
  filename?: string;
  message: string;
};

export type ProductionRolloutOwnerReturnIntakeFile = {
  ownerSlug: string;
  owner: string;
  filename: string;
  targetPath: string;
  dataRowCount: number;
};

export type ProductionRolloutOwnerReturnIntake = {
  readyToApply: boolean;
  applied: boolean;
  sourceDirectoryName: string;
  ownerDirectoryName: string;
  recipientAssignmentsPath?: string;
  ownerSendTrackerPath?: string;
  files: ProductionRolloutOwnerReturnIntakeFile[];
  issues: ProductionRolloutOwnerReturnIntakeIssue[];
  nextCommands: string[];
  safetyRules: string[];
};

type ExpectedReturnedFile = {
  ownerSlug: string;
  owner: string;
  filename: string;
  expectedHeader: string;
};

export function getProductionRolloutOwnerReturnIntake({
  returnedFiles,
  sourceDirectoryName = "returned-owner-packets",
  ownerDirectoryName = "rollout-owner-packets",
  recipientAssignmentsPath,
  ownerSendTrackerPath,
  applied = false,
}: {
  returnedFiles: ProductionRolloutOwnerReturnedFile[];
  sourceDirectoryName?: string;
  ownerDirectoryName?: string;
  recipientAssignmentsPath?: string;
  ownerSendTrackerPath?: string;
  applied?: boolean;
}): ProductionRolloutOwnerReturnIntake {
  const expectedFiles = getExpectedReturnedFiles();
  const expectedByPath = new Map(
    expectedFiles.map((file) => [getFileKey(file), file]),
  );
  const expectedByFilename = new Map(
    expectedFiles.map((file) => [file.filename, file]),
  );
  const duplicateIssues = getDuplicateIssues(returnedFiles);
  const returnedIssues = returnedFiles.flatMap((file) =>
    getReturnedFileIssues({
      file,
      expectedByPath,
      expectedByFilename,
    }),
  );
  const issues = [...duplicateIssues, ...returnedIssues];
  const files =
    issues.length === 0
      ? returnedFiles.map((file) => {
          const expected = expectedByPath.get(getFileKey(file));

          if (!expected) {
            throw new Error(`Unexpected returned file ${getFileKey(file)}.`);
          }

          return {
            ownerSlug: expected.ownerSlug,
            owner: expected.owner,
            filename: expected.filename,
            targetPath: `${ownerDirectoryName}/${expected.ownerSlug}/${expected.filename}`,
            dataRowCount: getDataRowCount(file.content),
          };
        })
      : [];

  return {
    readyToApply: returnedFiles.length > 0 && issues.length === 0,
    applied,
    sourceDirectoryName,
    ownerDirectoryName,
    recipientAssignmentsPath,
    ownerSendTrackerPath,
    files,
    issues,
    nextCommands: getNextCommands({
      ownerDirectoryName,
      recipientAssignmentsPath,
      ownerSendTrackerPath,
    }),
    safetyRules: [
      "This intake step reads returned owner CSV files and can copy them into local owner packet folders only when --apply is used.",
      "It does not create users, write Supabase rows, call Luma, send invites, send email/SMS, trigger n8n, or change production config.",
      "Returned CSVs must keep the generated headers and must not include passwords, temporary passwords, API keys, tokens, secrets, private notes, medical details, screenshots, or helper columns.",
      "Do not invite students until owner status, shared CSV validation, production live-data proof, and the final invite gate pass.",
    ],
  };
}

export function formatProductionRolloutOwnerReturnIntake(
  intake: ProductionRolloutOwnerReturnIntake,
) {
  const lines = [
    `# myMEDLIFE returned owner CSV intake: ${getStatusLabel(intake)}`,
    "",
    `Source folder: ${intake.sourceDirectoryName}`,
    `Owner packet folder: ${intake.ownerDirectoryName}`,
    ...(intake.recipientAssignmentsPath
      ? [`Owner recipient assignments: ${intake.recipientAssignmentsPath}`]
      : []),
    ...(intake.ownerSendTrackerPath
      ? [`Owner send tracker: ${intake.ownerSendTrackerPath}`]
      : []),
    `Mode: ${intake.applied ? "APPLIED" : "DRY RUN"}`,
    "",
    intake.readyToApply
      ? intake.applied
        ? "Returned CSVs were copied into the owner packet folder."
        : "Returned CSVs are safe to apply. Re-run with `--apply` to copy them into the owner packet folder."
      : "Fix the returned CSVs before copying them into the owner packet folder.",
    "",
    "## Returned Files",
    "",
    ...formatReturnedFiles(intake.files),
    "",
    "## Issues",
    "",
    ...formatIssues(intake.issues),
    "",
    "## Next Commands",
    "",
    "```bash",
    ...intake.nextCommands,
    "```",
    "",
    "## Safety Rules",
    "",
    ...intake.safetyRules.map((rule) => `- ${rule}`),
    "",
  ];

  return lines.join("\n");
}

function getNextCommands({
  ownerDirectoryName,
  recipientAssignmentsPath,
  ownerSendTrackerPath,
}: {
  ownerDirectoryName: string;
  recipientAssignmentsPath?: string;
  ownerSendTrackerPath?: string;
}) {
  const trackerPath =
    ownerSendTrackerPath ?? "production-rollout-owner-send-tracker/owner-send-tracker.csv";
  const commands = [
    `pnpm rollout:owner-status --owner-dir ${ownerDirectoryName} --out production-rollout-owner-packet-status.md`,
    `pnpm rollout:owner-followup --owner-dir ${ownerDirectoryName} --tracker ${trackerPath} --out production-rollout-owner-followup-report.md`,
  ];
  const currentStatusCommand = [
    `pnpm rollout:current-status --owner-dir ${ownerDirectoryName}`,
    ...(recipientAssignmentsPath ? [`--recipient-assignments ${recipientAssignmentsPath}`] : []),
    `--owner-send-tracker ${trackerPath}`,
    "--out production-rollout-current-status.md",
  ].join(" ");

  return [...commands, currentStatusCommand];
}

function getStatusLabel(intake: ProductionRolloutOwnerReturnIntake) {
  if (intake.applied && intake.readyToApply) {
    return "APPLIED";
  }

  return intake.readyToApply ? "READY TO APPLY" : "NOT READY";
}

function formatReturnedFiles(files: ProductionRolloutOwnerReturnIntakeFile[]) {
  if (files.length === 0) {
    return ["- No returned CSV files ready to apply."];
  }

  return files.map(
    (file) =>
      `- ${file.ownerSlug}/${file.filename}: ${file.dataRowCount} data row(s) -> ${file.targetPath}`,
  );
}

function formatIssues(issues: ProductionRolloutOwnerReturnIntakeIssue[]) {
  if (issues.length === 0) {
    return ["- None."];
  }

  return issues.map((issue) => `- ${issue.message}`);
}

function getReturnedFileIssues({
  file,
  expectedByPath,
  expectedByFilename,
}: {
  file: ProductionRolloutOwnerReturnedFile;
  expectedByPath: Map<string, ExpectedReturnedFile>;
  expectedByFilename: Map<string, ExpectedReturnedFile>;
}) {
  const expected = expectedByPath.get(getFileKey(file));
  const issues: ProductionRolloutOwnerReturnIntakeIssue[] = [];

  if (!expected) {
    const expectedOwner = expectedByFilename.get(file.filename);
    issues.push({
      ownerSlug: file.ownerSlug,
      filename: file.filename,
      message: expectedOwner
        ? `${file.filename} belongs in ${expectedOwner.ownerSlug}, not ${file.ownerSlug}.`
        : `${file.ownerSlug}/${file.filename} is not part of the production rollout owner packet.`,
    });

    return issues;
  }

  const actualHeader = getCsvHeader(file.content);

  if (actualHeader !== expected.expectedHeader) {
    issues.push({
      ownerSlug: file.ownerSlug,
      filename: file.filename,
      message: `${file.ownerSlug}/${file.filename} has header "${actualHeader}", expected "${expected.expectedHeader}".`,
    });
  }

  const dataRowCount = getDataRowCount(file.content);

  if (dataRowCount === 0) {
    issues.push({
      ownerSlug: file.ownerSlug,
      filename: file.filename,
      message: `${file.ownerSlug}/${file.filename} has no data rows. Return real approved launch rows or omit the file until it is ready.`,
    });
  }

  const rowShapeIssue = getRowShapeIssue(file.content);

  if (rowShapeIssue) {
    issues.push({
      ownerSlug: file.ownerSlug,
      filename: file.filename,
      message: `${file.ownerSlug}/${file.filename} ${rowShapeIssue}`,
    });
  }

  const placeholderIssue = getPlaceholderIssue(file.content);

  if (placeholderIssue) {
    issues.push({
      ownerSlug: file.ownerSlug,
      filename: file.filename,
      message: `${file.ownerSlug}/${file.filename} ${placeholderIssue}`,
    });
  }

  const testSeedIssue = getTestSeedIssue(file.content);

  if (testSeedIssue) {
    issues.push({
      ownerSlug: file.ownerSlug,
      filename: file.filename,
      message: `${file.ownerSlug}/${file.filename} ${testSeedIssue}`,
    });
  }

  const fakeEmailIssue = getFakeEmailIssue(file.content);

  if (fakeEmailIssue) {
    issues.push({
      ownerSlug: file.ownerSlug,
      filename: file.filename,
      message: `${file.ownerSlug}/${file.filename} ${fakeEmailIssue}`,
    });
  }

  const secretIssue = getSecretLikeIssue(file.content);

  if (secretIssue) {
    issues.push({
      ownerSlug: file.ownerSlug,
      filename: file.filename,
      message: `${file.ownerSlug}/${file.filename} appears to contain ${secretIssue}. Remove secrets before intake.`,
    });
  }

  return issues;
}

function getDuplicateIssues(files: ProductionRolloutOwnerReturnedFile[]) {
  const counts = new Map<string, number>();

  for (const file of files) {
    const key = getFileKey(file);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => {
      const [ownerSlug, filename] = key.split("/");

      return {
        ownerSlug,
        filename,
        message: `${key} appears more than once in the returned packet.`,
      };
    });
}

function getExpectedReturnedFiles(): ExpectedReturnedFile[] {
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
      ownerSlug: owner.ownerSlug,
      owner: owner.owner,
      filename: template.filename,
      expectedHeader: getTemplateHeader(template),
    };
  });
}

function getTemplateHeader(template: ProductionRolloutCsvTemplate) {
  return template.headers.join(",");
}

function getCsvHeader(content: string) {
  return content.split(/\r?\n/, 1)[0]?.trim() ?? "";
}

function getDataRowCount(content: string) {
  const [, ...rows] = content.split(/\r?\n/);

  return rows.filter((row) => row.trim().length > 0).length;
}

function getRowShapeIssue(content: string) {
  const [headerRow = "", ...bodyRows] = content.split(/\r?\n/);
  const expectedCellCount = splitCsvRow(headerRow).length;

  if (expectedCellCount === 0) {
    return "is missing a usable header row.";
  }

  for (const [index, row] of bodyRows.entries()) {
    if (row.trim().length === 0) {
      continue;
    }

    const actualCellCount = splitCsvRow(row).length;

    if (actualCellCount !== expectedCellCount) {
      return `row ${index + 2} has ${actualCellCount} cell(s); expected ${expectedCellCount}. Keep every returned row aligned to the generated header.`;
    }
  }

  return null;
}

function getPlaceholderIssue(content: string) {
  for (const [rowNumber, row] of getCsvRows(content)) {
    for (const value of Object.values(row)) {
      if (/<[^>\n]+>/.test(value) || /\b(TODO|TBD|PLACEHOLDER)\b/i.test(value)) {
        return `row ${rowNumber} contains template placeholder text. Replace TODO/TBD/PLACEHOLDER or <...> values before intake.`;
      }
    }
  }

  return null;
}

function getTestSeedIssue(content: string) {
  for (const [rowNumber, row] of getCsvRows(content)) {
    const reason = getFigmaOrTestSeedEvidenceReason(row);

    if (reason) {
      return `row ${rowNumber} contains Test/Figma sandbox evidence (${reason}). Replace it with real approved rollout data before intake.`;
    }
  }

  return null;
}

function getFakeEmailIssue(content: string) {
  for (const [rowNumber, row] of getCsvRows(content)) {
    for (const [header, value] of Object.entries(row)) {
      if (!header.toLowerCase().includes("email")) {
        continue;
      }

      if (looksLikeFakeEmail(value)) {
        return `row ${rowNumber} column ${header} uses test or placeholder email data (${value.trim()}). Replace it with an approved real email before intake.`;
      }
    }
  }

  return null;
}

function getSecretLikeIssue(content: string) {
  const patterns = [
    [/password\s*[=:,]/i, "a password field"],
    [/temporary[_\s-]*password/i, "a temporary password"],
    [/\bapi[_\s-]*key\b/i, "an API key"],
    [/\baccess[_\s-]*token\b/i, "an access token"],
    [/\brefresh[_\s-]*token\b/i, "a refresh token"],
    [/\bservice[_\s-]*role\b/i, "a service role secret"],
    [/bearer\s+[a-z0-9._-]+/i, "a bearer token"],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "a private key"],
    [/supabase[_\s-]*(anon|service|url|key)/i, "a Supabase credential"],
  ] as const;

  return patterns.find(([pattern]) => pattern.test(content))?.[1] ?? null;
}

function* getCsvRows(content: string): Generator<[number, Record<string, string>]> {
  const [headerRow = "", ...bodyRows] = content.split(/\r?\n/);
  const headers = splitCsvRow(headerRow);

  if (headers.length === 0) {
    return;
  }

  for (const [index, row] of bodyRows.entries()) {
    if (row.trim().length === 0) {
      continue;
    }

    const cells = splitCsvRow(row);

    if (cells.length !== headers.length) {
      continue;
    }

    yield [
      index + 2,
      Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] ?? ""])),
    ];
  }
}

function splitCsvRow(row: string) {
  return row.split(",").map((cell) => cell.trim());
}

function looksLikeFakeEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const emailParts = normalized.split("@");

  if (emailParts.length !== 2) {
    return true;
  }

  const [localPart, domain] = emailParts;
  const blockedLocalParts = new Set(["fake", "placeholder", "todo", "tbd"]);
  const blockedDomains = new Set([
    "example.com",
    "example.org",
    "example.net",
    "localhost",
    "mymedlife.test",
  ]);

  return (
    blockedLocalParts.has(localPart) ||
    localPart.startsWith("fake+") ||
    localPart.startsWith("placeholder+") ||
    blockedDomains.has(domain) ||
    domain.endsWith(".test")
  );
}

function getFileKey({
  ownerSlug,
  filename,
}: {
  ownerSlug: string;
  filename: string;
}) {
  return `${ownerSlug}/${filename}`;
}
