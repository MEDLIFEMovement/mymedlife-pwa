/* global console, process */
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:preflight --dir rollout-csv [--mapping-json chapter-luma-map.json] [--out production-rollout-preflight.md]",
  "    [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5] [--max-recipients=75]",
  "",
  "This is read-only. It combines the CSV intake, chapter matrix, Luma mapping, pilot proof, signed-in route proof, and invite batch gates.",
  "It does not create users, write Supabase rows, call Luma, send invites, or enable external systems.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const directory = resolve(args.dir);
  const [
    { buildProductionRolloutPacketFromCsvTables },
    {
      formatProductionRolloutPreflight,
      getProductionRolloutPreflight,
    },
  ] = await Promise.all([
    import("../src/services/production-rollout-packet-builder.ts"),
    import("../src/services/production-rollout-preflight.ts"),
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
  const preflight = getProductionRolloutPreflight(packet, {
    minimumChapterCount: args.minimumChapters,
    minimumStudentMembershipCount: args.minimumStudents,
    minimumPilotChapterCount: args.minimumPilotChapters,
    maxRecipientsPerBatch: args.maxRecipients,
    runtimeMappingJson: args.mappingJsonPath
      ? await readFile(resolve(args.mappingJsonPath), "utf8")
      : null,
  });
  const formattedPreflight = formatProductionRolloutPreflight(preflight);

  if (args.out) {
    await writeFile(resolve(args.out), `${formattedPreflight}\n`);
    console.log(`Production rollout preflight written to ${resolve(args.out)}`);
  } else {
    console.log(`Production rollout CSV intake folder: ${directory}`);
    console.log("");
    console.log(formattedPreflight);
  }

  process.exit(preflight.ready ? 0 : 1);
} catch (error) {
  console.error("30-chapter rollout preflight: NOT READY");
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
  const mappingJsonPath = getValue(args, "--mapping-json");
  const minimumChapters = getPositiveWholeNumberArg(args, "--minimum-chapters", 30);
  const minimumStudents = getPositiveWholeNumberArg(args, "--minimum-students", 500);
  const minimumPilotChapters = getPositiveWholeNumberArg(
    args,
    "--minimum-pilot-chapters",
    5,
  );
  const maxRecipients = getPositiveWholeNumberArg(args, "--max-recipients", 75);

  if (!dir) {
    throw new Error("Missing required argument --dir.");
  }

  return {
    dir,
    out,
    mappingJsonPath,
    minimumChapters,
    minimumStudents,
    minimumPilotChapters,
    maxRecipients,
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
