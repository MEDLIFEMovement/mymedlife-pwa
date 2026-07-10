/* global console, process */
const usage = [
  "Usage:",
  "  pnpm staff-admin-proof-rehearsal:verify --review-note /tmp/staff-admin-proof-rehearsal-review-note.md --manifest /tmp/staff-admin-proof-rehearsal-review-note-manifest.json",
  "",
  "This is read-only. It verifies that the emitted reviewer note and manifest still match each other and remain TEST-only.",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}

try {
  const reviewNotePath = getArgValue(args, "--review-note") ?? "/tmp/staff-admin-proof-rehearsal-review-note.md";
  const manifestPath =
    getArgValue(args, "--manifest") ?? "/tmp/staff-admin-proof-rehearsal-review-note-manifest.json";

  const {
    verifyStaffAdminProofRehearsalArtifactRoundTripFromDisk,
  } = await import("../src/services/staff-admin-proof-rehearsal-artifact-round-trip.ts");

  const verification = await verifyStaffAdminProofRehearsalArtifactRoundTripFromDisk({
    reviewNotePath,
    manifestPath,
  });

  console.log(`Staff/Admin TEST rehearsal artifact round-trip checked: ${verification.ready ? "PASS" : "FAIL"}`);
  console.log(`reviewNoteChecksum=${verification.summary.reviewNoteChecksum}`);
  console.log(`reviewNoteFixturePath=${verification.summary.reviewNoteFixturePath}`);
  console.log(`routeTargets=${verification.summary.routeTargets.join(",")}`);

  process.exit(verification.ready ? 0 : 1);
} catch (error) {
  console.error("Staff/Admin TEST rehearsal artifact round-trip: ERROR");
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
