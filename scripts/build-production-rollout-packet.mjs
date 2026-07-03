/* global console, process */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:build --chapters chapters.csv --users users.csv --memberships memberships.csv --staff-roles staff-roles.csv --coach-assignments coach-assignments.csv --campaigns campaigns.csv --out production-rollout-packet.json",
  "",
  "Then run:",
  "  pnpm rollout:check production-rollout-packet.json",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const {
    buildProductionRolloutPacketFromCsvTables,
  } = await import("../src/services/production-rollout-packet-builder.ts");
  const packet = buildProductionRolloutPacketFromCsvTables({
    chapters: await readText(args.chapters),
    users: await readText(args.users),
    memberships: await readText(args.memberships),
    staffRoles: await readText(args.staffRoles),
    coachAssignments: await readText(args.coachAssignments),
    campaigns: await readText(args.campaigns),
  });
  const outPath = resolve(args.out);

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`);

  console.log(`Production rollout packet written to ${outPath}`);
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

  const parsed = {};

  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];

    if (!key?.startsWith("--") || !value) {
      throw new Error("Arguments must be provided as --name value pairs.");
    }

    parsed[toCamelCase(key.slice(2))] = value;
  }

  const required = [
    "chapters",
    "users",
    "memberships",
    "staffRoles",
    "coachAssignments",
    "campaigns",
    "out",
  ];

  for (const key of required) {
    if (!parsed[key]) {
      throw new Error(`Missing required argument --${toKebabCase(key)}.`);
    }
  }

  return parsed;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
}

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
