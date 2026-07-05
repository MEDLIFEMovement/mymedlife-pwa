/* global console, process */
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:check-csv --dir rollout-csv [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5]",
  "",
  "This validates filled rollout CSV files without writing production data or building the JSON packet.",
  "Expected files: chapters.csv, users.csv, memberships.csv, staff-roles.csv, coach-assignments.csv, campaigns.csv, luma-calendars.csv, pilot-event-proof.csv, launch-owners.csv, signed-in-route-proof.csv.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const directory = resolve(args.dir);
  const [
    { buildProductionRolloutPacketFromCsvTables },
    {
      formatProductionRolloutBootstrapReadiness,
      getProductionRolloutBootstrapReadiness,
    },
  ] = await Promise.all([
    import("../src/services/production-rollout-packet-builder.ts"),
    import("../src/services/production-rollout-bootstrap.ts"),
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
  const readiness = getProductionRolloutBootstrapReadiness(packet, {
    minimumChapterCount: args.minimumChapters,
    minimumStudentMembershipCount: args.minimumStudents,
    minimumPilotChapterCount: args.minimumPilotChapters,
  });

  console.log(`Production rollout CSV folder: ${directory}`);
  console.log("");
  console.log(formatProductionRolloutBootstrapReadiness(readiness));
  console.log("");
  console.log(
    readiness.ready
      ? "Next: run pnpm rollout:build with these same CSV files."
      : "Next: fix the CSV rows above, then rerun pnpm rollout:check-csv.",
  );

  process.exit(readiness.ready ? 0 : 1);
} catch (error) {
  console.error("Production rollout CSV folder: NOT READY");
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
  const index = args.indexOf(name);

  if (index === -1) {
    return null;
  }

  return args[index + 1] ?? null;
}

function getPositiveWholeNumberArg(args, name, defaultValue) {
  const explicitValue = getValue(args, name);
  const equalsFlag = args.find((arg) => arg.startsWith(`${name}=`));
  const value = explicitValue ?? equalsFlag?.split("=")[1] ?? String(defaultValue);
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return parsed;
}
