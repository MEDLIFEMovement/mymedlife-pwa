/* global console, process */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:apply-plan <packet.json> [--out production-rollout-apply-plan.md]",
  "",
  "This creates a review-only production apply plan.",
  "It does not write to Supabase, create Auth users, send invitations, or enable integrations.",
].join("\n");

const [packetPath, ...args] = process.argv.slice(2);

if (!packetPath || packetPath === "--help" || packetPath === "-h") {
  console.error(usage);
  process.exit(packetPath ? 0 : 1);
}

try {
  const outPath = getOutPath(args);
  const {
    formatProductionRolloutApplyPlan,
    getProductionRolloutApplyPlan,
  } = await import("../src/services/production-rollout-apply-plan.ts");
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));
  const plan = getProductionRolloutApplyPlan(packet);
  const report = formatProductionRolloutApplyPlan(plan);

  if (outPath) {
    const resolvedOutPath = resolve(outPath);
    await mkdir(dirname(resolvedOutPath), { recursive: true });
    await writeFile(resolvedOutPath, `${report}\n`);
    console.log(`Production rollout apply plan written to ${resolvedOutPath}`);
  } else {
    console.log(report);
  }

  process.exit(plan.ready ? 0 : 1);
} catch (error) {
  console.error("Production rollout apply plan was not created.");
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
