/* global console, process */
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm figma-seed:regression [--out .codex-artifacts/figma-seed]",
  "",
  "Writes:",
  "  figma-sandbox-role-shell-regression.json",
  "  figma-sandbox-role-shell-regression.md",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const {
    buildFigmaSandboxRoleShellRegressionReport,
    formatFigmaSandboxRoleShellRegressionMarkdown,
  } = await import("../src/services/figma-sandbox-role-shell-regression.ts");

  const report = buildFigmaSandboxRoleShellRegressionReport();
  const outDir = resolve(args.out);
  await mkdir(outDir, { recursive: true });

  await writeFile(
    join(outDir, "figma-sandbox-role-shell-regression.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await writeFile(
    join(outDir, "figma-sandbox-role-shell-regression.md"),
    formatFigmaSandboxRoleShellRegressionMarkdown(report),
  );

  for (const check of report.validation.checks) {
    console.log(`${check.passed ? "PASS" : "FAIL"} ${check.message}`);
  }

  if (!report.validation.ready) {
    throw new Error(
      "Local signed-in role shell regression drifted. Output remains local/sandbox-only and must not be used as production proof.",
    );
  }

  console.log(`Figma sandbox role shell regression written to ${outDir}`);
  console.log(
    "This report stays local/sandbox/Test-only and must not be used as production signed-in proof, rollout evidence, or invite-gate proof.",
  );
} catch (error) {
  console.error("Figma sandbox role shell regression was not built.");
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
