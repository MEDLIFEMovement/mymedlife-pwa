/* global console, process */
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:intake-status --dir rollout-csv [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5]",
  "",
  "This is read-only. It summarizes CSV row counts and missing data asks before production packet build/apply.",
  "It does not create users, build the JSON packet, write Supabase rows, send invites, or enable integrations.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const directory = resolve(args.dir);
  const [
    { buildProductionRolloutPacketFromCsvTables },
    {
      formatProductionRolloutIntakeStatus,
      getProductionRolloutIntakeStatus,
    },
  ] = await Promise.all([
    import("../src/services/production-rollout-packet-builder.ts"),
    import("../src/services/production-rollout-intake-status.ts"),
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
  const status = getProductionRolloutIntakeStatus(packet, {
    minimumChapterCount: args.minimumChapters,
    minimumStudentMembershipCount: args.minimumStudents,
    minimumPilotChapterCount: args.minimumPilotChapters,
  });

  console.log(`Production rollout CSV intake folder: ${directory}`);
  console.log("");
  console.log(formatProductionRolloutIntakeStatus(status));
  process.exit(status.ready ? 0 : 1);
} catch (error) {
  console.error("Production rollout CSV intake: NOT READY");
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
  const minimumChapters = getPositiveWholeNumberArg(args, "--minimum-chapters", 30);
  const minimumStudents = getPositiveWholeNumberArg(args, "--minimum-students", 500);
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
    minimumChapters,
    minimumStudents,
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
