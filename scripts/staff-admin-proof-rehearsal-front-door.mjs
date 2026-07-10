/* global console, process */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const frontDoor = [
  "# Staff/Admin TEST Rehearsal Front Door",
  "",
  "This is the single operator entrypoint for the Staff/Admin TEST rehearsal support family.",
  "It is read-only, TEST-only, and blocked from production proof.",
  "",
  "Start here:",
  "  pnpm staff-admin-proof-rehearsal:front-door",
  "",
  "What it points to:",
  "  1. pnpm staff-admin-proof-rehearsal:help",
  "  2. pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv",
  "  3. pnpm staff-admin-proof-rehearsal:workflow-verify",
  "",
  "Expected PASS text:",
  "  PASS TEST rehearsal rows mapped cleanly.",
  "  Staff/Admin TEST rehearsal artifact round-trip checked: PASS",
  "  Staff/Admin TEST rehearsal workflow-chain verifier: PASS",
  "",
  "Boundary reminder:",
  "  TEST-only rehearsal output",
  "  blocked from production proof",
  "  do not use this front door as live production evidence",
  "  keep the negative member row visible",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(frontDoor);
  process.exit(0);
}

const doc = await readFile(resolve("docs/staff-admin-proof-rehearsal-front-door.md"), "utf8");
console.log(doc);
