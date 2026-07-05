/* global console, process */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:gaps <packet.json> [--out production-rollout-gaps.md] [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5]",
  "",
  "This creates a read-only gap report for the production rollout packet.",
  "It does not create users, write Supabase rows, call Luma, send invites, or display invitee email lists.",
].join("\n");

const [packetPath, ...args] = process.argv.slice(2);

if (!packetPath || packetPath === "--help" || packetPath === "-h") {
  console.error(usage);
  process.exit(packetPath ? 0 : 1);
}

try {
  const outPath = getArgValue(args, "--out");
  const {
    formatProductionRolloutGapReport,
    getProductionRolloutGapReport,
  } = await import("../src/services/production-rollout-gap-report.ts");
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));
  const report = getProductionRolloutGapReport(packet, {
    minimumChapterCount: getPositiveWholeNumberArg(args, "--minimum-chapters", 30),
    minimumStudentMembershipCount: getPositiveWholeNumberArg(
      args,
      "--minimum-students",
      500,
    ),
    minimumPilotChapterCount: getPositiveWholeNumberArg(
      args,
      "--minimum-pilot-chapters",
      5,
    ),
  });
  const formattedReport = formatProductionRolloutGapReport(report);

  if (outPath) {
    await writeFile(resolve(outPath), `${formattedReport}\n`);
    console.log(`Production rollout gap report written to ${resolve(outPath)}`);
  } else {
    console.log(formattedReport);
  }

  process.exit(report.ready ? 0 : 1);
} catch (error) {
  console.error("Production rollout packet gaps: NOT READY");
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

function getPositiveWholeNumberArg(args, name, defaultValue) {
  const rawValue = getArgValue(args, name);

  if (!rawValue) {
    return defaultValue;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return value;
}
