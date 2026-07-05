/* global console, process */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:roster-import --roster rollout-roster.csv --out-dir rollout-csv [--force]",
  "",
  "This is read-only for production systems. It writes local users.csv and memberships.csv files from a plain roster CSV.",
  "",
  "Roster columns:",
  "  email,displayName,chapterId,roleKey,status,chapterName",
  "",
  "Required columns: email, displayName, chapterId, roleKey.",
  "Optional columns: status, chapterName.",
  "If status is blank, it defaults to approved.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const rosterPath = resolve(args.roster);
  const outDirectory = resolve(args.outDir);
  const usersPath = join(outDirectory, "users.csv");
  const membershipsPath = join(outDirectory, "memberships.csv");
  const { buildProductionRolloutRosterImport } = await import(
    "../src/services/production-rollout-roster-import.ts"
  );
  const result = buildProductionRolloutRosterImport(
    await readFile(rosterPath, "utf8"),
  );

  await assertCanWriteCsv(usersPath, "email,displayName", args.force);
  await assertCanWriteCsv(
    membershipsPath,
    "email,chapterId,roleKey,status",
    args.force,
  );

  await mkdir(dirname(usersPath), { recursive: true });
  await writeFile(usersPath, result.usersCsv);
  await writeFile(membershipsPath, result.membershipsCsv);

  console.log("Production rollout roster import: READY");
  console.log(`- users: ${result.counts.users}`);
  console.log(`- memberships: ${result.counts.memberships}`);
  console.log(`- chapters represented: ${result.counts.chapters}`);
  console.log(`- wrote: ${usersPath}`);
  console.log(`- wrote: ${membershipsPath}`);
  console.log("");
  console.log(`Next: pnpm rollout:check-csv --dir ${outDirectory}`);
} catch (error) {
  console.error("Production rollout roster import: NOT READY");
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

  const roster = getValue(args, "--roster");
  const outDir = getValue(args, "--out-dir");

  if (!roster) {
    throw new Error("Missing required argument --roster.");
  }

  if (!outDir) {
    throw new Error("Missing required argument --out-dir.");
  }

  return {
    roster,
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
    `${path} already contains roster rows. Re-run with --force only after confirming it is safe to replace.`,
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
