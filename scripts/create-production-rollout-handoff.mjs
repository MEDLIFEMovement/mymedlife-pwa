/* global console, process */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:handoff <packet.json> [--out production-rollout-handoff.md]",
  "",
  "This creates a review-only handoff. It does not write to Supabase or create Auth users.",
].join("\n");

const [packetPath, ...args] = process.argv.slice(2);

if (!packetPath || packetPath === "--help" || packetPath === "-h") {
  console.error(usage);
  process.exit(packetPath ? 0 : 1);
}

try {
  const outPath = getOutPath(args);
  const {
    formatProductionRolloutHandoff,
    getProductionRolloutHandoff,
  } = await import("../src/services/production-rollout-handoff.ts");
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));
  const handoff = getProductionRolloutHandoff(packet);
  const report = formatProductionRolloutHandoff(handoff);

  if (outPath) {
    await writeFile(resolve(outPath), `${report}\n`);
    console.log(`Production rollout handoff written to ${resolve(outPath)}`);
  } else {
    console.log(report);
  }

  process.exit(handoff.ready ? 0 : 1);
} catch (error) {
  console.error("Production rollout handoff was not created.");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

function getOutPath(args) {
  const outFlag = args.find((arg) => arg.startsWith("--out="));

  if (outFlag) {
    return outFlag.split("=")[1];
  }

  const outIndex = args.indexOf("--out");

  if (outIndex >= 0) {
    return args[outIndex + 1];
  }

  return undefined;
}
