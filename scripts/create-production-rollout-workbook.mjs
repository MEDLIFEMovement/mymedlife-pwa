/* global console, process */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:workbook --out production-rollout-workbook.md [--csv-dir rollout-csv]",
  "",
  "This writes a human fill guide for the production rollout CSV packet.",
  "It does not create users, write Supabase rows, call Luma, send invites, or change production config.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const {
    formatProductionRolloutWorkbook,
  } = await import("../src/services/production-rollout-workbook.ts");
  const outPath = resolve(args.out);

  await writeFile(outPath, formatProductionRolloutWorkbook(args.csvDir));
  console.log(`Production rollout workbook written to ${outPath}`);
} catch (error) {
  console.error("Production rollout workbook was not created.");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

function parseArgs(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const out = getArgValue(args, "--out");

  if (!out) {
    throw new Error("Missing required argument --out.");
  }

  return {
    out,
    csvDir: getArgValue(args, "--csv-dir") ?? "rollout-csv",
  };
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
