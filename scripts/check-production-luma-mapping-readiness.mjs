/* global console, process */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:luma-mappings --packet production-rollout-packet.json [--mapping-json chapter-luma-map.json] [--minimum-chapters=30] [--minimum-pilot-chapters=5]",
  "",
  "This is read-only. It compares rollout packet Luma calendar rows with the runtime chapter-to-Luma registry.",
  "It does not call Luma, create events, write Supabase rows, send invites, or enable integrations.",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}

try {
  const packetPath = getArgValue(args, "--packet");
  const mappingJsonPath = getArgValue(args, "--mapping-json");
  const minimumChapterCount = getPositiveWholeNumberArg(args, "--minimum-chapters", 30);
  const minimumPilotChapterCount = getPositiveWholeNumberArg(
    args,
    "--minimum-pilot-chapters",
    5,
  );

  if (!packetPath) {
    throw new Error("Missing required argument --packet.");
  }

  const {
    formatProductionLumaMappingReadiness,
    getProductionLumaMappingReadiness,
  } = await import("../src/services/production-luma-mapping-readiness.ts");
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));
  const runtimeMappingJson = mappingJsonPath
    ? await readFile(resolve(mappingJsonPath), "utf8")
    : process.env.MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON;
  const readiness = getProductionLumaMappingReadiness(packet, {
    minimumChapterCount,
    minimumPilotChapterCount,
    runtimeMappingJson,
  });

  console.log(formatProductionLumaMappingReadiness(readiness));
  process.exit(readiness.ready ? 0 : 1);
} catch (error) {
  console.error("Production Luma mapping readiness: NOT READY");
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
