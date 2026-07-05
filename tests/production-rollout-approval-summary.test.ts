import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutApprovalSummary,
  getProductionRolloutApprovalSummary,
} from "@/services/production-rollout-approval-summary";
import type {
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

describe("production rollout approval summary", () => {
  it("formats a redacted final-gate review summary for a ready packet", () => {
    const summary = getProductionRolloutApprovalSummary(createReadyPacket());
    const report = formatProductionRolloutApprovalSummary(summary);

    expect(summary.readyForFinalGateReview).toBe(true);
    expect(report).toContain(
      "30-chapter approval summary: READY FOR FINAL GATE REVIEW",
    );
    expect(report).toContain("- active chapters: 30");
    expect(report).toContain("- approved student/leader invitees: 500");
    expect(report).toContain("- planned invite batches:");
    expect(report).toContain("Chapter 01 MEDLIFE - 11 invitee(s) - core ready");
    expect(report).toContain("Batch 1 pilot: 5 chapter(s), 55 recipient(s)");
    expect(report).toContain("- support owner is named");
    expect(report).toContain("- rollback owner is named");
    expect(report).toContain("- production apply owner is named");
    expect(report).not.toContain("member.001@medlifemovement.org");
    expect(report).not.toContain("leader.01@medlifemovement.org");
    expect(report).not.toContain("coach@medlifemovement.org");
    expect(report).not.toContain("ds@medlifemovement.org");
  });

  it("keeps high-level blockers visible without exposing invitee emails", () => {
    const packet = createReadyPacket();
    packet.memberships.push({
      email: "member.001@medlifemovement.org",
      chapterId: "chapter-06",
      roleKey: "general_member",
      status: "approved",
    });
    packet.launchOwners = packet.launchOwners?.filter(
      (owner) => owner.ownerType !== "rollback",
    );

    const summary = getProductionRolloutApprovalSummary(packet);
    const report = formatProductionRolloutApprovalSummary(summary);

    expect(summary.readyForFinalGateReview).toBe(false);
    expect(report).toContain("30-chapter approval summary: NOT READY");
    expect(report).toContain("Invite batches are not ready.");
    expect(report).toContain("rollback owner is missing");
    expect(report).toContain("<redacted-email> appears in multiple launch chapters");
    expect(report).not.toContain("member.001@medlifemovement.org");
  });
});

function createReadyPacket(): ProductionRolloutBootstrapPacket {
  const chapters = Array.from({ length: 30 }, (_value, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      id: `chapter-${number}`,
      name: `Chapter ${number} MEDLIFE`,
      campus: `Campus ${number}`,
      status: "active" as const,
    };
  });
  const users = [
    { email: "coach@medlifemovement.org", displayName: "Launch Coach" },
    { email: "admin@medlifemovement.org", displayName: "Launch Admin" },
    { email: "ds@medlifemovement.org", displayName: "DS Admin" },
    ...chapters.map((chapter, index) => {
      const number = String(index + 1).padStart(2, "0");

      return {
        email: `leader.${number}@medlifemovement.org`,
        displayName: `${chapter.name} Leader`,
      };
    }),
    ...Array.from({ length: 470 }, (_value, index) => {
      const number = String(index + 1).padStart(3, "0");

      return {
        email: `member.${number}@medlifemovement.org`,
        displayName: `Launch Member ${number}`,
      };
    }),
  ];
  let memberIndex = 0;

  return {
    chapters,
    users,
    memberships: [
      ...chapters.map((chapter, index) => {
        const number = String(index + 1).padStart(2, "0");

        return {
          email: `leader.${number}@medlifemovement.org`,
          chapterId: chapter.id,
          roleKey: "president_vp" as const,
          status: "approved" as const,
        };
      }),
      ...chapters.flatMap((chapter, index) =>
        Array.from({ length: getMemberCountForChapter(index) }, () => {
          memberIndex += 1;
          const memberNumber = String(memberIndex).padStart(3, "0");

          return {
            email: `member.${memberNumber}@medlifemovement.org`,
            chapterId: chapter.id,
            roleKey: "general_member" as const,
            status: "approved" as const,
          };
        }),
      ),
    ],
    staffRoles: [
      { email: "coach@medlifemovement.org", roleKey: "coach", status: "active" },
      { email: "admin@medlifemovement.org", roleKey: "admin", status: "active" },
      { email: "ds@medlifemovement.org", roleKey: "ds_admin", status: "active" },
    ],
    coachAssignments: chapters.map((chapter) => ({
      coachEmail: "coach@medlifemovement.org",
      chapterId: chapter.id,
      coachType: "portfolio",
      status: "active",
    })),
    campaigns: chapters.map((chapter, index) => {
      const number = String(index + 1).padStart(2, "0");

      return {
        chapterId: chapter.id,
        name: "Rush Month",
        slug: `rush-month-${number}`,
        status: "active",
      };
    }),
    lumaCalendars: chapters.map((chapter, index) => {
      const number = String(index + 1).padStart(2, "0");

      return {
        chapterId: chapter.id,
        calendarId: `cal-chapter-${number}`,
        calendarName: `${chapter.name} Calendar`,
        status: "linked",
      };
    }),
    pilotEventProof: chapters.slice(0, 5).map((chapter, index) => {
      const number = String(index + 1).padStart(2, "0");

      return {
        chapterId: chapter.id,
        eventName: "Rush Month Kickoff",
        lumaEventId: `evt-chapter-${number}`,
        rsvpCount: 12,
        attendanceCount: 10,
        pointsAwardedCount: 10,
        auditEvidence: "recorded",
        outboxStatus: "zero_sends",
        status: "ready",
        eventRoute: `/app/events/evt-chapter-${number}`,
        attendanceRoute: `/leader?view=events&event=evt-chapter-${number}`,
        pointsRoute: `/leader?view=leaderboard&chapter=${chapter.id}`,
        auditRoute: "/admin/audit-log",
        outboxRoute: "/admin/integration-outbox",
        checkedAt: "2026-07-05T15:00:00Z",
        reviewedByEmail: "admin@medlifemovement.org",
      };
    }),
    launchOwners: [
      {
        email: "admin@medlifemovement.org",
        ownerType: "support",
        displayName: "Launch Admin",
        status: "active",
      },
      {
        email: "ds@medlifemovement.org",
        ownerType: "rollback",
        displayName: "DS Admin",
        status: "active",
      },
      {
        email: "ds@medlifemovement.org",
        ownerType: "production_apply",
        displayName: "DS Admin",
        status: "active",
      },
      {
        email: "admin@medlifemovement.org",
        ownerType: "launch_decision",
        displayName: "Launch Admin",
        status: "active",
      },
    ],
    signedInRouteProof: [
      ...chapters.slice(0, 5).flatMap((chapter, index) => {
        const number = String(index + 1).padStart(2, "0");
        const memberNumber = String(getFirstMemberNumberForChapter(index)).padStart(3, "0");

        return [
          {
            email: `member.${memberNumber}@medlifemovement.org`,
            workspace: "student_app" as const,
            expectedPath: "/app",
            observedPath: "/app",
            status: "passed" as const,
            checkedAt: `2026-07-05T15:${number}:00Z`,
          },
          {
            email: `leader.${number}@medlifemovement.org`,
            workspace: "leader_command_center" as const,
            expectedPath: "/leader?view=overview",
            observedPath: "/leader?view=overview",
            status: "passed" as const,
            checkedAt: `2026-07-05T15:${String(index + 6).padStart(2, "0")}:00Z`,
          },
        ];
      }),
      {
        email: "coach@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-05T15:20:00Z",
      },
      {
        email: "admin@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-05T15:21:00Z",
      },
      {
        email: "ds@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
        checkedAt: "2026-07-05T15:22:00Z",
      },
    ],
  };
}

function getMemberCountForChapter(index: number) {
  if (index < 5) {
    return 10;
  }

  return index < 25 ? 17 : 16;
}

function getFirstMemberNumberForChapter(chapterIndex: number) {
  let memberNumber = 1;

  for (let index = 0; index < chapterIndex; index += 1) {
    memberNumber += getMemberCountForChapter(index);
  }

  return memberNumber;
}
