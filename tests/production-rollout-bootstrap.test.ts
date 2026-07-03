import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutBootstrapReadiness,
  getProductionRolloutBootstrapReadiness,
  type ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

describe("production rollout bootstrap readiness", () => {
  it("approves a complete 30-chapter rollout packet", () => {
    const readiness = getProductionRolloutBootstrapReadiness(
      createCompletePacket(30),
    );

    expect(readiness.ready).toBe(true);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.counts.activeChapters).toBe(30);
    expect(readiness.counts.activeCoachAssignments).toBe(30);
    expect(readiness.counts.activeCampaigns).toBe(30);
    expect(readiness.nextSteps.join(" ")).toContain("Create Supabase Auth users");
  });

  it("blocks packets that are too small for the first 30-chapter rollout", () => {
    const readiness = getProductionRolloutBootstrapReadiness(
      createCompletePacket(2),
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "Add at least 30 active chapters before production rollout. Current active chapters: 2.",
    );
  });

  it("blocks fake local seed data and credential fields", () => {
    const packet = createCompletePacket(30) as ProductionRolloutBootstrapPacket & {
      password?: string;
    };
    packet.password = "never-put-passwords-here";
    packet.users[0] = {
      email: "member.a@mymedlife.test",
      displayName: "Sofia Alvarez",
    };

    const readiness = getProductionRolloutBootstrapReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "User member.a@mymedlife.test looks like fake or test data.",
    );
    expect(readiness.blockers).toContain(
      "Remove password, token, API key, and secret fields. Production packets must not carry credentials.",
    );
  });

  it("blocks chapter packets without leaders, coaches, campaigns, and admins", () => {
    const packet = createCompletePacket(30);
    packet.memberships = packet.memberships.filter(
      (membership) => membership.roleKey === "general_member",
    );
    packet.coachAssignments = [];
    packet.campaigns = [];
    packet.staffRoles = [];

    const readiness = getProductionRolloutBootstrapReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain("Chapter 01 MEDLIFE needs at least one approved chapter leader.");
    expect(readiness.blockers).toContain("Chapter 01 MEDLIFE needs one active coach assignment.");
    expect(readiness.blockers).toContain("Chapter 01 MEDLIFE needs one active launch campaign.");
    expect(readiness.blockers).toContain("Add at least one active admin staff role for day-one support.");
    expect(readiness.blockers).toContain("Add at least one DS Admin or Super Admin for launch controls.");
  });

  it("formats a human-readable readiness report for launch reviewers", () => {
    const readiness = getProductionRolloutBootstrapReadiness(
      createCompletePacket(1),
    );

    expect(formatProductionRolloutBootstrapReadiness(readiness)).toContain(
      "Production rollout packet: NOT READY",
    );
    expect(formatProductionRolloutBootstrapReadiness(readiness)).toContain(
      "- active chapters: 1",
    );
    expect(formatProductionRolloutBootstrapReadiness(readiness)).toContain(
      "Add at least 30 active chapters before production rollout.",
    );
  });
});

function createCompletePacket(chapterCount: number): ProductionRolloutBootstrapPacket {
  const chapters = Array.from({ length: chapterCount }, (_, index) => {
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
