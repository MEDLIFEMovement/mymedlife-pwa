import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutHandoff,
  getProductionRolloutHandoff,
} from "@/services/production-rollout-handoff";
import type { ProductionRolloutBootstrapPacket } from "@/services/production-rollout-bootstrap";

describe("production rollout handoff", () => {
  it("formats a review-only apply handoff for a ready 30-chapter packet", () => {
    const handoff = getProductionRolloutHandoff(createPacket(30));
    const report = formatProductionRolloutHandoff(handoff);

    expect(handoff.ready).toBe(true);
    expect(report).toContain("Production rollout handoff: READY FOR HUMAN APPLY");
    expect(report).toContain("Supabase Auth users to create:");
    expect(report).toContain("- leader.01@medlifemovement.org - Chapter 01 MEDLIFE Leader");
    expect(report).toContain("- chapter-01 - Chapter 01 MEDLIFE (Campus 01, West)");
    expect(report).toContain(
      "- leader.01@medlifemovement.org -> chapter-01 as president_vp",
    );
    expect(report).toContain(
      "- coach@medlifemovement.org -> chapter-01 (portfolio)",
    );
    expect(report).toContain("- chapter-01 -> Rush Month (rush-month-01)");
    expect(report).toContain(
      "- Keep HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes disabled during this apply.",
    );
  });

  it("keeps blocker details visible for an incomplete packet", () => {
    const handoff = getProductionRolloutHandoff(createPacket(1));
    const report = formatProductionRolloutHandoff(handoff);

    expect(handoff.ready).toBe(false);
    expect(report).toContain("Production rollout handoff: NOT READY");
    expect(report).toContain(
      "blocker: Add at least 30 active chapters before production rollout. Current active chapters: 1.",
    );
    expect(report).toContain("next step: Fix the blockers in the rollout packet.");
  });
});

function createPacket(chapterCount: number): ProductionRolloutBootstrapPacket {
  const chapters = Array.from({ length: chapterCount }, (_value, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      id: `chapter-${number}`,
      name: `Chapter ${number} MEDLIFE`,
      campus: `Campus ${number}`,
      region: index % 2 === 0 ? "West" : "East",
    };
  });
  const chapterUsers = chapters.flatMap((chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return [
      {
        email: `leader.${number}@medlifemovement.org`,
        displayName: `${chapter.name} Leader`,
      },
      {
        email: `member.${number}@medlifemovement.org`,
        displayName: `${chapter.name} Member`,
      },
    ];
  });

  return {
    chapters,
    users: [
      { email: "coach@medlifemovement.org", displayName: "Launch Coach" },
      { email: "admin@medlifemovement.org", displayName: "Launch Admin" },
      { email: "ds@medlifemovement.org", displayName: "DS Admin" },
      ...chapterUsers,
    ],
    memberships: chapters.flatMap((chapter, index) => {
      const number = String(index + 1).padStart(2, "0");
      return [
        {
          email: `leader.${number}@medlifemovement.org`,
          chapterId: chapter.id,
          roleKey: "president_vp" as const,
        },
        {
          email: `member.${number}@medlifemovement.org`,
          chapterId: chapter.id,
          roleKey: "general_member" as const,
        },
      ];
    }),
    staffRoles: [
      { email: "coach@medlifemovement.org", roleKey: "coach" },
      { email: "admin@medlifemovement.org", roleKey: "admin" },
      { email: "ds@medlifemovement.org", roleKey: "ds_admin" },
    ],
    coachAssignments: chapters.map((chapter) => ({
      coachEmail: "coach@medlifemovement.org",
      chapterId: chapter.id,
      coachType: "portfolio",
    })),
    campaigns: chapters.map((chapter, index) => ({
      chapterId: chapter.id,
      name: "Rush Month",
      slug: `rush-month-${String(index + 1).padStart(2, "0")}`,
    })),
  };
}
