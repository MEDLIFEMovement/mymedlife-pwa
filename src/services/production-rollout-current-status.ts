import type {
  ProductionLiveDataReadiness,
} from "./production-live-data-readiness.ts";
import type {
  ProductionRolloutBootstrapReadiness,
} from "./production-rollout-bootstrap.ts";
import type {
  ProductionRolloutOwnerPacketStatus,
} from "./production-rollout-owner-packet-status.ts";
import type {
  ProductionRolloutOwnerRecipientStatus,
} from "./production-rollout-owner-recipient-status.ts";

export type ProductionRolloutCurrentStatusPaths = {
  ownerDirectoryName: string;
  recipientAssignmentsPath?: string;
  csvDirectoryName: string;
  packetPath: string;
  liveDataCountsPath: string;
  publicUrl: string;
};

export type ProductionRolloutCurrentStatusInput = {
  paths: ProductionRolloutCurrentStatusPaths;
  ownerDirectoryExists: boolean;
  csvDirectoryExists: boolean;
  csvDirectorySummary?: ProductionRolloutCsvDirectorySummary | null;
  rolloutPacketExists: boolean;
  liveDataCountsExists: boolean;
  ownerPacketStatus?: ProductionRolloutOwnerPacketStatus | null;
  ownerRecipientStatus?: ProductionRolloutOwnerRecipientStatus | null;
  rolloutReadiness?: ProductionRolloutBootstrapReadiness | null;
  liveDataReadiness?: ProductionLiveDataReadiness | null;
  rolloutPacketError?: string | null;
  liveDataCountsError?: string | null;
};

export type ProductionRolloutCsvDirectorySummary = {
  fileCount: number;
  dataRowCount: number;
};

export type ProductionRolloutCurrentStatus = {
  readyForFinalInviteGateReview: boolean;
  currentBlocker: string;
  openBlockers: string[];
  artifactStatuses: string[];
  nextCommands: string[];
  safetyRules: string[];
};

export function getProductionRolloutCurrentStatus(
  input: ProductionRolloutCurrentStatusInput,
): ProductionRolloutCurrentStatus {
  const currentBlocker = getCurrentBlocker(input);
  const openBlockers = getOpenBlockers(input);

  return {
    readyForFinalInviteGateReview: currentBlocker === null,
    currentBlocker:
      currentBlocker ??
      "Run the final invite gate and record human approval before sending any broad invitations.",
    openBlockers,
    artifactStatuses: getArtifactStatuses(input),
    nextCommands: getNextCommands(input, currentBlocker),
    safetyRules: [
      "This status report reads local files only.",
      "It does not create users, write Supabase rows, call Luma, send invites, send email/SMS, trigger n8n, or change production config.",
      "Do not add passwords, temporary passwords, API keys, tokens, database URLs, private notes, screenshots of private rows, or raw table exports to rollout artifacts.",
      "The launch lane remains limited to login, member app, leader command center, staff command center, Luma events, RSVP, attendance/check-in, points, and leaderboards.",
      "Do not invite the 30-chapter cohort until the final invite gate says READY and human approval is recorded.",
    ],
  };
}

export function formatProductionRolloutCurrentStatus(
  status: ProductionRolloutCurrentStatus,
  paths: ProductionRolloutCurrentStatusPaths,
): string {
  return [
    status.readyForFinalInviteGateReview
      ? "30-chapter rollout current status: READY FOR FINAL INVITE GATE REVIEW"
      : "30-chapter rollout current status: NOT READY",
    "",
    "Scope:",
    "- Tracks readiness to invite about 500 students across 30 chapters.",
    "- Focus stays on login, role workspaces, Luma events, RSVP, attendance/check-in, points, and leaderboards.",
    "- This is not a production write, invitation send, or final approval.",
    "",
    "Artifact paths:",
    `- owner packet folder: ${paths.ownerDirectoryName}`,
    ...(paths.recipientAssignmentsPath
      ? [`- owner recipient assignments: ${paths.recipientAssignmentsPath}`]
      : []),
    `- shared CSV folder: ${paths.csvDirectoryName}`,
    `- rollout packet: ${paths.packetPath}`,
    `- live-data count proof: ${paths.liveDataCountsPath}`,
    `- public URL: ${paths.publicUrl}`,
    "",
    "Artifact status:",
    ...status.artifactStatuses.map((line) => `- ${line}`),
    "",
    "Current blocker:",
    `- ${status.currentBlocker}`,
    "",
    "Open blockers:",
    ...formatOpenBlockers(status.openBlockers),
    "",
    "Next commands:",
    "```bash",
    ...status.nextCommands,
    "```",
    "",
    "Safety rules:",
    ...status.safetyRules.map((rule) => `- ${rule}`),
    "",
  ].join("\n");
}

function getCurrentBlocker(input: ProductionRolloutCurrentStatusInput) {
  if (!input.ownerDirectoryExists) {
    return `Owner packet folder ${input.paths.ownerDirectoryName} is missing. Generate/send the owner handoff kit and collect returned owner CSVs first.`;
  }

  if (!input.ownerPacketStatus) {
    return `Owner packet folder ${input.paths.ownerDirectoryName} could not be read.`;
  }

  if (!input.ownerPacketStatus.readyForPacketBuild) {
    if (
      input.ownerRecipientStatus &&
      !input.ownerRecipientStatus.readyForOwnerPacketSend
    ) {
      return [
        "Owner packet recipients are incomplete:",
        `${input.ownerRecipientStatus.summary.assignedOwnerCount}/${input.ownerRecipientStatus.summary.ownerCount} owner recipients assigned,`,
        `${input.ownerRecipientStatus.summary.missingRecipientCount} missing recipient email(s).`,
      ].join(" ");
    }

    return `Owner packets are incomplete: ${input.ownerPacketStatus.readyOwnerCount}/${input.ownerPacketStatus.ownerCount} owners ready.`;
  }

  if (!input.csvDirectoryExists) {
    return `Shared rollout CSV folder ${input.paths.csvDirectoryName} is missing. Assemble owner packets after all owners are ready.`;
  }

  if (isHeaderOnlyCsvDirectory(input.csvDirectorySummary)) {
    return `Shared rollout CSV folder ${input.paths.csvDirectoryName} is header-only. Add approved 30-chapter launch data before building the packet.`;
  }

  if (!input.rolloutPacketExists) {
    return `Production rollout packet ${input.paths.packetPath} is missing. Build it from the validated shared CSV folder.`;
  }

  if (input.rolloutPacketError) {
    return `Production rollout packet could not be read: ${input.rolloutPacketError}`;
  }

  if (!input.rolloutReadiness) {
    return "Production rollout packet readiness was not available.";
  }

  if (!input.rolloutReadiness.ready) {
    return `Production rollout packet is not ready: ${input.rolloutReadiness.blockers[0] ?? "packet blockers remain"}`;
  }

  if (!input.liveDataCountsExists) {
    return `Production live-data count proof ${input.paths.liveDataCountsPath} is missing. Run it only after approved production data apply.`;
  }

  if (input.liveDataCountsError) {
    return `Production live-data count proof could not be read: ${input.liveDataCountsError}`;
  }

  if (!input.liveDataReadiness) {
    return "Production live-data count readiness was not available.";
  }

  if (!input.liveDataReadiness.ready) {
    return `Production live-data count proof is not ready: ${input.liveDataReadiness.blockers[0] ?? "count blockers remain"}`;
  }

  return null;
}

function getOpenBlockers(input: ProductionRolloutCurrentStatusInput) {
  const blockers: string[] = [];

  if (!input.ownerDirectoryExists) {
    blockers.push(
      `Owner packet folder ${input.paths.ownerDirectoryName} is missing.`,
    );
  } else if (!input.ownerPacketStatus) {
    blockers.push(
      `Owner packet folder ${input.paths.ownerDirectoryName} could not be read.`,
    );
  } else {
    if (
      input.ownerRecipientStatus &&
      !input.ownerRecipientStatus.readyForOwnerPacketSend
    ) {
      blockers.push(
        [
          "Owner packet recipients are incomplete:",
          `${input.ownerRecipientStatus.summary.assignedOwnerCount}/${input.ownerRecipientStatus.summary.ownerCount} owner recipients assigned,`,
          `${input.ownerRecipientStatus.summary.missingRecipientCount} missing recipient email(s).`,
        ].join(" "),
      );
    }

    if (!input.ownerPacketStatus.readyForPacketBuild) {
      blockers.push(
        `Owner packets are incomplete: ${input.ownerPacketStatus.readyOwnerCount}/${input.ownerPacketStatus.ownerCount} owners ready.`,
      );
    }
  }

  if (!input.csvDirectoryExists) {
    blockers.push(
      `Shared rollout CSV folder ${input.paths.csvDirectoryName} is missing.`,
    );
  } else if (isHeaderOnlyCsvDirectory(input.csvDirectorySummary)) {
    blockers.push(
      `Shared rollout CSV folder ${input.paths.csvDirectoryName} is header-only. Add approved 30-chapter launch data before building the packet.`,
    );
  }

  if (!input.rolloutPacketExists) {
    blockers.push(
      `Production rollout packet ${input.paths.packetPath} is missing.`,
    );
  } else if (input.rolloutPacketError) {
    blockers.push(
      `Production rollout packet could not be read: ${input.rolloutPacketError}`,
    );
  } else if (!input.rolloutReadiness) {
    blockers.push("Production rollout packet readiness was not available.");
  } else if (!input.rolloutReadiness.ready) {
    blockers.push(
      `Production rollout packet is not ready: ${input.rolloutReadiness.blockers[0] ?? "packet blockers remain"}`,
    );
  }

  if (!input.liveDataCountsExists) {
    blockers.push(
      `Production live-data count proof ${input.paths.liveDataCountsPath} is missing.`,
    );
  } else if (input.liveDataCountsError) {
    blockers.push(
      `Production live-data count proof could not be read: ${input.liveDataCountsError}`,
    );
  } else if (!input.liveDataReadiness) {
    blockers.push("Production live-data count readiness was not available.");
  } else if (!input.liveDataReadiness.ready) {
    blockers.push(
      `Production live-data count proof is not ready: ${input.liveDataReadiness.blockers[0] ?? "count blockers remain"}`,
    );
  }

  return blockers;
}

function getArtifactStatuses(input: ProductionRolloutCurrentStatusInput) {
  return [
    input.ownerDirectoryExists
      ? getOwnerPacketStatusLine(input.ownerPacketStatus)
      : "owner packet folder: MISSING",
    ...getOwnerRecipientStatusLines(input.ownerRecipientStatus),
    input.csvDirectoryExists
      ? getCsvDirectoryStatusLine(input.csvDirectorySummary)
      : "shared rollout CSV folder: MISSING",
    input.rolloutPacketExists
      ? getRolloutPacketStatusLine(input)
      : "production rollout packet: MISSING",
    input.liveDataCountsExists
      ? getLiveDataStatusLine(input)
      : "production live-data count proof: MISSING",
  ];
}

function getOwnerPacketStatusLine(
  status: ProductionRolloutOwnerPacketStatus | null | undefined,
) {
  if (!status) {
    return "owner packet folder: FOUND, status unreadable";
  }

  return status.readyForPacketBuild
    ? `owner packets: READY (${status.readyOwnerCount}/${status.ownerCount} owners ready)`
    : `owner packets: NOT READY (${status.readyOwnerCount}/${status.ownerCount} owners ready)`;
}

function getOwnerRecipientStatusLines(
  status: ProductionRolloutOwnerRecipientStatus | null | undefined,
) {
  if (!status) {
    return [];
  }

  return [
    status.readyForOwnerPacketSend
      ? `owner recipient assignments: READY (${status.summary.assignedOwnerCount}/${status.summary.ownerCount} recipients assigned)`
      : `owner recipient assignments: NOT READY (${status.summary.assignedOwnerCount}/${status.summary.ownerCount} recipients assigned, ${status.summary.missingRecipientCount} missing)`,
  ];
}

function getCsvDirectoryStatusLine(
  summary: ProductionRolloutCsvDirectorySummary | null | undefined,
) {
  if (!summary) {
    return "shared rollout CSV folder: FOUND";
  }

  if (summary.fileCount === 0) {
    return "shared rollout CSV folder: FOUND, no CSV files";
  }

  if (summary.dataRowCount === 0) {
    return `shared rollout CSV folder: FOUND, header-only (${formatCount(summary.fileCount, "CSV file")}, 0 launch rows)`;
  }

  return `shared rollout CSV folder: FOUND (${formatCount(summary.fileCount, "CSV file")}, ${formatCount(summary.dataRowCount, "launch row")})`;
}

function isHeaderOnlyCsvDirectory(
  summary: ProductionRolloutCsvDirectorySummary | null | undefined,
) {
  return Boolean(summary && summary.fileCount > 0 && summary.dataRowCount === 0);
}

function formatCount(count: number, singularLabel: string) {
  return `${count} ${count === 1 ? singularLabel : `${singularLabel}s`}`;
}

function formatOpenBlockers(blockers: string[]) {
  if (blockers.length === 0) {
    return [
      "- No visible artifact blockers. Run the final invite gate and record human approval before sending broad invitations.",
    ];
  }

  return blockers.map((blocker) => `- ${blocker}`);
}

function getRolloutPacketStatusLine(input: ProductionRolloutCurrentStatusInput) {
  if (input.rolloutPacketError) {
    return "production rollout packet: FOUND, unreadable";
  }

  if (!input.rolloutReadiness) {
    return "production rollout packet: FOUND, readiness unavailable";
  }

  return input.rolloutReadiness.ready
    ? `production rollout packet: READY (${input.rolloutReadiness.counts.activeChapters} active chapters, ${input.rolloutReadiness.counts.approvedStudentMemberships} approved student/leader memberships)`
    : `production rollout packet: NOT READY (${input.rolloutReadiness.blockers.length} blocker(s))`;
}

function getLiveDataStatusLine(input: ProductionRolloutCurrentStatusInput) {
  if (input.liveDataCountsError) {
    return "production live-data count proof: FOUND, unreadable";
  }

  if (!input.liveDataReadiness) {
    return "production live-data count proof: FOUND, readiness unavailable";
  }

  return input.liveDataReadiness.ready
    ? `production live-data count proof: READY (${input.liveDataReadiness.counts["app.chapters.active"]} active chapters, ${input.liveDataReadiness.counts["app.memberships.approved"]} approved memberships)`
    : `production live-data count proof: NOT READY (${input.liveDataReadiness.blockers.length} blocker(s))`;
}

function getNextCommands(
  input: ProductionRolloutCurrentStatusInput,
  currentBlocker: string | null,
) {
  if (!currentBlocker) {
    return getFinalInviteGateCommands(input);
  }

  if (!input.ownerDirectoryExists) {
    return [
      "pnpm rollout:owner-handoff --out production-rollout-owner-handoff",
      "Send the matching owner folders and request docs to each owner.",
      `Copy returned owner CSV folders into ${input.paths.ownerDirectoryName}/`,
      `pnpm rollout:current-status --owner-dir ${input.paths.ownerDirectoryName} --out production-rollout-current-status.md`,
    ];
  }

  if (input.ownerPacketStatus && !input.ownerPacketStatus.readyForPacketBuild) {
    const recipientAssignmentsPath =
      input.paths.recipientAssignmentsPath ??
      "production-rollout-owner-send-tracker/owner-recipient-assignments.csv";

    if (
      input.ownerRecipientStatus &&
      !input.ownerRecipientStatus.readyForOwnerPacketSend
    ) {
      return [
        `pnpm rollout:owner-recipient-decisions --owner-dir ${input.paths.ownerDirectoryName} --recipient-assignments ${recipientAssignmentsPath} --out production-rollout-owner-recipient-decisions.md`,
        "Save the worksheet Copy/Paste Answer Block as owner-recipient-answers.txt.",
        `pnpm rollout:owner-recipient-answers --answers owner-recipient-answers.txt --owner-dir ${input.paths.ownerDirectoryName} --out ${recipientAssignmentsPath}`,
        `pnpm rollout:owner-recipients --owner-dir ${input.paths.ownerDirectoryName} --recipient-assignments ${recipientAssignmentsPath} --out production-rollout-owner-recipient-status.md`,
        `pnpm rollout:owner-send-tracker --owner-dir ${input.paths.ownerDirectoryName} --out production-rollout-owner-send-tracker --recipient-assignments ${recipientAssignmentsPath}`,
        `pnpm rollout:current-status --owner-dir ${input.paths.ownerDirectoryName} --recipient-assignments ${recipientAssignmentsPath} --out production-rollout-current-status.md`,
      ];
    }

    return [
      `pnpm rollout:owner-status --owner-dir ${input.paths.ownerDirectoryName} --out production-rollout-owner-packet-status.md`,
      `pnpm rollout:owner-requests --owner-dir ${input.paths.ownerDirectoryName} --out production-rollout-owner-requests`,
      `pnpm rollout:owner-email-drafts --owner-dir ${input.paths.ownerDirectoryName} --out production-rollout-owner-email-drafts`,
      `pnpm rollout:owner-send-tracker --owner-dir ${input.paths.ownerDirectoryName} --out production-rollout-owner-send-tracker`,
      `pnpm rollout:owner-recipient-decisions --owner-dir ${input.paths.ownerDirectoryName} --recipient-assignments production-rollout-owner-send-tracker/owner-recipient-assignments.csv --out production-rollout-owner-recipient-decisions.md`,
      "Save the worksheet Copy/Paste Answer Block as owner-recipient-answers.txt.",
      `pnpm rollout:owner-recipient-answers --answers owner-recipient-answers.txt --owner-dir ${input.paths.ownerDirectoryName} --out production-rollout-owner-send-tracker/owner-recipient-assignments.csv`,
      `pnpm rollout:owner-recipients --owner-dir ${input.paths.ownerDirectoryName} --recipient-assignments production-rollout-owner-send-tracker/owner-recipient-assignments.csv --out production-rollout-owner-recipient-status.md`,
      `pnpm rollout:owner-send-tracker --owner-dir ${input.paths.ownerDirectoryName} --out production-rollout-owner-send-tracker --recipient-assignments production-rollout-owner-send-tracker/owner-recipient-assignments.csv`,
      `pnpm rollout:owner-followup --owner-dir ${input.paths.ownerDirectoryName} --tracker production-rollout-owner-send-tracker/owner-send-tracker.csv --out production-rollout-owner-followup-report.md`,
      "Ask each owner to fix the blockers in their folder.",
      `pnpm rollout:current-status --owner-dir ${input.paths.ownerDirectoryName} --out production-rollout-current-status.md`,
    ];
  }

  if (!input.csvDirectoryExists) {
    return [
      `pnpm rollout:assemble-owner-packets --owner-dir ${input.paths.ownerDirectoryName} --out ${input.paths.csvDirectoryName}`,
      `pnpm rollout:check-csv --dir ${input.paths.csvDirectoryName}`,
      `pnpm rollout:preflight --dir ${input.paths.csvDirectoryName} --out production-rollout-preflight.md`,
    ];
  }

  if (isHeaderOnlyCsvDirectory(input.csvDirectorySummary)) {
    return [
      `Populate ${input.paths.csvDirectoryName} with approved owner-returned CSV rows.`,
      `pnpm rollout:check-csv --dir ${input.paths.csvDirectoryName}`,
      `pnpm rollout:preflight --dir ${input.paths.csvDirectoryName} --out production-rollout-preflight.md`,
      `pnpm rollout:current-status --csv-dir ${input.paths.csvDirectoryName} --out production-rollout-current-status.md`,
    ];
  }

  if (!input.rolloutPacketExists || input.rolloutPacketError) {
    return [
      [
        "pnpm rollout:build",
        `  --chapters ${input.paths.csvDirectoryName}/chapters.csv`,
        `  --users ${input.paths.csvDirectoryName}/users.csv`,
        `  --memberships ${input.paths.csvDirectoryName}/memberships.csv`,
        `  --staff-roles ${input.paths.csvDirectoryName}/staff-roles.csv`,
        `  --coach-assignments ${input.paths.csvDirectoryName}/coach-assignments.csv`,
        `  --campaigns ${input.paths.csvDirectoryName}/campaigns.csv`,
        `  --luma-calendars ${input.paths.csvDirectoryName}/luma-calendars.csv`,
        `  --pilot-event-proof ${input.paths.csvDirectoryName}/pilot-event-proof.csv`,
        `  --launch-owners ${input.paths.csvDirectoryName}/launch-owners.csv`,
        `  --signed-in-route-proof ${input.paths.csvDirectoryName}/signed-in-route-proof.csv`,
        `  --out ${input.paths.packetPath}`,
      ].join(" \\\n"),
      `pnpm rollout:check ${input.paths.packetPath}`,
    ];
  }

  if (input.rolloutReadiness && !input.rolloutReadiness.ready) {
    return [
      `pnpm rollout:gaps ${input.paths.packetPath} --out production-rollout-gaps.md`,
      `pnpm rollout:approval-summary ${input.paths.packetPath} --out production-rollout-approval-summary.md`,
      "Fix the packet rows, rebuild, and rerun this status check.",
    ];
  }

  if (!input.liveDataCountsExists || input.liveDataCountsError) {
    return [
      "pnpm production:live-data-proof-request --out production-live-data-proof-request.md",
      `pnpm production:data-counts --out ${input.paths.liveDataCountsPath}`,
      `pnpm rollout:current-status --packet ${input.paths.packetPath} --live-data-counts ${input.paths.liveDataCountsPath} --out production-rollout-current-status.md`,
    ];
  }

  if (!input.liveDataReadiness || !input.liveDataReadiness.ready) {
    return [
      `pnpm production:data-counts --out ${input.paths.liveDataCountsPath}`,
      `pnpm rollout:current-status --packet ${input.paths.packetPath} --live-data-counts ${input.paths.liveDataCountsPath} --out production-rollout-current-status.md`,
    ];
  }

  return getFinalInviteGateCommands(input);
}

function getFinalInviteGateCommands(input: ProductionRolloutCurrentStatusInput) {
  return [
    `pnpm production:data-counts --out ${input.paths.liveDataCountsPath}`,
    `pnpm production:invite-batches --packet ${input.paths.packetPath} --out production-invite-batches.md`,
    [
      "pnpm production:invite-gate",
      `  --packet ${input.paths.packetPath}`,
      `  --live-data-counts ${input.paths.liveDataCountsPath}`,
      `  --public-url ${input.paths.publicUrl}`,
      "  --out production-invite-gate.md",
    ].join(" \\\n"),
  ];
}
