/* global console, process */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:owner-followup --owner-dir rollout-owner-packets --tracker production-rollout-owner-send-tracker/owner-send-tracker.csv --out production-rollout-owner-followup-report.md [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5]",
  "",
  "This reads owner-specific rollout CSV folders plus the manual send tracker and writes a follow-up report.",
  "It does not send email, create users, write Supabase rows, call Luma, send invites, trigger n8n, or change production config.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const ownerDir = resolve(args.ownerDir);
  const trackerPath = resolve(args.tracker);
  const outPath = resolve(args.out);
  const [
    {
      getProductionRolloutOwnerPacketStatus,
    },
    {
      formatProductionRolloutOwnerFollowupReport,
      getProductionRolloutOwnerFollowupReport,
    },
    { getProductionRolloutOwnerPackets },
  ] = await Promise.all([
    import("../src/services/production-rollout-owner-packet-status.ts"),
    import("../src/services/production-rollout-owner-followup-report.ts"),
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
  const report = getProductionRolloutOwnerFollowupReport({
    status,
    trackerCsv: await readFile(trackerPath, "utf8"),
  });

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, formatProductionRolloutOwnerFollowupReport(report));

  console.log(`Production rollout owner follow-up report written to ${outPath}`);
  console.log(`Current status: ${report.ready ? "READY" : "NOT READY"}`);
  console.log(`Owner progress: ${report.summary.readyOwnerCount}/${report.summary.ownerCount} owners ready`);
  console.log(`Tracker issues: ${report.summary.issueCount}`);
} catch (error) {
  console.error("Production rollout owner follow-up report was not created.");
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
  const tracker = getValue(args, "--tracker");
  const out = getValue(args, "--out");

  if (!ownerDir) {
    throw new Error("Missing required argument --owner-dir.");
  }

  if (!tracker) {
    throw new Error("Missing required argument --tracker.");
  }

  if (!out) {
    throw new Error("Missing required argument --out.");
  }

  return {
    ownerDir,
    tracker,
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
