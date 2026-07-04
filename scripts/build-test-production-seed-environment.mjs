/* global console, process */
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm test-production:build [--out .codex-artifacts/test-production]",
  "",
  "Writes:",
  "  seed-test-production.sql",
  "  cleanup-test-production.sql",
  "  test-production-logins.md",
  "  test-production-summary.json",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const {
    buildTestProductionCleanupSql,
    buildTestProductionSeedSql,
    getTestProductionSeedEnvironment,
    getTestProductionSeedSummary,
    validateTestProductionSeedEnvironment,
  } = await import("../src/services/test-production-seed-environment.ts");
  const environment = getTestProductionSeedEnvironment();
  const validation = validateTestProductionSeedEnvironment(environment);

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

  await writeFile(join(outDir, "seed-test-production.sql"), buildTestProductionSeedSql(environment));
  await writeFile(
    join(outDir, "cleanup-test-production.sql"),
    buildTestProductionCleanupSql(environment),
  );
  await writeFile(
    join(outDir, "test-production-logins.md"),
    buildLoginMarkdown(environment),
  );
  await writeFile(
    join(outDir, "test-production-summary.json"),
    `${JSON.stringify(
      {
        generatedAt: environment.generatedAt,
        seedFamily: environment.seedFamily,
        summary: getTestProductionSeedSummary(environment),
        chapterScenarios: environment.chapterScenarios.map((chapter) => ({
          name: chapter.name,
          scenario: chapter.scenario,
          committees: chapter.committeeKeys.length,
          memberScale: chapter.memberScale,
        })),
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Test production seed packet written to ${outDir}`);
  console.log("Next: pnpm test-production:check");
} catch (error) {
  console.error("Test production seed packet was not built.");
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
    out: ".codex-artifacts/test-production",
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

function buildLoginMarkdown(environment) {
  const rows = environment.logins.map((login) =>
    [
      login.displayName,
      login.email,
      login.password,
      login.role,
      login.chapterName ?? "Test staff",
      login.demonstrates,
    ],
  );

  return [
    "# myMEDLIFE Test Production Logins",
    "",
    "All accounts are fictitious. Every email uses `test.*@example.com`.",
    "",
    "| Display name | Email | Password | Role | Chapter | Demonstrates |",
    "|---|---|---|---|---|---|",
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`),
    "",
  ].join("\n");
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|");
}
