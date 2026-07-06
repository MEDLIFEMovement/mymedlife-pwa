/* global console, process */
import { access, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:current-status [--owner-dir rollout-owner-packets] [--csv-dir rollout-csv] [--packet production-rollout-packet.json] [--live-data-counts production-live-data-counts.txt] [--public-url https://www.mymedlife.org] [--out production-rollout-current-status.md]",
  "    [--minimum-chapters=30] [--minimum-students=500] [--minimum-pilot-chapters=5]",
  "",
  "This is read-only. It reports the next missing artifact for the 30-chapter / 500-student invite gate.",
  "It does not create users, write Supabase rows, call Luma, send invites, or change production config.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const paths = {
    ownerDirectoryName: args.ownerDir,
    csvDirectoryName: args.csvDir,
    packetPath: args.packet,
    liveDataCountsPath: args.liveDataCounts,
    publicUrl: args.publicUrl,
  };
  const [
    {
      formatProductionRolloutCurrentStatus,
      getProductionRolloutCurrentStatus,
    },
    {
      getProductionRolloutOwnerPacketStatus,
    },
    { getProductionRolloutOwnerPackets },
    { getProductionRolloutBootstrapReadiness },
    {
      getProductionLiveDataReadiness,
      parseProductionLiveDataCountCsv,
    },
  ] = await Promise.all([
    import("../src/services/production-rollout-current-status.ts"),
    import("../src/services/production-rollout-owner-packet-status.ts"),
    import("../src/services/production-rollout-owner-packets.ts"),
    import("../src/services/production-rollout-bootstrap.ts"),
    import("../src/services/production-live-data-readiness.ts"),
  ]);
  const ownerDirectoryExists = await fileExists(args.ownerDir);
  const csvDirectoryExists = await fileExists(args.csvDir);
  const rolloutPacketExists = await fileExists(args.packet);
  const liveDataCountsExists = await fileExists(args.liveDataCounts);
  const ownerPacketStatus = ownerDirectoryExists
    ? getProductionRolloutOwnerPacketStatus({
        foundFiles: await readOwnerPacketCsvFiles({
          ownerDir: args.ownerDir,
          knownOwnerSlugs: getProductionRolloutOwnerPackets().map(
            (packet) => packet.slug,
          ),
        }),
        sourceDirectoryName: args.ownerDir,
        outputDirectoryName: args.csvDir,
        options: {
          minimumChapterCount: args.minimumChapters,
          minimumStudentMembershipCount: args.minimumStudents,
          minimumPilotChapterCount: args.minimumPilotChapters,
        },
      })
    : null;
  const { rolloutReadiness, rolloutPacketError } = rolloutPacketExists
    ? await readRolloutReadiness({
        packetPath: args.packet,
        getProductionRolloutBootstrapReadiness,
        options: args,
      })
    : { rolloutReadiness: null, rolloutPacketError: null };
  const { liveDataReadiness, liveDataCountsError } = liveDataCountsExists
    ? await readLiveDataReadiness({
        liveDataCountsPath: args.liveDataCounts,
        getProductionLiveDataReadiness,
        parseProductionLiveDataCountCsv,
        options: args,
      })
    : { liveDataReadiness: null, liveDataCountsError: null };
  const status = getProductionRolloutCurrentStatus({
    paths,
    ownerDirectoryExists,
    csvDirectoryExists,
    rolloutPacketExists,
    liveDataCountsExists,
    ownerPacketStatus,
    rolloutReadiness,
    liveDataReadiness,
    rolloutPacketError,
    liveDataCountsError,
  });
  const report = formatProductionRolloutCurrentStatus(status, paths);

  if (args.out) {
    await writeFile(resolve(args.out), `${report}\n`);
    console.log(`Production rollout current status written to ${resolve(args.out)}`);
  } else {
    console.log(report);
  }

  process.exit(status.readyForFinalInviteGateReview ? 0 : 1);
} catch (error) {
  console.error("30-chapter rollout current status: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

async function readOwnerPacketCsvFiles({ ownerDir, knownOwnerSlugs }) {
  const ownerFolders = await getOwnerFolders(ownerDir, knownOwnerSlugs);
  const foundFiles = [];

  for (const ownerSlug of ownerFolders) {
    const filenames = await getCsvFilenames(join(ownerDir, ownerSlug));

    for (const filename of filenames) {
      foundFiles.push({
        ownerSlug,
        filename,
        content: await readFile(join(ownerDir, ownerSlug, filename), "utf8"),
      });
    }
  }

  return foundFiles;
}

async function readRolloutReadiness({
  packetPath,
  getProductionRolloutBootstrapReadiness,
  options,
}) {
  try {
    const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));

    return {
      rolloutReadiness: getProductionRolloutBootstrapReadiness(packet, {
        minimumChapterCount: options.minimumChapters,
        minimumStudentMembershipCount: options.minimumStudents,
        minimumPilotChapterCount: options.minimumPilotChapters,
      }),
      rolloutPacketError: null,
    };
  } catch (error) {
    return {
      rolloutReadiness: null,
      rolloutPacketError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function readLiveDataReadiness({
  liveDataCountsPath,
  getProductionLiveDataReadiness,
  parseProductionLiveDataCountCsv,
  options,
}) {
  try {
    const counts = parseProductionLiveDataCountCsv(
      await readFile(resolve(liveDataCountsPath), "utf8"),
    );

    return {
      liveDataReadiness: getProductionLiveDataReadiness(counts, {
        minimumChapterCount: options.minimumChapters,
        minimumApprovedMembershipCount: options.minimumStudents,
        minimumPilotEventCount: options.minimumPilotChapters,
      }),
      liveDataCountsError: null,
    };
  } catch (error) {
    return {
      liveDataReadiness: null,
      liveDataCountsError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function getOwnerFolders(ownerDir, knownOwnerSlugs) {
  const entries = await readdir(ownerDir, { withFileTypes: true });
  const folderNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  return [...new Set([...knownOwnerSlugs, ...folderNames])];
}

async function getCsvFilenames(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".csv"))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

async function fileExists(path) {
  try {
    await access(resolve(path));
    return true;
  } catch {
    return false;
  }
}

function parseArgs(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  return {
    ownerDir: getValue(args, "--owner-dir") ?? "rollout-owner-packets",
    csvDir: getValue(args, "--csv-dir") ?? "rollout-csv",
    packet: getValue(args, "--packet") ?? "production-rollout-packet.json",
    liveDataCounts:
      getValue(args, "--live-data-counts") ?? "production-live-data-counts.txt",
    publicUrl: getValue(args, "--public-url") ?? "https://www.mymedlife.org",
    out: getValue(args, "--out"),
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
