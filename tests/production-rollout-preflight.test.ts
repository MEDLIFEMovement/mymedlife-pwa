import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutPreflight,
  getProductionRolloutPreflight,
} from "@/services/production-rollout-preflight";
import type {
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

describe("production rollout preflight", () => {
  it("combines rollout gates into one read-only ready report", () => {
    const packet = createReadyPacket();
    const preflight = getProductionRolloutPreflight(packet, {
      minimumChapterCount: 5,
      minimumStudentMembershipCount: 15,
      minimumPilotChapterCount: 2,
      maxRecipientsPerBatch: 20,
      runtimeMappingJson: createRuntimeMappingJson(packet),
    });
    const report = formatProductionRolloutPreflight(preflight);

    expect(preflight.stages.filter((stage) => !stage.ready).map((stage) => stage.label)).toEqual([]);
    expect(preflight.ready).toBe(true);
    expect(preflight.stages).toHaveLength(6);
    expect(report).toContain("30-chapter rollout preflight: READY");
    expect(report).toContain("Stage summary: 6/6 passed");
    expect(report).toContain("Does not create users");
    expect(report).not.toContain("member.001@medlifemovement.org");
    expect(report).toContain("m***@medlifemovement.org");
  });

  it("points reviewers to the first incomplete rollout stage", () => {
    const packet = createReadyPacket();

    packet.pilotEventProof = packet.pilotEventProof?.slice(0, 1);

    const preflight = getProductionRolloutPreflight(packet, {
      minimumChapterCount: 5,
      minimumStudentMembershipCount: 15,
      minimumPilotChapterCount: 2,
      maxRecipientsPerBatch: 20,
      runtimeMappingJson: createRuntimeMappingJson(packet),
    });
    const report = formatProductionRolloutPreflight(preflight);

    expect(preflight.ready).toBe(false);
    expect(preflight.nextSteps[0]).toBe("Fix the first failing stage: CSV intake.");
    expect(report).toContain("FAIL CSV intake");
    expect(report).toContain("Current proven pilot chapters: 1");
  });
});

function createRuntimeMappingJson(packet: ProductionRolloutBootstrapPacket) {
  return JSON.stringify(
    Object.fromEntries(
      packet.lumaCalendars?.map((calendar) => [
        calendar.chapterId,
        {
          chapterId: calendar.chapterId,
          calendarId: calendar.calendarId,
          status: "ready",
        },
      ]) ?? [],
    ),
  );
}

function createReadyPacket(): ProductionRolloutBootstrapPacket {
  const chapters = Array.from({ length: 5 }, (_value, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      id: `chapter-${number}`,
      name: `Chapter ${number} MEDLIFE`,
      campus: `Campus ${number}`,
      region: "Pilot",
      status: "active" as const,
    };
  });
  const memberUsers = Array.from({ length: 10 }, (_value, index) => {
    const number = String(index + 1).padStart(3, "0");

    return {
      email: `member.${number}@medlifemovement.org`,
      displayName: `Launch Member ${number}`,
    };
  });
  const leaderUsers = chapters.map((chapter, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      email: `leader.${number}@medlifemovement.org`,
      displayName: `${chapter.name} Leader`,
    };
  });
  let memberIndex = 0;
  const routeProofCheckedAt = "2026-07-05T21:00:00Z";

  return {
    chapters,
    users: [
      ...memberUsers,
      ...leaderUsers,
      { email: "coach@medlifemovement.org", displayName: "Launch Coach" },
      { email: "admin@medlifemovement.org", displayName: "Launch Admin" },
      { email: "ds@medlifemovement.org", displayName: "DS Admin" },
    ],
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
      ...chapters.flatMap((chapter) =>
        Array.from({ length: 2 }, () => {
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
    campaigns: chapters.map((chapter, index) => ({
      chapterId: chapter.id,
      name: "Rush Month",
      slug: `rush-month-${index + 1}`,
      status: "active",
    })),
    lumaCalendars: chapters.map((chapter, index) => ({
      chapterId: chapter.id,
      calendarId: `cal-chapter-${index + 1}`,
      calendarName: `${chapter.name} Calendar`,
      status: "linked",
    })),
    pilotEventProof: chapters.slice(0, 2).map((chapter, index) => ({
      chapterId: chapter.id,
      eventName: "Rush Month Kickoff",
      lumaEventId: `evt-chapter-${index + 1}`,
      rsvpCount: 3,
      attendanceCount: 2,
      pointsAwardedCount: 2,
      auditEvidence: "recorded",
      outboxStatus: "zero_sends",
      status: "ready",
      eventRoute: `/app/events/evt-chapter-${index + 1}`,
      attendanceRoute: `/leader?view=events&event=evt-chapter-${index + 1}`,
      pointsRoute: `/leader?view=leaderboard&chapter=${chapter.id}`,
      auditRoute: "/admin/audit-log",
      outboxRoute: "/admin/integration-outbox",
      checkedAt: "2026-07-05T20:00:00Z",
      reviewedByEmail: "admin@medlifemovement.org",
    })),
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
      {
        email: "member.001@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
        checkedAt: routeProofCheckedAt,
      },
      {
        email: "leader.01@medlifemovement.org",
        workspace: "leader_command_center",
        expectedPath: "/leader?view=overview",
        observedPath: "/leader?view=overview",
        status: "passed",
        checkedAt: routeProofCheckedAt,
      },
      {
        email: "coach@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: routeProofCheckedAt,
      },
      {
        email: "admin@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: routeProofCheckedAt,
      },
      {
        email: "ds@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
        checkedAt: routeProofCheckedAt,
      },
      {
        email: "member.003@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
        checkedAt: routeProofCheckedAt,
      },
      {
        email: "leader.02@medlifemovement.org",
        workspace: "leader_command_center",
        expectedPath: "/leader?view=overview",
        observedPath: "/leader?view=overview",
        status: "passed",
        checkedAt: routeProofCheckedAt,
      },
    ],
  };
}
