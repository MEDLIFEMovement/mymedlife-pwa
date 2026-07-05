import type {
  ProductionBootstrapMembership,
  ProductionBootstrapSignedInRouteProof,
  ProductionRolloutBootstrapOptions,
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

export type ProductionRolloutChapterMatrixRow = {
  chapterId: string;
  chapterName: string;
  inviteeCount: number;
  hasMemberAccess: boolean;
  hasLeaderAccess: boolean;
  hasCoachAssignment: boolean;
  hasActiveCampaign: boolean;
  hasLinkedLumaCalendar: boolean;
  hasReadyPilotEventProof: boolean;
  hasMemberRouteProof: boolean;
  hasLeaderRouteProof: boolean;
  coreReady: boolean;
  finalProofReady: boolean;
  blockers: string[];
};

export type ProductionRolloutChapterMatrix = {
  ready: boolean;
  minimums: {
    chapters: number;
    pilotChapters: number;
  };
  counts: {
    activeChapters: number;
    coreReadyChapters: number;
    linkedLumaChapters: number;
    readyPilotEventProofChapters: number;
    pilotChaptersWithMemberAndLeaderRouteProof: number;
    approvedStudentLeaderInvitees: number;
  };
  rows: ProductionRolloutChapterMatrixRow[];
  blockers: string[];
  nextSteps: string[];
};

const directMemberRoleKeys: readonly ProductionBootstrapMembership["roleKey"][] = [
  "general_member",
  "action_committee_member",
];

const leaderRoleKeys: readonly ProductionBootstrapMembership["roleKey"][] = [
  "action_committee_chair",
  "e_board_member",
  "president_vp",
];

const inviteRoleKeys: readonly ProductionBootstrapMembership["roleKey"][] = [
  ...directMemberRoleKeys,
  ...leaderRoleKeys,
];

export function getProductionRolloutChapterMatrix(
  packet: ProductionRolloutBootstrapPacket,
  options: Pick<
    ProductionRolloutBootstrapOptions,
    "minimumChapterCount" | "minimumPilotChapterCount"
  > = {},
): ProductionRolloutChapterMatrix {
  const minimums = {
    chapters: options.minimumChapterCount ?? 30,
    pilotChapters: options.minimumPilotChapterCount ?? 5,
  };
  const activeChapters = packet.chapters.filter(
    (chapter) => (chapter.status ?? "active") === "active",
  );
  const rows = activeChapters
    .map((chapter) => createChapterMatrixRow(packet, chapter.id, chapter.name))
    .sort((a, b) => a.chapterName.localeCompare(b.chapterName));
  const approvedStudentLeaderInvitees = new Set(
    packet.memberships
      .filter(
        (membership) =>
          (membership.status ?? "approved") === "approved" &&
          inviteRoleKeys.includes(membership.roleKey),
      )
      .map((membership) => normalizeEmail(membership.email)),
  ).size;
  const linkedLumaChapters = rows.filter((row) => row.hasLinkedLumaCalendar).length;
  const readyPilotRows = rows.filter((row) => row.hasReadyPilotEventProof);
  const pilotRowsWithRouteProof = readyPilotRows.filter(
    (row) => row.hasMemberRouteProof && row.hasLeaderRouteProof,
  );
  const blockers = [
    ...getMatrixCountBlockers({
      activeChapterCount: activeChapters.length,
      minimumChapterCount: minimums.chapters,
      readyPilotEventProofCount: readyPilotRows.length,
      minimumPilotChapterCount: minimums.pilotChapters,
      pilotRowsWithRouteProofCount: pilotRowsWithRouteProof.length,
    }),
    ...rows.flatMap((row) =>
      row.blockers.map((blocker) => `${row.chapterName}: ${blocker}`),
    ),
  ];

  return {
    ready: blockers.length === 0,
    minimums,
    counts: {
      activeChapters: activeChapters.length,
      coreReadyChapters: rows.filter((row) => row.coreReady).length,
      linkedLumaChapters,
      readyPilotEventProofChapters: readyPilotRows.length,
      pilotChaptersWithMemberAndLeaderRouteProof: pilotRowsWithRouteProof.length,
      approvedStudentLeaderInvitees,
    },
    rows,
    blockers: [...new Set(blockers)],
    nextSteps:
      blockers.length === 0
        ? [
            "Build the production rollout packet and run the final invite gates.",
            "Review batch 1 with the support and rollback owners before sending invitations.",
          ]
        : [
            "Fill the missing chapter rows shown in this matrix.",
            "Re-run the matrix before building the production rollout packet.",
            "Do not invite students from a chapter with missing member, leader, coach, campaign, Luma, pilot proof, or route-proof data.",
          ],
  };
}

export function formatProductionRolloutChapterMatrix(
  matrix: ProductionRolloutChapterMatrix,
): string {
  return [
    matrix.ready
      ? "Production rollout chapter matrix: READY"
      : "Production rollout chapter matrix: NOT READY",
    "",
    "Minimums:",
    `- active chapters: ${matrix.minimums.chapters}`,
    `- pilot event-loop chapters: ${matrix.minimums.pilotChapters}`,
    "",
    "Counts:",
    `- active chapters: ${matrix.counts.activeChapters}`,
    `- core-ready chapters: ${matrix.counts.coreReadyChapters}/${matrix.counts.activeChapters}`,
    `- linked Luma chapters: ${matrix.counts.linkedLumaChapters}/${matrix.counts.activeChapters}`,
    `- ready pilot event-loop chapters: ${matrix.counts.readyPilotEventProofChapters}`,
    `- pilot chapters with member and leader route proof: ${matrix.counts.pilotChaptersWithMemberAndLeaderRouteProof}/${matrix.counts.readyPilotEventProofChapters}`,
    `- approved student/leader invitees: ${matrix.counts.approvedStudentLeaderInvitees}`,
    "",
    "Chapter matrix:",
    ...formatChapterRows(matrix.rows),
    "",
    "Blockers:",
    ...formatList(matrix.blockers, "None"),
    "",
    "Next steps:",
    ...formatList(matrix.nextSteps, "None"),
  ].join("\n");
}

function createChapterMatrixRow(
  packet: ProductionRolloutBootstrapPacket,
  chapterId: string,
  chapterName: string,
): ProductionRolloutChapterMatrixRow {
  const approvedMemberships = packet.memberships.filter(
    (membership) =>
      membership.chapterId === chapterId &&
      (membership.status ?? "approved") === "approved",
  );
  const inviteeCount = new Set(
    approvedMemberships
      .filter((membership) => inviteRoleKeys.includes(membership.roleKey))
      .map((membership) => normalizeEmail(membership.email)),
  ).size;
  const hasMemberAccess = approvedMemberships.some((membership) =>
    directMemberRoleKeys.includes(membership.roleKey),
  );
  const hasLeaderAccess = approvedMemberships.some((membership) =>
    leaderRoleKeys.includes(membership.roleKey),
  );
  const hasCoachAssignment = packet.coachAssignments.some(
    (assignment) =>
      assignment.chapterId === chapterId &&
      (assignment.status ?? "active") === "active",
  );
  const hasActiveCampaign = packet.campaigns.some(
    (campaign) =>
      campaign.chapterId === chapterId &&
      (campaign.status ?? "active") === "active",
  );
  const hasLinkedLumaCalendar = (packet.lumaCalendars ?? []).some(
    (calendar) =>
      calendar.chapterId === chapterId &&
      (calendar.status ?? "linked") === "linked",
  );
  const hasReadyPilotEventProof = (packet.pilotEventProof ?? []).some(
    (proof) => proof.chapterId === chapterId && (proof.status ?? "ready") === "ready",
  );
  const hasMemberRouteProof = hasPassedChapterRouteProof({
    packet,
    chapterId,
    roleKeys: directMemberRoleKeys,
    workspace: "student_app",
    expectedPath: "/app",
  });
  const hasLeaderRouteProof = hasPassedChapterRouteProof({
    packet,
    chapterId,
    roleKeys: leaderRoleKeys,
    workspace: "leader_command_center",
    expectedPath: "/leader?view=overview",
  });
  const blockers = getChapterBlockers({
    hasMemberAccess,
    hasLeaderAccess,
    hasCoachAssignment,
    hasActiveCampaign,
    hasLinkedLumaCalendar,
    hasReadyPilotEventProof,
    hasMemberRouteProof,
    hasLeaderRouteProof,
  });
  const coreReady =
    hasMemberAccess &&
    hasLeaderAccess &&
    hasCoachAssignment &&
    hasActiveCampaign &&
    hasLinkedLumaCalendar;
  const finalProofReady =
    !hasReadyPilotEventProof || (hasMemberRouteProof && hasLeaderRouteProof);

  return {
    chapterId,
    chapterName,
    inviteeCount,
    hasMemberAccess,
    hasLeaderAccess,
    hasCoachAssignment,
    hasActiveCampaign,
    hasLinkedLumaCalendar,
    hasReadyPilotEventProof,
    hasMemberRouteProof,
    hasLeaderRouteProof,
    coreReady,
    finalProofReady,
    blockers,
  };
}

function getMatrixCountBlockers(input: {
  activeChapterCount: number;
  minimumChapterCount: number;
  readyPilotEventProofCount: number;
  minimumPilotChapterCount: number;
  pilotRowsWithRouteProofCount: number;
}) {
  const blockers: string[] = [];

  if (input.activeChapterCount < input.minimumChapterCount) {
    blockers.push(
      `Add ${input.minimumChapterCount - input.activeChapterCount} more active chapter row(s).`,
    );
  }

  if (input.readyPilotEventProofCount < input.minimumPilotChapterCount) {
    blockers.push(
      `Add ready pilot event-loop proof for ${input.minimumPilotChapterCount - input.readyPilotEventProofCount} more chapter(s).`,
    );
  }

  if (
    input.readyPilotEventProofCount > 0 &&
    input.pilotRowsWithRouteProofCount < input.readyPilotEventProofCount
  ) {
    blockers.push(
      "Every ready pilot chapter needs passed member and leader signed-in route proof before broad invites.",
    );
  }

  return blockers;
}

function getChapterBlockers(input: {
  hasMemberAccess: boolean;
  hasLeaderAccess: boolean;
  hasCoachAssignment: boolean;
  hasActiveCampaign: boolean;
  hasLinkedLumaCalendar: boolean;
  hasReadyPilotEventProof: boolean;
  hasMemberRouteProof: boolean;
  hasLeaderRouteProof: boolean;
}) {
  const blockers: string[] = [];

  if (!input.hasMemberAccess) {
    blockers.push("add an approved general member or action committee member");
  }

  if (!input.hasLeaderAccess) {
    blockers.push("add an approved chapter leader");
  }

  if (!input.hasCoachAssignment) {
    blockers.push("add an active coach assignment");
  }

  if (!input.hasActiveCampaign) {
    blockers.push("add an active launch campaign");
  }

  if (!input.hasLinkedLumaCalendar) {
    blockers.push("add a linked Luma calendar mapping");
  }

  if (input.hasReadyPilotEventProof && !input.hasMemberRouteProof) {
    blockers.push("add passed signed-in member route proof for /app");
  }

  if (input.hasReadyPilotEventProof && !input.hasLeaderRouteProof) {
    blockers.push(
      "add passed signed-in leader route proof for /leader?view=overview",
    );
  }

  return blockers;
}

function hasPassedChapterRouteProof(input: {
  packet: ProductionRolloutBootstrapPacket;
  chapterId: string;
  roleKeys: readonly ProductionBootstrapMembership["roleKey"][];
  workspace: ProductionBootstrapSignedInRouteProof["workspace"];
  expectedPath: string;
}) {
  const chapterEmails = new Set(
    input.packet.memberships
      .filter(
        (membership) =>
          membership.chapterId === input.chapterId &&
          (membership.status ?? "approved") === "approved" &&
          input.roleKeys.includes(membership.roleKey),
      )
      .map((membership) => normalizeEmail(membership.email)),
  );

  return (input.packet.signedInRouteProof ?? []).some(
    (proof) =>
      chapterEmails.has(normalizeEmail(proof.email)) &&
      proof.workspace === input.workspace &&
      proof.status === "passed" &&
      proof.expectedPath === input.expectedPath &&
      proof.observedPath === input.expectedPath &&
      isValidCheckedAt(proof.checkedAt),
  );
}

function formatChapterRows(rows: ProductionRolloutChapterMatrixRow[]) {
  if (rows.length === 0) {
    return ["- No active chapters in the packet."];
  }

  return [
    "| Chapter | Invitees | Member | Leader | Coach | Campaign | Luma | Pilot proof | Route proof | Status |",
    "| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map((row) =>
      [
        row.chapterName,
        String(row.inviteeCount),
        formatPass(row.hasMemberAccess),
        formatPass(row.hasLeaderAccess),
        formatPass(row.hasCoachAssignment),
        formatPass(row.hasActiveCampaign),
        formatPass(row.hasLinkedLumaCalendar),
        formatPass(row.hasReadyPilotEventProof),
        row.hasReadyPilotEventProof
          ? formatPass(row.hasMemberRouteProof && row.hasLeaderRouteProof)
          : "not required yet",
        row.blockers.length === 0 ? "ready" : "needs data",
      ].join(" | "),
    ).map((row) => `| ${row} |`),
  ];
}

function formatPass(value: boolean) {
  return value ? "pass" : "missing";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidCheckedAt(value: string | undefined) {
  return Boolean(value?.trim()) && Number.isFinite(Date.parse(value ?? ""));
}

function formatList(items: string[], emptyLabel: string) {
  if (items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}
