import type {
  ProductionBootstrapLaunchOwner,
  ProductionBootstrapSignedInRouteProof,
  ProductionBootstrapStaffRole,
  ProductionRolloutBootstrapOptions,
  ProductionRolloutBootstrapPacket,
} from "./production-rollout-bootstrap.ts";
import {
  getProductionRolloutBootstrapReadiness,
} from "./production-rollout-bootstrap.ts";

export type ProductionRolloutChapterGap = {
  chapterId: string;
  chapterName: string;
  approvedMemberCount: number;
  approvedLeaderCount: number;
  hasCoachAssignment: boolean;
  hasActiveCampaign: boolean;
  hasLinkedLumaCalendar: boolean;
  hasReadyPilotEventProof: boolean;
  missing: string[];
};

export type ProductionRolloutGapReport = {
  ready: boolean;
  minimums: {
    chapters: number;
    studentInvitees: number;
    pilotChapters: number;
  };
  counts: {
    activeChapters: number;
    approvedStudentInvitees: number;
    readyPilotChapters: number;
    completeChapters: number;
    chaptersWithGaps: number;
  };
  minimumGaps: string[];
  chapterGaps: ProductionRolloutChapterGap[];
  ownerGaps: string[];
  signedInRouteProofGaps: string[];
  packetBlockers: string[];
  warnings: string[];
  nextSteps: string[];
};

const memberRoleKeys = new Set(["general_member", "action_committee_member"]);

const leaderRoleKeys = new Set([
  "action_committee_chair",
  "e_board_member",
  "president_vp",
]);

const inviteRoleKeys = new Set([
  "general_member",
  "action_committee_member",
  "action_committee_chair",
  "e_board_member",
  "president_vp",
]);

const requiredOwnerTypes: ProductionBootstrapLaunchOwner["ownerType"][] = [
  "support",
  "rollback",
  "production_apply",
];

const recommendedOwnerTypes: ProductionBootstrapLaunchOwner["ownerType"][] = [
  "launch_decision",
];

const ownerRolePolicies: Partial<
  Record<
    ProductionBootstrapLaunchOwner["ownerType"],
    {
      roleKeys: ReadonlySet<ProductionBootstrapStaffRole["roleKey"]>;
      detail: string;
    }
  >
> = {
  support: {
    roleKeys: new Set(["coach", "admin", "super_admin"]),
    detail: "an active coach, admin, or super_admin staff role",
  },
  rollback: {
    roleKeys: new Set(["ds_admin", "super_admin"]),
    detail: "an active ds_admin or super_admin staff role",
  },
  production_apply: {
    roleKeys: new Set(["ds_admin", "super_admin"]),
    detail: "an active ds_admin or super_admin staff role",
  },
};

const requiredRouteProof: Array<{
  workspace: ProductionBootstrapSignedInRouteProof["workspace"];
  label: string;
}> = [
  {
    workspace: "student_app",
    label: "one real member reaches /app",
  },
  {
    workspace: "leader_command_center",
    label: "one real student leader reaches /leader?view=overview",
  },
  {
    workspace: "staff_command_center",
    label: "one real staff or coach user reaches /staff?view=chapters",
  },
  {
    workspace: "admin_backend",
    label: "one real DS Admin or Super Admin reaches /admin",
  },
];

export function getProductionRolloutGapReport(
  packet: ProductionRolloutBootstrapPacket,
  options: ProductionRolloutBootstrapOptions = {},
): ProductionRolloutGapReport {
  const minimums = {
    chapters: options.minimumChapterCount ?? 30,
    studentInvitees: options.minimumStudentMembershipCount ?? 500,
    pilotChapters: options.minimumPilotChapterCount ?? 5,
  };
  const readiness = getProductionRolloutBootstrapReadiness(packet, {
    minimumChapterCount: minimums.chapters,
    minimumStudentMembershipCount: minimums.studentInvitees,
    minimumPilotChapterCount: minimums.pilotChapters,
  });
  const activeChapters = packet.chapters.filter(
    (chapter) => (chapter.status ?? "active") === "active",
  );
  const approvedMemberships = packet.memberships.filter(
    (membership) => (membership.status ?? "approved") === "approved",
  );
  const activeStaffRoles = packet.staffRoles.filter(
    (role) => (role.status ?? "active") === "active",
  );
  const activeCoachAssignments = packet.coachAssignments.filter(
    (assignment) => (assignment.status ?? "active") === "active",
  );
  const activeCampaigns = packet.campaigns.filter(
    (campaign) => (campaign.status ?? "active") === "active",
  );
  const linkedLumaCalendars = (packet.lumaCalendars ?? []).filter(
    (calendar) => (calendar.status ?? "linked") === "linked",
  );
  const readyPilotProof = (packet.pilotEventProof ?? []).filter(
    (proof) => (proof.status ?? "ready") === "ready",
  );
  const activeOwners = (packet.launchOwners ?? []).filter(
    (owner) => (owner.status ?? "active") === "active",
  );
  const passedRouteProof = (packet.signedInRouteProof ?? []).filter(
    (proof) => (proof.status ?? "not_checked") === "passed",
  );
  const approvedStudentInvitees = new Set(
    approvedMemberships
      .filter((membership) => inviteRoleKeys.has(membership.roleKey))
      .map((membership) => normalizeEmail(membership.email)),
  );
  const readyPilotChapterIds = new Set(readyPilotProof.map((proof) => proof.chapterId));
  const chapterGaps = activeChapters.map((chapter) =>
    getChapterGap({
      chapterId: chapter.id,
      chapterName: chapter.name,
      approvedMemberships,
      activeCoachAssignments,
      activeCampaigns,
      linkedLumaCalendars,
      readyPilotChapterIds,
    }),
  );
  const ownerGaps = getOwnerGaps(activeOwners, activeStaffRoles);
  const signedInRouteProofGaps = getSignedInRouteProofGaps(passedRouteProof);
  const minimumGaps = getMinimumGaps({
    activeChapters: activeChapters.length,
    approvedStudentInvitees: approvedStudentInvitees.size,
    readyPilotChapters: readyPilotChapterIds.size,
    minimums,
  });
  const warningItems = [
    ...readiness.warnings,
    ...getRecommendedOwnerWarnings(activeOwners),
  ];
  const blockers = [
    ...minimumGaps,
    ...chapterGaps.flatMap((gap) =>
      gap.missing.map((missing) => `${gap.chapterName}: ${missing}`),
    ),
    ...ownerGaps,
    ...signedInRouteProofGaps,
    ...readiness.blockers,
  ];
  const uniqueBlockers = [...new Set(blockers)];

  return {
    ready: uniqueBlockers.length === 0,
    minimums,
    counts: {
      activeChapters: activeChapters.length,
      approvedStudentInvitees: approvedStudentInvitees.size,
      readyPilotChapters: readyPilotChapterIds.size,
      completeChapters: chapterGaps.filter((gap) => gap.missing.length === 0).length,
      chaptersWithGaps: chapterGaps.filter((gap) => gap.missing.length > 0).length,
    },
    minimumGaps,
    chapterGaps: chapterGaps.filter((gap) => gap.missing.length > 0),
    ownerGaps,
    signedInRouteProofGaps,
    packetBlockers: readiness.blockers,
    warnings: [...new Set(warningItems)],
    nextSteps:
      uniqueBlockers.length === 0
        ? [
            "Run the production Luma mapping readiness check.",
            "Run the five-chapter event-loop proof check.",
            "Run the invite-batch and final invite-gate checks before sending invites.",
          ]
        : [
            "Fill the missing rows called out in this gap report.",
            "Rebuild the production rollout packet from the completed CSV folder.",
            "Re-run rollout:check, rollout:gaps, rollout:luma-mappings, production:pilot-event-proof, production:signed-in-route-proof, production:invite-batches, and production:invite-gate.",
          ],
  };
}

export function formatProductionRolloutGapReport(
  report: ProductionRolloutGapReport,
): string {
  return [
    report.ready
      ? "Production rollout packet gaps: READY"
      : "Production rollout packet gaps: NOT READY",
    "",
    "Minimums:",
    `- active chapters: ${report.minimums.chapters}`,
    `- student/leader invitees: ${report.minimums.studentInvitees}`,
    `- pilot-ready chapters: ${report.minimums.pilotChapters}`,
    "",
    "Counts:",
    `- active chapters: ${report.counts.activeChapters}`,
    `- student/leader invitees: ${report.counts.approvedStudentInvitees}`,
    `- pilot-ready chapters: ${report.counts.readyPilotChapters}`,
    `- complete chapters: ${report.counts.completeChapters}`,
    `- chapters with gaps: ${report.counts.chaptersWithGaps}`,
    "",
    "Chapter gaps:",
    ...formatChapterGaps(report.chapterGaps),
    "",
    "Minimum gaps:",
    ...formatList(report.minimumGaps, "None"),
    "",
    "Owner gaps:",
    ...formatList(report.ownerGaps, "None"),
    "",
    "Signed-in route proof gaps:",
    ...formatList(report.signedInRouteProofGaps, "None"),
    "",
    "Packet blockers:",
    ...formatList(report.packetBlockers, "None"),
    "",
    "Warnings:",
    ...formatList(report.warnings, "None"),
    "",
    "Next steps:",
    ...formatList(report.nextSteps, "None"),
  ].join("\n");
}

function getChapterGap(input: {
  chapterId: string;
  chapterName: string;
  approvedMemberships: ProductionRolloutBootstrapPacket["memberships"];
  activeCoachAssignments: ProductionRolloutBootstrapPacket["coachAssignments"];
  activeCampaigns: ProductionRolloutBootstrapPacket["campaigns"];
  linkedLumaCalendars: NonNullable<ProductionRolloutBootstrapPacket["lumaCalendars"]>;
  readyPilotChapterIds: Set<string>;
}): ProductionRolloutChapterGap {
  const chapterMemberships = input.approvedMemberships.filter(
    (membership) => membership.chapterId === input.chapterId,
  );
  const approvedMemberCount = chapterMemberships.filter((membership) =>
    memberRoleKeys.has(membership.roleKey),
  ).length;
  const approvedLeaderCount = chapterMemberships.filter((membership) =>
    leaderRoleKeys.has(membership.roleKey),
  ).length;
  const hasCoachAssignment = input.activeCoachAssignments.some(
    (assignment) => assignment.chapterId === input.chapterId,
  );
  const hasActiveCampaign = input.activeCampaigns.some(
    (campaign) => campaign.chapterId === input.chapterId,
  );
  const hasLinkedLumaCalendar = input.linkedLumaCalendars.some(
    (calendar) => calendar.chapterId === input.chapterId,
  );
  const hasReadyPilotEventProof = input.readyPilotChapterIds.has(input.chapterId);
  const missing = [
    approvedMemberCount > 0 ? null : "add at least one approved member",
    approvedLeaderCount > 0 ? null : "add at least one approved student leader",
    hasCoachAssignment ? null : "add an active coach assignment",
    hasActiveCampaign ? null : "add an active launch campaign",
    hasLinkedLumaCalendar ? null : "add a linked Luma calendar",
  ].filter((item): item is string => Boolean(item));

  return {
    chapterId: input.chapterId,
    chapterName: input.chapterName,
    approvedMemberCount,
    approvedLeaderCount,
    hasCoachAssignment,
    hasActiveCampaign,
    hasLinkedLumaCalendar,
    hasReadyPilotEventProof,
    missing,
  };
}

function getMinimumGaps(input: {
  activeChapters: number;
  approvedStudentInvitees: number;
  readyPilotChapters: number;
  minimums: ProductionRolloutGapReport["minimums"];
}) {
  const gaps: string[] = [];

  if (input.activeChapters < input.minimums.chapters) {
    gaps.push(
      `Add ${input.minimums.chapters - input.activeChapters} more active chapter row(s).`,
    );
  }

  if (input.approvedStudentInvitees < input.minimums.studentInvitees) {
    gaps.push(
      `Add ${input.minimums.studentInvitees - input.approvedStudentInvitees} more approved student/leader invitee(s).`,
    );
  }

  if (input.readyPilotChapters < input.minimums.pilotChapters) {
    gaps.push(
      `Add ${input.minimums.pilotChapters - input.readyPilotChapters} more ready pilot event proof chapter(s).`,
    );
  }

  return gaps;
}

function getOwnerGaps(
  owners: ProductionBootstrapLaunchOwner[],
  activeStaffRoles: ProductionBootstrapStaffRole[],
) {
  const missingOwnerGaps = requiredOwnerTypes
    .filter((ownerType) => !owners.some((owner) => owner.ownerType === ownerType))
    .map((ownerType) => `Add an active ${ownerType.replace("_", " ")} owner.`);
  const roleGaps = owners.flatMap((owner) => {
    const policy = ownerRolePolicies[owner.ownerType];

    if (!policy) {
      return [];
    }

    const ownerEmail = normalizeEmail(owner.email);
    const hasRequiredRole = activeStaffRoles.some(
      (role) =>
        normalizeEmail(role.email) === ownerEmail &&
        policy.roleKeys.has(role.roleKey),
    );

    return hasRequiredRole
      ? []
      : [
          `Launch owner ${owner.email} (${owner.ownerType}) needs ${policy.detail}.`,
        ];
  });

  return [...missingOwnerGaps, ...roleGaps];
}

function getRecommendedOwnerWarnings(owners: ProductionBootstrapLaunchOwner[]) {
  return recommendedOwnerTypes
    .filter((ownerType) => !owners.some((owner) => owner.ownerType === ownerType))
    .map((ownerType) => `Recommended: add an active ${ownerType.replace("_", " ")} owner.`);
}

function getSignedInRouteProofGaps(
  proofs: ProductionBootstrapSignedInRouteProof[],
) {
  return requiredRouteProof
    .filter(
      (required) => !proofs.some((proof) => proof.workspace === required.workspace),
    )
    .map((required) => `Record signed-in proof that ${required.label}.`);
}

function formatChapterGaps(chapterGaps: ProductionRolloutChapterGap[]) {
  if (chapterGaps.length === 0) {
    return ["- None"];
  }

  return chapterGaps.map((gap) => {
    const flags = [
      `members ${gap.approvedMemberCount}`,
      `leaders ${gap.approvedLeaderCount}`,
      gap.hasCoachAssignment ? "coach yes" : "coach no",
      gap.hasActiveCampaign ? "campaign yes" : "campaign no",
      gap.hasLinkedLumaCalendar ? "Luma yes" : "Luma no",
      gap.hasReadyPilotEventProof ? "pilot proof yes" : "pilot proof no",
    ].join("; ");

    return `- ${gap.chapterName} (${gap.chapterId}): ${gap.missing.join(", ")} [${flags}]`;
  });
}

function formatList(items: string[], fallback: string) {
  return items.length > 0 ? items.map((item) => `- ${item}`) : [`- ${fallback}`];
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
