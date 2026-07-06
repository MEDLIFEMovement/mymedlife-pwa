import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutCurrentStatus,
  getProductionRolloutCurrentStatus,
  type ProductionRolloutCurrentStatusInput,
  type ProductionRolloutCurrentStatusPaths,
} from "@/services/production-rollout-current-status";
import type {
  ProductionLiveDataReadiness,
} from "@/services/production-live-data-readiness";
import type {
  ProductionRolloutBootstrapReadiness,
} from "@/services/production-rollout-bootstrap";
import type {
  ProductionRolloutOwnerPacketStatus,
} from "@/services/production-rollout-owner-packet-status";
import type {
  ProductionRolloutOwnerRecipientStatus,
} from "@/services/production-rollout-owner-recipient-status";

const paths: ProductionRolloutCurrentStatusPaths = {
  ownerDirectoryName: "rollout-owner-packets",
  csvDirectoryName: "rollout-csv",
  packetPath: "production-rollout-packet.json",
  liveDataCountsPath: "production-live-data-counts.txt",
  publicUrl: "https://www.mymedlife.org",
};

describe("production rollout current status", () => {
  it("starts with the owner-packet handoff when no rollout artifacts exist", () => {
    const status = getProductionRolloutCurrentStatus({
      paths,
      ownerDirectoryExists: false,
      csvDirectoryExists: false,
      rolloutPacketExists: false,
      liveDataCountsExists: false,
    });
    const report = formatProductionRolloutCurrentStatus(status, paths);

    expect(status.readyForFinalInviteGateReview).toBe(false);
    expect(status.currentBlocker).toContain("Owner packet folder");
    expect(status.nextCommands).toContain(
      "pnpm rollout:owner-handoff --out production-rollout-owner-handoff",
    );
    expect(report).toContain("30-chapter rollout current status: NOT READY");
    expect(report).toContain("owner packet folder: MISSING");
    expect(report).toContain("This is not a production write");
  });

  it("points to owner requests when the owner folder exists but owner data is incomplete", () => {
    const status = getProductionRolloutCurrentStatus(
      createBaseInput({
        ownerDirectoryExists: true,
        csvDirectoryExists: false,
        rolloutPacketExists: false,
        liveDataCountsExists: false,
        ownerPacketStatus: createOwnerStatus(false),
      }),
    );

    expect(status.currentBlocker).toContain("1/7 owners ready");
    expect(status.nextCommands).toContain(
      "pnpm rollout:owner-requests --owner-dir rollout-owner-packets --out production-rollout-owner-requests",
    );
    expect(status.nextCommands).toContain(
      "pnpm rollout:owner-email-drafts --owner-dir rollout-owner-packets --out production-rollout-owner-email-drafts",
    );
    expect(status.nextCommands).toContain(
      "pnpm rollout:owner-send-tracker --owner-dir rollout-owner-packets --out production-rollout-owner-send-tracker",
    );
    expect(status.nextCommands).toContain(
      "pnpm rollout:owner-recipient-answers --answers owner-recipient-answers.txt --owner-dir rollout-owner-packets --out production-rollout-owner-send-tracker/owner-recipient-assignments.csv",
    );
    expect(status.nextCommands).toContain(
      "pnpm rollout:owner-recipients --owner-dir rollout-owner-packets --recipient-assignments production-rollout-owner-send-tracker/owner-recipient-assignments.csv --out production-rollout-owner-recipient-status.md",
    );
    expect(status.nextCommands).toContain(
      "pnpm rollout:owner-send-tracker --owner-dir rollout-owner-packets --out production-rollout-owner-send-tracker --recipient-assignments production-rollout-owner-send-tracker/owner-recipient-assignments.csv",
    );
    expect(status.nextCommands).toContain(
      "pnpm rollout:owner-followup --owner-dir rollout-owner-packets --tracker production-rollout-owner-send-tracker/owner-send-tracker.csv --out production-rollout-owner-followup-report.md",
    );
  });

  it("prioritizes owner recipient assignments when that report is available and incomplete", () => {
    const recipientAssignmentsPath =
      "production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-recipient-assignments.csv";
    const status = getProductionRolloutCurrentStatus(
      createBaseInput({
        paths: {
          ...paths,
          recipientAssignmentsPath,
        },
        ownerDirectoryExists: true,
        csvDirectoryExists: false,
        rolloutPacketExists: false,
        liveDataCountsExists: false,
        ownerPacketStatus: createOwnerStatus(false),
        ownerRecipientStatus: createRecipientStatus(false),
      }),
    );
    const report = formatProductionRolloutCurrentStatus(status, {
      ...paths,
      recipientAssignmentsPath,
    });

    expect(status.currentBlocker).toContain(
      "Owner packet recipients are incomplete",
    );
    expect(status.currentBlocker).toContain("0/7 owner recipients assigned");
    expect(status.artifactStatuses).toContain(
      "owner recipient assignments: NOT READY (0/7 recipients assigned, 7 missing)",
    );
    expect(status.nextCommands).toContain(
      "Save the worksheet Copy/Paste Answer Block as owner-recipient-answers.txt.",
    );
    expect(status.nextCommands).toContain(
      `pnpm rollout:owner-recipient-answers --answers owner-recipient-answers.txt --owner-dir rollout-owner-packets --out ${recipientAssignmentsPath}`,
    );
    expect(status.nextCommands).toContain(
      `pnpm rollout:current-status --owner-dir rollout-owner-packets --recipient-assignments ${recipientAssignmentsPath} --out production-rollout-current-status.md`,
    );
    expect(report).toContain(
      `- owner recipient assignments: ${recipientAssignmentsPath}`,
    );
  });

  it("points to CSV assembly after owner packets are ready", () => {
    const status = getProductionRolloutCurrentStatus(
      createBaseInput({
        ownerDirectoryExists: true,
        csvDirectoryExists: false,
        ownerPacketStatus: createOwnerStatus(true),
      }),
    );

    expect(status.currentBlocker).toContain("Shared rollout CSV folder");
    expect(status.nextCommands).toContain(
      "pnpm rollout:assemble-owner-packets --owner-dir rollout-owner-packets --out rollout-csv",
    );
  });

  it("points to packet build when shared CSVs exist but the packet is missing", () => {
    const status = getProductionRolloutCurrentStatus(
      createBaseInput({
        ownerDirectoryExists: true,
        csvDirectoryExists: true,
        rolloutPacketExists: false,
        ownerPacketStatus: createOwnerStatus(true),
      }),
    );

    expect(status.currentBlocker).toContain("Production rollout packet");
    expect(status.nextCommands[0]).toContain("pnpm rollout:build");
    expect(status.nextCommands[1]).toBe(
      "pnpm rollout:check production-rollout-packet.json",
    );
  });

  it("reports unreadable rollout packets before live-data proof", () => {
    const status = getProductionRolloutCurrentStatus(
      createBaseInput({
        ownerDirectoryExists: true,
        csvDirectoryExists: true,
        rolloutPacketExists: true,
        ownerPacketStatus: createOwnerStatus(true),
        rolloutPacketError: "Unexpected token",
      }),
    );

    expect(status.currentBlocker).toContain("Unexpected token");
    expect(status.artifactStatuses).toContain(
      "production rollout packet: FOUND, unreadable",
    );
    expect(status.nextCommands[0]).toContain("pnpm rollout:build");
  });

  it("points to gap reports when the rollout packet exists but is incomplete", () => {
    const status = getProductionRolloutCurrentStatus(
      createBaseInput({
        ownerDirectoryExists: true,
        csvDirectoryExists: true,
        rolloutPacketExists: true,
        ownerPacketStatus: createOwnerStatus(true),
        rolloutReadiness: createRolloutReadiness({
          ready: false,
          blockers: ["Add at least 30 active production chapters."],
        }),
      }),
    );

    expect(status.currentBlocker).toContain(
      "Add at least 30 active production chapters.",
    );
    expect(status.nextCommands).toContain(
      "pnpm rollout:gaps production-rollout-packet.json --out production-rollout-gaps.md",
    );
  });

  it("requests live-data proof after the rollout packet is ready", () => {
    const status = getProductionRolloutCurrentStatus(
      createBaseInput({
        ownerDirectoryExists: true,
        csvDirectoryExists: true,
        rolloutPacketExists: true,
        liveDataCountsExists: false,
        ownerPacketStatus: createOwnerStatus(true),
        rolloutReadiness: createRolloutReadiness(),
      }),
    );

    expect(status.currentBlocker).toContain("live-data count proof");
    expect(status.nextCommands).toContain(
      "pnpm production:live-data-proof-request --out production-live-data-proof-request.md",
    );
  });

  it("reports unreadable live-data proof before inviting", () => {
    const status = getProductionRolloutCurrentStatus(
      createBaseInput({
        ownerDirectoryExists: true,
        csvDirectoryExists: true,
        rolloutPacketExists: true,
        liveDataCountsExists: true,
        ownerPacketStatus: createOwnerStatus(true),
        rolloutReadiness: createRolloutReadiness(),
        liveDataCountsError: "missing relation,rows header",
      }),
    );

    expect(status.currentBlocker).toContain("missing relation,rows header");
    expect(status.artifactStatuses).toContain(
      "production live-data count proof: FOUND, unreadable",
    );
    expect(status.nextCommands).toContain(
      "pnpm production:live-data-proof-request --out production-live-data-proof-request.md",
    );
  });

  it("keeps the invite gate blocked when live-data readiness is unavailable", () => {
    const status = getProductionRolloutCurrentStatus(
      createBaseInput({
        ownerDirectoryExists: true,
        csvDirectoryExists: true,
        rolloutPacketExists: true,
        liveDataCountsExists: true,
        ownerPacketStatus: createOwnerStatus(true),
        rolloutReadiness: createRolloutReadiness(),
      }),
    );

    expect(status.currentBlocker).toContain(
      "Production live-data count readiness was not available.",
    );
    expect(status.nextCommands).toContain(
      "pnpm production:data-counts > production-live-data-counts.txt",
    );
  });

  it("keeps the invite gate blocked when live-data counts are incomplete", () => {
    const status = getProductionRolloutCurrentStatus(
      createBaseInput({
        ownerDirectoryExists: true,
        csvDirectoryExists: true,
        rolloutPacketExists: true,
        liveDataCountsExists: true,
        ownerPacketStatus: createOwnerStatus(true),
        rolloutReadiness: createRolloutReadiness(),
        liveDataReadiness: createLiveDataReadiness({
          ready: false,
          blockers: ["Add at least 500 approved production memberships."],
        }),
      }),
    );

    expect(status.currentBlocker).toContain(
      "Add at least 500 approved production memberships.",
    );
    expect(status.nextCommands).toContain(
      "pnpm production:data-counts > production-live-data-counts.txt",
    );
  });

  it("points to the final invite gate only after all local artifacts are ready", () => {
    const status = getProductionRolloutCurrentStatus({
      paths,
      ownerDirectoryExists: true,
      csvDirectoryExists: true,
      rolloutPacketExists: true,
      liveDataCountsExists: true,
      ownerPacketStatus: createOwnerStatus(true),
      rolloutReadiness: createRolloutReadiness(),
      liveDataReadiness: createLiveDataReadiness(),
    });

    expect(status.readyForFinalInviteGateReview).toBe(true);
    expect(status.nextCommands[0]).toContain("pnpm production:invite-gate");
  });
});

function createBaseInput(
  overrides: Partial<ProductionRolloutCurrentStatusInput>,
): ProductionRolloutCurrentStatusInput {
  return {
    paths,
    ownerDirectoryExists: false,
    csvDirectoryExists: false,
    rolloutPacketExists: false,
    liveDataCountsExists: false,
    ...overrides,
  };
}

function createOwnerStatus(
  readyForPacketBuild: boolean,
): ProductionRolloutOwnerPacketStatus {
  return {
    readyForAssembly: readyForPacketBuild,
    readyForPacketBuild,
    sourceDirectoryName: "rollout-owner-packets",
    outputDirectoryName: "rollout-csv",
    ownerCount: 7,
    readyOwnerCount: readyForPacketBuild ? 7 : 1,
    owners: [],
    assembly: {
      ready: readyForPacketBuild,
      sourceDirectoryName: "rollout-owner-packets",
      outputDirectoryName: "rollout-csv",
      files: [],
      missingFiles: [],
      duplicateFiles: [],
      unexpectedFiles: [],
      headerErrors: [],
      nextCommands: [],
      safetyRules: [],
    },
    nextCommands: [],
    safetyRules: [],
  };
}

function createRecipientStatus(
  readyForOwnerPacketSend: boolean,
): ProductionRolloutOwnerRecipientStatus {
  return {
    readyForOwnerPacketSend,
    summary: {
      ownerCount: 7,
      assignedOwnerCount: readyForOwnerPacketSend ? 7 : 0,
      missingRecipientCount: readyForOwnerPacketSend ? 0 : 7,
      issueCount: readyForOwnerPacketSend ? 0 : 7,
    },
    rows: [],
    assignmentIssues: [],
  };
}

function createRolloutReadiness(
  overrides: Partial<ProductionRolloutBootstrapReadiness> = {},
): ProductionRolloutBootstrapReadiness {
  return {
    ready: true,
    counts: {
      activeChapters: 30,
      users: 505,
      approvedMemberships: 500,
      activeStaffRoles: 3,
      approvedStudentMemberships: 500,
      activeCoachAssignments: 30,
      activeCampaigns: 30,
      linkedLumaCalendars: 30,
      readyPilotEventProofChapters: 5,
      activeLaunchOwners: 3,
      memberWorkspaceUsers: 450,
      leaderWorkspaceUsers: 50,
      staffWorkspaceUsers: 2,
      adminWorkspaceUsers: 1,
      chaptersWithMemberWorkspaceAccess: 30,
      chaptersWithLeaderWorkspaceAccess: 30,
    },
    blockers: [],
    warnings: [],
    nextSteps: [],
    ...overrides,
  };
}

function createLiveDataReadiness(
  overrides: Partial<ProductionLiveDataReadiness> = {},
): ProductionLiveDataReadiness {
  return {
    ready: true,
    minimumChapterCount: 30,
    minimumApprovedMembershipCount: 500,
    minimumPilotEventCount: 5,
    counts: {
      "auth.users": 505,
      "app.profiles": 505,
      "app.chapters.active": 30,
      "app.memberships.approved": 500,
      "app.staff_role_assignments.active": 3,
      "app.coach_chapter_assignments.active": 30,
      "app.campaigns.active": 30,
      "app.chapter_events": 5,
      "app.luma_event_links": 5,
      "app.assignments": 5,
      "app.points_events": 5,
      "app.audit_logs": 5,
    },
    blockers: [],
    warnings: [],
    nextSteps: [],
    ...overrides,
  };
}
