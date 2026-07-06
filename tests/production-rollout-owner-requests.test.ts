import { describe, expect, it } from "vitest";
import type { ProductionRolloutOwnerPacketFoundFile } from "@/services/production-rollout-owner-packet-assembly";
import {
  getProductionRolloutOwnerRequestFiles,
} from "@/services/production-rollout-owner-requests";
import {
  getProductionRolloutOwnerPacketStatus,
} from "@/services/production-rollout-owner-packet-status";

describe("production rollout owner requests", () => {
  it("turns blank owner packets into clear owner-specific requests", () => {
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
    const files = getProductionRolloutOwnerRequestFiles(status);
    const index = getFile(files, "README.md");
    const nickRequest = getFile(files, "nick-hq-launch-owner.md");
    const dsRequest = getFile(files, "ds-launch-owner.md");

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
    expect(index).toContain("myMEDLIFE rollout owner requests: NOT READY");
    expect(index).toContain("Owner progress: 0/7 owners ready");
    expect(index).toContain("Send each owner the matching Markdown file");
    expect(index).toContain(
      "pnpm rollout:owner-status --owner-dir rollout-owner-packets --out production-rollout-owner-packet-status.md",
    );
    expect(index).toContain(
      "pnpm rollout:owner-requests --owner-dir rollout-owner-packets --out production-rollout-owner-requests",
    );
    expect(nickRequest).toContain("| chapters.csv | 0 | 2 | ready | NOT READY |");
    expect(nickRequest).toContain("| launch-owners.csv | 0 | 3 | ready | NOT READY |");
    expect(nickRequest).toContain("chapters.csv needs 2 data rows; current: 0.");
    expect(dsRequest).toContain("| users.csv | 0 | 3 | ready | NOT READY |");
    expect(dsRequest).toContain("| staff-roles.csv | 0 | 1 | ready | NOT READY |");
    expect(dsRequest).toContain(
      "| signed-in-route-proof.csv | 0 | 4 | ready | NOT READY |",
    );
    expect(dsRequest).toContain("No passwords or temporary passwords.");
    expect(dsRequest).toContain("No API keys, tokens, secrets");
    expect(dsRequest).not.toContain("member.001@medlifemovement.org");
  });

  it("shows ready owner folders without adding fake blockers", () => {
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
    const files = getProductionRolloutOwnerRequestFiles(status);
    const index = getFile(files, "README.md");
    const lumaRequest = getFile(files, "luma-ds-owner.md");

    expect(index).toContain(
      "myMEDLIFE rollout owner requests: READY FOR PACKET BUILD",
    );
    expect(index).toContain("Owner progress: 7/7 owners ready");
    expect(lumaRequest).toContain("Current status: READY");
    expect(lumaRequest).toContain(
      "None. This owner folder is ready for the next validation step.",
    );
    expect(lumaRequest).toContain("| luma-calendars.csv | 2 | 2 | ready | READY |");
  });
});

function getFile(
  files: ReturnType<typeof getProductionRolloutOwnerRequestFiles>,
  path: string,
) {
  const file = files.find((candidate) => candidate.path === path);

  if (!file) {
    throw new Error(`Missing generated owner request file ${path}.`);
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
