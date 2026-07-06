/* global console, process */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:owner-recipient-answers --answers owner-recipient-answers.txt --owner-dir rollout-owner-packets --out owner-recipient-assignments.csv [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5]",
  "",
  "This turns the owner-recipient decision worksheet copy/paste answer block into the recipient assignment CSV used by the rollout owner tracker.",
  "It does not send email, create users, write Supabase rows, call Luma, send invites, trigger n8n, or change production config.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const ownerDir = resolve(args.ownerDir);
  const answersPath = resolve(args.answers);
  const outPath = resolve(args.out);
  const [
    {
      getProductionRolloutOwnerPacketStatus,
    },
    { getProductionRolloutOwnerPackets },
    {
      getProductionRolloutOwnerRecipientStatus,
    },
    {
      parseProductionRolloutOwnerRecipientAnswerBlock,
    },
    {
      formatProductionRolloutOwnerRecipientAssignmentsCsvFromAssignments,
      hydrateProductionRolloutOwnerRecipientAssignments,
    },
  ] = await Promise.all([
    import("../src/services/production-rollout-owner-packet-status.ts"),
    import("../src/services/production-rollout-owner-packets.ts"),
    import("../src/services/production-rollout-owner-recipient-status.ts"),
    import("../src/services/production-rollout-owner-recipient-decisions.ts"),
    import("../src/services/production-rollout-owner-send-tracker.ts"),
  ]);
  const foundFiles = await readOwnerPacketCsvFiles({
    ownerDir,
    knownOwnerSlugs: getProductionRolloutOwnerPackets().map(
      (packet) => packet.slug,
    ),
  });
  const status = getProductionRolloutOwnerPacketStatus({
    foundFiles,
    sourceDirectoryName: args.ownerDir,
    outputDirectoryName: args.outputDirectoryName,
    options: {
      minimumChapterCount: args.minimumChapters,
      minimumStudentMembershipCount: args.minimumStudents,
      minimumPilotChapterCount: args.minimumPilotChapters,
    },
  });
  const parsedAssignments = parseProductionRolloutOwnerRecipientAnswerBlock(
    await readFile(answersPath, "utf8"),
  );

  assertKnownOwnerSlugs({
    status,
    recipientAssignments: parsedAssignments,
  });

  const recipientAssignments =
    hydrateProductionRolloutOwnerRecipientAssignments(
      status,
      parsedAssignments,
    );
  const recipientStatus = getProductionRolloutOwnerRecipientStatus({
    status,
    recipientAssignments,
  });

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(
    outPath,
    formatProductionRolloutOwnerRecipientAssignmentsCsvFromAssignments(
      recipientAssignments,
    ),
  );

  console.log(`Production rollout owner recipient assignments written to ${outPath}`);
  console.log(`Current status: ${recipientStatus.readyForOwnerPacketSend ? "READY TO SEND OWNER PACKETS" : "NOT READY"}`);
  console.log(`Owner recipients assigned: ${recipientStatus.summary.assignedOwnerCount}/${recipientStatus.summary.ownerCount}`);

  if (recipientStatus.assignmentIssues.length > 0) {
    console.log("");
    console.log("Assignment issues:");
    for (const issue of recipientStatus.assignmentIssues) {
      console.log(`- ${issue}`);
    }
  }

  console.log("");
  console.log("Next commands:");
  console.log(`pnpm rollout:owner-recipients --owner-dir ${args.ownerDir} --recipient-assignments ${args.out} --out production-rollout-owner-recipient-status.md`);
  console.log(`pnpm rollout:owner-send-tracker --owner-dir ${args.ownerDir} --out production-rollout-owner-send-tracker --recipient-assignments ${args.out}`);
  console.log(`pnpm rollout:current-status --owner-dir ${args.ownerDir} --recipient-assignments ${args.out} --out production-rollout-current-status.md`);

  process.exit(recipientStatus.readyForOwnerPacketSend ? 0 : 1);
} catch (error) {
  console.error("Production rollout owner recipient assignments were not created.");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

async function readOwnerPacketCsvFiles({ ownerDir, knownOwnerSlugs }) {
  const ownerFolders = await getOwnerFolders(ownerDir, knownOwnerSlugs);
  const foundFiles = [];

  for (const ownerSlug of ownerFolders) {
    const filenames = await getCsvFilenames(join(ownerDir, ownerSlug));

    for (const filename of filenames) {
      foundFiles.push({
        ownerSlug,
        filename,
        content: await readFile(join(ownerDir, ownerSlug, filename), "utf8"),
      });
    }
  }

  return foundFiles;
}

async function getOwnerFolders(ownerDir, knownOwnerSlugs) {
  const entries = await readdir(ownerDir, { withFileTypes: true });
  const folderNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  return [...new Set([...knownOwnerSlugs, ...folderNames])];
}

async function getCsvFilenames(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".csv"))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function assertKnownOwnerSlugs({ status, recipientAssignments }) {
  const knownOwnerSlugs = new Set(status.owners.map((owner) => owner.ownerSlug));
  const unknownOwnerSlugs = recipientAssignments
    .map((assignment) => assignment.ownerSlug)
    .filter((ownerSlug) => !knownOwnerSlugs.has(ownerSlug));

  if (unknownOwnerSlugs.length > 0) {
    throw new Error(
      `Owner recipient answer block has unknown ownerSlug ${unknownOwnerSlugs.join(", ")}.`,
    );
  }
}

function parseArgs(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const answers = getValue(args, "--answers");
  const ownerDir = getValue(args, "--owner-dir");
  const out = getValue(args, "--out");

  if (!answers) {
    throw new Error("Missing required argument --answers.");
  }

  if (!ownerDir) {
    throw new Error("Missing required argument --owner-dir.");
  }

  if (!out) {
    throw new Error("Missing required argument --out.");
  }

  return {
    answers,
    ownerDir,
    out,
    outputDirectoryName: getValue(args, "--csv-dir") ?? "rollout-csv",
    minimumChapters: getPositiveWholeNumberArg(args, "--minimum-chapters", 30),
    minimumStudents: getPositiveWholeNumberArg(args, "--minimum-students", 500),
    minimumPilotChapters: getPositiveWholeNumberArg(
      args,
      "--minimum-pilot-chapters",
      5,
    ),
  };
}

function getValue(args, name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));

  if (inline) {
    return inline.slice(name.length + 1);
  }

  const index = args.indexOf(name);

  if (index === -1) {
    return null;
  }

  return args[index + 1] ?? null;
}

function getPositiveWholeNumberArg(args, name, defaultValue) {
  const explicitValue = getValue(args, name);
  const parsed = Number(explicitValue ?? defaultValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return parsed;
}
