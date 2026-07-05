import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutApplyPlan,
  getProductionRolloutApplyPlan,
} from "@/services/production-rollout-apply-plan";
import type { ProductionRolloutBootstrapPacket } from "@/services/production-rollout-bootstrap";

describe("production rollout apply plan", () => {
  it("formats a review-only apply plan for a ready 30-chapter packet", () => {
    const plan = getProductionRolloutApplyPlan(createPacket(30));
    const report = formatProductionRolloutApplyPlan(plan);

    expect(plan.ready).toBe(true);
    expect(report).toContain(
      "Production apply plan: READY FOR HUMAN APPLY REVIEW",
    );
    expect(report).toContain("This is a review-only production apply plan.");
    expect(report).toContain("Supabase Auth users to invite (ready):");
    expect(report).toContain(
      "- member.001@medlifemovement.org - Launch Member 001; password: not in packet; auth id: resolve after invite",
    );
    expect(report).toContain("App profiles to upsert after Auth users exist");
    expect(report).toContain(
      "- chapter-01 -> app.chapters UUID to be created/resolved; name = Chapter 01 MEDLIFE; campus = Campus 01; region = West",
    );
    expect(report).toContain(
      "- member.001@medlifemovement.org -> chapter-01 as general_member; requires email -> profile UUID and chapter handle -> chapter UUID",
    );
    expect(report).toContain(
      "- coach@medlifemovement.org -> chapter-01 (portfolio); requires coach profile UUID, chapter UUID, and starts_at = approved apply date",
    );
    expect(report).toContain(
      "- chapter-01 -> Rush Month (rush-month-01); objective = launch Luma events, RSVP, attendance, points, and leaderboard loop unless owner changes it before apply",
    );
    expect(report).toContain(
      "- chapter-01 -> cal-chapter-01 (Chapter 01 MEDLIFE Calendar); target chapter_luma_calendars when production table exists, otherwise approved MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON registry",
    );
    expect(report).toContain(
      "routes event /app/events/evt-chapter-01, attendance /leader?view=events&event=evt-chapter-01, points /leader?view=leaderboard&chapter=chapter-01, audit /admin/audit-log, outbox /admin/integration-outbox",
    );
    expect(report).toContain(
      "- Do not send HubSpot, n8n, warehouse, Power BI, SMS, email, or AI writes during this production apply.",
    );
  });

  it("keeps blockers visible when the packet is not ready", () => {
    const plan = getProductionRolloutApplyPlan(createPacket(1));
    const report = formatProductionRolloutApplyPlan(plan);

    expect(plan.ready).toBe(false);
    expect(report).toContain("Production apply plan: NOT READY");
    expect(report).toContain(
      "blocker: Add at least 30 active chapters before production rollout. Current active chapters: 1.",
    );
    expect(report).toContain("Supabase Auth users to invite (blocked):");
  });

  it("keeps credential handling explicitly out of the apply artifact", () => {
    const report = formatProductionRolloutApplyPlan(
      getProductionRolloutApplyPlan(createPacket(30)),
    );

    expect(report).toContain(
      "Do not include passwords, API keys, bearer tokens, refresh tokens, private keys, or webhook secrets",
    );
    expect(report).not.toContain("6598");
    expect(report).not.toContain("LUMA_API_KEY");
    expect(report).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
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
  const memberUsers = Array.from(
    { length: Math.max(0, 500 - chapterCount) },
    (_value, index) => {
      const number = String(index + 1).padStart(3, "0");
      return {
        email: `member.${number}@medlifemovement.org`,
        displayName: `Launch Member ${number}`,
      };
    },
  );

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
    pilotEventProof: chapters
      .slice(0, Math.min(chapterCount, 5))
      .map((chapter, index) => ({
        chapterId: chapter.id,
        eventName: "Rush Month Kickoff",
        lumaEventId: `evt-chapter-${String(index + 1).padStart(2, "0")}`,
        rsvpCount: 12,
        attendanceCount: 10,
        pointsAwardedCount: 10,
        auditEvidence: "recorded",
        outboxStatus: "zero_sends",
        status: "ready",
        eventRoute: `/app/events/evt-chapter-${String(index + 1).padStart(2, "0")}`,
        attendanceRoute: `/leader?view=events&event=evt-chapter-${String(index + 1).padStart(2, "0")}`,
        pointsRoute: `/leader?view=leaderboard&chapter=${chapter.id}`,
        auditRoute: "/admin/audit-log",
        outboxRoute: "/admin/integration-outbox",
        checkedAt: "2026-07-05T15:00:00Z",
        reviewedByEmail: "admin@medlifemovement.org",
        notes: "RSVP, attendance, points, audit, and outbox proof verified.",
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
    signedInRouteProof: [
      {
        email: "member.001@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
      },
      {
        email: "leader.01@medlifemovement.org",
        workspace: "leader_command_center",
        expectedPath: "/leader?view=overview",
        observedPath: "/leader?view=overview",
        status: "passed",
      },
      {
        email: "coach@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
      },
      {
        email: "ds@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
      },
    ],
  };
}
