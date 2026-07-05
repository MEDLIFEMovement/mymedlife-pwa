import type {
  ProductionBootstrapLaunchOwner,
  ProductionBootstrapMembership,
  ProductionBootstrapSignedInRouteProof,
  ProductionBootstrapStaffRole,
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

export type ProductionSignedInRouteProofCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type ProductionSignedInRouteProofReadiness = {
  ready: boolean;
  checks: ProductionSignedInRouteProofCheck[];
  blockers: string[];
  counts: {
    proofRows: number;
    passedProofRows: number;
    pilotChaptersRequiringProof: number;
    pilotChaptersWithMemberProof: number;
    pilotChaptersWithLeaderProof: number;
    pilotChaptersWithMemberAndLeaderProof: number;
  };
};

type RequiredRouteProof = {
  key: ProductionBootstrapSignedInRouteProof["workspace"];
  label: string;
  expectedPath: string;
  hasRequiredRole: (
    email: string,
    packet: ProductionRolloutBootstrapPacket,
  ) => boolean;
  roleDetail: string;
};

const requiredRouteProofs: RequiredRouteProof[] = [
  {
    key: "student_app",
    label: "General member lands in the student app",
    expectedPath: "/app",
    hasRequiredRole: hasApprovedDirectMemberRole,
    roleDetail: "approved general_member or action_committee_member",
  },
  {
    key: "leader_command_center",
    label: "Student leader lands in the command center",
    expectedPath: "/leader?view=overview",
    hasRequiredRole: hasApprovedLeaderRole,
    roleDetail: "approved action_committee_chair, e_board_member, or president_vp",
  },
  {
    key: "staff_command_center",
    label: "Staff or coach lands in the staff command center",
    expectedPath: "/staff?view=chapters",
    hasRequiredRole: hasActiveStaffWorkspaceRole,
    roleDetail: "active coach, admin, or super_admin staff role",
  },
  {
    key: "admin_backend",
    label: "DS Admin or Super Admin lands in the admin backend",
    expectedPath: "/admin",
    hasRequiredRole: hasActiveAdminRole,
    roleDetail: "active ds_admin or super_admin staff role",
  },
];

const directMemberRoles: readonly ProductionBootstrapMembership["roleKey"][] = [
  "general_member",
  "action_committee_member",
];

const leaderRoles: readonly ProductionBootstrapMembership["roleKey"][] = [
  "action_committee_chair",
  "e_board_member",
  "president_vp",
];

const staffWorkspaceRoles: readonly ProductionBootstrapStaffRole["roleKey"][] = [
  "coach",
  "admin",
  "super_admin",
];

const adminRoles: readonly ProductionBootstrapStaffRole["roleKey"][] = [
  "ds_admin",
  "super_admin",
];

const launchOwnerRouteProofRequirements: Array<{
  ownerType: ProductionBootstrapLaunchOwner["ownerType"];
  workspace: ProductionBootstrapSignedInRouteProof["workspace"];
  expectedPath: string;
}> = [
  {
    ownerType: "support",
    workspace: "staff_command_center",
    expectedPath: "/staff?view=chapters",
  },
  {
    ownerType: "rollback",
    workspace: "admin_backend",
    expectedPath: "/admin",
  },
  {
    ownerType: "production_apply",
    workspace: "admin_backend",
    expectedPath: "/admin",
  },
];

export function getProductionSignedInRouteProofReadiness(
  packet: ProductionRolloutBootstrapPacket | null,
): ProductionSignedInRouteProofReadiness {
  if (!packet) {
    return {
      ready: false,
      checks: requiredRouteProofs.map((required) => ({
        key: required.key,
        label: required.label,
        passed: false,
        detail: "packet was not provided",
      })),
      blockers: [
        "Add signed-in route proof after production users and app rows are applied.",
      ],
      counts: {
        proofRows: 0,
        passedProofRows: 0,
        pilotChaptersRequiringProof: 0,
        pilotChaptersWithMemberProof: 0,
        pilotChaptersWithLeaderProof: 0,
        pilotChaptersWithMemberAndLeaderProof: 0,
      },
    };
  }

  const proofRows = packet.signedInRouteProof ?? [];
  const rowBlockers = getRouteProofRowBlockers(packet, proofRows);
  const pilotChapterProof = getPilotChapterRouteProof(packet, proofRows);
  const launchOwnerProofBlockers = getLaunchOwnerRouteProofBlockers(
    packet,
    proofRows,
  );
  const checks = requiredRouteProofs.map((required) =>
    createRequiredRouteProofCheck(packet, proofRows, required),
  );
  const blockers = [
    ...rowBlockers,
    ...pilotChapterProof.blockers,
    ...launchOwnerProofBlockers,
    ...checks
      .filter((check) => !check.passed)
      .map((check) => `${check.label}: ${check.detail}`),
  ];

  return {
    ready: blockers.length === 0,
    checks,
    blockers,
    counts: {
      proofRows: proofRows.length,
      passedProofRows: proofRows.filter((proof) => proof.status === "passed").length,
      pilotChaptersRequiringProof: pilotChapterProof.requiredChapterIds.length,
      pilotChaptersWithMemberProof: pilotChapterProof.memberReadyChapterIds.length,
      pilotChaptersWithLeaderProof: pilotChapterProof.leaderReadyChapterIds.length,
      pilotChaptersWithMemberAndLeaderProof:
        pilotChapterProof.fullyReadyChapterIds.length,
    },
  };
}

export function formatProductionSignedInRouteProofReadiness(
  readiness: ProductionSignedInRouteProofReadiness,
): string {
  const passedCount = readiness.checks.filter((check) => check.passed).length;

  return [
    readiness.ready
      ? "Production signed-in route proof: READY"
      : "Production signed-in route proof: NOT READY",
    "",
    `${passedCount}/${readiness.checks.length} required workspace proofs passed`,
    `Proof rows: ${readiness.counts.proofRows}`,
    `Passed proof rows: ${readiness.counts.passedProofRows}`,
    `Pilot chapters with member and leader proof: ${readiness.counts.pilotChaptersWithMemberAndLeaderProof}/${readiness.counts.pilotChaptersRequiringProof}`,
    "",
    "Checks:",
    ...readiness.checks.map(
      (check) =>
        `- ${check.passed ? "PASS" : "FAIL"} ${check.label}: ${check.detail}`,
    ),
    "",
    "Blockers:",
    ...formatList(readiness.blockers, "None"),
  ].join("\n");
}

function createRequiredRouteProofCheck(
  packet: ProductionRolloutBootstrapPacket,
  proofRows: ProductionBootstrapSignedInRouteProof[],
  required: RequiredRouteProof,
): ProductionSignedInRouteProofCheck {
  const matchingProof = proofRows.find(
    (proof) =>
      proof.workspace === required.key &&
      proof.status === "passed" &&
      proof.expectedPath === required.expectedPath &&
      proof.observedPath === required.expectedPath &&
      required.hasRequiredRole(proof.email, packet),
  );

  if (!matchingProof) {
    return {
      key: required.key,
      label: required.label,
      passed: false,
      detail: `needs one passed proof row for ${required.roleDetail} at ${required.expectedPath}`,
    };
  }

  return {
    key: required.key,
    label: required.label,
    passed: true,
    detail: `${matchingProof.email} reached ${matchingProof.observedPath}`,
  };
}

function getPilotChapterRouteProof(
  packet: ProductionRolloutBootstrapPacket,
  proofRows: ProductionBootstrapSignedInRouteProof[],
) {
  const requiredChapterIds = Array.from(
    new Set(
      (packet.pilotEventProof ?? [])
        .filter((proof) => (proof.status ?? "ready") === "ready")
        .map((proof) => proof.chapterId),
    ),
  );
  const memberReadyChapterIds = requiredChapterIds.filter((chapterId) =>
    hasPassedChapterRoleProof({
      packet,
      proofRows,
      chapterId,
      workspace: "student_app",
      expectedPath: "/app",
      roleKeys: directMemberRoles,
    }),
  );
  const leaderReadyChapterIds = requiredChapterIds.filter((chapterId) =>
    hasPassedChapterRoleProof({
      packet,
      proofRows,
      chapterId,
      workspace: "leader_command_center",
      expectedPath: "/leader?view=overview",
      roleKeys: leaderRoles,
    }),
  );
  const memberReadySet = new Set(memberReadyChapterIds);
  const leaderReadySet = new Set(leaderReadyChapterIds);
  const fullyReadyChapterIds = requiredChapterIds.filter(
    (chapterId) => memberReadySet.has(chapterId) && leaderReadySet.has(chapterId),
  );
  const blockers = requiredChapterIds.flatMap((chapterId) => {
    const chapter = packet.chapters.find((candidate) => candidate.id === chapterId);
    const label = chapter?.name ?? chapterId;
    const missing: string[] = [];

    if (!memberReadySet.has(chapterId)) {
      missing.push(
        `${label} needs a passed signed-in member route proof for /app before this pilot chapter can support broad invites.`,
      );
    }

    if (!leaderReadySet.has(chapterId)) {
      missing.push(
        `${label} needs a passed signed-in leader route proof for /leader?view=overview before this pilot chapter can support broad invites.`,
      );
    }

    return missing;
  });

  return {
    requiredChapterIds,
    memberReadyChapterIds,
    leaderReadyChapterIds,
    fullyReadyChapterIds,
    blockers,
  };
}

function getLaunchOwnerRouteProofBlockers(
  packet: ProductionRolloutBootstrapPacket,
  proofRows: ProductionBootstrapSignedInRouteProof[],
) {
  const activeOwners = (packet.launchOwners ?? []).filter(
    (owner) => (owner.status ?? "active") === "active",
  );

  return launchOwnerRouteProofRequirements.flatMap((required) =>
    activeOwners
      .filter((owner) => owner.ownerType === required.ownerType)
      .filter(
        (owner) =>
          !hasPassedLaunchOwnerRouteProof({
            owner,
            proofRows,
            workspace: required.workspace,
            expectedPath: required.expectedPath,
          }),
      )
      .map(
        (owner) =>
          `Launch owner ${owner.email} (${owner.ownerType}) needs passed signed-in proof for ${required.expectedPath}.`,
      ),
  );
}

function hasPassedLaunchOwnerRouteProof(input: {
  owner: ProductionBootstrapLaunchOwner;
  proofRows: ProductionBootstrapSignedInRouteProof[];
  workspace: ProductionBootstrapSignedInRouteProof["workspace"];
  expectedPath: string;
}) {
  const ownerEmail = normalizeEmail(input.owner.email);

  return input.proofRows.some(
    (proof) =>
      normalizeEmail(proof.email) === ownerEmail &&
      proof.workspace === input.workspace &&
      proof.status === "passed" &&
      proof.expectedPath === input.expectedPath &&
      proof.observedPath === input.expectedPath &&
      isValidCheckedAt(proof.checkedAt),
  );
}

function hasPassedChapterRoleProof(input: {
  packet: ProductionRolloutBootstrapPacket;
  proofRows: ProductionBootstrapSignedInRouteProof[];
  chapterId: string;
  workspace: ProductionBootstrapSignedInRouteProof["workspace"];
  expectedPath: string;
  roleKeys: readonly ProductionBootstrapMembership["roleKey"][];
}) {
  return input.proofRows.some(
    (proof) =>
      proof.workspace === input.workspace &&
      proof.status === "passed" &&
      proof.expectedPath === input.expectedPath &&
      proof.observedPath === input.expectedPath &&
      isValidCheckedAt(proof.checkedAt) &&
      hasApprovedMembershipRoleInChapter(
        proof.email,
        input.packet,
        input.roleKeys,
        input.chapterId,
      ),
  );
}

function getRouteProofRowBlockers(
  packet: ProductionRolloutBootstrapPacket,
  proofRows: ProductionBootstrapSignedInRouteProof[],
): string[] {
  const blockers: string[] = [];
  const userEmails = new Set(packet.users.map((user) => normalizeEmail(user.email)));

  for (const proof of proofRows) {
    const required = requiredRouteProofs.find(
      (routeProof) => routeProof.key === proof.workspace,
    );
    const proofLabel = `${proof.email} ${proof.workspace}`;

    if (!userEmails.has(normalizeEmail(proof.email))) {
      blockers.push(`${proofLabel} references an unknown user.`);
    }

    if (!required) {
      blockers.push(`${proofLabel} uses an unsupported workspace.`);
      continue;
    }

    if (proof.expectedPath !== required.expectedPath) {
      blockers.push(
        `${proofLabel} expectedPath must be ${required.expectedPath}.`,
      );
    }

    if (proof.status === "passed" && proof.observedPath !== required.expectedPath) {
      blockers.push(
        `${proofLabel} observedPath must be ${required.expectedPath} when status is passed.`,
      );
    }

    if (proof.status === "passed" && !isValidCheckedAt(proof.checkedAt)) {
      blockers.push(
        `${proofLabel} needs a checkedAt timestamp when status is passed.`,
      );
    }

    if (proof.status === "passed" && !required.hasRequiredRole(proof.email, packet)) {
      blockers.push(`${proofLabel} needs ${required.roleDetail}.`);
    }
  }

  return blockers;
}

function hasApprovedDirectMemberRole(
  email: string,
  packet: ProductionRolloutBootstrapPacket,
) {
  return hasApprovedMembershipRole(email, packet, directMemberRoles);
}

function hasApprovedLeaderRole(
  email: string,
  packet: ProductionRolloutBootstrapPacket,
) {
  return hasApprovedMembershipRole(email, packet, leaderRoles);
}

function hasApprovedMembershipRole(
  email: string,
  packet: ProductionRolloutBootstrapPacket,
  roleKeys: readonly ProductionBootstrapMembership["roleKey"][],
) {
  return hasApprovedMembershipRoleInChapter(email, packet, roleKeys);
}

function hasApprovedMembershipRoleInChapter(
  email: string,
  packet: ProductionRolloutBootstrapPacket,
  roleKeys: readonly ProductionBootstrapMembership["roleKey"][],
  chapterId?: string,
) {
  const normalizedEmail = normalizeEmail(email);

  return packet.memberships.some(
    (membership) =>
      normalizeEmail(membership.email) === normalizedEmail &&
      (membership.status ?? "approved") === "approved" &&
      roleKeys.includes(membership.roleKey) &&
      (!chapterId || membership.chapterId === chapterId),
  );
}

function hasActiveStaffWorkspaceRole(
  email: string,
  packet: ProductionRolloutBootstrapPacket,
) {
  return hasActiveStaffRole(email, packet, staffWorkspaceRoles);
}

function hasActiveAdminRole(
  email: string,
  packet: ProductionRolloutBootstrapPacket,
) {
  return hasActiveStaffRole(email, packet, adminRoles);
}

function hasActiveStaffRole(
  email: string,
  packet: ProductionRolloutBootstrapPacket,
  roleKeys: readonly ProductionBootstrapStaffRole["roleKey"][],
) {
  const normalizedEmail = normalizeEmail(email);

  return packet.staffRoles.some(
    (role) =>
      normalizeEmail(role.email) === normalizedEmail &&
      (role.status ?? "active") === "active" &&
      roleKeys.includes(role.roleKey),
  );
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
