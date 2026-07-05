import { describe, expect, it } from "vitest";
import { buildProductionRolloutPacketFromCsvTables } from "@/services/production-rollout-packet-builder";

describe("production rollout packet builder", () => {
  it("builds a rollout packet from the launch CSV tables", () => {
    const packet = buildProductionRolloutPacketFromCsvTables({
      chapters: [
        "id,name,campus,region,status",
        "chapter-ucla,UCLA MEDLIFE,UCLA,West,active",
      ].join("\n"),
      users: [
        "email,displayName",
        "leader@medlifemovement.org,Chapter Leader",
        "coach@medlifemovement.org,Launch Coach",
        "admin@medlifemovement.org,Launch Admin",
      ].join("\n"),
      memberships: [
        "email,chapterId,roleKey,status",
        "leader@medlifemovement.org,chapter-ucla,president_vp,approved",
      ].join("\n"),
      staffRoles: [
        "email,roleKey,status",
        "coach@medlifemovement.org,coach,active",
        "admin@medlifemovement.org,admin,active",
      ].join("\n"),
      coachAssignments: [
        "coachEmail,chapterId,coachType,status",
        "coach@medlifemovement.org,chapter-ucla,portfolio,active",
      ].join("\n"),
      campaigns: [
        "chapterId,name,slug,status",
        "chapter-ucla,Rush Month,rush-month-ucla,active",
      ].join("\n"),
      lumaCalendars: [
        "chapterId,calendarId,calendarName,status",
        "chapter-ucla,cal-ucla,UCLA MEDLIFE,linked",
      ].join("\n"),
      pilotEventProof: [
        "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status",
        "chapter-ucla,Rush Month Kickoff,evt-ucla,12,10,10,recorded,zero_sends,ready",
      ].join("\n"),
      launchOwners: [
        "email,ownerType,displayName,status",
        "admin@medlifemovement.org,support,Launch Admin,active",
      ].join("\n"),
    });

    expect(packet.chapters).toEqual([
      {
        id: "chapter-ucla",
        name: "UCLA MEDLIFE",
        campus: "UCLA",
        region: "West",
        status: "active",
      },
    ]);
    expect(packet.memberships[0]?.roleKey).toBe("president_vp");
    expect(packet.coachAssignments[0]?.coachType).toBe("portfolio");
    expect(packet.campaigns[0]?.slug).toBe("rush-month-ucla");
    expect(packet.lumaCalendars?.[0]?.calendarId).toBe("cal-ucla");
    expect(packet.pilotEventProof?.[0]?.rsvpCount).toBe(12);
    expect(packet.launchOwners?.[0]?.ownerType).toBe("support");
  });

  it("supports quoted commas from spreadsheet exports", () => {
    const packet = buildProductionRolloutPacketFromCsvTables({
      chapters: [
        "id,name,campus",
        'chapter-bc,"Boston College, MEDLIFE",Boston College',
      ].join("\n"),
      users: "email,displayName\nleader@medlifemovement.org,Leader",
      memberships:
        "email,chapterId,roleKey\nleader@medlifemovement.org,chapter-bc,president_vp",
      staffRoles: "email,roleKey\nadmin@medlifemovement.org,admin",
      coachAssignments:
        "coachEmail,chapterId,coachType\ncoach@medlifemovement.org,chapter-bc,portfolio",
      campaigns: "chapterId,name,slug\nchapter-bc,Rush Month,rush-month-bc",
      lumaCalendars: "chapterId,calendarId\nchapter-bc,cal-bc",
      pilotEventProof:
        "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus\nchapter-bc,Rush Month Kickoff,evt-bc,5,4,4,recorded,zero_sends",
      launchOwners: "email,ownerType\nadmin@medlifemovement.org,support",
    });

    expect(packet.chapters[0]?.name).toBe("Boston College, MEDLIFE");
    expect(packet.chapters[0]).toEqual({
      id: "chapter-bc",
      name: "Boston College, MEDLIFE",
      campus: "Boston College",
    });
  });

  it("rejects unsupported columns so secrets do not sneak into packets", () => {
    expect(() =>
      buildProductionRolloutPacketFromCsvTables({
        chapters: "id,name,campus,password\nchapter-ucla,UCLA MEDLIFE,UCLA,nope",
        users: "email,displayName\nleader@medlifemovement.org,Leader",
        memberships:
          "email,chapterId,roleKey\nleader@medlifemovement.org,chapter-ucla,president_vp",
        staffRoles: "email,roleKey\nadmin@medlifemovement.org,admin",
        coachAssignments:
          "coachEmail,chapterId,coachType\ncoach@medlifemovement.org,chapter-ucla,portfolio",
        campaigns: "chapterId,name,slug\nchapter-ucla,Rush Month,rush-month-ucla",
        lumaCalendars: "chapterId,calendarId\nchapter-ucla,cal-ucla",
        pilotEventProof:
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus\nchapter-ucla,Rush Month Kickoff,evt-ucla,5,4,4,recorded,zero_sends",
        launchOwners: "email,ownerType\nadmin@medlifemovement.org,support",
      }),
    ).toThrow("chapters CSV has unsupported column password.");
  });

  it("rejects invalid role and status values before a packet is written", () => {
    expect(() =>
      buildProductionRolloutPacketFromCsvTables({
        chapters: "id,name,campus\nchapter-ucla,UCLA MEDLIFE,UCLA",
        users: "email,displayName\nleader@medlifemovement.org,Leader",
        memberships:
          "email,chapterId,roleKey\nleader@medlifemovement.org,chapter-ucla,owner",
        staffRoles: "email,roleKey\nadmin@medlifemovement.org,admin",
        coachAssignments:
          "coachEmail,chapterId,coachType\ncoach@medlifemovement.org,chapter-ucla,portfolio",
        campaigns: "chapterId,name,slug\nchapter-ucla,Rush Month,rush-month-ucla",
        lumaCalendars: "chapterId,calendarId\nchapter-ucla,cal-ucla",
        pilotEventProof:
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus\nchapter-ucla,Rush Month Kickoff,evt-ucla,5,4,4,recorded,zero_sends",
        launchOwners: "email,ownerType\nadmin@medlifemovement.org,support",
      }),
    ).toThrow(
      'Invalid membership roleKey "owner". Expected one of: general_member, action_committee_member, action_committee_chair, e_board_member, president_vp.',
    );
  });

  it("rejects blank required values even when the column exists", () => {
    expect(() =>
      buildProductionRolloutPacketFromCsvTables({
        chapters: "id,name,campus\n,UCLA MEDLIFE,UCLA",
        users: "email,displayName\nleader@medlifemovement.org,Leader",
        memberships:
          "email,chapterId,roleKey\nleader@medlifemovement.org,chapter-ucla,president_vp",
        staffRoles: "email,roleKey\nadmin@medlifemovement.org,admin",
        coachAssignments:
          "coachEmail,chapterId,coachType\ncoach@medlifemovement.org,chapter-ucla,portfolio",
        campaigns: "chapterId,name,slug\nchapter-ucla,Rush Month,rush-month-ucla",
        lumaCalendars: "chapterId,calendarId\nchapter-ucla,cal-ucla",
        pilotEventProof:
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus\nchapter-ucla,Rush Month Kickoff,evt-ucla,5,4,4,recorded,zero_sends",
        launchOwners: "email,ownerType\nadmin@medlifemovement.org,support",
      }),
    ).toThrow("chapters CSV row 2 is missing required value id.");
  });

  it("rejects invalid pilot event counts before a packet is written", () => {
    expect(() =>
      buildProductionRolloutPacketFromCsvTables({
        chapters: "id,name,campus\nchapter-ucla,UCLA MEDLIFE,UCLA",
        users: "email,displayName\nadmin@medlifemovement.org,Launch Admin",
        memberships:
          "email,chapterId,roleKey\nadmin@medlifemovement.org,chapter-ucla,president_vp",
        staffRoles: "email,roleKey\nadmin@medlifemovement.org,admin",
        coachAssignments:
          "coachEmail,chapterId,coachType\ncoach@medlifemovement.org,chapter-ucla,portfolio",
        campaigns: "chapterId,name,slug\nchapter-ucla,Rush Month,rush-month-ucla",
        lumaCalendars: "chapterId,calendarId\nchapter-ucla,cal-ucla",
        pilotEventProof:
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus\nchapter-ucla,Rush Month Kickoff,evt-ucla,twelve,4,4,recorded,zero_sends",
        launchOwners: "email,ownerType\nadmin@medlifemovement.org,support",
      }),
    ).toThrow("pilot event rsvpCount must be a zero-or-greater whole number.");
  });
});
