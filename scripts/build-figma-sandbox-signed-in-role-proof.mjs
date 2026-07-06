/* global console, process */
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm figma-seed:proof [--out .codex-artifacts/figma-seed]",
  "",
  "Writes:",
  "  figma-signed-in-role-proof.json",
  "  figma-signed-in-role-proof.md",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const {
    buildFigmaSandboxSignedInRoleProofReport,
    formatFigmaSandboxSignedInRoleProofMarkdown,
    getFigmaSandboxSignedInRoleProofValidation,
  } = await import("../src/services/figma-sandbox-signed-in-role-proof.ts");

  const report = buildFigmaSandboxSignedInRoleProofReport();
  const validation = getFigmaSandboxSignedInRoleProofValidation(report);

  if (!validation.ready) {
    throw new Error(
      validation.checks
        .filter((check) => !check.passed)
        .map((check) => `${check.key}: ${check.message}`)
        .join("\n"),
    );
  }

  const outDir = resolve(args.out);
  await mkdir(outDir, { recursive: true });

  await writeFile(
    join(outDir, "figma-signed-in-role-proof.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await writeFile(
    join(outDir, "figma-signed-in-role-proof.md"),
    formatFigmaSandboxSignedInRoleProofMarkdown(report),
  );

  console.log(`Figma sandbox signed-in role proof written to ${outDir}`);
  console.log("This report stays local/sandbox-only and must not be used as production rollout evidence.");
} catch (error) {
  console.error("Figma sandbox signed-in role proof was not built.");
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
