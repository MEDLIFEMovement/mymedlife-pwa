import { describe, expect, it } from "vitest";
import type { ProductionRolloutOwnerPacketFoundFile } from "@/services/production-rollout-owner-packet-assembly";
import {
  getProductionRolloutOwnerPacketStatus,
} from "@/services/production-rollout-owner-packet-status";
import {
  formatProductionRolloutOwnerRecipientDecisionWorksheet,
  getProductionRolloutOwnerRecipientDecisionWorksheet,
} from "@/services/production-rollout-owner-recipient-decisions";
import {
  getProductionRolloutOwnerRecipientStatus,
} from "@/services/production-rollout-owner-recipient-status";
import {
  parseProductionRolloutOwnerRecipientAssignmentsCsv,
} from "@/services/production-rollout-owner-send-tracker";

describe("production rollout owner recipient decision worksheet", () => {
  it("turns blank owner recipient rows into a clear decision worksheet", () => {
    const status = createOwnerStatus();
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
    const worksheet = getProductionRolloutOwnerRecipientDecisionWorksheet({
      status,
      recipientStatus,
    });
    const markdown =
      formatProductionRolloutOwnerRecipientDecisionWorksheet(worksheet);

    expect(worksheet.ready).toBe(false);
    expect(worksheet.summary.assignedOwnerCount).toBe(0);
    expect(worksheet.summary.missingRecipientCount).toBe(7);
    expect(markdown).toContain("owner recipient decision worksheet: NOT READY");
    expect(markdown).toContain("Nick or named HQ launch operator");
    expect(markdown).toContain("DS / platform owner");
    expect(markdown).toContain("## Copy/Paste Answer Block");
    expect(markdown).toContain(
      "nick-hq-launch-owner | suggestedSeat=Nick or named HQ launch operator | recipientEmail= | ccEmails= | notes=",
    );
    expect(markdown).toContain("pending recipient decision");
    expect(markdown).toContain("Do not send broad student invitations");
    expect(markdown).not.toContain("password,");
    expect(markdown).not.toContain("api_key");
  });

  it("marks the worksheet ready when every owner has a recipient", () => {
    const status = createOwnerStatus();
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
    const worksheet = getProductionRolloutOwnerRecipientDecisionWorksheet({
      status,
      recipientStatus,
    });
    const markdown =
      formatProductionRolloutOwnerRecipientDecisionWorksheet(worksheet);

    expect(worksheet.ready).toBe(true);
    expect(worksheet.summary.assignedOwnerCount).toBe(7);
    expect(markdown).toContain(
      "owner recipient decision worksheet: READY TO SEND OWNER PACKETS",
    );
    expect(markdown).toContain(
      "nick-hq-launch-owner | suggestedSeat=Nick or named HQ launch operator | recipientEmail=nick@example.org | ccEmails=kiomi@example.org | notes=",
    );
    expect(markdown).toContain("confirm recipient before send");
  });
});

function createOwnerStatus() {
  return getProductionRolloutOwnerPacketStatus({
    foundFiles: createOwnerFilesWithRows({}),
    sourceDirectoryName: "rollout-owner-packets",
    outputDirectoryName: "rollout-csv",
    options: {
      minimumChapterCount: 2,
      minimumStudentMembershipCount: 3,
      minimumPilotChapterCount: 1,
    },
  });
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
