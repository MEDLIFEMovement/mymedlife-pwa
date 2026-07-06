/* global console, process */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:sop-approval-readiness [--out sop-template-approval-readiness.md]",
  "",
  "This is read-only. It summarizes the draft/reviewed/scheduled/live/archived approval expectations for SOP/template content and repeats the safety boundary that keeps it out of launch evidence.",
].join("\n");

try {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const args = process.argv.slice(2);
  const outPath = getArgValue(args, "--out");
  const {
    formatSopTemplateApprovalReadinessReport,
    getSopTemplateApprovalReadinessReport,
  } = await import("../src/services/sop-template-approval-readiness.ts");
  const report = getSopTemplateApprovalReadinessReport();
  const formatted = formatSopTemplateApprovalReadinessReport(report);

  if (outPath) {
    await writeFile(resolve(outPath), `${formatted}\n`);
    console.log(`SOP/template approval readiness written to ${resolve(outPath)}`);
  } else {
    console.log(formatted);
  }

  process.exit(0);
} catch (error) {
  console.error("SOP/template approval readiness: ERROR");
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
