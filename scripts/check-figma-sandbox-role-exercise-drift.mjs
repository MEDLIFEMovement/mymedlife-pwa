/* global console, process */

const usage = [
  "Usage:",
  "  pnpm figma-seed:exercise:check",
  "",
  "Checks:",
  "  validates the local-only Figma sandbox role exercise against launch-lane route metadata",
].join("\n");

try {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const {
    buildFigmaSandboxRoleExerciseReport,
    getFigmaSandboxRoleExerciseDriftValidation,
  } = await import("../src/services/figma-sandbox-role-exercise.ts");

  const report = buildFigmaSandboxRoleExerciseReport();
  const validation = getFigmaSandboxRoleExerciseDriftValidation(report);

  for (const check of validation.checks) {
    console.log(`${check.passed ? "PASS" : "FAIL"} ${check.message}`);
  }

  if (!validation.ready) {
    throw new Error(
      "Figma sandbox role exercise drift check failed. This remains local-only and must not be used as production proof.",
    );
  }

  console.log(
    "Figma sandbox role exercise drift check: READY. Output remains local/sandbox-only and not production evidence.",
  );
} catch (error) {
  console.error("Figma sandbox role exercise drift check: NOT READY.");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}
