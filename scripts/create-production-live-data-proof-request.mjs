/* global console, process */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm production:live-data-proof-request --out production-live-data-proof-request.md [--packet production-rollout-packet.json] [--counts production-live-data-counts.txt] [--public-url https://www.mymedlife.org] [--db-url-env SUPABASE_DB_URL] [--minimum-chapters=30] [--minimum-approved-members=500] [--minimum-pilot-events=5]",
  "",
  "This writes a count-only production proof request for DS/platform.",
  "It does not read Supabase, create users, write rows, send invites, call Luma, or change production config.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const {
    formatProductionLiveDataProofRequest,
    getProductionLiveDataProofRequest,
  } = await import("../src/services/production-live-data-proof-request.ts");
  const outputPath = resolve(args.out);
  const request = getProductionLiveDataProofRequest({
    packetPath: args.packet,
    countsPath: args.counts,
    publicUrl: args.publicUrl,
    dbUrlEnvName: args.dbUrlEnv,
    minimumChapterCount: args.minimumChapters,
    minimumApprovedMembershipCount: args.minimumApprovedMembers,
    minimumPilotEventCount: args.minimumPilotEvents,
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, formatProductionLiveDataProofRequest(request));

  console.log(`Production live-data proof request written to ${outputPath}`);
  console.log("Status: REQUIRED AFTER APPROVED PRODUCTION DATA APPLY");
} catch (error) {
  console.error("Production live-data proof request was not created.");
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

  const out = getValue(args, "--out");

  if (!out) {
    throw new Error("Missing required argument --out.");
  }

  return {
    out,
    packet: getValue(args, "--packet") ?? "production-rollout-packet.json",
    counts: getValue(args, "--counts") ?? "production-live-data-counts.txt",
    publicUrl: getValue(args, "--public-url") ?? "https://www.mymedlife.org",
    dbUrlEnv: getValue(args, "--db-url-env") ?? "SUPABASE_DB_URL",
    minimumChapters: getPositiveWholeNumberArg(args, "--minimum-chapters", 30),
    minimumApprovedMembers: getPositiveWholeNumberArg(
      args,
      "--minimum-approved-members",
      500,
    ),
    minimumPilotEvents: getPositiveWholeNumberArg(
      args,
      "--minimum-pilot-events",
      5,
    ),
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
