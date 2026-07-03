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
      users: 63,
      approvedMemberships: 60,
      activeStaffRoles: 3,
      activeCoachAssignments: 30,
      activeCampaigns: 30,
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
  const chapterUsers = chapters.flatMap((_chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return [
      `leader.${number}@medlifemovement.org,Chapter ${number} Leader`,
      `member.${number}@medlifemovement.org,Chapter ${number} Member`,
    ];
  });
  const memberships = chapters.flatMap((_chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return [
      `leader.${number}@medlifemovement.org,chapter-${number},president_vp,approved`,
      `member.${number}@medlifemovement.org,chapter-${number},general_member,approved`,
    ];
  });
  const coachAssignments = chapters.map((_chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `coach@medlifemovement.org,chapter-${number},portfolio,active`;
  });
  const campaigns = chapters.map((_chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `chapter-${number},Rush Month,rush-month-${number},active`;
  });

  return {
    chapters: withHeader("id,name,campus,region,status", chapters),
    users: withHeader("email,displayName", [
      "coach@medlifemovement.org,Launch Coach",
      "admin@medlifemovement.org,Launch Admin",
      "ds@medlifemovement.org,DS Admin",
      ...chapterUsers,
    ]),
    memberships: withHeader("email,chapterId,roleKey,status", memberships),
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
