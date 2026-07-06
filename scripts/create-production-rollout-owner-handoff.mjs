/* global console, process */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:owner-handoff --out production-rollout-owner-handoff [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5]",
  "",
  "This writes a complete owner handoff kit: blank owner CSV folders, blocker status, and owner request docs.",
  "It does not create users, write Supabase rows, call Luma, send invites, or change production config.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const outDir = resolve(args.out);
  const { getProductionRolloutOwnerHandoff } = await import(
    "../src/services/production-rollout-owner-handoff.ts"
  );
  const handoff = getProductionRolloutOwnerHandoff({
    outputDirectoryName: args.out,
    statusOptions: {
      minimumChapterCount: args.minimumChapters,
      minimumStudentMembershipCount: args.minimumStudents,
      minimumPilotChapterCount: args.minimumPilotChapters,
    },
  });

  for (const file of handoff.files) {
    const path = join(outDir, file.path);

    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, file.content);
  }

  console.log(`Production rollout owner handoff kit written to ${outDir}`);
  console.log(`Current status: ${handoff.ready ? "READY FOR PACKET BUILD" : "NOT READY"}`);
  console.log(
    `Owner progress: ${handoff.status.readyOwnerCount}/${handoff.status.ownerCount} owners ready`,
  );
} catch (error) {
  console.error("Production rollout owner handoff kit was not created.");
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

  const out = getValue(args, "--out");

  if (!out) {
    throw new Error("Missing required argument --out.");
  }

  return {
    out,
    minimumChapters: getPositiveWholeNumberArg(args, "--minimum-chapters", 30),
    minimumStudents: getPositiveWholeNumberArg(args, "--minimum-students", 500),
    minimumPilotChapters: getPositiveWholeNumberArg(
      args,
      "--minimum-pilot-chapters",
      5,
    ),
  };
}

function getValue(args, name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));

  if (inline) {
    return inline.slice(name.length + 1);
  }

  const index = args.indexOf(name);

  if (index === -1) {
    return null;
  }

  return args[index + 1] ?? null;
}

function getPositiveWholeNumberArg(args, name, defaultValue) {
  const explicitValue = getValue(args, name);
  const parsed = Number(explicitValue ?? defaultValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return parsed;
}
