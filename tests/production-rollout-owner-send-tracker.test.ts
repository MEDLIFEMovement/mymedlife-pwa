import { describe, expect, it } from "vitest";
import type { ProductionRolloutOwnerPacketFoundFile } from "@/services/production-rollout-owner-packet-assembly";
import {
  getProductionRolloutOwnerPacketStatus,
} from "@/services/production-rollout-owner-packet-status";
import {
  formatProductionRolloutOwnerRecipientAssignmentsCsvFromAssignments,
  getProductionRolloutOwnerSendTrackerFiles,
  hydrateProductionRolloutOwnerRecipientAssignments,
  parseProductionRolloutOwnerRecipientAssignmentsCsv,
} from "@/services/production-rollout-owner-send-tracker";

describe("production rollout owner send tracker", () => {
  it("creates a manual send and return tracker from owner packet status", () => {
    const status = getProductionRolloutOwnerPacketStatus({
      foundFiles: createOwnerFilesWithRows({}),
      sourceDirectoryName: "production-rollout-owner-handoff/rollout-owner-packets",
      outputDirectoryName: "rollout-csv",
      options: {
        minimumChapterCount: 2,
        minimumStudentMembershipCount: 3,
        minimumPilotChapterCount: 1,
      },
    });
    const files = getProductionRolloutOwnerSendTrackerFiles(status);
    const readme = getFile(files, "README.md");
    const csv = getFile(files, "owner-send-tracker.csv");
    const recipientAssignments = getFile(files, "owner-recipient-assignments.csv");

    expect(files.map((file) => file.path)).toEqual([
      "README.md",
      "owner-send-tracker.csv",
      "owner-recipient-assignments.csv",
    ]);
    expect(readme).toContain("myMEDLIFE owner send tracker: NOT READY");
    expect(readme).toContain("Owner progress: 0/7 owners ready");
    expect(readme).toContain("--recipient-assignments owner-recipient-assignments.csv");
    expect(readme).toContain("pnpm rollout:owner-recipients");
    expect(readme).toContain("drafted");
    expect(csv).toContain(
      "ownerSlug,owner,ready,blockerCount,emailDraftPath,requestDocPath,ownerFolderPath,recipientEmail,ccEmails,sendStatus,sentAt,returnedAt,validatedAt,nextAction,notes",
    );
    expect(csv).toContain(
      "ds-launch-owner,DS / launch owner,no,3,production-rollout-owner-email-drafts/ds-launch-owner.md,production-rollout-owner-requests/ds-launch-owner.md,production-rollout-owner-handoff/rollout-owner-packets/ds-launch-owner,,,drafted,,,",
    );
    expect(csv).toContain(
      "\"Send the owner request, collect completed CSVs, then rerun owner status.\"",
    );
    expect(recipientAssignments).toContain(
      "ownerSlug,owner,recipientEmail,ccEmails,notes",
    );
    expect(recipientAssignments).toContain("ds-launch-owner,DS / launch owner,,,");
    expect(csv).not.toContain("member.001@medlifemovement.org");
    expect(csv).not.toContain("API_KEY=");
  });

  it("marks ready owners as validated without inventing recipient data", () => {
    const status = getProductionRolloutOwnerPacketStatus({
      foundFiles: createOwnerFilesWithRows({
        "chapters.csv": 2,
        "users.csv": 3,
        "memberships.csv": 3,
        "staff-roles.csv": 1,
        "coach-assignments.csv": 2,
        "campaigns.csv": 2,
        "luma-calendars.csv": 2,
        "pilot-event-proof.csv": 1,
        "launch-owners.csv": 3,
        "signed-in-route-proof.csv": 4,
      }),
      sourceDirectoryName: "rollout-owner-packets",
      outputDirectoryName: "rollout-csv",
      options: {
        minimumChapterCount: 2,
        minimumStudentMembershipCount: 3,
        minimumPilotChapterCount: 1,
      },
    });
    const csv = getFile(
      getProductionRolloutOwnerSendTrackerFiles(status),
      "owner-send-tracker.csv",
    );

    expect(csv).toContain(
      "luma-ds-owner,Luma / DS owner,yes,0,production-rollout-owner-email-drafts/luma-ds-owner.md,production-rollout-owner-requests/luma-ds-owner.md,rollout-owner-packets/luma-ds-owner,,,validated,,,",
    );
    expect(csv).toContain(
      "Confirm this owner folder stays validated before packet assembly.",
    );
  });

  it("prefills recipient columns from assignment CSV without changing send status", () => {
    const status = getProductionRolloutOwnerPacketStatus({
      foundFiles: createOwnerFilesWithRows({}),
      sourceDirectoryName: "rollout-owner-packets",
      outputDirectoryName: "rollout-csv",
      options: {
        minimumChapterCount: 2,
        minimumStudentMembershipCount: 3,
        minimumPilotChapterCount: 1,
      },
    });
    const recipientAssignments = parseProductionRolloutOwnerRecipientAssignmentsCsv(
      [
        "ownerSlug,owner,recipientEmail,ccEmails,notes",
        "ds-launch-owner,DS / launch owner,ds@example.org,\"nick@example.org; kiomi@example.org\",Confirmed owner",
      ].join("\n"),
    );
    const csv = getFile(
      getProductionRolloutOwnerSendTrackerFiles(status, {
        recipientAssignments,
      }),
      "owner-send-tracker.csv",
    );
    const nextAssignmentCsv = getFile(
      getProductionRolloutOwnerSendTrackerFiles(status, {
        recipientAssignments,
      }),
      "owner-recipient-assignments.csv",
    );

    expect(csv).toContain(
      "ds-launch-owner,DS / launch owner,no,3,production-rollout-owner-email-drafts/ds-launch-owner.md,production-rollout-owner-requests/ds-launch-owner.md,rollout-owner-packets/ds-launch-owner,ds@example.org,nick@example.org; kiomi@example.org,drafted,,,,",
    );
    expect(csv).toContain("Confirmed owner");
    expect(nextAssignmentCsv).toContain(
      "ds-launch-owner,DS / launch owner,ds@example.org,nick@example.org; kiomi@example.org,Confirmed owner",
    );
    expect(nextAssignmentCsv).toContain(
      "nick-hq-launch-owner,Nick / HQ launch owner,,,",
    );
  });

  it("hydrates pasted answer assignments into the full owner assignment CSV", () => {
    const status = getProductionRolloutOwnerPacketStatus({
      foundFiles: createOwnerFilesWithRows({}),
      sourceDirectoryName: "rollout-owner-packets",
      outputDirectoryName: "rollout-csv",
      options: {
        minimumChapterCount: 2,
        minimumStudentMembershipCount: 3,
        minimumPilotChapterCount: 1,
      },
    });
    const hydratedAssignments = hydrateProductionRolloutOwnerRecipientAssignments(
      status,
      [
        {
          ownerSlug: "ds-launch-owner",
          owner: "",
          recipientEmail: "ds@example.org",
          ccEmails: "nick@example.org",
          notes: "production data owner",
        },
      ],
    );
    const csv = formatProductionRolloutOwnerRecipientAssignmentsCsvFromAssignments(
      hydratedAssignments,
    );

    expect(hydratedAssignments).toHaveLength(7);
    expect(csv).toContain("ownerSlug,owner,recipientEmail,ccEmails,notes");
    expect(csv).toContain(
      "ds-launch-owner,DS / launch owner,ds@example.org,nick@example.org,production data owner",
    );
    expect(csv).toContain("nick-hq-launch-owner,Nick / HQ launch owner,,,");
  });

  it("rejects recipient assignments for unknown owner slugs", () => {
    const status = getProductionRolloutOwnerPacketStatus({
      foundFiles: createOwnerFilesWithRows({}),
      sourceDirectoryName: "rollout-owner-packets",
      outputDirectoryName: "rollout-csv",
      options: {
        minimumChapterCount: 2,
        minimumStudentMembershipCount: 3,
        minimumPilotChapterCount: 1,
      },
    });
    const recipientAssignments = parseProductionRolloutOwnerRecipientAssignmentsCsv(
      [
        "ownerSlug,owner,recipientEmail,ccEmails,notes",
        "unknown-owner,Unknown owner,owner@example.org,,",
      ].join("\n"),
    );

    expect(() =>
      getProductionRolloutOwnerSendTrackerFiles(status, {
        recipientAssignments,
      }),
    ).toThrow("unknown ownerSlug unknown-owner");
  });
});

function getFile(
  files: ReturnType<typeof getProductionRolloutOwnerSendTrackerFiles>,
  path: string,
) {
  const file = files.find((candidate) => candidate.path === path);

  if (!file) {
    throw new Error(`Missing generated owner send tracker file ${path}.`);
  }

  return file.content;
}

function createOwnerFilesWithRows(rowCounts: Record<string, number>) {
  return [
    file("nick-hq-launch-owner", "chapters.csv", "id,name,campus,region,status", rowCounts),
    file("nick-hq-launch-owner", "launch-owners.csv", "email,ownerType,displayName,status", rowCounts),
    file("ds-launch-owner", "users.csv", "email,displayName", rowCounts),
    file("ds-launch-owner", "staff-roles.csv", "email,roleKey,status", rowCounts),
    file(
      "ds-launch-owner",
      "signed-in-route-proof.csv",
      "email,workspace,expectedPath,observedPath,status,checkedAt,notes",
      rowCounts,
    ),
    file("chapter-launch-owners", "memberships.csv", "email,chapterId,roleKey,status", rowCounts),
    file("sales-coaching-lead", "coach-assignments.csv", "coachEmail,chapterId,coachType,status", rowCounts),
    file("campaign-launch-owner", "campaigns.csv", "chapterId,name,slug,status", rowCounts),
    file("luma-ds-owner", "luma-calendars.csv", "chapterId,calendarId,calendarName,status", rowCounts),
    file(
      "launch-owner-ds",
      "pilot-event-proof.csv",
      "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes",
      rowCounts,
    ),
  ];
}

function file(
  ownerSlug: string,
  filename: string,
  header: string,
  rowCounts: Record<string, number>,
): ProductionRolloutOwnerPacketFoundFile {
  const rows = Array.from({ length: rowCounts[filename] ?? 0 }, (_, index) =>
    `value-${index}`,
  );

  return {
    ownerSlug,
    filename,
    content: `${header}\n${rows.join("\n")}${rows.length > 0 ? "\n" : ""}`,
  };
}
