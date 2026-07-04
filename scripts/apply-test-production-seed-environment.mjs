/* global console, process */
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  MYMEDLIFE_TEST_PRODUCTION_CONFIRM=CREATE_TEST_DATA pnpm test-production:seed -- --local",
  "  MYMEDLIFE_TEST_PRODUCTION_CONFIRM=REMOVE_TEST_DATA pnpm test-production:cleanup -- --local",
  "",
  "Targets:",
  "  --local        Run against local Supabase",
  "  --linked       Run against the linked Supabase project",
  "  --db-url-env SUPABASE_DB_URL",
  "",
  "Safety:",
  "  Seed requires MYMEDLIFE_TEST_PRODUCTION_CONFIRM=CREATE_TEST_DATA.",
  "  Cleanup requires MYMEDLIFE_TEST_PRODUCTION_CONFIRM=REMOVE_TEST_DATA.",
  "  Do not run this against hosted production without explicit launch-owner approval.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode;
  const requiredConfirm = mode === "seed" ? "CREATE_TEST_DATA" : "REMOVE_TEST_DATA";

  if (process.env.MYMEDLIFE_TEST_PRODUCTION_CONFIRM !== requiredConfirm) {
    throw new Error(`Missing confirmation. Expected MYMEDLIFE_TEST_PRODUCTION_CONFIRM=${requiredConfirm}.`);
  }

  const {
    buildTestProductionCleanupSql,
    buildTestProductionSeedSql,
    getTestProductionSeedEnvironment,
    validateTestProductionSeedEnvironment,
  } = await import("../src/services/test-production-seed-environment.ts");
  const environment = getTestProductionSeedEnvironment();
  const validation = validateTestProductionSeedEnvironment(environment);

  if (!validation.ready) {
    throw new Error("Seed environment did not pass validation. Run pnpm test-production:check.");
  }

  const outDir = resolve(".codex-artifacts/test-production");
  await mkdir(outDir, { recursive: true });
  const sqlPath = join(
    outDir,
    mode === "seed" ? "seed-test-production.sql" : "cleanup-test-production.sql",
  );
  const sql = mode === "seed"
    ? buildTestProductionSeedSql(environment)
    : buildTestProductionCleanupSql(environment);

  await writeFile(sqlPath, sql);

  const queryArgs = [
    "dlx",
    "supabase@2.106.0",
    "db",
    "query",
    "--file",
    sqlPath,
  ];

  if (args.local) {
    queryArgs.push("--local");
  } else if (args.linked) {
    queryArgs.push("--linked");
  } else if (args.dbUrlEnv) {
    const dbUrl = process.env[args.dbUrlEnv];

    if (!dbUrl) {
      throw new Error(`Environment variable ${args.dbUrlEnv} is not set.`);
    }

    queryArgs.push("--db-url", dbUrl);
  } else {
    throw new Error("Choose exactly one target: --local, --linked, or --db-url-env NAME.");
  }

  console.log(`Applying ${mode} SQL from ${sqlPath}`);
  await run("pnpm", queryArgs);
} catch (error) {
  console.error("Test production seed command was not applied.");
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
    mode: process.env.MYMEDLIFE_TEST_PRODUCTION_MODE,
    local: false,
    linked: false,
    dbUrlEnv: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--mode") {
      parsed.mode = args[index + 1];
      index += 1;
    } else if (arg === "--local") {
      parsed.local = true;
    } else if (arg === "--linked") {
      parsed.linked = true;
    } else if (arg === "--db-url-env") {
      parsed.dbUrlEnv = args[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (parsed.mode !== "seed" && parsed.mode !== "cleanup") {
    throw new Error("Mode must be seed or cleanup.");
  }

  const targets = [parsed.local, parsed.linked, Boolean(parsed.dbUrlEnv)].filter(Boolean);
  if (targets.length !== 1) {
    throw new Error("Choose exactly one target.");
  }

  return parsed;
}

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}
