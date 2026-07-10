/* global console, process */

const help = [
  "Staff/Admin TEST rehearsal chain help",
  "",
  "Run:",
  "  pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv",
  "",
  "Expected PASS lines:",
  "  PASS TEST rehearsal rows mapped cleanly.",
  "  Staff/Admin TEST rehearsal artifact round-trip checked: PASS",
  "",
  "Inputs:",
  "  tests/fixtures/staff-admin-proof-rehearsal.test.csv",
  "  the exported-note build step from the same rehearsal packet",
  "  the on-disk reviewer note and manifest created by the chain command",
  "",
  "Boundary:",
  "  TEST-only rehearsal output",
  "  blocked from production proof",
  "  do not use this help text as live production evidence",
].join("\n");

console.log(help);
