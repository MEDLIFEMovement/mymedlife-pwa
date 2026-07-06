/* global console, process */
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm production:data-counts [--db-url-env SUPABASE_DB_URL] [--minimum-chapters=30] [--minimum-approved-members=500] [--minimum-pilot-events=5] [--out production-live-data-counts.txt]",
  "",
  "This is read-only. It runs aggregate count queries against production Supabase.",
  "By default it uses the linked Supabase project. Use --db-url-env to avoid depending on local supabase link state.",
  "It does not display user data, create rows, apply migrations, change auth, or enable integrations.",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}

try {
  const minimumChapters = getMinimumChapterCount(args);
  const minimumApprovedMembers = getMinimumApprovedMemberCount(args);
  const minimumPilotEvents = getMinimumPilotEventCount(args);
  const outPath = getValue(args, "--out");
  const {
    formatProductionLiveDataReadiness,
    getProductionLiveDataReadiness,
    parseProductionLiveDataCountCsv,
  } = await import("../src/services/production-live-data-readiness.ts");
  const {
    getProductionLiveDataQueryArgs,
    redactProductionLiveDataQueryOutput,
  } = await import("../src/services/production-live-data-query.ts");
  const connection = getConnection(args, process.env);
  const result = spawnSync("pnpm", getProductionLiveDataQueryArgs(connection), {
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  const combinedOutput = redactProductionLiveDataQueryOutput(
    [result.stdout, result.stderr].join("\n"),
    connection,
  );

  if (result.status !== 0) {
    throw new Error(combinedOutput.trim() || "Supabase count query failed.");
  }

  const counts = parseProductionLiveDataCountCsv(combinedOutput);
  const readiness = getProductionLiveDataReadiness(counts, {
    minimumChapterCount: minimumChapters,
    minimumApprovedMembershipCount: minimumApprovedMembers,
    minimumPilotEventCount: minimumPilotEvents,
  });
  const report = formatProductionLiveDataReadiness(readiness);

  if (outPath) {
    const resolvedOutPath = resolve(outPath);

    await mkdir(dirname(resolvedOutPath), { recursive: true });
    await writeFile(resolvedOutPath, `${report}\n`);
    console.log(`Production live data count check written to ${resolvedOutPath}`);
  } else {
    console.log(report);
  }

  process.exit(readiness.ready ? 0 : 1);
} catch (error) {
  console.error("Production live data count check: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

function getMinimumChapterCount(args) {
  return getPositiveWholeNumberArg(args, "--minimum-chapters", "30");
}

function getMinimumApprovedMemberCount(args) {
  return getPositiveWholeNumberArg(args, "--minimum-approved-members", "500");
}

function getMinimumPilotEventCount(args) {
  return getPositiveWholeNumberArg(args, "--minimum-pilot-events", "5");
}

function getPositiveWholeNumberArg(args, name, defaultValue) {
  const explicitValue = getValue(args, name);
  const equalsFlag = args.find((arg) => arg.startsWith(`${name}=`));
  const value = explicitValue ?? equalsFlag?.split("=")[1] ?? defaultValue;
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return parsed;
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

function getConnection(args, env) {
  const dbUrlEnvName = getValue(args, "--db-url-env");

  if (!dbUrlEnvName) {
    return { mode: "linked" };
  }

  const dbUrl = env[dbUrlEnvName];

  if (!dbUrl?.trim()) {
    throw new Error(
      `Environment variable ${dbUrlEnvName} is not set. It should contain the production Supabase database connection string for this read-only count proof.`,
    );
  }

  return {
    mode: "db_url",
    dbUrl,
  };
}
