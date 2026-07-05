/* global console, process */
import { spawnSync } from "node:child_process";

const usage = [
  "Usage:",
  "  pnpm production:data-counts [--minimum-chapters=30] [--minimum-approved-members=500] [--minimum-pilot-events=5]",
  "",
  "This is read-only. It runs aggregate count queries against the linked production Supabase project.",
  "It does not display user data, create rows, apply migrations, change auth, or enable integrations.",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}

try {
  const minimumChapters = getMinimumChapterCount(args);
  const minimumApprovedMembers = getMinimumApprovedMemberCount(args);
  const minimumPilotEvents = getMinimumPilotEventCount(args);
  const {
    formatProductionLiveDataReadiness,
    getProductionLiveDataReadiness,
    parseProductionLiveDataCountCsv,
  } = await import("../src/services/production-live-data-readiness.ts");
  const query = [
    "select 'auth.users' as relation, count(*)::bigint as rows from auth.users",
    "union all select 'app.profiles', count(*)::bigint from app.profiles",
    "union all select 'app.chapters.active', count(*)::bigint from app.chapters where status = 'active'",
    "union all select 'app.memberships.approved', count(*)::bigint from app.memberships where status = 'approved'",
    "union all select 'app.staff_role_assignments.active', count(*)::bigint from app.staff_role_assignments where status = 'active'",
    "union all select 'app.coach_chapter_assignments.active', count(*)::bigint from app.coach_chapter_assignments where status = 'active'",
    "union all select 'app.campaigns.active', count(*)::bigint from app.campaigns where status = 'active'",
    "union all select 'app.chapter_events', count(*)::bigint from app.chapter_events",
    "union all select 'app.luma_event_links', count(*)::bigint from app.luma_event_links",
    "union all select 'app.assignments', count(*)::bigint from app.assignments",
    "union all select 'app.points_events', count(*)::bigint from app.points_events",
    "union all select 'app.audit_logs', count(*)::bigint from app.audit_logs",
    "order by relation;",
  ].join(" ");
  const result = spawnSync(
    "pnpm",
    ["exec", "supabase", "db", "query", "--linked", "--output", "csv", query],
    {
      encoding: "utf8",
    },
  );

  if (result.error) {
    throw result.error;
  }

  const combinedOutput = [result.stdout, result.stderr].join("\n");

  if (result.status !== 0) {
    throw new Error(combinedOutput.trim() || "Supabase count query failed.");
  }

  const counts = parseProductionLiveDataCountCsv(combinedOutput);
  const readiness = getProductionLiveDataReadiness(counts, {
    minimumChapterCount: minimumChapters,
    minimumApprovedMembershipCount: minimumApprovedMembers,
    minimumPilotEventCount: minimumPilotEvents,
  });

  console.log(formatProductionLiveDataReadiness(readiness));
  process.exit(readiness.ready ? 0 : 1);
} catch (error) {
  console.error("Production live data count check: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

function getMinimumChapterCount(args) {
  return getPositiveWholeNumberArg(args, "--minimum-chapters", "30");
}

function getMinimumApprovedMemberCount(args) {
  return getPositiveWholeNumberArg(args, "--minimum-approved-members", "500");
}

function getMinimumPilotEventCount(args) {
  return getPositiveWholeNumberArg(args, "--minimum-pilot-events", "5");
}

function getPositiveWholeNumberArg(args, name, defaultValue) {
  const explicitValue = getValue(args, name);
  const equalsFlag = args.find((arg) => arg.startsWith(`${name}=`));
  const value = explicitValue ?? equalsFlag?.split("=")[1] ?? defaultValue;
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return parsed;
}

function getValue(args, name) {
  const index = args.indexOf(name);

  if (index === -1) {
    return null;
  }

  return args[index + 1] ?? null;
}
