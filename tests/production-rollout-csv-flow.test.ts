import { describe, expect, it } from "vitest";
import { getProductionRolloutBootstrapReadiness } from "@/services/production-rollout-bootstrap";
import { getProductionRolloutCsvTemplateContent } from "@/services/production-rollout-csv-templates";
import { buildProductionRolloutPacketFromCsvTables } from "@/services/production-rollout-packet-builder";

describe("production rollout CSV flow", () => {
  it("builds a validator-ready 30-chapter packet from generated CSV headers", () => {
    const packet = buildProductionRolloutPacketFromCsvTables(
      createThirtyChapterCsvTables(),
    );
    const readiness = getProductionRolloutBootstrapReadiness(packet);

    expect(readiness.ready).toBe(true);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.counts).toEqual({
      activeChapters: 30,
      users: 503,
      approvedMemberships: 500,
      activeStaffRoles: 3,
      activeCoachAssignments: 30,
      activeCampaigns: 30,
      approvedStudentMemberships: 500,
      linkedLumaCalendars: 30,
      readyPilotEventProofChapters: 5,
      activeLaunchOwners: 4,
      memberWorkspaceUsers: 500,
      leaderWorkspaceUsers: 30,
      staffWorkspaceUsers: 2,
      adminWorkspaceUsers: 1,
      chaptersWithMemberWorkspaceAccess: 30,
      chaptersWithLeaderWorkspaceAccess: 30,
    });
  });
});

function createThirtyChapterCsvTables() {
  const chapters = Array.from({ length: 30 }, (_value, index) => {
    const number = String(index + 1).padStart(2, "0");
    return [
      `chapter-${number}`,
      `Chapter ${number} MEDLIFE`,
      `Campus ${number}`,
      index % 2 === 0 ? "West" : "East",
      "active",
    ].join(",");
  });
  const leaderUsers = chapters.map((_chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `leader.${number}@medlifemovement.org,Chapter ${number} Leader`;
  });
  const memberUsers = Array.from({ length: 470 }, (_value, index) => {
    const number = String(index + 1).padStart(3, "0");
    return `member.${number}@medlifemovement.org,Launch Member ${number}`;
  });
  const leaderMemberships = chapters.map((_chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `leader.${number}@medlifemovement.org,chapter-${number},president_vp,approved`;
  });
  const memberMemberships = memberUsers.map((_user, index) => {
    const memberNumber = String(index + 1).padStart(3, "0");
    const chapterNumber = String((index % 30) + 1).padStart(2, "0");
    return `member.${memberNumber}@medlifemovement.org,chapter-${chapterNumber},general_member,approved`;
  });
  const coachAssignments = chapters.map((_chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `coach@medlifemovement.org,chapter-${number},portfolio,active`;
  });
  const campaigns = chapters.map((_chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `chapter-${number},Rush Month,rush-month-${number},active`;
  });
  const lumaCalendars = chapters.map((_chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `chapter-${number},cal-chapter-${number},Chapter ${number} Calendar,linked`;
  });
  const pilotEventProof = chapters.slice(0, 5).map((_chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `chapter-${number},Rush Month Kickoff,evt-chapter-${number},12,10,10,recorded,zero_sends,ready`;
  });

  return {
    chapters: withHeader("id,name,campus,region,status", chapters),
    users: withHeader("email,displayName", [
      "coach@medlifemovement.org,Launch Coach",
      "admin@medlifemovement.org,Launch Admin",
      "ds@medlifemovement.org,DS Admin",
      ...leaderUsers,
      ...memberUsers,
    ]),
    memberships: withHeader("email,chapterId,roleKey,status", [
      ...leaderMemberships,
      ...memberMemberships,
    ]),
    staffRoles: withHeader("email,roleKey,status", [
      "coach@medlifemovement.org,coach,active",
      "admin@medlifemovement.org,admin,active",
      "ds@medlifemovement.org,ds_admin,active",
    ]),
    coachAssignments: withHeader(
      "coachEmail,chapterId,coachType,status",
      coachAssignments,
    ),
    campaigns: withHeader("chapterId,name,slug,status", campaigns),
    lumaCalendars: withHeader(
      "chapterId,calendarId,calendarName,status",
      lumaCalendars,
    ),
    pilotEventProof: withHeader(
      "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status",
      pilotEventProof,
    ),
    launchOwners: withHeader("email,ownerType,displayName,status", [
      "admin@medlifemovement.org,support,Launch Admin,active",
      "ds@medlifemovement.org,rollback,DS Admin,active",
      "ds@medlifemovement.org,production_apply,DS Admin,active",
      "admin@medlifemovement.org,launch_decision,Launch Admin,active",
    ]),
  };
}

function withHeader(header: string, rows: string[]) {
  const generatedHeader = getProductionRolloutCsvTemplateContent({
    filename: "test.csv",
    description: "Test template.",
    headers: header.split(","),
  }).trim();

  expect(generatedHeader).toBe(header);

  return [generatedHeader, ...rows].join("\n");
}
