import { describe, expect, it } from "vitest";
import { buildProductionRolloutLaunchOwnerImport } from "@/services/production-rollout-launch-owner-import";
import { buildProductionRolloutPacketFromCsvTables } from "@/services/production-rollout-packet-builder";

describe("production rollout launch owner import", () => {
  it("turns one launch owner approval sheet into packet-ready launch owners", () => {
    const result = buildProductionRolloutLaunchOwnerImport(
      [
        "email,ownerType,displayName,status",
        "Admin@medlifemovement.org,support,Launch Admin,active",
        "DS@medlifemovement.org,rollback,DS Owner,active",
        "ds@medlifemovement.org,production_apply,DS Owner,active",
        "nick@medlifemovement.org,launch_decision,Nick,backup",
      ].join("\n"),
    );

    expect(result.counts).toEqual({
      owners: 4,
      activeOwners: 3,
      ownerTypes: 4,
    });
    expect(result.launchOwnersCsv).toBe(
      [
        "email,ownerType,displayName,status",
        "admin@medlifemovement.org,support,Launch Admin,active",
        "ds@medlifemovement.org,rollback,DS Owner,active",
        "ds@medlifemovement.org,production_apply,DS Owner,active",
        "nick@medlifemovement.org,launch_decision,Nick,backup",
        "",
      ].join("\n"),
    );

    expect(() =>
      buildProductionRolloutPacketFromCsvTables({
        chapters:
          "id,name,campus,region,status\nchapter-ucla,UCLA MEDLIFE,UCLA,West,active\n",
        users: [
          "email,displayName",
          "admin@medlifemovement.org,Launch Admin",
          "ds@medlifemovement.org,DS Owner",
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
        staffRoles: [
          "email,roleKey,status",
          "admin@medlifemovement.org,admin,active",
          "ds@medlifemovement.org,ds_admin,active",
          "",
        ].join("\n"),
        coachAssignments:
          "coachEmail,chapterId,coachType,status\nadmin@medlifemovement.org,chapter-ucla,portfolio,active\n",
        campaigns:
          "chapterId,name,slug,status\nchapter-ucla,Rush Month,rush-month-ucla,active\n",
        lumaCalendars:
          "chapterId,calendarId,calendarName,status\nchapter-ucla,cal-ucla,UCLA Calendar,linked\n",
        pilotEventProof:
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes\n",
        launchOwners: result.launchOwnersCsv,
        signedInRouteProof:
          "email,workspace,expectedPath,observedPath,status,checkedAt,notes\n",
      }),
    ).not.toThrow();
  });

  it("defaults launch owner status to active", () => {
    const result = buildProductionRolloutLaunchOwnerImport(
      [
        "email,ownerType,displayName",
        "support@medlifemovement.org,support,Support Owner",
        "rollback@medlifemovement.org,rollback,Rollback Owner",
        "apply@medlifemovement.org,production_apply,Apply Owner",
      ].join("\n"),
    );

    expect(result.launchOwnersCsv).toContain(
      "support@medlifemovement.org,support,Support Owner,active",
    );
  });

  it("rejects missing active required owner types", () => {
    expect(() =>
      buildProductionRolloutLaunchOwnerImport(
        [
          "email,ownerType,displayName,status",
          "support@medlifemovement.org,support,Support Owner,active",
          "rollback@medlifemovement.org,rollback,Rollback Owner,active",
        ].join("\n"),
      ),
    ).toThrow(/missing active required ownerType\(s\): production_apply/);
  });

  it("rejects fake emails, unsupported owner types, and secret-like values", () => {
    expect(() =>
      buildProductionRolloutLaunchOwnerImport(
        [
          "email,ownerType,displayName,status",
          "fake@example.com,support,Support Owner,active",
          "rollback@medlifemovement.org,rollback,Rollback Owner,active",
          "apply@medlifemovement.org,production_apply,Apply Owner,active",
        ].join("\n"),
      ),
    ).toThrow(/test or placeholder email data/);

    expect(() =>
      buildProductionRolloutLaunchOwnerImport(
        [
          "email,ownerType,displayName,status",
          "support@medlifemovement.org,not_real,Support Owner,active",
          "rollback@medlifemovement.org,rollback,Rollback Owner,active",
          "apply@medlifemovement.org,production_apply,Apply Owner,active",
        ].join("\n"),
      ),
    ).toThrow(/unsupported ownerType/);

    expect(() =>
      buildProductionRolloutLaunchOwnerImport(
        [
          "email,ownerType,displayName,status",
          "support@medlifemovement.org,support,sk_live_secret,active",
          "rollback@medlifemovement.org,rollback,Rollback Owner,active",
          "apply@medlifemovement.org,production_apply,Apply Owner,active",
        ].join("\n"),
      ),
    ).toThrow(/looks like a key or token/);
  });
});
