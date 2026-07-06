/* global console, process */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:signed-in-proof-import --proof signed-in-route-proof-source.csv --out-dir rollout-csv [--force]",
  "",
  "This is read-only for production systems. It writes local signed-in-route-proof.csv from one reviewer route evidence CSV.",
  "",
  "Reviewer evidence columns:",
  "  email,workspace,observedPath,status,checkedAt,notes",
  "",
  "Required columns: email, workspace, observedPath, status, checkedAt.",
  "Optional columns: notes.",
  "Workspace aliases: member/student/app, leader/student_leader/chapter_leader, staff/coach/sales_coach, admin/ds_admin/super_admin.",
  "The command fills the required expectedPath for each workspace and only accepts passed rows when observedPath matches that expected route.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const proofPath = resolve(args.proof);
  const outDirectory = resolve(args.outDir);
  const outputPath = join(outDirectory, "signed-in-route-proof.csv");
  const outputHeader = [
    "email",
    "workspace",
    "expectedPath",
    "observedPath",
    "status",
    "checkedAt",
    "notes",
  ].join(",");
  const { buildProductionSignedInRouteProofImport } = await import(
    "../src/services/production-signed-in-route-proof-import.ts"
  );
  const result = buildProductionSignedInRouteProofImport(
    await readFile(proofPath, "utf8"),
  );

  await assertCanWriteCsv(outputPath, outputHeader, args.force);
  await mkdir(dirname(outputPath), { recursive: true });
  await mkdir(outDirectory, { recursive: true });
  await writeFile(outputPath, result.signedInRouteProofCsv);

  console.log("Production signed-in route proof import: READY");
  console.log(`- proof rows: ${result.counts.proofRows}`);
  console.log(`- passed rows: ${result.counts.passedRows}`);
  console.log(`- workspaces: ${result.counts.workspaces}`);
  console.log(`- wrote: ${outputPath}`);
  console.log("");
  console.log("Next: rebuild the rollout packet, then run pnpm production:signed-in-route-proof --packet production-rollout-packet.json");
} catch (error) {
  console.error("Production signed-in route proof import: NOT READY");
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

  const proof = getValue(args, "--proof");
  const outDir = getValue(args, "--out-dir");

  if (!proof) {
    throw new Error("Missing required argument --proof.");
  }

  if (!outDir) {
    throw new Error("Missing required argument --out-dir.");
  }

  return {
    proof,
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
    `${path} already contains signed-in route proof rows. Re-run with --force only after confirming it is safe to replace.`,
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
