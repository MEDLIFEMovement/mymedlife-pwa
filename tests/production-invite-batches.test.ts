import { describe, expect, it } from "vitest";
import {
  formatProductionInviteBatchReadiness,
  getProductionInviteBatchReadiness,
} from "@/services/production-invite-batches";
import type {
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

describe("production invite batch readiness", () => {
  it("plans a safe five-chapter pilot batch followed by capped expansion batches", () => {
    const readiness = getProductionInviteBatchReadiness(createReadyPacket());
    const report = formatProductionInviteBatchReadiness(readiness);

    expect(readiness.ready).toBe(true);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.counts).toMatchObject({
      activeChapters: 30,
      studentInvitees: 500,
      pilotReadyChapters: 5,
    });
    expect(readiness.batches[0]).toMatchObject({
      number: 1,
      kind: "pilot",
      chapterCount: 5,
      recipientCount: 55,
    });
    expect(readiness.batches.every((batch) => batch.recipientCount <= 75)).toBe(
      true,
    );
    expect(report).toContain("Production invite batch readiness: READY");
    expect(report).toContain("Batch 1 pilot: 5 chapter(s), 55 recipient(s)");
    expect(report).not.toContain("member.001@medlifemovement.org");
  });

  it("blocks if batch 1 has too many recipients for the reviewed cap", () => {
    const readiness = getProductionInviteBatchReadiness(createReadyPacket(), {
      maxRecipientsPerBatch: 50,
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "Batch 1 has 55 invitees, which exceeds the cap of 50.",
    );
  });

  it("blocks duplicate cross-chapter invitees before a bad invite send", () => {
    const packet = createReadyPacket();

    packet.memberships.push({
      email: "member.001@medlifemovement.org",
      chapterId: "chapter-06",
      roleKey: "general_member",
      status: "approved",
    });

    const readiness = getProductionInviteBatchReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "member.001@medlifemovement.org appears in multiple launch chapters (chapter-01, chapter-06). Resolve the chapter assignment before invite batching.",
    );
  });

  it("blocks when the five-chapter pilot proof has not been recorded", () => {
    const packet = createReadyPacket();

    packet.pilotEventProof = packet.pilotEventProof?.slice(0, 4);

    const readiness = getProductionInviteBatchReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "Need 5 pilot-ready chapters in batch 1. Current pilot-ready chapters: 4.",
    );
  });
});

function createReadyPacket(): ProductionRolloutBootstrapPacket {
  const chapters = Array.from({ length: 30 }, (_value, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      id: `chapter-${number}`,
      name: `Chapter ${number} MEDLIFE`,
      campus: `Campus ${number}`,
      region: index % 2 === 0 ? "West" : "East",
      status: "active" as const,
    };
  });
  const staffUsers = [
    { email: "coach@medlifemovement.org", displayName: "Launch Coach" },
    { email: "admin@medlifemovement.org", displayName: "Launch Admin" },
    { email: "ds@medlifemovement.org", displayName: "DS Admin" },
  ];
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
  let memberIndex = 0;

  return {
    chapters,
    users: [...staffUsers, ...leaderUsers, ...memberUsers],
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
      ...chapters.flatMap((chapter, index) => {
        const memberCount = getMemberCountForChapter(index);

        return Array.from({ length: memberCount }, () => {
          memberIndex += 1;
          const memberNumber = String(memberIndex).padStart(3, "0");

          return {
            email: `member.${memberNumber}@medlifemovement.org`,
            chapterId: chapter.id,
            roleKey: "general_member" as const,
            status: "approved" as const,
          };
        });
      }),
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
  };
}

function getMemberCountForChapter(index: number) {
  if (index < 5) {
    return 10;
  }

  return index < 25 ? 17 : 16;
}
