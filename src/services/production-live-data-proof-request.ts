import {
  productionLiveDataRelations,
  type ProductionLiveDataRelation,
} from "./production-live-data-readiness.ts";

export type ProductionLiveDataProofRequestOptions = {
  packetPath?: string;
  countsPath?: string;
  publicUrl?: string;
  dbUrlEnvName?: string;
  minimumChapterCount?: number;
  minimumApprovedMembershipCount?: number;
  minimumPilotEventCount?: number;
};

export type ProductionLiveDataProofRequest = Required<
  ProductionLiveDataProofRequestOptions
> & {
  status: "required_after_approved_production_apply";
  expectedRelations: ProductionLiveDataRelation[];
};

export function getProductionLiveDataProofRequest(
  options: ProductionLiveDataProofRequestOptions = {},
): ProductionLiveDataProofRequest {
  return {
    packetPath: options.packetPath ?? "production-rollout-packet.json",
    countsPath: options.countsPath ?? "production-live-data-counts.txt",
    publicUrl: options.publicUrl ?? "https://www.mymedlife.org",
    dbUrlEnvName: options.dbUrlEnvName ?? "SUPABASE_DB_URL",
    minimumChapterCount: options.minimumChapterCount ?? 30,
    minimumApprovedMembershipCount:
      options.minimumApprovedMembershipCount ?? 500,
    minimumPilotEventCount: options.minimumPilotEventCount ?? 5,
    status: "required_after_approved_production_apply",
    expectedRelations: [...productionLiveDataRelations],
  };
}

export function formatProductionLiveDataProofRequest(
  request: ProductionLiveDataProofRequest,
): string {
  const dataCountCommand = formatProductionDataCountCommand(request, false);
  const dataCountCommandWithDbUrl = formatProductionDataCountCommand(
    request,
    true,
  );

  return [
    "# myMEDLIFE Production Live-Data Proof Request",
    "",
    "Status: REQUIRED AFTER APPROVED PRODUCTION DATA APPLY",
    "",
    "## Plain-English Purpose",
    "",
    "Before myMEDLIFE invites about 500 students across 30 chapters, the production database must prove it has the expected launch rows.",
    "",
    "This request is count-only. It should not expose names, emails, passwords, database URLs, API keys, tokens, screenshots of private rows, or raw table exports.",
    "",
    "## Who Should Run This",
    "",
    "- DS/platform owner with approved production Supabase read access.",
    "- Run only after the approved rollout packet has been applied to production.",
    "- Do not run this as a substitute for packet review, signed-in role proof, or five-chapter event-loop proof.",
    "",
    "## When To Run",
    "",
    "1. `production-rollout-packet.json` has passed `pnpm rollout:check`.",
    "2. The approved production owner has applied the reviewed users, chapters, memberships, coach assignments, campaigns, and Luma mappings.",
    "3. No broad student invitation batch has been sent yet.",
    "4. External systems remain off unless their own approval gate has passed.",
    "",
    "## Command If Supabase Is Linked Locally",
    "",
    "```bash",
    dataCountCommand,
    "```",
    "",
    "## Command If Supabase Is Not Linked Locally",
    "",
    `Keep the approved production database URL in \`${request.dbUrlEnvName}\`. Do not paste it into the command, docs, PR comments, or Linear.`,
    "",
    "```bash",
    dataCountCommandWithDbUrl,
    "```",
    "",
    "## Final Invite Gate Command",
    "",
    "```bash",
    [
      "pnpm production:invite-gate",
      `  --packet ${request.packetPath}`,
      `  --live-data-counts ${request.countsPath}`,
      `  --public-url ${request.publicUrl}`,
      "  --out production-invite-gate.md",
    ].join(" \\\n"),
    "```",
    "",
    "## Required Count Rows",
    "",
    ...request.expectedRelations.map((relation) => `- ${relation}`),
    "",
    "## Minimum Passing Counts",
    "",
    `- active chapters: at least ${request.minimumChapterCount}`,
    `- approved memberships: at least ${request.minimumApprovedMembershipCount}`,
    `- production chapter events: at least ${request.minimumPilotEventCount}`,
    `- production Luma event links: at least ${request.minimumPilotEventCount}`,
    "- active staff role assignments: at least 1",
    "- active coach chapter assignments: enough to cover every active launch chapter",
    "- active campaigns: enough to cover every active launch chapter",
    "",
    "## Evidence To Return",
    "",
    `- \`${request.countsPath}\` with the command output.`,
    "- `production-invite-gate.md` with the final `pnpm production:invite-gate` output.",
    "- confirmation that no names, emails, passwords, tokens, database URLs, or row-level exports were included.",
    "",
    "## What This Does Not Do",
    "",
    "- does not create users",
    "- does not write database rows",
    "- does not apply migrations",
    "- does not change Auth, RLS, storage, DNS, Vercel, or Supabase settings",
    "- does not call Luma, HubSpot, n8n, warehouse, Power BI, SMS, email, or AI providers",
    "- does not approve the broad invite by itself",
    "",
    "## Broad Invite Must Stay Blocked If",
    "",
    "- this count proof is missing or says `NOT READY`",
    "- signed-in member, leader, staff, and admin route proof is missing",
    "- five-chapter Luma RSVP, attendance, points, audit, and zero-send proof is missing",
    "- support, rollback, production apply, or invite approval ownership is unnamed",
    "- external systems are accidentally enabled outside their approved gates",
    "",
  ].join("\n");
}

function formatProductionDataCountCommand(
  request: ProductionLiveDataProofRequest,
  useDbUrlEnv: boolean,
) {
  return [
    "pnpm production:data-counts",
    useDbUrlEnv ? `  --db-url-env ${request.dbUrlEnvName}` : null,
    `  --minimum-chapters=${request.minimumChapterCount}`,
    `  --minimum-approved-members=${request.minimumApprovedMembershipCount}`,
    `  --minimum-pilot-events=${request.minimumPilotEventCount}`,
    `  --out ${request.countsPath}`,
  ]
    .filter(Boolean)
    .join(" \\\n");
}
