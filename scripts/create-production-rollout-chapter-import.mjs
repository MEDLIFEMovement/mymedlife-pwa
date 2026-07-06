/* global console, process */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:chapter-import --chapters launch-chapters.csv --out-dir rollout-csv [--force]",
  "",
  "This is read-only for production systems. It writes local chapters.csv, coach-assignments.csv, campaigns.csv, and luma-calendars.csv files from one chapter setup CSV.",
  "",
  "Chapter setup columns:",
  "  chapterId,chapterName,campus,region,coachEmail,coachType,calendarId,calendarName,campaignName,campaignSlug",
  "",
  "Required columns: chapterId, chapterName, campus, coachEmail, calendarId.",
  "Optional columns: region, chapterStatus, coachType, coachAssignmentStatus, campaignName, campaignSlug, campaignStatus, calendarName, calendarStatus.",
  "Defaults: chapterStatus=active, coachType=portfolio, coachAssignmentStatus=active, campaignName=Rush Month, campaignStatus=active, calendarStatus=linked.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const chaptersPath = resolve(args.chapters);
  const outDirectory = resolve(args.outDir);
  const outputFiles = [
    {
      path: join(outDirectory, "chapters.csv"),
      header: "id,name,campus,region,status",
      contentKey: "chaptersCsv",
    },
    {
      path: join(outDirectory, "coach-assignments.csv"),
      header: "coachEmail,chapterId,coachType,status",
      contentKey: "coachAssignmentsCsv",
    },
    {
      path: join(outDirectory, "campaigns.csv"),
      header: "chapterId,name,slug,status",
      contentKey: "campaignsCsv",
    },
    {
      path: join(outDirectory, "luma-calendars.csv"),
      header: "chapterId,calendarId,calendarName,status",
      contentKey: "lumaCalendarsCsv",
    },
  ];
  const { buildProductionRolloutChapterImport } = await import(
    "../src/services/production-rollout-chapter-import.ts"
  );
  const result = buildProductionRolloutChapterImport(
    await readFile(chaptersPath, "utf8"),
  );

  for (const outputFile of outputFiles) {
    await assertCanWriteCsv(outputFile.path, outputFile.header, args.force);
  }

  await mkdir(outDirectory, { recursive: true });

  for (const outputFile of outputFiles) {
    await mkdir(dirname(outputFile.path), { recursive: true });
    await writeFile(outputFile.path, result[outputFile.contentKey]);
  }

  console.log("Production rollout chapter import: READY");
  console.log(`- chapters: ${result.counts.chapters}`);
  console.log(`- coach assignments: ${result.counts.coachAssignments}`);
  console.log(`- launch campaigns: ${result.counts.campaigns}`);
  console.log(`- Luma calendars: ${result.counts.lumaCalendars}`);
  console.log(`- unique coaches: ${result.counts.uniqueCoaches}`);

  for (const outputFile of outputFiles) {
    console.log(`- wrote: ${outputFile.path}`);
  }

  console.log("");
  console.log(`Next: pnpm rollout:check-csv --dir ${outDirectory}`);
} catch (error) {
  console.error("Production rollout chapter import: NOT READY");
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

  const chapters = getValue(args, "--chapters");
  const outDir = getValue(args, "--out-dir");

  if (!chapters) {
    throw new Error("Missing required argument --chapters.");
  }

  if (!outDir) {
    throw new Error("Missing required argument --out-dir.");
  }

  return {
    chapters,
    outDir,
    force: args.includes("--force"),
  };
}

function getValue(args, name) {
  const index = args.indexOf(name);

  if (index !== -1) {
    return args[index + 1] ?? null;
  }

  const equalsFlag = args.find((arg) => arg.startsWith(`${name}=`));

  return equalsFlag?.slice(name.length + 1) ?? null;
}

async function assertCanWriteCsv(path, expectedHeader, force) {
  if (force) {
    return;
  }

  if (!(await pathExists(path))) {
    return;
  }

  const contents = await readFile(path, "utf8");
  const rows = contents
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length <= 1 && rows[0] === expectedHeader) {
    return;
  }

  throw new Error(
    `${path} already contains rollout rows. Re-run with --force only after confirming it is safe to replace.`,
  );
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
