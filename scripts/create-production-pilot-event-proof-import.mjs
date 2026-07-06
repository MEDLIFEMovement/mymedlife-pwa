/* global console, process */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:pilot-proof-import --proof pilot-event-proof-source.csv --out-dir rollout-csv [--force]",
  "",
  "This is read-only for production systems. It writes local pilot-event-proof.csv from one reviewer evidence CSV.",
  "",
  "Reviewer evidence columns:",
  "  chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,status,notes",
  "",
  "Required columns: chapterId, eventName, lumaEventId, rsvpCount, attendanceCount, pointsAwardedCount, auditRecorded, zeroExternalSends, eventRoute, attendanceRoute, pointsRoute, auditRoute, outboxRoute, checkedAt, reviewedByEmail.",
  "Optional columns: status, notes.",
  "Defaults: status=ready. Ready rows require at least one RSVP, at least one attendance check-in, matching attendance/points counts, auditRecorded=yes, and zeroExternalSends=yes.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const proofPath = resolve(args.proof);
  const outDirectory = resolve(args.outDir);
  const outputPath = join(outDirectory, "pilot-event-proof.csv");
  const outputHeader = [
    "chapterId",
    "eventName",
    "lumaEventId",
    "rsvpCount",
    "attendanceCount",
    "pointsAwardedCount",
    "auditEvidence",
    "outboxStatus",
    "status",
    "eventRoute",
    "attendanceRoute",
    "pointsRoute",
    "auditRoute",
    "outboxRoute",
    "checkedAt",
    "reviewedByEmail",
    "notes",
  ].join(",");
  const { buildProductionPilotEventProofImport } = await import(
    "../src/services/production-pilot-event-proof-import.ts"
  );
  const result = buildProductionPilotEventProofImport(
    await readFile(proofPath, "utf8"),
  );

  await assertCanWriteCsv(outputPath, outputHeader, args.force);
  await mkdir(dirname(outputPath), { recursive: true });
  await mkdir(outDirectory, { recursive: true });
  await writeFile(outputPath, result.pilotEventProofCsv);

  console.log("Production pilot event proof import: READY");
  console.log(`- proof rows: ${result.counts.proofRows}`);
  console.log(`- ready rows: ${result.counts.readyRows}`);
  console.log(`- chapters: ${result.counts.chapters}`);
  console.log(`- wrote: ${outputPath}`);
  console.log("");
  console.log("Next: rebuild the rollout packet, then run pnpm production:pilot-event-proof --packet production-rollout-packet.json");
} catch (error) {
  console.error("Production pilot event proof import: NOT READY");
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
    `${path} already contains pilot event proof rows. Re-run with --force only after confirming it is safe to replace.`,
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
