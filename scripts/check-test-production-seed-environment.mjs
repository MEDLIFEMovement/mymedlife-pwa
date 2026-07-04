/* global console, process */

try {
  const {
    formatTestProductionSeedValidation,
    getTestProductionSeedEnvironment,
    validateTestProductionSeedEnvironment,
  } = await import("../src/services/test-production-seed-environment.ts");
  const validation = validateTestProductionSeedEnvironment(getTestProductionSeedEnvironment());

  console.log(formatTestProductionSeedValidation(validation));
  process.exit(validation.ready ? 0 : 1);
} catch (error) {
  console.error("Test production seed packet: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
