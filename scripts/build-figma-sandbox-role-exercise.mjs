/* global console, process */
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm figma-seed:exercise [--out .codex-artifacts/figma-seed]",
  "",
  "Writes:",
  "  figma-sandbox-role-exercise.json",
  "  figma-sandbox-role-exercise.md",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const {
    buildFigmaSandboxRoleExerciseReport,
    formatFigmaSandboxRoleExerciseMarkdown,
  } = await import("../src/services/figma-sandbox-role-exercise.ts");

  const report = buildFigmaSandboxRoleExerciseReport();
  const outDir = resolve(args.out);
  await mkdir(outDir, { recursive: true });

  await writeFile(
    join(outDir, "figma-sandbox-role-exercise.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await writeFile(
    join(outDir, "figma-sandbox-role-exercise.md"),
    formatFigmaSandboxRoleExerciseMarkdown(report),
  );

  console.log(`Figma sandbox role exercise written to ${outDir}`);
  console.log(
    "This report stays local/sandbox-only and must not be used as production signed-in proof, invite-gate proof, or rollout evidence.",
  );
} catch (error) {
  console.error("Figma sandbox role exercise was not built.");
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
