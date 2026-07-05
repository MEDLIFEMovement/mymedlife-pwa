/* global console, process */
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:chapter-matrix --dir rollout-csv [--out production-rollout-chapter-matrix.md] [--minimum-chapters=30] [--minimum-pilot-chapters=5]",
  "",
  "This creates a read-only per-chapter readiness matrix from the production rollout CSV folder.",
  "It does not create users, write Supabase rows, call Luma, send invites, or display invitee email lists.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const directory = resolve(args.dir);
  const [
    { buildProductionRolloutPacketFromCsvTables },
    {
      formatProductionRolloutChapterMatrix,
      getProductionRolloutChapterMatrix,
    },
  ] = await Promise.all([
    import("../src/services/production-rollout-packet-builder.ts"),
    import("../src/services/production-rollout-chapter-matrix.ts"),
  ]);
  const packet = buildProductionRolloutPacketFromCsvTables({
    chapters: await readCsv(directory, "chapters.csv"),
    users: await readCsv(directory, "users.csv"),
    memberships: await readCsv(directory, "memberships.csv"),
    staffRoles: await readCsv(directory, "staff-roles.csv"),
    coachAssignments: await readCsv(directory, "coach-assignments.csv"),
    campaigns: await readCsv(directory, "campaigns.csv"),
    lumaCalendars: await readCsv(directory, "luma-calendars.csv"),
    pilotEventProof: await readCsv(directory, "pilot-event-proof.csv"),
    launchOwners: await readCsv(directory, "launch-owners.csv"),
    signedInRouteProof: await readCsv(directory, "signed-in-route-proof.csv"),
  });
  const matrix = getProductionRolloutChapterMatrix(packet, {
    minimumChapterCount: args.minimumChapters,
    minimumPilotChapterCount: args.minimumPilotChapters,
  });
  const formattedMatrix = formatProductionRolloutChapterMatrix(matrix);

  if (args.out) {
    await writeFile(resolve(args.out), `${formattedMatrix}\n`);
    console.log(`Production rollout chapter matrix written to ${resolve(args.out)}`);
  } else {
    console.log(`Production rollout CSV intake folder: ${directory}`);
    console.log("");
    console.log(formattedMatrix);
  }

  process.exit(matrix.ready ? 0 : 1);
} catch (error) {
  console.error("Production rollout chapter matrix: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

async function readCsv(directory, filename) {
  const path = join(directory, filename);

  try {
    return await readFile(path, "utf8");
  } catch {
    throw new Error(
      `Missing or unreadable ${filename} in ${directory}. Run pnpm rollout:templates --out ${directory} to recreate the expected files.`,
    );
  }
}

function parseArgs(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const dir = getValue(args, "--dir");
  const out = getValue(args, "--out");
  const minimumChapters = getPositiveWholeNumberArg(args, "--minimum-chapters", 30);
  const minimumPilotChapters = getPositiveWholeNumberArg(
    args,
    "--minimum-pilot-chapters",
    5,
  );

  if (!dir) {
    throw new Error("Missing required argument --dir.");
  }

  return {
    dir,
    out,
    minimumChapters,
    minimumPilotChapters,
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

function getPositiveWholeNumberArg(args, name, defaultValue) {
  const explicitValue = getValue(args, name);
  const parsed = Number(explicitValue ?? defaultValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return parsed;
}
