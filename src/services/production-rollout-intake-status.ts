import {
  getProductionRolloutBootstrapReadiness,
  type ProductionRolloutBootstrapOptions,
  type ProductionRolloutBootstrapPacket,
} from "./production-rollout-bootstrap.ts";
import {
  getProductionSignedInRouteProofReadiness,
} from "./production-signed-in-route-proof.ts";

export type ProductionRolloutIntakeStatus = {
  ready: boolean;
  basePacketReady: boolean;
  pilotEventProofReady: boolean;
  signedInRouteProofReady: boolean;
  minimums: {
    chapters: number;
    approvedStudentMemberships: number;
    pilotChapters: number;
  };
  counts: {
    chapters: number;
    users: number;
    approvedMemberships: number;
    approvedStudentMemberships: number;
    activeStaffRoles: number;
    activeCoachAssignments: number;
    activeCampaigns: number;
    linkedLumaCalendars: number;
    readyPilotEventProofChapters: number;
    launchOwners: number;
    signedInRouteProofRows: number;
    passedSignedInRouteProofRows: number;
  };
  missingDataAsks: string[];
  nextSteps: string[];
};

export function getProductionRolloutIntakeStatus(
  packet: ProductionRolloutBootstrapPacket,
  options: ProductionRolloutBootstrapOptions = {},
): ProductionRolloutIntakeStatus {
  const minimums = {
    chapters: options.minimumChapterCount ?? 30,
    approvedStudentMemberships: options.minimumStudentMembershipCount ?? 500,
    pilotChapters: options.minimumPilotChapterCount ?? 5,
  };
  const rolloutReadiness = getProductionRolloutBootstrapReadiness(packet, options);
  const signedInRouteReadiness = getProductionSignedInRouteProofReadiness(packet);
  const pilotEventProofReady =
    rolloutReadiness.counts.readyPilotEventProofChapters >= minimums.pilotChapters &&
    !rolloutReadiness.blockers.some(isPilotEventProofBlocker);
  const launchOwners = (packet.launchOwners ?? []).filter(
    (owner) => (owner.status ?? "active") === "active",
  );
  const missingDataAsks = getMissingDataAsks({
    packet,
    minimums,
    rolloutCounts: rolloutReadiness.counts,
    pilotEventProofReady,
    signedInRouteProofReady: signedInRouteReadiness.ready,
    launchOwners,
  });

  return {
    ready: rolloutReadiness.ready && pilotEventProofReady,
    basePacketReady: rolloutReadiness.ready,
    pilotEventProofReady,
    signedInRouteProofReady: signedInRouteReadiness.ready,
    minimums,
    counts: {
      chapters: rolloutReadiness.counts.activeChapters,
      users: rolloutReadiness.counts.users,
      approvedMemberships: rolloutReadiness.counts.approvedMemberships,
      approvedStudentMemberships:
        rolloutReadiness.counts.approvedStudentMemberships,
      activeStaffRoles: rolloutReadiness.counts.activeStaffRoles,
      activeCoachAssignments: rolloutReadiness.counts.activeCoachAssignments,
      activeCampaigns: rolloutReadiness.counts.activeCampaigns,
      linkedLumaCalendars: rolloutReadiness.counts.linkedLumaCalendars,
      readyPilotEventProofChapters:
        rolloutReadiness.counts.readyPilotEventProofChapters,
      launchOwners: rolloutReadiness.counts.activeLaunchOwners,
      signedInRouteProofRows: signedInRouteReadiness.counts.proofRows,
      passedSignedInRouteProofRows:
        signedInRouteReadiness.counts.passedProofRows,
    },
    missingDataAsks,
    nextSteps:
      missingDataAsks.length === 0
        ? [
            "Build the JSON packet with pnpm rollout:build.",
            "Run pnpm rollout:check, pnpm rollout:handoff, and pnpm production:pilot-event-proof.",
            "After approved production apply, add signed-in route proof and run the final invite gate.",
          ]
        : [
            "Fill the missing CSV rows listed above.",
            "Run this intake status again before building the JSON packet.",
            "Do not create production users or send invitations from an incomplete intake packet.",
          ],
  };
}

export function formatProductionRolloutIntakeStatus(
  status: ProductionRolloutIntakeStatus,
): string {
  return [
    status.ready
      ? "Production rollout CSV intake: READY"
      : "Production rollout CSV intake: NOT READY",
    "",
    `Base packet readiness: ${status.basePacketReady ? "READY" : "NOT READY"}`,
    `Five-chapter pilot proof: ${status.pilotEventProofReady ? "READY" : "NOT READY"}`,
    `Signed-in route proof: ${status.signedInRouteProofReady ? "READY" : "NOT READY"}`,
    "",
    "Minimums:",
    `- active chapters: ${status.minimums.chapters}`,
    `- approved student/leader memberships: ${status.minimums.approvedStudentMemberships}`,
    `- pilot event-loop chapters: ${status.minimums.pilotChapters}`,
    "",
    "Current CSV counts:",
    `- active chapters: ${status.counts.chapters}`,
    `- users: ${status.counts.users}`,
    `- approved memberships: ${status.counts.approvedMemberships}`,
    `- approved student/leader users: ${status.counts.approvedStudentMemberships}`,
    `- active staff roles: ${status.counts.activeStaffRoles}`,
    `- active coach assignments: ${status.counts.activeCoachAssignments}`,
    `- active campaigns: ${status.counts.activeCampaigns}`,
    `- linked Luma calendars: ${status.counts.linkedLumaCalendars}`,
    `- ready pilot event-loop chapters: ${status.counts.readyPilotEventProofChapters}`,
    `- active launch owners: ${status.counts.launchOwners}`,
    `- signed-in route proof rows: ${status.counts.signedInRouteProofRows}`,
    `- passed signed-in route proof rows: ${status.counts.passedSignedInRouteProofRows}`,
    "",
    "Missing data asks:",
    ...formatList(status.missingDataAsks, "None"),
    "",
    "Next steps:",
    ...formatList(status.nextSteps, "None"),
  ].join("\n");
}

function getMissingDataAsks({
  packet,
  minimums,
  rolloutCounts,
  pilotEventProofReady,
  signedInRouteProofReady,
  launchOwners,
}: {
  packet: ProductionRolloutBootstrapPacket;
  minimums: ProductionRolloutIntakeStatus["minimums"];
  rolloutCounts: ReturnType<typeof getProductionRolloutBootstrapReadiness>["counts"];
  pilotEventProofReady: boolean;
  signedInRouteProofReady: boolean;
  launchOwners: NonNullable<ProductionRolloutBootstrapPacket["launchOwners"]>;
}) {
  const asks: string[] = [];

  addGapAsk(
    asks,
    rolloutCounts.activeChapters,
    minimums.chapters,
    "Add active chapter rows to chapters.csv.",
  );
  addGapAsk(
    asks,
    rolloutCounts.approvedStudentMemberships,
    minimums.approvedStudentMemberships,
    "Add approved student/leader membership rows to memberships.csv.",
  );

  if (packet.users.length === 0) {
    asks.push("Add launch users to users.csv.");
  }

  if (rolloutCounts.chaptersWithMemberWorkspaceAccess < rolloutCounts.activeChapters) {
    asks.push("Add at least one approved direct member for every active chapter.");
  }

  if (rolloutCounts.chaptersWithLeaderWorkspaceAccess < rolloutCounts.activeChapters) {
    asks.push("Add at least one approved chapter leader for every active chapter.");
  }

  if (rolloutCounts.activeCoachAssignments < rolloutCounts.activeChapters) {
    asks.push("Add one active coach assignment for every active chapter.");
  }

  if (rolloutCounts.activeCampaigns < rolloutCounts.activeChapters) {
    asks.push("Add one active launch campaign for every active chapter.");
  }

  if (rolloutCounts.linkedLumaCalendars < minimums.chapters) {
    asks.push(
      `Add one linked Luma calendar mapping for every launch chapter. Current: ${rolloutCounts.linkedLumaCalendars}; needed: ${minimums.chapters}.`,
    );
  }

  if (!pilotEventProofReady) {
    asks.push(
      `Add ready pilot-event-proof.csv rows for at least ${minimums.pilotChapters} chapters after RSVP, attendance, points, audit, and zero-send evidence is verified.`,
    );
  }

  if (rolloutCounts.staffWorkspaceUsers === 0) {
    asks.push("Add at least one active coach, admin, or super admin for staff access.");
  }

  if (rolloutCounts.adminWorkspaceUsers === 0) {
    asks.push("Add at least one active DS Admin or Super Admin for admin access.");
  }

  for (const ownerType of ["support", "rollback", "production_apply"] as const) {
    if (!launchOwners.some((owner) => owner.ownerType === ownerType)) {
      asks.push(`Add an active ${ownerType.replace("_", " ")} owner to launch-owners.csv.`);
    }
  }

  if (!signedInRouteProofReady) {
    asks.push(
      "After production users are applied, add passed signed-in route proof for one member, one leader, one staff user, and one admin.",
    );
  }

  return [...new Set(asks)];
}

function addGapAsk(
  asks: string[],
  current: number,
  minimum: number,
  message: string,
) {
  if (current >= minimum) {
    return;
  }

  asks.push(`${message} Current: ${current}; needed: ${minimum}.`);
}

function isPilotEventProofBlocker(blocker: string) {
  return (
    blocker.includes("pilot event") ||
    blocker.includes("event-loop proof") ||
    blocker.includes("RSVP") ||
    blocker.includes("attendance") ||
    blocker.includes("points award") ||
    blocker.includes("outbox")
  );
}

function formatList(items: string[], emptyLabel: string) {
  if (items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}
