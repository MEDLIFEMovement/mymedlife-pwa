/* global console, process */

const usage = [
  "Usage:",
  "  pnpm production:signed-in-route-proof:check",
  "",
  "This is read-only. It checks that the required production signed-in proof classes still align with active launch-lane route metadata and that sandbox/Test/Figma sources remain excluded.",
].join("\n");

try {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const {
    formatProductionSignedInRouteProofDriftValidation,
    getProductionSignedInRouteProofDriftValidation,
  } = await import("../src/services/production-signed-in-route-proof.ts");
  const validation = getProductionSignedInRouteProofDriftValidation();

  console.log(formatProductionSignedInRouteProofDriftValidation(validation));
  process.exit(validation.ready ? 0 : 1);
} catch (error) {
  console.error("Production signed-in route proof drift check: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}
