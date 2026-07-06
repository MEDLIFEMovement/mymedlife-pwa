import {
  createProductionLumaRuntimeRegistryExport,
} from "./production-luma-mapping-readiness.ts";
import {
  getProductionInviteBatchReadiness,
} from "./production-invite-batches.ts";
import type {
  ProductionRolloutBootstrapOptions,
  ProductionRolloutBootstrapPacket,
} from "./production-rollout-bootstrap.ts";
import {
  formatProductionRolloutPreflight,
  getProductionRolloutPreflight,
  type ProductionRolloutPreflight,
} from "./production-rollout-preflight.ts";

export type ProductionRolloutRehearsalOptions =
  ProductionRolloutBootstrapOptions & {
    maxRecipientsPerBatch?: number;
  };

export type ProductionRolloutRehearsal = {
  ready: boolean;
  packet: ProductionRolloutBootstrapPacket;
  preflight: ProductionRolloutPreflight;
  runtimeMappingJson: string;
  counts: {
    chapters: number;
    studentLeaderInvitees: number;
    pilotReadyChapters: number;
    plannedBatches: number;
  };
};

export function getProductionRolloutRehearsal(
  options: ProductionRolloutRehearsalOptions = {},
): ProductionRolloutRehearsal {
  const packet = createProductionRolloutRehearsalPacket();
  const runtimeMappingJson =
    createProductionLumaRuntimeRegistryExport(packet, options).registryJson;
  const preflight = getProductionRolloutPreflight(packet, {
    ...options,
    allowSandboxTestData: true,
    runtimeMappingJson,
  });
  const inviteBatches = getProductionInviteBatchReadiness(packet, {
    ...options,
    allowSandboxTestData: true,
  });

  return {
    ready: preflight.ready,
    packet,
    preflight,
    runtimeMappingJson,
    counts: {
      chapters: packet.chapters.filter(
        (chapter) => (chapter.status ?? "active") === "active",
      ).length,
      studentLeaderInvitees: packet.memberships.filter(
        (membership) => (membership.status ?? "approved") === "approved",
      ).length,
      pilotReadyChapters: new Set(
        (packet.pilotEventProof ?? [])
          .filter((proof) => (proof.status ?? "ready") === "ready")
          .map((proof) => proof.chapterId),
      ).size,
      plannedBatches: inviteBatches.counts.plannedBatches,
    },
  };
}

export function formatProductionRolloutRehearsal(
  rehearsal: ProductionRolloutRehearsal,
) {
  const passedStages = rehearsal.preflight.stages.filter(
    (stage) => stage.ready,
  ).length;

  return [
    rehearsal.ready
      ? "30-chapter rollout rehearsal: READY"
      : "30-chapter rollout rehearsal: NOT READY",
    "",
    "Scope:",
    "- Uses generated Test data only.",
    "- Proves the rollout checks can handle the 30-chapter / 500-student shape.",
    "- Does not create users, write Supabase rows, call Luma, send invites, email students, trigger n8n, or change production config.",
    "- Does not write or approve `production-rollout-packet.json`.",
    "- Cannot be used as launch approval; real owner-returned CSV rows are still required.",
    "",
    "Target shape rehearsed:",
    `- active Test chapters: ${rehearsal.counts.chapters}`,
    `- approved Test student/leader invitees: ${rehearsal.counts.studentLeaderInvitees}`,
    `- Test pilot chapters with event-loop proof: ${rehearsal.counts.pilotReadyChapters}`,
    `- planned invite batches: ${rehearsal.counts.plannedBatches}`,
    `- preflight stages passed: ${passedStages}/${rehearsal.preflight.stages.length}`,
    "",
    "Safety result:",
    rehearsal.ready
      ? "- PASS: target-scale rehearsal checks are internally consistent."
      : "- FAIL: target-scale rehearsal checks exposed a tooling or fixture issue.",
    "- Real rollout remains blocked until owner recipients, real launch rows, production data counts, and final invite approval are complete.",
    "",
    "Detailed rehearsal preflight:",
    "",
    formatProductionRolloutPreflight(rehearsal.preflight),
  ].join("\n");
}

function createProductionRolloutRehearsalPacket(): ProductionRolloutBootstrapPacket {
  const chapters = Array.from({ length: 30 }, (_value, index) => {
    const number = formatTwoDigit(index + 1);

    return {
      id: `test-chapter-${number}`,
      name: `Test Chapter ${number} MEDLIFE`,
      campus: `Test Campus ${number}`,
      region: index % 2 === 0 ? "Test West" : "Test East",
      status: "active" as const,
    };
  });
  const staffUsers = [
    {
      email: "test.coach@medlifemovement.org",
      displayName: "Test Launch Coach",
    },
    {
      email: "test.admin@medlifemovement.org",
      displayName: "Test Launch Admin",
    },
    {
      email: "test.ds@medlifemovement.org",
      displayName: "Test DS Admin",
    },
  ];
  const leaderUsers = chapters.map((_chapter, index) => {
    const number = formatTwoDigit(index + 1);

    return {
      email: `test.leader.${number}@medlifemovement.org`,
      displayName: `Test Chapter ${number} Leader`,
    };
  });
  const memberUsers = Array.from({ length: 470 }, (_value, index) => {
    const number = formatThreeDigit(index + 1);

    return {
      email: `test.member.${number}@medlifemovement.org`,
      displayName: `Test Launch Member ${number}`,
    };
  });
  let memberIndex = 0;
  const memberships = [
    ...chapters.map((_chapter, index) => {
      const number = formatTwoDigit(index + 1);

      return {
        email: `test.leader.${number}@medlifemovement.org`,
        chapterId: `test-chapter-${number}`,
        roleKey: "president_vp" as const,
        status: "approved" as const,
      };
    }),
    ...chapters.flatMap((_chapter, index) =>
      Array.from({ length: getMemberCountForChapter(index) }, () => {
        memberIndex += 1;
        const memberNumber = formatThreeDigit(memberIndex);
        const chapterNumber = formatTwoDigit(index + 1);

        return {
          email: `test.member.${memberNumber}@medlifemovement.org`,
          chapterId: `test-chapter-${chapterNumber}`,
          roleKey: "general_member" as const,
          status: "approved" as const,
        };
      }),
    ),
  ];

  return {
    chapters,
    users: [...staffUsers, ...leaderUsers, ...memberUsers],
    memberships,
    staffRoles: [
      {
        email: "test.coach@medlifemovement.org",
        roleKey: "coach",
        status: "active",
      },
      {
        email: "test.admin@medlifemovement.org",
        roleKey: "admin",
        status: "active",
      },
      {
        email: "test.ds@medlifemovement.org",
        roleKey: "ds_admin",
        status: "active",
      },
    ],
    coachAssignments: chapters.map((chapter) => ({
      coachEmail: "test.coach@medlifemovement.org",
      chapterId: chapter.id,
      coachType: "portfolio",
      status: "active",
    })),
    campaigns: chapters.map((chapter, index) => {
      const number = formatTwoDigit(index + 1);

      return {
        chapterId: chapter.id,
        name: "Rush Month",
        slug: `test-rush-month-${number}`,
        status: "active",
      };
    }),
    lumaCalendars: chapters.map((chapter, index) => {
      const number = formatTwoDigit(index + 1);

      return {
        chapterId: chapter.id,
        calendarId: `cal-test-chapter-${number}`,
        calendarName: `${chapter.name} Calendar`,
        status: "linked",
      };
    }),
    pilotEventProof: chapters.slice(0, 5).map((chapter, index) => {
      const number = formatTwoDigit(index + 1);

      return {
        chapterId: chapter.id,
        eventName: "Test Rush Month Kickoff",
        lumaEventId: `evt-test-chapter-${number}`,
        rsvpCount: 12,
        attendanceCount: 10,
        pointsAwardedCount: 10,
        auditEvidence: "recorded",
        outboxStatus: "zero_sends",
        status: "ready",
        eventRoute: `/app/events/evt-test-chapter-${number}`,
        attendanceRoute: `/leader?view=events&event=evt-test-chapter-${number}`,
        pointsRoute: `/leader?view=leaderboard&chapter=${chapter.id}`,
        auditRoute: "/admin/audit-log",
        outboxRoute: "/admin/integration-outbox",
        checkedAt: "2026-07-06T12:00:00Z",
        reviewedByEmail: "test.admin@medlifemovement.org",
        notes: "Test rehearsal row only; not production approval.",
      };
    }),
    launchOwners: [
      {
        email: "test.admin@medlifemovement.org",
        ownerType: "support",
        displayName: "Test Launch Admin",
        status: "active",
      },
      {
        email: "test.ds@medlifemovement.org",
        ownerType: "rollback",
        displayName: "Test DS Admin",
        status: "active",
      },
      {
        email: "test.ds@medlifemovement.org",
        ownerType: "production_apply",
        displayName: "Test DS Admin",
        status: "active",
      },
      {
        email: "test.admin@medlifemovement.org",
        ownerType: "launch_decision",
        displayName: "Test Launch Admin",
        status: "active",
      },
    ],
    signedInRouteProof: [
      ...chapters.slice(0, 5).flatMap((_chapter, index) => {
        const chapterNumber = formatTwoDigit(index + 1);
        const memberNumber = formatThreeDigit(getFirstMemberNumberForChapter(index));

        return [
          {
            email: `test.member.${memberNumber}@medlifemovement.org`,
            workspace: "student_app" as const,
            expectedPath: "/app",
            observedPath: "/app",
            status: "passed" as const,
            checkedAt: `2026-07-06T12:${chapterNumber}:00Z`,
            notes: "Test rehearsal member route proof.",
          },
          {
            email: `test.leader.${chapterNumber}@medlifemovement.org`,
            workspace: "leader_command_center" as const,
            expectedPath: "/leader?view=overview",
            observedPath: "/leader?view=overview",
            status: "passed" as const,
            checkedAt: `2026-07-06T12:${formatTwoDigit(index + 6)}:00Z`,
            notes: "Test rehearsal leader route proof.",
          },
        ];
      }),
      {
        email: "test.coach@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-06T12:20:00Z",
        notes: "Test rehearsal staff route proof.",
      },
      {
        email: "test.admin@medlifemovement.org",
        workspace: "staff_command_center",
        expectedPath: "/staff?view=chapters",
        observedPath: "/staff?view=chapters",
        status: "passed",
        checkedAt: "2026-07-06T12:21:00Z",
        notes: "Test rehearsal support-owner route proof.",
      },
      {
        email: "test.ds@medlifemovement.org",
        workspace: "admin_backend",
        expectedPath: "/admin",
        observedPath: "/admin",
        status: "passed",
        checkedAt: "2026-07-06T12:22:00Z",
        notes: "Test rehearsal rollback and production-apply route proof.",
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

function getFirstMemberNumberForChapter(index: number) {
  let memberNumber = 1;

  for (let chapterIndex = 0; chapterIndex < index; chapterIndex += 1) {
    memberNumber += getMemberCountForChapter(chapterIndex);
  }

  return memberNumber;
}

function formatTwoDigit(value: number) {
  return String(value).padStart(2, "0");
}

function formatThreeDigit(value: number) {
  return String(value).padStart(3, "0");
}
