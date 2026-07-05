import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutGapReport,
  getProductionRolloutGapReport,
} from "@/services/production-rollout-gap-report";
import type {
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

describe("production rollout gap report", () => {
  it("passes for a complete launch packet and does not print invitee emails", () => {
    const report = getProductionRolloutGapReport(createPacket());
    const formatted = formatProductionRolloutGapReport(report);

    expect(report.ready).toBe(true);
    expect(report.chapterGaps).toEqual([]);
    expect(report.ownerGaps).toEqual([]);
    expect(report.signedInRouteProofGaps).toEqual([]);
    expect(formatted).toContain("Production rollout packet gaps: READY");
    expect(formatted).toContain("complete chapters: 30");
    expect(formatted).not.toContain("member.001@medlifemovement.org");
  });

  it("groups missing launch data by chapter owner and route-proof lane", () => {
    const packet = createPacket();

    packet.memberships = packet.memberships.filter(
      (membership) => membership.chapterId !== "chapter-02",
    );
    packet.lumaCalendars = packet.lumaCalendars?.filter(
      (calendar) => calendar.chapterId !== "chapter-03",
    );
    packet.launchOwners = packet.launchOwners?.filter(
      (owner) => owner.ownerType !== "rollback",
    );
    packet.signedInRouteProof = packet.signedInRouteProof?.filter(
      (proof) => proof.workspace !== "staff_command_center",
    );

    const report = getProductionRolloutGapReport(packet);
    const formatted = formatProductionRolloutGapReport(report);

    expect(report.ready).toBe(false);
    expect(report.chapterGaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chapterId: "chapter-02",
          missing: expect.arrayContaining([
            "add at least one approved member",
            "add at least one approved student leader",
          ]),
        }),
        expect.objectContaining({
          chapterId: "chapter-03",
          missing: expect.arrayContaining(["add a linked Luma calendar"]),
        }),
      ]),
    );
    expect(report.ownerGaps).toContain("Add an active rollback owner.");
    expect(report.signedInRouteProofGaps).toContain(
      "Record signed-in proof that one real staff or coach user reaches /staff?view=chapters.",
    );
    expect(formatted).toContain("Chapter 02 MEDLIFE");
    expect(formatted).toContain("Owner gaps:");
  });

  it("flags launch owners who cannot access the workspace needed for their role", () => {
    const packet = createPacket();
    packet.launchOwners = [
      {
        email: "member.001@medlifemovement.org",
        ownerType: "support",
        displayName: "Member Owner",
        status: "active",
      },
      {
        email: "admin@medlifemovement.org",
        ownerType: "rollback",
        displayName: "Launch Admin",
        status: "active",
      },
      {
        email: "coach@medlifemovement.org",
        ownerType: "production_apply",
        displayName: "Launch Coach",
        status: "active",
      },
    ];

    const report = getProductionRolloutGapReport(packet);

    expect(report.ready).toBe(false);
    expect(report.ownerGaps).toEqual(
      expect.arrayContaining([
        "Launch owner member.001@medlifemovement.org (support) needs an active coach, admin, or super_admin staff role.",
        "Launch owner admin@medlifemovement.org (rollback) needs an active ds_admin or super_admin staff role.",
        "Launch owner coach@medlifemovement.org (production_apply) needs an active ds_admin or super_admin staff role.",
      ]),
    );
  });

  it("flags launch owners without passed route proof for their operating workspace", () => {
    const packet = createPacket();
    packet.signedInRouteProof = packet.signedInRouteProof?.filter(
      (proof) =>
        proof.email !== "admin@medlifemovement.org" &&
        proof.email !== "ds@medlifemovement.org",
    );

    const report = getProductionRolloutGapReport(packet);

    expect(report.ready).toBe(false);
    expect(report.ownerGaps).toEqual(
      expect.arrayContaining([
        "Launch owner admin@medlifemovement.org (support) needs passed signed-in proof for /staff?view=chapters.",
        "Launch owner ds@medlifemovement.org (rollback) needs passed signed-in proof for /admin.",
        "Launch owner ds@medlifemovement.org (production_apply) needs passed signed-in proof for /admin.",
      ]),
    );
  });

  it("explains missing count minimums when the packet is still blank", () => {
    const report = getProductionRolloutGapReport({
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
    });

    expect(report.ready).toBe(false);
    expect(report.packetBlockers).toContain(
      "Add at least 30 active chapters before production rollout. Current active chapters: 0.",
    );
    expect(report.ownerGaps).toEqual([
      "Add an active support owner.",
      "Add an active rollback owner.",
      "Add an active production apply owner.",
    ]);
    expect(report.signedInRouteProofGaps).toHaveLength(4);
  });
});

function createPacket(): ProductionRolloutBootstrapPacket {
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
        Array.from({ length: index < 20 ? 16 : 15 }, () => {
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
        email: "admin@medlifemovement.org",
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
