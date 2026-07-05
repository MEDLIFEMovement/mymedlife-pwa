/* global console, process */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm production:pilot-event-proof --packet production-rollout-packet.json [--minimum-pilot-chapters=5]",
  "",
  "This is read-only. It checks only the five-chapter Luma RSVP, attendance, points, audit, and zero-send proof rows.",
  "It does not create users, write Supabase rows, call Luma, send invites, or enable integrations.",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.error(usage);
  process.exit(0);
}

try {
  const packetPath = getArgValue(args, "--packet");
  const minimumPilotChapterCount = getPositiveWholeNumberArg(
    args,
    "--minimum-pilot-chapters",
    5,
  );

  if (!packetPath) {
    throw new Error("Missing required argument --packet.");
  }

  const {
    formatProductionPilotEventProofReadiness,
    getProductionPilotEventProofReadiness,
  } = await import("../src/services/production-pilot-event-proof.ts");
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));
  const readiness = getProductionPilotEventProofReadiness(packet, {
    minimumPilotChapterCount,
  });

  console.log(formatProductionPilotEventProofReadiness(readiness));
  process.exit(readiness.ready ? 0 : 1);
} catch (error) {
  console.error("5-chapter pilot event loop proof: NOT READY");
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
