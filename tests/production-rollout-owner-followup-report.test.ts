import { describe, expect, it } from "vitest";
import type { ProductionRolloutOwnerPacketFoundFile } from "@/services/production-rollout-owner-packet-assembly";
import {
  formatProductionRolloutOwnerFollowupReport,
  getProductionRolloutOwnerFollowupReport,
  parseOwnerSendTrackerCsv,
} from "@/services/production-rollout-owner-followup-report";
import {
  getProductionRolloutOwnerPacketStatus,
} from "@/services/production-rollout-owner-packet-status";
import {
  formatProductionRolloutOwnerSendTrackerCsv,
} from "@/services/production-rollout-owner-send-tracker";

describe("production rollout owner follow-up report", () => {
  it("turns a blank send tracker into actionable follow-up issues", () => {
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
    const trackerCsv = formatProductionRolloutOwnerSendTrackerCsv({
      status,
      requestDirectoryName: "production-rollout-owner-requests",
      emailDraftDirectoryName: "production-rollout-owner-email-drafts",
    });
    const report = getProductionRolloutOwnerFollowupReport({
      status,
      trackerCsv,
    });
    const markdown = formatProductionRolloutOwnerFollowupReport(report);

    expect(report.ready).toBe(false);
    expect(report.summary.ownerCount).toBe(7);
    expect(report.summary.readyOwnerCount).toBe(0);
    expect(report.summary.draftedCount).toBe(7);
    expect(report.summary.missingRecipientCount).toBe(7);
    expect(report.rows.find((row) => row.ownerSlug === "ds-launch-owner")).toMatchObject({
      trackerStatus: "drafted",
      ownerReady: false,
      nextAction: "Add the correct owner recipient before sending.",
    });
    expect(markdown).toContain("myMEDLIFE owner follow-up report: NOT READY");
    expect(markdown).toContain("- drafted: 7");
    expect(markdown).toContain("recipientEmail is missing.");
    expect(markdown).toContain("No missing tracker rows.");
    expect(markdown).toContain("No extra tracker rows.");
    expect(markdown).not.toContain("API_KEY=");
  });

  it("flags returned trackers that still fail owner validation", () => {
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
    const trackerCsv = [
      "ownerSlug,owner,ready,blockerCount,emailDraftPath,requestDocPath,ownerFolderPath,recipientEmail,ccEmails,sendStatus,sentAt,returnedAt,validatedAt,nextAction,notes",
      "ds-launch-owner,DS / launch owner,no,3,draft.md,request.md,folder,ds@example.org,,returned,2026-07-06,2026-07-07,,next,note",
    ].join("\n");
    const report = getProductionRolloutOwnerFollowupReport({
      status,
      trackerCsv,
    });
    const dsRow = report.rows.find((row) => row.ownerSlug === "ds-launch-owner");

    expect(report.missingTrackerRows).toContain("nick-hq-launch-owner");
    expect(dsRow?.issues).toContain(
      "Owner returned files, but owner folder is still not validated.",
    );
    expect(dsRow?.nextAction).toBe("Fix validation blockers, then rerun owner status.");
  });

  it("accepts validated tracker rows when owner folders are ready", () => {
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
    const trackerCsv = formatProductionRolloutOwnerSendTrackerCsv({
      status,
      requestDirectoryName: "requests",
      emailDraftDirectoryName: "drafts",
    }).replaceAll(",,,validated,,,,", ",owner@example.org,,validated,,,2026-07-06,");
    const report = getProductionRolloutOwnerFollowupReport({
      status,
      trackerCsv,
    });

    expect(report.ready).toBe(true);
    expect(report.summary.validatedCount).toBe(7);
    expect(report.summary.issueCount).toBe(0);
    expect(
      report.rows.every(
        (row) =>
          row.nextAction ===
          "Ready for shared CSV assembly when every owner is validated.",
      ),
    ).toBe(true);
  });

  it("rejects tracker files with missing headers", () => {
    expect(() => parseOwnerSendTrackerCsv("ownerSlug,owner\nx,y\n")).toThrow(
      "Owner send tracker is missing header ready.",
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
