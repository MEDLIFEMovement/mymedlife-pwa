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
    expect(readiness.counts.approvedStudentMemberships).toBe(500);
    expect(readiness.counts.linkedLumaCalendars).toBe(30);
    expect(readiness.counts.readyPilotEventProofChapters).toBe(5);
    expect(readiness.counts.activeLaunchOwners).toBe(4);
    expect(readiness.counts.memberWorkspaceUsers).toBe(500);
    expect(readiness.counts.leaderWorkspaceUsers).toBe(30);
    expect(readiness.counts.staffWorkspaceUsers).toBe(2);
    expect(readiness.counts.adminWorkspaceUsers).toBe(1);
    expect(readiness.counts.chaptersWithMemberWorkspaceAccess).toBe(30);
    expect(readiness.counts.chaptersWithLeaderWorkspaceAccess).toBe(30);
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

  it("blocks duplicate access and mapping rows before a broad invite", () => {
    const packet = createCompletePacket(30);
    packet.memberships.push({ ...packet.memberships[0]! });
    packet.staffRoles.push({ ...packet.staffRoles[0]! });
    packet.coachAssignments.push({ ...packet.coachAssignments[0]! });
    packet.campaigns.push({ ...packet.campaigns[0]! });
    packet.lumaCalendars?.push({
      chapterId: "chapter-30",
      calendarId: packet.lumaCalendars[0]!.calendarId,
      calendarName: "Duplicate calendar mapping",
    });
    packet.pilotEventProof?.push({ ...packet.pilotEventProof[0]! });
    packet.launchOwners?.push({ ...packet.launchOwners[0]! });

    const readiness = getProductionRolloutBootstrapReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "Duplicate membership access row: leader.01@medlifemovement.org / chapter-01 / president_vp.",
    );
    expect(readiness.blockers).toContain(
      "Duplicate staff role row: coach@medlifemovement.org / coach.",
    );
    expect(readiness.blockers).toContain(
      "Duplicate coach assignment row: coach@medlifemovement.org / chapter-01 / portfolio.",
    );
    expect(readiness.blockers).toContain(
      "Duplicate campaign row: chapter-01 / rush-month-01.",
    );
    expect(readiness.blockers).toContain(
      "Duplicate linked Luma calendar id: cal-chapter-01.",
    );
    expect(readiness.blockers).toContain(
      "Duplicate pilot event proof row: chapter-01 / evt-chapter-01.",
    );
    expect(readiness.blockers).toContain(
      "Duplicate launch owner row: admin@medlifemovement.org / support.",
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
    expect(readiness.blockers).toContain("Add at least one active coach, admin, or super admin for staff command center access.");
    expect(readiness.blockers).toContain("Add at least one active DS Admin or Super Admin for admin backend access.");
    expect(readiness.blockers).toContain("Add at least one active admin staff role for day-one support.");
    expect(readiness.blockers).toContain("Add at least one DS Admin or Super Admin for launch controls.");
  });

  it("names empty packet sections so launch owners know which CSVs to fill", () => {
    const readiness = getProductionRolloutBootstrapReadiness({
      chapters: [],
      users: [],
      memberships: [],
      staffRoles: [],
      coachAssignments: [],
      campaigns: [],
      lumaCalendars: [],
      pilotEventProof: [],
      launchOwners: [],
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toEqual(
      expect.arrayContaining([
        "Add launch users to users.csv before production rollout.",
        "Add approved chapter memberships to memberships.csv before production rollout.",
        "Add active coach assignments to coach-assignments.csv before production rollout.",
        "Add active launch campaigns to campaigns.csv before production rollout.",
      ]),
    );
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
      "- approved student/leader users: 500",
    );
    expect(formatProductionRolloutBootstrapReadiness(readiness)).toContain(
      "- member workspace users: 500",
    );
    expect(formatProductionRolloutBootstrapReadiness(readiness)).toContain(
      "Add at least 30 active chapters before production rollout.",
    );
  });

  it("blocks chapters that cannot exercise the student member app with a real member", () => {
    const packet = createCompletePacket(30);
    packet.memberships = packet.memberships.map((membership) => ({
      ...membership,
      roleKey: "president_vp",
    }));

    const readiness = getProductionRolloutBootstrapReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "Chapter 01 MEDLIFE needs at least one approved member for the student app.",
    );
    expect(readiness.counts.leaderWorkspaceUsers).toBe(500);
    expect(readiness.counts.memberWorkspaceUsers).toBe(500);
    expect(readiness.counts.chaptersWithLeaderWorkspaceAccess).toBe(30);
  });

  it("blocks packets without Luma mappings, pilot proof, and launch owners", () => {
    const packet = createCompletePacket(30);
    packet.lumaCalendars = [];
    packet.pilotEventProof = [];
    packet.launchOwners = [];

    const readiness = getProductionRolloutBootstrapReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "Chapter 01 MEDLIFE needs a linked Luma calendar mapping.",
    );
    expect(readiness.blockers).toContain(
      "Add ready event-loop proof for at least 5 pilot chapters before inviting 30 chapters. Current ready pilot chapters: 0.",
    );
    expect(readiness.blockers).toContain(
      "Add an active support owner to launch-owners.csv.",
    );
    expect(readiness.blockers).toContain(
      "Add an active rollback owner to launch-owners.csv.",
    );
    expect(readiness.blockers).toContain(
      "Add an active production apply owner to launch-owners.csv.",
    );
  });

  it("does not count ready pilot proof until the chapter has a linked Luma calendar", () => {
    const packet = createCompletePacket(30);
    packet.lumaCalendars = packet.lumaCalendars?.map((calendar) =>
      calendar.chapterId === "chapter-01"
        ? { ...calendar, status: "needs_setup" }
        : calendar,
    );

    const readiness = getProductionRolloutBootstrapReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.counts.readyPilotEventProofChapters).toBe(4);
    expect(readiness.blockers).toContain(
      "Chapter 01 MEDLIFE needs a linked Luma calendar mapping.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs a linked Luma calendar mapping before proof can count as ready.",
    );
    expect(readiness.blockers).toContain(
      "Add ready event-loop proof for at least 5 pilot chapters before inviting 30 chapters. Current ready pilot chapters: 4.",
    );
  });

  it("blocks ready pilot proof that does not prove the whole event loop", () => {
    const packet = createCompletePacket(30);
    const pilotEventProof = packet.pilotEventProof ?? [];
    pilotEventProof[0] = {
      chapterId: "chapter-01",
      eventName: "Rush Month Kickoff",
      lumaEventId: "evt-chapter-01",
      rsvpCount: 0,
      attendanceCount: 0,
      pointsAwardedCount: 0,
      auditEvidence: "missing",
      outboxStatus: "sends_detected",
      status: "ready",
    };
    packet.pilotEventProof = pilotEventProof;

    const readiness = getProductionRolloutBootstrapReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs at least one RSVP.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs at least one attendance check-in.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs at least one points award.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs recorded audit evidence.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs zero external sends in the outbox.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs event route proof link.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 needs a reviewedByEmail owner.",
    );
  });

  it("blocks ready pilot proof with external proof links or unknown reviewers", () => {
    const packet = createCompletePacket(30);
    const pilotEventProof = packet.pilotEventProof ?? [];
    pilotEventProof[0] = {
      ...(pilotEventProof[0] ?? {
        chapterId: "chapter-01",
        eventName: "Rush Month Kickoff",
        lumaEventId: "evt-chapter-01",
        rsvpCount: 12,
        attendanceCount: 10,
        pointsAwardedCount: 10,
        auditEvidence: "recorded",
        outboxStatus: "zero_sends",
        status: "ready",
      }),
      eventRoute: "https://luma.com/evt-chapter-01",
      reviewedByEmail: "missing-reviewer@medlifemovement.org",
    };
    packet.pilotEventProof = pilotEventProof;

    const readiness = getProductionRolloutBootstrapReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 event route proof link must be an app route.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 reviewedByEmail references unknown user missing-reviewer@medlifemovement.org.",
    );
  });

  it("blocks ready pilot proof when attendance and points do not reconcile", () => {
    const packet = createCompletePacket(30);
    const pilotEventProof = packet.pilotEventProof ?? [];
    pilotEventProof[0] = {
      ...(pilotEventProof[0] ?? {
        chapterId: "chapter-01",
        eventName: "Rush Month Kickoff",
        lumaEventId: "evt-chapter-01",
        rsvpCount: 12,
        attendanceCount: 10,
        pointsAwardedCount: 10,
        auditEvidence: "recorded",
        outboxStatus: "zero_sends",
        status: "ready",
      }),
      rsvpCount: 8,
      attendanceCount: 10,
      pointsAwardedCount: 9,
    };
    packet.pilotEventProof = pilotEventProof;

    const readiness = getProductionRolloutBootstrapReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 attendanceCount cannot exceed rsvpCount until walk-in reconciliation is represented in the packet.",
    );
    expect(readiness.blockers).toContain(
      "chapter-01 pilot event evt-chapter-01 pointsAwardedCount must match attendanceCount so every checked-in attendee is reflected in the leaderboard.",
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
  const leaderUsers = chapters.map((chapter, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      email: `leader.${number}@medlifemovement.org`,
      displayName: `${chapter.name} Leader`,
    };
  });
  const memberUsers = Array.from({ length: Math.max(0, 500 - chapterCount) }, (_, index) => {
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
  };
}
