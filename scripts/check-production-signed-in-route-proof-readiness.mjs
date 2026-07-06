/* global console, process */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm production:signed-in-route-proof-readiness [--packet production-rollout-packet.json] [--out production-signed-in-route-proof-readiness.md]",
  "",
  "This is read-only. It summarizes the four required production proof classes, what cannot count as proof, the import/check sequence, and what remains blocked before final invite-gate review.",
].join("\n");

try {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const args = process.argv.slice(2);
  const packetPath = getArgValue(args, "--packet");
  const outPath = getArgValue(args, "--out");
  const {
    formatProductionSignedInRouteProofReadinessChecklist,
    getProductionSignedInRouteProofReadinessChecklist,
  } = await import("../src/services/production-signed-in-route-proof-readiness.ts");

  const packet = packetPath
    ? JSON.parse(await readFile(resolve(packetPath), "utf8"))
    : null;
  const checklist = getProductionSignedInRouteProofReadinessChecklist(packet);
  const formatted = formatProductionSignedInRouteProofReadinessChecklist(checklist);

  if (outPath) {
    await writeFile(resolve(outPath), `${formatted}\n`);
    console.log(
      `Production signed-in route proof readiness written to ${resolve(outPath)}`,
    );
  } else {
    console.log(formatted);
  }

  for (const check of checklist.validation.checks) {
    console.log(`${check.passed ? "PASS" : "FAIL"} ${check.message}`);
  }

  process.exit(checklist.validation.ready ? 0 : 1);
} catch (error) {
  console.error("Production signed-in route proof readiness: ERROR");
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
