/* global console, process */
import { access, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm staff-admin-proof-rehearsal [--csv tests/fixtures/staff-admin-proof-rehearsal.test.csv] [--out /tmp/staff-admin-proof-rehearsal.md] [--review-note-out /tmp/staff-admin-proof-rehearsal-review-note.md] [--manifest-out /tmp/staff-admin-proof-rehearsal-review-note-manifest.json]",
  "",
  "This is read-only. It renders the TEST rehearsal packet into a browser/DOM-friendly snapshot and refuses to count the packet as production proof.",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}

try {
  const csvPath = getArgValue(args, "--csv") ?? "tests/fixtures/staff-admin-proof-rehearsal.test.csv";
  const outPath = getArgValue(args, "--out");
  const reviewNoteOutPath = getArgValue(args, "--review-note-out");
  const manifestOutPath = getArgValue(args, "--manifest-out");

  const {
    buildStaffAdminProofRehearsalBrowserSnapshot,
  } = await import("../src/services/staff-admin-proof-rehearsal-browser.ts");
  const {
    buildStaffAdminProofRehearsalReviewNote,
  } = await import("../src/services/staff-admin-proof-rehearsal-review-note.ts");
  const {
    buildStaffAdminProofRehearsalReviewNoteManifest,
    formatStaffAdminProofRehearsalReviewNoteManifestSummary,
    formatStaffAdminProofRehearsalReviewNoteManifest,
  } = await import("../src/services/staff-admin-proof-rehearsal-review-note-manifest.ts");

  const csv = await readFile(await resolveReadablePath(csvPath), "utf8");
  const snapshot = buildStaffAdminProofRehearsalBrowserSnapshot(csv);
  const output = formatSnapshot(snapshot);
  const reviewNote = buildStaffAdminProofRehearsalReviewNote(csv, {
    csvPath,
  });
  const manifest = buildStaffAdminProofRehearsalReviewNoteManifest(reviewNote);

  if (outPath) {
    await writeFile(resolve(outPath), `${output}\n`);
    console.log(`Staff/Admin TEST rehearsal snapshot written to ${resolve(outPath)}`);
  } else {
    console.log(output);
  }

  if (reviewNoteOutPath) {
    await writeFile(resolve(reviewNoteOutPath), `${reviewNote.markdown}\n`);
    console.log(`Staff/Admin TEST rehearsal reviewer note written to ${resolve(reviewNoteOutPath)}`);
  }

  if (manifestOutPath) {
    await writeFile(resolve(manifestOutPath), `${formatStaffAdminProofRehearsalReviewNoteManifest(manifest)}\n`);
    console.log(`Staff/Admin TEST rehearsal reviewer note manifest written to ${resolve(manifestOutPath)}`);
    console.log(formatStaffAdminProofRehearsalReviewNoteManifestSummary(manifest));
  }

  console.log(snapshot.summary.ready ? "PASS TEST rehearsal rows mapped cleanly." : "FAIL TEST rehearsal rows still have a boundary issue.");
  process.exit(snapshot.summary.ready ? 0 : 1);
} catch (error) {
  console.error("Staff/Admin TEST rehearsal snapshot: ERROR");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

function formatSnapshot(snapshot) {
  return [
    "# Staff/Admin TEST rehearsal browser snapshot",
    "",
    `Ready: ${snapshot.summary.ready ? "yes" : "no"}`,
    `Staff rows: ${snapshot.summary.staffRows}`,
    `Admin rows: ${snapshot.summary.adminRows}`,
    `Passed rows: ${snapshot.summary.passedRows}`,
    `Failed rows: ${snapshot.summary.failedRows}`,
    "",
    "The output below is TEST-only and blocked from production proof:",
    "",
    snapshot.html,
    "",
  ].join("\n");
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

async function resolveReadablePath(inputPath) {
  const candidates = [
    resolve(inputPath),
    resolve(dirname(fileURLToPath(import.meta.url)), "..", inputPath),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Keep trying.
    }
  }

  return resolve(inputPath);
}
