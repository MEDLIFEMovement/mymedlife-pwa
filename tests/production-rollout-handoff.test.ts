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
      "- chapter-01 -> cal-chapter-01 (Chapter 01 MEDLIFE Calendar)",
    );
    expect(report).toContain(
      "- chapter-01 -> Rush Month Kickoff (evt-chapter-01); RSVPs 12, attendance 10, points 10, audit recorded, outbox zero_sends",
    );
    expect(report).toContain(
      "- support -> admin@medlifemovement.org (Launch Admin)",
    );
    expect(report).toContain("member workspace users: 500");
    expect(report).toContain("leader workspace users: 30");
    expect(report).toContain("staff workspace users: 2");
    expect(report).toContain("admin workspace users: 1");
    expect(report).toContain(
      "- Keep HubSpot, n8n, warehouse, Power BI, SMS, email, and AI writes disabled during this apply.",
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
  const leaderUsers = chapters.map((chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      email: `leader.${number}@medlifemovement.org`,
      displayName: `${chapter.name} Leader`,
    };
  });
  const memberUsers = Array.from({ length: Math.max(0, 500 - chapterCount) }, (_value, index) => {
    const number = String(index + 1).padStart(3, "0");
    return {
      email: `member.${number}@medlifemovement.org`,
      displayName: `Launch Member ${number}`,
    };
  });

  return {
    chapters,
    users: [
      { email: "coach@medlifemovement.org", displayName: "Launch Coach" },
      { email: "admin@medlifemovement.org", displayName: "Launch Admin" },
      { email: "ds@medlifemovement.org", displayName: "DS Admin" },
      ...leaderUsers,
      ...memberUsers,
    ],
    memberships: [
      ...chapters.map((chapter, index) => {
        const number = String(index + 1).padStart(2, "0");
        return {
          email: `leader.${number}@medlifemovement.org`,
          chapterId: chapter.id,
          roleKey: "president_vp" as const,
        };
      }),
      ...memberUsers.map((user, index) => ({
        email: user.email,
        chapterId: chapters[index % chapters.length]?.id ?? "chapter-01",
        roleKey: "general_member" as const,
      })),
    ],
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
    lumaCalendars: chapters.map((chapter, index) => ({
      chapterId: chapter.id,
      calendarId: `cal-chapter-${String(index + 1).padStart(2, "0")}`,
      calendarName: `${chapter.name} Calendar`,
      status: "linked",
    })),
    pilotEventProof: chapters.slice(0, Math.min(chapterCount, 5)).map((chapter, index) => ({
      chapterId: chapter.id,
      eventName: "Rush Month Kickoff",
      lumaEventId: `evt-chapter-${String(index + 1).padStart(2, "0")}`,
      rsvpCount: 12,
      attendanceCount: 10,
      pointsAwardedCount: 10,
      auditEvidence: "recorded",
      outboxStatus: "zero_sends",
      status: "ready",
    })),
    launchOwners: [
      {
        email: "admin@medlifemovement.org",
        ownerType: "support",
        displayName: "Launch Admin",
      },
      {
        email: "ds@medlifemovement.org",
        ownerType: "rollback",
        displayName: "DS Admin",
      },
      {
        email: "ds@medlifemovement.org",
        ownerType: "production_apply",
        displayName: "DS Admin",
      },
      {
        email: "admin@medlifemovement.org",
        ownerType: "launch_decision",
        displayName: "Launch Admin",
      },
    ],
  };
}
