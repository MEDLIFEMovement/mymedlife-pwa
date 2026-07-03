/* global console, process */
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:check-csv --dir rollout-csv [--minimum-chapters=30]",
  "",
  "This validates filled rollout CSV files without writing production data or building the JSON packet.",
  "Expected files: chapters.csv, users.csv, memberships.csv, staff-roles.csv, coach-assignments.csv, campaigns.csv.",
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
  });
  const readiness = getProductionRolloutBootstrapReadiness(packet, {
    minimumChapterCount: args.minimumChapters,
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
  const minimumChapters = getMinimumChapterCount(args);

  if (!dir) {
    throw new Error("Missing required argument --dir.");
  }

  return {
    dir,
    minimumChapters,
  };
}

function getValue(args, name) {
  const index = args.indexOf(name);

  if (index === -1) {
    return null;
  }

  return args[index + 1] ?? null;
}

function getMinimumChapterCount(args) {
  const explicitValue = getValue(args, "--minimum-chapters");
  const equalsFlag = args.find((arg) => arg.startsWith("--minimum-chapters="));
  const value = explicitValue ?? equalsFlag?.split("=")[1] ?? "30";
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("--minimum-chapters must be a positive whole number.");
  }

  return parsed;
}
