import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutOwnerPacketStatusReport,
  getProductionRolloutOwnerPacketStatus,
} from "@/services/production-rollout-owner-packet-status";
import type { ProductionRolloutOwnerPacketFoundFile } from "@/services/production-rollout-owner-packet-assembly";

describe("production rollout owner packet status", () => {
  it("shows blank owner templates are not ready even when assembly structure is valid", () => {
    const status = getProductionRolloutOwnerPacketStatus({
      foundFiles: createOwnerFilesWithRows({}),
      options: {
        minimumChapterCount: 2,
        minimumStudentMembershipCount: 3,
        minimumPilotChapterCount: 1,
      },
    });
    const report = formatProductionRolloutOwnerPacketStatusReport(status);

    expect(status.readyForAssembly).toBe(true);
    expect(status.readyForPacketBuild).toBe(false);
    expect(status.readyOwnerCount).toBe(0);
    expect(report).toContain("myMEDLIFE owner packet status: NOT READY");
    expect(report).toContain("Owner progress: 0/7 owners ready");
    expect(report).toContain("chapters.csv: 0/2 data rows");
    expect(report).toContain("users.csv needs 3 data rows; current: 0.");
    expect(report).toContain("This is a pre-assembly status check");
    expect(report).toContain(
      "pnpm rollout:owner-requests --owner-dir rollout-owner-packets --out production-rollout-owner-requests",
    );
    expect(report).toContain(
      "pnpm rollout:owner-email-drafts --owner-dir rollout-owner-packets --out production-rollout-owner-email-drafts",
    );
    expect(report).toContain(
      "pnpm rollout:owner-send-tracker --owner-dir rollout-owner-packets --out production-rollout-owner-send-tracker",
    );
    expect(report).toContain(
      "pnpm rollout:owner-followup --owner-dir rollout-owner-packets --tracker production-rollout-owner-send-tracker/owner-send-tracker.csv --out production-rollout-owner-followup-report.md",
    );
  });

  it("marks owner folders ready when expected files have enough data rows", () => {
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
      sourceDirectoryName: "owner-packets",
      outputDirectoryName: "rollout-csv",
      options: {
        minimumChapterCount: 2,
        minimumStudentMembershipCount: 3,
        minimumPilotChapterCount: 1,
      },
    });
    const report = formatProductionRolloutOwnerPacketStatusReport(status);

    expect(status.readyForAssembly).toBe(true);
    expect(status.readyForPacketBuild).toBe(true);
    expect(status.readyOwnerCount).toBe(7);
    expect(report).toContain(
      "myMEDLIFE owner packet status: READY FOR PACKET BUILD",
    );
    expect(report).toContain("Owner progress: 7/7 owners ready");
    expect(report).toContain(
      "pnpm rollout:assemble-owner-packets --owner-dir owner-packets --out rollout-csv",
    );
    expect(report).not.toContain("pnpm rollout:owner-requests");
    expect(report).not.toContain("pnpm rollout:owner-email-drafts");
    expect(report).not.toContain("pnpm rollout:owner-send-tracker");
    expect(report).not.toContain("pnpm rollout:owner-followup");
    expect(report).toContain("Passing this status only means");
  });

  it("keeps structural owner packet issues visible in the status report", () => {
    const status = getProductionRolloutOwnerPacketStatus({
      foundFiles: createOwnerFilesWithRows({
        "chapters.csv": 2,
      }).filter((file) => file.filename !== "memberships.csv"),
      options: {
        minimumChapterCount: 2,
        minimumStudentMembershipCount: 3,
        minimumPilotChapterCount: 1,
      },
    });
    const report = formatProductionRolloutOwnerPacketStatusReport(status);

    expect(status.readyForAssembly).toBe(false);
    expect(status.readyForPacketBuild).toBe(false);
    expect(report).toContain("Missing chapter-launch-owners/memberships.csv.");
    expect(report).toContain("memberships.csv is missing.");
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
