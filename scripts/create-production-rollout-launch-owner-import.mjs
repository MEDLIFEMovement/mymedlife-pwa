/* global console, process */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:launch-owner-import --owners launch-owners-source.csv --out-dir rollout-csv [--force]",
  "",
  "This is read-only for production systems. It writes local launch-owners.csv from one launch owner CSV.",
  "",
  "Launch owner columns:",
  "  email,ownerType,displayName,status",
  "",
  "Required columns: email, ownerType.",
  "Optional columns: displayName, status.",
  "Defaults: status=active.",
  "Required active owner types: support, rollback, production_apply.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const ownersPath = resolve(args.owners);
  const outDirectory = resolve(args.outDir);
  const outputPath = join(outDirectory, "launch-owners.csv");
  const outputHeader = "email,ownerType,displayName,status";
  const { buildProductionRolloutLaunchOwnerImport } = await import(
    "../src/services/production-rollout-launch-owner-import.ts"
  );
  const result = buildProductionRolloutLaunchOwnerImport(
    await readFile(ownersPath, "utf8"),
  );

  await assertCanWriteCsv(outputPath, outputHeader, args.force);
  await mkdir(dirname(outputPath), { recursive: true });
  await mkdir(outDirectory, { recursive: true });
  await writeFile(outputPath, result.launchOwnersCsv);

  console.log("Production rollout launch owner import: READY");
  console.log(`- owners: ${result.counts.owners}`);
  console.log(`- active owners: ${result.counts.activeOwners}`);
  console.log(`- owner types: ${result.counts.ownerTypes}`);
  console.log(`- wrote: ${outputPath}`);
  console.log("");
  console.log(`Next: pnpm rollout:check-csv --dir ${outDirectory}`);
} catch (error) {
  console.error("Production rollout launch owner import: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

function parseArgs(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const owners = getValue(args, "--owners");
  const outDir = getValue(args, "--out-dir");

  if (!owners) {
    throw new Error("Missing required argument --owners.");
  }

  if (!outDir) {
    throw new Error("Missing required argument --out-dir.");
  }

  return {
    owners,
    outDir,
    force: args.includes("--force"),
  };
}

function getValue(args, name) {
  const index = args.indexOf(name);

  if (index !== -1) {
    return args[index + 1] ?? null;
  }

  const equalsFlag = args.find((arg) => arg.startsWith(`${name}=`));

  return equalsFlag?.slice(name.length + 1) ?? null;
}

async function assertCanWriteCsv(path, expectedHeader, force) {
  if (force) {
    return;
  }

  if (!(await pathExists(path))) {
    return;
  }

  const contents = await readFile(path, "utf8");
  const rows = contents
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length <= 1 && rows[0] === expectedHeader) {
    return;
  }

  throw new Error(
    `${path} already contains launch owner rows. Re-run with --force only after confirming it is safe to replace.`,
  );
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
