/* global console, process */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:approval-summary <packet.json> [--out production-rollout-approval-summary.md]",
  "",
  "This creates a redacted, read-only approval summary for human rollout signoff.",
  "It does not create users, write Supabase rows, call Luma, send invites, or display invitee email lists.",
].join("\n");

const [packetPath, ...args] = process.argv.slice(2);

if (!packetPath || packetPath === "--help" || packetPath === "-h") {
  console.error(usage);
  process.exit(packetPath ? 0 : 1);
}

try {
  const outPath = getArgValue(args, "--out");
  const {
    formatProductionRolloutApprovalSummary,
    getProductionRolloutApprovalSummary,
  } = await import("../src/services/production-rollout-approval-summary.ts");
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));
  const summary = getProductionRolloutApprovalSummary(packet);
  const formattedSummary = formatProductionRolloutApprovalSummary(summary);

  if (outPath) {
    await writeFile(resolve(outPath), `${formattedSummary}\n`);
    console.log(`Production rollout approval summary written to ${resolve(outPath)}`);
  } else {
    console.log(formattedSummary);
  }

  process.exit(summary.readyForFinalGateReview ? 0 : 1);
} catch (error) {
  console.error("30-chapter approval summary: NOT READY");
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
