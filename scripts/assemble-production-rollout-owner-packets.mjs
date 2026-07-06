/* global console, process */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:assemble-owner-packets --owner-dir rollout-owner-packets --out rollout-csv",
  "",
  "This assembles filled owner-specific CSV folders into the shared rollout-csv folder.",
  "It does not create users, write Supabase rows, call Luma, send invites, or change production config.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const [
    {
      formatProductionRolloutOwnerPacketAssemblyReport,
      getProductionRolloutOwnerPacketAssembly,
    },
    { getProductionRolloutOwnerPackets },
  ] = await Promise.all([
    import("../src/services/production-rollout-owner-packet-assembly.ts"),
    import("../src/services/production-rollout-owner-packets.ts"),
  ]);
  const ownerDir = resolve(args.ownerDir);
  const outDir = resolve(args.out);
  const foundFiles = await readOwnerPacketCsvFiles({
    ownerDir,
    knownOwnerSlugs: getProductionRolloutOwnerPackets().map((packet) => packet.slug),
  });
  const assembly = getProductionRolloutOwnerPacketAssembly({
    foundFiles,
    sourceDirectoryName: args.ownerDir,
    outputDirectoryName: args.out,
  });
  const report = formatProductionRolloutOwnerPacketAssemblyReport(assembly);

  console.log(report);

  if (!assembly.ready) {
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });

  for (const file of assembly.files) {
    await writeFile(join(outDir, file.filename), file.content);
  }

  await writeFile(join(outDir, "ASSEMBLY_REPORT.md"), report);
  console.log(`Production rollout CSV folder assembled at ${outDir}`);
} catch (error) {
  console.error("Production rollout owner packet assembly: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

async function readOwnerPacketCsvFiles({
  ownerDir,
  knownOwnerSlugs,
}) {
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
  };
}

function getValue(args, name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));

  if (inline) {
    return inline.slice(name.length + 1);
  }

  const index = args.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}
