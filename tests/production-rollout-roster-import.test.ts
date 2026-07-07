import { describe, expect, it } from "vitest";
import { buildProductionRolloutPacketFromCsvTables } from "@/services/production-rollout-packet-builder";
import { buildProductionRolloutRosterImport } from "@/services/production-rollout-roster-import";

describe("production rollout roster import", () => {
  it("turns one plain roster sheet into users and memberships CSVs", () => {
    const result = buildProductionRolloutRosterImport(
      [
        "email,displayName,chapterId,roleKey,status,chapterName",
        "Sofia.Student@medlifemovement.org,Sofia Torres,chapter-ucla,general_member,approved,UCLA MEDLIFE",
        "leader@medlifemovement.org,Chapter Leader,chapter-ucla,president_vp,approved,UCLA MEDLIFE",
        "sofia.student@medlifemovement.org,Sofia Torres,chapter-ucla,general_member,approved,UCLA MEDLIFE",
      ].join("\n"),
    );

    expect(result.counts).toEqual({
      users: 2,
      memberships: 2,
      chapters: 1,
    });
    expect(result.usersCsv).toBe(
      [
        "email,displayName",
        "sofia.student@medlifemovement.org,Sofia Torres",
        "leader@medlifemovement.org,Chapter Leader",
        "",
      ].join("\n"),
    );
    expect(result.membershipsCsv).toBe(
      [
        "email,chapterId,roleKey,status",
        "sofia.student@medlifemovement.org,chapter-ucla,general_member,approved",
        "leader@medlifemovement.org,chapter-ucla,president_vp,approved",
        "",
      ].join("\n"),
    );

    expect(() =>
      buildProductionRolloutPacketFromCsvTables({
        chapters: "id,name,campus,region,status\nchapter-ucla,UCLA MEDLIFE,UCLA,West,active\n",
        users: result.usersCsv,
        memberships: result.membershipsCsv,
        staffRoles: "email,roleKey,status\ncoach@medlifemovement.org,coach,active\n",
        coachAssignments:
          "coachEmail,chapterId,coachType,status\ncoach@medlifemovement.org,chapter-ucla,portfolio,active\n",
        campaigns: "chapterId,name,slug,status\nchapter-ucla,Rush Month,rush-month-ucla,active\n",
        lumaCalendars:
          "chapterId,calendarId,calendarName,status\nchapter-ucla,cal-ucla,UCLA Calendar,linked\n",
        pilotEventProof:
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes\n",
        launchOwners: "email,ownerType,displayName,status\ncoach@medlifemovement.org,support,Coach,active\n",
        signedInRouteProof:
          "email,workspace,expectedPath,observedPath,status,checkedAt,notes\n",
      }),
    ).not.toThrow();
  });

  it("rejects fake or placeholder roster emails", () => {
    expect(() =>
      buildProductionRolloutRosterImport(
        [
          "email,displayName,chapterId,roleKey,status",
          "fake@example.com,Fake User,chapter-ucla,general_member,approved",
        ].join("\n"),
      ),
    ).toThrow(/test or placeholder email data/);
  });

  it("rejects Test and Figma sandbox roster values before generating rollout CSVs", () => {
    expect(() =>
      buildProductionRolloutRosterImport(
        [
          "email,displayName,chapterId,roleKey,status",
          "sofia@medlifemovement.org,Test Sofia Alvarez,chapter-ucla,general_member,approved",
        ].join("\n"),
      ),
    ).toThrow(
      "roster CSV row 2 column displayName contains Test/Figma sandbox data (packet starts with Test); replace it with approved production rollout data.",
    );

    expect(() =>
      buildProductionRolloutRosterImport(
        [
          "email,displayName,chapterId,roleKey,status,chapterName",
          "sofia@medlifemovement.org,Sofia Torres,chapter-ucla,general_member,approved,source=figma_seed",
        ].join("\n"),
      ),
    ).toThrow(
      "roster CSV row 2 column chapterName contains Test/Figma sandbox data (packet contains figma_seed); replace it with approved production rollout data.",
    );
  });

  it("rejects conflicting duplicate rows instead of silently choosing a role", () => {
    expect(() =>
      buildProductionRolloutRosterImport(
        [
          "email,displayName,chapterId,roleKey,status",
          "sofia@medlifemovement.org,Sofia Torres,chapter-ucla,general_member,approved",
          "sofia@medlifemovement.org,Sofia Torres,chapter-ucla,president_vp,approved",
        ].join("\n"),
      ),
    ).toThrow(/conflicts with another row/);
  });
});
