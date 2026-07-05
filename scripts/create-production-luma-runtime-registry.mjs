/* global console, process */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:luma-registry --packet production-rollout-packet.json --out chapter-luma-map.json [--minimum-chapters=30] [--minimum-pilot-chapters=5]",
  "",
  "This is read-only with respect to live systems. It writes a local JSON registry file from approved packet Luma calendar rows.",
  "It does not update Vercel env vars, call Luma, create events, write Supabase rows, send invites, or enable integrations.",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}

try {
  const packetPath = getArgValue(args, "--packet");
  const outPath = getArgValue(args, "--out");
  const minimumChapterCount = getPositiveWholeNumberArg(args, "--minimum-chapters", 30);
  const minimumPilotChapterCount = getPositiveWholeNumberArg(
    args,
    "--minimum-pilot-chapters",
    5,
  );

  if (!packetPath) {
    throw new Error("Missing required argument --packet.");
  }

  if (!outPath) {
    throw new Error("Missing required argument --out.");
  }

  const {
    createProductionLumaRuntimeRegistryExport,
    formatProductionLumaRuntimeRegistryExport,
  } = await import("../src/services/production-luma-mapping-readiness.ts");
  const resolvedOutPath = resolve(outPath);
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));
  const output = createProductionLumaRuntimeRegistryExport(packet, {
    minimumChapterCount,
    minimumPilotChapterCount,
  });

  if (!output.ready) {
    console.log(formatProductionLumaRuntimeRegistryExport(output, resolvedOutPath));
    process.exit(1);
  }

  await mkdir(dirname(resolvedOutPath), { recursive: true });
  await writeFile(resolvedOutPath, output.registryJson, "utf8");
  console.log(formatProductionLumaRuntimeRegistryExport(output, resolvedOutPath));
} catch (error) {
  console.error("Production Luma runtime registry export: NOT READY");
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
