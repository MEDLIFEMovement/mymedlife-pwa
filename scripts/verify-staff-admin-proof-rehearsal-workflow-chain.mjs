/* global console, process */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm staff-admin-proof-rehearsal:workflow-verify [--workflow docs/staff-admin-proof-rehearsal-workflow-chain.md] [--quickstart docs/staff-admin-proof-rehearsal-quickstart.md] [--ops-note docs/staff-admin-proof-rehearsal-ops-note.md]",
  "",
  "This is read-only. It verifies the workflow-chain docs still align with the TEST-only staff/admin rehearsal boundary.",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}

try {
  const workflowPath = getArgValue(args, "--workflow") ?? "docs/staff-admin-proof-rehearsal-workflow-chain.md";
  const quickstartPath = getArgValue(args, "--quickstart") ?? "docs/staff-admin-proof-rehearsal-quickstart.md";
  const opsNotePath = getArgValue(args, "--ops-note") ?? "docs/staff-admin-proof-rehearsal-ops-note.md";

  const [workflow, quickstart, opsNote] = await Promise.all([
    readFile(resolve(workflowPath), "utf8"),
    readFile(resolve(quickstartPath), "utf8"),
    readFile(resolve(opsNotePath), "utf8"),
  ]);

  const checks = [
    {
      key: "workflow_mentions_help_alias",
      passed: workflow.includes("pnpm staff-admin-proof-rehearsal:help"),
      message: "Workflow chain must mention the help alias entrypoint.",
    },
    {
      key: "workflow_mentions_chain_command",
      passed: workflow.includes("pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv"),
      message: "Workflow chain must mention the exact chain command.",
    },
    {
      key: "workflow_mentions_boundary",
      passed: workflow.includes("TEST-only rehearsal output") && workflow.includes("blocked from production proof"),
      message: "Workflow chain must keep the TEST-only boundary explicit.",
    },
    {
      key: "quickstart_mentions_expected_pass",
      passed:
        quickstart.includes("PASS TEST rehearsal rows mapped cleanly.") &&
        quickstart.includes("Staff/Admin TEST rehearsal artifact round-trip checked: PASS"),
      message: "Quickstart must show the expected PASS lines.",
    },
    {
      key: "quickstart_mentions_failure_cases",
      passed:
        quickstart.includes("FAIL TEST rehearsal rows still have a boundary issue.") &&
        quickstart.includes("reviewNoteFixturePath=tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md") &&
        quickstart.includes("routeTargets=/staff?view=chapters,/admin,/app"),
      message: "Quickstart must call out the main failure cases.",
    },
    {
      key: "ops_note_mentions_boundary",
      passed:
        opsNote.includes("TEST-only rehearsal output") &&
        opsNote.includes("blocked from production proof") &&
        opsNote.includes("reviewer note, manifest, and checksum must stay aligned on disk"),
      message: "Ops note must keep the workflow boundary explicit.",
    },
  ];

  const ready = checks.every((check) => check.passed);

  console.log(`Staff/Admin TEST rehearsal workflow-chain verifier: ${ready ? "PASS" : "FAIL"}`);
  console.log(`workflowPath=${resolve(workflowPath)}`);
  console.log(`quickstartPath=${resolve(quickstartPath)}`);
  console.log(`opsNotePath=${resolve(opsNotePath)}`);
  for (const check of checks) {
    console.log(`${check.key}=${check.passed}`);
  }

  process.exit(ready ? 0 : 1);
} catch (error) {
  console.error("Staff/Admin TEST rehearsal workflow-chain verifier: ERROR");
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
