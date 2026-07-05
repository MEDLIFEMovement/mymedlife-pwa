/* global console, process */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm production:invite-batches --packet production-rollout-packet.json [--max-recipients=75] [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5]",
  "",
  "This is read-only. It plans safe invite batches from the approved rollout packet.",
  "It does not create users, send email, write Supabase rows, call Luma, or change production config.",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}

try {
  const packetPath = getArgValue(args, "--packet");

  if (!packetPath) {
    throw new Error("Missing required argument --packet.");
  }

  const {
    formatProductionInviteBatchReadiness,
    getProductionInviteBatchReadiness,
  } = await import("../src/services/production-invite-batches.ts");
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));
  const readiness = getProductionInviteBatchReadiness(packet, {
    maxRecipientsPerBatch: getPositiveWholeNumberArg(args, "--max-recipients", 75),
    minimumChapterCount: getPositiveWholeNumberArg(args, "--minimum-chapters", 30),
    minimumStudentMembershipCount: getPositiveWholeNumberArg(
      args,
      "--minimum-students",
      500,
    ),
    minimumPilotChapterCount: getPositiveWholeNumberArg(
      args,
      "--minimum-pilot-chapters",
      5,
    ),
  });

  console.log(formatProductionInviteBatchReadiness(readiness));
  process.exit(readiness.ready ? 0 : 1);
} catch (error) {
  console.error("Production invite batch readiness: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

function getArgValue(args, name) {
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
  const rawValue = getArgValue(args, name);

  if (!rawValue) {
    return defaultValue;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return parsed;
}
