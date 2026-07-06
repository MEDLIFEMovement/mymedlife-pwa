import {
  getProductionRolloutIntakeStatus,
  type ProductionRolloutIntakeStatus,
} from "./production-rollout-intake-status.ts";
import type {
  ProductionRolloutBootstrapOptions,
  ProductionRolloutBootstrapPacket,
} from "./production-rollout-bootstrap.ts";

export type ProductionRolloutDataRequestSection = {
  owner: string;
  files: string[];
  status: "ready" | "needs_data" | "post_apply";
  currentRows: string[];
  asks: string[];
};

export type ProductionRolloutDataRequest = {
  ready: boolean;
  title: string;
  summary: string;
  intakeStatus: ProductionRolloutIntakeStatus;
  sections: ProductionRolloutDataRequestSection[];
  validationCommands: string[];
  safetyRules: string[];
};

export function getProductionRolloutDataRequest(
  packet: ProductionRolloutBootstrapPacket,
  options: ProductionRolloutBootstrapOptions = {},
): ProductionRolloutDataRequest {
  const intakeStatus = getProductionRolloutIntakeStatus(packet, options);
  const ready =
    intakeStatus.basePacketReady &&
    intakeStatus.pilotEventProofReady &&
    intakeStatus.signedInRouteProofReady;
  const sections = getDataRequestSections(packet, intakeStatus);

  return {
    ready,
    title: ready
      ? "myMEDLIFE 30-chapter data request: READY"
      : "myMEDLIFE 30-chapter data request: NOT READY",
    summary: ready
      ? "The CSV packet has the data needed for the final invite gate. Re-run the full validation sequence before any invites are sent."
      : "Use this owner-by-owner request list to collect the real launch data before production users, app rows, or invites are created.",
    intakeStatus,
    sections,
    validationCommands: [
      "pnpm rollout:intake-status --dir rollout-csv",
      "pnpm rollout:check-csv --dir rollout-csv",
      "pnpm rollout:build --chapters rollout-csv/chapters.csv --users rollout-csv/users.csv --memberships rollout-csv/memberships.csv --staff-roles rollout-csv/staff-roles.csv --coach-assignments rollout-csv/coach-assignments.csv --campaigns rollout-csv/campaigns.csv --luma-calendars rollout-csv/luma-calendars.csv --pilot-event-proof rollout-csv/pilot-event-proof.csv --launch-owners rollout-csv/launch-owners.csv --signed-in-route-proof rollout-csv/signed-in-route-proof.csv --out production-rollout-packet.json",
      "pnpm rollout:check production-rollout-packet.json",
      "pnpm rollout:gaps production-rollout-packet.json --out production-rollout-gaps.md",
      "pnpm rollout:luma-mappings --packet production-rollout-packet.json",
      "pnpm production:pilot-event-proof --packet production-rollout-packet.json",
      "pnpm production:signed-in-route-proof --packet production-rollout-packet.json",
      "pnpm production:invite-batches --packet production-rollout-packet.json",
      "pnpm production:invite-gate --packet production-rollout-packet.json --live-data-counts production-live-data-counts.txt --public-url https://www.mymedlife.org",
    ],
    safetyRules: [
      "Use real approved MEDLIFE rollout data only.",
      "Do not include passwords, temporary passwords, API keys, tokens, secrets, or private notes.",
      "Do not send invitations from this report.",
      "Do not create production users or app rows until the packet validates and the production apply owner approves.",
      "Keep the launch lane focused on login, member app, leader command center, staff command center, Luma events, RSVP, attendance/check-in, points, and leaderboards.",
    ],
  };
}

export function formatProductionRolloutDataRequest(
  request: ProductionRolloutDataRequest,
): string {
  return [
    `# ${request.title}`,
    "",
    request.summary,
    "",
    "This is a human data request. It does not create users, write Supabase rows, call Luma, send email, send SMS, trigger n8n, or change production config.",
    "",
    "It intentionally shows counts and owner asks only; it does not list individual student emails.",
    "",
    "## Current Status",
    "",
    `- base packet readiness: ${request.intakeStatus.basePacketReady ? "READY" : "NOT READY"}`,
    `- five-chapter pilot proof: ${request.intakeStatus.pilotEventProofReady ? "READY" : "NOT READY"}`,
    `- signed-in route proof: ${request.intakeStatus.signedInRouteProofReady ? "READY" : "NOT READY"}`,
    "",
    "## Count Snapshot",
    "",
    `- active chapters: ${request.intakeStatus.counts.chapters}/${request.intakeStatus.minimums.chapters}`,
    `- approved student/leader users: ${request.intakeStatus.counts.approvedStudentMemberships}/${request.intakeStatus.minimums.approvedStudentMemberships}`,
    `- ready pilot event-loop chapters: ${request.intakeStatus.counts.readyPilotEventProofChapters}/${request.intakeStatus.minimums.pilotChapters}`,
    `- users: ${request.intakeStatus.counts.users}`,
    `- active staff roles: ${request.intakeStatus.counts.activeStaffRoles}`,
    `- active coach assignments: ${request.intakeStatus.counts.activeCoachAssignments}`,
    `- active campaigns: ${request.intakeStatus.counts.activeCampaigns}`,
    `- linked Luma calendars: ${request.intakeStatus.counts.linkedLumaCalendars}`,
    `- active launch owners: ${request.intakeStatus.counts.launchOwners}`,
    `- passed signed-in route proof rows: ${request.intakeStatus.counts.passedSignedInRouteProofRows}`,
    "",
    "## Owner Requests",
    "",
    ...request.sections.flatMap(formatSection),
    "## Validation Commands",
    "",
    "Run these after the CSV files are filled:",
    "",
    "```bash",
    ...request.validationCommands,
    "```",
    "",
    "## Safety Rules",
    "",
    ...request.safetyRules.map((rule) => `- ${rule}`),
    "",
  ].join("\n");
}

function getDataRequestSections(
  packet: ProductionRolloutBootstrapPacket,
  intakeStatus: ProductionRolloutIntakeStatus,
): ProductionRolloutDataRequestSection[] {
  const counts = intakeStatus.counts;
  const minimums = intakeStatus.minimums;

  return [
    {
      owner: "Nick / HQ launch owner",
      files: ["chapters.csv", "launch-owners.csv"],
      status:
        counts.chapters >= minimums.chapters && hasRequiredOwners(packet)
          ? "ready"
          : "needs_data",
      currentRows: [
        `${counts.chapters} active chapter row(s)`,
        `${counts.launchOwners} active launch owner row(s)`,
      ],
      asks: [
        counts.chapters >= minimums.chapters
          ? "Confirm the 30 launch chapters are the approved first rollout group."
          : `Add ${minimums.chapters - counts.chapters} more active launch chapter row(s).`,
        ...getOwnerAsks(packet),
      ],
    },
    {
      owner: "DS / launch owner",
      files: ["users.csv", "staff-roles.csv", "signed-in-route-proof.csv"],
      status: intakeStatus.signedInRouteProofReady
        ? "ready"
        : counts.users > 0 && counts.activeStaffRoles > 0
          ? "post_apply"
          : "needs_data",
      currentRows: [
        `${counts.users} user row(s)`,
        `${counts.activeStaffRoles} active staff role row(s)`,
        `${counts.passedSignedInRouteProofRows} passed signed-in route proof row(s)`,
      ],
      asks: [
        counts.users > 0
          ? "Confirm users.csv includes every referenced student, leader, coach, admin, DS admin, and owner."
          : "Add every launch user to users.csv.",
        counts.activeStaffRoles > 0
          ? "Confirm staff-roles.csv grants only the minimum required coach/admin/DS access."
          : "Add active coach, admin, and DS Admin or Super Admin roles.",
        intakeStatus.signedInRouteProofReady
          ? "Signed-in route proof is present."
          : "After production users and app rows exist, record signed-in proof for member, leader, staff, admin, launch owners, and the ready pilot chapters.",
      ],
    },
    {
      owner: "Chapter launch owners",
      files: ["memberships.csv"],
      status:
        counts.approvedStudentMemberships >= minimums.approvedStudentMemberships
          ? "ready"
          : "needs_data",
      currentRows: [
        `${counts.approvedStudentMemberships} approved student/leader user(s)`,
      ],
      asks: [
        counts.approvedStudentMemberships >= minimums.approvedStudentMemberships
          ? "Confirm each active chapter has at least one member and one student leader."
          : `Add ${minimums.approvedStudentMemberships - counts.approvedStudentMemberships} more approved student/leader user(s).`,
      ],
    },
    {
      owner: "Sales / coaching lead",
      files: ["coach-assignments.csv"],
      status:
        counts.activeCoachAssignments >= counts.chapters && counts.chapters > 0
          ? "ready"
          : "needs_data",
      currentRows: [`${counts.activeCoachAssignments} active coach assignment row(s)`],
      asks: [
        counts.activeCoachAssignments >= counts.chapters && counts.chapters > 0
          ? "Confirm every launch chapter has coach coverage."
          : "Add one active coach assignment for every launch chapter.",
      ],
    },
    {
      owner: "Campaign / launch owner",
      files: ["campaigns.csv"],
      status:
        counts.activeCampaigns >= counts.chapters && counts.chapters > 0
          ? "ready"
          : "needs_data",
      currentRows: [`${counts.activeCampaigns} active campaign row(s)`],
      asks: [
        counts.activeCampaigns >= counts.chapters && counts.chapters > 0
          ? "Confirm the launch campaign is the events/RSVP/attendance/points campaign for each chapter."
          : "Add one active launch campaign for every chapter.",
      ],
    },
    {
      owner: "Luma / DS owner",
      files: ["luma-calendars.csv"],
      status:
        counts.linkedLumaCalendars >= minimums.chapters ? "ready" : "needs_data",
      currentRows: [`${counts.linkedLumaCalendars} linked Luma calendar row(s)`],
      asks: [
        counts.linkedLumaCalendars >= minimums.chapters
          ? "Confirm every launch chapter maps to the correct Luma calendar."
          : `Add ${minimums.chapters - counts.linkedLumaCalendars} linked Luma calendar mapping row(s).`,
      ],
    },
    {
      owner: "Launch owner / DS",
      files: ["pilot-event-proof.csv"],
      status: intakeStatus.pilotEventProofReady ? "ready" : "needs_data",
      currentRows: [
        `${counts.readyPilotEventProofChapters} ready pilot event-loop proof chapter(s)`,
      ],
      asks: [
        intakeStatus.pilotEventProofReady
          ? "Confirm the five pilot proof rows include RSVP, attendance, points, audit, outbox, route links, reviewer, and timestamp evidence."
          : `Add ready event-loop proof for ${minimums.pilotChapters - counts.readyPilotEventProofChapters} more pilot chapter(s).`,
      ],
    },
  ];
}

function formatSection(section: ProductionRolloutDataRequestSection) {
  return [
    `### ${section.owner}`,
    "",
    `Status: ${formatStatus(section.status)}`,
    "",
    `Files: ${section.files.join(", ")}`,
    "",
    "Current rows:",
    ...section.currentRows.map((row) => `- ${row}`),
    "",
    "Ask:",
    ...section.asks.map((ask) => `- ${ask}`),
    "",
  ];
}

function formatStatus(status: ProductionRolloutDataRequestSection["status"]) {
  if (status === "post_apply") {
    return "POST-APPLY PROOF NEEDED";
  }

  return status === "ready" ? "READY" : "NEEDS DATA";
}

function hasRequiredOwners(packet: ProductionRolloutBootstrapPacket) {
  const activeOwners = (packet.launchOwners ?? []).filter(
    (owner) => (owner.status ?? "active") === "active",
  );

  return ["support", "rollback", "production_apply"].every((ownerType) =>
    activeOwners.some((owner) => owner.ownerType === ownerType),
  );
}

function getOwnerAsks(packet: ProductionRolloutBootstrapPacket) {
  const activeOwners = (packet.launchOwners ?? []).filter(
    (owner) => (owner.status ?? "active") === "active",
  );
  const asks = ["support", "rollback", "production_apply"]
    .filter(
      (ownerType) => !activeOwners.some((owner) => owner.ownerType === ownerType),
    )
    .map((ownerType) => `Add an active ${ownerType.replace("_", " ")} owner.`);

  return asks.length > 0
    ? asks
    : ["Confirm support, rollback, and production apply owners are still correct."];
}
