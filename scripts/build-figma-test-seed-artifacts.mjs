/* global console, process */
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm figma-seed:build [--out .codex-artifacts/figma-seed]",
  "",
  "Writes:",
  "  figma-test-seed-manifest.json",
  "  figma-shell-test-logins.md",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const {
    buildFigmaTestSeedManifest,
    formatFigmaTestSeedLoginsMarkdown,
    getFigmaTestSeedValidation,
  } = await import("../src/data/figma-test-seed-map.ts");

  const validation = getFigmaTestSeedValidation();
  if (!validation.ready) {
    throw new Error(
      validation.checks
        .filter((check) => !check.passed)
        .map((check) => `${check.key}: ${check.message}`)
        .join("\n"),
    );
  }

  const manifest = buildFigmaTestSeedManifest();
  const outDir = resolve(args.out);
  await mkdir(outDir, { recursive: true });

  await writeFile(
    join(outDir, "figma-test-seed-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await writeFile(
    join(outDir, "figma-shell-test-logins.md"),
    formatFigmaTestSeedLoginsMarkdown(manifest),
  );

  console.log(`Figma test seed artifacts written to ${outDir}`);
  console.log("These artifacts stay local/sandbox-only and must not be used as rollout evidence.");
} catch (error) {
  console.error("Figma test seed artifacts were not built.");
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

  const parsed = {
    out: ".codex-artifacts/figma-seed",
  };

  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];

    if (!key?.startsWith("--") || !value) {
      throw new Error("Arguments must be provided as --name value pairs.");
    }

    parsed[key.slice(2)] = value;
  }

  return parsed;
}
