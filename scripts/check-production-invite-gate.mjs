/* global console, process, fetch */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm production:invite-gate --packet production-rollout-packet.json --live-data-counts production-live-data-counts.txt [--public-url https://www.mymedlife.org] [--minimum-pilot-chapters=5] [--max-recipients=75] [--out production-invite-gate.md]",
  "",
  "This is read-only. It checks the public app route smoke plus the 30-chapter rollout packet, workspace coverage, pilot event proof, safe invite batches, owners, and handoff posture.",
  "The live-data-counts file should be the saved output from pnpm production:data-counts.",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.error(usage);
  process.exit(0);
}

try {
  const publicUrl = normalizeUrl(
    getArgValue(args, "--public-url") ?? "https://www.mymedlife.org",
  );
  const packetPath = getArgValue(args, "--packet");
  const liveDataCountsPath = getArgValue(args, "--live-data-counts");
  const minimumPilotChapterCount = getPositiveWholeNumberArg(
    args,
    "--minimum-pilot-chapters",
    5,
  );
  const maxRecipientsPerBatch = getPositiveWholeNumberArg(
    args,
    "--max-recipients",
    75,
  );

  if (!packetPath) {
    throw new Error("Missing required argument --packet.");
  }

  const [
    { getProductionCoreRouteSmokeResult },
    {
      formatProductionInviteGateReadiness,
      getProductionInviteGateReadiness,
    },
    {
      getProductionRolloutBootstrapReadiness,
    },
    {
      getProductionRolloutHandoff,
    },
    {
      getProductionLiveDataReadiness,
      parseProductionLiveDataCountCsv,
    },
  ] = await Promise.all([
    import("../src/services/production-core-route-smoke.ts"),
    import("../src/services/production-invite-gate.ts"),
    import("../src/services/production-rollout-bootstrap.ts"),
    import("../src/services/production-rollout-handoff.ts"),
    import("../src/services/production-live-data-readiness.ts"),
  ]);
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));
  const liveDataReadiness = liveDataCountsPath
    ? getProductionLiveDataReadiness(
        parseProductionLiveDataCountCsv(
          await readFile(resolve(liveDataCountsPath), "utf8"),
        ),
      )
    : null;
  const rolloutReadiness = getProductionRolloutBootstrapReadiness(packet, {
    minimumPilotChapterCount,
  });
  const routeSmoke = getProductionCoreRouteSmokeResult(
    await Promise.all([
      getRouteSnapshot(publicUrl, "/login", true),
      getRouteSnapshot(publicUrl, "/app", false),
      getRouteSnapshot(publicUrl, "/leader", false),
      getRouteSnapshot(publicUrl, "/staff", false),
      getRouteSnapshot(publicUrl, "/admin", false),
    ]),
  );
  const inviteGate = getProductionInviteGateReadiness({
    publicUrl,
    routeSmoke,
    rolloutPacket: packet,
    rolloutReadiness,
    rolloutHandoff: getProductionRolloutHandoff(packet),
    liveDataReadiness,
    minimumPilotChapterCount,
    maxRecipientsPerBatch,
  });
  const report = formatProductionInviteGateReadiness(inviteGate);
  const outPath = getArgValue(args, "--out");

  if (outPath) {
    await writeFile(resolve(outPath), `${report}\n`);
    console.log(`30-chapter invite gate written to ${resolve(outPath)}`);
  } else {
    console.log(report);
  }

  process.exit(inviteGate.ready ? 0 : 1);
} catch (error) {
  console.error("30-chapter invite gate: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

async function getRouteSnapshot(baseUrl, path, includeHtml) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
  });
  const snapshot = {
    path,
    status: response.status,
    location: response.headers.get("location"),
  };

  if (includeHtml) {
    snapshot.html = await response.text();
  }

  return snapshot;
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

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return parsed;
}

function normalizeUrl(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
