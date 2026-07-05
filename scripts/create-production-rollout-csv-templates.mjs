/* global console, process */
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:templates --out rollout-csv",
  "",
  "This creates blank CSV files with the exact headers needed for rollout:build.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const {
    getProductionRolloutCsvTemplateContent,
    getProductionRolloutCsvTemplateReadme,
    productionRolloutCsvTemplates,
  } = await import("../src/services/production-rollout-csv-templates.ts");
  const outDir = resolve(args.out);

  await mkdir(outDir, { recursive: true });

  for (const template of productionRolloutCsvTemplates) {
    await writeFile(
      join(outDir, template.filename),
      getProductionRolloutCsvTemplateContent(template),
    );
  }

  await writeFile(
    join(outDir, "README.md"),
    getProductionRolloutCsvTemplateReadme(args.out),
  );

  console.log(`Production rollout CSV templates written to ${outDir}`);
  console.log("Next: fill the CSV files with real data, then run pnpm rollout:build.");
} catch (error) {
  console.error("Production rollout CSV templates were not created.");
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

  const outIndex = args.indexOf("--out");

  if (outIndex === -1 || !args[outIndex + 1]) {
    throw new Error("Missing required argument --out.");
  }

  return {
    out: args[outIndex + 1],
  };
}
