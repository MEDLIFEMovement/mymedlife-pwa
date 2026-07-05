/* global console, process */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm production:signed-in-route-proof --packet production-rollout-packet.json",
  "",
  "This is read-only. It checks packet evidence that real signed-in member, leader, staff, and admin users reached the expected production workspaces.",
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
    formatProductionSignedInRouteProofReadiness,
    getProductionSignedInRouteProofReadiness,
  } = await import("../src/services/production-signed-in-route-proof.ts");
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));
  const readiness = getProductionSignedInRouteProofReadiness(packet);

  console.log(formatProductionSignedInRouteProofReadiness(readiness));
  process.exit(readiness.ready ? 0 : 1);
} catch (error) {
  console.error("Production signed-in route proof: NOT READY");
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
