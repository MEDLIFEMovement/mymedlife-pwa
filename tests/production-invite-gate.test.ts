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

describe("production invite gate", () => {
  it("passes when production route smoke, rollout packet, pilot proof, owners, and handoff are ready", () => {
    const readiness = getProductionInviteGateReadiness({
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      rolloutPacket: createReadyRolloutPacket(),
      rolloutReadiness: createReadyRolloutReadiness(),
      rolloutHandoff: createReadyRolloutHandoff(),
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.checks).toHaveLength(8);
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
        "29/30 chapters have member workspace access; 30/30 chapters have leader workspace access; 0 staff workspace user(s); 1 admin workspace user(s)",
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

  it("blocks broad invites until signed-in role routing is proven", () => {
    const packet = createReadyRolloutPacket();
    packet.signedInRouteProof = [];

    const readiness = getProductionInviteGateReadiness({
      publicUrl: "https://www.mymedlife.org",
      routeSmoke: createReadyRouteSmoke(),
      rolloutPacket: packet,
      rolloutReadiness: createReadyRolloutReadiness(),
      rolloutHandoff: createReadyRolloutHandoff(),
    });
    const routeProofCheck = readiness.checks.find(
      (check) => check.key === "signed_in_route_proof",
    );

    expect(readiness.ready).toBe(false);
    expect(routeProofCheck?.passed).toBe(false);
    expect(routeProofCheck?.detail).toContain(
      "General member lands in the student app",
    );
    expect(readiness.nextSteps).toContain(
      "Complete signed-in route proof for one member, leader, staff user, and admin after production data is applied.",
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
      users: 503,
      approvedMemberships: 500,
      activeStaffRoles: 3,
      activeCoachAssignments: 30,
      activeCampaigns: 30,
      approvedStudentMemberships: 500,
      linkedLumaCalendars: 30,
      readyPilotEventProofChapters: 5,
      activeLaunchOwners: 4,
      memberWorkspaceUsers: 500,
      leaderWorkspaceUsers: 30,
      staffWorkspaceUsers: 2,
      adminWorkspaceUsers: 1,
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

function createReadyRolloutPacket(): ProductionRolloutBootstrapPacket {
  return {
    chapters: [
      {
        id: "chapter-ucla",
        name: "UCLA MEDLIFE",
        campus: "UCLA",
      },
    ],
    users: [
      { email: "member@medlifemovement.org", displayName: "Launch Member" },
      { email: "leader@medlifemovement.org", displayName: "Launch Leader" },
      { email: "coach@medlifemovement.org", displayName: "Launch Coach" },
      { email: "ds@medlifemovement.org", displayName: "DS Admin" },
    ],
    memberships: [
      {
        email: "member@medlifemovement.org",
        chapterId: "chapter-ucla",
        roleKey: "general_member",
      },
      {
        email: "leader@medlifemovement.org",
        chapterId: "chapter-ucla",
        roleKey: "president_vp",
      },
    ],
    staffRoles: [
      { email: "coach@medlifemovement.org", roleKey: "coach" },
      { email: "ds@medlifemovement.org", roleKey: "ds_admin" },
    ],
    coachAssignments: [
      {
        coachEmail: "coach@medlifemovement.org",
        chapterId: "chapter-ucla",
        coachType: "portfolio",
      },
    ],
    campaigns: [
      {
        chapterId: "chapter-ucla",
        name: "Rush Month",
        slug: "rush-month-ucla",
      },
    ],
    signedInRouteProof: [
      {
        email: "member@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
      },
      {
        email: "leader@medlifemovement.org",
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
