/* global console, process */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:check <packet.json> [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5]",
  "",
  "The packet must contain chapters, users, memberships, staffRoles, coachAssignments, campaigns, lumaCalendars, pilotEventProof, and launchOwners.",
  "Do not include passwords, API keys, tokens, or secrets.",
].join("\n");

const packetPath = process.argv[2];

if (!packetPath || packetPath === "--help" || packetPath === "-h") {
  console.error(usage);
  process.exit(packetPath ? 0 : 1);
}

try {
  const options = getReadinessOptions(process.argv.slice(3));
  const {
    formatProductionRolloutBootstrapReadiness,
    getProductionRolloutBootstrapReadiness,
  } = await import("../src/services/production-rollout-bootstrap.ts");
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));
  const readiness = getProductionRolloutBootstrapReadiness(packet, options);

  console.log(formatProductionRolloutBootstrapReadiness(readiness));
  process.exit(readiness.ready ? 0 : 1);
} catch (error) {
  console.error("Production rollout packet: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

function getReadinessOptions(args) {
  return {
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
  };
}

function getPositiveWholeNumberArg(args, name, defaultValue) {
  const explicitIndex = args.indexOf(name);
  const explicitValue = explicitIndex >= 0 ? args[explicitIndex + 1] : undefined;
  const equalsFlag = args.find((arg) => arg.startsWith(`${name}=`));
  const rawValue = explicitValue ?? equalsFlag?.split("=")[1];

  if (!rawValue) {
    return defaultValue;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return value;
}
