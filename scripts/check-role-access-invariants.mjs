/* global console, process */
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm auth:role-access-invariants [--out .codex-artifacts/auth]",
  "",
  "Writes:",
  "  role-access-invariants.json",
  "  role-access-invariants.md",
  "",
  "This is read-only. It summarizes the expected owner vs preview workspace access invariants for the four production proof classes and selected mixed-role actors.",
].join("\n");

try {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const args = process.argv.slice(2);
  const outDir = resolve(getArgValue(args, "--out") ?? ".codex-artifacts/auth");
  const {
    formatRoleAccessInvariantsReport,
    getRoleAccessInvariantsReport,
  } = await import("../src/services/role-access-invariants.ts");

  const report = getRoleAccessInvariantsReport();
  await mkdir(outDir, { recursive: true });
  await writeFile(
    join(outDir, "role-access-invariants.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await writeFile(
    join(outDir, "role-access-invariants.md"),
    `${formatRoleAccessInvariantsReport(report)}\n`,
  );

  for (const check of report.validation.checks) {
    console.log(`${check.passed ? "PASS" : "FAIL"} ${check.message}`);
  }

  console.log(`Role access invariants written to ${outDir}`);
  process.exit(report.validation.ready ? 0 : 1);
} catch (error) {
  console.error("Role access invariants: ERROR");
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
