/* global console, process */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:sop-promotion-boundary --manifest sop-template-manifest.json [--out sop-template-promotion-boundary.md]",
  "",
  "This is read-only. It checks whether a future SOP/template manifest satisfies the manual promotion boundary without creating live behavior or production evidence.",
].join("\n");

try {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const args = process.argv.slice(2);
  const manifestPath = getArgValue(args, "--manifest");
  const outPath = getArgValue(args, "--out");

  if (!manifestPath) {
    throw new Error("Missing required argument --manifest.");
  }

  const {
    formatSopTemplatePromotionBoundaryResult,
    getSopTemplatePromotionBoundaryResult,
  } = await import("../src/services/sop-template-promotion-boundary.ts");
  const manifest = JSON.parse(await readFile(resolve(manifestPath), "utf8"));
  const result = getSopTemplatePromotionBoundaryResult(manifest);
  const formatted = formatSopTemplatePromotionBoundaryResult(result);

  if (outPath) {
    await writeFile(resolve(outPath), `${formatted}\n`);
    console.log(
      `SOP/template promotion boundary written to ${resolve(outPath)}`,
    );
  } else {
    console.log(formatted);
  }

  process.exit(result.eligibleForManualReview ? 0 : 1);
} catch (error) {
  console.error("SOP/template promotion boundary: BLOCKED");
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
