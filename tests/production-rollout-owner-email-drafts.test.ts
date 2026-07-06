import { describe, expect, it } from "vitest";
import type { ProductionRolloutOwnerPacketFoundFile } from "@/services/production-rollout-owner-packet-assembly";
import {
  getProductionRolloutOwnerEmailDraftFiles,
} from "@/services/production-rollout-owner-email-drafts";
import {
  getProductionRolloutOwnerPacketStatus,
} from "@/services/production-rollout-owner-packet-status";

describe("production rollout owner email drafts", () => {
  it("turns owner status into copy/paste email drafts without sending anything", () => {
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
    const files = getProductionRolloutOwnerEmailDraftFiles(status, {
      requestDirectoryName: "production-rollout-owner-requests",
      launchOwnerLabel: "Nick / launch owner",
    });
    const index = getFile(files, "README.md");
    const nickDraft = getFile(files, "nick-hq-launch-owner.md");
    const dsDraft = getFile(files, "ds-launch-owner.md");

    expect(files.map((file) => file.path)).toEqual([
      "README.md",
      "nick-hq-launch-owner.md",
      "ds-launch-owner.md",
      "chapter-launch-owners.md",
      "sales-coaching-lead.md",
      "campaign-launch-owner.md",
      "luma-ds-owner.md",
      "launch-owner-ds.md",
    ]);
    expect(index).toContain("myMEDLIFE rollout owner email drafts: NOT READY");
    expect(index).toContain("These are copy/paste drafts only.");
    expect(index).toContain("Owner progress: 0/7 owners ready");
    expect(nickDraft).toContain(
      "Subject: myMEDLIFE rollout data request - Nick / HQ launch owner",
    );
    expect(nickDraft).toContain("To: [Nick / HQ launch owner owner email]");
    expect(nickDraft).toContain("Cc: [Nick / launch owner] [DS/platform owner if needed]");
    expect(nickDraft).toContain(
      "Complete the CSV files in production-rollout-owner-handoff/rollout-owner-packets/nick-hq-launch-owner.",
    );
    expect(nickDraft).toContain(
      "Use the detailed request doc at production-rollout-owner-requests/nick-hq-launch-owner.md.",
    );
    expect(nickDraft).toContain("chapters.csv needs 2 data rows; current: 0.");
    expect(dsDraft).toContain("users.csv needs 3 data rows; current: 0.");
    expect(dsDraft).toContain("This is only a data collection request.");
    expect(dsDraft).not.toContain("member.001@medlifemovement.org");
    expect(dsDraft).not.toContain("API_KEY=");
  });

  it("keeps ready-owner drafts focused on validation instead of fake blockers", () => {
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
    const files = getProductionRolloutOwnerEmailDraftFiles(status);
    const lumaDraft = getFile(files, "luma-ds-owner.md");

    expect(lumaDraft).toContain("Your current status is: READY.");
    expect(lumaDraft).toContain(
      "None. Your owner folder is ready for the next validation step.",
    );
    expect(lumaDraft).toContain(
      "luma-calendars.csv: 2/2 rows - ready",
    );
  });
});

function getFile(
  files: ReturnType<typeof getProductionRolloutOwnerEmailDraftFiles>,
  path: string,
) {
  const file = files.find((candidate) => candidate.path === path);

  if (!file) {
    throw new Error(`Missing generated owner email draft file ${path}.`);
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
