/* global console, process */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:rehearsal [--out production-rollout-rehearsal.md]",
  "    [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5] [--max-recipients=75]",
  "",
  "This is read-only. It runs the 30-chapter / 500-student rollout preflight against generated Test data only.",
  "It does not write a production rollout packet, create users, write Supabase rows, call Luma, send invites, or change production config.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const {
    formatProductionRolloutRehearsal,
    getProductionRolloutRehearsal,
  } = await import("../src/services/production-rollout-rehearsal.ts");
  const rehearsal = getProductionRolloutRehearsal({
    minimumChapterCount: args.minimumChapters,
    minimumStudentMembershipCount: args.minimumStudents,
    minimumPilotChapterCount: args.minimumPilotChapters,
    maxRecipientsPerBatch: args.maxRecipients,
  });
  const formattedRehearsal = formatProductionRolloutRehearsal(rehearsal);

  if (args.out) {
    await writeFile(resolve(args.out), `${formattedRehearsal}\n`);
    console.log(`Production rollout rehearsal written to ${resolve(args.out)}`);
  } else {
    console.log(formattedRehearsal);
  }

  process.exit(rehearsal.ready ? 0 : 1);
} catch (error) {
  console.error("30-chapter rollout rehearsal: NOT READY");
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

  return {
    out: getValue(args, "--out"),
    minimumChapters: getPositiveWholeNumberArg(args, "--minimum-chapters", 30),
    minimumStudents: getPositiveWholeNumberArg(args, "--minimum-students", 500),
    minimumPilotChapters: getPositiveWholeNumberArg(
      args,
      "--minimum-pilot-chapters",
      5,
    ),
    maxRecipients: getPositiveWholeNumberArg(args, "--max-recipients", 75),
  };
}

function getValue(args, name) {
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
  const explicitValue = getValue(args, name);
  const parsed = Number(explicitValue ?? defaultValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return parsed;
}
