/* global console, process */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:owner-return-intake --returns-dir returned-owner-packets --owner-dir rollout-owner-packets --out production-rollout-owner-return-intake.md [--recipient-assignments owner-recipient-assignments.csv] [--owner-send-tracker owner-send-tracker.csv] [--apply]",
  "",
  "This reads returned owner CSV folders, validates headers and secret safety, and optionally copies safe CSVs into the owner packet folder.",
  "It does not create users, write Supabase rows, call Luma, send invites, trigger n8n, or change production config.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const returnsDir = resolve(args.returnsDir);
  const ownerDir = resolve(args.ownerDir);
  const outPath = resolve(args.out);
  const [
    {
      formatProductionRolloutOwnerReturnIntake,
      getProductionRolloutOwnerReturnIntake,
    },
    { getProductionRolloutOwnerPackets },
  ] = await Promise.all([
    import("../src/services/production-rollout-owner-return-intake.ts"),
    import("../src/services/production-rollout-owner-packets.ts"),
  ]);
  const returnedFiles = await readReturnedCsvFiles({
    returnsDir,
    knownOwnerSlugs: getProductionRolloutOwnerPackets().map((packet) => packet.slug),
  });
  const dryRun = getProductionRolloutOwnerReturnIntake({
    returnedFiles,
    sourceDirectoryName: args.returnsDir,
    ownerDirectoryName: args.ownerDir,
    recipientAssignmentsPath: args.recipientAssignments,
    ownerSendTrackerPath: args.ownerSendTracker,
    applied: false,
  });

  let intake = dryRun;

  if (args.apply) {
    if (!dryRun.readyToApply) {
      throw new Error("Returned owner CSVs are not safe to apply. Fix the report issues first.");
    }

    await applyReturnedFiles({ ownerDir, returnedFiles: dryRun.files, sourceFiles: returnedFiles });
    intake = getProductionRolloutOwnerReturnIntake({
      returnedFiles,
      sourceDirectoryName: args.returnsDir,
      ownerDirectoryName: args.ownerDir,
      recipientAssignmentsPath: args.recipientAssignments,
      ownerSendTrackerPath: args.ownerSendTracker,
      applied: true,
    });
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, formatProductionRolloutOwnerReturnIntake(intake));

  console.log(`Production rollout owner return intake report written to ${outPath}`);
  console.log(`Current status: ${intake.readyToApply ? (intake.applied ? "APPLIED" : "READY TO APPLY") : "NOT READY"}`);
  console.log(`Returned files: ${intake.files.length}`);
  console.log(`Issues: ${intake.issues.length}`);

  process.exit(intake.readyToApply ? 0 : 1);
} catch (error) {
  console.error("Production rollout owner return intake: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

async function readReturnedCsvFiles({ returnsDir, knownOwnerSlugs }) {
  const ownerFolders = await getOwnerFolders(returnsDir, knownOwnerSlugs);
  const files = [];

  for (const ownerSlug of ownerFolders) {
    const ownerPath = join(returnsDir, ownerSlug);
    const filenames = await getCsvFilenames(ownerPath);

    for (const filename of filenames) {
      files.push({
        ownerSlug,
        filename,
        content: await readFile(join(ownerPath, filename), "utf8"),
      });
    }
  }

  return files;
}

async function applyReturnedFiles({ ownerDir, returnedFiles, sourceFiles }) {
  const sourceByKey = new Map(
    sourceFiles.map((file) => [`${file.ownerSlug}/${file.filename}`, file]),
  );

  for (const file of returnedFiles) {
    const source = sourceByKey.get(`${file.ownerSlug}/${file.filename}`);

    if (!source) {
      throw new Error(`Missing source content for ${file.ownerSlug}/${file.filename}.`);
    }

    const targetPath = join(ownerDir, file.ownerSlug, file.filename);

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, ensureTrailingNewline(source.content));
  }
}

async function getOwnerFolders(directory, knownOwnerSlugs) {
  const entries = await readdir(directory, { withFileTypes: true });
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

  const returnsDir = getValue(args, "--returns-dir");
  const ownerDir = getValue(args, "--owner-dir");
  const out = getValue(args, "--out");

  if (!returnsDir) {
    throw new Error("Missing required argument --returns-dir.");
  }

  if (!ownerDir) {
    throw new Error("Missing required argument --owner-dir.");
  }

  if (!out) {
    throw new Error("Missing required argument --out.");
  }

  return {
    returnsDir,
    ownerDir,
    out,
    recipientAssignments: getValue(args, "--recipient-assignments"),
    ownerSendTracker: getValue(args, "--owner-send-tracker"),
    apply: args.includes("--apply"),
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

function ensureTrailingNewline(content) {
  return content.endsWith("\n") ? content : `${content}\n`;
}
