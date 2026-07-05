import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutChapterMatrix,
  getProductionRolloutChapterMatrix,
} from "@/services/production-rollout-chapter-matrix";
import type {
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

describe("production rollout chapter matrix", () => {
  it("summarizes empty intake without exposing invitee details", () => {
    const matrix = getProductionRolloutChapterMatrix(createEmptyPacket());
    const report = formatProductionRolloutChapterMatrix(matrix);

    expect(matrix.ready).toBe(false);
    expect(matrix.counts.activeChapters).toBe(0);
    expect(report).toContain("Production rollout chapter matrix: NOT READY");
    expect(report).toContain("Add 30 more active chapter row(s).");
    expect(report).toContain("No active chapters in the packet.");
    expect(report).not.toContain("member@medlifemovement.org");
  });

  it("shows the specific missing data for each active chapter", () => {
    const packet = createReadyPacket();
    packet.lumaCalendars = [];
    packet.coachAssignments = [];
    packet.signedInRouteProof = [];

    const matrix = getProductionRolloutChapterMatrix(packet, {
      minimumChapterCount: 1,
      minimumPilotChapterCount: 1,
    });
    const report = formatProductionRolloutChapterMatrix(matrix);

    expect(matrix.ready).toBe(false);
    expect(matrix.rows[0]?.blockers).toEqual([
      "add an active coach assignment",
      "add a linked Luma calendar mapping",
      "add passed signed-in member route proof for /app",
      "add passed signed-in leader route proof for /leader?view=overview",
    ]);
    expect(report).toContain("UCLA MEDLIFE: add an active coach assignment");
    expect(report).toContain("UCLA MEDLIFE: add a linked Luma calendar mapping");
  });

  it("marks a chapter matrix ready when core chapter data and pilot route proof are present", () => {
    const matrix = getProductionRolloutChapterMatrix(createReadyPacket(), {
      minimumChapterCount: 1,
      minimumPilotChapterCount: 1,
    });
    const report = formatProductionRolloutChapterMatrix(matrix);

    expect(matrix.ready).toBe(true);
    expect(matrix.counts).toEqual({
      activeChapters: 1,
      coreReadyChapters: 1,
      linkedLumaChapters: 1,
      readyPilotEventProofChapters: 1,
      pilotChaptersWithMemberAndLeaderRouteProof: 1,
      approvedStudentLeaderInvitees: 2,
    });
    expect(report).toContain("Production rollout chapter matrix: READY");
    expect(report).toContain("| UCLA MEDLIFE | 2 | pass | pass | pass | pass | pass | pass | pass | ready |");
    expect(report).not.toContain("member@medlifemovement.org");
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
  return {
    chapters: [
      {
        id: "chapter-ucla",
        name: "UCLA MEDLIFE",
        campus: "UCLA",
        status: "active",
      },
    ],
    users: [
      { email: "member@medlifemovement.org", displayName: "Launch Member" },
      { email: "leader@medlifemovement.org", displayName: "Launch Leader" },
      { email: "coach@medlifemovement.org", displayName: "Launch Coach" },
      { email: "admin@medlifemovement.org", displayName: "Launch Admin" },
    ],
    memberships: [
      {
        email: "member@medlifemovement.org",
        chapterId: "chapter-ucla",
        roleKey: "general_member",
        status: "approved",
      },
      {
        email: "leader@medlifemovement.org",
        chapterId: "chapter-ucla",
        roleKey: "president_vp",
        status: "approved",
      },
    ],
    staffRoles: [
      { email: "coach@medlifemovement.org", roleKey: "coach", status: "active" },
      { email: "admin@medlifemovement.org", roleKey: "ds_admin", status: "active" },
    ],
    coachAssignments: [
      {
        coachEmail: "coach@medlifemovement.org",
        chapterId: "chapter-ucla",
        coachType: "portfolio",
        status: "active",
      },
    ],
    campaigns: [
      {
        chapterId: "chapter-ucla",
        name: "Rush Month",
        slug: "rush-month-ucla",
        status: "active",
      },
    ],
    lumaCalendars: [
      {
        chapterId: "chapter-ucla",
        calendarId: "cal-ucla",
        calendarName: "UCLA MEDLIFE",
        status: "linked",
      },
    ],
    pilotEventProof: [
      {
        chapterId: "chapter-ucla",
        eventName: "Rush Month Kickoff",
        lumaEventId: "evt-ucla",
        rsvpCount: 12,
        attendanceCount: 10,
        pointsAwardedCount: 10,
        auditEvidence: "recorded",
        outboxStatus: "zero_sends",
        status: "ready",
        eventRoute: "/app/events/evt-ucla",
        attendanceRoute: "/leader?view=events&event=evt-ucla",
        pointsRoute: "/leader?view=leaderboard&chapter=chapter-ucla",
        auditRoute: "/admin/audit-log",
        outboxRoute: "/admin/integration-outbox",
        checkedAt: "2026-07-05T15:00:00Z",
        reviewedByEmail: "admin@medlifemovement.org",
      },
    ],
    launchOwners: [
      {
        email: "admin@medlifemovement.org",
        ownerType: "support",
        displayName: "Launch Admin",
        status: "active",
      },
    ],
    signedInRouteProof: [
      {
        email: "member@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
        checkedAt: "2026-07-05T15:01:00Z",
      },
      {
        email: "leader@medlifemovement.org",
        workspace: "leader_command_center",
        expectedPath: "/leader?view=overview",
        observedPath: "/leader?view=overview",
        status: "passed",
        checkedAt: "2026-07-05T15:02:00Z",
      },
    ],
  };
}
