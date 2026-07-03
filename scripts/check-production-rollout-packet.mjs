/* global console, process */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:check <packet.json> [--minimum-chapters=30]",
  "",
  "The packet must contain chapters, users, memberships, staffRoles, coachAssignments, and campaigns.",
  "Do not include passwords, API keys, tokens, or secrets.",
].join("\n");

const packetPath = process.argv[2];

if (!packetPath || packetPath === "--help" || packetPath === "-h") {
  console.error(usage);
  process.exit(packetPath ? 0 : 1);
}

try {
  const minimumChapterCount = getMinimumChapterCount(process.argv.slice(3));
  const {
    formatProductionRolloutBootstrapReadiness,
    getProductionRolloutBootstrapReadiness,
  } = await import("../src/services/production-rollout-bootstrap.ts");
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));
  const readiness = getProductionRolloutBootstrapReadiness(packet, {
    minimumChapterCount,
  });

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

function getMinimumChapterCount(args) {
  const flag = args.find((arg) => arg.startsWith("--minimum-chapters="));

  if (!flag) {
    return 30;
  }

  const value = Number(flag.split("=")[1]);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error("--minimum-chapters must be a positive whole number.");
  }

  return value;
}
