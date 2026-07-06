/* global console, process */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:owner-email-drafts --owner-dir rollout-owner-packets --out production-rollout-owner-email-drafts [--request-dir production-rollout-owner-requests] [--launch-owner-label \"Nick / launch owner\"] [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5]",
  "",
  "This reads owner-specific rollout CSV folders and writes copy/paste email drafts for each owner.",
  "It does not send email, create users, write Supabase rows, call Luma, send invites, trigger n8n, or change production config.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const ownerDir = resolve(args.ownerDir);
  const outDir = resolve(args.out);
  const [
    {
      getProductionRolloutOwnerPacketStatus,
    },
    {
      getProductionRolloutOwnerEmailDraftFiles,
    },
    { getProductionRolloutOwnerPackets },
  ] = await Promise.all([
    import("../src/services/production-rollout-owner-packet-status.ts"),
    import("../src/services/production-rollout-owner-email-drafts.ts"),
    import("../src/services/production-rollout-owner-packets.ts"),
  ]);
  const foundFiles = await readOwnerPacketCsvFiles({
    ownerDir,
    knownOwnerSlugs: getProductionRolloutOwnerPackets().map((packet) => packet.slug),
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

  await mkdir(outDir, { recursive: true });

  for (const file of getProductionRolloutOwnerEmailDraftFiles(status, {
    requestDirectoryName: args.requestDir,
    launchOwnerLabel: args.launchOwnerLabel,
  })) {
    await writeFile(join(outDir, file.path), file.content);
  }

  console.log(`Production rollout owner email drafts written to ${outDir}`);
  console.log(`Current status: ${status.readyForPacketBuild ? "READY FOR PACKET BUILD" : "NOT READY"}`);
  console.log(`Owner progress: ${status.readyOwnerCount}/${status.ownerCount} owners ready`);
} catch (error) {
  console.error("Production rollout owner email drafts were not created.");
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

function parseArgs(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const ownerDir = getValue(args, "--owner-dir");
  const out = getValue(args, "--out");

  if (!ownerDir) {
    throw new Error("Missing required argument --owner-dir.");
  }

  if (!out) {
    throw new Error("Missing required argument --out.");
  }

  return {
    ownerDir,
    out,
    requestDir: getValue(args, "--request-dir") ?? "production-rollout-owner-requests",
    launchOwnerLabel: getValue(args, "--launch-owner-label") ?? "launch owner",
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
