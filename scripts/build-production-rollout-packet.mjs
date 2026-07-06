/* global console, process */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:build --chapters chapters.csv --users users.csv --memberships memberships.csv --staff-roles staff-roles.csv --coach-assignments coach-assignments.csv --campaigns campaigns.csv --luma-calendars luma-calendars.csv --pilot-event-proof pilot-event-proof.csv --launch-owners launch-owners.csv --signed-in-route-proof signed-in-route-proof.csv --out production-rollout-packet.json [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5]",
  "",
  "This builds the JSON packet only after the CSV rows pass rollout readiness.",
  "It does not create users, write Supabase rows, call Luma, send invites, or change production config.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
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
    chapters: await readText(args.chapters),
    users: await readText(args.users),
    memberships: await readText(args.memberships),
    staffRoles: await readText(args.staffRoles),
    coachAssignments: await readText(args.coachAssignments),
    campaigns: await readText(args.campaigns),
    lumaCalendars: await readText(args.lumaCalendars),
    pilotEventProof: await readText(args.pilotEventProof),
    launchOwners: await readText(args.launchOwners),
    signedInRouteProof: await readText(args.signedInRouteProof),
  });
  const readiness = getProductionRolloutBootstrapReadiness(packet, {
    minimumChapterCount: args.minimumChapters,
    minimumStudentMembershipCount: args.minimumStudents,
    minimumPilotChapterCount: args.minimumPilotChapters,
  });

  if (!readiness.ready) {
    console.log(formatProductionRolloutBootstrapReadiness(readiness));
    console.log("");
    console.log("Production rollout packet was not written.");
    console.log("Next: fix the CSV rows above, then rerun pnpm rollout:build.");
    process.exit(1);
  }

  const outPath = resolve(args.out);

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`);

  console.log(`Production rollout packet written to ${outPath}`);
  console.log("");
  console.log(formatProductionRolloutBootstrapReadiness(readiness));
  console.log("");
  console.log("Next: pnpm rollout:check " + outPath);
} catch (error) {
  console.error("Production rollout packet was not built.");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

async function readText(path) {
  return readFile(resolve(path), "utf8");
}

function parseArgs(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  return {
    chapters: getRequiredValue(args, "--chapters"),
    users: getRequiredValue(args, "--users"),
    memberships: getRequiredValue(args, "--memberships"),
    staffRoles: getRequiredValue(args, "--staff-roles"),
    coachAssignments: getRequiredValue(args, "--coach-assignments"),
    campaigns: getRequiredValue(args, "--campaigns"),
    lumaCalendars: getRequiredValue(args, "--luma-calendars"),
    pilotEventProof: getRequiredValue(args, "--pilot-event-proof"),
    launchOwners: getRequiredValue(args, "--launch-owners"),
    signedInRouteProof: getRequiredValue(args, "--signed-in-route-proof"),
    out: getRequiredValue(args, "--out"),
    minimumChapters: getPositiveWholeNumberArg(args, "--minimum-chapters", 30),
    minimumStudents: getPositiveWholeNumberArg(args, "--minimum-students", 500),
    minimumPilotChapters: getPositiveWholeNumberArg(
      args,
      "--minimum-pilot-chapters",
      5,
    ),
  };
}

function getRequiredValue(args, name) {
  const value = getValue(args, name);

  if (!value) {
    throw new Error(`Missing required argument ${name}.`);
  }

  return value;
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
  const rawValue = getValue(args, name);

  if (!rawValue) {
    return defaultValue;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return parsed;
}
