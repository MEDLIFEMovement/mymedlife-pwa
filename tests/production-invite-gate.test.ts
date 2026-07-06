import { describe, expect, it } from "vitest";
import {
  formatProductionInviteGateReadiness,
  getProductionInviteGateReadiness,
} from "@/services/production-invite-gate";
import type {
  ProductionCoreRouteSmokeResult,
} from "@/services/production-core-route-smoke";
import type {
  ProductionRolloutBootstrapPacket,
  ProductionRolloutBootstrapReadiness,
} from "@/services/production-rollout-bootstrap";
import type {
  ProductionRolloutHandoff,
} from "@/services/production-rollout-handoff";
import type {
  ProductionLiveDataReadiness,
} from "@/services/production-live-data-readiness";

describe("production invite gate", () => {
  it("passes when production route smoke, rollout packet, pilot proof, owners, and handoff are ready", () => {
    const readiness = getProductionInviteGateReadiness({
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      rolloutPacket: createReadyRolloutPacket(),
      rolloutReadiness: createReadyRolloutReadiness(),
      rolloutHandoff: createReadyRolloutHandoff(),
      liveDataReadiness: createReadyLiveDataReadiness(),
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.checks).toHaveLength(10);
    expect(readiness.checks.every((check) => check.passed)).toBe(true);
    expect(readiness.checks[0]).toEqual({
      key: "launch_lane_focus",
      label: "Events RSVP attendance points launch focus",
      passed: true,
      detail: "15 launch routes visible; 12 non-launch route families parked",
    });
    expect(readiness.nextSteps).toEqual([]);
    expect(formatProductionInviteGateReadiness(readiness)).toContain(
      "30-chapter invite gate: READY",
    );
  });

  it("fails clearly when the rollout packet has not been provided", () => {
    const readiness = getProductionInviteGateReadiness({
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      rolloutReadiness: null,
      rolloutHandoff: null,
      liveDataReadiness: createReadyLiveDataReadiness(),
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.checks).toContainEqual({
      key: "rollout_packet",
      label: "30-chapter rollout packet",
      passed: false,
      detail: "packet was not provided",
    });
    expect(readiness.nextSteps).toContain(
      "Fill and validate the real 30-chapter/500-student rollout packet.",
    );
    expect(formatProductionInviteGateReadiness(readiness)).toContain(
      "30-chapter invite gate: NOT READY",
    );
  });

  it("blocks broad invites when workspace access coverage is incomplete", () => {
    const rolloutReadiness = createReadyRolloutReadiness({
      ready: false,
      counts: {
        chaptersWithMemberWorkspaceAccess: 29,
        staffWorkspaceUsers: 0,
      },
      blockers: [
        "Add at least one active coach, admin, or super admin for staff command center access.",
      ],
    });

    const readiness = getProductionInviteGateReadiness({
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      rolloutPacket: createReadyRolloutPacket(),
      rolloutReadiness,
      rolloutHandoff: createReadyRolloutHandoff({ ready: false }),
      liveDataReadiness: createReadyLiveDataReadiness(),
    });
    const workspaceCheck = readiness.checks.find(
      (check) => check.key === "workspace_access",
    );

    expect(readiness.ready).toBe(false);
    expect(workspaceCheck).toEqual({
      key: "workspace_access",
      label: "Workspace access coverage",
      passed: false,
      detail:
        "29/30 chapters have member workspace access; 30/30 chapters have leader workspace access; 0 staff workspace user(s); 2 admin workspace user(s)",
    });
    expect(readiness.nextSteps).toContain(
      "Add member, leader, staff, and admin access coverage to the rollout packet.",
    );
  });

  it("blocks broad invites until five pilot chapters prove RSVP attendance points and audit safety", () => {
    const rolloutReadiness = createReadyRolloutReadiness({
      ready: false,
      counts: {
        readyPilotEventProofChapters: 4,
      },
      blockers: [
        "Add ready event-loop proof for at least 5 pilot chapters before inviting 30 chapters. Current ready pilot chapters: 4.",
        "chapter-01 pilot event evt-chapter-01 needs zero external sends in the outbox.",
      ],
    });

    const readiness = getProductionInviteGateReadiness({
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      rolloutPacket: createReadyRolloutPacket(),
      rolloutReadiness,
      rolloutHandoff: createReadyRolloutHandoff({ ready: false }),
      liveDataReadiness: createReadyLiveDataReadiness(),
    });
    const pilotCheck = readiness.checks.find(
      (check) => check.key === "pilot_event_loop",
    );

    expect(readiness.ready).toBe(false);
    expect(pilotCheck?.passed).toBe(false);
    expect(pilotCheck?.detail).toContain("4/5 ready pilot chapters");
    expect(readiness.nextSteps).toContain(
      "Complete the five-chapter Luma RSVP, attendance, points, audit, and outbox proof.",
    );
  });

  it("blocks broad invites until support rollback and production apply owners are named", () => {
    const rolloutReadiness = createReadyRolloutReadiness({
      ready: false,
      counts: {
        activeLaunchOwners: 2,
      },
      blockers: [
        "Add an active rollback owner to launch-owners.csv.",
        "Add an active production apply owner to launch-owners.csv.",
      ],
    });

    const readiness = getProductionInviteGateReadiness({
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      rolloutPacket: createReadyRolloutPacket(),
      rolloutReadiness,
      rolloutHandoff: createReadyRolloutHandoff({ ready: false }),
      liveDataReadiness: createReadyLiveDataReadiness(),
    });
    const ownerCheck = readiness.checks.find(
      (check) => check.key === "launch_owners",
    );

    expect(readiness.ready).toBe(false);
    expect(ownerCheck?.passed).toBe(false);
    expect(ownerCheck?.detail).toContain(
      "Add an active rollback owner to launch-owners.csv.",
    );
    expect(readiness.nextSteps).toContain(
      "Name active support, rollback, and production apply owners in launch-owners.csv.",
    );
  });

  it("blocks broad invites until launch owners have the role access needed to act", () => {
    const rolloutReadiness = createReadyRolloutReadiness({
      ready: false,
      blockers: [
        "Launch owner admin@medlifemovement.org (rollback) needs an active ds_admin or super_admin staff role.",
      ],
    });

    const readiness = getProductionInviteGateReadiness({
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      rolloutPacket: createReadyRolloutPacket(),
      rolloutReadiness,
      rolloutHandoff: createReadyRolloutHandoff({ ready: false }),
      liveDataReadiness: createReadyLiveDataReadiness(),
    });
    const ownerCheck = readiness.checks.find(
      (check) => check.key === "launch_owners",
    );

    expect(readiness.ready).toBe(false);
    expect(ownerCheck?.passed).toBe(false);
    expect(ownerCheck?.detail).toContain(
      "Launch owner admin@medlifemovement.org (rollback) needs an active ds_admin or super_admin staff role.",
    );
    expect(readiness.nextSteps).toContain(
      "Name active support, rollback, and production apply owners in launch-owners.csv.",
    );
  });

  it("blocks broad invites until signed-in role routing is proven", () => {
    const packet = createReadyRolloutPacket();
    packet.signedInRouteProof = [];

    const readiness = getProductionInviteGateReadiness({
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      rolloutPacket: packet,
      rolloutReadiness: createReadyRolloutReadiness(),
      rolloutHandoff: createReadyRolloutHandoff(),
      liveDataReadiness: createReadyLiveDataReadiness(),
    });
    const routeProofCheck = readiness.checks.find(
      (check) => check.key === "signed_in_route_proof",
    );

    expect(readiness.ready).toBe(false);
    expect(routeProofCheck?.passed).toBe(false);
    expect(routeProofCheck?.detail).toContain(
      "Launch Chapter 1 needs a passed signed-in member route proof",
    );
    expect(readiness.nextSteps).toContain(
      "Complete signed-in route proof for one member, leader, staff user, and admin after production data is applied.",
    );
  });

  it("blocks broad invites until production live data count proof is attached", () => {
    const readiness = getProductionInviteGateReadiness({
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      rolloutPacket: createReadyRolloutPacket(),
      rolloutReadiness: createReadyRolloutReadiness(),
      rolloutHandoff: createReadyRolloutHandoff(),
      liveDataReadiness: null,
    });
    const liveDataCheck = readiness.checks.find(
      (check) => check.key === "production_live_data",
    );

    expect(readiness.ready).toBe(false);
    expect(liveDataCheck).toEqual({
      key: "production_live_data",
      label: "Production live data count proof",
      passed: false,
      detail: "production live data count proof was not provided",
    });
    expect(readiness.nextSteps).toContain(
      "Run the production live data count check after the rollout packet is applied, then attach the count proof to the invite gate.",
    );
  });

  it("blocks broad invites when production live data trails the rollout packet", () => {
    const rolloutReadiness = createReadyRolloutReadiness({
      counts: {
        users: 525,
        approvedMemberships: 520,
      },
    });
    const readiness = getProductionInviteGateReadiness({
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      rolloutPacket: createReadyRolloutPacket(),
      rolloutReadiness,
      rolloutHandoff: createReadyRolloutHandoff(),
      liveDataReadiness: createReadyLiveDataReadiness(),
    });
    const liveDataCheck = readiness.checks.find(
      (check) => check.key === "production_live_data",
    );

    expect(readiness.ready).toBe(false);
    expect(liveDataCheck).toEqual({
      key: "production_live_data",
      label: "Production live data count proof",
      passed: false,
      detail:
        "production live data auth.users has 504 row(s); expected at least 525 from the rollout packet.; 2 more blocker(s)",
    });
    expect(readiness.nextSteps).toContain(
      "Run the production live data count check after the rollout packet is applied, then attach the count proof to the invite gate.",
    );
  });

  it("blocks broad invites until the invite batch plan is safe", () => {
    const packet = createReadyRolloutPacket();

    for (const index of [1, 2, 3, 4, 5, 6]) {
      packet.memberships.push({
        email: `extra-launch-${index}@medlifemovement.org`,
        chapterId: "chapter-01",
        roleKey: "general_member",
      });
      packet.users.push({
        email: `extra-launch-${index}@medlifemovement.org`,
        displayName: `Extra Launch ${index}`,
      });
    }

    const readiness = getProductionInviteGateReadiness({
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      rolloutPacket: packet,
      rolloutReadiness: createReadyRolloutReadiness({
        counts: {
          users: 510,
          approvedMemberships: 506,
          approvedStudentMemberships: 506,
        },
      }),
      rolloutHandoff: createReadyRolloutHandoff(),
      liveDataReadiness: createReadyLiveDataReadiness({
        counts: {
          "auth.users": 510,
          "app.profiles": 510,
          "app.memberships.approved": 506,
        },
      }),
      maxRecipientsPerBatch: 20,
    });
    const inviteBatchCheck = readiness.checks.find(
      (check) => check.key === "invite_batches",
    );

    expect(readiness.ready).toBe(false);
    expect(inviteBatchCheck?.passed).toBe(false);
    expect(inviteBatchCheck?.detail).toContain(
      "Launch Chapter 1 has 21 invitees, which exceeds the batch cap of 20",
    );
    expect(readiness.nextSteps).toContain(
      "Prepare safe invite batches with the five pilot-ready chapters first and no batch above the recipient cap.",
    );
  });
});

function createReadyRouteSmoke(): ProductionCoreRouteSmokeResult {
  return {
    ready: true,
    checks: [
      {
        label: "Login page returns HTTP 200",
        passed: true,
        detail: "received HTTP 200",
      },
      {
        label: "Student feed redirects unauthenticated users to login",
        passed: true,
        detail: "received HTTP 307",
      },
    ],
  };
}

function createReadyRolloutReadiness(
  overrides: {
    ready?: boolean;
    counts?: Partial<ProductionRolloutBootstrapReadiness["counts"]>;
    blockers?: string[];
  } = {},
): ProductionRolloutBootstrapReadiness {
  return {
    ready: overrides.ready ?? true,
    counts: {
      activeChapters: 30,
      users: 504,
      approvedMemberships: 500,
      activeStaffRoles: 4,
      activeCoachAssignments: 30,
      activeCampaigns: 30,
      approvedStudentMemberships: 500,
      linkedLumaCalendars: 30,
      readyPilotEventProofChapters: 5,
      activeLaunchOwners: 4,
      memberWorkspaceUsers: 500,
      leaderWorkspaceUsers: 30,
      staffWorkspaceUsers: 3,
      adminWorkspaceUsers: 2,
      chaptersWithMemberWorkspaceAccess: 30,
      chaptersWithLeaderWorkspaceAccess: 30,
      ...overrides.counts,
    },
    blockers: overrides.blockers ?? [],
    warnings: [],
    nextSteps: overrides.blockers?.length
      ? [
          "Fix the blockers in the rollout packet.",
          "Re-run the readiness check before creating production users or app data.",
        ]
      : [
          "Create Supabase Auth users through invite or approved admin flow.",
          "Insert matching profiles, chapters, memberships, staff roles, coach assignments, campaigns, and Luma calendar mappings.",
        ],
  };
}

function createReadyRolloutHandoff(
  overrides: { ready?: boolean } = {},
): ProductionRolloutHandoff {
  return {
    ready: overrides.ready ?? true,
    title: "Production rollout handoff: READY FOR HUMAN APPLY",
    summary:
      "30 chapters are ready for the first production data apply. This report is a review handoff only.",
    sections: [],
  };
}

function createReadyLiveDataReadiness(
  overrides: { counts?: Partial<ProductionLiveDataReadiness["counts"]> } = {},
): ProductionLiveDataReadiness {
  return {
    ready: true,
    minimumChapterCount: 30,
    minimumApprovedMembershipCount: 500,
    minimumPilotEventCount: 5,
    counts: {
      "auth.users": 504,
      "app.profiles": 504,
      "app.chapters.active": 30,
      "app.memberships.approved": 500,
      "app.staff_role_assignments.active": 4,
      "app.coach_chapter_assignments.active": 30,
      "app.campaigns.active": 30,
      "app.chapter_events": 5,
      "app.luma_event_links": 5,
      "app.assignments": 30,
      "app.points_events": 5,
      "app.audit_logs": 10,
      ...overrides.counts,
    },
    blockers: [],
    warnings: [],
    nextSteps: [
      "Run the rollout packet validator and signed-in role checks; this count check does not prove row-by-row ownership.",
    ],
  };
}

function createReadyRolloutPacket(): ProductionRolloutBootstrapPacket {
  const chapters = Array.from({ length: 30 }, (_, index) => {
    const chapterNumber = index + 1;

    return {
      id: `chapter-${String(chapterNumber).padStart(2, "0")}`,
      name: `Launch Chapter ${chapterNumber}`,
      campus: `Launch Campus ${chapterNumber}`,
    };
  });
  const users: ProductionRolloutBootstrapPacket["users"] = [];
  const memberships: ProductionRolloutBootstrapPacket["memberships"] = [];

  let studentNumber = 1;

  for (const [chapterIndex, chapter] of chapters.entries()) {
    const chapterStudentCount = chapterIndex < 5 ? 15 : 17;

    for (let memberIndex = 0; memberIndex < chapterStudentCount; memberIndex += 1) {
      const email = `launch-student-${String(studentNumber).padStart(3, "0")}@medlifemovement.org`;
      const isLeader = memberIndex === 0;

      users.push({
        email,
        displayName: isLeader
          ? `Launch Leader ${chapterIndex + 1}`
          : `Launch Member ${studentNumber}`,
      });
      memberships.push({
        email,
        chapterId: chapter.id,
        roleKey: isLeader ? "president_vp" : "general_member",
      });
      studentNumber += 1;
    }
  }

  users.push(
    {
      email: "launch-coach@medlifemovement.org",
      displayName: "Launch Coach",
    },
    {
      email: "launch-support@medlifemovement.org",
      displayName: "Launch Support",
    },
    {
      email: "launch-ds@medlifemovement.org",
      displayName: "Launch DS Admin",
    },
    {
      email: "launch-super@medlifemovement.org",
      displayName: "Launch Super Admin",
    },
  );
  const pilotChapterRouteProof = chapters.slice(0, 5).flatMap((chapter, index) => {
    const member = memberships.find(
      (membership) =>
        membership.chapterId === chapter.id &&
        membership.roleKey === "general_member",
    );
    const leader = memberships.find(
      (membership) =>
        membership.chapterId === chapter.id &&
        membership.roleKey === "president_vp",
    );

    if (!member || !leader) {
      throw new Error(`${chapter.id} missing member or leader route proof fixture.`);
    }

    return [
      {
        email: member.email,
        workspace: "student_app" as const,
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed" as const,
        checkedAt: `2026-07-05T15:${String(index).padStart(2, "0")}:00Z`,
      },
      {
        email: leader.email,
        workspace: "leader_command_center" as const,
        expectedPath: "/leader?view=overview",
        observedPath: "/leader?view=overview",
        status: "passed" as const,
        checkedAt: `2026-07-05T15:${String(index + 10).padStart(2, "0")}:00Z`,
      },
    ];
  });

  return {
    chapters,
    users,
    memberships,
    staffRoles: [
      { email: "launch-coach@medlifemovement.org", roleKey: "coach" },
      { email: "launch-support@medlifemovement.org", roleKey: "admin" },
      { email: "launch-ds@medlifemovement.org", roleKey: "ds_admin" },
      { email: "launch-super@medlifemovement.org", roleKey: "super_admin" },
    ],
    coachAssignments: chapters.map((chapter) => ({
      coachEmail: "launch-coach@medlifemovement.org",
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
      calendarName: `${chapter.name} Luma`,
    })),
    pilotEventProof: chapters.slice(0, 5).map((chapter, index) => ({
      chapterId: chapter.id,
      eventName: `${chapter.name} Kickoff`,
      lumaEventId: `evt-${chapter.id}`,
      rsvpCount: 10 + index,
      attendanceCount: 8 + index,
      pointsAwardedCount: 8 + index,
      auditEvidence: "recorded",
      outboxStatus: "zero_sends",
      status: "ready",
      eventRoute: `/app/events/evt-${chapter.id}`,
      attendanceRoute: `/leader?view=events&event=evt-${chapter.id}`,
      pointsRoute: "/app/points",
      auditRoute: "/admin/audit-log",
      outboxRoute: "/admin/integration-outbox",
      checkedAt: "2026-07-05T15:00:00Z",
      reviewedByEmail: "launch-coach@medlifemovement.org",
    })),
    launchOwners: [
      {
        email: "launch-support@medlifemovement.org",
        ownerType: "support",
      },
      {
        email: "launch-ds@medlifemovement.org",
        ownerType: "rollback",
      },
      {
        email: "launch-super@medlifemovement.org",
        ownerType: "production_apply",
      },
      {
        email: "launch-support@medlifemovement.org",
        ownerType: "launch_decision",
      },
    ],
    signedInRouteProof: [
      ...pilotChapterRouteProof,
      {
        email: "launch-coach@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-05T15:02:00Z",
      },
      {
        email: "launch-support@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-05T15:03:00Z",
      },
      {
        email: "launch-ds@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
        checkedAt: "2026-07-05T15:04:00Z",
      },
      {
        email: "launch-super@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
        checkedAt: "2026-07-05T15:05:00Z",
      },
    ],
  };
}
