import { describe, expect, it } from "vitest";
import {
  formatProductionSignedInRouteProofGapReport,
  formatProductionSignedInRouteProofReadiness,
  getProductionSignedInRouteProofGapReport,
  getProductionSignedInRouteProofReadiness,
} from "@/services/production-signed-in-route-proof";
import type { ProductionRolloutBootstrapPacket } from "@/services/production-rollout-bootstrap";

describe("production signed-in route proof", () => {
  it("passes when one real account reaches each required workspace", () => {
    const readiness = getProductionSignedInRouteProofReadiness(createPacket());

    expect(readiness.ready).toBe(true);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.counts).toEqual({
      proofRows: 4,
      passedProofRows: 4,
      pilotChaptersRequiringProof: 0,
      pilotChaptersWithMemberProof: 0,
      pilotChaptersWithLeaderProof: 0,
      pilotChaptersWithMemberAndLeaderProof: 0,
    });
    expect(formatProductionSignedInRouteProofReadiness(readiness)).toContain(
      "Production signed-in route proof: READY",
    );
  });

  it("requires named launch owners to prove their own operating routes", () => {
    const packet = createPacket();
    packet.signedInRouteProof = packet.signedInRouteProof?.filter(
      (proof) =>
        proof.email !== "coach@medlifemovement.org" &&
        proof.email !== "ds@medlifemovement.org",
    );

    const readiness = getProductionSignedInRouteProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toEqual(
      expect.arrayContaining([
        "Launch owner coach@medlifemovement.org (support) needs passed signed-in proof for /staff?view=chapters.",
        "Launch owner ds@medlifemovement.org (rollback) needs passed signed-in proof for /admin.",
        "Launch owner ds@medlifemovement.org (production_apply) needs passed signed-in proof for /admin.",
      ]),
    );
  });

  it("blocks broad invites when signed-in route proof is missing", () => {
    const packet = createPacket();
    packet.signedInRouteProof = [];

    const readiness = getProductionSignedInRouteProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "General member lands in the student app: needs one passed proof row for approved general_member or action_committee_member at /app",
    );
    expect(formatProductionSignedInRouteProofReadiness(readiness)).toContain(
      "Production signed-in route proof: NOT READY",
    );
  });

  it("rejects passed proof rows when the user does not have the claimed role", () => {
    const packet = createPacket();
    packet.signedInRouteProof = [
      {
        email: "leader@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
      },
      ...(packet.signedInRouteProof ?? []).slice(1),
    ];

    const readiness = getProductionSignedInRouteProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "leader@medlifemovement.org student_app needs approved general_member or action_committee_member.",
    );
  });

  it("rejects passed proof rows when observed route does not match the expected workspace route", () => {
    const packet = createPacket();
    packet.signedInRouteProof = [
      {
        email: "member@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/leader?view=overview",
        status: "passed",
      },
      ...(packet.signedInRouteProof ?? []).slice(1),
    ];

    const readiness = getProductionSignedInRouteProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "member@medlifemovement.org student_app observedPath must be /app when status is passed.",
    );
  });

  it("requires timestamps for passed route proof rows", () => {
    const packet = createPacket();
    packet.signedInRouteProof = [
      {
        email: "member@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
      },
      ...(packet.signedInRouteProof ?? []).slice(1),
    ];

    const readiness = getProductionSignedInRouteProofReadiness(packet);

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "member@medlifemovement.org student_app needs a checkedAt timestamp when status is passed.",
    );
  });

  it("requires member and leader route proof for every ready pilot chapter", () => {
    const readiness = getProductionSignedInRouteProofReadiness(
      createPilotChapterPacket({
        includeSecondPilotLeaderProof: false,
      }),
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.counts).toMatchObject({
      pilotChaptersRequiringProof: 2,
      pilotChaptersWithMemberProof: 2,
      pilotChaptersWithLeaderProof: 1,
      pilotChaptersWithMemberAndLeaderProof: 1,
    });
    expect(readiness.blockers).toContain(
      "Chapter 02 MEDLIFE needs a passed signed-in leader route proof for /leader?view=overview before this pilot chapter can support broad invites.",
    );
    expect(formatProductionSignedInRouteProofReadiness(readiness)).toContain(
      "Pilot chapters with member and leader proof: 1/2",
    );
  });

  it("reports plain-English gaps by required proof class", () => {
    const packet = createPacket();
    packet.signedInRouteProof = [
      {
        email: "member@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
        checkedAt: "2026-07-05T15:00:00Z",
      },
      {
        email: "leader@medlifemovement.org",
        workspace: "leader_command_center",
        expectedPath: "/leader?view=overview",
        observedPath: "/app",
        status: "passed",
        checkedAt: "2026-07-05T15:01:00Z",
      },
      {
        email: "coach@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-05T15:02:00Z",
        notes: "Verified with preview-cookie role switch",
      },
    ];

    const report = getProductionSignedInRouteProofGapReport(packet);

    expect(report.ready).toBe(false);
    expect(report.gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "student_app",
          status: "present",
        }),
        expect.objectContaining({
          key: "leader_command_center",
          status: "wrong_path",
        }),
        expect.objectContaining({
          key: "staff_command_center",
          status: "unsafe_source",
        }),
        expect.objectContaining({
          key: "admin_backend",
          status: "missing",
        }),
      ]),
    );
    expect(formatProductionSignedInRouteProofGapReport(report)).toContain(
      "Production signed-in route proof gaps: OPEN",
    );
    expect(formatProductionSignedInRouteProofGapReport(report)).toContain(
      "Preview-cookie, local sandbox, Test/Figma/SOP sample, staging, fake screenshots, and missing-profile/setup-only sessions do not count as production signed-in proof.",
    );
  });

  it("reports clear when every required production proof class is present", () => {
    const report = getProductionSignedInRouteProofGapReport(createPacket());

    expect(report.ready).toBe(true);
    expect(report.gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "student_app",
          status: "present",
        }),
        expect.objectContaining({
          key: "leader_command_center",
          status: "present",
        }),
        expect.objectContaining({
          key: "staff_command_center",
          status: "present",
        }),
        expect.objectContaining({
          key: "admin_backend",
          status: "present",
        }),
      ]),
    );
    expect(formatProductionSignedInRouteProofGapReport(report)).toContain(
      "Production signed-in route proof gaps: CLEAR",
    );
  });

  it("reports not-enough-evidence and packet-missing cases honestly", () => {
    const packet = createPacket();
    packet.signedInRouteProof = [
      {
        email: "member@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
        checkedAt: "",
      },
      {
        email: "leader@medlifemovement.org",
        workspace: "leader_command_center",
        expectedPath: "/leader?view=overview",
        observedPath: "/leader?view=overview",
        status: "failed",
        checkedAt: "2026-07-05T15:01:00Z",
      },
      {
        email: "coach@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-05T15:02:00Z",
      },
      {
        email: "member@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
        checkedAt: "2026-07-05T15:03:00Z",
      },
    ];

    const report = getProductionSignedInRouteProofGapReport(packet);

    expect(report.ready).toBe(false);
    expect(report.gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "student_app",
          status: "not_enough_evidence",
          detail: "member@medlifemovement.org: checkedAt is missing",
        }),
        expect.objectContaining({
          key: "leader_command_center",
          status: "not_enough_evidence",
          detail: "leader@medlifemovement.org: status is failed",
        }),
        expect.objectContaining({
          key: "staff_command_center",
          status: "present",
        }),
        expect.objectContaining({
          key: "admin_backend",
          status: "not_enough_evidence",
          detail:
            "member@medlifemovement.org: email lacks active ds_admin or super_admin staff role",
        }),
      ]),
    );

    const missingPacketReport = getProductionSignedInRouteProofGapReport(null);

    expect(missingPacketReport.ready).toBe(false);
    expect(missingPacketReport.gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "student_app",
          status: "missing",
          detail: "packet was not provided",
        }),
      ]),
    );
  });

  it("passes pilot chapter route proof when every ready pilot chapter has member and leader access", () => {
    const readiness = getProductionSignedInRouteProofReadiness(
      createPilotChapterPacket({
        includeSecondPilotLeaderProof: true,
      }),
    );

    expect(readiness.ready).toBe(true);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.counts).toMatchObject({
      pilotChaptersRequiringProof: 2,
      pilotChaptersWithMemberProof: 2,
      pilotChaptersWithLeaderProof: 2,
      pilotChaptersWithMemberAndLeaderProof: 2,
    });
  });
});

function createPacket(): ProductionRolloutBootstrapPacket {
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
    launchOwners: [
      {
        email: "coach@medlifemovement.org",
        ownerType: "support",
        displayName: "Launch Coach",
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
      {
        email: "member@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
        checkedAt: "2026-07-05T15:00:00Z",
      },
      {
        email: "leader@medlifemovement.org",
        workspace: "leader_command_center",
        expectedPath: "/leader?view=overview",
        observedPath: "/leader?view=overview",
        status: "passed",
        checkedAt: "2026-07-05T15:01:00Z",
      },
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

function createPilotChapterPacket(input: {
  includeSecondPilotLeaderProof: boolean;
}): ProductionRolloutBootstrapPacket {
  const packet: ProductionRolloutBootstrapPacket = {
    chapters: [
      {
        id: "chapter-01",
        name: "Chapter 01 MEDLIFE",
        campus: "Campus 01",
      },
      {
        id: "chapter-02",
        name: "Chapter 02 MEDLIFE",
        campus: "Campus 02",
      },
    ],
    users: [
      { email: "member.01@medlifemovement.org", displayName: "Member 01" },
      { email: "leader.01@medlifemovement.org", displayName: "Leader 01" },
      { email: "member.02@medlifemovement.org", displayName: "Member 02" },
      { email: "leader.02@medlifemovement.org", displayName: "Leader 02" },
      { email: "coach@medlifemovement.org", displayName: "Launch Coach" },
      { email: "ds@medlifemovement.org", displayName: "DS Admin" },
    ],
    memberships: [
      {
        email: "member.01@medlifemovement.org",
        chapterId: "chapter-01",
        roleKey: "general_member",
      },
      {
        email: "leader.01@medlifemovement.org",
        chapterId: "chapter-01",
        roleKey: "president_vp",
      },
      {
        email: "member.02@medlifemovement.org",
        chapterId: "chapter-02",
        roleKey: "general_member",
      },
      {
        email: "leader.02@medlifemovement.org",
        chapterId: "chapter-02",
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
        chapterId: "chapter-01",
        coachType: "portfolio",
      },
      {
        coachEmail: "coach@medlifemovement.org",
        chapterId: "chapter-02",
        coachType: "portfolio",
      },
    ],
    campaigns: [
      {
        chapterId: "chapter-01",
        name: "Rush Month",
        slug: "rush-month-01",
      },
      {
        chapterId: "chapter-02",
        name: "Rush Month",
        slug: "rush-month-02",
      },
    ],
    pilotEventProof: [
      {
        chapterId: "chapter-01",
        eventName: "Rush Month Kickoff",
        lumaEventId: "evt-chapter-01",
        rsvpCount: 12,
        attendanceCount: 10,
        pointsAwardedCount: 10,
        auditEvidence: "recorded",
        outboxStatus: "zero_sends",
        status: "ready",
      },
      {
        chapterId: "chapter-02",
        eventName: "Rush Month Kickoff",
        lumaEventId: "evt-chapter-02",
        rsvpCount: 12,
        attendanceCount: 10,
        pointsAwardedCount: 10,
        auditEvidence: "recorded",
        outboxStatus: "zero_sends",
        status: "ready",
      },
    ],
    signedInRouteProof: [
      {
        email: "member.01@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
        checkedAt: "2026-07-05T15:00:00Z",
      },
      {
        email: "leader.01@medlifemovement.org",
        workspace: "leader_command_center",
        expectedPath: "/leader?view=overview",
        observedPath: "/leader?view=overview",
        status: "passed",
        checkedAt: "2026-07-05T15:01:00Z",
      },
      {
        email: "member.02@medlifemovement.org",
        workspace: "student_app",
        expectedPath: "/app",
        observedPath: "/app",
        status: "passed",
        checkedAt: "2026-07-05T15:02:00Z",
      },
      {
        email: "coach@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-05T15:03:00Z",
      },
      {
        email: "ds@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
        checkedAt: "2026-07-05T15:04:00Z",
      },
    ],
  };

  if (input.includeSecondPilotLeaderProof) {
    packet.signedInRouteProof?.push({
      email: "leader.02@medlifemovement.org",
      workspace: "leader_command_center",
      expectedPath: "/leader?view=overview",
      observedPath: "/leader?view=overview",
      status: "passed",
      checkedAt: "2026-07-05T15:05:00Z",
    });
  }

  return packet;
}
