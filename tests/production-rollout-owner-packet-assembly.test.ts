import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutOwnerPacketAssemblyReport,
  getProductionRolloutOwnerPacketAssembly,
  type ProductionRolloutOwnerPacketFoundFile,
} from "@/services/production-rollout-owner-packet-assembly";
import { productionRolloutCsvTemplates } from "@/services/production-rollout-csv-templates";

describe("production rollout owner packet assembly", () => {
  it("assembles the expected owner CSV files into the shared rollout folder", () => {
    const assembly = getProductionRolloutOwnerPacketAssembly({
      foundFiles: createCompleteOwnerFiles(),
      sourceDirectoryName: "rollout-owner-packets",
      outputDirectoryName: "rollout-csv",
    });
    const report = formatProductionRolloutOwnerPacketAssemblyReport(assembly);

    expect(assembly.ready).toBe(true);
    expect(assembly.files.map((file) => file.filename)).toEqual(
      productionRolloutCsvTemplates.map((template) => template.filename),
    );
    expect(assembly.files.find((file) => file.filename === "users.csv")).toMatchObject({
      ownerSlug: "ds-launch-owner",
      sourcePath: "ds-launch-owner/users.csv",
    });
    expect(report).toContain("myMEDLIFE owner packet assembly: READY");
    expect(report).toContain("pnpm rollout:check-csv --dir rollout-csv");
    expect(report).toContain("This assembly step writes local CSV files only.");
    expect(report).not.toContain("member.001@medlifemovement.org");
  });

  it("blocks missing, duplicate, unexpected, and wrong-header CSV files", () => {
    const foundFiles = createCompleteOwnerFiles()
      .filter((file) => file.filename !== "memberships.csv")
      .concat([
        {
          ownerSlug: "chapter-launch-owners",
          filename: "users.csv",
          content: "email,displayName\n",
        },
        {
          ownerSlug: "luma-ds-owner",
          filename: "notes.csv",
          content: "notes\n",
        },
      ])
      .map((file) =>
        file.filename === "chapters.csv"
          ? { ...file, content: "id,name\nchapter-ucla,UCLA MEDLIFE\n" }
          : file,
      );
    const assembly = getProductionRolloutOwnerPacketAssembly({ foundFiles });
    const report = formatProductionRolloutOwnerPacketAssemblyReport(assembly);

    expect(assembly.ready).toBe(false);
    expect(report).toContain("myMEDLIFE owner packet assembly: NOT READY");
    expect(report).toContain("Missing chapter-launch-owners/memberships.csv.");
    expect(report).toContain("users.csv appears in multiple owner folders");
    expect(report).toContain("users.csv belongs in ds-launch-owner, not chapter-launch-owners.");
    expect(report).toContain("luma-ds-owner/notes.csv is not part of the production rollout CSV packet.");
    expect(report).toContain('nick-hq-launch-owner/chapters.csv has header "id,name"');
  });
});

function createCompleteOwnerFiles(): ProductionRolloutOwnerPacketFoundFile[] {
  return [
    file("nick-hq-launch-owner", "chapters.csv", "id,name,campus,region,status"),
    file("nick-hq-launch-owner", "launch-owners.csv", "email,ownerType,displayName,status"),
    file("ds-launch-owner", "users.csv", "email,displayName"),
    file("ds-launch-owner", "staff-roles.csv", "email,roleKey,status"),
    file("ds-launch-owner", "signed-in-route-proof.csv", "email,workspace,expectedPath,observedPath,status,checkedAt,notes"),
    file("chapter-launch-owners", "memberships.csv", "email,chapterId,roleKey,status"),
    file("sales-coaching-lead", "coach-assignments.csv", "coachEmail,chapterId,coachType,status"),
    file("campaign-launch-owner", "campaigns.csv", "chapterId,name,slug,status"),
    file("luma-ds-owner", "luma-calendars.csv", "chapterId,calendarId,calendarName,status"),
    file("launch-owner-ds", "pilot-event-proof.csv", "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes"),
  ];
}

function file(
  ownerSlug: string,
  filename: string,
  header: string,
): ProductionRolloutOwnerPacketFoundFile {
  return {
    ownerSlug,
    filename,
    content: `${header}\n`,
  };
}
