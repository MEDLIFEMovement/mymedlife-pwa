/* global console, process */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm figma-seed:proof-separation [--out .codex-artifacts/figma-seed] [--packet production-rollout-packet.json]",
  "",
  "Writes:",
  "  local-vs-production-role-proof-separation.json",
  "  local-vs-production-role-proof-separation.md",
  "",
  "This is read-only. It compares local sandbox/Test role QA against the current production signed-in proof gap state.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const {
    buildLocalVsProductionRoleProofSeparationReport,
    formatLocalVsProductionRoleProofSeparationMarkdown,
  } = await import("../src/services/local-vs-production-role-proof-separation.ts");

  const packet = args.packet
    ? JSON.parse(await readFile(resolve(args.packet), "utf8"))
    : null;
  const report = buildLocalVsProductionRoleProofSeparationReport(packet);
  const outDir = resolve(args.out);
  await mkdir(outDir, { recursive: true });

  await writeFile(
    join(outDir, "local-vs-production-role-proof-separation.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await writeFile(
    join(outDir, "local-vs-production-role-proof-separation.md"),
    formatLocalVsProductionRoleProofSeparationMarkdown(report),
  );

  for (const check of report.validation.checks) {
    console.log(`${check.passed ? "PASS" : "FAIL"} ${check.message}`);
  }

  if (!report.validation.ready) {
    throw new Error(
      "Local-vs-production role proof separation report is not safe to use. Keep sandbox rehearsal and production proof separate.",
    );
  }

  console.log(`Local-vs-production role proof separation report written to ${outDir}`);
  console.log(
    "Sandbox/Test evidence remains excluded from production signed-in proof, rollout evidence, and invite-gate proof.",
  );
} catch (error) {
  console.error("Local-vs-production role proof separation report was not built.");
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
    packet: undefined,
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
