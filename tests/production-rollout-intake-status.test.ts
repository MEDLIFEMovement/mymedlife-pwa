import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutIntakeStatus,
  getProductionRolloutIntakeStatus,
} from "@/services/production-rollout-intake-status";
import type {
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

describe("production rollout intake status", () => {
  it("summarizes an empty CSV intake without exposing row details", () => {
    const status = getProductionRolloutIntakeStatus(createEmptyPacket());
    const report = formatProductionRolloutIntakeStatus(status);

    expect(status.ready).toBe(false);
    expect(status.counts.chapters).toBe(0);
    expect(status.counts.approvedStudentMemberships).toBe(0);
    expect(status.counts.readyPilotEventProofChapters).toBe(0);
    expect(report).toContain("Production rollout CSV intake: NOT READY");
    expect(report).toContain("Add active chapter rows to chapters.csv. Current: 0; needed: 30.");
    expect(report).toContain("Add launch users to users.csv.");
    expect(report).toContain(
      "Add one linked Luma calendar mapping for every launch chapter. Current: 0; needed: 30.",
    );
    expect(report).toContain("After production users are applied, add passed signed-in route proof");
    expect(report).not.toContain("member.001@medlifemovement.org");
  });

  it("marks base intake ready while keeping signed-in route proof separate", () => {
    const packet = createReadyPacket();
    packet.signedInRouteProof = [];
    const status = getProductionRolloutIntakeStatus(packet);

    expect(status.ready).toBe(true);
    expect(status.basePacketReady).toBe(true);
    expect(status.pilotEventProofReady).toBe(true);
    expect(status.signedInRouteProofReady).toBe(false);
    expect(status.missingDataAsks).toEqual([
      "After production users are applied, add passed signed-in route proof for one member, one leader, one staff user, one admin, and member/leader access for each ready pilot chapter.",
    ]);
  });

  it("marks the full intake ready when the packet and signed-in route proof are filled", () => {
    const status = getProductionRolloutIntakeStatus(createReadyPacket());
    const report = formatProductionRolloutIntakeStatus(status);

    expect(status.ready).toBe(true);
    expect(status.basePacketReady).toBe(true);
    expect(status.pilotEventProofReady).toBe(true);
    expect(status.signedInRouteProofReady).toBe(true);
    expect(status.missingDataAsks).toEqual([]);
    expect(report).toContain("Production rollout CSV intake: READY");
    expect(report).toContain("- active chapters: 30");
    expect(report).toContain("- approved student/leader users: 500");
    expect(report).toContain("- ready pilot event-loop chapters: 5");
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
  const memberUsers = Array.from({ length: 470 }, (_value, index) => {
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
    pilotEventProof: chapters.slice(0, 5).map((chapter, index) => ({
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
      notes: "Event loop proof verified.",
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
        const number = String(index + 1).padStart(2, "0");
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
            email: `leader.${number}@medlifemovement.org`,
            workspace: "leader_command_center" as const,
            expectedPath: "/leader?view=overview",
            observedPath: "/leader?view=overview",
            status: "passed" as const,
            checkedAt: `2026-07-05T15:${String(index + 5).padStart(2, "0")}:00Z`,
          },
        ];
      }).flat(),
      {
        email: "coach@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-05T15:02:00Z",
      },
      {
        email: "ds@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
        checkedAt: "2026-07-05T15:03:00Z",
      },
    ],
  };
}
