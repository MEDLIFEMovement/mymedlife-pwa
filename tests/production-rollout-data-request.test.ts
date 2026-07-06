import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutDataRequest,
  getProductionRolloutDataRequest,
} from "@/services/production-rollout-data-request";
import type {
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

describe("production rollout data request", () => {
  it("turns an empty rollout packet into owner-by-owner data asks", () => {
    const request = getProductionRolloutDataRequest(createEmptyPacket());
    const report = formatProductionRolloutDataRequest(request);

    expect(request.ready).toBe(false);
    expect(request.sections.map((section) => section.owner)).toEqual([
      "Nick / HQ launch owner",
      "DS / launch owner",
      "Chapter launch owners",
      "Sales / coaching lead",
      "Campaign / launch owner",
      "Luma / DS owner",
      "Launch owner / DS",
    ]);
    expect(report).toContain("myMEDLIFE 30-chapter data request: NOT READY");
    expect(report).toContain("Add 30 more active launch chapter row(s).");
    expect(report).toContain("Add every launch user to users.csv.");
    expect(report).toContain("Add 500 more approved student/leader user(s).");
    expect(report).toContain("Add 30 linked Luma calendar mapping row(s).");
    expect(report).toContain("Add ready event-loop proof for 5 more pilot chapter(s).");
    expect(report).toContain("It intentionally shows counts and owner asks only");
    expect(report).not.toContain("member.001@medlifemovement.org");
  });

  it("separates post-apply signed-in proof from base rollout data", () => {
    const packet = createReadyPacket();
    packet.signedInRouteProof = [];
    const request = getProductionRolloutDataRequest(packet);
    const dsSection = request.sections.find(
      (section) => section.owner === "DS / launch owner",
    );

    expect(request.ready).toBe(false);
    expect(request.intakeStatus.basePacketReady).toBe(true);
    expect(request.intakeStatus.pilotEventProofReady).toBe(true);
    expect(request.intakeStatus.signedInRouteProofReady).toBe(false);
    expect(dsSection?.status).toBe("post_apply");
    expect(dsSection?.asks).toContain(
      "After production users and app rows exist, record signed-in proof for member, leader, staff, admin, launch owners, and the ready pilot chapters.",
    );
  });

  it("marks the data request ready when the full packet has signed-in proof", () => {
    const request = getProductionRolloutDataRequest(createReadyPacket());
    const report = formatProductionRolloutDataRequest(request);

    expect(request.ready).toBe(true);
    expect(request.sections.every((section) => section.status === "ready")).toBe(true);
    expect(report).toContain("myMEDLIFE 30-chapter data request: READY");
    expect(report).toContain("pnpm production:invite-gate");
  });
});

function createEmptyPacket(): ProductionRolloutBootstrapPacket {
  return {
    chapters: [],
    users: [],
    memberships: [],
    staffRoles: [],
    coachAssignments: [],
    campaigns: [],
    lumaCalendars: [],
    pilotEventProof: [],
    launchOwners: [],
    signedInRouteProof: [],
  };
}

function createReadyPacket(): ProductionRolloutBootstrapPacket {
  const chapters = Array.from({ length: 30 }, (_value, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      id: `chapter-${number}`,
      name: `Chapter ${number} MEDLIFE`,
      campus: `Campus ${number}`,
    };
  });
  const leaders = chapters.map((chapter, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      email: `leader.${number}@medlifemovement.org`,
      displayName: `${chapter.name} Leader`,
    };
  });
  const members = Array.from({ length: 470 }, (_value, index) => {
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
      ...leaders,
      ...members,
    ],
    memberships: [
      ...leaders.map((leader, index) => ({
        email: leader.email,
        chapterId: chapters[index]?.id ?? "chapter-01",
        roleKey: "president_vp" as const,
      })),
      ...members.map((member, index) => ({
        email: member.email,
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
    campaigns: chapters.map((chapter) => ({
      chapterId: chapter.id,
      name: "Rush Month",
      slug: `rush-month-${chapter.id}`,
    })),
    lumaCalendars: chapters.map((chapter) => ({
      chapterId: chapter.id,
      calendarId: `cal-${chapter.id}`,
      calendarName: `${chapter.name} Calendar`,
      status: "linked",
    })),
    pilotEventProof: chapters.slice(0, 5).map((chapter, index) => ({
      chapterId: chapter.id,
      eventName: "Rush Month Kickoff",
      lumaEventId: `evt-${chapter.id}`,
      rsvpCount: 12,
      attendanceCount: 10,
      pointsAwardedCount: 10,
      auditEvidence: "recorded",
      outboxStatus: "zero_sends",
      status: "ready",
      eventRoute: `/app/events/evt-${chapter.id}`,
      attendanceRoute: `/leader?view=events&event=evt-${chapter.id}`,
      pointsRoute: `/leader?view=leaderboard&chapter=${chapter.id}`,
      auditRoute: "/admin/audit-log",
      outboxRoute: "/admin/integration-outbox",
      checkedAt: `2026-07-05T15:${String(index).padStart(2, "0")}:00Z`,
      reviewedByEmail: "admin@medlifemovement.org",
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
    ],
    signedInRouteProof: [
      ...Array.from({ length: 5 }, (_value, index) => {
        const leaderNumber = String(index + 1).padStart(2, "0");
        const memberNumber = String(index + 1).padStart(3, "0");

        return [
          {
            email: `member.${memberNumber}@medlifemovement.org`,
            workspace: "student_app" as const,
            expectedPath: "/app",
            observedPath: "/app",
            status: "passed" as const,
            checkedAt: `2026-07-05T15:${String(index).padStart(2, "0")}:00Z`,
          },
          {
            email: `leader.${leaderNumber}@medlifemovement.org`,
            workspace: "leader_command_center" as const,
            expectedPath: "/leader?view=overview",
            observedPath: "/leader?view=overview",
            status: "passed" as const,
            checkedAt: `2026-07-05T15:${String(index + 5).padStart(2, "0")}:00Z`,
          },
        ];
      }).flat(),
      {
        email: "admin@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-05T15:20:00Z",
      },
      {
        email: "ds@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
        checkedAt: "2026-07-05T15:21:00Z",
      },
    ],
  };
}
