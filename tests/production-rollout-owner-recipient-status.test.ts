import { describe, expect, it } from "vitest";
import type { ProductionRolloutOwnerPacketFoundFile } from "@/services/production-rollout-owner-packet-assembly";
import {
  getProductionRolloutOwnerPacketStatus,
} from "@/services/production-rollout-owner-packet-status";
import {
  formatProductionRolloutOwnerRecipientStatus,
  getProductionRolloutOwnerRecipientStatus,
} from "@/services/production-rollout-owner-recipient-status";
import {
  parseProductionRolloutOwnerRecipientAssignmentsCsv,
} from "@/services/production-rollout-owner-send-tracker";

describe("production rollout owner recipient status", () => {
  it("marks blank recipient assignments as not ready to send", () => {
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
    const recipientStatus = getProductionRolloutOwnerRecipientStatus({
      status,
      recipientAssignments: parseProductionRolloutOwnerRecipientAssignmentsCsv(
        [
          "ownerSlug,owner,recipientEmail,ccEmails,notes",
          "nick-hq-launch-owner,Nick / HQ launch owner,,,",
          "ds-launch-owner,DS / launch owner,,,",
        ].join("\n"),
      ),
    });
    const markdown = formatProductionRolloutOwnerRecipientStatus(recipientStatus);

    expect(recipientStatus.readyForOwnerPacketSend).toBe(false);
    expect(recipientStatus.summary.ownerCount).toBe(7);
    expect(recipientStatus.summary.assignedOwnerCount).toBe(0);
    expect(recipientStatus.summary.missingRecipientCount).toBe(7);
    expect(markdown).toContain("owner recipient readiness: NOT READY");
    expect(markdown).toContain("recipientEmail is missing.");
    expect(markdown).toContain("Do not send broad student invitations");
  });

  it("marks owner packet send ready when every owner has a valid recipient", () => {
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
    const recipientStatus = getProductionRolloutOwnerRecipientStatus({
      status,
      recipientAssignments: parseProductionRolloutOwnerRecipientAssignmentsCsv(
        [
          "ownerSlug,owner,recipientEmail,ccEmails,notes",
          "nick-hq-launch-owner,Nick / HQ launch owner,nick@example.org,kiomi@example.org,",
          "ds-launch-owner,DS / launch owner,ds@example.org,,",
          "chapter-launch-owners,Chapter launch owners,chapters@example.org,,",
          "sales-coaching-lead,Sales / coaching lead,sales@example.org,,",
          "campaign-launch-owner,Campaign / launch owner,campaign@example.org,,",
          "luma-ds-owner,Luma / DS owner,luma@example.org,,",
          "launch-owner-ds,Launch owner / DS,launch@example.org,,",
        ].join("\n"),
      ),
    });

    expect(recipientStatus.readyForOwnerPacketSend).toBe(true);
    expect(recipientStatus.summary.assignedOwnerCount).toBe(7);
    expect(recipientStatus.summary.issueCount).toBe(0);
    expect(
      formatProductionRolloutOwnerRecipientStatus(recipientStatus),
    ).toContain("owner recipient readiness: READY TO SEND");
  });

  it("flags unknown owners and secret-like assignment text", () => {
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
    const recipientStatus = getProductionRolloutOwnerRecipientStatus({
      status,
      recipientAssignments: parseProductionRolloutOwnerRecipientAssignmentsCsv(
        [
          "ownerSlug,owner,recipientEmail,ccEmails,notes",
          "unknown-owner,Unknown owner,owner@example.org,,",
          "ds-launch-owner,DS / launch owner,ds@example.org,,contains token",
        ].join("\n"),
      ),
    });

    expect(recipientStatus.readyForOwnerPacketSend).toBe(false);
    expect(recipientStatus.assignmentIssues).toContain(
      "Unknown ownerSlug unknown-owner.",
    );
    expect(recipientStatus.assignmentIssues).toContain(
      "Assignment row for ds-launch-owner contains unsafe secret-like text.",
    );
  });
});

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
