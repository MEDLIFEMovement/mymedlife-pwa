import { describe, expect, it } from "vitest";
import { buildProductionRolloutChapterImport } from "@/services/production-rollout-chapter-import";
import { buildProductionRolloutPacketFromCsvTables } from "@/services/production-rollout-packet-builder";

describe("production rollout chapter import", () => {
  it("turns one launch chapter setup sheet into aligned chapter, coach, campaign, and Luma CSVs", () => {
    const result = buildProductionRolloutChapterImport(
      [
        "chapterId,chapterName,campus,region,coachEmail,coachType,calendarId,calendarName,campaignName,campaignSlug",
        "chapter-ucla,UCLA MEDLIFE,UCLA,West,Coach@medlifemovement.org,portfolio,cal-ucla,UCLA MEDLIFE Calendar,Rush Month,rush-month-ucla",
      ].join("\n"),
    );

    expect(result.counts).toEqual({
      chapters: 1,
      coachAssignments: 1,
      campaigns: 1,
      lumaCalendars: 1,
      uniqueCoaches: 1,
    });
    expect(result.chaptersCsv).toBe(
      [
        "id,name,campus,region,status",
        "chapter-ucla,UCLA MEDLIFE,UCLA,West,active",
        "",
      ].join("\n"),
    );
    expect(result.coachAssignmentsCsv).toBe(
      [
        "coachEmail,chapterId,coachType,status",
        "coach@medlifemovement.org,chapter-ucla,portfolio,active",
        "",
      ].join("\n"),
    );
    expect(result.campaignsCsv).toBe(
      [
        "chapterId,name,slug,status",
        "chapter-ucla,Rush Month,rush-month-ucla,active",
        "",
      ].join("\n"),
    );
    expect(result.lumaCalendarsCsv).toBe(
      [
        "chapterId,calendarId,calendarName,status",
        "chapter-ucla,cal-ucla,UCLA MEDLIFE Calendar,linked",
        "",
      ].join("\n"),
    );

    expect(() =>
      buildProductionRolloutPacketFromCsvTables({
        chapters: result.chaptersCsv,
        users: [
          "email,displayName",
          "coach@medlifemovement.org,Launch Coach",
          "member@medlifemovement.org,Launch Member",
          "leader@medlifemovement.org,Launch Leader",
          "",
        ].join("\n"),
        memberships: [
          "email,chapterId,roleKey,status",
          "member@medlifemovement.org,chapter-ucla,general_member,approved",
          "leader@medlifemovement.org,chapter-ucla,president_vp,approved",
          "",
        ].join("\n"),
        staffRoles:
          "email,roleKey,status\ncoach@medlifemovement.org,coach,active\n",
        coachAssignments: result.coachAssignmentsCsv,
        campaigns: result.campaignsCsv,
        lumaCalendars: result.lumaCalendarsCsv,
        pilotEventProof:
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes\n",
        launchOwners:
          "email,ownerType,displayName,status\ncoach@medlifemovement.org,support,Launch Coach,active\n",
        signedInRouteProof:
          "email,workspace,expectedPath,observedPath,status,checkedAt,notes\n",
      }),
    ).not.toThrow();
  });

  it("defaults campaign and calendar names from the chapter setup row", () => {
    const result = buildProductionRolloutChapterImport(
      [
        "chapterId,chapterName,campus,coachEmail,calendarId",
        "chapter-bc,Boston College MEDLIFE,Boston College,coach@medlifemovement.org,cal-bc",
      ].join("\n"),
    );

    expect(result.campaignsCsv).toContain(
      "chapter-bc,Rush Month,rush-month-chapter-bc,active",
    );
    expect(result.lumaCalendarsCsv).toContain(
      "chapter-bc,cal-bc,Boston College MEDLIFE Calendar,linked",
    );
  });

  it("rejects duplicate chapter ids", () => {
    expect(() =>
      buildProductionRolloutChapterImport(
        [
          "chapterId,chapterName,campus,coachEmail,calendarId",
          "chapter-ucla,UCLA MEDLIFE,UCLA,coach@medlifemovement.org,cal-ucla",
          "chapter-ucla,UCLA MEDLIFE,UCLA,coach@medlifemovement.org,cal-ucla-2",
        ].join("\n"),
      ),
    ).toThrow(/repeats chapterId/);
  });

  it("rejects fake coach emails and calendar ids that look like keys", () => {
    expect(() =>
      buildProductionRolloutChapterImport(
        [
          "chapterId,chapterName,campus,coachEmail,calendarId",
          "chapter-ucla,UCLA MEDLIFE,UCLA,fake@example.com,cal-ucla",
        ].join("\n"),
      ),
    ).toThrow(/test or placeholder email data/);

    expect(() =>
      buildProductionRolloutChapterImport(
        [
          "chapterId,chapterName,campus,coachEmail,calendarId",
          "chapter-ucla,UCLA MEDLIFE,UCLA,coach@medlifemovement.org,sk_live_secret",
        ].join("\n"),
      ),
    ).toThrow(/looks like a key or token/);
  });
});
