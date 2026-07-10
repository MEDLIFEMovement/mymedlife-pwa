/* global console, process */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const usage = [
  "Usage:",
  "  pnpm staff-admin-proof-rehearsal:chain [--csv tests/fixtures/staff-admin-proof-rehearsal.test.csv]",
  "",
  "This is read-only. It runs the TEST rehearsal snapshot build and the on-disk round-trip verifier as one operator step.",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}

const csvPath = getArgValue(args, "--csv") ?? "tests/fixtures/staff-admin-proof-rehearsal.test.csv";
const scratchDir = mkdtempSync(join(tmpdir(), "mymedlife-staff-admin-chain-"));
const snapshotPath = join(scratchDir, "staff-admin-proof-rehearsal.md");
const reviewNotePath = join(scratchDir, "staff-admin-proof-rehearsal-review-note.md");
const manifestPath = join(scratchDir, "staff-admin-proof-rehearsal-review-note-manifest.json");

const checkResult = runNodeScript("scripts/check-staff-admin-proof-rehearsal.mjs", [
  "--csv",
  csvPath,
  "--out",
  snapshotPath,
  "--review-note-out",
  reviewNotePath,
  "--manifest-out",
  manifestPath,
]);

if (!checkResult.ok) {
  process.exit(checkResult.status);
}

const verifyResult = runNodeScript("scripts/verify-staff-admin-proof-rehearsal-artifacts.mjs", [
  "--review-note",
  reviewNotePath,
  "--manifest",
  manifestPath,
]);

process.exit(verifyResult.status);

function runNodeScript(scriptPath, scriptArgs) {
  const result = spawnSync(
    process.execPath,
    ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", scriptPath, ...scriptArgs],
    {
      encoding: "utf8",
    },
  );

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return {
    ok: result.status === 0,
    status: result.status ?? 1,
  };
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
